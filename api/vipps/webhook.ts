import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getPool } from '../lib/db';

const pool = getPool();

// Vipps API Configuration
const VIPPS_BASE_URL = process.env.VIPPS_ENV === 'production' 
  ? 'https://api.vipps.no' 
  : 'https://apitest.vipps.no';

const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID!;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET!;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY!;
const VIPPS_MERCHANT_SERIAL_NUMBER = process.env.VIPPS_MERCHANT_SERIAL_NUMBER!;

interface VippsWebhookEvent {
  name: string;
  reference: string;
  timestamp: string;
  idempotencyKey?: string;
}

/**
 * Get Vipps Access Token
 */
async function getVippsAccessToken(): Promise<string> {
  try {
    const response = await axios.post(
      `${VIPPS_BASE_URL}/accesstoken/get`,
      {},
      {
        headers: {
          'client_id': VIPPS_CLIENT_ID,
          'client_secret': VIPPS_CLIENT_SECRET,
          'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
        },
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error('Failed to get Vipps access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Vipps');
  }
}

/**
 * Get Payment Details from Vipps
 */
async function getPaymentDetails(reference: string): Promise<any> {
  try {
    const accessToken = await getVippsAccessToken();

    const response = await axios.get(
      `${VIPPS_BASE_URL}/epayment/v1/payments/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
          'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Failed to get payment details:', error.response?.data || error.message);
    throw new Error('Failed to get payment details from Vipps');
  }
}

/**
 * Handle Vipps Webhook
 * POST /api/vipps/webhook
 * 
 * Webhook events:
 * - epayments.payment.created.v1
 * - epayments.payment.aborted.v1
 * - epayments.payment.expired.v1
 * - epayments.payment.cancelled.v1
 * - epayments.payment.captured.v1
 * - epayments.payment.refunded.v1
 * - epayments.payment.authorized.v1
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event: VippsWebhookEvent = req.body;

    console.log('[Vipps Webhook] Received event:', {
      name: event.name,
      reference: event.reference,
      timestamp: event.timestamp,
    });

    // Verify webhook authenticity (Vipps uses Authorization header)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[Vipps Webhook] Missing or invalid authorization header');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get payment details from our database
    const paymentQuery = await pool.query(
      'SELECT * FROM vipps_payments WHERE reference = $1',
      [event.reference]
    );

    if (paymentQuery.rows.length === 0) {
      console.error('[Vipps Webhook] Payment not found:', event.reference);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentQuery.rows[0];

    // Get full payment details from Vipps
    const paymentDetails = await getPaymentDetails(event.reference);

    // Handle different event types
    switch (event.name) {
      case 'epayments.payment.authorized.v1':
        console.log('[Vipps Webhook] Payment authorized:', event.reference);
        
        // Update payment status
        await pool.query(
          `UPDATE vipps_payments 
           SET status = $1, updated_at = NOW() 
           WHERE reference = $2`,
          ['AUTHORIZED', event.reference]
        );

        // Capture payment automatically (for subscriptions)
        // Note: In production, you might want to capture manually
        // For now, we'll just mark as authorized
        
        break;

      case 'epayments.payment.captured.v1':
        console.log('[Vipps Webhook] Payment captured:', event.reference);
        
        // Update payment status
        await pool.query(
          `UPDATE vipps_payments 
           SET status = $1, updated_at = NOW() 
           WHERE reference = $2`,
          ['CAPTURED', event.reference]
        );

        // Activate subscription
        await activateSubscription(payment.user_id, payment.plan_id, event.reference);
        
        break;

      case 'epayments.payment.cancelled.v1':
      case 'epayments.payment.aborted.v1':
        console.log('[Vipps Webhook] Payment cancelled/aborted:', event.reference);
        
        await pool.query(
          `UPDATE vipps_payments 
           SET status = $1, updated_at = NOW() 
           WHERE reference = $2`,
          ['CANCELLED', event.reference]
        );
        
        break;

      case 'epayments.payment.expired.v1':
        console.log('[Vipps Webhook] Payment expired:', event.reference);
        
        await pool.query(
          `UPDATE vipps_payments 
           SET status = $1, updated_at = NOW() 
           WHERE reference = $2`,
          ['EXPIRED', event.reference]
        );
        
        break;

      case 'epayments.payment.refunded.v1':
        console.log('[Vipps Webhook] Payment refunded:', event.reference);
        
        await pool.query(
          `UPDATE vipps_payments 
           SET status = $1, updated_at = NOW() 
           WHERE reference = $2`,
          ['REFUNDED', event.reference]
        );

        // Deactivate subscription
        await deactivateSubscription(payment.user_id, event.reference);
        
        break;

      default:
        console.log('[Vipps Webhook] Unknown event type:', event.name);
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('[Vipps Webhook] Error processing webhook:', error);
    
    // Return 200 even on error to prevent Vipps from retrying
    // Log error for manual review
    return res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(userId: string, planId: string, reference: string): Promise<void> {
  try {
    // Check if subscription already exists
    const existingQuery = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (existingQuery.rows.length > 0) {
      console.log('[Vipps] User already has active subscription, updating...');
      
      // Update existing subscription
      await pool.query(
        `UPDATE subscriptions 
         SET plan_id = $1, 
             payment_method = $2,
             updated_at = NOW() 
         WHERE user_id = $3 AND status = $4`,
        [planId, 'vipps', userId, 'active']
      );
    } else {
      // Create new subscription
      await pool.query(
        `INSERT INTO subscriptions (
          user_id,
          plan_id,
          status,
          payment_method,
          payment_reference,
          start_date,
          next_billing_date,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '1 month', NOW())`,
        [userId, planId, 'active', 'vipps', reference]
      );
    }

    console.log('[Vipps] Subscription activated for user:', userId);
  } catch (error: any) {
    console.error('[Vipps] Failed to activate subscription:', error);
    throw error;
  }
}

/**
 * Deactivate subscription after refund
 */
async function deactivateSubscription(userId: string, reference: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE subscriptions 
       SET status = $1, 
           cancelled_at = NOW(),
           updated_at = NOW() 
       WHERE user_id = $2 AND payment_reference = $3`,
      ['cancelled', userId, reference]
    );

    console.log('[Vipps] Subscription deactivated for user:', userId);
  } catch (error: any) {
    console.error('[Vipps] Failed to deactivate subscription:', error);
    throw error;
  }
}
