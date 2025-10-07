import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ 
      error: 'Invalid token',
      message: 'Review token is required'
    });
  }

  try {
    const query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.delivered_at,
        o.review_submitted,
        c.courier_id,
        c.courier_name,
        c.company_name,
        u.first_name || ' ' || u.last_name as customer_name
      FROM orders o
      JOIN couriers c ON o.courier_id = c.courier_id
      JOIN users u ON o.customer_id = u.user_id
      WHERE o.review_token = $1
        AND o.review_request_sent = TRUE
        AND o.status = 'delivered';
    `;

    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired review link'
      });
    }

    const order = result.rows[0];

    return res.status(200).json({
      success: true,
      order: {
        order_id: order.order_id,
        order_number: order.order_number,
        courier_id: order.courier_id,
        courier_name: order.courier_name,
        delivered_at: order.delivered_at,
        customer_name: order.customer_name,
        review_submitted: order.review_submitted
      }
    });

  } catch (error: any) {
    console.error('Error fetching order info:', error);
    return res.status(500).json({
      error: 'Failed to fetch order information',
      message: error.message
    });
  }
}
