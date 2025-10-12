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
          us.status,
          us.current_period_start,
          us.current_period_end,
          CASE 
            WHEN us.billing_cycle = 'monthly' THEN sp.price_per_month
            WHEN us.billing_cycle = 'yearly' THEN sp.price_per_year
            ELSE sp.price_per_month
          END as price,
          us.billing_cycle,
          us.stripe_subscription_id,
          us.stripe_customer_id
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.subscription_plan_id = sp.subscription_plan_id
        WHERE us.user_id = $1
        ORDER BY us.created_at DESC
        LIMIT 1
      `, [user.user_id]);

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
