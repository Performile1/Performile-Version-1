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
          c.contact_email,
          c.contact_phone,
          COALESCE(ca.trust_score, 0) as overall_score,
          COALESCE(ca.total_reviews, 0) as total_reviews,
          COALESCE(ca.total_orders, 0) as total_orders,
          COALESCE(ca.delivered_orders, 0) as delivered_orders,
          COALESCE(ca.completion_rate, 0) as completion_rate,
          COALESCE(ca.avg_rating, 0) as avg_rating,
          COALESCE(ca.on_time_rate, ca.completion_rate, 0) as on_time_rate,
          COALESCE(ca.last_calculated, NOW()) as last_updated
        FROM couriers c
        LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
        WHERE c.is_active = TRUE
        ORDER BY ca.trust_score DESC NULLS LAST
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
