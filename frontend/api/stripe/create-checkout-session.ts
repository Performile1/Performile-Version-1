import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ error: 'Plan ID is required' });
  }

  try {
    // Get plan details from database
    const planQuery = await pool.query(
      'SELECT * FROM subscription_plans WHERE plan_id = $1 AND is_active = true',
      [planId]
    );

    if (planQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const plan = planQuery.rows[0];

    // Get or create Stripe customer
    let customerId: string;
    
    const userQuery = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE user_id = $1',
      [user.user_id]
    );

    if (userQuery.rows[0]?.stripe_customer_id) {
      customerId = userQuery.rows[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        metadata: {
          user_id: user.user_id,
          user_role: user.user_role,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await pool.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE user_id = $2',
        [customerId, user.user_id]
      );
    }

    // Create or get Stripe price
    let priceId: string;
    
    if (plan.stripe_price_id) {
      priceId = plan.stripe_price_id;
    } else {
      // Create Stripe price
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: Math.round(plan.monthly_price * 100), // Convert to cents
        recurring: {
          interval: 'month',
        },
        product_data: {
          name: plan.plan_name,
          description: plan.description || `${plan.plan_name} subscription`,
          metadata: {
            plan_id: plan.plan_id.toString(),
            user_type: plan.user_type,
            tier: plan.tier.toString(),
          },
        },
      });

      priceId = price.id;

      // Save price ID to database
      await pool.query(
        'UPDATE subscription_plans SET stripe_price_id = $1 WHERE plan_id = $2',
        [priceId, plan.plan_id]
      );
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/#/admin/subscriptions`,
      metadata: {
        user_id: user.user_id,
        plan_id: plan.plan_id.toString(),
      },
      subscription_data: {
        metadata: {
          user_id: user.user_id,
          plan_id: plan.plan_id.toString(),
        },
        trial_period_days: 14, // 14-day free trial
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({
      error: 'Failed to create checkout session',
      message: error.message,
    });
  }
}
