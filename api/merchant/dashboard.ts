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
    // Use RLS context - all queries will be automatically filtered
    const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
      // Get merchant's shops (RLS automatically filters by owner_user_id)
      const shopsResult = await client.query(
        `SELECT 
           shop_id,
           shop_name,
           address,
           city,
           postal_code,
           country,
           is_active,
           created_at
         FROM shops 
         ORDER BY created_at DESC`
      );

      const shops = shopsResult.rows;
      const shopIds = shops.map(s => s.shop_id);

      // Get orders (RLS automatically filters to merchant's shops)
      const ordersResult = await client.query(
        `SELECT 
           o.order_id,
           o.order_number,
           o.status,
           o.total_amount,
           o.created_at,
           o.updated_at,
           s.shop_name,
           c.courier_name,
           o.tracking_number
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         LEFT JOIN couriers c ON o.courier_id = c.courier_id
         ORDER BY o.created_at DESC
         LIMIT 10`
      );

      // Get merchant's selected couriers (RLS filters by merchant_id)
      const couriersResult = await client.query(
        `SELECT 
           c.courier_id,
           c.courier_name,
           c.logo_url,
           c.trust_score,
           mcs.is_active,
           mcs.display_order,
           mcs.priority_level,
           COUNT(o.order_id) as order_count
         FROM couriers c
         JOIN merchant_courier_selections mcs ON c.courier_id = mcs.courier_id
         LEFT JOIN orders o ON c.courier_id = o.courier_id 
           AND o.shop_id = ANY($1::uuid[])
         GROUP BY c.courier_id, c.courier_name, c.logo_url, c.trust_score, 
                  mcs.is_active, mcs.display_order, mcs.priority_level
         ORDER BY mcs.display_order, c.courier_name`,
        [shopIds.length > 0 ? shopIds : [null]]
      );

      // Calculate merchant-specific statistics (RLS filters shops)
      const statsResult = await client.query(
        `SELECT 
           COUNT(DISTINCT o.order_id) as total_orders,
           SUM(o.total_amount) as total_revenue,
           COUNT(DISTINCT s.shop_id) as total_shops,
           COUNT(DISTINCT mcs.courier_id) as selected_couriers,
           COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.order_id END) as delivered_orders,
           COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.order_id END) as pending_orders,
           COUNT(DISTINCT CASE WHEN o.status = 'in_transit' THEN o.order_id END) as in_transit_orders,
           AVG(CASE WHEN o.status = 'delivered' THEN o.delivery_rating END) as avg_delivery_rating
         FROM shops s
         LEFT JOIN orders o ON s.shop_id = o.shop_id
         LEFT JOIN merchant_courier_selections mcs ON s.owner_user_id = mcs.merchant_id AND mcs.is_active = true`
      );

      // Get recent activity (RLS filters orders)
      const activityResult = await client.query(
        `SELECT 
           'order' as activity_type,
           o.order_id as id,
           o.order_number as title,
           o.status as description,
           o.created_at as timestamp,
           s.shop_name as context
         FROM orders o
         JOIN shops s ON o.shop_id = s.shop_id
         ORDER BY o.created_at DESC
         LIMIT 20`
      );

      // Get subscription info
      const subscriptionResult = await client.query(
        `SELECT 
           sp.plan_name,
           sp.tier,
           sp.max_shops,
           sp.max_couriers,
           sp.max_orders_per_month,
           us.status as subscription_status,
           us.current_period_end
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.plan_id
         WHERE us.user_id = $1 AND us.status = 'active'
         LIMIT 1`,
        [merchantId]
      );

      const stats = statsResult.rows[0];
      const subscription = subscriptionResult.rows[0] || {
        plan_name: 'Free',
        tier: 0,
        max_shops: 1,
        max_couriers: 2,
        max_orders_per_month: 50
      };

      return {
        shops: shops,
        orders: ordersResult.rows,
        couriers: couriersResult.rows,
        statistics: {
          total_orders: parseInt(stats.total_orders) || 0,
          total_revenue: parseFloat(stats.total_revenue) || 0,
          total_shops: parseInt(stats.total_shops) || 0,
          selected_couriers: parseInt(stats.selected_couriers) || 0,
          delivered_orders: parseInt(stats.delivered_orders) || 0,
          pending_orders: parseInt(stats.pending_orders) || 0,
          in_transit_orders: parseInt(stats.in_transit_orders) || 0,
          avg_delivery_rating: parseFloat(stats.avg_delivery_rating) || 0
        },
        recentActivity: activityResult.rows,
        subscription: subscription
      };
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Merchant dashboard API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
