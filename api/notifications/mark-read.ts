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
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyUser(req);
    const userId = user.user_id;

    const { notification_id, mark_all = false } = req.body;

    const client = await pool.connect();
    try {
      if (mark_all) {
        // Mark all notifications as read
        await client.query(
          `UPDATE notifications 
           SET is_read = true, read_at = NOW() 
           WHERE user_id = $1 AND is_read = false`,
          [userId]
        );

        return res.status(200).json({
          success: true,
          message: 'All notifications marked as read',
        });
      } else {
        if (!notification_id) {
          return res.status(400).json({
            success: false,
            message: 'notification_id is required',
          });
        }

        // Mark single notification as read
        const result = await client.query(
          `UPDATE notifications 
           SET is_read = true, read_at = NOW() 
           WHERE notification_id = $1 AND user_id = $2
           RETURNING *`,
          [notification_id, userId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Notification not found',
          });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0],
        });
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Mark read API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
