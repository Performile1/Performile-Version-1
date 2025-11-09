import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

/**
 * Get Consumer Dashboard Statistics
 * GET /api/consumer/dashboard-stats
 * 
 * Returns:
 * - totalOrders: Total number of orders
 * - activeShipments: Orders currently in transit
 * - pendingClaims: Claims awaiting resolution
 * - c2cShipments: C2C shipments created
 */
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

  // Validate user is a consumer
  if (user.user_role !== 'consumer') {
    return res.status(403).json({ error: 'Access denied. Consumer role required.' });
  }

  try {
    // Get total orders
    const ordersQuery = await pool.query(
      `SELECT COUNT(*) as total 
       FROM orders 
       WHERE consumer_id = $1`,
      [user.user_id]
    );

    // Get active shipments (in transit)
    const activeQuery = await pool.query(
      `SELECT COUNT(*) as total 
       FROM orders 
       WHERE consumer_id = $1 
         AND status IN ('pending', 'in_transit', 'out_for_delivery')`,
      [user.user_id]
    );

    // Get pending claims
    const claimsQuery = await pool.query(
      `SELECT COUNT(*) as total 
       FROM claims 
       WHERE user_id = $1 
         AND status = 'pending'`,
      [user.user_id]
    );

    // Get C2C shipments
    const c2cQuery = await pool.query(
      `SELECT COUNT(*) as total 
       FROM orders 
       WHERE sender_id = $1 
         AND order_type = 'c2c'`,
      [user.user_id]
    );

    const stats = {
      totalOrders: parseInt(ordersQuery.rows[0]?.total || '0'),
      activeShipments: parseInt(activeQuery.rows[0]?.total || '0'),
      pendingClaims: parseInt(claimsQuery.rows[0]?.total || '0'),
      c2cShipments: parseInt(c2cQuery.rows[0]?.total || '0'),
    };

    return res.status(200).json(stats);

  } catch (error: any) {
    console.error('[Consumer Dashboard Stats] Error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message,
    });
  }
}
