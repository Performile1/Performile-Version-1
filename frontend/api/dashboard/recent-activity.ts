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
      // Get recent activities from multiple sources
      const result = await client.query(`
        SELECT * FROM (
          (
            SELECT 
              'order' as type,
              order_id::text as id,
              'New Order' as title,
              'Order #' || COALESCE(order_number, tracking_number) as description,
              created_at as timestamp
            FROM orders
            WHERE created_at IS NOT NULL
            ORDER BY created_at DESC
            LIMIT 5
          )
          UNION ALL
          (
            SELECT 
              'review' as type,
              r.review_id::text as id,
              'New Review' as title,
              COALESCE(CAST(r.rating AS TEXT), '0') || ' stars' as description,
              r.created_at as timestamp
            FROM reviews r
            WHERE r.created_at IS NOT NULL
            ORDER BY r.created_at DESC
            LIMIT 5
          )
        ) activities
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Recent activity API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
