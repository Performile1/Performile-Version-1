import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getPool } from '../lib/db';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const pool = getPool();

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const planId = session.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Missing metadata in checkout session');
    return;
  }

  console.log(`Checkout completed for user ${userId}, plan ${planId}`);

  // Subscription will be created via subscription.created event
  // Just log for now
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;

  if (!userId || !planId) {
    console.error('Missing metadata in subscription');
    return;
  }

  const status = subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Check if subscription already exists
  const existingQuery = await pool.query(
    'SELECT subscription_id FROM user_subscriptions WHERE stripe_subscription_id = $1',
    [subscription.id]
  );

  if (existingQuery.rows.length > 0) {
    // Update existing subscription
    await pool.query(
      `UPDATE user_subscriptions 
       SET status = $1, 
           current_period_start = $2, 
           current_period_end = $3,
           updated_at = NOW()
       WHERE stripe_subscription_id = $4`,
      [status, currentPeriodStart, currentPeriodEnd, subscription.id]
    );
  } else {
    // Create new subscription
    await pool.query(
      `INSERT INTO user_subscriptions (
        user_id, plan_id, status, 
        stripe_subscription_id, stripe_customer_id, stripe_price_id,
        current_period_start, current_period_end,
        trial_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        userId,
        planId,
        status,
        subscription.id,
        subscription.customer as string,
        subscription.items.data[0].price.id,
        currentPeriodStart,
        currentPeriodEnd,
        subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      ]
    );
  }

  console.log(`Subscription ${subscription.id} updated for user ${userId}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await pool.query(
    `UPDATE user_subscriptions 
     SET status = 'cancelled', 
         cancelled_at = NOW(),
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );

  console.log(`Subscription ${subscription.id} cancelled`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Reset usage counters for the new billing period
  await pool.query(
    `UPDATE user_subscriptions 
     SET orders_used_this_month = 0,
         emails_sent_this_month = 0,
         sms_sent_this_month = 0,
         push_notifications_sent_this_month = 0,
         last_usage_reset = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  console.log(`Payment succeeded for subscription ${subscriptionId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    return;
  }

  // Update subscription status to past_due
  await pool.query(
    `UPDATE user_subscriptions 
     SET status = 'past_due',
         updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );

  console.log(`Payment failed for subscription ${subscriptionId}`);
  
  // TODO: Send notification email to user
}
