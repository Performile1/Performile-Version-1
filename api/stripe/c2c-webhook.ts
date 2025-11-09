import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getPool } from '../lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const pool = getPool();
const webhookSecret = process.env.STRIPE_C2C_WEBHOOK_SECRET!;

/**
 * Stripe C2C Payment Webhook Handler
 * POST /api/stripe/c2c-webhook
 * 
 * Handles Stripe webhook events for C2C payments
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('[Stripe C2C Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('[Stripe C2C Webhook] Received event:', {
    type: event.type,
    id: event.id,
  });

  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log('[Stripe C2C Webhook] Unhandled event type:', event.type);
    }

    return res.status(200).json({ received: true });

  } catch (error: any) {
    console.error('[Stripe C2C Webhook] Error processing webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('[Stripe C2C] Payment succeeded:', paymentIntent.id);

  const reference = paymentIntent.metadata.reference;
  const orderId = paymentIntent.metadata.order_id;
  const paymentType = paymentIntent.metadata.payment_type;

  if (!reference) {
    console.error('[Stripe C2C] No reference in metadata');
    return;
  }

  // Update payment status
  await pool.query(
    `UPDATE stripe_c2c_payments 
     SET status = $1,
         stripe_charge_id = $2,
         payment_method_type = $3,
         updated_at = NOW() 
     WHERE stripe_payment_intent_id = $4`,
    [
      'succeeded',
      paymentIntent.latest_charge,
      paymentIntent.payment_method_types?.[0] || 'card',
      paymentIntent.id,
    ]
  );

  // Update order payment status
  if (paymentType === 'c2c_shipment') {
    await pool.query(
      `UPDATE orders 
       SET payment_status = $1,
           payment_method = $2,
           payment_reference = $3,
           updated_at = NOW() 
       WHERE order_id = $4`,
      ['paid', 'stripe', reference, orderId]
    );

    console.log('[Stripe C2C] C2C shipment payment processed:', orderId);
  } else if (paymentType === 'return') {
    await pool.query(
      `UPDATE orders 
       SET return_payment_status = $1,
           return_payment_method = $2,
           return_payment_reference = $3,
           updated_at = NOW() 
       WHERE order_id = $4`,
      ['paid', 'stripe', reference, orderId]
    );

    console.log('[Stripe C2C] Return payment processed:', orderId);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('[Stripe C2C] Payment failed:', paymentIntent.id);

  await pool.query(
    `UPDATE stripe_c2c_payments 
     SET status = $1,
         updated_at = NOW() 
     WHERE stripe_payment_intent_id = $2`,
    ['failed', paymentIntent.id]
  );
}

/**
 * Handle canceled payment
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  console.log('[Stripe C2C] Payment canceled:', paymentIntent.id);

  await pool.query(
    `UPDATE stripe_c2c_payments 
     SET status = $1,
         updated_at = NOW() 
     WHERE stripe_payment_intent_id = $2`,
    ['canceled', paymentIntent.id]
  );
}

/**
 * Handle refund
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  console.log('[Stripe C2C] Charge refunded:', charge.id);

  await pool.query(
    `UPDATE stripe_c2c_payments 
     SET status = $1,
         updated_at = NOW() 
     WHERE stripe_charge_id = $2`,
    ['refunded', charge.id]
  );

  // Get payment details to update order
  const paymentQuery = await pool.query(
    'SELECT order_id, payment_type FROM stripe_c2c_payments WHERE stripe_charge_id = $1',
    [charge.id]
  );

  if (paymentQuery.rows.length > 0) {
    const { order_id, payment_type } = paymentQuery.rows[0];

    if (payment_type === 'c2c_shipment') {
      await pool.query(
        `UPDATE orders 
         SET payment_status = $1,
             updated_at = NOW() 
         WHERE order_id = $2`,
        ['refunded', order_id]
      );
    } else if (payment_type === 'return') {
      await pool.query(
        `UPDATE orders 
         SET return_payment_status = $1,
             updated_at = NOW() 
         WHERE order_id = $2`,
        ['refunded', order_id]
      );
    }
  }
}
