import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

      // Get dashboard summary statistics - with error handling
      let result;
      try {
        result = await client.query(`
          SELECT 
            COUNT(DISTINCT c.courier_id) as total_couriers,
            COUNT(DISTINCT CASE WHEN c.is_active THEN c.courier_id END) as active_couriers,
            COALESCE(ROUND(AVG(r.rating) * 20, 2), 0) as avg_trust_score,
            COUNT(DISTINCT r.review_id) as total_reviews,
            COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
            COUNT(DISTINCT o.order_id) as total_orders_processed,
            COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
            COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
              NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as avg_completion_rate,
            COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
              NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as avg_on_time_rate
          FROM couriers c
          LEFT JOIN orders o ON c.courier_id = o.courier_id
          LEFT JOIN reviews r ON o.order_id = r.order_id
        `);
      } catch (queryError: any) {
        console.error('Dashboard query error:', queryError);
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

      // Get top performers
      const topPerformers = await client.query(`
        SELECT 
          c.courier_id,
          c.courier_name,
          COALESCE(ROUND(AVG(r.rating) * 20, 2), 0) as overall_score,
          COUNT(DISTINCT r.review_id) as total_reviews,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE c.is_active = TRUE
        GROUP BY c.courier_id, c.courier_name
        ORDER BY AVG(r.rating) DESC NULLS LAST
        LIMIT 5
      `);

      // Get recent reviews
      const recentReviews = await client.query(`
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
