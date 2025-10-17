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
    
    const { shop_id, period = 'daily', days = '30' } = req.query;

    if (!shop_id) {
      return res.status(400).json({
        success: false,
        message: 'shop_id is required'
      });
    }

    const client = await pool.connect();
    try {
      // Get latest snapshot
      const latestResult = await client.query(`
        SELECT 
          snapshot_id,
          shop_id,
          snapshot_date,
          period_type,
          total_orders,
          completed_orders,
          cancelled_orders,
          pending_orders,
          total_revenue,
          average_order_value,
          top_courier_id,
          courier_count,
          home_delivery_count,
          parcel_shop_count,
          parcel_locker_count,
          average_delivery_time_hours,
          on_time_delivery_rate,
          customer_satisfaction_score
        FROM shopanalyticssnapshots
        WHERE shop_id = $1
        ORDER BY snapshot_date DESC
        LIMIT 1
      `, [shop_id]);

      // Get trend data
      const trendResult = await client.query(`
        SELECT 
          snapshot_date,
          total_orders,
          completed_orders,
          total_revenue,
          average_order_value,
          on_time_delivery_rate,
          customer_satisfaction_score
        FROM shopanalyticssnapshots
        WHERE shop_id = $1
          AND snapshot_date >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
          AND period_type = $2
        ORDER BY snapshot_date ASC
      `, [shop_id, period]);

      // Get delivery method breakdown
      const deliveryBreakdown = latestResult.rows[0] ? {
        home_delivery: latestResult.rows[0].home_delivery_count || 0,
        parcel_shop: latestResult.rows[0].parcel_shop_count || 0,
        parcel_locker: latestResult.rows[0].parcel_locker_count || 0
      } : null;

      // Calculate completion rate
      const latest = latestResult.rows[0];
      const completionRate = latest && latest.total_orders > 0
        ? ((latest.completed_orders / latest.total_orders) * 100).toFixed(2)
        : 0;

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            ...latest,
            completion_rate: completionRate
          },
          trends: trendResult.rows,
          deliveryBreakdown
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Shop analytics API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
