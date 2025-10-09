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
          c.description,
          c.contact_email,
          c.contact_phone,
          c.is_active,
          ca.trust_score as overall_score,
          ca.total_reviews,
          ca.avg_rating,
          ca.completion_rate,
          ca.on_time_rate,
          ca.total_orders,
          ca.delivered_orders
        FROM couriers c
        LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
        WHERE c.is_active = TRUE
        ORDER BY c.courier_name
      `);

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Couriers API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
