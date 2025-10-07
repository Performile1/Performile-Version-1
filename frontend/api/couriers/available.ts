import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all active couriers
    const result = await pool.query(
      `SELECT 
        courier_id,
        courier_name,
        company_name,
        logo_url,
        trust_score
      FROM couriers
      WHERE is_active = true
      ORDER BY trust_score DESC, courier_name ASC`
    );

    return res.status(200).json({
      success: true,
      couriers: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching available couriers:', error);
    return res.status(500).json({
      error: 'Failed to fetch couriers',
      message: error.message
    });
  }
}
