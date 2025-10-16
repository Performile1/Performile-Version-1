import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all unique statuses
    const statusQuery = `
      SELECT DISTINCT order_status 
      FROM orders 
      WHERE order_status IS NOT NULL 
      ORDER BY order_status
    `;
    
    // Get all couriers
    const courierQuery = `
      SELECT DISTINCT c.courier_id, c.courier_name 
      FROM couriers c
      INNER JOIN orders o ON c.courier_id = o.courier_id
      ORDER BY c.courier_name
    `;
    
    // Get all stores
    const storeQuery = `
      SELECT DISTINCT s.store_id, s.store_name 
      FROM stores s
      INNER JOIN orders o ON s.store_id = o.store_id
      ORDER BY s.store_name
    `;
    
    // Get all countries
    const countryQuery = `
      SELECT DISTINCT country 
      FROM orders 
      WHERE country IS NOT NULL 
      ORDER BY country
    `;

    const [statusResult, courierResult, storeResult, countryResult] = await Promise.all([
      pool.query(statusQuery),
      pool.query(courierQuery),
      pool.query(storeQuery),
      pool.query(countryQuery)
    ]);

    return res.status(200).json({
      statuses: statusResult.rows.map(r => r.order_status),
      couriers: courierResult.rows,
      stores: storeResult.rows,
      countries: countryResult.rows.map(r => r.country)
    });
  } catch (error) {
    console.error('Error fetching order filters:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch filter options',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
