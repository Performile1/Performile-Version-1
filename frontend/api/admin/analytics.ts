import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// Inline JWT helper
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Verify admin token
const verifyAdmin = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    
    // Check role field (JWT uses 'role' not 'user_role')
    if (decoded.role !== 'admin') {
      throw new Error('Admin access required');
    }
    
    return decoded;
  } catch (error: any) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    verifyAdmin(req);
    
    const {
      courier_id,
      start_date,
      end_date,
      time_of_day, // morning, afternoon, evening, night
      postal_code,
      country,
      compare = 'false' // Compare all couriers
    } = req.query;

    const client = await pool.connect();
    try {
      let whereClause = '1=1';
      const params: any[] = [];
      let paramCount = 0;

      // Specific courier filter
      if (courier_id && compare === 'false') {
        whereClause += ` AND c.courier_id = $${++paramCount}`;
        params.push(courier_id);
      }

      // Date range filter
      if (start_date) {
        whereClause += ` AND o.order_date >= $${++paramCount}`;
        params.push(start_date);
      }
      if (end_date) {
        whereClause += ` AND o.order_date <= $${++paramCount}`;
        params.push(end_date);
      }

      // Time of day filter
      if (time_of_day) {
        const timeRanges: Record<string, string> = {
          morning: "EXTRACT(HOUR FROM o.order_date) BETWEEN 6 AND 11",
          afternoon: "EXTRACT(HOUR FROM o.order_date) BETWEEN 12 AND 17",
          evening: "EXTRACT(HOUR FROM o.order_date) BETWEEN 18 AND 22",
          night: "EXTRACT(HOUR FROM o.order_date) NOT BETWEEN 6 AND 22"
        };
        if (timeRanges[time_of_day as string]) {
          whereClause += ` AND ${timeRanges[time_of_day as string]}`;
        }
      }

      // Postal code filter (partial match)
      if (postal_code) {
        whereClause += ` AND o.delivery_address ILIKE $${++paramCount}`;
        params.push(`%${postal_code}%`);
      }

      // Country filter
      if (country) {
        whereClause += ` AND o.delivery_address ILIKE $${++paramCount}`;
        params.push(`%${country}%`);
      }

      const query = `
        SELECT 
          c.courier_id,
          c.courier_name,
          c.contact_email,
          c.contact_phone,
          c.description,
          c.is_active,
          c.created_at as courier_since,
          
          -- Order statistics (FULL TRANSPARENCY - NO ANONYMIZATION)
          COUNT(DISTINCT o.order_id) as total_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END) as delivered_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'cancelled' THEN o.order_id END) as cancelled_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'pending' THEN o.order_id END) as pending_orders,
          COUNT(DISTINCT CASE WHEN o.order_status = 'in_transit' THEN o.order_id END) as in_transit_orders,
          ROUND(
            (COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
            NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2
          ) as delivery_success_rate,
          
          -- Delivery time statistics (in hours)
          ROUND(AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) 
            FILTER (WHERE o.delivery_date IS NOT NULL), 2) as avg_delivery_hours,
          ROUND(MIN(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) 
            FILTER (WHERE o.delivery_date IS NOT NULL), 2) as min_delivery_hours,
          ROUND(MAX(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) 
            FILTER (WHERE o.delivery_date IS NOT NULL), 2) as max_delivery_hours,
          
          -- Review statistics
          COUNT(DISTINCT r.review_id) as total_reviews,
          ROUND(AVG(r.rating), 2) as avg_rating,
          ROUND(AVG(r.delivery_speed_rating), 2) as avg_delivery_speed,
          ROUND(AVG(r.package_condition_rating), 2) as avg_package_condition,
          ROUND(AVG(r.communication_rating), 2) as avg_communication,
          
          -- Rating distribution
          COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_count,
          COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_count,
          COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_count,
          COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_count,
          COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_count,
          
          -- Geographic distribution (DETAILED - Admin sees exact numbers)
          COUNT(DISTINCT CASE WHEN o.delivery_address ILIKE '%Sweden%' THEN o.order_id END) as orders_sweden,
          COUNT(DISTINCT CASE WHEN o.delivery_address ILIKE '%Norway%' THEN o.order_id END) as orders_norway,
          COUNT(DISTINCT CASE WHEN o.delivery_address ILIKE '%Denmark%' THEN o.order_id END) as orders_denmark,
          
          -- Customer details (ADMIN ONLY - Full transparency)
          COUNT(DISTINCT o.customer_email) as unique_customers,
          ARRAY_AGG(DISTINCT s.store_name) FILTER (WHERE s.store_name IS NOT NULL) as stores_served,
          COUNT(DISTINCT s.store_id) as total_stores_served,
          
          -- Time distribution
          COUNT(DISTINCT CASE WHEN EXTRACT(HOUR FROM o.order_date) BETWEEN 6 AND 11 THEN o.order_id END) as orders_morning,
          COUNT(DISTINCT CASE WHEN EXTRACT(HOUR FROM o.order_date) BETWEEN 12 AND 17 THEN o.order_id END) as orders_afternoon,
          COUNT(DISTINCT CASE WHEN EXTRACT(HOUR FROM o.order_date) BETWEEN 18 AND 22 THEN o.order_id END) as orders_evening,
          COUNT(DISTINCT CASE WHEN EXTRACT(HOUR FROM o.order_date) NOT BETWEEN 6 AND 22 THEN o.order_id END) as orders_night,
          
          -- Time period
          MIN(o.order_date) as first_order_date,
          MAX(o.order_date) as last_order_date,
          
          -- Trust score
          t.overall_score,
          t.total_reviews as cached_total_reviews
          
        FROM Couriers c
        LEFT JOIN Orders o ON c.courier_id = o.courier_id
        LEFT JOIN Stores s ON o.store_id = s.store_id
        LEFT JOIN Reviews r ON c.courier_id = r.courier_id AND r.order_id = o.order_id
        LEFT JOIN TrustScoreCache t ON c.courier_id = t.courier_id
        WHERE ${whereClause}
        GROUP BY c.courier_id, c.courier_name, c.contact_email, c.contact_phone, 
                 c.description, c.is_active, c.created_at, t.overall_score, t.total_reviews
        ORDER BY 
          CASE WHEN $${++paramCount} = 'true' THEN avg_rating ELSE NULL END DESC NULLS LAST,
          c.courier_name
      `;

      params.push(compare);

      const result = await client.query(query, params);

      // Calculate rankings if comparing
      let rankings = null;
      if (compare === 'true' && result.rows.length > 1) {
        rankings = {
          best_delivery_speed: result.rows.reduce((prev, curr) => 
            (curr.avg_delivery_hours && (!prev.avg_delivery_hours || curr.avg_delivery_hours < prev.avg_delivery_hours)) ? curr : prev
          ),
          best_rating: result.rows.reduce((prev, curr) => 
            (curr.avg_rating && curr.avg_rating > (prev.avg_rating || 0)) ? curr : prev
          ),
          best_success_rate: result.rows.reduce((prev, curr) => 
            (curr.delivery_success_rate && curr.delivery_success_rate > (prev.delivery_success_rate || 0)) ? curr : prev
          ),
          most_orders: result.rows.reduce((prev, curr) => 
            (curr.total_orders > (prev.total_orders || 0)) ? curr : prev
          )
        };
      }

      return res.status(200).json({
        success: true,
        data: result.rows,
        rankings,
        filters: {
          courier_id,
          start_date,
          end_date,
          time_of_day,
          postal_code,
          country,
          compare: compare === 'true'
        },
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Admin analytics API error:', error);
    console.error('Error stack:', error.stack);
    
    // Return appropriate status code
    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(403).json({ 
        success: false,
        message: error.message || 'Access denied'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
