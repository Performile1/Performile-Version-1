import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    let decoded: any;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Verify admin role
    const userResult = await pool.query(
      'SELECT user_role FROM users WHERE user_id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0 || userResult.rows[0].user_role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    if (req.method === 'GET') {
      // Get query parameters for filtering and pagination
      const { 
        page = '1', 
        limit = '50',
        status,
        courier_id,
        merchant_id,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build query with filters
      let queryText = `
        SELECT 
          o.*,
          json_build_object(
            'user_id', c.user_id,
            'first_name', c.first_name,
            'last_name', c.last_name,
            'email', c.email
          ) as courier,
          json_build_object(
            'user_id', m.user_id,
            'first_name', m.first_name,
            'last_name', m.last_name,
            'email', m.email,
            'company_name', m.company_name
          ) as merchant
        FROM orders o
        LEFT JOIN users c ON o.courier_id = c.user_id
        LEFT JOIN users m ON o.merchant_id = m.user_id
        WHERE 1=1
      `;
      
      const queryParams: any[] = [];
      let paramCount = 1;

      if (status) {
        queryText += ` AND o.order_status = $${paramCount}`;
        queryParams.push(status);
        paramCount++;
      }
      if (courier_id) {
        queryText += ` AND o.courier_id = $${paramCount}`;
        queryParams.push(courier_id);
        paramCount++;
      }
      if (merchant_id) {
        queryText += ` AND o.merchant_id = $${paramCount}`;
        queryParams.push(merchant_id);
        paramCount++;
      }
      if (search) {
        queryText += ` AND (o.tracking_number ILIKE $${paramCount} OR o.order_id::text ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
        paramCount++;
      }

      queryText += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      queryParams.push(limitNum, offset);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM orders o WHERE 1=1';
      const countParams: any[] = [];
      let countParamNum = 1;
      
      if (status) {
        countQuery += ` AND o.order_status = $${countParamNum}`;
        countParams.push(status);
        countParamNum++;
      }
      if (courier_id) {
        countQuery += ` AND o.courier_id = $${countParamNum}`;
        countParams.push(courier_id);
        countParamNum++;
      }
      if (merchant_id) {
        countQuery += ` AND o.merchant_id = $${countParamNum}`;
        countParams.push(merchant_id);
        countParamNum++;
      }
      if (search) {
        countQuery += ` AND (o.tracking_number ILIKE $${countParamNum} OR o.order_id::text ILIKE $${countParamNum})`;
        countParams.push(`%${search}%`);
      }

      const [ordersResult, countResult] = await Promise.all([
        pool.query(queryText, queryParams),
        pool.query(countQuery, countParams)
      ]);

      const totalCount = parseInt(countResult.rows[0].count);

      return res.status(200).json({
        orders: ordersResult.rows || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum)
        }
      });
    }

    if (req.method === 'POST') {
      // Create new order (admin can create orders on behalf of merchants)
      const orderData = req.body;

      const result = await pool.query(
        `INSERT INTO orders (merchant_id, courier_id, tracking_number, status, total_amount, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [orderData.merchant_id, orderData.courier_id, orderData.tracking_number, orderData.status || 'pending', orderData.total_amount]
      );

      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Update order
      const { order_id, ...updates } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const updateValues = Object.values(updates);

      const result = await pool.query(
        `UPDATE orders SET ${updateFields}, updated_at = NOW() WHERE order_id = $1 RETURNING *`,
        [order_id, ...updateValues]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { order_id } = req.query;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      const result = await pool.query(
        'DELETE FROM orders WHERE order_id = $1 RETURNING order_id',
        [order_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.status(200).json({ message: 'Order deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Admin orders API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
