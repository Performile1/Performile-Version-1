import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = (req as any).user;

  try {
    const result = await pool.query(
      'SELECT * FROM get_merchant_couriers($1)',
      [user.user_id]
    );

    return res.status(200).json({
      success: true,
      couriers: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching merchant couriers:', error);
    return res.status(500).json({
      error: 'Failed to fetch couriers',
      message: error.message
    });
  }
}
