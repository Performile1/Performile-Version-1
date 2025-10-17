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

// Verify token
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
    
    const { country, city, postal_code, search } = req.query;

    const client = await pool.connect();
    try {
      let whereClause = 'is_active = true';
      const params: any[] = [];
      let paramCount = 0;

      if (country) {
        whereClause += ` AND country = $${++paramCount}`;
        params.push(country);
      }

      if (city) {
        whereClause += ` AND city ILIKE $${++paramCount}`;
        params.push(`%${city}%`);
      }

      if (postal_code) {
        whereClause += ` AND postal_code = $${++paramCount}`;
        params.push(postal_code);
      }

      if (search) {
        whereClause += ` AND (postal_code ILIKE $${++paramCount} OR city ILIKE $${++paramCount})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      const result = await client.query(`
        SELECT 
          postal_code_id,
          postal_code,
          city,
          state_province,
          country,
          latitude,
          longitude,
          is_active
        FROM postal_codes
        WHERE ${whereClause}
        ORDER BY country, city, postal_code
        LIMIT 100
      `, params);

      return res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Postal codes API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
