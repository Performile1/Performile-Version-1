import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { withRLS } from '../lib/rls';
import jwt from 'jsonwebtoken';

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

function verifyToken(authHeader: string | undefined): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication and role
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admins only' });
  }

  try {
    // Use RLS context - admins see all data
    const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
      // Check if tables exist first
      const tablesExist = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name IN ('couriers', 'orders', 'reviews')
        );
      `);

      if (!tablesExist.rows[0].exists) {
        return res.status(200).json({
          success: true,
          data: {
            statistics: {
              total_couriers: 0,
              active_couriers: 0,
              avg_trust_score: 0,
              total_reviews: 0,
              avg_rating: 0,
              total_orders_processed: 0,
              delivered_orders: 0,
              avg_completion_rate: 0,
              avg_on_time_rate: 0,
              total_merchants: 0,
              total_consumers: 0,
              total_revenue: 0
            },
            couriers: [],
            recentReviews: [],
            recentOrders: []
          }
        });
      }

      // Get platform-wide dashboard summary statistics
      let result;
      try {
        console.log('[Admin Dashboard API] Querying real-time stats...');
        
        // Get real-time courier counts from couriers table
        const courierStats = await client.query(`
          SELECT 
            COUNT(*)::int as total_couriers,
            COUNT(*) FILTER (WHERE is_active = TRUE)::int as active_couriers
          FROM couriers
        `);
        
        // Get analytics from platform_analytics
        result = await client.query(`
          SELECT 
            pa.avg_trust_score,
            pa.total_reviews,
            pa.avg_rating,
            pa.total_orders as total_orders_processed,
            pa.delivered_orders,
            pa.avg_completion_rate,
            pa.avg_on_time_rate
          FROM platform_analytics pa
          ORDER BY pa.metric_date DESC
          LIMIT 1
        `);
        
        // Merge real-time courier counts with cached analytics
        if (result.rows && result.rows.length > 0) {
          result.rows[0].total_couriers = courierStats.rows[0].total_couriers;
          result.rows[0].active_couriers = courierStats.rows[0].active_couriers;
        }
        
        console.log('[Admin Dashboard API] Query result:', result.rows);
        
        // If no cache exists, return zeros
        if (!result.rows || result.rows.length === 0) {
          console.log('[Admin Dashboard API] No rows found, returning zeros');
          result = { rows: [{
            total_couriers: 0,
            active_couriers: 0,
            avg_trust_score: 0,
            total_reviews: 0,
            avg_rating: 0,
            total_orders_processed: 0,
            delivered_orders: 0,
            avg_completion_rate: 0,
            avg_on_time_rate: 0
          }]};
        }
      } catch (queryError: any) {
        console.error('[Admin Dashboard API] Query error:', queryError);
        // Return empty data on error
        return res.status(200).json({
          success: true,
          data: {
            statistics: {
              total_couriers: 0,
              active_couriers: 0,
              avg_trust_score: 0,
              total_reviews: 0,
              avg_rating: 0,
              total_orders_processed: 0,
              delivered_orders: 0,
              avg_completion_rate: 0,
              avg_on_time_rate: 0,
              total_merchants: 0,
              total_consumers: 0,
              total_revenue: 0
            },
            couriers: [],
            recentReviews: [],
            recentOrders: []
          }
        });
      }

      // Get additional admin-specific stats
      const userStatsResult = await client.query(`
        SELECT 
          COUNT(CASE WHEN user_role = 'merchant' THEN 1 END) as total_merchants,
          COUNT(CASE WHEN user_role = 'courier' THEN 1 END) as total_couriers_users,
          COUNT(CASE WHEN user_role = 'consumer' THEN 1 END) as total_consumers
        FROM users
      `);

      const revenueResult = await client.query(`
        SELECT 
          SUM(total_amount) as total_revenue,
          COUNT(*) as total_orders
        FROM orders
      `);

      // Get top performers from cache (fast!)
      const topPerformers = await client.query(`
        SELECT 
          ca.courier_id,
          ca.courier_name,
          ca.trust_score as overall_score,
          ca.total_reviews,
          ca.total_orders,
          ca.delivered_orders,
          ca.completion_rate,
          ca.on_time_rate
        FROM courier_analytics ca
        JOIN couriers c ON ca.courier_id = c.courier_id
        WHERE c.is_active = TRUE
        ORDER BY ca.trust_score DESC NULLS LAST
        LIMIT 10
      `);

      // Get recent reviews (platform-wide)
      const recentReviews = await client.query(`
        SELECT 
          r.review_id,
          r.rating,
          r.review_text as comment,
          r.created_at,
          c.courier_name,
          s.shop_name
        FROM reviews r
        JOIN orders o ON r.order_id = o.order_id
        JOIN couriers c ON o.courier_id = c.courier_id
        LEFT JOIN shops s ON o.shop_id = s.shop_id
        ORDER BY r.created_at DESC
        LIMIT 10
      `);

      // Get recent orders (platform-wide)
      const recentOrders = await client.query(`
        SELECT 
          o.order_id,
          o.order_number,
          o.status,
          o.total_amount,
          o.created_at,
          s.shop_name,
          c.courier_name
        FROM orders o
        LEFT JOIN shops s ON o.shop_id = s.shop_id
        LEFT JOIN couriers c ON o.courier_id = c.courier_id
        ORDER BY o.created_at DESC
        LIMIT 20
      `);

      const userStats = userStatsResult.rows[0];
      const revenueStats = revenueResult.rows[0];

      return {
        statistics: {
          ...result.rows[0],
          total_merchants: parseInt(userStats.total_merchants) || 0,
          total_consumers: parseInt(userStats.total_consumers) || 0,
          total_revenue: parseFloat(revenueStats.total_revenue) || 0
        },
        couriers: topPerformers.rows,
        recentReviews: recentReviews.rows,
        recentOrders: recentOrders.rows
      };
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Admin dashboard API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
