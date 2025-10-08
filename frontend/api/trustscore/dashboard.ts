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

      // Get dashboard summary statistics from cache (fast!)
      let result;
      try {
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
            pa.avg_completion_rate as avg_on_time_rate
          FROM platform_analytics pa
          ORDER BY pa.metric_date DESC
          LIMIT 1
        `);
        
        // If no cache exists, return zeros
        if (!result.rows || result.rows.length === 0) {
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

      // Get top performers from cache (fast!)
      const topPerformers = await client.query(`
        SELECT 
          ca.courier_id,
          ca.courier_name,
          ca.trust_score as overall_score,
          ca.total_reviews,
          ca.total_orders,
          ca.delivered_orders,
          ca.completion_rate
        FROM courier_analytics ca
        JOIN couriers c ON ca.courier_id = c.courier_id
        WHERE c.is_active = TRUE
        ORDER BY ca.trust_score DESC NULLS LAST
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
