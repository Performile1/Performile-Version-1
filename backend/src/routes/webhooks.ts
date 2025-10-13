import { Router, Request, Response } from 'express';
import database from '../config/database';
import logger from '../utils/logger';
import crypto from 'crypto';

const router = Router();

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify webhook signature (in production)
    if (webhookSecret && signature) {
      // TODO: Implement actual Stripe signature verification
      // const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    }

    const event = req.body;

    logger.info('[Stripe Webhook] Received event', { 
      type: event.type,
      id: event.id 
    });

    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        logger.info('[Stripe Webhook] Unhandled event type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('[Stripe Webhook] Error', error);
    res.status(400).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: any) {
  try {
    const { customer, id, status, current_period_start, current_period_end, items } = subscription;

    // Get user by Stripe customer ID
    const userResult = await database.query(
      'SELECT user_id FROM users WHERE stripe_customer_id = $1',
      [customer]
    );

    if (userResult.rows.length === 0) {
      logger.warn('[Stripe Webhook] User not found for customer', { customer });
      return;
    }

    const userId = userResult.rows[0].user_id;

    // Determine tier from price ID
    const priceId = items.data[0]?.price?.id;
    const tier = getTierFromPriceId(priceId);

    // Create subscription record
    await database.query(
      `INSERT INTO user_subscriptions 
       (user_id, tier, status, stripe_subscription_id, stripe_customer_id, 
        start_date, end_date, auto_renew)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       ON CONFLICT (stripe_subscription_id) 
       DO UPDATE SET status = $3, updated_at = NOW()`,
      [
        userId,
        tier,
        status === 'active' ? 'active' : 'pending',
        id,
        customer,
        new Date(current_period_start * 1000),
        new Date(current_period_end * 1000)
      ]
    );

    logger.info('[Stripe Webhook] Subscription created', { userId, subscriptionId: id });
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling subscription created', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    const { id, status, current_period_end, cancel_at_period_end } = subscription;

    await database.query(
      `UPDATE user_subscriptions 
       SET status = $1, 
           end_date = $2,
           auto_renew = $3,
           updated_at = NOW()
       WHERE stripe_subscription_id = $4`,
      [
        status === 'active' ? 'active' : status,
        new Date(current_period_end * 1000),
        !cancel_at_period_end,
        id
      ]
    );

    logger.info('[Stripe Webhook] Subscription updated', { subscriptionId: id, status });
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling subscription updated', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    const { id } = subscription;

    await database.query(
      `UPDATE user_subscriptions 
       SET status = 'cancelled', 
           auto_renew = false,
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [id]
    );

    logger.info('[Stripe Webhook] Subscription deleted', { subscriptionId: id });
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling subscription deleted', error);
  }
}

/**
 * Handle invoice paid
 */
async function handleInvoicePaid(invoice: any) {
  try {
    const { id, customer, amount_paid, currency, hosted_invoice_url, created } = invoice;

    // Get user by Stripe customer ID
    const userResult = await database.query(
      'SELECT user_id FROM users WHERE stripe_customer_id = $1',
      [customer]
    );

    if (userResult.rows.length === 0) {
      logger.warn('[Stripe Webhook] User not found for invoice', { customer });
      return;
    }

    const userId = userResult.rows[0].user_id;

    // Create or update invoice record
    await database.query(
      `INSERT INTO invoices 
       (user_id, stripe_invoice_id, amount, currency, status, 
        invoice_date, paid_date, invoice_url)
       VALUES ($1, $2, $3, $4, 'paid', $5, NOW(), $6)
       ON CONFLICT (stripe_invoice_id) 
       DO UPDATE SET status = 'paid', paid_date = NOW(), updated_at = NOW()`,
      [
        userId,
        id,
        amount_paid / 100, // Convert from cents
        currency,
        new Date(created * 1000),
        hosted_invoice_url
      ]
    );

    logger.info('[Stripe Webhook] Invoice paid', { userId, invoiceId: id });
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling invoice paid', error);
  }
}

/**
 * Handle invoice payment failed
 */
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    const { id, customer } = invoice;

    // Get user by Stripe customer ID
    const userResult = await database.query(
      'SELECT user_id FROM users WHERE stripe_customer_id = $1',
      [customer]
    );

    if (userResult.rows.length === 0) {
      return;
    }

    const userId = userResult.rows[0].user_id;

    // Update invoice status
    await database.query(
      `UPDATE invoices 
       SET status = 'failed', updated_at = NOW()
       WHERE stripe_invoice_id = $1`,
      [id]
    );

    // TODO: Send payment failed notification email

    logger.warn('[Stripe Webhook] Invoice payment failed', { userId, invoiceId: id });
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling invoice payment failed', error);
  }
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    const { id, amount, customer } = paymentIntent;

    logger.info('[Stripe Webhook] Payment succeeded', { 
      paymentIntentId: id, 
      amount,
      customer 
    });

    // Additional payment processing logic here
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling payment succeeded', error);
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(paymentIntent: any) {
  try {
    const { id, customer, last_payment_error } = paymentIntent;

    logger.warn('[Stripe Webhook] Payment failed', { 
      paymentIntentId: id,
      customer,
      error: last_payment_error?.message 
    });

    // TODO: Send payment failed notification
  } catch (error) {
    logger.error('[Stripe Webhook] Error handling payment failed', error);
  }
}

/**
 * Helper: Get tier from Stripe price ID
 */
function getTierFromPriceId(priceId: string): number {
  // Map Stripe price IDs to tiers
  const priceToTier: { [key: string]: number } = {
    'price_basic_monthly': 1,
    'price_basic_yearly': 1,
    'price_pro_monthly': 2,
    'price_pro_yearly': 2,
    'price_enterprise_monthly': 3,
    'price_enterprise_yearly': 3,
  };

  return priceToTier[priceId] || 1;
}

/**
 * POST /api/webhooks/shopify/orders
 * Handle Shopify order webhooks
 */
router.post('/shopify/orders', async (req: Request, res: Response) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    // Verify webhook (in production)
    if (process.env.SHOPIFY_WEBHOOK_SECRET && hmac) {
      const hash = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (hash !== hmac) {
        logger.warn('[Shopify Webhook] Invalid signature', { shopDomain });
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const order = req.body;

    logger.info('[Shopify Webhook] Order received', {
      orderId: order.id,
      orderNumber: order.order_number,
      shopDomain
    });

    // Get merchant by shop domain
    const merchantResult = await database.query(
      'SELECT merchant_id FROM merchants WHERE shopify_domain = $1',
      [shopDomain]
    );

    if (merchantResult.rows.length === 0) {
      logger.warn('[Shopify Webhook] Merchant not found', { shopDomain });
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const merchantId = merchantResult.rows[0].merchant_id;

    // Create order record
    await database.query(
      `INSERT INTO orders 
       (merchant_id, order_number, order_status, order_date, 
        consumer_email, city, country, postal_code, external_order_id)
       VALUES ($1, $2, 'pending', NOW(), $3, $4, $5, $6, $7)
       ON CONFLICT (external_order_id) DO NOTHING`,
      [
        merchantId,
        order.order_number,
        order.email,
        order.shipping_address?.city,
        order.shipping_address?.country,
        order.shipping_address?.zip,
        `shopify_${order.id}`
      ]
    );

    res.json({ received: true });
  } catch (error) {
    logger.error('[Shopify Webhook] Error', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/webhooks/shopify/fulfillments
 * Handle Shopify fulfillment webhooks
 */
router.post('/shopify/fulfillments', async (req: Request, res: Response) => {
  try {
    const hmac = req.headers['x-shopify-hmac-sha256'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;

    // Verify webhook
    if (process.env.SHOPIFY_WEBHOOK_SECRET && hmac) {
      const hash = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('base64');

      if (hash !== hmac) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const fulfillment = req.body;

    logger.info('[Shopify Webhook] Fulfillment received', {
      fulfillmentId: fulfillment.id,
      orderId: fulfillment.order_id,
      status: fulfillment.status
    });

    // Update order status based on fulfillment
    await database.query(
      `UPDATE orders 
       SET order_status = $1, 
           tracking_number = $2,
           updated_at = NOW()
       WHERE external_order_id = $3`,
      [
        fulfillment.status === 'success' ? 'in_transit' : 'pending',
        fulfillment.tracking_number,
        `shopify_${fulfillment.order_id}`
      ]
    );

    res.json({ received: true });
  } catch (error) {
    logger.error('[Shopify Webhook] Fulfillment error', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

export default router;
