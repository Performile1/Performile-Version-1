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
  
  if (!user || user.role !== 'consumer') {
    return res.status(403).json({ error: 'Consumers only' });
  }

  const consumerId = user.userId;

  try {
    // Use RLS context - all queries will be automatically filtered
    const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
      // Get consumer's orders (RLS automatically filters by consumer_id)
      const ordersResult = await client.query(
        `SELECT 
           o.order_id,
           o.order_number,
           o.status,
           o.tracking_number,
           o.total_amount,
           o.created_at,
           o.updated_at,
           o.delivery_date,
           o.estimated_delivery_date,
           s.shop_name,
           s.shop_logo_url,
           c.courier_name,
           c.logo_url as courier_logo_url,
           o.delivery_address,
           o.delivery_city,
           o.delivery_postal_code
         FROM orders o
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         LEFT JOIN couriers c ON o.courier_id = c.courier_id
         ORDER BY o.created_at DESC
         LIMIT 20`
      );

      // Get consumer's statistics
      const statsResult = await client.query(
        `SELECT 
           COUNT(*) as total_orders,
           SUM(total_amount) as total_spent,
           COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
           COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
           COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit_orders,
           COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
           COUNT(DISTINCT shop_id) as shops_ordered_from,
           COUNT(DISTINCT courier_id) as couriers_used
         FROM orders 
         WHERE consumer_id = $1`,
        [consumerId]
      );

      // Get consumer's saved addresses
      const addressesResult = await client.query(
        `SELECT 
           address_id,
           address_label,
           address_line1,
           address_line2,
           city,
           postal_code,
           country,
           is_default,
           created_at
         FROM consumer_addresses
         WHERE consumer_id = $1
         ORDER BY is_default DESC, created_at DESC`,
        [consumerId]
      );

      // Get consumer's favorite shops
      const favoritesResult = await client.query(
        `SELECT 
           s.shop_id,
           s.shop_name,
           s.shop_logo_url,
           s.description,
           COUNT(o.order_id) as order_count
         FROM favorite_shops fs
         JOIN shops s ON fs.shop_id = s.shop_id
         LEFT JOIN orders o ON s.shop_id = o.shop_id AND o.consumer_id = $1
         WHERE fs.consumer_id = $1
         GROUP BY s.shop_id, s.shop_name, s.shop_logo_url, s.description
         ORDER BY order_count DESC`,
        [consumerId]
      );

      // Get consumer's reviews
      const reviewsResult = await client.query(
        `SELECT 
           r.review_id,
           r.rating,
           r.review_text as comment,
           r.created_at,
           o.order_number,
           s.shop_name,
           c.courier_name
         FROM reviews r
         JOIN orders o ON r.order_id = o.order_id
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         LEFT JOIN couriers c ON o.courier_id = c.courier_id
         WHERE o.consumer_id = $1
         ORDER BY r.created_at DESC
         LIMIT 10`,
        [consumerId]
      );

      // Get active tracking info for in-transit orders
      const trackingResult = await client.query(
        `SELECT 
           o.order_id,
           o.order_number,
           o.tracking_number,
           o.status,
           o.estimated_delivery_date,
           s.shop_name,
           c.courier_name
         FROM orders o
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         LEFT JOIN couriers c ON o.courier_id = c.courier_id
         WHERE o.consumer_id = $1 
           AND o.status IN ('pending', 'processing', 'in_transit')
         ORDER BY o.created_at DESC`,
        [consumerId]
      );

      const stats = statsResult.rows[0];

      return {
        orders: ordersResult.rows,
        statistics: {
          total_orders: parseInt(stats.total_orders) || 0,
          total_spent: parseFloat(stats.total_spent) || 0,
          delivered_orders: parseInt(stats.delivered_orders) || 0,
          pending_orders: parseInt(stats.pending_orders) || 0,
          in_transit_orders: parseInt(stats.in_transit_orders) || 0,
          cancelled_orders: parseInt(stats.cancelled_orders) || 0,
          shops_ordered_from: parseInt(stats.shops_ordered_from) || 0,
          couriers_used: parseInt(stats.couriers_used) || 0
        },
        addresses: addressesResult.rows,
        favorites: favoritesResult.rows,
        reviews: reviewsResult.rows,
        activeTracking: trackingResult.rows
      };
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Consumer dashboard API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
