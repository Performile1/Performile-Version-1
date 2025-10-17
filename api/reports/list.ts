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

    const { 
      limit = '20', 
      offset = '0',
      status,
      report_type,
    } = req.query;

    const client = await pool.connect();
    try {
      // Mark expired reports first
      await client.query('SELECT mark_expired_reports()');

      let query = `
        SELECT 
          report_id,
          user_id,
          report_type,
          report_format,
          date_from,
          date_to,
          filters,
          file_url,
          file_size_bytes,
          file_name,
          status,
          error_message,
          created_at,
          completed_at,
          expires_at,
          download_count
        FROM generated_reports
        WHERE user_id = $1
      `;

      const params: any[] = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
      }

      if (report_type) {
        paramCount++;
        query += ` AND report_type = $${paramCount}`;
        params.push(report_type);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await client.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) as count FROM generated_reports WHERE user_id = $1';
      const countParams: any[] = [userId];
      
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }

      const countResult = await client.query(countQuery, countParams);

      return res.status(200).json({
        success: true,
        data: {
          reports: result.rows,
          total: parseInt(countResult.rows[0]?.count || '0'),
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('List reports API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
