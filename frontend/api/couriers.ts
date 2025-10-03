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
          t.overall_score,
          t.total_reviews,
          t.avg_delivery_speed,
          t.avg_package_condition,
          t.avg_communication
        FROM Couriers c
        LEFT JOIN TrustScoreCache t ON c.courier_id = t.courier_id
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
