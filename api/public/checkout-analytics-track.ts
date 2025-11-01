import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

/**
 * PUBLIC endpoint for tracking courier displays and selections in Shopify checkout
 * Called by Shopify checkout UI extension (no auth required)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false, // Public endpoint - no JWT required
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }

  try {
    const {
      merchantId,
      courierId,
      checkoutSessionId,
      positionShown,
      totalCouriersShown,
      wasSelected,
      trustScoreAtTime,
      priceAtTime,
      deliveryTimeEstimate,
      distanceKm,
      orderValue,
      itemsCount,
      packageWeightKg,
      deliveryPostalCode,
      deliveryCity,
      deliveryCountry
    } = req.body;

    // Validate required fields
    if (!merchantId || !courierId || !checkoutSessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['merchantId', 'courierId', 'checkoutSessionId']
      });
    }

    // Verify merchant exists
    const merchantCheck = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND user_role = $2',
      [merchantId, 'merchant']
    );

    if (merchantCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Merchant not found'
      });
    }

    // Verify courier exists
    const courierCheck = await pool.query(
      'SELECT courier_id FROM couriers WHERE courier_id = $1',
      [courierId]
    );

    if (courierCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Courier not found'
      });
    }

    // Insert or update checkout analytics
    const query = `
      INSERT INTO checkout_courier_analytics (
        merchant_id,
        courier_id,
        checkout_session_id,
        position_shown,
        total_couriers_shown,
        was_selected,
        trust_score_at_time,
        price_at_time,
        delivery_time_estimate_hours,
        distance_km,
        order_value,
        items_count,
        package_weight_kg,
        delivery_postal_code,
        delivery_city,
        delivery_country,
        event_timestamp
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
      )
      ON CONFLICT (checkout_session_id, courier_id) 
      DO UPDATE SET
        was_selected = EXCLUDED.was_selected,
        event_timestamp = NOW()
      RETURNING analytics_id;
    `;

    const result = await pool.query(query, [
      merchantId,
      courierId,
      checkoutSessionId,
      positionShown || null,
      totalCouriersShown || null,
      wasSelected || false,
      trustScoreAtTime || null,
      priceAtTime || null,
      deliveryTimeEstimate || null,
      distanceKm || null,
      orderValue || null,
      itemsCount || null,
      packageWeightKg || null,
      deliveryPostalCode || null,
      deliveryCity || null,
      deliveryCountry || null
    ]);

    return res.status(200).json({
      success: true,
      message: wasSelected ? 'Courier selection tracked' : 'Courier display tracked',
      analytics_id: result.rows[0].analytics_id
    });

  } catch (error: any) {
    console.error('Error tracking checkout analytics:', error);
    
    // Don't expose internal errors to public endpoint
    return res.status(500).json({
      success: false,
      error: 'Failed to track analytics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
