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
    const { postal_code, country = 'SWE' } = req.query;

    const client = await pool.connect();
    
    try {
      // Get courier_id for the user
      let courierId = null;
      if (user.role === 'courier' || user.user_role === 'courier') {
        const courierResult = await client.query(
          'SELECT courier_id FROM couriers WHERE user_id = $1',
          [user.userId || user.user_id]
        );
        if (courierResult.rows.length > 0) {
          courierId = courierResult.rows[0].courier_id;
        }
      }

      // Market size analysis
      const marketSize = await client.query(`
        SELECT 
          COUNT(DISTINCT s.store_id) as total_merchants,
          COUNT(DISTINCT o.order_id) as total_orders_last_30d,
          COUNT(DISTINCT o.consumer_id) as total_consumers,
          COUNT(DISTINCT c.courier_id) as total_couriers,
          COALESCE(SUM(CASE WHEN o.order_date >= NOW() - INTERVAL '30 days' THEN 1 END) * 5.00, 0) as estimated_market_value
        FROM stores s
        LEFT JOIN orders o ON s.store_id = o.store_id
        LEFT JOIN couriers c ON o.courier_id = c.courier_id
        WHERE ($1::text IS NULL OR o.postal_code LIKE $1 || '%')
          AND o.country = $2
      `, [postal_code || null, country]);

      // Competitive landscape
      const competitors = await client.query(`
        SELECT 
          c.courier_id,
          c.courier_name,
          CASE 
            WHEN c.courier_id = $1 THEN true
            ELSE false
          END as is_you,
          
          -- Market share (orders)
          COUNT(DISTINCT o.order_id) as total_orders,
          COALESCE(
            ROUND(
              (COUNT(DISTINCT o.order_id)::NUMERIC / 
              NULLIF((SELECT COUNT(*) FROM orders WHERE order_date >= NOW() - INTERVAL '30 days'), 0) * 100), 2
            ), 0
          ) as market_share_pct,
          
          -- Performance metrics
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(o.order_id), 0) * 100), 2
            ), 0
          ) as success_rate,
          
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
          
          -- Customer metrics
          COUNT(DISTINCT o.store_id) as unique_merchants,
          COUNT(DISTINCT o.consumer_id) as unique_consumers,
          
          -- Trust score from analytics
          COALESCE(ca.trust_score, 0) as trust_score,
          COALESCE(ca.avg_rating, 0) as avg_rating
          
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
          AND o.order_date >= NOW() - INTERVAL '30 days'
          AND ($2::text IS NULL OR o.postal_code LIKE $2 || '%')
          AND o.country = $3
        LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
        WHERE c.is_active = true
        GROUP BY c.courier_id, c.courier_name, ca.trust_score, ca.avg_rating
        HAVING COUNT(DISTINCT o.order_id) > 0
        ORDER BY total_orders DESC
        LIMIT 10
      `, [courierId, postal_code || null, country]);

      // Growth trends (comparing last 30 days to previous 30 days)
      const growthTrends = await client.query(`
        WITH current_period AS (
          SELECT 
            COUNT(DISTINCT order_id) as current_orders,
            COUNT(DISTINCT store_id) as current_merchants
          FROM orders
          WHERE order_date >= NOW() - INTERVAL '30 days'
            AND ($1::text IS NULL OR postal_code LIKE $1 || '%')
            AND country = $2
        ),
        previous_period AS (
          SELECT 
            COUNT(DISTINCT order_id) as previous_orders,
            COUNT(DISTINCT store_id) as previous_merchants
          FROM orders
          WHERE order_date >= NOW() - INTERVAL '60 days'
            AND order_date < NOW() - INTERVAL '30 days'
            AND ($1::text IS NULL OR postal_code LIKE $1 || '%')
            AND country = $2
        )
        SELECT 
          cp.current_orders,
          cp.current_merchants,
          pp.previous_orders,
          pp.previous_merchants,
          CASE 
            WHEN pp.previous_orders = 0 THEN 100
            ELSE ROUND(((cp.current_orders - pp.previous_orders)::NUMERIC / pp.previous_orders * 100), 2)
          END as order_growth_rate,
          CASE 
            WHEN pp.previous_merchants = 0 THEN 100
            ELSE ROUND(((cp.current_merchants - pp.previous_merchants)::NUMERIC / pp.previous_merchants * 100), 2)
          END as merchant_growth_rate
        FROM current_period cp, previous_period pp
      `, [postal_code || null, country]);

      // Popular delivery areas
      const popularAreas = await client.query(`
        SELECT 
          postal_code,
          COUNT(DISTINCT order_id) as order_count,
          COUNT(DISTINCT store_id) as merchant_count,
          COALESCE(
            ROUND(
              (COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC / 
              NULLIF(COUNT(order_id), 0) * 100), 2
            ), 0
          ) as success_rate
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '30 days'
          AND country = $1
          AND postal_code IS NOT NULL
        GROUP BY postal_code
        ORDER BY order_count DESC
        LIMIT 10
      `, [country]);

      // Merchant demand (merchants without courier or looking for alternatives)
      const merchantDemand = await client.query(`
        SELECT 
          s.store_id,
          s.store_name,
          s.website_url,
          COUNT(DISTINCT o.order_id) as recent_orders,
          COUNT(DISTINCT o.courier_id) as couriers_used,
          COALESCE(
            ROUND(AVG(
              CASE 
                WHEN o.delivery_date IS NOT NULL AND o.order_date IS NOT NULL
                THEN EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 86400
                ELSE NULL
              END
            ), 2), 0
          ) as avg_delivery_days,
          MAX(o.order_date) as last_order_date
        FROM stores s
        LEFT JOIN orders o ON s.store_id = o.store_id
          AND o.order_date >= NOW() - INTERVAL '90 days'
        WHERE s.is_active = true
          AND ($1::text IS NULL OR EXISTS (
            SELECT 1 FROM orders 
            WHERE store_id = s.store_id 
            AND postal_code LIKE $1 || '%'
          ))
        GROUP BY s.store_id, s.store_name, s.website_url
        HAVING COUNT(DISTINCT o.order_id) > 5
        ORDER BY recent_orders DESC
        LIMIT 20
      `, [postal_code || null]);

      // Pricing insights (average delivery cost)
      const pricingInsights = await client.query(`
        SELECT 
          COALESCE(ROUND(AVG(5.00), 2), 5.00) as avg_delivery_cost,
          COALESCE(ROUND(MIN(5.00), 2), 5.00) as min_delivery_cost,
          COALESCE(ROUND(MAX(5.00), 2), 5.00) as max_delivery_cost,
          5.00 as recommended_price
        FROM orders
        WHERE order_date >= NOW() - INTERVAL '30 days'
          AND order_status = 'delivered'
          AND ($1::text IS NULL OR postal_code LIKE $1 || '%')
          AND country = $2
      `, [postal_code || null, country]);

      return res.status(200).json({
        success: true,
        data: {
          marketSize: marketSize.rows[0] || {
            total_merchants: 0,
            total_orders_last_30d: 0,
            total_consumers: 0,
            total_couriers: 0,
            estimated_market_value: 0
          },
          competitors: competitors.rows,
          growthTrends: growthTrends.rows[0] || {
            current_orders: 0,
            current_merchants: 0,
            previous_orders: 0,
            previous_merchants: 0,
            order_growth_rate: 0,
            merchant_growth_rate: 0
          },
          popularAreas: popularAreas.rows,
          merchantDemand: merchantDemand.rows,
          pricingInsights: pricingInsights.rows[0] || {
            avg_delivery_cost: 5.00,
            min_delivery_cost: 5.00,
            max_delivery_cost: 5.00,
            recommended_price: 5.00
          },
          filters: {
            postal_code,
            country
          }
        }
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Market insights error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch market insights',
      message: error.message 
    });
  }
}
