import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/db';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          s.store_id,
          s.store_name,
          s.website_url,
          s.description,
          s.is_active,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT r.review_id) as total_reviews
        FROM stores s
        LEFT JOIN orders o ON s.store_id = o.store_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE s.is_active = TRUE
        GROUP BY s.store_id, s.store_name, s.website_url, s.description, s.is_active
        ORDER BY s.store_name
      `);

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Stores API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
