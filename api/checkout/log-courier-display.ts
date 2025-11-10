import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Log Courier Display in Checkout API
 * Tracks when a courier is displayed to a customer in checkout
 * 
 * POST /api/checkout/log-courier-display
 * 
 * Body:
 * {
 *   "checkout_session_id": "checkout_1699612345_abc123",
 *   "merchant_id": "uuid",
 *   "couriers": [
 *     {
 *       "courier_id": "uuid",
 *       "position_shown": 1,
 *       "trust_score": 4.5,
 *       "price": 89.00,
 *       "delivery_time_hours": 24,
 *       "distance_km": 50.5
 *     }
 *   ],
 *   "order_context": {
 *     "order_value": 1250.00,
 *     "items_count": 3,
 *     "package_weight_kg": 5.0
 *   },
 *   "delivery_location": {
 *     "postal_code": "0150",
 *     "city": "Oslo",
 *     "country": "NO"
 *   }
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
      checkout_session_id,
      merchant_id,
      couriers,
      order_context,
      delivery_location
    } = req.body;

    // Validate required fields
    if (!checkout_session_id || !merchant_id || !couriers || !Array.isArray(couriers)) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['checkout_session_id', 'merchant_id', 'couriers (array)']
      });
    }

    if (couriers.length === 0) {
      return res.status(400).json({
        error: 'At least one courier must be provided'
      });
    }

    // Validate session ID format
    if (!checkout_session_id.startsWith('checkout_')) {
      return res.status(400).json({
        error: 'Invalid checkout_session_id format',
        expected: 'checkout_timestamp_random'
      });
    }

    // Prepare analytics records
    const analyticsRecords = couriers.map((courier, index) => ({
      merchant_id,
      courier_id: courier.courier_id,
      checkout_session_id,
      position_shown: courier.position_shown || index + 1,
      total_couriers_shown: couriers.length,
      was_selected: false, // Will be updated when selection is logged
      trust_score_at_time: courier.trust_score || null,
      price_at_time: courier.price || null,
      delivery_time_estimate_hours: courier.delivery_time_hours || null,
      distance_km: courier.distance_km || null,
      order_value: order_context?.order_value || null,
      items_count: order_context?.items_count || null,
      package_weight_kg: order_context?.package_weight_kg || null,
      delivery_postal_code: delivery_location?.postal_code || null,
      delivery_city: delivery_location?.city || null,
      delivery_country: delivery_location?.country || null
    }));

    // Insert analytics records
    const { data, error } = await supabase
      .from('checkout_courier_analytics')
      .insert(analyticsRecords)
      .select();

    if (error) {
      console.error('Error inserting checkout analytics:', error);
      
      // Check for duplicate session
      if (error.code === '23505') {
        return res.status(409).json({
          error: 'Checkout session already logged',
          message: 'This checkout session has already been recorded',
          checkout_session_id
        });
      }

      return res.status(500).json({
        error: 'Failed to log courier displays',
        message: error.message
      });
    }

    // Return success
    return res.status(201).json({
      success: true,
      message: 'Courier displays logged successfully',
      checkout_session_id,
      couriers_logged: data?.length || 0,
      analytics_ids: data?.map(record => record.analytics_id) || []
    });

  } catch (error: any) {
    console.error('Error in log-courier-display:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
