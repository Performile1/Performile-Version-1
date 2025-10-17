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
    const { role } = user;

    const client = await pool.connect();
    try {
      let realtimeData: any = {};

      // Admin: Platform-wide real-time metrics
      if (role === 'admin') {
        // Get today's metrics
        const todayResult = await client.query(`
          SELECT 
            total_orders,
            delivered_orders,
            in_transit_orders,
            pending_orders,
            active_couriers,
            active_stores,
            avg_rating
          FROM platform_analytics
          WHERE metric_date = CURRENT_DATE
          ORDER BY created_at DESC
          LIMIT 1
        `);

        // Get recent orders (last hour)
        const recentOrdersResult = await client.query(`
          SELECT COUNT(*) as count
          FROM orders
          WHERE created_at >= NOW() - INTERVAL '1 hour'
        `);

        // Get active couriers (had activity in last 24h)
        const activeCouriersResult = await client.query(`
          SELECT COUNT(DISTINCT courier_id) as count
          FROM orders
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        `);

        // Get recent notifications count
        const notificationsResult = await client.query(`
          SELECT COUNT(*) as count
          FROM notifications
          WHERE created_at >= NOW() - INTERVAL '1 hour'
        `);

        realtimeData = {
          today: todayResult.rows[0] || {},
          lastHour: {
            orders: parseInt(recentOrdersResult.rows[0]?.count || '0'),
            notifications: parseInt(notificationsResult.rows[0]?.count || '0'),
          },
          activeCouriers: parseInt(activeCouriersResult.rows[0]?.count || '0'),
          timestamp: new Date().toISOString(),
        };
      }

      // Merchant: Shop-specific real-time metrics
      else if (role === 'merchant') {
        const { shop_id } = req.query;
        
        if (!shop_id) {
          return res.status(400).json({
            success: false,
            message: 'shop_id is required for merchant role',
          });
        }

        // Get today's snapshot
        const todayResult = await client.query(`
          SELECT 
            total_orders,
            completed_orders,
            pending_orders,
            total_revenue,
            on_time_delivery_rate
          FROM shopanalyticssnapshots
          WHERE shop_id = $1
            AND snapshot_date = CURRENT_DATE
          ORDER BY created_at DESC
          LIMIT 1
        `, [shop_id]);

        // Get recent orders
        const recentOrdersResult = await client.query(`
          SELECT COUNT(*) as count
          FROM orders
          WHERE store_id = $1
            AND created_at >= NOW() - INTERVAL '1 hour'
        `, [shop_id]);

        // Get pending orders
        const pendingOrdersResult = await client.query(`
          SELECT COUNT(*) as count
          FROM orders
          WHERE store_id = $1
            AND order_status IN ('pending', 'processing')
        `, [shop_id]);

        realtimeData = {
          today: todayResult.rows[0] || {},
          lastHour: {
            orders: parseInt(recentOrdersResult.rows[0]?.count || '0'),
          },
          pending: parseInt(pendingOrdersResult.rows[0]?.count || '0'),
          timestamp: new Date().toISOString(),
        };
      }

      // Courier: Courier-specific real-time metrics
      else if (role === 'courier') {
        const { courier_id } = req.query;
        
        if (!courier_id) {
          return res.status(400).json({
            success: false,
            message: 'courier_id is required for courier role',
          });
        }

        // Get current stats
        const statsResult = await client.query(`
          SELECT 
            total_orders,
            delivered_orders,
            in_transit_orders,
            pending_orders,
            avg_rating,
            trust_score
          FROM courier_analytics
          WHERE courier_id = $1
        `, [courier_id]);

        // Get today's deliveries
        const todayResult = await client.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
            COUNT(CASE WHEN order_status = 'in_transit' THEN 1 END) as in_transit
          FROM orders
          WHERE courier_id = $1
            AND DATE(created_at) = CURRENT_DATE
        `, [courier_id]);

        // Get pending pickups
        const pendingResult = await client.query(`
          SELECT COUNT(*) as count
          FROM orders
          WHERE courier_id = $1
            AND order_status = 'pending'
        `, [courier_id]);

        realtimeData = {
          overall: statsResult.rows[0] || {},
          today: todayResult.rows[0] || {},
          pending: parseInt(pendingResult.rows[0]?.count || '0'),
          timestamp: new Date().toISOString(),
        };
      }

      return res.status(200).json({
        success: true,
        data: realtimeData,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Real-time analytics API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
