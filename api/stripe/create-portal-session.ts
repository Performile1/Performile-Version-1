import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
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

  try {
    // Get user's Stripe customer ID
    const userQuery = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE user_id = $1',
      [user.user_id]
    );

    const customerId = userQuery.rows[0]?.stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({
        error: 'No subscription found',
        message: 'You need to subscribe to a plan first',
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/#/dashboard`,
    });

    return res.status(200).json({
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe portal error:', error);
    return res.status(500).json({
      error: 'Failed to create portal session',
      message: error.message,
    });
  }
}
