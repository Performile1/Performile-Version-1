import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = (req as any).user;
  const { courier_id } = req.body;

  if (!courier_id) {
    return res.status(400).json({ error: 'Courier ID is required' });
  }

  try {
    const result = await pool.query(
      'SELECT remove_courier_from_merchant($1, $2)',
      [user.user_id, courier_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Courier removed successfully'
    });

  } catch (error: any) {
    console.error('Error removing courier:', error);
    return res.status(500).json({
      error: 'Failed to remove courier',
      message: error.message
    });
  }
}
