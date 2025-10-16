import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  const user = security.user;

  // Only couriers and admins can access
  if (user.role !== 'courier' && user.user_role !== 'courier' && 
      user.role !== 'admin' && user.user_role !== 'admin') {
    return res.status(403).json({ error: 'Courier access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    let daysBack = 30;
    if (timeRange === '7d') daysBack = 7;
    else if (timeRange === '90d') daysBack = 90;
    else if (timeRange === '365d') daysBack = 365;

    const client = await pool.connect();
    
    try {
      // Get courier_id for the user
      let courierId = null;
      if (user.role === 'courier' || user.user_role === 'courier') {
        const courierResult = await client.query(
          'SELECT courier_id FROM couriers WHERE user_id = $1',
          [user.userId || user.user_id]
        );
        if (courierResult.rows.length === 0) {
          return res.status(404).json({ error: 'Courier profile not found' });
        }
        courierId = courierResult.rows[0].courier_id;
      }

      // For admin, show all couriers (or specific if courier_id in query)
      const adminCourierId = req.query.courier_id as string;
      if ((user.role === 'admin' || user.user_role === 'admin') && adminCourierId) {
        courierId = adminCourierId;
      }

      // Get merchant checkout analytics
      const merchantAnalytics = await client.query(`
        SELECT 
          s.store_id,
          s.store_name,
          s.website_url,
          s.logo_url,
          u.email as owner_email,
          u.first_name || ' ' || u.last_name as owner_name,
          
          -- Order statistics
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'pending' THEN o.order_id END) as pending_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
          
          -- Revenue (if available)
          COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 5.00, 0) as estimated_revenue,
          
          -- Conversion rate (delivered / total)
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(o.order_id), 0) * 100), 2
            ), 0
          ) as conversion_rate,
          
          -- Average delivery time (in days)
          COALESCE(
            ROUND(
              AVG(
                CASE 
                  WHEN o.delivery_date IS NOT NULL AND o.order_date IS NOT NULL
                  THEN EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 86400
                  ELSE NULL
                END
              ), 2
            ), 0
          ) as avg_delivery_days,
          
          -- Recent activity
          MAX(o.order_date) as last_order_date,
          MIN(o.order_date) as first_order_date
          
        FROM stores s
        JOIN users u ON s.owner_user_id = u.user_id
        LEFT JOIN orders o ON s.store_id = o.store_id 
          AND o.courier_id = $1
          AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
        WHERE EXISTS (
          SELECT 1 FROM orders 
          WHERE store_id = s.store_id 
          AND courier_id = $1
        )
        GROUP BY s.store_id, s.store_name, s.website_url, s.logo_url, u.email, u.first_name, u.last_name
        ORDER BY total_orders DESC
      `, [courierId]);

      // Get overall summary
      const summary = await client.query(`
        SELECT 
          COUNT(DISTINCT o.store_id) as total_merchants,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(o.order_id), 0) * 100), 2
            ), 0
          ) as overall_conversion_rate,
          COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 5.00, 0) as total_revenue
        FROM orders o
        WHERE o.courier_id = $1
          AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
      `, [courierId]);

      // Get trending merchants (most growth)
      const trending = await client.query(`
        WITH current_period AS (
          SELECT 
            s.store_id,
            s.store_name,
            COUNT(o.order_id) as current_orders
          FROM stores s
          LEFT JOIN orders o ON s.store_id = o.store_id 
            AND o.courier_id = $1
            AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
          GROUP BY s.store_id, s.store_name
        ),
        previous_period AS (
          SELECT 
            s.store_id,
            COUNT(o.order_id) as previous_orders
          FROM stores s
          LEFT JOIN orders o ON s.store_id = o.store_id 
            AND o.courier_id = $1
            AND o.order_date >= NOW() - INTERVAL '${daysBack * 2} days'
            AND o.order_date < NOW() - INTERVAL '${daysBack} days'
          GROUP BY s.store_id
        )
        SELECT 
          cp.store_id,
          cp.store_name,
          cp.current_orders,
          COALESCE(pp.previous_orders, 0) as previous_orders,
          CASE 
            WHEN COALESCE(pp.previous_orders, 0) = 0 THEN 100
            ELSE ROUND(((cp.current_orders - COALESCE(pp.previous_orders, 0))::NUMERIC / 
                  NULLIF(pp.previous_orders, 1) * 100), 2)
          END as growth_rate
        FROM current_period cp
        LEFT JOIN previous_period pp ON cp.store_id = pp.store_id
        WHERE cp.current_orders > 0
        ORDER BY growth_rate DESC
        LIMIT 5
      `, [courierId]);

      return res.status(200).json({
        success: true,
        data: {
          summary: summary.rows[0] || {
            total_merchants: 0,
            total_orders: 0,
            delivered_orders: 0,
            overall_conversion_rate: 0,
            total_revenue: 0
          },
          merchants: merchantAnalytics.rows,
          trending: trending.rows,
          timeRange,
          daysBack
        }
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Courier checkout analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch checkout analytics',
      message: error.message 
    });
  }
}
