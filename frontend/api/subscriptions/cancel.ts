import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import Stripe from 'stripe';
import { applySecurityMiddleware } from '../middleware/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

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
  const { 
    reason_category, 
    reason_text, 
    policy = '30_days' // Default to 30-day cancellation
  } = req.body;

  try {
    // Get current subscription
    const subQuery = await pool.query(
      `SELECT subscription_id, stripe_subscription_id, current_period_end, status
       FROM user_subscriptions 
       WHERE user_id = $1 AND status IN ($2, $3, $4)
       ORDER BY created_at DESC 
       LIMIT 1`,
      [user.user_id, 'active', 'trialing', 'past_due']
    );

    if (subQuery.rows.length === 0) {
      return res.status(404).json({
        error: 'No active subscription found',
      });
    }

    const subscription = subQuery.rows[0];

    // Calculate effective cancellation date
    const effectiveDateQuery = await pool.query(
      'SELECT calculate_cancellation_date($1, $2) as effective_date',
      [subscription.subscription_id, policy]
    );

    const effectiveDate = effectiveDateQuery.rows[0].effective_date;

    // Create cancellation request
    const cancellationQuery = await pool.query(
      `INSERT INTO subscription_cancellations (
        user_id, subscription_id, effective_date, policy_applied,
        reason_category, reason_text, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING cancellation_id, effective_date`,
      [
        user.user_id,
        subscription.subscription_id,
        effectiveDate,
        policy,
        reason_category,
        reason_text,
        'pending'
      ]
    );

    const cancellation = cancellationQuery.rows[0];

    // Update subscription in database
    await pool.query(
      `UPDATE user_subscriptions 
       SET cancel_at_period_end = TRUE,
           cancellation_requested_at = NOW(),
           cancellation_effective_date = $1,
           cancellation_policy = $2
       WHERE subscription_id = $3`,
      [effectiveDate, policy, subscription.subscription_id]
    );

    // Update Stripe subscription
    if (subscription.stripe_subscription_id) {
      if (policy === 'immediate') {
        // Cancel immediately
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
      } else {
        // Cancel at period end
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }
    }

    // Determine if refund is applicable (within 30 days and immediate cancellation)
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(subscription.current_period_end).getTime()) / (1000 * 60 * 60 * 24)
    );

    const refundApplicable = policy === 'immediate' && daysSinceStart <= 30;

    return res.status(200).json({
      success: true,
      message: 'Subscription cancellation scheduled',
      cancellationId: cancellation.cancellation_id,
      effectiveDate: cancellation.effective_date,
      policy: policy,
      refundApplicable,
      daysRemaining: policy === '30_days' ? 30 : 
                     policy === 'end_of_period' ? 
                     Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 
                     0,
    });
  } catch (error: any) {
    console.error('Cancellation error:', error);
    return res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error.message,
    });
  }
}
