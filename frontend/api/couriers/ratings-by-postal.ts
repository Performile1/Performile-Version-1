import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

interface CourierRating {
  courier_id: string;
  courier_name: string;
  company_name: string;
  logo_url: string | null;
  trust_score: number;
  total_reviews: number;
  avg_delivery_days: number;
  on_time_percentage: number;
  recent_reviews: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false, // Public endpoint for consumers
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postal_code, limit = '5' } = req.query;

  if (!postal_code || typeof postal_code !== 'string') {
    return res.status(400).json({ 
      error: 'Postal code is required',
      message: 'Please provide a valid postal_code parameter'
    });
  }

  try {
    // Normalize postal code (remove spaces, uppercase)
    const normalizedPostal = postal_code.replace(/\s/g, '').toUpperCase();
    
    // Extract first 3 digits for area matching (Swedish postal codes)
    const postalArea = normalizedPostal.substring(0, 3);

    // Get top-rated couriers in this postal area
    const query = `
      WITH courier_stats AS (
        SELECT 
          c.courier_id,
          c.courier_name,
          c.company_name,
          c.logo_url,
          
          -- Trust Score (average rating)
          COALESCE(AVG(r.rating), 0) as trust_score,
          
          -- Total reviews
          COUNT(DISTINCT r.review_id) as total_reviews,
          
          -- Recent reviews (last 3 months)
          COUNT(DISTINCT CASE 
            WHEN r.created_at > NOW() - INTERVAL '3 months' 
            THEN r.review_id 
          END) as recent_reviews,
          
          -- Average delivery time in days
          COALESCE(
            AVG(
              EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 86400
            ), 
            0
          ) as avg_delivery_days,
          
          -- On-time delivery percentage
          COALESCE(
            (COUNT(CASE 
              WHEN o.status = 'delivered' 
                AND o.delivered_at <= o.estimated_delivery 
              THEN 1 
            END)::float / 
            NULLIF(COUNT(CASE WHEN o.status = 'delivered' THEN 1 END), 0)) * 100,
            0
          ) as on_time_percentage
          
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        
        WHERE 
          -- Match postal area (first 3 digits)
          (o.delivery_postal_code LIKE $1 OR o.pickup_postal_code LIKE $1)
          -- Only recent data (last 6 months)
          AND o.created_at > NOW() - INTERVAL '6 months'
          -- Only active couriers
          AND c.is_active = true
          
        GROUP BY c.courier_id, c.courier_name, c.company_name, c.logo_url
      )
      
      SELECT 
        courier_id,
        courier_name,
        company_name,
        logo_url,
        ROUND(trust_score::numeric, 1) as trust_score,
        total_reviews,
        recent_reviews,
        ROUND(avg_delivery_days::numeric, 1) as avg_delivery_days,
        ROUND(on_time_percentage::numeric, 1) as on_time_percentage
      FROM courier_stats
      
      WHERE 
        -- Must have at least 5 reviews to be listed
        total_reviews >= 5
        -- Must have at least 1 review in last 3 months (active)
        AND recent_reviews >= 1
        
      ORDER BY 
        -- Primary: Trust score
        trust_score DESC,
        -- Secondary: Number of reviews (credibility)
        total_reviews DESC,
        -- Tertiary: On-time percentage
        on_time_percentage DESC
        
      LIMIT $2;
    `;

    const result = await pool.query(query, [
      `${postalArea}%`,
      parseInt(limit as string, 10)
    ]);

    // If no couriers found in specific area, get top national couriers
    let couriers = result.rows;
    
    if (couriers.length === 0) {
      const nationalQuery = `
        SELECT 
          c.courier_id,
          c.courier_name,
          c.company_name,
          c.logo_url,
          ROUND(COALESCE(AVG(r.rating), 0)::numeric, 1) as trust_score,
          COUNT(DISTINCT r.review_id) as total_reviews,
          COUNT(DISTINCT CASE 
            WHEN r.created_at > NOW() - INTERVAL '3 months' 
            THEN r.review_id 
          END) as recent_reviews,
          ROUND(COALESCE(
            AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 86400), 
            0
          )::numeric, 1) as avg_delivery_days,
          ROUND(COALESCE(
            (COUNT(CASE 
              WHEN o.status = 'delivered' 
                AND o.delivered_at <= o.estimated_delivery 
              THEN 1 
            END)::float / 
            NULLIF(COUNT(CASE WHEN o.status = 'delivered' THEN 1 END), 0)) * 100,
            0
          )::numeric, 1) as on_time_percentage
        FROM couriers c
        LEFT JOIN orders o ON c.courier_id = o.courier_id
        LEFT JOIN reviews r ON o.order_id = r.order_id
        WHERE 
          c.is_active = true
          AND o.created_at > NOW() - INTERVAL '6 months'
        GROUP BY c.courier_id, c.courier_name, c.company_name, c.logo_url
        HAVING COUNT(DISTINCT r.review_id) >= 5
        ORDER BY 
          COALESCE(AVG(r.rating), 0) DESC,
          COUNT(DISTINCT r.review_id) DESC
        LIMIT $1;
      `;
      
      const nationalResult = await pool.query(nationalQuery, [
        parseInt(limit as string, 10)
      ]);
      
      couriers = nationalResult.rows;
    }

    // Format response
    const formattedCouriers = couriers.map((courier: CourierRating) => ({
      courier_id: courier.courier_id,
      courier_name: courier.courier_name,
      company_name: courier.company_name,
      logo_url: courier.logo_url,
      trust_score: parseFloat(courier.trust_score.toString()),
      total_reviews: parseInt(courier.total_reviews.toString(), 10),
      avg_delivery_time: `${Math.round(courier.avg_delivery_days)}-${Math.round(courier.avg_delivery_days) + 1} days`,
      on_time_percentage: parseFloat(courier.on_time_percentage.toString()),
      badge: courier.trust_score >= 4.5 ? 'excellent' : 
             courier.trust_score >= 4.0 ? 'very_good' : 
             courier.trust_score >= 3.5 ? 'good' : 'average'
    }));

    return res.status(200).json({
      success: true,
      postal_code: normalizedPostal,
      postal_area: postalArea,
      couriers: formattedCouriers,
      total_found: formattedCouriers.length,
      is_local_data: result.rows.length > 0,
      message: result.rows.length === 0 
        ? 'No local couriers found. Showing top national couriers.' 
        : `Found ${formattedCouriers.length} top-rated couriers in your area.`
    });

  } catch (error: any) {
    console.error('Error fetching courier ratings:', error);
    return res.status(500).json({
      error: 'Failed to fetch courier ratings',
      message: error.message
    });
  }
}
