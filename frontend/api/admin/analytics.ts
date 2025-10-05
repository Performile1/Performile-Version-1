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

      // Simplified query that works even if tables are empty
      const query = `
        SELECT 
          c.courier_id,
          c.courier_name,
          c.contact_email,
          c.contact_phone,
          c.description,
          c.is_active,
          c.created_at as courier_since,
          
          -- Order statistics
          COALESCE(COUNT(DISTINCT o.order_id), 0) as total_orders,
          COALESCE(COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END), 0) as delivered_orders,
          COALESCE(ROUND(
            (COUNT(DISTINCT CASE WHEN o.order_status = 'delivered' THEN o.order_id END)::NUMERIC / 
            NULLIF(COUNT(DISTINCT o.order_id), 0) * 100), 2
          ), 0) as delivery_success_rate,
          
          -- Delivery time statistics (in hours)
          COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (o.delivery_date - o.order_date)) / 3600) 
            FILTER (WHERE o.delivery_date IS NOT NULL), 2), 0) as avg_delivery_hours,
          
          -- Review statistics
          COALESCE(COUNT(DISTINCT r.review_id), 0) as total_reviews,
          COALESCE(ROUND(AVG(r.rating), 2), 0) as avg_rating,
          
          -- Customer details
          COALESCE(COUNT(DISTINCT o.customer_email), 0) as unique_customers,
          COALESCE(COUNT(DISTINCT s.store_id), 0) as total_stores_served,
          
          -- Trust score (use avg_rating * 20 if TrustScoreCache doesn't exist)
          COALESCE(ROUND(AVG(r.rating) * 20, 2), 0) as overall_score
          
        FROM Couriers c
        LEFT JOIN Orders o ON c.courier_id = o.courier_id
        LEFT JOIN Stores s ON o.store_id = s.store_id
        LEFT JOIN Reviews r ON c.courier_id = r.courier_id
        WHERE ${whereClause}
        GROUP BY c.courier_id, c.courier_name, c.contact_email, c.contact_phone, 
                 c.description, c.is_active, c.created_at
        ORDER BY c.courier_name
      `;

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
