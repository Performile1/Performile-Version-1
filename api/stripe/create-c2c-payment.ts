import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const pool = getPool();

/**
 * Create Stripe Payment for C2C Shipments and Returns
 * POST /api/stripe/create-c2c-payment
 * 
 * Body:
 * - orderId: UUID - Order ID (required)
 * - amount: number - Amount in EUR (will be converted to cents)
 * - paymentType: 'c2c_shipment' | 'return'
 * - currency: string - Currency code (default: EUR)
 * - returnUrl: string - URL to return to after payment
 */
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
  const { orderId, amount, paymentType, currency = 'EUR', returnUrl } = req.body;

  // Validate payment type
  if (paymentType !== 'c2c_shipment' && paymentType !== 'return') {
    return res.status(400).json({ 
      error: 'Invalid payment type. Must be c2c_shipment or return.' 
    });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  if (!returnUrl) {
    return res.status(400).json({ error: 'Return URL is required' });
  }

  try {
    // Get order details
    const orderQuery = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderQuery.rows[0];

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    
    // Generate description and reference
    const description = paymentType === 'return' 
      ? 'Performile Return Shipment' 
      : 'Performile C2C Shipment';
    const prefix = paymentType === 'return' ? 'RET' : 'C2C';
    const reference = `${prefix}-${user.user_id.substring(0, 8)}-${Date.now()}`;

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

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      customer: customerId,
      description: description,
      metadata: {
        user_id: user.user_id,
        order_id: orderId,
        payment_type: paymentType,
        reference: reference,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment reference in database
    await pool.query(
      `INSERT INTO stripe_c2c_payments (
        reference,
        user_id,
        order_id,
        payment_type,
        amount,
        currency,
        status,
        stripe_payment_intent_id,
        stripe_customer_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        reference,
        user.user_id,
        orderId,
        paymentType,
        amountInCents,
        currency.toUpperCase(),
        'pending',
        paymentIntent.id,
        customerId,
      ]
    );

    console.log('[Stripe C2C] Payment intent created:', {
      reference,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency,
    });

    // Return client secret for frontend
    return res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        reference: reference,
        amount: amountInCents,
        currency: currency.toUpperCase(),
      },
    });

  } catch (error: any) {
    console.error('[Stripe C2C] Payment creation error:', {
      message: error.message,
      type: error.type,
      code: error.code,
    });
    
    return res.status(500).json({
      error: 'Failed to create Stripe payment',
      message: error.message,
    });
  }
}
