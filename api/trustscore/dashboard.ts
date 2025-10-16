import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(authHeader: string | undefined): any | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Dashboard API v2 - with analytics cache
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user from token for role-based filtering
    const user = verifyToken(req.headers.authorization);
    const userRole = user?.role || user?.user_role;
    const userId = user?.userId || user?.user_id;
    
    const client = await pool.connect();
    try {
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
              avg_on_time_rate: 0
            },
            couriers: [],
            recentReviews: []
          }
        });
      }

      // Get dashboard summary statistics - role-based filtering
      let result;
      try {
        console.log('[Dashboard API] Querying with role:', userRole);
        
        if (userRole === 'courier') {
          // Courier: Get stats for their assigned orders only
          result = await client.query(`
            SELECT 
              1 as total_couriers,
              1 as active_couriers,
              COALESCE(c.customer_rating * 20, 0) as avg_trust_score,
              COUNT(DISTINCT r.review_id) as total_reviews,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT o.order_id) as total_orders_processed,
              COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
              COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
                NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as avg_completion_rate,
              COALESCE(c.on_time_delivery_rate, 0) as avg_on_time_rate
            FROM couriers c
            LEFT JOIN orders o ON c.courier_id = o.courier_id
            LEFT JOIN reviews r ON o.order_id = r.order_id
            WHERE c.user_id = $1
            GROUP BY c.customer_rating, c.on_time_delivery_rate
          `, [userId]);
        } else if (userRole === 'merchant') {
          // Merchant: Get stats for their store's orders only
          result = await client.query(`
            SELECT 
              COUNT(DISTINCT o.courier_id) as total_couriers,
              COUNT(DISTINCT o.courier_id) as active_couriers,
              COALESCE(AVG(c.customer_rating * 20), 0) as avg_trust_score,
              COUNT(DISTINCT r.review_id) as total_reviews,
              COALESCE(AVG(r.rating), 0) as avg_rating,
              COUNT(DISTINCT o.order_id) as total_orders_processed,
              COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
              COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
                NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as avg_completion_rate,
              COALESCE(AVG(c.on_time_delivery_rate), 0) as avg_on_time_rate
            FROM orders o
            LEFT JOIN stores s ON o.store_id = s.store_id
            LEFT JOIN couriers c ON o.courier_id = c.courier_id
            LEFT JOIN reviews r ON o.order_id = r.order_id
            WHERE s.owner_user_id = $1
          `, [userId]);
        } else {
          // Admin: Get platform-wide stats from cache
          result = await client.query(`
            SELECT 
              pa.total_couriers,
              pa.active_couriers,
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
        }
        
        console.log('[Dashboard API] Query result:', result.rows);
        
        // If no cache exists, return zeros
        if (!result.rows || result.rows.length === 0) {
          console.log('[Dashboard API] No rows found, returning zeros');
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
        console.error('[Dashboard API] Query error:', queryError);
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
              avg_on_time_rate: 0
            },
            couriers: [],
            recentReviews: []
          }
        });
      }

      // Get top performers from cache (fast!)
      let topPerformers;
      try {
        topPerformers = await client.query(`
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
          LIMIT 5
        `);
      } catch (error: any) {
        console.error('[Dashboard API] Error fetching top performers:', error.message);
        topPerformers = { rows: [] };
      }

      // Get recent reviews
      let recentReviews;
      try {
        recentReviews = await client.query(`
          SELECT 
            r.review_id,
            r.rating,
            r.review_text as comment,
            r.created_at,
            c.courier_name,
            s.store_name
          FROM reviews r
          JOIN orders o ON r.order_id = o.order_id
          JOIN couriers c ON o.courier_id = c.courier_id
          JOIN stores s ON o.store_id = s.store_id
          ORDER BY r.created_at DESC
          LIMIT 10
        `);
      } catch (error: any) {
        console.error('[Dashboard API] Error fetching recent reviews:', error.message);
        recentReviews = { rows: [] };
      }

      return res.status(200).json({
        success: true,
        data: {
          statistics: result.rows[0],
          couriers: topPerformers.rows,
          recentReviews: recentReviews.rows
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('TrustScore dashboard API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
