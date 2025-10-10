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
  const { courier_id, is_active } = req.body;

  if (!courier_id || is_active === undefined) {
    return res.status(400).json({ error: 'Courier ID and is_active are required' });
  }

  try {
    await pool.query(
      `UPDATE merchant_couriers 
       SET is_active = $1, updated_at = NOW()
       WHERE merchant_id = $2 AND courier_id = $3`,
      [is_active, user.user_id, courier_id]
    );

    return res.status(200).json({
      success: true,
      message: is_active ? 'Courier enabled' : 'Courier disabled'
    });

  } catch (error: any) {
    console.error('Error toggling courier:', error);
    return res.status(500).json({
      error: 'Failed to update courier',
      message: error.message
    });
  }
}
