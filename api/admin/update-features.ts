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
    verifyAdmin(req);
    const { planId } = req.query;
    const { features } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: 'planId is required',
      });
    }

    if (!features || typeof features !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'features object is required',
      });
    }

    const client = await pool.connect();
    try {
      // Update plan features
      const result = await client.query(
        `UPDATE subscription_plans 
         SET features = $1, updated_at = NOW()
         WHERE plan_id = $2
         RETURNING *`,
        [JSON.stringify(features), planId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Subscription plan not found',
        });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Update features API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
