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
        (
          SELECT 
            'order' as type,
            order_id as id,
            'New Order' as title,
            'Order #' || COALESCE(order_number, tracking_number) || 
            CASE 
              WHEN store_name IS NOT NULL THEN ' from ' || store_name
              ELSE ''
            END as description,
            created_at as timestamp
          FROM orders
          ORDER BY created_at DESC
          LIMIT 5
        )
        UNION ALL
        (
          SELECT 
            'review' as type,
            r.review_id as id,
            'New Review' as title,
            CAST(r.rating AS TEXT) || ' stars for ' || c.courier_name as description,
            r.created_at as timestamp
          FROM reviews r
          JOIN couriers c ON r.courier_id = c.courier_id
          ORDER BY r.created_at DESC
          LIMIT 5
        )
        UNION ALL
        (
          SELECT 
            'courier' as type,
            courier_id as id,
            'Courier Updated' as title,
            courier_name || ' profile updated' as description,
            updated_at as timestamp
          FROM couriers
          WHERE updated_at > created_at
          ORDER BY updated_at DESC
          LIMIT 3
        )
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
