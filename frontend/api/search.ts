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
    const { q, limit = '10' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query required' });
    }

    const searchLimit = parseInt(limit as string, 10);
    const searchTerm = `%${q}%`;

    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 'courier' as type, courier_id as id, courier_name as name, description
        FROM Couriers
        WHERE courier_name ILIKE $1 OR description ILIKE $1
        LIMIT $2
        
        UNION ALL
        
        SELECT 'store' as type, store_id as id, store_name as name, description
        FROM Stores
        WHERE store_name ILIKE $1 OR description ILIKE $1
        LIMIT $2
        
        UNION ALL
        
        SELECT 'order' as type, order_id as id, order_number as name, customer_name as description
        FROM Orders
        WHERE order_number ILIKE $1 OR customer_name ILIKE $1 OR customer_email ILIKE $1
        LIMIT $2
      `, [searchTerm, searchLimit]);

      return res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Search API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
