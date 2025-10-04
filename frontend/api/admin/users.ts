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
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  if (decoded.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return decoded;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    verifyAdmin(req);
    
    const { role, search, status } = req.query;

    const client = await pool.connect();
    try {
      let whereClause = '1=1';
      const params: any[] = [];
      let paramCount = 0;

      // Filter by role
      if (role && role !== 'all') {
        whereClause += ` AND user_role = $${++paramCount}`;
        params.push(role);
      }

      // Search filter
      if (search) {
        whereClause += ` AND (email ILIKE $${++paramCount} OR first_name ILIKE $${++paramCount} OR last_name ILIKE $${++paramCount})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      // Status filter
      if (status === 'active') {
        whereClause += ` AND is_active = true`;
      } else if (status === 'inactive') {
        whereClause += ` AND is_active = false`;
      }

      // Simple query - just get users for now
      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.user_role,
          u.is_active,
          u.is_verified,
          u.created_at,
          u.last_login,
          'tier1' as subscription_tier,
          0 as store_count,
          0 as leads_posted,
          0 as active_leads,
          0 as leads_downloaded,
          0 as total_deliveries,
          0 as successful_deliveries,
          0.0 as avg_rating,
          0 as total_reviews,
          0.0 as trust_score,
          0 as revenue_generated
        FROM Users u
        WHERE ${whereClause}
        ORDER BY u.created_at DESC
      `;

      const result = await client.query(query, params);

      return res.status(200).json({
        success: true,
        data: result.rows,
        total: result.rows.length
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Admin users API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
