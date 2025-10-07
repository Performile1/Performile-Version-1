import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

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
  const { trackingNumber, courier, webhookUrl, email, sms } = req.body;

  if (!trackingNumber || !courier) {
    return res.status(400).json({ error: 'Tracking number and courier are required' });
  }

  try {
    // Create or update subscription
    const result = await pool.query(
      `INSERT INTO tracking_subscriptions (
        tracking_number, courier, user_id, webhook_url, notify_email, notify_sms
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (tracking_number, user_id)
      DO UPDATE SET
        webhook_url = EXCLUDED.webhook_url,
        notify_email = EXCLUDED.notify_email,
        notify_sms = EXCLUDED.notify_sms,
        is_active = TRUE
      RETURNING subscription_id`,
      [trackingNumber, courier, user.user_id, webhookUrl, email, sms]
    );

    return res.status(200).json({
      success: true,
      subscriptionId: result.rows[0].subscription_id,
      message: 'Successfully subscribed to tracking updates'
    });

  } catch (error: any) {
    console.error('Error creating tracking subscription:', error);
    return res.status(500).json({
      error: 'Failed to subscribe to tracking updates',
      message: error.message
    });
  }
}
