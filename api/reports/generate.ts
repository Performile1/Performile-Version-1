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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = verifyUser(req);
    const userId = user.user_id;

    const {
      report_type,
      report_format = 'pdf',
      date_from,
      date_to,
      filters = {},
    } = req.body;

    if (!report_type) {
      return res.status(400).json({
        success: false,
        message: 'report_type is required',
      });
    }

    const client = await pool.connect();
    try {
      // Check subscription limits
      const quotaResult = await client.query(
        'SELECT * FROM get_report_quota_usage($1)',
        [userId]
      );

      const quota = quotaResult.rows[0];
      if (!quota?.can_generate) {
        return res.status(403).json({
          success: false,
          message: 'Report generation limit reached. Please upgrade your plan.',
          quota: {
            used: quota?.reports_this_month || 0,
            limit: quota?.reports_limit || 0,
          },
        });
      }

      // Create report record
      const reportResult = await client.query(
        `INSERT INTO generated_reports (
          user_id,
          report_type,
          report_format,
          date_from,
          date_to,
          filters,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *`,
        [
          userId,
          report_type,
          report_format,
          date_from || null,
          date_to || null,
          JSON.stringify(filters),
        ]
      );

      const report = reportResult.rows[0];

      // In production, this would trigger a background job
      // For now, we'll return the pending report
      // The actual report generation would be handled by a separate worker

      return res.status(201).json({
        success: true,
        data: {
          report_id: report.report_id,
          status: report.status,
          report_type: report.report_type,
          report_format: report.report_format,
          created_at: report.created_at,
          message: 'Report generation started. You will be notified when it is ready.',
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Generate report API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
