import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

// Vipps API Configuration
const VIPPS_BASE_URL = process.env.VIPPS_ENV === 'production' 
  ? 'https://api.vipps.no' 
  : 'https://apitest.vipps.no';

const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID!;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET!;
const VIPPS_SUBSCRIPTION_KEY = process.env.VIPPS_SUBSCRIPTION_KEY!;
const VIPPS_MERCHANT_SERIAL_NUMBER = process.env.VIPPS_MERCHANT_SERIAL_NUMBER!;

interface VippsAccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * Get Vipps Access Token
 * Required for all Vipps API calls
 */
async function getVippsAccessToken(): Promise<string> {
  try {
    const response = await axios.post<VippsAccessTokenResponse>(
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
 * Create Vipps Payment (ePayment API) - C2C and Returns Only
 * POST /api/vipps/create-payment
 * 
 * Note: Subscriptions use Stripe, not Vipps
 * 
 * Body:
 * - orderId: UUID - Order ID (required)
 * - amount: number - Amount in NOK (will be converted to øre)
 * - paymentType: 'c2c_shipment' | 'return'
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
  const { orderId, amount, paymentType, returnUrl } = req.body;

  // Validate payment type (only C2C and returns allowed)
  if (paymentType !== 'c2c_shipment' && paymentType !== 'return') {
    return res.status(400).json({ 
      error: 'Invalid payment type. Vipps only supports c2c_shipment and return. Use Stripe for subscriptions.' 
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

    // Convert amount to øre (NOK cents)
    const amountInOre = Math.round(amount * 100);
    
    // Generate description and reference
    const description = paymentType === 'return' 
      ? 'Performile Return Shipment' 
      : 'Performile C2C Shipment';
    const prefix = paymentType === 'return' ? 'RET' : 'C2C';
    const reference = `${prefix}-${user.user_id.substring(0, 8)}-${Date.now()}`;

    // Get Vipps access token
    const accessToken = await getVippsAccessToken();

    // Create payment request
    const paymentRequest = {
      amount: {
        currency: 'NOK',
        value: amountInOre,
      },
      paymentMethod: {
        type: 'WALLET',
      },
      customer: {
        phoneNumber: user.phone_number || undefined,
      },
      returnUrl: returnUrl,
      userFlow: 'WEB_REDIRECT',
      paymentDescription: description,
      reference: reference,
      metadata: {
        user_id: user.user_id,
        order_id: orderId,
        payment_type: paymentType,
        user_role: user.user_role,
        email: user.email,
      },
    };

    // Create payment with Vipps
    const vippsResponse = await axios.post(
      `${VIPPS_BASE_URL}/epayment/v1/payments`,
      paymentRequest,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': VIPPS_SUBSCRIPTION_KEY,
          'Merchant-Serial-Number': VIPPS_MERCHANT_SERIAL_NUMBER,
          'Vipps-System-Name': 'Performile',
          'Vipps-System-Version': '1.0.0',
          'Vipps-System-Plugin-Name': 'performile-platform',
          'Vipps-System-Plugin-Version': '1.0.0',
        },
      }
    );

    const paymentData = vippsResponse.data;

    // Store payment reference in database
    await pool.query(
      `INSERT INTO vipps_payments (
        reference,
        user_id,
        order_id,
        payment_type,
        amount,
        currency,
        status,
        vipps_payment_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        reference,
        user.user_id,
        orderId,
        paymentType,
        amountInOre,
        'NOK',
        'INITIATED',
        paymentData.reference || paymentData.orderId,
      ]
    );

    // Return checkout URL to frontend
    return res.status(200).json({
      success: true,
      data: {
        checkoutUrl: paymentData.redirectUrl || paymentData.url,
        reference: reference,
        paymentId: paymentData.reference || paymentData.orderId,
      },
    });

  } catch (error: any) {
    console.error('Vipps payment creation error:', error.response?.data || error.message);
    
    return res.status(500).json({
      error: 'Failed to create Vipps payment',
      message: error.response?.data?.message || error.message,
    });
  }
}
