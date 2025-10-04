import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../../utils/env';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verify token
const verifyToken = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, getJWTSecret());
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyToken(req);
    const { market, postal_code, country } = req.query;
    
    const client = await pool.connect();
    try {
      let whereClause = '1=1';
      const params: any[] = [];
      let paramCount = 0;

      // Filter by market/location
      if (country) {
        whereClause += ` AND o.delivery_address ILIKE $${++paramCount}`;
        params.push(`%${country}%`);
      }
      if (postal_code) {
        whereClause += ` AND o.delivery_address ILIKE $${++paramCount}`;
        params.push(`%${postal_code}%`);
      }

      // Admin sees EVERYTHING with full transparency
      if (user.role === 'admin') {
        const query = `
          SELECT 
            c.courier_id,
            c.courier_name,
            c.contact_email,
            c.contact_phone,
            COUNT(DISTINCT o.order_id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
            ROUND(AVG(r.rating), 2) as avg_rating,
            ROUND(AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600), 2) as avg_delivery_hours,
            ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
              NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2) as success_rate,
            COUNT(DISTINCT o.customer_email) as unique_customers,
            COUNT(DISTINCT s.store_id) as stores_served
          FROM Couriers c
          LEFT JOIN Orders o ON c.courier_id = o.courier_id
          LEFT JOIN Reviews r ON c.courier_id = r.courier_id
          LEFT JOIN Stores s ON o.store_id = s.store_id
          WHERE ${whereClause}
          GROUP BY c.courier_id, c.courier_name, c.contact_email, c.contact_phone
          ORDER BY total_orders DESC
        `;
        
        const result = await client.query(query, params);
        
        return res.status(200).json({
          success: true,
          data: result.rows,
          anonymized: false,
          message: 'Admin view - Full transparency'
        });
      }

      // Couriers and Merchants see ANONYMIZED data (unless they purchase)
      const query = `
        SELECT 
          'ANON-' || SUBSTR(MD5(c.courier_id::TEXT), 1, 8) as anonymized_id,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          ROUND(AVG(r.rating), 2) as avg_rating,
          ROUND(AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600), 2) as avg_delivery_hours,
          ROUND((COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
            NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2) as success_rate,
          CASE 
            WHEN COUNT(DISTINCT o.customer_email) < 10 THEN '< 10'
            WHEN COUNT(DISTINCT o.customer_email) < 50 THEN '10-50'
            WHEN COUNT(DISTINCT o.customer_email) < 100 THEN '50-100'
            ELSE '100+'
          END as customer_range,
          $${++paramCount}::TEXT as market,
          $${++paramCount}::TEXT as postal_code,
          20.00 as unlock_price_market,
          15.00 as unlock_price_postal_code
        FROM Couriers c
        LEFT JOIN Orders o ON c.courier_id = o.courier_id
        LEFT JOIN Reviews r ON c.courier_id = r.courier_id
        WHERE ${whereClause} AND c.is_active = TRUE
        GROUP BY c.courier_id
        HAVING COUNT(DISTINCT o.order_id) > 0
        ORDER BY total_orders DESC
        LIMIT 20
      `;
      
      params.push(market || 'General', postal_code || 'N/A');
      const result = await client.query(query, params);
      
      return res.status(200).json({
        success: true,
        data: result.rows,
        anonymized: true,
        message: 'Purchase add-on to see full details',
        pricing: {
          per_market: 29.00,
          per_postal_code: 15.00
        }
      });
      
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Competitor data API error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
