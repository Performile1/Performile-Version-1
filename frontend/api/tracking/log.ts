import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    trackingNumber,
    courier,
    endpoint,
    method,
    status,
    responseTime,
    isError,
    errorMessage
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO tracking_api_logs (
        tracking_number, courier, endpoint, request_method,
        response_status, response_time_ms, is_error, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [trackingNumber, courier, endpoint, method, status, responseTime, isError, errorMessage]
    );

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Error logging tracking request:', error);
    // Don't fail the request if logging fails
    return res.status(200).json({ success: false });
  }
}
