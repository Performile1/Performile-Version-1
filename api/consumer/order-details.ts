import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

/**
 * Get Single Order Details
 * GET /api/consumer/order-details?orderId=xxx
 * 
 * SECURITY: Only returns order if consumer_id = authenticated user
 * 
 * Returns complete order details including:
 * - Order information
 * - Merchant details
 * - Courier details
 * - Tracking events
 * - Payment information
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = (req as any).user;
  const { orderId } = req.query;

  // CRITICAL: Validate user is a consumer
  if (user.user_role !== 'consumer') {
    return res.status(403).json({ 
      error: 'Access denied. Consumer role required.' 
    });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  try {
    // Get order details
    // CRITICAL: WHERE clause ensures consumer_id = authenticated user
    const orderQuery = await pool.query(
      `SELECT 
        o.*,
        
        -- Merchant info
        m.business_name as merchant_name,
        m.contact_email as merchant_email,
        m.contact_phone as merchant_phone,
        
        -- Courier info
        u.full_name as courier_name,
        u.email as courier_email,
        u.phone_number as courier_phone
        
       FROM orders o
       LEFT JOIN merchantshops m ON o.merchant_id = m.shop_id
       LEFT JOIN users u ON o.courier_id = u.user_id
       WHERE o.order_id = $1 
         AND o.consumer_id = $2`,
      [orderId, user.user_id]
    );

    if (orderQuery.rows.length === 0) {
      // Log potential security breach attempt
      console.warn(`[Security] User ${user.user_id} attempted to access order ${orderId} they don't own`);
      
      return res.status(404).json({ 
        error: 'Order not found or access denied' 
      });
    }

    const order = orderQuery.rows[0];

    // Get tracking events
    const trackingQuery = await pool.query(
      `SELECT 
        event_id,
        status,
        location,
        description,
        created_at
       FROM tracking_events
       WHERE order_id = $1
       ORDER BY created_at DESC`,
      [orderId]
    );

    // Get payment information (if exists)
    let paymentInfo = null;
    
    // Check Vipps payments
    const vippsQuery = await pool.query(
      `SELECT 
        payment_id,
        amount,
        status,
        created_at
       FROM vipps_payments
       WHERE order_id = $1 AND user_id = $2`,
      [orderId, user.user_id]
    );

    if (vippsQuery.rows.length > 0) {
      paymentInfo = {
        provider: 'vipps',
        ...vippsQuery.rows[0],
      };
    }

    // Check Swish payments
    if (!paymentInfo) {
      const swishQuery = await pool.query(
        `SELECT 
          payment_id,
          amount,
          status,
          created_at
         FROM swish_payments
         WHERE order_id = $1 AND user_id = $2`,
        [orderId, user.user_id]
      );

      if (swishQuery.rows.length > 0) {
        paymentInfo = {
          provider: 'swish',
          ...swishQuery.rows[0],
        };
      }
    }

    // Check Stripe C2C payments
    if (!paymentInfo) {
      const stripeQuery = await pool.query(
        `SELECT 
          payment_id,
          amount,
          status,
          created_at
         FROM stripe_c2c_payments
         WHERE order_id = $1 AND user_id = $2`,
        [orderId, user.user_id]
      );

      if (stripeQuery.rows.length > 0) {
        paymentInfo = {
          provider: 'stripe',
          ...stripeQuery.rows[0],
        };
      }
    }

    // Log access for audit
    console.log(`[Consumer Order Details] User ${user.user_id} accessed order ${orderId}`);

    return res.status(200).json({
      order,
      trackingEvents: trackingQuery.rows,
      payment: paymentInfo,
    });

  } catch (error: any) {
    console.error('[Consumer Order Details] Error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch order details',
      message: error.message,
    });
  }
}
