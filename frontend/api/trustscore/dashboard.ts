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
      // Get dashboard summary statistics
      const result = await client.query(`
        SELECT 
          COUNT(DISTINCT c.courier_id) as total_couriers,
          COUNT(DISTINCT CASE WHEN c.is_active THEN c.courier_id END) as active_couriers,
          ROUND(AVG(t.overall_score), 2) as avg_trust_score,
          COUNT(DISTINCT r.review_id) as total_reviews,
          ROUND(AVG(r.rating), 2) as avg_rating,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders
        FROM Couriers c
        LEFT JOIN TrustScoreCache t ON c.courier_id = t.courier_id
        LEFT JOIN Reviews r ON c.courier_id = r.courier_id
        LEFT JOIN Orders o ON c.courier_id = o.courier_id
      `);

      // Get top performers
      const topPerformers = await client.query(`
        SELECT 
          c.courier_id,
          c.courier_name,
          t.overall_score,
          t.total_reviews,
          t.avg_delivery_speed,
          t.avg_package_condition,
          t.avg_communication
        FROM Couriers c
        JOIN TrustScoreCache t ON c.courier_id = t.courier_id
        WHERE c.is_active = TRUE
        ORDER BY t.overall_score DESC NULLS LAST
        LIMIT 5
      `);

      // Get recent reviews
      const recentReviews = await client.query(`
        SELECT 
          r.review_id,
          r.rating,
          r.comment,
          r.created_at,
          c.courier_name,
          s.store_name
        FROM Reviews r
        JOIN Couriers c ON r.courier_id = c.courier_id
        JOIN Stores s ON r.store_id = s.store_id
        WHERE r.is_public = TRUE
        ORDER BY r.created_at DESC
        LIMIT 10
      `);

      return res.status(200).json({
        success: true,
        data: {
          summary: result.rows[0],
          topPerformers: topPerformers.rows,
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
