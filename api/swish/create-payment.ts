import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import https from 'https';
import fs from 'fs';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

// Swish API Configuration
const SWISH_BASE_URL = process.env.SWISH_ENV === 'production' 
  ? 'https://cpc.getswish.net/swish-cpcapi/api' 
  : 'https://mss.cpc.getswish.net/swish-cpcapi/api';

const SWISH_PAYEE_NUMBER = process.env.SWISH_PAYEE_NUMBER!; // Performile's Swish number
const SWISH_CALLBACK_URL = process.env.SWISH_CALLBACK_URL || 'https://performile.com/api/swish/callback';

// Swish requires client certificates for authentication
const httpsAgent = new https.Agent({
  cert: process.env.SWISH_CERT ? Buffer.from(process.env.SWISH_CERT, 'base64') : undefined,
  key: process.env.SWISH_KEY ? Buffer.from(process.env.SWISH_KEY, 'base64') : undefined,
  ca: process.env.SWISH_CA ? Buffer.from(process.env.SWISH_CA, 'base64') : undefined,
  rejectUnauthorized: true,
});

/**
 * Create Swish Payment (for C2C shipments and returns)
 * POST /api/swish/create-payment
 * 
 * Body:
 * - orderId: UUID - Order ID for C2C shipment or return
 * - amount: number - Amount in SEK (will be converted to öre)
 * - payerPhone: string - Payer's Swedish phone number (format: 46XXXXXXXXX)
 * - message: string - Payment message
 * - paymentType: 'c2c_shipment' | 'return' | 'subscription'
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
  const { orderId, amount, payerPhone, message, paymentType = 'c2c_shipment' } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  if (!payerPhone) {
    return res.status(400).json({ error: 'Payer phone number is required' });
  }

  // Validate Swedish phone number format
  const phoneRegex = /^46\d{7,10}$/;
  if (!phoneRegex.test(payerPhone)) {
    return res.status(400).json({ 
      error: 'Invalid Swedish phone number. Format: 46XXXXXXXXX' 
    });
  }

  try {
    // Get order details from database
    const orderQuery = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderQuery.rows[0];

    // Convert amount to öre (SEK cents)
    const amountInOre = Math.round(amount * 100);

    // Generate unique reference
    const prefix = paymentType === 'return' ? 'RET' : 'C2C';
    const reference = `${prefix}-${user.user_id.substring(0, 8)}-${Date.now()}`;

    // Create payment request for Swish
    const paymentRequest = {
      payeePaymentReference: reference,
      callbackUrl: SWISH_CALLBACK_URL,
      payerAlias: payerPhone,
      payeeAlias: SWISH_PAYEE_NUMBER,
      amount: amountInOre,
      currency: 'SEK',
      message: message || `Performile ${paymentType === 'return' ? 'Return' : 'C2C Shipment'}`,
    };

    console.log('[Swish] Creating payment:', {
      reference,
      amount: amountInOre,
      paymentType,
    });

    // Create payment with Swish
    const swishResponse = await axios.post(
      `${SWISH_BASE_URL}/v2/paymentrequests`,
      paymentRequest,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent,
      }
    );

    // Swish returns 201 with Location header containing payment ID
    const paymentId = swishResponse.headers.location?.split('/').pop();

    console.log('[Swish] Payment created:', {
      paymentId,
      reference,
      status: swishResponse.status,
    });

    // Store payment reference in database
    await pool.query(
      `INSERT INTO swish_payments (
        reference,
        user_id,
        order_id,
        payment_type,
        amount,
        currency,
        status,
        swish_payment_id,
        payer_phone_number,
        payee_phone_number,
        message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        reference,
        user.user_id,
        orderId,
        paymentType,
        amountInOre,
        'SEK',
        'CREATED',
        paymentId,
        payerPhone,
        SWISH_PAYEE_NUMBER,
        message,
      ]
    );

    // Return payment details to frontend
    return res.status(200).json({
      success: true,
      data: {
        reference: reference,
        paymentId: paymentId,
        amount: amountInOre,
        currency: 'SEK',
        status: 'CREATED',
        message: 'Payment request sent to Swish. User will receive notification on their phone.',
      },
    });

  } catch (error: any) {
    console.error('[Swish] Payment creation error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    // Swish-specific error handling
    let errorMessage = 'Failed to create Swish payment';
    
    if (error.response?.status === 422) {
      errorMessage = 'Invalid payment request. Please check phone number and amount.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Swish authentication failed. Please contact support.';
    } else if (error.response?.data?.errorMessage) {
      errorMessage = error.response.data.errorMessage;
    }
    
    return res.status(500).json({
      error: errorMessage,
      details: error.response?.data,
    });
  }
}
