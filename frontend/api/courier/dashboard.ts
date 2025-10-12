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
  
  if (!user || user.role !== 'courier') {
    return res.status(403).json({ error: 'Couriers only' });
  }

  const courierId = user.userId;

  try {
    // Use RLS context - all queries will be automatically filtered
    const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
      // Get courier's company info (RLS filters by courier_id)
      const courierInfoResult = await client.query(
        `SELECT 
           courier_id,
           courier_name,
           logo_url,
           description,
           trust_score,
           is_active,
           service_areas,
           contact_email,
           contact_phone
         FROM couriers 
         WHERE courier_id = $1`,
        [courierId]
      );

      const courierInfo = courierInfoResult.rows[0];

      // Get courier's deliveries (RLS automatically filters by courier_id)
      const deliveriesResult = await client.query(
        `SELECT 
           o.order_id,
           o.order_number,
           o.order_status as status,
           o.tracking_number,
           o.created_at,
           o.updated_at,
           o.delivery_date,
           s.shop_name,
           o.delivery_address,
           o.delivery_city,
           o.delivery_postal_code
         FROM orders o
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         ORDER BY o.created_at DESC
         LIMIT 10`
      );

      // Get courier's performance statistics
      const statsResult = await client.query(
        `SELECT 
           COUNT(*) as total_deliveries,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_deliveries,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_deliveries,
           COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_deliveries,
           COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_deliveries,
           AVG(CASE WHEN status = 'delivered' AND delivered_on_time THEN 100 ELSE 0 END) as on_time_rate,
           AVG(delivery_rating) as avg_rating,
           COUNT(DISTINCT shop_id) as unique_merchants
         FROM orders 
         WHERE courier_id = $1`,
        [courierId]
      );

      // Get courier's reviews
      const reviewsResult = await client.query(
        `SELECT 
           r.review_id,
           r.rating,
           r.review_text as comment,
           r.created_at,
           s.shop_name as merchant_name,
           o.order_number
         FROM reviews r
         JOIN orders o ON r.order_id = o.order_id
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         WHERE o.courier_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10`,
        [courierId]
      );

      // Get courier's team members
      const teamResult = await client.query(
        `SELECT 
           tm.member_id,
           tm.first_name,
           tm.last_name,
           tm.email,
           tm.role,
           tm.is_active,
           tm.created_at
         FROM team_members tm
         WHERE tm.courier_id = $1
         ORDER BY tm.created_at DESC`,
        [courierId]
      );

      // Get lead marketplace stats
      const leadsResult = await client.query(
        `SELECT 
           COUNT(*) as available_leads,
           COUNT(CASE WHEN purchased_by = $1 THEN 1 END) as purchased_leads
         FROM merchant_leads
         WHERE status = 'active' OR purchased_by = $1`,
        [courierId]
      );

      // Get subscription info
      const subscriptionResult = await client.query(
        `SELECT 
           sp.plan_name,
           sp.tier,
           sp.max_team_members,
           us.status as subscription_status,
           us.current_period_end
         FROM user_subscriptions us
         JOIN subscription_plans sp ON us.plan_id = sp.plan_id
         WHERE us.user_id = $1 AND us.status = 'active'
         LIMIT 1`,
        [courierId]
      );

      const stats = statsResult.rows[0];
      const leads = leadsResult.rows[0];
      const subscription = subscriptionResult.rows[0] || {
        plan_name: 'Free',
        tier: 0,
        max_team_members: 1
      };

      return {
        courierInfo: courierInfo,
        deliveries: deliveriesResult.rows,
        statistics: {
          total_deliveries: parseInt(stats.total_deliveries) || 0,
          completed_deliveries: parseInt(stats.completed_deliveries) || 0,
          pending_deliveries: parseInt(stats.pending_deliveries) || 0,
          in_transit_deliveries: parseInt(stats.in_transit_deliveries) || 0,
          cancelled_deliveries: parseInt(stats.cancelled_deliveries) || 0,
          on_time_rate: parseFloat(stats.on_time_rate) || 0,
          avg_rating: parseFloat(stats.avg_rating) || 0,
          unique_merchants: parseInt(stats.unique_merchants) || 0,
          trust_score: courierInfo?.trust_score || 0
        },
        reviews: reviewsResult.rows,
        team: teamResult.rows,
        leads: {
          available: parseInt(leads.available_leads) || 0,
          purchased: parseInt(leads.purchased_leads) || 0
        },
        subscription: subscription
      };
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Courier dashboard API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
