import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../../utils/env';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
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

      const result = await client.query(`
        SELECT * FROM admin_users_overview
        WHERE ${whereClause}
        ORDER BY created_at DESC
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
    console.error('Admin users API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
