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
    const { report_id } = req.query;

    if (!report_id) {
      return res.status(400).json({
        success: false,
        message: 'report_id is required',
      });
    }

    const client = await pool.connect();
    try {
      // Get report
      const result = await client.query(
        `SELECT 
          report_id,
          user_id,
          report_type,
          report_format,
          file_url,
          file_name,
          status,
          expires_at,
          download_count
        FROM generated_reports
        WHERE report_id = $1 AND user_id = $2`,
        [report_id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Report not found',
        });
      }

      const report = result.rows[0];

      // Check status
      if (report.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: `Report is not ready. Current status: ${report.status}`,
        });
      }

      // Check expiration
      if (report.expires_at && new Date(report.expires_at) < new Date()) {
        return res.status(410).json({
          success: false,
          message: 'Report has expired',
        });
      }

      // Update download tracking
      await client.query(
        `UPDATE generated_reports 
         SET download_count = download_count + 1,
             downloaded_at = NOW()
         WHERE report_id = $1`,
        [report_id]
      );

      // In production, this would redirect to the file URL (S3, etc.)
      // For now, return the file URL
      return res.status(200).json({
        success: true,
        data: {
          report_id: report.report_id,
          file_url: report.file_url,
          file_name: report.file_name,
          report_format: report.report_format,
          expires_at: report.expires_at,
          download_count: report.download_count + 1,
        },
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Download report API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
