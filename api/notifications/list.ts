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

// Verify user token
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
    const user = verifyUser(req);
    const userId = user.user_id;

    const { limit = '20', offset = '0', unread_only = 'false' } = req.query;

    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          notification_id,
          user_id,
          type,
          title,
          message,
          data,
          is_read,
          created_at,
          read_at
        FROM notifications
        WHERE user_id = $1
      `;

      const params: any[] = [userId];

      if (unread_only === 'true') {
        query += ' AND is_read = false';
      }

      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await client.query(query, params);

      // Get unread count
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
        [userId]
      );

      return res.status(200).json({
        success: true,
        data: {
          notifications: result.rows,
          unreadCount: parseInt(countResult.rows[0]?.count || '0'),
          total: result.rows.length,
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('List notifications API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
