import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/db';

const pool = getPool();

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

    const results: any[] = [];

    // Search couriers
    try {
      const courierResult = await pool.query(`
        SELECT 'courier' as type, user_id::text as id, 
               COALESCE(company_name, first_name || ' ' || last_name) as name,
               email as description
        FROM users
        WHERE user_role = 'courier' 
          AND (company_name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
        LIMIT $2
      `, [searchTerm, searchLimit]);
      results.push(...courierResult.rows);
    } catch (err) {
      console.error('Courier search error:', err);
    }

    // Search merchants
    try {
      const merchantResult = await pool.query(`
        SELECT 'merchant' as type, user_id::text as id,
               COALESCE(company_name, first_name || ' ' || last_name) as name,
               email as description
        FROM users
        WHERE user_role = 'merchant'
          AND (company_name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
        LIMIT $2
      `, [searchTerm, searchLimit]);
      results.push(...merchantResult.rows);
    } catch (err) {
      console.error('Merchant search error:', err);
    }

    // Search orders
    try {
      const orderResult = await pool.query(`
        SELECT 'order' as type, order_id::text as id,
               tracking_number as name,
               order_status as description
        FROM orders
        WHERE tracking_number ILIKE $1
        LIMIT $2
      `, [searchTerm, searchLimit]);
      results.push(...orderResult.rows);
    } catch (err) {
      console.error('Order search error:', err);
    }

    return res.status(200).json({
      success: true,
      data: results.slice(0, searchLimit)
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
