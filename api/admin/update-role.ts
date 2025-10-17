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
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const admin = verifyAdmin(req);
    const { userId } = req.query;
    const { role } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId is required',
      });
    }

    if (!role || !['admin', 'merchant', 'courier', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid role is required (admin, merchant, courier, user)',
      });
    }

    const client = await pool.connect();
    try {
      // Update user role
      const result = await client.query(
        `UPDATE users 
         SET user_role = $1, updated_at = NOW()
         WHERE user_id = $2
         RETURNING user_id, email, full_name, user_role`,
        [role, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Log the role change (optional - create audit log table if needed)
      await client.query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, performed_by, details, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          'role_change',
          'user',
          userId,
          admin.user_id,
          JSON.stringify({ old_role: result.rows[0].user_role, new_role: role }),
        ]
      ).catch(() => {
        // Ignore if audit_logs table doesn't exist
      });

      return res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Update role API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
