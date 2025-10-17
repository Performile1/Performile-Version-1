import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

// Inline JWT helper
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

const pool = getPool();

// Verify user token
const verifyUser = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  return decoded;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyUser(req);
    
    const { courier_id } = req.query;

    if (!courier_id) {
      return res.status(400).json({
        success: false,
        message: 'courier_id is required'
      });
    }

    const client = await pool.connect();
    try {
      // Get courier analytics
      const result = await client.query(`
        SELECT 
          courier_id,
          courier_name,
          total_orders,
          delivered_orders,
          in_transit_orders,
          pending_orders,
          cancelled_orders,
          completion_rate,
          on_time_rate,
          total_reviews,
          avg_rating,
          trust_score,
          avg_delivery_days,
          customer_count,
          last_order_date,
          last_review_date,
          last_calculated
        FROM courier_analytics
        WHERE courier_id = $1
      `, [courier_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Courier analytics not found'
        });
      }

      const analytics = result.rows[0];

      // Get recent orders trend (from orders table)
      const trendResult = await client.query(`
        SELECT 
          DATE(created_at) as order_date,
          COUNT(*) as order_count,
          COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_count
        FROM orders
        WHERE courier_id = $1
          AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY order_date ASC
      `, [courier_id]);

      // Get order status breakdown
      const statusBreakdown = {
        delivered: analytics.delivered_orders || 0,
        in_transit: analytics.in_transit_orders || 0,
        pending: analytics.pending_orders || 0,
        cancelled: analytics.cancelled_orders || 0
      };

      // Calculate performance metrics
      const performanceMetrics = {
        completion_rate: analytics.completion_rate || 0,
        on_time_rate: analytics.on_time_rate || 0,
        avg_rating: analytics.avg_rating || 0,
        trust_score: analytics.trust_score || 0,
        avg_delivery_days: analytics.avg_delivery_days || 0
      };

      return res.status(200).json({
        success: true,
        data: {
          summary: analytics,
          trends: trendResult.rows,
          statusBreakdown,
          performanceMetrics
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Courier analytics API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
