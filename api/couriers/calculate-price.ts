import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Calculate Final Price API
 * Calculate courier base price + merchant markup = final customer price
 * 
 * POST /api/couriers/calculate-price
 * 
 * Body:
 * {
 *   "merchant_id": "uuid",
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
      merchant_id,
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
    if (!merchant_id || !courier_id || !service_type || !actual_weight) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['merchant_id', 'courier_id', 'service_type', 'actual_weight']
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

    // Step 1: Get courier base price
    const { data: basePrice, error: basePriceError } = await supabase
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

    if (basePriceError) {
      console.error('Base price calculation error:', basePriceError);
      return res.status(500).json({
        error: 'Failed to calculate base price',
        message: basePriceError.message
      });
    }

    if (!basePrice || basePrice.length === 0) {
      return res.status(404).json({
        error: 'No pricing data found',
        message: 'No active pricing for this courier and service type'
      });
    }

    const base = basePrice[0];
    const basePriceAmount = parseFloat(base.total_base_price || 0);

    // Step 2: Apply merchant markup using calculate_final_price function
    const { data: finalPrice, error: finalPriceError } = await supabase
      .rpc('calculate_final_price', {
        p_merchant_id: merchant_id,
        p_courier_id: courier_id,
        p_service_type: service_type,
        p_base_price: basePriceAmount
      });

    if (finalPriceError) {
      console.error('Final price calculation error:', finalPriceError);
      return res.status(500).json({
        error: 'Failed to calculate final price',
        message: finalPriceError.message
      });
    }

    // If no merchant markup settings, use base price as final
    let merchantMargin = {
      margin_type: 'none',
      margin_value: 0,
      margin_amount: 0,
      final_price: basePriceAmount,
      rounded_price: basePriceAmount
    };

    if (finalPrice && finalPrice.length > 0) {
      const final = finalPrice[0];
      merchantMargin = {
        margin_type: final.margin_type,
        margin_value: parseFloat(final.margin_value || 0),
        margin_amount: parseFloat(final.margin_amount || 0),
        final_price: parseFloat(final.final_price || basePriceAmount),
        rounded_price: parseFloat(final.rounded_price || basePriceAmount)
      };
    }

    // Format response
    const response = {
      courier: {
        courier_id: courier.courier_id,
        courier_name: courier.courier_name,
        logo_url: courier.logo_url
      },
      service_type: base.service_type,
      base_pricing: {
        base_price: parseFloat(base.base_price || 0),
        weight_cost: parseFloat(base.weight_cost || 0),
        distance_cost: parseFloat(base.distance_cost || 0),
        zone_multiplier: parseFloat(base.zone_multiplier || 1),
        surcharges: base.surcharges || [],
        total_surcharges: parseFloat(base.total_surcharges || 0),
        subtotal: parseFloat(base.subtotal || 0),
        total_base_price: basePriceAmount,
        currency: base.currency
      },
      merchant_markup: {
        margin_type: merchantMargin.margin_type,
        margin_value: merchantMargin.margin_value,
        margin_amount: merchantMargin.margin_amount,
        has_markup: merchantMargin.margin_type !== 'none'
      },
      final_pricing: {
        before_markup: basePriceAmount,
        markup_amount: merchantMargin.margin_amount,
        after_markup: merchantMargin.final_price,
        rounded_price: merchantMargin.rounded_price,
        currency: base.currency
      },
      weight_details: {
        actual_weight: parseFloat(base.actual_weight || 0),
        volumetric_weight: parseFloat(base.volumetric_weight || 0),
        chargeable_weight: parseFloat(base.chargeable_weight || 0)
      },
      shipment_details: {
        distance: distance || 0,
        from_postal: from_postal || null,
        to_postal: to_postal || null
      },
      calculation_breakdown: {
        base_calculation: base.calculation_breakdown,
        merchant_markup: merchantMargin
      }
    };

    return res.status(200).json(response);

  } catch (error: any) {
    console.error('Error in calculate-price:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
