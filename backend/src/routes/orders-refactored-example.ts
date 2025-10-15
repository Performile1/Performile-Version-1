/**
 * EXAMPLE: Refactored Orders Route
 * 
 * This is an example showing how to use the new utilities:
 * - dbHelpers for database operations
 * - errorHandler for standardized error handling
 * - Cleaner, more maintainable code
 * 
 * Compare this with the original orders.ts to see the improvements
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  queryOne, 
  queryMany, 
  insertOne, 
  updateMany, 
  exists,
  executeTransaction 
} from '../utils/dbHelpers';
import {
  tryCatch,
  NotFoundError,
  ValidationError,
  AuthorizationError,
  sendSuccessResponse,
  sendPaginatedResponse,
  validateRequiredFields
} from '../utils/errorHandler';
import logger from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/orders
 * Get orders with pagination and filtering
 */
router.get('/', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  const userRole = (req as any).user?.user_role;
  const { status, page = 1, limit = 20 } = req.query;

  logger.info('[Orders] Get orders', { userId, userRole, status, page, limit });

  // Build query based on role
  let query = '';
  let countQuery = '';
  const params: any[] = [];
  let paramIndex = 1;

  if (userRole === 'admin') {
    query = `
      SELECT o.*, m.store_name, c.courier_name
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
    `;
    countQuery = 'SELECT COUNT(*) as total FROM orders o';
  } else if (userRole === 'merchant') {
    // Get merchant_id
    const merchant = await queryOne<{ merchant_id: string }>(
      'SELECT merchant_id FROM merchants WHERE user_id = $1',
      [userId]
    );

    if (!merchant) {
      return sendSuccessResponse(res, [], 'No merchant found for user');
    }

    query = `
      SELECT o.*, c.courier_name
      FROM orders o
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
      WHERE o.merchant_id = $${paramIndex}
    `;
    countQuery = `SELECT COUNT(*) as total FROM orders WHERE merchant_id = $${paramIndex}`;
    params.push(merchant.merchant_id);
    paramIndex++;
  } else if (userRole === 'courier') {
    // Get courier_id
    const courier = await queryOne<{ courier_id: string }>(
      'SELECT courier_id FROM couriers WHERE user_id = $1',
      [userId]
    );

    if (!courier) {
      return sendSuccessResponse(res, [], 'No courier found for user');
    }

    query = `
      SELECT o.*, m.store_name
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
      WHERE o.courier_id = $${paramIndex}
    `;
    countQuery = `SELECT COUNT(*) as total FROM orders WHERE courier_id = $${paramIndex}`;
    params.push(courier.courier_id);
    paramIndex++;
  } else {
    // Consumer
    query = `
      SELECT o.*, m.store_name, c.courier_name
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
      LEFT JOIN couriers c ON o.courier_id = c.courier_id
      WHERE o.consumer_email = $${paramIndex}
    `;
    countQuery = `SELECT COUNT(*) as total FROM orders WHERE consumer_email = $${paramIndex}`;
    params.push((req as any).user?.email);
    paramIndex++;
  }

  // Add status filter if provided
  if (status) {
    query += ` AND o.order_status = $${paramIndex}`;
    countQuery += ` AND order_status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Get total count
  const countResult = await queryOne<{ total: string }>(countQuery, params.slice(0, paramIndex - 1));
  const total = parseInt(countResult?.total || '0', 10);

  // Add pagination
  const offset = (Number(page) - 1) * Number(limit);
  query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  // Execute query
  const orders = await queryMany(query, params);

  sendPaginatedResponse(res, orders, Number(page), Number(limit), total);
}));

/**
 * GET /api/orders/:id
 * Get a specific order by ID
 */
router.get('/:id', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  const userRole = (req as any).user?.user_role;
  const { id } = req.params;

  logger.info('[Orders] Get order by ID', { userId, orderId: id });

  // Check if order exists
  const orderExists = await exists('orders', { order_id: id });
  if (!orderExists) {
    throw new NotFoundError('Order');
  }

  // Get order with details
  const order = await queryOne(`
    SELECT 
      o.*,
      m.store_name,
      m.merchant_id,
      c.courier_name,
      c.courier_id
    FROM orders o
    LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
    LEFT JOIN couriers c ON o.courier_id = c.courier_id
    WHERE o.order_id = $1
  `, [id]);

  if (!order) {
    throw new NotFoundError('Order');
  }

  // Check authorization
  if (userRole === 'merchant') {
    const merchant = await queryOne<{ merchant_id: string }>(
      'SELECT merchant_id FROM merchants WHERE user_id = $1',
      [userId]
    );
    if (merchant?.merchant_id !== order.merchant_id) {
      throw new AuthorizationError();
    }
  } else if (userRole === 'courier') {
    const courier = await queryOne<{ courier_id: string }>(
      'SELECT courier_id FROM couriers WHERE user_id = $1',
      [userId]
    );
    if (courier?.courier_id !== order.courier_id) {
      throw new AuthorizationError();
    }
  } else if (userRole === 'consumer') {
    if (order.consumer_email !== (req as any).user?.email) {
      throw new AuthorizationError();
    }
  }

  sendSuccessResponse(res, order);
}));

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  const orderData = req.body;

  logger.info('[Orders] Create order', { userId });

  // Validate required fields
  validateRequiredFields(orderData, [
    'tracking_number',
    'courier_id',
    'consumer_name',
    'consumer_email',
    'delivery_address',
    'delivery_city',
    'delivery_postal_code',
    'delivery_country'
  ]);

  // Get merchant_id for the user
  const merchant = await queryOne<{ merchant_id: string }>(
    'SELECT merchant_id FROM merchants WHERE user_id = $1',
    [userId]
  );

  if (!merchant) {
    throw new ValidationError('User is not associated with a merchant');
  }

  // Create order using transaction
  const newOrder = await executeTransaction(async (client) => {
    // Insert order
    const order = await client.query(`
      INSERT INTO orders (
        tracking_number,
        merchant_id,
        courier_id,
        order_status,
        consumer_name,
        consumer_email,
        consumer_phone,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_country,
        package_weight,
        package_dimensions,
        declared_value,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      orderData.tracking_number,
      merchant.merchant_id,
      orderData.courier_id,
      'pending',
      orderData.consumer_name,
      orderData.consumer_email,
      orderData.consumer_phone || null,
      orderData.delivery_address,
      orderData.delivery_city,
      orderData.delivery_postal_code,
      orderData.delivery_country,
      orderData.package_weight || null,
      orderData.package_dimensions || null,
      orderData.declared_value || null,
      userId
    ]);

    // Create order timeline entry
    await client.query(`
      INSERT INTO order_timeline (
        order_id,
        status,
        notes,
        created_by
      ) VALUES ($1, $2, $3, $4)
    `, [
      order.rows[0].order_id,
      'pending',
      'Order created',
      userId
    ]);

    return order.rows[0];
  });

  sendSuccessResponse(res, newOrder, 'Order created successfully', 201);
}));

/**
 * PUT /api/orders/:id
 * Update an order
 */
router.put('/:id', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  const userRole = (req as any).user?.user_role;
  const { id } = req.params;
  const updates = req.body;

  logger.info('[Orders] Update order', { userId, orderId: id });

  // Check if order exists
  const order = await queryOne<{ order_id: string; merchant_id: string }>(
    'SELECT order_id, merchant_id FROM orders WHERE order_id = $1',
    [id]
  );

  if (!order) {
    throw new NotFoundError('Order');
  }

  // Check authorization
  if (userRole === 'merchant') {
    const merchant = await queryOne<{ merchant_id: string }>(
      'SELECT merchant_id FROM merchants WHERE user_id = $1',
      [userId]
    );
    if (merchant?.merchant_id !== order.merchant_id) {
      throw new AuthorizationError();
    }
  }

  // Update order
  const updatedOrders = await updateMany(
    'orders',
    {
      ...updates,
      updated_at: new Date(),
    },
    { order_id: id }
  );

  if (updatedOrders.length === 0) {
    throw new NotFoundError('Order');
  }

  sendSuccessResponse(res, updatedOrders[0], 'Order updated successfully');
}));

export default router;
