import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get Courier Base Price API
 * Calculate courier's base price for a shipment
 * 
 * POST /api/couriers/get-base-price
 * 
 * Body:
 * {
 *   "courier_id": "uuid",
 *   "service_type": "express" | "standard" | "economy",
 *   "actual_weight": 5.0,
 *   "length_cm": 40,
 *   "width_cm": 30,
 *   "height_cm": 20,
 *   "distance": 100,
 *   "from_postal": "0150",
 *   "to_postal": "5003"
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
      courier_id,
      service_type,
      actual_weight,
      length_cm,
      width_cm,
      height_cm,
      distance,
      from_postal,
      to_postal
    } = req.body;

    // Validate required fields
    if (!courier_id || !service_type || !actual_weight) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['courier_id', 'service_type', 'actual_weight']
      });
    }

    // Validate service type
    const validServiceTypes = ['express', 'standard', 'economy', 'same_day', 'scheduled', 'overnight'];
    if (!validServiceTypes.includes(service_type)) {
      return res.status(400).json({
        error: 'Invalid service type',
        valid_types: validServiceTypes
      });
    }

    // Validate weight
    if (actual_weight <= 0) {
      return res.status(400).json({
        error: 'Invalid weight',
        message: 'Weight must be greater than 0'
      });
    }

    // Get courier details
    const { data: courier, error: courierError } = await supabase
      .from('couriers')
      .select('courier_id, courier_name, logo_url')
      .eq('courier_id', courier_id)
      .single();

    if (courierError || !courier) {
      return res.status(404).json({
        error: 'Courier not found',
        courier_id
      });
    }

    // Call the pricing function
    const { data: priceData, error: priceError } = await supabase
      .rpc('calculate_courier_base_price', {
        p_courier_id: courier_id,
        p_service_type: service_type,
        p_actual_weight: actual_weight,
        p_length_cm: length_cm || null,
        p_width_cm: width_cm || null,
        p_height_cm: height_cm || null,
        p_distance: distance || 0,
        p_from_postal: from_postal || null,
        p_to_postal: to_postal || null
      });

    if (priceError) {
      console.error('Price calculation error:', priceError);
      return res.status(500).json({
        error: 'Failed to calculate price',
        message: priceError.message
      });
    }

    if (!priceData || priceData.length === 0) {
      return res.status(404).json({
        error: 'No pricing data found',
        message: 'No active pricing for this courier and service type'
      });
    }

    const price = priceData[0];

    // Format response
    const response = {
      courier: {
        courier_id: courier.courier_id,
        courier_name: courier.courier_name,
        logo_url: courier.logo_url
      },
      service_type: price.service_type,
      pricing: {
        base_price: parseFloat(price.base_price || 0),
        weight_cost: parseFloat(price.weight_cost || 0),
        distance_cost: parseFloat(price.distance_cost || 0),
        zone_multiplier: parseFloat(price.zone_multiplier || 1),
        subtotal: parseFloat(price.subtotal || 0),
        surcharges: price.surcharges || [],
        total_surcharges: parseFloat(price.total_surcharges || 0),
        total_base_price: parseFloat(price.total_base_price || 0),
        currency: price.currency
      },
      weight_details: {
        actual_weight: parseFloat(price.actual_weight || 0),
        volumetric_weight: parseFloat(price.volumetric_weight || 0),
        chargeable_weight: parseFloat(price.chargeable_weight || 0),
        dimensions_provided: !!(length_cm && width_cm && height_cm)
      },
      shipment_details: {
        distance: distance || 0,
        from_postal: from_postal || null,
        to_postal: to_postal || null
      },
      calculation_breakdown: price.calculation_breakdown
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in get-base-price:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
