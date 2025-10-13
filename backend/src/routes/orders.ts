import { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/orders
 * Get orders with filtering, sorting, and pagination
 */
router.get(
  '/',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;
      
      const {
        page = '1',
        limit = '10',
        search = '',
        sort_by = 'created_at',
        sort_order = 'desc',
        date_from,
        date_to,
      } = req.query;

      // Get filter arrays
      const statuses = req.query['status[]'] ? 
        (Array.isArray(req.query['status[]']) ? req.query['status[]'] : [req.query['status[]']]) : [];
      const courierIds = req.query['courier_id[]'] ? 
        (Array.isArray(req.query['courier_id[]']) ? req.query['courier_id[]'] : [req.query['courier_id[]']]) : [];
      const storeIds = req.query['store_id[]'] ? 
        (Array.isArray(req.query['store_id[]']) ? req.query['store_id[]'] : [req.query['store_id[]']]) : [];
      const countries = req.query['country[]'] ? 
        (Array.isArray(req.query['country[]']) ? req.query['country[]'] : [req.query['country[]']]) : [];

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      logger.info('[Orders] Request', { userId, userRole, page, limit, search });

      // Build WHERE clause based on user role
      let whereConditions = ['1=1'];
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Role-based filtering
      if (userRole === 'merchant') {
        const merchantResult = await database.query(
          'SELECT merchant_id FROM merchants WHERE user_id = $1',
          [userId]
        );
        if (merchantResult.rows.length > 0) {
          whereConditions.push(`o.merchant_id = $${paramIndex}`);
          queryParams.push(merchantResult.rows[0].merchant_id);
          paramIndex++;
        } else {
          return res.status(404).json({
            success: false,
            error: 'Merchant profile not found'
          });
        }
      } else if (userRole === 'courier') {
        const courierResult = await database.query(
          'SELECT courier_id FROM couriers WHERE user_id = $1',
          [userId]
        );
        if (courierResult.rows.length > 0) {
          whereConditions.push(`o.courier_id = $${paramIndex}`);
          queryParams.push(courierResult.rows[0].courier_id);
          paramIndex++;
        } else {
          return res.status(404).json({
            success: false,
            error: 'Courier profile not found'
          });
        }
      } else if (userRole === 'consumer') {
        const consumerResult = await database.query(
          'SELECT consumer_id FROM consumers WHERE user_id = $1',
          [userId]
        );
        if (consumerResult.rows.length > 0) {
          whereConditions.push(`o.consumer_id = $${paramIndex}`);
          queryParams.push(consumerResult.rows[0].consumer_id);
          paramIndex++;
        } else {
          return res.status(404).json({
            success: false,
            error: 'Consumer profile not found'
          });
        }
      }
      // Admin sees all orders

      // Search filter
      if (search) {
        whereConditions.push(`(
          o.tracking_number ILIKE $${paramIndex} OR 
          o.order_number ILIKE $${paramIndex} OR
          m.store_name ILIKE $${paramIndex} OR
          CONCAT(cu.first_name, ' ', cu.last_name) ILIKE $${paramIndex} OR
          CONCAT(co.first_name, ' ', co.last_name) ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // Status filter
      if (statuses.length > 0) {
        whereConditions.push(`o.order_status = ANY($${paramIndex})`);
        queryParams.push(statuses);
        paramIndex++;
      }

      // Courier filter
      if (courierIds.length > 0) {
        whereConditions.push(`o.courier_id = ANY($${paramIndex})`);
        queryParams.push(courierIds);
        paramIndex++;
      }

      // Store filter
      if (storeIds.length > 0) {
        whereConditions.push(`o.merchant_id = ANY($${paramIndex})`);
        queryParams.push(storeIds);
        paramIndex++;
      }

      // Country filter
      if (countries.length > 0) {
        whereConditions.push(`o.country = ANY($${paramIndex})`);
        queryParams.push(countries);
        paramIndex++;
      }

      // Date range filter
      if (date_from) {
        whereConditions.push(`o.order_date >= $${paramIndex}`);
        queryParams.push(date_from);
        paramIndex++;
      }
      if (date_to) {
        whereConditions.push(`o.order_date <= $${paramIndex}`);
        queryParams.push(date_to);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Validate sort column
      const validSortColumns = ['created_at', 'order_date', 'order_status', 'tracking_number'];
      const sortColumn = validSortColumns.includes(sort_by as string) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM orders o
        LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
        LEFT JOIN couriers c ON o.courier_id = c.courier_id
        LEFT JOIN users cu ON c.user_id = cu.user_id
        LEFT JOIN consumers co ON o.consumer_id = co.consumer_id
        WHERE ${whereClause}
      `;

      const countResult = await database.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get orders
      const ordersQuery = `
        SELECT 
          o.order_id,
          o.tracking_number,
          o.order_number,
          o.order_status,
          o.order_date,
          o.delivery_date,
          o.estimated_delivery,
          o.level_of_service,
          o.type_of_delivery,
          o.postal_code,
          o.city,
          o.country,
          o.created_at,
          o.updated_at,
          m.store_name,
          CONCAT(cu.first_name, ' ', cu.last_name) as courier_name,
          CONCAT(co.first_name, ' ', co.last_name) as consumer_name,
          co.email as consumer_email
        FROM orders o
        LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
        LEFT JOIN couriers c ON o.courier_id = c.courier_id
        LEFT JOIN users cu ON c.user_id = cu.user_id
        LEFT JOIN consumers co ON o.consumer_id = co.consumer_id
        WHERE ${whereClause}
        ORDER BY o.${sortColumn} ${sortDirection}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(parseInt(limit as string), offset);

      const ordersResult = await database.query(ordersQuery, queryParams);

      logger.info('[Orders] Success', {
        total,
        returned: ordersResult.rows.length,
        page,
        limit
      });

      res.json({
        success: true,
        orders: ordersResult.rows,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('[Orders] Error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/orders/:orderId
 * Get single order details
 */
router.get(
  '/:orderId',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;

      logger.info('[Orders] Get single order', { orderId, userId, userRole });

      const query = `
        SELECT 
          o.*,
          m.store_name,
          m.merchant_id,
          CONCAT(cu.first_name, ' ', cu.last_name) as courier_name,
          c.courier_id,
          CONCAT(co.first_name, ' ', co.last_name) as consumer_name,
          co.email as consumer_email,
          co.consumer_id
        FROM orders o
        LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
        LEFT JOIN couriers c ON o.courier_id = c.courier_id
        LEFT JOIN users cu ON c.user_id = cu.user_id
        LEFT JOIN consumers co ON o.consumer_id = co.consumer_id
        WHERE o.order_id = $1
      `;

      const result = await database.query(query, [orderId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      const order = result.rows[0];

      // Check access permissions
      if (userRole !== 'admin') {
        let hasAccess = false;

        if (userRole === 'merchant') {
          const merchantResult = await database.query(
            'SELECT merchant_id FROM merchants WHERE user_id = $1',
            [userId]
          );
          hasAccess = merchantResult.rows.length > 0 && 
                     merchantResult.rows[0].merchant_id === order.merchant_id;
        } else if (userRole === 'courier') {
          const courierResult = await database.query(
            'SELECT courier_id FROM couriers WHERE user_id = $1',
            [userId]
          );
          hasAccess = courierResult.rows.length > 0 && 
                     courierResult.rows[0].courier_id === order.courier_id;
        } else if (userRole === 'consumer') {
          const consumerResult = await database.query(
            'SELECT consumer_id FROM consumers WHERE user_id = $1',
            [userId]
          );
          hasAccess = consumerResult.rows.length > 0 && 
                     consumerResult.rows[0].consumer_id === order.consumer_id;
        }

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            error: 'Access denied'
          });
        }
      }

      res.json({
        success: true,
        order
      });
    } catch (error) {
      logger.error('[Orders] Get single order error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
