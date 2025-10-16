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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = (req as any).user;

  try {
    const client = await pool.connect();
    
    try {
      // Get user's current active subscription
      const result = await client.query(`
        SELECT 
          us.subscription_id,
          sp.plan_name,
          sp.user_role,
          sp.features_json,
          sp.limits_json,
          us.status,
          us.start_date as current_period_start,
          us.end_date as current_period_end,
          sp.price_monthly as price,
          'monthly' as billing_cycle
        FROM "UserSubscriptions" us
        JOIN "SubscriptionPlans" sp ON us.plan_id = sp.plan_id
        WHERE us.user_id = $1
          AND us.status = 'active'
        ORDER BY us.start_date DESC
        LIMIT 1
      `, [user.userId || user.user_id]);

      if (result.rows.length === 0) {
        return res.status(200).json({
          success: true,
          subscription: null
        });
      }

      return res.status(200).json({
        success: true,
        subscription: result.rows[0]
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Get current subscription error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch subscription',
      error: error.message 
    });
  }
}
