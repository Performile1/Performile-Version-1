import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

router.use(authenticateToken);

/**
 * GET /api/subscriptions/current
 * Get current subscription for logged-in user
 */
router.get('/current', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    logger.info('[Subscriptions] Get current subscription', { userId });

    // Get user's current subscription
    const result = await database.query(
      `SELECT 
        us.subscription_id,
        us.user_id,
        us.tier,
        us.status,
        us.billing_cycle,
        us.amount,
        us.currency,
        us.start_date,
        us.end_date,
        us.auto_renew,
        us.stripe_subscription_id,
        us.stripe_customer_id,
        us.created_at,
        us.updated_at
      FROM user_subscriptions us
      WHERE us.user_id = $1
        AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        subscription: null,
        message: 'No active subscription found'
      });
    }

    const subscription = result.rows[0];

    // Get subscription features based on tier
    const features = getSubscriptionFeatures(subscription.tier);

    res.json({
      success: true,
      subscription: {
        ...subscription,
        features
      }
    });
  } catch (error) {
    logger.error('[Subscriptions] Get current error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription'
    });
  }
});

/**
 * GET /api/subscriptions/invoices
 * Get invoices for logged-in user
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    logger.info('[Subscriptions] Get invoices', { userId });

    // Get user's invoices
    const result = await database.query(
      `SELECT 
        invoice_id,
        user_id,
        amount,
        currency,
        status,
        invoice_date,
        due_date,
        paid_date,
        stripe_invoice_id,
        invoice_url,
        description,
        created_at
      FROM invoices
      WHERE user_id = $1
      ORDER BY invoice_date DESC
      LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      invoices: result.rows
    });
  } catch (error) {
    logger.error('[Subscriptions] Get invoices error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices'
    });
  }
});

/**
 * POST /api/subscriptions/update-payment-method
 * Update payment method (creates Stripe checkout session)
 */
router.post('/update-payment-method', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    logger.info('[Subscriptions] Update payment method', { userId });

    // Get user's subscription
    const subResult = await database.query(
      `SELECT stripe_customer_id, stripe_subscription_id 
       FROM user_subscriptions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    const { stripe_customer_id } = subResult.rows[0];

    // In production, create Stripe billing portal session
    // For now, return a mock URL
    const billingPortalUrl = process.env.STRIPE_BILLING_PORTAL_URL || 
      `${process.env.FRONTEND_URL}/billing?action=update-payment`;

    res.json({
      success: true,
      url: billingPortalUrl,
      message: 'Redirect to billing portal to update payment method'
    });
  } catch (error) {
    logger.error('[Subscriptions] Update payment method error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment method'
    });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { reason } = req.body;

    logger.info('[Subscriptions] Cancel subscription', { userId, reason });

    // Get user's active subscription
    const subResult = await database.query(
      `SELECT subscription_id, stripe_subscription_id, end_date
       FROM user_subscriptions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    const { subscription_id, end_date } = subResult.rows[0];

    // Update subscription to cancelled (but keep active until end_date)
    await database.query(
      `UPDATE user_subscriptions 
       SET auto_renew = false, 
           updated_at = NOW()
       WHERE subscription_id = $1`,
      [subscription_id]
    );

    // Log cancellation reason
    await database.query(
      `INSERT INTO subscription_cancellations 
       (subscription_id, user_id, reason, cancelled_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT DO NOTHING`,
      [subscription_id, userId, reason]
    );

    res.json({
      success: true,
      message: 'Subscription cancelled. Access will continue until end of billing period.',
      end_date
    });
  } catch (error) {
    logger.error('[Subscriptions] Cancel subscription error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
});

/**
 * POST /api/subscriptions/create
 * Create new subscription (Stripe checkout)
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { tier, billing_cycle } = req.body;

    logger.info('[Subscriptions] Create subscription', { userId, tier, billing_cycle });

    // Validate tier
    const validTiers = [1, 2, 3];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription tier'
      });
    }

    // Get pricing
    const pricing = getSubscriptionPricing(tier, billing_cycle);

    // In production, create Stripe checkout session
    // For now, return mock data
    const checkoutUrl = `${process.env.FRONTEND_URL}/checkout?tier=${tier}&cycle=${billing_cycle}`;

    res.json({
      success: true,
      url: checkoutUrl,
      pricing,
      message: 'Redirect to checkout'
    });
  } catch (error) {
    logger.error('[Subscriptions] Create subscription error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subscription'
    });
  }
});

/**
 * Helper: Get subscription features by tier
 */
function getSubscriptionFeatures(tier: number) {
  const features: { [key: number]: any } = {
    1: {
      name: 'Basic',
      maxOrders: 100,
      analytics: 'basic',
      support: 'email',
      features: [
        'Up to 100 orders/month',
        'Basic analytics',
        'Email support',
        'Standard integrations'
      ]
    },
    2: {
      name: 'Professional',
      maxOrders: 1000,
      analytics: 'advanced',
      support: 'priority',
      marketInsights: true,
      features: [
        'Up to 1,000 orders/month',
        'Advanced analytics',
        'Market insights',
        'Priority support',
        'All integrations',
        'Custom branding'
      ]
    },
    3: {
      name: 'Enterprise',
      maxOrders: -1, // unlimited
      analytics: 'premium',
      support: 'dedicated',
      marketInsights: true,
      apiAccess: true,
      features: [
        'Unlimited orders',
        'Premium analytics',
        'Market insights',
        'Dedicated support',
        'API access',
        'White-label options',
        'Custom integrations',
        'SLA guarantee'
      ]
    }
  };

  return features[tier] || features[1];
}

/**
 * Helper: Get subscription pricing
 */
function getSubscriptionPricing(tier: number, billing_cycle: string) {
  const pricing: { [key: string]: any } = {
    '1_monthly': { amount: 29, currency: 'USD', interval: 'month' },
    '1_yearly': { amount: 290, currency: 'USD', interval: 'year', savings: 58 },
    '2_monthly': { amount: 99, currency: 'USD', interval: 'month' },
    '2_yearly': { amount: 990, currency: 'USD', interval: 'year', savings: 198 },
    '3_monthly': { amount: 299, currency: 'USD', interval: 'month' },
    '3_yearly': { amount: 2990, currency: 'USD', interval: 'year', savings: 598 }
  };

  return pricing[`${tier}_${billing_cycle}`] || pricing['1_monthly'];
}

export default router;
