import { Router, Request, Response } from 'express';
import database from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * GET /merchant/dashboard
 * Get dashboard statistics for the logged-in merchant
 */
router.get('/dashboard', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.userRole;

    console.log('[Merchant Dashboard] Request from user:', userId, 'role:', userRole);

    if (userRole !== 'merchant') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Merchant role required.',
      });
    }

    // Get merchant's stores
    const storesQuery = await database.query(
      `SELECT store_id FROM stores WHERE owner_user_id = $1 AND is_active = TRUE`,
      [userId]
    );

    console.log('[Merchant Dashboard] Stores found:', storesQuery.rows.length);

    const storeIds = storesQuery.rows.map((row: any) => row.store_id);

    if (storeIds.length === 0) {
      // No stores yet - return zeros
      console.log('[Merchant Dashboard] No stores found, returning zeros');
      return res.json({
        success: true,
        data: {
          statistics: {
            total_couriers: 0,
            avg_on_time_rate: 0,
            avg_completion_rate: 0,
            total_orders: 0,
            delivered_orders: 0,
            pending_orders: 0,
            in_transit_orders: 0,
          },
          couriers: [],
        },
      });
    }

    // Get linked couriers count - with error handling for missing table
    let couriersCount = 0;
    try {
      const couriersQuery = await database.query(
        `SELECT COUNT(DISTINCT courier_id) as total_couriers
         FROM merchant_courier_selections
         WHERE merchant_id = $1 AND is_active = TRUE`,
        [userId]
      );
      couriersCount = parseInt(couriersQuery.rows[0]?.total_couriers || '0');
      console.log('[Merchant Dashboard] Couriers count:', couriersCount);
    } catch (courierError) {
      console.warn('[Merchant Dashboard] merchant_courier_selections table may not exist:', courierError);
      couriersCount = 0;
    }

    // Get orders statistics
    const ordersStatsQuery = await database.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN order_status = 'in_transit' THEN 1 END) as in_transit_orders,
        ROUND(
          COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(*), 0) * 100, 
          1
        ) as completion_rate,
        ROUND(
          COUNT(CASE WHEN order_status = 'delivered' AND delivery_date <= order_date + INTERVAL '2 days' THEN 1 END)::NUMERIC / 
          NULLIF(COUNT(CASE WHEN order_status = 'delivered' THEN 1 END), 0) * 100,
          1
        ) as on_time_rate
       FROM orders
       WHERE store_id = ANY($1)
       AND created_at >= NOW() - INTERVAL '30 days'`,
      [storeIds]
    );

    // Get top performing couriers for this merchant - with error handling
    let topCouriers = [];
    try {
      const topCouriersQuery = await database.query(
        `SELECT 
          c.courier_id,
          c.courier_name,
          c.company_name,
          COUNT(o.order_id) as total_orders,
          COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as delivered_orders,
          ROUND(
            COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(o.order_id), 0) * 100,
            1
          ) as completion_rate
         FROM merchant_courier_selections mcs
         JOIN couriers c ON mcs.courier_id = c.courier_id
         LEFT JOIN orders o ON o.courier_id = c.courier_id AND o.store_id = ANY($1)
         WHERE mcs.merchant_id = $2 AND mcs.is_active = TRUE
         GROUP BY c.courier_id, c.courier_name, c.company_name
         ORDER BY completion_rate DESC NULLS LAST, total_orders DESC
         LIMIT 5`,
        [storeIds, userId]
      );
      topCouriers = topCouriersQuery.rows;
      console.log('[Merchant Dashboard] Top couriers found:', topCouriers.length);
    } catch (courierError) {
      console.warn('[Merchant Dashboard] Could not fetch top couriers:', courierError);
      topCouriers = [];
    }

    const stats = ordersStatsQuery.rows[0];
    console.log('[Merchant Dashboard] Stats:', stats);

    res.json({
      success: true,
      data: {
        statistics: {
          total_couriers: couriersCount,
          avg_on_time_rate: parseFloat(stats?.on_time_rate || '0'),
          avg_completion_rate: parseFloat(stats?.completion_rate || '0'),
          total_orders: parseInt(stats?.total_orders || '0'),
          delivered_orders: parseInt(stats?.delivered_orders || '0'),
          pending_orders: parseInt(stats?.pending_orders || '0'),
          in_transit_orders: parseInt(stats?.in_transit_orders || '0'),
        },
        couriers: topCouriers,
      },
    });
  } catch (error) {
    console.error('[Merchant Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
