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
      const result = await client.query(`
        SELECT 
          c.courier_id,
          c.courier_name,
          c.logo_url,
          COALESCE(ROUND(AVG(r.rating) * 20, 2), 0) as overall_score,
          COUNT(DISTINCT r.review_id) as total_reviews,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COALESCE(ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
            NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2), 0) as completion_rate,
          COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
          NOW() as last_updated
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE c.is_active = TRUE
        GROUP BY c.courier_id, c.courier_name, c.logo_url
        ORDER BY AVG(r.rating) DESC NULLS LAST
      `);

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('TrustScore API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
