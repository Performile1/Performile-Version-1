import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/db';
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
const verifyToken = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    return decoded;
  } catch (error: any) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle SSE stream requests
  if (req.query.stream === 'true') {
    // SSE not supported in serverless - return empty for now
    return res.status(200).json({ 
      success: true, 
      message: 'SSE not supported in serverless environment',
      data: []
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyToken(req);
    
    const client = await pool.connect();
    try {
      // Simple query - return empty notifications for now
      // TODO: Implement actual notifications table and queries
      const result = {
        rows: []
      };

      return res.status(200).json({
        success: true,
        data: result.rows,
        unreadCount: 0
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Notifications API error:', error);
    
    if (error.message.includes('token')) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
