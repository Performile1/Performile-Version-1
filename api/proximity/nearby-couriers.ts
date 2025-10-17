import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
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

const pool = getPool();

// Verify token and get user
const verifyUser = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  return decoded;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    verifyUser(req);
    
    const { 
      merchant_id, 
      delivery_postal_code, 
      max_distance_km = '50', 
      limit = '10' 
    } = req.query;

    if (!merchant_id) {
      return res.status(400).json({
        success: false,
        message: 'merchant_id is required'
      });
    }

    const client = await pool.connect();
    try {
      // Use the find_nearby_couriers function if it exists, otherwise fallback
      const result = await client.query(`
        SELECT 
          c.courier_id,
          c.courier_name,
          c.contact_email,
          c.contact_phone,
          c.latitude,
          c.longitude,
          c.service_range_km,
          c.postal_code_ranges,
          -- Calculate distance
          CASE 
            WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL 
              AND m.latitude IS NOT NULL AND m.longitude IS NOT NULL
            THEN (
              6371 * acos(
                cos(radians(m.latitude)) * cos(radians(c.latitude)) * 
                cos(radians(c.longitude) - radians(m.longitude)) + 
                sin(radians(m.latitude)) * sin(radians(c.latitude))
              )
            )
            ELSE NULL
          END as distance_km,
          -- Check postal code match (simplified)
          CASE 
            WHEN $2 IS NOT NULL AND c.postal_code_ranges IS NOT NULL
            THEN true
            ELSE false
          END as within_postal_range,
          -- Get average rating
          COALESCE(
            (SELECT AVG(rating) FROM reviews WHERE courier_id = c.courier_id),
            0
          ) as avg_rating
        FROM couriers c
        CROSS JOIN merchants m
        WHERE c.is_active = true
          AND m.merchant_id = $1
          AND c.latitude IS NOT NULL
          AND c.longitude IS NOT NULL
          AND m.latitude IS NOT NULL
          AND m.longitude IS NOT NULL
        HAVING distance_km IS NOT NULL AND distance_km <= $3
        ORDER BY distance_km ASC
        LIMIT $4
      `, [
        merchant_id,
        delivery_postal_code || null,
        parseInt(max_distance_km as string),
        parseInt(limit as string)
      ]);

      // Calculate match scores
      const couriers = result.rows.map(courier => {
        const distance = courier.distance_km;
        let distanceScore = 20;
        if (distance <= 10) distanceScore = 50;
        else if (distance <= 25) distanceScore = 40;
        else if (distance <= 50) distanceScore = 30;

        const postalScore = courier.within_postal_range ? 30 : 0;
        const ratingScore = Math.floor(courier.avg_rating * 4);
        const matchScore = distanceScore + postalScore + ratingScore;

        return {
          ...courier,
          match_score: matchScore
        };
      });

      // Sort by match score
      couriers.sort((a, b) => b.match_score - a.match_score);

      return res.status(200).json({
        success: true,
        data: couriers,
        total: couriers.length
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Nearby couriers API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
