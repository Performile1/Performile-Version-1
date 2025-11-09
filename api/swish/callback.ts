import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = getPool();

/**
 * Swish Payment Callback
 * POST /api/swish/callback
 * 
 * Swish sends callbacks for payment status updates
 * 
 * Callback body:
 * {
 *   "id": "payment-id",
 *   "payeePaymentReference": "reference",
 *   "paymentReference": "swish-payment-reference",
 *   "callbackUrl": "callback-url",
 *   "payerAlias": "46XXXXXXXXX",
 *   "payeeAlias": "1231181189",
 *   "amount": 100,
 *   "currency": "SEK",
 *   "message": "Payment message",
 *   "status": "PAID",
 *   "dateCreated": "2025-11-09T14:30:00.000Z",
 *   "datePaid": "2025-11-09T14:30:05.000Z",
 *   "errorCode": null,
 *   "errorMessage": null
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const callback = req.body;

    console.log('[Swish Callback] Received:', {
      id: callback.id,
      reference: callback.payeePaymentReference,
      status: callback.status,
      amount: callback.amount,
    });

    // Get payment from database
    const paymentQuery = await pool.query(
      'SELECT * FROM swish_payments WHERE reference = $1',
      [callback.payeePaymentReference]
    );

    if (paymentQuery.rows.length === 0) {
      console.error('[Swish Callback] Payment not found:', callback.payeePaymentReference);
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentQuery.rows[0];

    // Update payment status
    await pool.query(
      `UPDATE swish_payments 
       SET status = $1, 
           swish_payment_id = $2,
           metadata = $3,
           updated_at = NOW() 
       WHERE reference = $4`,
      [
        callback.status,
        callback.id,
        JSON.stringify(callback),
        callback.payeePaymentReference,
      ]
    );

    console.log('[Swish Callback] Payment updated:', {
      reference: callback.payeePaymentReference,
      status: callback.status,
    });

    // Handle different payment statuses
    switch (callback.status) {
      case 'PAID':
        console.log('[Swish Callback] Payment successful:', callback.payeePaymentReference);
        
        // Process based on payment type
        if (payment.payment_type === 'c2c_shipment') {
          await processC2CShipment(payment);
        } else if (payment.payment_type === 'return') {
          await processReturn(payment);
        } else if (payment.payment_type === 'subscription') {
          await activateSubscription(payment);
        }
        
        break;

      case 'DECLINED':
        console.log('[Swish Callback] Payment declined:', callback.payeePaymentReference);
        // Notify user of declined payment
        break;

      case 'ERROR':
        console.error('[Swish Callback] Payment error:', {
          reference: callback.payeePaymentReference,
          errorCode: callback.errorCode,
          errorMessage: callback.errorMessage,
        });
        break;

      case 'CANCELLED':
        console.log('[Swish Callback] Payment cancelled:', callback.payeePaymentReference);
        break;

      default:
        console.log('[Swish Callback] Unknown status:', callback.status);
    }

    // Return 200 to acknowledge receipt
    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('[Swish Callback] Error processing callback:', error);
    
    // Return 200 even on error to prevent Swish from retrying
    return res.status(200).json({ 
      success: false, 
      error: error.message 
    });
  }
}

/**
 * Process C2C shipment after successful payment
 */
async function processC2CShipment(payment: any): Promise<void> {
  try {
    console.log('[Swish] Processing C2C shipment:', payment.order_id);

    // Update order status to paid
    await pool.query(
      `UPDATE orders 
       SET payment_status = $1,
           payment_method = $2,
           payment_reference = $3,
           updated_at = NOW() 
       WHERE order_id = $4`,
      ['paid', 'swish', payment.reference, payment.order_id]
    );

    // Create shipment label (if applicable)
    // Send confirmation email
    // Notify courier

    console.log('[Swish] C2C shipment processed:', payment.order_id);
  } catch (error: any) {
    console.error('[Swish] Failed to process C2C shipment:', error);
    throw error;
  }
}

/**
 * Process return after successful payment
 */
async function processReturn(payment: any): Promise<void> {
  try {
    console.log('[Swish] Processing return:', payment.order_id);

    // Update order/return status
    await pool.query(
      `UPDATE orders 
       SET return_payment_status = $1,
           return_payment_method = $2,
           return_payment_reference = $3,
           updated_at = NOW() 
       WHERE order_id = $4`,
      ['paid', 'swish', payment.reference, payment.order_id]
    );

    // Create return label
    // Send confirmation email
    // Notify merchant

    console.log('[Swish] Return processed:', payment.order_id);
  } catch (error: any) {
    console.error('[Swish] Failed to process return:', error);
    throw error;
  }
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(payment: any): Promise<void> {
  try {
    console.log('[Swish] Activating subscription for user:', payment.user_id);

    // Check if subscription already exists
    const existingQuery = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
      [payment.user_id, 'active']
    );

    if (existingQuery.rows.length > 0) {
      // Update existing subscription
      await pool.query(
        `UPDATE subscriptions 
         SET plan_id = $1, 
             payment_method = $2,
             payment_reference = $3,
             updated_at = NOW() 
         WHERE user_id = $4 AND status = $5`,
        [payment.plan_id, 'swish', payment.reference, payment.user_id, 'active']
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
        [payment.user_id, payment.plan_id, 'active', 'swish', payment.reference]
      );
    }

    console.log('[Swish] Subscription activated for user:', payment.user_id);
  } catch (error: any) {
    console.error('[Swish] Failed to activate subscription:', error);
    throw error;
  }
}
