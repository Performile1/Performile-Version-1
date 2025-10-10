import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { user_role } = req.query;

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          plan_id,
          plan_name,
          user_role,
          price_monthly,
          price_yearly,
          features_json,
          is_active,
          created_at
        FROM subscriptionplans
        WHERE is_active = TRUE
      `;

      const params: any[] = [];
      
      // Filter by user role if provided
      if (user_role && (user_role === 'merchant' || user_role === 'courier')) {
        query += ` AND user_role = $1`;
        params.push(user_role);
      }

      query += ` ORDER BY price_monthly ASC`;

      const result = await client.query(query, params);

      return res.status(200).json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Subscription plans API error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    });
  }
}
