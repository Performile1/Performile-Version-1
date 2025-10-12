import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { withRLS } from '../lib/rls';
import jwt from 'jsonwebtoken';

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

function verifyToken(authHeader: string | undefined): JWTPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication and role
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'merchant') {
    return res.status(403).json({ error: 'Merchants only' });
  }

  const merchantId = user.userId;

  try {
    const {
      timeRange = 'month', // day, week, month, year
      startDate,
      endDate,
      shopId
    } = req.query;

    // Use RLS context - all queries will be automatically filtered
    const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
      // Calculate date range
      let dateFilter = '';
      const params: any[] = [];
      let paramCount = 0;

      if (startDate && endDate) {
        dateFilter = `AND o.created_at BETWEEN $${++paramCount} AND $${++paramCount}`;
        params.push(startDate, endDate);
      } else {
        // Default time ranges
        const ranges: Record<string, string> = {
          day: "AND o.created_at >= NOW() - INTERVAL '1 day'",
          week: "AND o.created_at >= NOW() - INTERVAL '7 days'",
          month: "AND o.created_at >= NOW() - INTERVAL '30 days'",
          year: "AND o.created_at >= NOW() - INTERVAL '1 year'"
        };
        dateFilter = ranges[timeRange as string] || ranges.month;
      }

      // Shop filter (optional)
      let shopFilter = '';
      if (shopId) {
        shopFilter = `AND s.shop_id = $${++paramCount}`;
        params.push(shopId);
      }

      // Get order trends over time (RLS filters shops automatically)
      const orderTrendsResult = await client.query(
        `SELECT 
           DATE(o.created_at) as date,
           COUNT(o.order_id) as order_count,
           SUM(o.total_amount) as revenue,
           AVG(o.total_amount) as avg_order_value,
           AVG(o.delivery_rating) as avg_rating
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE 1=1
           ${dateFilter}
           ${shopFilter}
         GROUP BY DATE(o.created_at)
         ORDER BY date DESC`,
        params
      );

      // Get courier performance for merchant's selected couriers only
      const courierPerformanceResult = await client.query(
        `SELECT 
           c.courier_id,
           c.courier_name,
           c.logo_url,
           COUNT(o.order_id) as total_deliveries,
           COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_deliveries,
           AVG(o.delivery_rating) as avg_rating,
           AVG(CASE WHEN o.delivered_on_time THEN 100 ELSE 0 END) as on_time_rate,
           c.trust_score,
           mcs.priority_level
         FROM couriers c
         JOIN merchant_courier_selections mcs ON c.courier_id = mcs.courier_id
         LEFT JOIN orders o ON c.courier_id = o.courier_id 
           AND o.shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = $1)
         WHERE mcs.merchant_id = $1
           AND mcs.is_active = true
         GROUP BY c.courier_id, c.courier_name, c.logo_url, c.trust_score, mcs.priority_level
         ORDER BY total_deliveries DESC`,
        [merchantId]
      );

      // Get shop performance breakdown
      const shopPerformanceResult = await client.query(
        `SELECT 
           s.shop_id,
           s.shop_name,
           COUNT(o.order_id) as total_orders,
           SUM(o.total_amount) as revenue,
           COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
           AVG(o.delivery_rating) as avg_rating
         FROM shops s
         LEFT JOIN orders o ON s.shop_id = o.shop_id
         WHERE s.owner_user_id = $1
           ${shopFilter}
         GROUP BY s.shop_id, s.shop_name
         ORDER BY total_orders DESC`,
        shopId ? [merchantId, shopId] : [merchantId]
      );

      // Get order status distribution
      const statusDistributionResult = await client.query(
        `SELECT 
           o.status,
           COUNT(*) as count,
           ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE s.owner_user_id = $1
           ${dateFilter}
           ${shopFilter}
         GROUP BY o.status
         ORDER BY count DESC`,
        params
      );

      // Get delivery time analysis
      const deliveryTimeResult = await client.query(
        `SELECT 
           EXTRACT(HOUR FROM o.created_at) as hour,
           COUNT(*) as order_count,
           AVG(o.total_amount) as avg_order_value
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE s.owner_user_id = $1
           ${dateFilter}
           ${shopFilter}
         GROUP BY EXTRACT(HOUR FROM o.created_at)
         ORDER BY hour`,
        params
      );

      // Get geographic distribution (top cities/postal codes)
      const geoDistributionResult = await client.query(
        `SELECT 
           o.delivery_city as city,
           o.delivery_postal_code as postal_code,
           COUNT(*) as order_count,
           SUM(o.total_amount) as revenue
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE s.owner_user_id = $1
           ${dateFilter}
           ${shopFilter}
           AND o.delivery_city IS NOT NULL
         GROUP BY o.delivery_city, o.delivery_postal_code
         ORDER BY order_count DESC
         LIMIT 20`,
        params
      );

      // Get top performing products (if product data exists)
      const topProductsResult = await client.query(
        `SELECT 
           oi.product_name,
           COUNT(*) as times_ordered,
           SUM(oi.quantity) as total_quantity,
           SUM(oi.price * oi.quantity) as total_revenue
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.order_id
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE s.owner_user_id = $1
           ${dateFilter}
           ${shopFilter}
         GROUP BY oi.product_name
         ORDER BY times_ordered DESC
         LIMIT 10`,
        params
      ).catch(() => ({ rows: [] })); // Gracefully handle if order_items table doesn't exist

      // Calculate summary statistics
      const summaryResult = await client.query(
        `SELECT 
           COUNT(DISTINCT o.order_id) as total_orders,
           SUM(o.total_amount) as total_revenue,
           AVG(o.total_amount) as avg_order_value,
           COUNT(DISTINCT o.consumer_id) as unique_customers,
           COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
           AVG(o.delivery_rating) as avg_rating,
           COUNT(DISTINCT s.shop_id) as active_shops
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         WHERE s.owner_user_id = $1
           ${dateFilter}
           ${shopFilter}`,
        params
      );

      const summary = summaryResult.rows[0];

      return {
        summary: {
          total_orders: parseInt(summary.total_orders) || 0,
          total_revenue: parseFloat(summary.total_revenue) || 0,
          avg_order_value: parseFloat(summary.avg_order_value) || 0,
          unique_customers: parseInt(summary.unique_customers) || 0,
          delivered_orders: parseInt(summary.delivered_orders) || 0,
          avg_rating: parseFloat(summary.avg_rating) || 0,
          active_shops: parseInt(summary.active_shops) || 0
        },
        orderTrends: orderTrendsResult.rows,
        courierPerformance: courierPerformanceResult.rows,
        shopPerformance: shopPerformanceResult.rows,
        statusDistribution: statusDistributionResult.rows,
        deliveryTimeAnalysis: deliveryTimeResult.rows,
        geoDistribution: geoDistributionResult.rows,
        topProducts: topProductsResult.rows
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
      filters: {
        timeRange,
        startDate,
        endDate,
        shopId
      }
    });
  } catch (error: any) {
    console.error('Merchant analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
