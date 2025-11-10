import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Compare Courier Prices API
 * Compare prices across multiple couriers for the same shipment
 * 
 * POST /api/couriers/compare-prices
 * 
 * Body:
 * {
 *   "merchant_id": "uuid",
 *   "courier_ids": ["uuid1", "uuid2", "uuid3"], // Optional, if not provided, uses all active merchant couriers
 *   "service_type": "express" | "standard" | "economy",
 *   "actual_weight": 5.0,
 *   "length_cm": 40,
 *   "width_cm": 30,
 *   "height_cm": 20,
 *   "distance": 100,
 *   "from_postal": "0150",
 *   "to_postal": "5003",
 *   "sort_by": "price" | "trust_score" | "ranking" // Optional, default: "price"
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
      merchant_id,
      courier_ids,
      service_type,
      actual_weight,
      length_cm,
      width_cm,
      height_cm,
      distance,
      from_postal,
      to_postal,
      sort_by = 'price'
    } = req.body;

    // Validate required fields
    if (!merchant_id || !service_type || !actual_weight) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['merchant_id', 'service_type', 'actual_weight']
      });
    }

    // Get courier IDs to compare
    let courierIdsToCompare = courier_ids;

    // If no courier IDs provided, get all active merchant couriers
    if (!courierIdsToCompare || courierIdsToCompare.length === 0) {
      const { data: merchantCouriers, error: merchantCouriersError } = await supabase
        .from('merchant_couriers')
        .select('courier_id')
        .eq('merchant_id', merchant_id)
        .eq('is_active', true);

      if (merchantCouriersError) {
        console.error('Error fetching merchant couriers:', merchantCouriersError);
        return res.status(500).json({
          error: 'Failed to fetch merchant couriers',
          message: merchantCouriersError.message
        });
      }

      if (!merchantCouriers || merchantCouriers.length === 0) {
        return res.status(404).json({
          error: 'No active couriers found',
          message: 'Merchant has no active couriers configured'
        });
      }

      courierIdsToCompare = merchantCouriers.map(mc => mc.courier_id);
    }

    // Get courier details
    const { data: couriers, error: couriersError } = await supabase
      .from('couriers')
      .select('courier_id, courier_name, logo_url')
      .in('courier_id', courierIdsToCompare);

    if (couriersError) {
      console.error('Error fetching couriers:', couriersError);
      return res.status(500).json({
        error: 'Failed to fetch courier details',
        message: couriersError.message
      });
    }

    // Calculate prices for each courier
    const priceComparisons = await Promise.all(
      courierIdsToCompare.map(async (courierId) => {
        try {
          const courier = couriers?.find(c => c.courier_id === courierId);
          
          if (!courier) {
            return null;
          }

          // Get base price
          const { data: basePrice, error: basePriceError } = await supabase
            .rpc('calculate_courier_base_price', {
              p_courier_id: courierId,
              p_service_type: service_type,
              p_actual_weight: actual_weight,
              p_length_cm: length_cm || null,
              p_width_cm: width_cm || null,
              p_height_cm: height_cm || null,
              p_distance: distance || 0,
              p_from_postal: from_postal || null,
              p_to_postal: to_postal || null
            });

          if (basePriceError || !basePrice || basePrice.length === 0) {
            return null;
          }

          const base = basePrice[0];
          const basePriceAmount = parseFloat(base.total_base_price || 0);

          // Get final price with merchant markup
          const { data: finalPrice } = await supabase
            .rpc('calculate_final_price', {
              p_merchant_id: merchant_id,
              p_courier_id: courierId,
              p_service_type: service_type,
              p_base_price: basePriceAmount
            });

          let finalPriceAmount = basePriceAmount;
          let roundedPrice = basePriceAmount;
          let marginAmount = 0;

          if (finalPrice && finalPrice.length > 0) {
            finalPriceAmount = parseFloat(finalPrice[0].final_price || basePriceAmount);
            roundedPrice = parseFloat(finalPrice[0].rounded_price || basePriceAmount);
            marginAmount = parseFloat(finalPrice[0].margin_amount || 0);
          }

          // Get courier ranking score if available
          const { data: rankingData } = await supabase
            .from('courier_ranking_scores')
            .select('final_ranking_score')
            .eq('courier_id', courierId)
            .eq('postal_area', to_postal?.substring(0, 2) || '')
            .single();

          // Get TrustScore
          const { data: trustScoreData } = await supabase
            .from('courier_trust_scores')
            .select('trust_score')
            .eq('courier_id', courierId)
            .single();

          return {
            courier_id: courier.courier_id,
            courier_name: courier.courier_name,
            logo_url: courier.logo_url,
            service_type: service_type,
            base_price: basePriceAmount,
            merchant_markup: marginAmount,
            final_price: finalPriceAmount,
            rounded_price: roundedPrice,
            currency: base.currency,
            chargeable_weight: parseFloat(base.chargeable_weight || 0),
            trust_score: trustScoreData?.trust_score || null,
            ranking_score: rankingData?.final_ranking_score || null,
            surcharges: base.surcharges || [],
            total_surcharges: parseFloat(base.total_surcharges || 0),
            calculation_breakdown: base.calculation_breakdown
          };
        } catch (error) {
          console.error(`Error calculating price for courier ${courierId}:`, error);
          return null;
        }
      })
    );

    // Filter out null results
    const validComparisons = priceComparisons.filter(c => c !== null);

    if (validComparisons.length === 0) {
      return res.status(404).json({
        error: 'No pricing data available',
        message: 'Could not calculate prices for any courier'
      });
    }

    // Sort results
    let sortedComparisons = [...validComparisons];
    
    switch (sort_by) {
      case 'trust_score':
        sortedComparisons.sort((a, b) => (b.trust_score || 0) - (a.trust_score || 0));
        break;
      case 'ranking':
        sortedComparisons.sort((a, b) => (b.ranking_score || 0) - (a.ranking_score || 0));
        break;
      case 'price':
      default:
        sortedComparisons.sort((a, b) => a.rounded_price - b.rounded_price);
        break;
    }

    // Mark recommended courier (best overall value)
    if (sortedComparisons.length > 0) {
      // Calculate score: 40% price, 30% trust, 30% ranking
      const scoredCouriers = sortedComparisons.map(c => {
        const priceScore = 1 - (c.rounded_price / Math.max(...sortedComparisons.map(sc => sc.rounded_price)));
        const trustScore = (c.trust_score || 0) / 100;
        const rankingScore = (c.ranking_score || 0) / 10;
        const overallScore = (priceScore * 0.4) + (trustScore * 0.3) + (rankingScore * 0.3);
        
        return { ...c, overall_score: overallScore };
      });

      const bestCourier = scoredCouriers.reduce((best, current) => 
        current.overall_score > best.overall_score ? current : best
      );

      sortedComparisons = sortedComparisons.map(c => ({
        ...c,
        recommended: c.courier_id === bestCourier.courier_id
      }));
    }

    // Format response
    const response = {
      shipment_details: {
        service_type,
        actual_weight,
        distance: distance || 0,
        from_postal: from_postal || null,
        to_postal: to_postal || null,
        dimensions_provided: !!(length_cm && width_cm && height_cm)
      },
      comparison: {
        total_couriers: sortedComparisons.length,
        sorted_by: sort_by,
        cheapest: sortedComparisons[0],
        most_expensive: sortedComparisons[sortedComparisons.length - 1],
        price_range: {
          min: sortedComparisons[0].rounded_price,
          max: sortedComparisons[sortedComparisons.length - 1].rounded_price,
          difference: sortedComparisons[sortedComparisons.length - 1].rounded_price - sortedComparisons[0].rounded_price,
          currency: sortedComparisons[0].currency
        }
      },
      couriers: sortedComparisons
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in compare-prices:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
