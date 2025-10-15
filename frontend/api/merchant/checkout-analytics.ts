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

  // Only merchants and admins can access
  if (user.role !== 'merchant' && user.user_role !== 'merchant' && 
      user.role !== 'admin' && user.user_role !== 'admin') {
    return res.status(403).json({ error: 'Merchant access required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { timeRange = '30d', store_id } = req.query;

    // Calculate date range
    let daysBack = 30;
    if (timeRange === '7d') daysBack = 7;
    else if (timeRange === '90d') daysBack = 90;
    else if (timeRange === '365d') daysBack = 365;

    const client = await pool.connect();
    
    try {
      // Get merchant's stores
      let storeFilter = '';
      const params: any[] = [user.userId || user.user_id];
      
      if (store_id) {
        storeFilter = 'AND s.store_id = $2';
        params.push(store_id);
      }

      // Get courier performance for merchant's stores
      const courierPerformance = await client.query(`
        SELECT 
          c.courier_id,
          c.courier_name,
          c.logo_url,
          c.contact_email,
          
          -- Order statistics
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'pending' THEN o.order_id END) as pending_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
          
          -- Performance metrics
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(o.order_id), 0) * 100), 2
            ), 0
          ) as success_rate,
          
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
          
          -- On-time delivery rate
          COALESCE(
            ROUND(
              (COUNT(CASE 
                WHEN o.order_status = 'delivered' 
                AND o.delivery_date IS NOT NULL
                AND o.estimated_delivery IS NOT NULL
                AND o.delivery_date <= o.estimated_delivery 
                THEN 1 
              END)::NUMERIC / 
              NULLIF(COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END), 0) * 100), 2
            ), 0
          ) as on_time_rate,
          
          -- Customer satisfaction (from reviews)
          COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
          COUNT(DISTINCT r.review_id) as total_reviews,
          
          -- Cost analysis
          COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 5.00, 0) as total_cost,
          
          -- Recent activity
          MAX(o.order_date) as last_order_date
          
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
          AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
          AND o.store_id IN (
            SELECT store_id FROM stores WHERE owner_user_id = $1 ${storeFilter}
          )
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE EXISTS (
          SELECT 1 FROM orders 
          WHERE courier_id = c.courier_id 
          AND store_id IN (
            SELECT store_id FROM stores WHERE owner_user_id = $1 ${storeFilter}
          )
        )
        GROUP BY c.courier_id, c.courier_name, c.logo_url, c.contact_email
        ORDER BY total_orders DESC
      `, params);

      // Get overall checkout summary
      const summary = await client.query(`
        SELECT 
          COUNT(DISTINCT o.courier_id) as total_couriers_used,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(o.order_id), 0) * 100), 2
            ), 0
          ) as overall_success_rate,
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
          COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN 1 END) * 5.00, 0) as total_shipping_cost
        FROM orders o
        WHERE o.store_id IN (
          SELECT store_id FROM stores WHERE owner_user_id = $1 ${storeFilter}
        )
        AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
      `, params);

      // Get checkout conversion funnel
      const funnel = await client.query(`
        SELECT 
          COUNT(DISTINCT o.order_id) as orders_created,
          COUNT(DISTINCT CASE WHEN o.order_status != 'pending' THEN o.order_id END) as orders_processed,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as orders_delivered,
          COUNT(DISTINCT CASE WHEN r.review_id IS NOT NULL THEN o.order_id END) as orders_reviewed
        FROM orders o
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE o.store_id IN (
          SELECT store_id FROM stores WHERE owner_user_id = $1 ${storeFilter}
        )
        AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
      `, params);

      // Get time-series data for chart (daily orders)
      const timeSeries = await client.query(`
        SELECT 
          DATE(o.order_date) as date,
          COUNT(DISTINCT o.order_id) as orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered
        FROM orders o
        WHERE o.store_id IN (
          SELECT store_id FROM stores WHERE owner_user_id = $1 ${storeFilter}
        )
        AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
        GROUP BY DATE(o.order_date)
        ORDER BY date DESC
        LIMIT 30
      `, params);

      // Get top performing stores (if merchant has multiple)
      const storePerformance = await client.query(`
        SELECT 
          s.store_id,
          s.store_name,
          s.website_url,
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(o.order_id), 0) * 100), 2
            ), 0
          ) as success_rate
        FROM stores s
        LEFT JOIN orders o ON s.store_id = o.store_id
          AND o.order_date >= NOW() - INTERVAL '${daysBack} days'
        WHERE s.owner_user_id = $1 ${storeFilter}
        GROUP BY s.store_id, s.store_name, s.website_url
        ORDER BY total_orders DESC
      `, params);

      return res.status(200).json({
        success: true,
        data: {
          summary: summary.rows[0] || {
            total_couriers_used: 0,
            total_orders: 0,
            delivered_orders: 0,
            cancelled_orders: 0,
            overall_success_rate: 0,
            avg_delivery_days: 0,
            total_shipping_cost: 0
          },
          couriers: courierPerformance.rows,
          funnel: funnel.rows[0] || {
            orders_created: 0,
            orders_processed: 0,
            orders_delivered: 0,
            orders_reviewed: 0
          },
          timeSeries: timeSeries.rows.reverse(),
          stores: storePerformance.rows,
          timeRange,
          daysBack
        }
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Merchant checkout analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch checkout analytics',
      message: error.message 
    });
  }
}
