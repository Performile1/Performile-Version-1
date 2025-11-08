import { Request, Response } from 'express';
import { WebhookRouter } from '../lib/webhooks/WebhookRouter';

/**
 * Unified Webhook Endpoint
 * Receives webhooks from ALL couriers (PostNord, Bring, Budbee, DHL, etc.)
 * 
 * Critical for:
 * - Real-time tracking updates
 * - ETA tracking (for OTD metrics)
 * - Delivery confirmation (for ratings)
 * - Exception detection (for reviews)
 * - Performance analytics (TrustScore)
 * 
 * URL: POST /api/tracking/webhook
 * 
 * Headers:
 * - X-Courier: postnord|bring|budbee|dhl (optional, auto-detected)
 * - X-{Courier}-Signature: Webhook signature for verification
 * - X-{Courier}-Timestamp: Request timestamp (for replay protection)
 * 
 * Response:
 * {
 *   "success": true,
 *   "order_id": "uuid",
 *   "tracking_number": "370123456789",
 *   "event_type": "delivered",
 *   "status_changed": true,
 *   "old_status": "in_transit",
 *   "new_status": "delivered",
 *   "eta_changed": false,
 *   "otd_status": "on_time"
 * }
 */
export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Courier, X-PostNord-Signature, X-Bring-Signature, X-Bring-Timestamp, X-Budbee-Signature, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Route webhook to appropriate handler
    const result = await WebhookRouter.route(req, res);

    console.log('✅ Webhook processed:', result);

    // Return success response
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('❌ Webhook error:', error);

    // Log failed webhook attempt
    try {
      const courier = WebhookRouter.detectCourier(req);
      if (courier) {
        // Log to database for debugging
        console.error(`Failed webhook from ${courier}:`, {
          error: error.message,
          payload: req.body
        });
      }
    } catch (logError) {
      // Ignore logging errors
    }

    return res.status(400).json({
      success: false,
      error: error.message || 'Webhook processing failed'
    });
  }
}
