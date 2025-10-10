import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getPool } from '../lib/db';

const jwt = require('jsonwebtoken');

// Database connection
const pool = getPool();

// JWT verification middleware (optional for GET requests)
const verifyToken = (req: VercelRequest, required: boolean = true): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (required) {
      throw new Error('No token provided');
    }
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (required) {
      throw new Error('Invalid token');
    }
    return null;
  }
};

// Get orders with filtering and pagination
const handleGetOrders = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const user = verifyToken(req, false); // Make auth optional for GET
    const {
      page = '1',
      limit = '10',
      search = '',
      status = '',
      date_filter = ''
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = '1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    // Role-based filtering (only if authenticated)
    if (user && user.user_role === 'merchant') {
      whereClause += ` AND s.owner_user_id = $${++paramCount}`;
      queryParams.push(user.user_id);
    } else if (user && user.user_role === 'courier') {
      whereClause += ` AND c.user_id = $${++paramCount}`;
      queryParams.push(user.user_id);
    }

    // Search filter
    if (search) {
      whereClause += ` AND (o.tracking_number ILIKE $${++paramCount} OR o.order_number ILIKE $${++paramCount} OR s.store_name ILIKE $${++paramCount} OR c.courier_name ILIKE $${++paramCount})`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Status filter
    if (status && status !== 'all') {
      whereClause += ` AND o.order_status = $${++paramCount}`;
      queryParams.push(status);
    }

    // Date filter
    if (date_filter && date_filter !== 'all') {
      const dateCondition = (() => {
        switch (date_filter) {
          case 'today':
            return "o.order_date >= CURRENT_DATE";
          case 'week':
            return "o.order_date >= CURRENT_DATE - INTERVAL '7 days'";
          case 'month':
            return "o.order_date >= CURRENT_DATE - INTERVAL '30 days'";
          case 'quarter':
            return "o.order_date >= CURRENT_DATE - INTERVAL '90 days'";
          default:
            return '';
        }
      })();
      if (dateCondition) {
        whereClause += ` AND ${dateCondition}`;
      }
    }

    const query = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.order_number,
        o.order_status,
        o.order_date,
        o.delivery_date,
        o.delivery_address,
        o.postal_code,
        o.country,
        o.created_at,
        o.updated_at,
        s.store_name,
        c.courier_name,
        u.first_name || ' ' || u.last_name as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.store_id
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
      LEFT JOIN users u ON o.customer_id = u.user_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    queryParams.push(parseInt(limit as string), offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.store_id
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
      WHERE ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const total = parseInt(countResult.rows[0].total);

    res.status(200).json({
      success: true,
      orders: result.rows,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch orders'
    });
  }
};

// Create new order
const handleCreateOrder = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const user = verifyToken(req);
    const {
      tracking_number,
      order_number,
      store_id,
      courier_id,
      consumer_id,
      order_status = 'pending',
      level_of_service,
      type_of_delivery,
      postal_code,
      city,
      country,
      estimated_delivery
    } = req.body;

    if (!tracking_number || !store_id || !courier_id) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number, store ID, and courier ID are required'
      });
    }

    // Verify user has permission to create order for this store
    if (user.user_role === 'merchant') {
      const storeCheck = await pool.query(
        'SELECT store_id FROM stores WHERE store_id = $1 AND owner_user_id = $2',
        [store_id, user.user_id]
      );
      
      if (storeCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create orders for this store'
        });
      }
    }

    const query = `
      INSERT INTO orders (
        tracking_number, order_number, store_id, courier_id, consumer_id,
        order_status, level_of_service, type_of_delivery, postal_code,
        city, country, estimated_delivery
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      tracking_number,
      order_number || null,
      store_id,
      courier_id,
      consumer_id || null,
      order_status,
      level_of_service || null,
      type_of_delivery || null,
      postal_code || null,
      city || null,
      country || null,
      estimated_delivery || null
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Create order error:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(400).json({
        success: false,
        message: 'Tracking number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create order'
    });
  }
};

// Update order
const handleUpdateOrder = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const user = verifyToken(req);
    const { orderId } = req.query;
    const updateData = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Verify user has permission to update this order
    const permissionQuery = user.user_role === 'merchant' 
      ? 'SELECT o.* FROM orders o JOIN stores s ON o.store_id = s.store_id WHERE o.order_id = $1 AND s.owner_user_id = $2'
      : 'SELECT o.* FROM orders o WHERE o.order_id = $1';
    const permissionParams = user.user_role === 'merchant' ? [orderId, user.user_id] : [orderId];

    const permissionCheck = await pool.query(permissionQuery, permissionParams);
    
    if (permissionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    // Build update query dynamically
    const allowedFields = [
      'order_number', 'order_status', 'delivery_date', 'estimated_delivery',
      'level_of_service', 'type_of_delivery', 'postal_code', 'city', 'country'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${++paramCount}`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');

    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE order_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [orderId, ...updateValues]);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update order'
    });
  }
};

// Delete order
const handleDeleteOrder = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const user = verifyToken(req);
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Only admins and merchants can delete orders
    if (!['admin', 'merchant'].includes(user.user_role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete orders'
      });
    }

    // Verify user has permission to delete this order
    const permissionQuery = user.user_role === 'merchant'
      ? 'SELECT o.* FROM orders o JOIN stores s ON o.store_id = s.store_id WHERE o.order_id = $1 AND s.owner_user_id = $2'
      : 'SELECT o.* FROM orders o WHERE o.order_id = $1';
    const permissionParams = user.user_role === 'merchant' ? [orderId, user.user_id] : [orderId];

    const permissionCheck = await pool.query(permissionQuery, permissionParams);
    
    if (permissionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or access denied'
      });
    }

    await pool.query('DELETE FROM orders WHERE order_id = $1', [orderId]);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete order'
    });
  }
};

// Export orders to CSV
const handleExportOrders = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const user = verifyToken(req);
    
    let whereClause = '1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    // Role-based filtering
    if (user.user_role === 'merchant') {
      whereClause += ` AND s.owner_user_id = $${++paramCount}`;
      queryParams.push(user.user_id);
    } else if (user.user_role === 'courier') {
      whereClause += ` AND c.user_id = $${++paramCount}`;
      queryParams.push(user.user_id);
    }

    const query = `
      SELECT 
        o.tracking_number,
        o.order_number,
        o.order_status,
        o.order_date,
        o.delivery_date,
        o.level_of_service,
        o.type_of_delivery,
        o.postal_code,
        o.city,
        o.country,
        s.store_name,
        c.courier_name
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.store_id
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
    `;

    const result = await pool.query(query, queryParams);

    // Generate CSV
    const headers = [
      'Tracking Number', 'Order Number', 'Status', 'Order Date', 'Delivery Date',
      'Service Level', 'Delivery Type', 'Postal Code', 'City', 'Country',
      'Store', 'Courier'
    ];

    let csv = headers.join(',') + '\n';
    
    result.rows.forEach((row: any) => {
      const values = [
        row.tracking_number || '',
        row.order_number || '',
        row.order_status || '',
        row.order_date ? new Date(row.order_date).toISOString().split('T')[0] : '',
        row.delivery_date ? new Date(row.delivery_date).toISOString().split('T')[0] : '',
        row.level_of_service || '',
        row.type_of_delivery || '',
        row.postal_code || '',
        row.city || '',
        row.country || '',
        row.store_name || '',
        row.courier_name || ''
      ];
      
      csv += values.map(value => `"${value.toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to export orders'
    });
  }
};

// Main handler
module.exports = async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, url } = req;
    
    // Parse URL to handle different endpoints
    const urlParts = url?.split('/') || [];
    const isExport = urlParts.includes('export');
    const orderId = urlParts[urlParts.length - 1];

    switch (method) {
      case 'GET':
        if (isExport) {
          return await handleExportOrders(req, res);
        }
        return await handleGetOrders(req, res);
        
      case 'POST':
        return await handleCreateOrder(req, res);
        
      case 'PUT':
        // Add orderId to query for update handler
        req.query.orderId = orderId;
        return await handleUpdateOrder(req, res);
        
      case 'DELETE':
        // Add orderId to query for delete handler
        req.query.orderId = orderId;
        return await handleDeleteOrder(req, res);
        
      default:
        return res.status(405).json({
          success: false,
          message: 'Method not allowed'
        });
    }
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
