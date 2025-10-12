import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
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
    const {
      timeRange = 'month', // day, week, month, year
      startDate,
      endDate
    } = req.query;

    const client = await pool.connect();
    
    try {
      // Calculate date range
      let dateFilter = '';
      const params: any[] = [courierId];
      let paramCount = 1;

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

      // Get delivery trends over time (courier's deliveries only)
      const deliveryTrendsResult = await client.query(
        `SELECT 
           DATE(o.created_at) as date,
           COUNT(o.order_id) as delivery_count,
           COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as completed_count,
           COUNT(CASE WHEN o.delivered_on_time THEN 1 END) as on_time_count,
           AVG(o.delivery_rating) as avg_rating
         FROM orders o
         WHERE o.courier_id = $1
           ${dateFilter}
         GROUP BY DATE(o.created_at)
         ORDER BY date DESC
         LIMIT 90`,
        params
      );

      // Get performance by merchant
      const merchantPerformanceResult = await client.query(
        `SELECT 
           s.shop_id,
           s.shop_name,
           COUNT(o.order_id) as total_deliveries,
           COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as completed_deliveries,
           AVG(o.delivery_rating) as avg_rating,
           AVG(CASE WHEN o.delivered_on_time THEN 100 ELSE 0 END) as on_time_rate
         FROM orders o
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         WHERE o.courier_id = $1
           ${dateFilter}
         GROUP BY s.shop_id, s.shop_name
         ORDER BY total_deliveries DESC
         LIMIT 20`,
        params
      );

      // Get delivery status distribution
      const statusDistributionResult = await client.query(
        `SELECT 
           o.order_status as status,
           COUNT(*) as count,
           ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
         FROM orders o
         WHERE o.courier_id = $1
           ${dateFilter}
         GROUP BY o.order_status
         ORDER BY count DESC`,
        params
      );

      // Get delivery time analysis (by hour of day)
      const deliveryTimeResult = await client.query(
        `SELECT 
           EXTRACT(HOUR FROM o.created_at) as hour,
           COUNT(*) as delivery_count,
           AVG(CASE WHEN o.delivered_on_time THEN 100 ELSE 0 END) as on_time_rate
         FROM orders o
         WHERE o.courier_id = $1
           ${dateFilter}
         GROUP BY EXTRACT(HOUR FROM o.created_at)
         ORDER BY hour`,
        params
      );

      // Get geographic distribution (delivery areas)
      const geoDistributionResult = await client.query(
        `SELECT 
           o.delivery_city as city,
           o.delivery_postal_code as postal_code,
           COUNT(*) as delivery_count,
           AVG(CASE WHEN o.delivered_on_time THEN 100 ELSE 0 END) as on_time_rate,
           AVG(o.delivery_rating) as avg_rating
         FROM orders o
         WHERE o.courier_id = $1
           ${dateFilter}
           AND o.delivery_city IS NOT NULL
         GROUP BY o.delivery_city, o.delivery_postal_code
         ORDER BY delivery_count DESC
         LIMIT 20`,
        params
      );

      // Get rating distribution
      const ratingDistributionResult = await client.query(
        `SELECT 
           r.rating,
           COUNT(*) as count,
           ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
         FROM reviews r
         JOIN orders o ON r.order_id = o.order_id
         WHERE o.courier_id = $1
           ${dateFilter}
         GROUP BY r.rating
         ORDER BY r.rating DESC`,
        params
      );

      // Get recent reviews with details
      const recentReviewsResult = await client.query(
        `SELECT 
           r.review_id,
           r.rating,
           r.review_text as comment,
           r.created_at,
           o.order_number,
           s.shop_name as merchant_name
         FROM reviews r
         JOIN orders o ON r.order_id = o.order_id
         LEFT JOIN shops s ON o.shop_id = s.shop_id
         WHERE o.courier_id = $1
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [courierId]
      );

      // Get team member performance (if applicable)
      const teamPerformanceResult = await client.query(
        `SELECT 
           tm.member_id,
           tm.first_name,
           tm.last_name,
           tm.role,
           COUNT(o.order_id) as deliveries_assigned,
           COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as deliveries_completed
         FROM team_members tm
         LEFT JOIN orders o ON tm.member_id = o.assigned_driver_id
         WHERE tm.courier_id = $1
           AND tm.is_active = true
         GROUP BY tm.member_id, tm.first_name, tm.last_name, tm.role
         ORDER BY deliveries_assigned DESC`,
        [courierId]
      ).catch(() => ({ rows: [] })); // Gracefully handle if assigned_driver_id doesn't exist

      // Calculate summary statistics
      const summaryResult = await client.query(
        `SELECT 
           COUNT(DISTINCT o.order_id) as total_deliveries,
           COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END) as completed_deliveries,
           COUNT(CASE WHEN o.order_status = 'cancelled' THEN 1 END) as cancelled_deliveries,
           AVG(CASE WHEN o.delivered_on_time THEN 100 ELSE 0 END) as on_time_rate,
           AVG(o.delivery_rating) as avg_rating,
           COUNT(DISTINCT o.consumer_id) as unique_customers,
           COUNT(DISTINCT o.shop_id) as unique_merchants,
           COUNT(DISTINCT r.review_id) as total_reviews
         FROM orders o
         LEFT JOIN reviews r ON o.order_id = r.order_id
         WHERE o.courier_id = $1
           ${dateFilter}`,
        params
      );

      // Get TrustScore components
      const trustScoreResult = await client.query(
        `SELECT 
           trust_score,
           is_active
         FROM couriers
         WHERE courier_id = $1`,
        [courierId]
      );

      const summary = summaryResult.rows[0];
      const trustScore = trustScoreResult.rows[0];

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            total_deliveries: parseInt(summary.total_deliveries) || 0,
            completed_deliveries: parseInt(summary.completed_deliveries) || 0,
            cancelled_deliveries: parseInt(summary.cancelled_deliveries) || 0,
            on_time_rate: parseFloat(summary.on_time_rate) || 0,
            avg_rating: parseFloat(summary.avg_rating) || 0,
            unique_customers: parseInt(summary.unique_customers) || 0,
            unique_merchants: parseInt(summary.unique_merchants) || 0,
            total_reviews: parseInt(summary.total_reviews) || 0,
            trust_score: trustScore?.trust_score || 0,
            is_active: trustScore?.is_active || false
          },
          deliveryTrends: deliveryTrendsResult.rows,
          merchantPerformance: merchantPerformanceResult.rows,
          statusDistribution: statusDistributionResult.rows,
          deliveryTimeAnalysis: deliveryTimeResult.rows,
          geoDistribution: geoDistributionResult.rows,
          ratingDistribution: ratingDistributionResult.rows,
          recentReviews: recentReviewsResult.rows,
          teamPerformance: teamPerformanceResult.rows
        },
        filters: {
          timeRange,
          startDate,
          endDate
        }
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Courier analytics API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
