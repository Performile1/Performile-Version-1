import type { VercelRequest, VercelResponse } from '@vercel/node';

import { getPool } from '../lib/db';
import { withRLS } from '../lib/rls';

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
    const user = verifyToken(req, true); // Authentication REQUIRED for security
    const {
      page = '1',
      limit = '10',
      search = '',
      date_filter = '',
      from_date = '',
      to_date = '',
      date_from = '',
      date_to = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;
    
    // Handle array parameters (status[], courier_id[], store_id[], country[])
    const statusArray = req.query['status[]'];
    const courierArray = req.query['courier_id[]'];
    const storeArray = req.query['store_id[]'];
    const countryArray = req.query['country[]'];
    
    // Normalize to arrays
    const statuses = Array.isArray(statusArray) ? statusArray : (statusArray ? [statusArray] : []);
    const couriers = Array.isArray(courierArray) ? courierArray : (courierArray ? [courierArray] : []);
    const stores = Array.isArray(storeArray) ? storeArray : (storeArray ? [storeArray] : []);
    const countries = Array.isArray(countryArray) ? countryArray : (countryArray ? [countryArray] : []);

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    let whereClause = '1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    // RLS will handle role-based filtering automatically
    // No need for manual WHERE clauses based on role

    // Search filter
    if (search) {
      whereClause += ` AND (o.tracking_number ILIKE $${++paramCount} OR o.order_number ILIKE $${++paramCount} OR s.store_name ILIKE $${++paramCount} OR c.courier_name ILIKE $${++paramCount})`;
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Status filter (multiple)
    if (statuses.length > 0) {
      const statusPlaceholders = statuses.map(() => `$${++paramCount}`).join(', ');
      whereClause += ` AND o.order_status IN (${statusPlaceholders})`;
      queryParams.push(...statuses);
    }

    // Courier filter (multiple)
    if (couriers.length > 0) {
      const courierPlaceholders = couriers.map(() => `$${++paramCount}`).join(', ');
      whereClause += ` AND c.courier_id IN (${courierPlaceholders})`;
      queryParams.push(...couriers);
    }

    // Store filter (multiple)
    if (stores.length > 0) {
      const storePlaceholders = stores.map(() => `$${++paramCount}`).join(', ');
      whereClause += ` AND s.store_id IN (${storePlaceholders})`;
      queryParams.push(...stores);
    }

    // Country filter (multiple)
    if (countries.length > 0) {
      const countryPlaceholders = countries.map(() => `$${++paramCount}`).join(', ');
      whereClause += ` AND o.country IN (${countryPlaceholders})`;
      queryParams.push(...countries);
    }

    // Date range filter (use date_from/date_to first, fallback to from_date/to_date)
    const dateFromValue = date_from || from_date;
    const dateToValue = date_to || to_date;
    
    if (dateFromValue) {
      whereClause += ` AND o.order_date >= $${++paramCount}`;
      queryParams.push(dateFromValue);
    }
    if (dateToValue) {
      whereClause += ` AND o.order_date <= $${++paramCount}`;
      queryParams.push(dateToValue);
    }

    // Preset date filter (fallback if no custom range)
    if (!dateFromValue && !dateToValue && date_filter && date_filter !== 'all') {
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

    // Validate and sanitize sort parameters
    const allowedSortColumns = ['tracking_number', 'order_number', 'order_status', 'order_date', 'delivery_date', 'created_at', 'store_name', 'courier_name'];
    const sortColumn = allowedSortColumns.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = (sort_order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Map frontend column names to database column names
    const columnMap: Record<string, string> = {
      'tracking_number': 'o.tracking_number',
      'order_number': 'o.order_number',
      'order_status': 'o.order_status',
      'order_date': 'o.order_date',
      'delivery_date': 'o.delivery_date',
      'created_at': 'o.created_at',
      'store_name': 's.store_name',
      'courier_name': 'c.courier_name'
    };
    
    const orderByColumn = columnMap[sortColumn as string] || 'o.created_at';

    // Add limit and offset parameters
    const limitParam = ++paramCount;
    const offsetParam = ++paramCount;
    queryParams.push(parseInt(limit as string), offset);

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
        o.city,
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
      LEFT JOIN users u ON o.consumer_id = u.user_id
      WHERE ${whereClause}
      ORDER BY ${orderByColumn} ${sortDirection}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    // Use RLS context - queries will be automatically filtered by role
    console.log('[Orders API] User object:', { userId: user.userId, user_id: user.user_id, role: user.role, user_role: user.user_role });
    const rlsUser = { userId: user.userId || user.user_id, role: user.role || user.user_role };
    console.log('[Orders API] RLS User:', rlsUser);
    
    if (!rlsUser.userId) {
      console.error('[Orders API] ERROR: userId is missing!', user);
      throw new Error('User ID is required for RLS');
    }
    const data = await withRLS(pool, rlsUser, async (client) => {
      const result = await client.query(query, queryParams);
      console.log('[Orders API] Query returned', result.rows.length, 'orders');

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        LEFT JOIN stores s ON o.store_id = s.store_id
        LEFT JOIN couriers c ON o.courier_id = c.courier_id
        WHERE ${whereClause}
      `;
      
      const countResult = await client.query(countQuery, queryParams.slice(0, -2));
      const total = parseInt(countResult.rows[0].total);

      return {
        orders: result.rows,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      };
    });

    // Disable caching to prevent stale data
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error('Get orders error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
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

      // Check subscription limit for orders
      const limitCheck = await pool.query(
        'SELECT check_subscription_limit($1, $2) as can_create',
        [user.user_id, 'order']
      );

      if (!limitCheck.rows[0].can_create) {
        // Get current limits to show in error
        const limits = await pool.query(
          'SELECT * FROM get_user_subscription_limits($1)',
          [user.user_id]
        );
        const limit = limits.rows[0];
        
        return res.status(403).json({
          success: false,
          message: `Order limit reached. You've used ${limit.current_orders_used}/${limit.max_orders_per_month} orders this month.`,
          error: 'SUBSCRIPTION_LIMIT_REACHED',
          limit_type: 'orders',
          current_usage: limit.current_orders_used,
          max_allowed: limit.max_orders_per_month,
          plan_name: limit.plan_name,
          tier: limit.tier,
          upgrade_required: true
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

    // Increment order usage counter for merchants
    if (user.user_role === 'merchant') {
      await pool.query(
        'SELECT increment_usage($1, $2, $3)',
        [user.user_id, 'order', 1]
      );
    }

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

// Get single order by ID
const handleGetSingleOrder = async (req: VercelRequest, res: VercelResponse, orderId: string) => {
  try {
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
        o.city,
        o.country,
        o.level_of_service,
        o.type_of_delivery,
        o.created_at,
        o.updated_at,
        s.store_name,
        s.store_id,
        c.courier_name,
        c.courier_id,
        u.first_name || ' ' || u.last_name as customer_name,
        u.email as customer_email
      FROM orders o
      LEFT JOIN stores s ON o.store_id = s.store_id
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
      LEFT JOIN users u ON o.customer_id = u.user_id
      WHERE o.order_id = $1
    `;

    const result = await pool.query(query, [orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.status(200).json({
      success: true,
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Get single order error:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch order'
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
    const lastPart = urlParts[urlParts.length - 1];
    
    // Check if lastPart is a UUID (order_id) or query string
    const isOrderId = lastPart && lastPart.length > 10 && !lastPart.includes('?') && lastPart !== 'orders';

    switch (method) {
      case 'GET':
        if (isExport) {
          return await handleExportOrders(req, res);
        }
        if (isOrderId) {
          return await handleGetSingleOrder(req, res, lastPart);
        }
        return await handleGetOrders(req, res);
        
      case 'POST':
        return await handleCreateOrder(req, res);
        
      case 'PUT':
        // Add orderId to query for update handler
        req.query.orderId = lastPart;
        return await handleUpdateOrder(req, res);
        
      case 'DELETE':
        // Add orderId to query for delete handler
        req.query.orderId = lastPart;
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
