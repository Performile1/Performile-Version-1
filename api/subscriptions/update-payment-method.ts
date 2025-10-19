import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import Stripe from 'stripe';
import { applySecurityMiddleware } from '../middleware/security';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
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
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = (req as any).user;

  try {
    const client = await pool.connect();
    
    try {
      // Get user's Stripe customer ID
      const result = await client.query(`
        SELECT stripe_customer_id
        FROM user_subscriptions
        WHERE user_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `, [user.user_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ 
          message: 'No active subscription found' 
        });
      }

      const { stripe_customer_id } = result.rows[0];

      if (!stripe_customer_id) {
        return res.status(400).json({ 
          message: 'No Stripe customer ID found' 
        });
      }

      // Create Stripe billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: stripe_customer_id,
        return_url: `${process.env.FRONTEND_URL || 'https://performile.vercel.app'}/billing`,
      });

      return res.status(200).json({
        success: true,
        url: session.url
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Update payment method error:', error);
    return res.status(500).json({ 
      message: 'Failed to create billing portal session',
      error: error.message 
    });
  }
}
