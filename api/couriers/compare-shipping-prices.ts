import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Compare Shipping Prices API
 * Get prices from ALL active couriers for comparison
 * 
 * POST /api/couriers/compare-shipping-prices
 * 
 * Body:
 * {
 *   "service_level": "standard" | "express" | "same_day",
 *   "weight": 5.0,          // kg
 *   "distance": 100,        // km
 *   "from_postal": "0150",
 *   "to_postal": "5003",
 *   "surcharges": ["fuel", "insurance"], // optional
 *   "merchant_id": "uuid"   // optional - filter to merchant's selected couriers
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      service_level,
      weight,
      distance,
      from_postal,
      to_postal,
      surcharges,
      merchant_id
    } = req.body;

    // Validate required fields
    if (!service_level || !['standard', 'express', 'same_day'].includes(service_level)) {
      return res.status(400).json({
        error: 'Invalid service_level. Must be: standard, express, or same_day'
      });
    }

    if (!weight || weight <= 0) {
      return res.status(400).json({
        error: 'Weight must be greater than 0'
      });
    }

    if (distance === undefined || distance < 0) {
      return res.status(400).json({
        error: 'Distance must be 0 or greater'
      });
    }

    if (!from_postal || !to_postal) {
      return res.status(400).json({
        error: 'Missing required fields: from_postal, to_postal'
      });
    }

    // Get active couriers (optionally filtered by merchant)
    let courierQuery = supabase
      .from('couriers')
      .select('courier_id, courier_name, logo_url, trust_score')
      .eq('is_active', true);

    // If merchant_id provided, filter to their selected couriers
    if (merchant_id) {
      const { data: selections } = await supabase
        .from('merchant_courier_selections')
        .select('courier_id')
        .eq('merchant_id', merchant_id)
        .eq('is_selected', true);

      if (selections && selections.length > 0) {
        const courierIds = selections.map(s => s.courier_id);
        courierQuery = courierQuery.in('courier_id', courierIds);
      }
    }

    const { data: couriers, error: courierError } = await courierQuery;

    if (courierError) {
      console.error('Error fetching couriers:', courierError);
      return res.status(500).json({
        error: 'Failed to fetch couriers',
        message: courierError.message
      });
    }

    if (!couriers || couriers.length === 0) {
      return res.status(404).json({
        error: 'No active couriers found'
      });
    }

    // Calculate price for each courier
    const pricePromises = couriers.map(async (courier) => {
      try {
        const { data, error } = await supabase.rpc('calculate_shipping_price', {
          p_courier_id: courier.courier_id,
          p_service_level: service_level,
          p_weight: weight,
          p_distance: distance,
          p_from_postal: from_postal,
          p_to_postal: to_postal,
          p_surcharges: surcharges || null
        });

        if (error || !data || data.error) {
          // Skip couriers with pricing errors
          return null;
        }

        return {
          courier_id: courier.courier_id,
          courier_name: courier.courier_name,
          logo_url: courier.logo_url,
          trust_score: courier.trust_score || 0,
          service_level: service_level,
          final_price: data.final_price,
          base_price: data.base_price,
          surcharge_total: data.surcharge_total,
          zone_name: data.zone_name,
          is_remote_area: data.is_remote_area,
          currency: data.currency,
          breakdown: data
        };
      } catch (err) {
        console.error(`Error calculating price for ${courier.courier_name}:`, err);
        return null;
      }
    });

    const results = await Promise.all(pricePromises);
    
    // Filter out null results (failed calculations)
    const validPrices = results.filter(r => r !== null);

    if (validPrices.length === 0) {
      return res.status(404).json({
        error: 'No pricing available for any courier'
      });
    }

    // Sort by final price (cheapest first)
    validPrices.sort((a, b) => a!.final_price - b!.final_price);

    // Add ranking
    const rankedPrices = validPrices.map((price, index) => ({
      ...price,
      rank: index + 1,
      is_cheapest: index === 0,
      price_difference_from_cheapest: index === 0 ? 0 : price!.final_price - validPrices[0]!.final_price
    }));

    return res.status(200).json({
      success: true,
      total_couriers: rankedPrices.length,
      service_level: service_level,
      shipment_details: {
        weight_kg: weight,
        distance_km: distance,
        from_postal: from_postal,
        to_postal: to_postal
      },
      prices: rankedPrices,
      cheapest: rankedPrices[0],
      most_expensive: rankedPrices[rankedPrices.length - 1],
      price_range: {
        min: rankedPrices[0]!.final_price,
        max: rankedPrices[rankedPrices.length - 1]!.final_price,
        difference: rankedPrices[rankedPrices.length - 1]!.final_price - rankedPrices[0]!.final_price
      },
      calculated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error: any) {
    console.error('Error in compare-shipping-prices:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
