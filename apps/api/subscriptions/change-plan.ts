import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import Stripe from 'stripe';
import { applySecurityMiddleware } from '../middleware/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const pool = getPool();

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
  const { newPlanId, reason } = req.body;

  if (!newPlanId) {
    return res.status(400).json({ error: 'New plan ID is required' });
  }

  try {
    // Process plan change and get details
    const changeResult = await pool.query(
      'SELECT * FROM process_plan_change($1, $2, $3)',
      [user.user_id, newPlanId, reason]
    );

    const change = changeResult.rows[0];

    if (!change.success) {
      return res.status(400).json({
        error: 'Plan change failed',
        message: change.message,
      });
    }

    // If requires payment, create checkout session
    if (change.requires_payment) {
      // Get new plan details
      const planQuery = await pool.query(
        'SELECT * FROM subscription_plans WHERE plan_id = $1',
        [newPlanId]
      );
      const newPlan = planQuery.rows[0];

      // Get or create Stripe customer
      const userQuery = await pool.query(
        'SELECT stripe_customer_id FROM users WHERE user_id = $1',
        [user.user_id]
      );

      let customerId = userQuery.rows[0]?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          metadata: { user_id: user.user_id },
        });
        customerId = customer.id;

        await pool.query(
          'UPDATE users SET stripe_customer_id = $1 WHERE user_id = $2',
          [customerId, user.user_id]
        );
      }

      // Get current subscription
      const currentSubQuery = await pool.query(
        'SELECT stripe_subscription_id FROM user_subscriptions WHERE user_id = $1 AND status IN ($2, $3) ORDER BY created_at DESC LIMIT 1',
        [user.user_id, 'active', 'trialing']
      );

      const currentStripeSubId = currentSubQuery.rows[0]?.stripe_subscription_id;

      if (currentStripeSubId) {
        // Update existing Stripe subscription
        const subscription = await stripe.subscriptions.retrieve(currentStripeSubId);
        
        // Get or create new price
        let priceId = newPlan.stripe_price_id;
        if (!priceId) {
          const price = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(newPlan.monthly_price * 100),
            recurring: { interval: 'month' },
            product_data: {
              name: newPlan.plan_name,
            },
          });
          priceId = price.id;

          await pool.query(
            'UPDATE subscription_plans SET stripe_price_id = $1 WHERE plan_id = $2',
            [priceId, newPlanId]
          );
        }

        // Update subscription
        await stripe.subscriptions.update(currentStripeSubId, {
          items: [{
            id: subscription.items.data[0].id,
            price: priceId,
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            plan_id: newPlanId.toString(),
            change_id: change.change_id.toString(),
          },
        });

        // Update database
        await pool.query(
          `UPDATE user_subscriptions 
           SET plan_id = $1, 
               previous_plan_id = $2,
               plan_changes_count = plan_changes_count + 1,
               last_plan_change_at = NOW()
           WHERE stripe_subscription_id = $3`,
          [newPlanId, subscription.metadata.plan_id, currentStripeSubId]
        );

        await pool.query(
          'UPDATE subscription_plan_changes SET status = $1, completed_at = NOW() WHERE change_id = $2',
          ['completed', change.change_id]
        );

        return res.status(200).json({
          success: true,
          message: 'Plan changed successfully',
          changeType: 'immediate',
          requiresPayment: true,
        });
      } else {
        // No existing subscription, create checkout session
        return res.status(200).json({
          success: true,
          message: 'Checkout required',
          changeId: change.change_id,
          requiresPayment: true,
          requiresCheckout: true,
          planId: newPlanId,
        });
      }
    } else if (change.has_trial) {
      // Free trial - create checkout session with trial
      return res.status(200).json({
        success: true,
        message: 'Eligible for free trial',
        changeId: change.change_id,
        requiresPayment: false,
        hasTrial: true,
        requiresCheckout: true,
        planId: newPlanId,
      });
    } else {
      // Downgrade - schedule for end of period
      const currentSubQuery = await pool.query(
        'SELECT current_period_end FROM user_subscriptions WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
        [user.user_id, 'active']
      );

      const periodEnd = currentSubQuery.rows[0]?.current_period_end;

      await pool.query(
        `UPDATE user_subscriptions 
         SET scheduled_plan_change_id = $1,
             scheduled_plan_change_date = $2
         WHERE user_id = $3 AND status = $4`,
        [newPlanId, periodEnd, user.user_id, 'active']
      );

      return res.status(200).json({
        success: true,
        message: 'Plan change scheduled for end of billing period',
        changeType: 'scheduled',
        effectiveDate: periodEnd,
        requiresPayment: false,
      });
    }
  } catch (error: any) {
    console.error('Plan change error:', error);
    return res.status(500).json({
      error: 'Failed to change plan',
      message: error.message,
    });
  }
}
