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

// Verify admin token
const verifyAdmin = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;

  if (decoded.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return decoded;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    verifyAdmin(req);
    
    const { period = '30' } = req.query; // days
    const days = parseInt(period as string);

    const client = await pool.connect();
    try {
      // Get latest platform analytics
      const latestResult = await client.query(`
        SELECT 
          metric_date,
          total_couriers,
          active_couriers,
          total_orders,
          delivered_orders,
          in_transit_orders,
          pending_orders,
          total_reviews,
          avg_rating,
          avg_trust_score,
          avg_completion_rate,
          avg_on_time_rate,
          total_stores,
          active_stores
        FROM platform_analytics
        ORDER BY metric_date DESC
        LIMIT 1
      `);

      // Get trend data for the period
      const trendResult = await client.query(`
        SELECT 
          metric_date,
          total_orders,
          delivered_orders,
          avg_rating,
          avg_trust_score,
          active_couriers,
          active_stores
        FROM platform_analytics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY metric_date ASC
      `);

      // Get top performing couriers
      const topCouriersResult = await client.query(`
        SELECT 
          courier_id,
          courier_name,
          total_orders,
          delivered_orders,
          completion_rate,
          on_time_rate,
          avg_rating,
          trust_score
        FROM courier_analytics
        WHERE total_orders > 0
        ORDER BY trust_score DESC, avg_rating DESC
        LIMIT 10
      `);

      // Calculate growth rates
      const growthResult = await client.query(`
        WITH current_week AS (
          SELECT 
            SUM(total_orders) as orders,
            AVG(avg_rating) as rating
          FROM platform_analytics
          WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        previous_week AS (
          SELECT 
            SUM(total_orders) as orders,
            AVG(avg_rating) as rating
          FROM platform_analytics
          WHERE metric_date >= CURRENT_DATE - INTERVAL '14 days'
            AND metric_date < CURRENT_DATE - INTERVAL '7 days'
        )
        SELECT 
          CASE 
            WHEN prev.orders > 0 
            THEN ROUND(((curr.orders - prev.orders) / prev.orders * 100)::numeric, 2)
            ELSE 0 
          END as orders_growth,
          CASE 
            WHEN prev.rating > 0 
            THEN ROUND(((curr.rating - prev.rating) / prev.rating * 100)::numeric, 2)
            ELSE 0 
          END as rating_growth
        FROM current_week curr, previous_week prev
      `);

      const latest = latestResult.rows[0] || {};
      const growth = growthResult.rows[0] || { orders_growth: 0, rating_growth: 0 };

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            ...latest,
            orders_growth: growth.orders_growth,
            rating_growth: growth.rating_growth
          },
          trends: trendResult.rows,
          topCouriers: topCouriersResult.rows
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Platform analytics API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
