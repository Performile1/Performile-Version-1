import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import database from '../config/database';
import logger from '../utils/logger';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
});

// Apply authentication to all routes
router.use(authenticateToken);
router.use(apiRateLimit);

/**
 * POST /api/payments/create-checkout-session
 * Create a Stripe checkout session for subscription
 */
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const userEmail = (req as any).user?.email;
    const { price_id, plan_id, success_url, cancel_url } = req.body;

    // Validate required fields
    if (!price_id || !plan_id) {
      return res.status(400).json({
        success: false,
        message: 'price_id and plan_id are required'
      });
    }

    // Get or create Stripe customer
    let customerId: string;

    // Check if user already has a Stripe customer ID
    const customerQuery = `
      SELECT stripe_customer_id FROM users WHERE user_id = $1
    `;
    const customerResult = await database.query(customerQuery, [userId]);

    if (customerResult.rows[0]?.stripe_customer_id) {
      customerId = customerResult.rows[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          user_id: userId
        }
      });

      customerId = customer.id;

      // Save customer ID to database
      await database.query(
        `UPDATE users SET stripe_customer_id = $1 WHERE user_id = $2`,
        [customerId, userId]
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${process.env.FRONTEND_URL}/subscription/plans`,
      metadata: {
        user_id: userId,
        plan_id: plan_id
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_id: plan_id
        }
      }
    });

    logger.info(`Checkout session created for user ${userId}: ${session.id}`);

    res.json({
      success: true,
      session_id: session.id,
      url: session.url
    });
  } catch (error) {
    logger.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/payments/create-portal-session
 * Create a Stripe billing portal session
 */
router.post('/create-portal-session', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { return_url } = req.body;

    // Get Stripe customer ID
    const customerQuery = `
      SELECT stripe_customer_id FROM users WHERE user_id = $1
    `;
    const customerResult = await database.query(customerQuery, [userId]);

    if (!customerResult.rows[0]?.stripe_customer_id) {
      return res.status(404).json({
        success: false,
        message: 'No Stripe customer found'
      });
    }

    const customerId = customerResult.rows[0].stripe_customer_id;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${process.env.FRONTEND_URL}/billing`
    });

    logger.info(`Portal session created for user ${userId}`);

    res.json({
      success: true,
      url: session.url
    });
  } catch (error) {
    logger.error('Error creating portal session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create portal session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/success
 * Handle successful payment
 */
router.get('/success', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'session_id is required'
      });
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id as string);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      session: {
        id: session.id,
        customer: session.customer,
        subscription: session.subscription,
        payment_status: session.payment_status
      }
    });
  } catch (error) {
    logger.error('Error retrieving payment session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment session',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/cancel
 * Handle cancelled payment
 */
router.get('/cancel', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Payment cancelled'
    });
  } catch (error) {
    logger.error('Error handling payment cancellation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle payment cancellation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/payments/create-payment-intent
 * Create a payment intent for one-time payments
 */
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;
    const { amount, currency = 'usd', description } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'amount is required'
      });
    }

    // Get or create Stripe customer
    const customerQuery = `
      SELECT stripe_customer_id FROM users WHERE user_id = $1
    `;
    const customerResult = await database.query(customerQuery, [userId]);
    const customerId = customerResult.rows[0]?.stripe_customer_id;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      customer: customerId || undefined,
      description,
      metadata: {
        user_id: userId
      }
    });

    logger.info(`Payment intent created for user ${userId}: ${paymentIntent.id}`);

    res.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    });
  } catch (error) {
    logger.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/payments/payment-methods
 * Get user's saved payment methods
 */
router.get('/payment-methods', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id;

    // Get Stripe customer ID
    const customerQuery = `
      SELECT stripe_customer_id FROM users WHERE user_id = $1
    `;
    const customerResult = await database.query(customerQuery, [userId]);

    if (!customerResult.rows[0]?.stripe_customer_id) {
      return res.json({
        success: true,
        data: []
      });
    }

    const customerId = customerResult.rows[0].stripe_customer_id;

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    res.json({
      success: true,
      data: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year
      }))
    });
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * DELETE /api/payments/payment-methods/:id
 * Delete a payment method
 */
router.delete('/payment-methods/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;

    // Verify ownership by checking customer ID
    const customerQuery = `
      SELECT stripe_customer_id FROM users WHERE user_id = $1
    `;
    const customerResult = await database.query(customerQuery, [userId]);

    if (!customerResult.rows[0]?.stripe_customer_id) {
      return res.status(404).json({
        success: false,
        message: 'No Stripe customer found'
      });
    }

    // Detach payment method
    await stripe.paymentMethods.detach(id);

    logger.info(`Payment method deleted: ${id} by user ${userId}`);

    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
