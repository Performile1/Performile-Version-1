import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import database from '../config/database';
import logger from '../utils/logger';
import { queryOne, queryMany } from '../utils/dbHelpers';
import { tryCatch, sendSuccessResponse } from '../utils/errorHandler';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity for the logged-in user
 */
router.get('/recent-activity', tryCatch(async (req: Request, res: Response) => {
  const userId = (req as any).user?.user_id;
  const userRole = (req as any).user?.user_role;

  logger.info('[Dashboard] Recent activity request', { userId, userRole });

  // Get recent orders based on user role
  let query = '';
  let params: any[] = [];

  if (userRole === 'admin') {
    // Admin sees all recent orders
    query = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.order_status,
        o.created_at,
        m.store_name,
        'order' as activity_type
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
  } else if (userRole === 'merchant') {
    // Merchant sees their orders
    const merchant = await queryOne<{ merchant_id: string }>(
      'SELECT merchant_id FROM merchants WHERE user_id = $1',
      [userId]
    );
    
    if (!merchant) {
      return sendSuccessResponse(res, []);
    }

    query = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.order_status,
        o.created_at,
        'order' as activity_type
      FROM orders o
      WHERE o.merchant_id = $1
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    params = [merchant.merchant_id];
  } else if (userRole === 'courier') {
    // Courier sees their deliveries
    const courier = await queryOne<{ courier_id: string }>(
      'SELECT courier_id FROM couriers WHERE user_id = $1',
      [userId]
    );
    
    if (!courier) {
      return sendSuccessResponse(res, []);
    }

    query = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.order_status,
        o.created_at,
        m.store_name,
        'delivery' as activity_type
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
      WHERE o.courier_id = $1
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    params = [courier.courier_id];
  } else {
    // Consumer sees their orders
    query = `
      SELECT 
        o.order_id,
        o.tracking_number,
        o.order_status,
        o.created_at,
        m.store_name,
        'order' as activity_type
      FROM orders o
      LEFT JOIN merchants m ON o.merchant_id = m.merchant_id
      WHERE o.consumer_email = $1
      ORDER BY o.created_at DESC
      LIMIT 10
    `;
    params = [(req as any).user?.email];
  }

  const activities = await queryMany(query, params);
  sendSuccessResponse(res, activities);
}));

/**
 * GET /api/tracking/summary
 * Get tracking summary statistics
 */
router.get('/tracking/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userRole = (req as any).user?.user_role;

    logger.info('[Dashboard] Tracking summary request', { userId, userRole });

    let query = '';
    let params: any[] = [];

    if (userRole === 'admin') {
      query = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN order_status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending
        FROM orders
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `;
    } else if (userRole === 'merchant') {
      const merchantResult = await database.query(
        'SELECT merchant_id FROM merchants WHERE user_id = $1',
        [userId]
      );
      
      if (merchantResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { total_orders: 0, delivered: 0, in_transit: 0, pending: 0 } 
        });
      }

      query = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN order_status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending
        FROM orders
        WHERE merchant_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
      `;
      params = [merchantResult.rows[0].merchant_id];
    } else if (userRole === 'courier') {
      const courierResult = await database.query(
        'SELECT courier_id FROM couriers WHERE user_id = $1',
        [userId]
      );
      
      if (courierResult.rows.length === 0) {
        return res.json({ 
          success: true, 
          data: { total_orders: 0, delivered: 0, in_transit: 0, pending: 0 } 
        });
      }

      query = `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN order_status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending
        FROM orders
        WHERE courier_id = $1
          AND created_at >= NOW() - INTERVAL '30 days'
      `;
      params = [courierResult.rows[0].courier_id];
    } else {
      return res.json({ 
        success: true, 
        data: { total_orders: 0, delivered: 0, in_transit: 0, pending: 0 } 
      });
    }

    const result = await database.query(query, params);

    res.json({
      success: true,
      data: result.rows[0] || { total_orders: 0, delivered: 0, in_transit: 0, pending: 0 }
    });
  } catch (error) {
    logger.error('[Dashboard] Tracking summary error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tracking summary'
    });
  }
});

export default router;
