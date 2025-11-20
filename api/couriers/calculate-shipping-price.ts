import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Calculate Shipping Price API
 * Uses the new calculate_shipping_price function with pricing tables
 * 
 * POST /api/couriers/calculate-shipping-price
 * 
 * Body:
 * {
 *   "courier_id": "uuid",
 *   "service_level": "standard" | "express" | "same_day",
 *   "weight": 5.0,          // kg
 *   "distance": 100,        // km
 *   "from_postal": "0150",
 *   "to_postal": "5003",
 *   "surcharges": ["fuel", "insurance"] // optional
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
      service_level,
      weight,
      distance,
      from_postal,
      to_postal,
      surcharges
    } = req.body;

    // Validate required fields
    if (!courier_id) {
      return res.status(400).json({
        error: 'Missing required field: courier_id'
      });
    }

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

    // Call the pricing function
    const { data, error } = await supabase.rpc('calculate_shipping_price', {
      p_courier_id: courier_id,
      p_service_level: service_level,
      p_weight: weight,
      p_distance: distance,
      p_from_postal: from_postal,
      p_to_postal: to_postal,
      p_surcharges: surcharges || null
    });

    if (error) {
      console.error('Pricing calculation error:', error);
      return res.status(500).json({
        error: 'Failed to calculate price',
        message: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'No pricing found for this courier/service'
      });
    }

    // Check if function returned an error
    if (data.error) {
      return res.status(400).json({
        error: data.message || 'Pricing calculation failed',
        details: data
      });
    }

    // Return successful pricing calculation
    return res.status(200).json({
      success: true,
      pricing: data,
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    });

  } catch (error: any) {
    console.error('Error in calculate-shipping-price:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
