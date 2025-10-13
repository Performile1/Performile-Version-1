import { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken, requireRole } from '../middleware/auth';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/merchant/checkout-analytics
 * Get merchant's checkout analytics - which couriers are shown and selected
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['merchant', 'admin']),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.user_id;
      const userRole = (req as any).user?.user_role;
      const { timeRange = '30d' } = req.query;

      logger.info('[Merchant Checkout Analytics] Request', { userId, userRole, timeRange });

      // Get merchant_id from user_id
      const merchantResult = await database.query(
        'SELECT merchant_id FROM merchants WHERE user_id = $1',
        [userId]
      );

      if (merchantResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Merchant profile not found'
        });
      }

      const merchantId = merchantResult.rows[0].merchant_id;

      // Calculate date range
      const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[timeRange as string] || 30;

      // Get overall summary
      const summaryResult = await database.query(
        `SELECT 
           COUNT(DISTINCT checkout_session_id) as total_checkouts,
           COUNT(*) as total_displays,
           COUNT(CASE WHEN was_selected THEN 1 END) as total_selections,
           ROUND(
             (COUNT(CASE WHEN was_selected THEN 1 END)::DECIMAL / 
              NULLIF(COUNT(DISTINCT checkout_session_id), 0)) * 100, 
             1
           ) as selection_rate,
           ROUND(AVG(order_value), 2) as avg_order_value,
           COUNT(DISTINCT courier_id) as unique_couriers
         FROM courier_checkout_positions
         WHERE merchant_id = $1
           AND created_at >= NOW() - INTERVAL '1 day' * $2`,
        [merchantId, days]
      );

      const summary = summaryResult.rows[0];

      // Get courier performance
      const courierPerformanceResult = await database.query(
        `SELECT 
           c.courier_id,
           u.first_name || ' ' || u.last_name as courier_name,
           COUNT(*) as total_appearances,
           COUNT(CASE WHEN ccp.was_selected THEN 1 END) as times_selected,
           ROUND(
             (COUNT(CASE WHEN ccp.was_selected THEN 1 END)::DECIMAL / 
              NULLIF(COUNT(*), 0)) * 100, 
             1
           ) as selection_rate,
           ROUND(AVG(ccp.position_shown), 1) as avg_position,
           ROUND(AVG(ccp.order_value), 2) as avg_order_value
         FROM courier_checkout_positions ccp
         JOIN couriers c ON ccp.courier_id = c.courier_id
         JOIN users u ON c.user_id = u.user_id
         WHERE ccp.merchant_id = $1
           AND ccp.created_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY c.courier_id, u.first_name, u.last_name
         ORDER BY times_selected DESC, total_appearances DESC
         LIMIT 20`,
        [merchantId, days]
      );

      // Get daily trends
      const trendsResult = await database.query(
        `SELECT 
           DATE(created_at) as date,
           COUNT(DISTINCT checkout_session_id) as total_checkouts,
           COUNT(CASE WHEN was_selected THEN 1 END) as total_selections,
           ROUND(AVG(order_value), 2) as avg_order_value
         FROM courier_checkout_positions
         WHERE merchant_id = $1
           AND created_at >= NOW() - INTERVAL '1 day' * $2
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
        [merchantId, days]
      );

      // Get recent checkouts
      const recentCheckoutsResult = await database.query(
        `SELECT 
           ccp.checkout_session_id,
           ccp.position_shown,
           ccp.was_selected,
           ccp.order_value,
           ccp.delivery_city,
           ccp.delivery_country,
           ccp.created_at,
           u.first_name || ' ' || u.last_name as courier_name
         FROM courier_checkout_positions ccp
         JOIN couriers c ON ccp.courier_id = c.courier_id
         JOIN users u ON c.user_id = u.user_id
         WHERE ccp.merchant_id = $1
         ORDER BY ccp.created_at DESC
         LIMIT 50`,
        [merchantId]
      );

      logger.info('[Merchant Checkout Analytics] Success', {
        merchantId,
        totalCheckouts: summary.total_checkouts,
        totalSelections: summary.total_selections
      });

      res.json({
        success: true,
        data: {
          summary,
          courierPerformance: courierPerformanceResult.rows,
          trends: trendsResult.rows,
          recentCheckouts: recentCheckoutsResult.rows,
        },
        message: 'Merchant checkout analytics retrieved successfully'
      });
    } catch (error) {
      logger.error('[Merchant Checkout Analytics] Error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch merchant checkout analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
