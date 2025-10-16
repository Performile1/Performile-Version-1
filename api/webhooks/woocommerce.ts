import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import crypto from 'crypto';
import { sendEmail, generateReviewRequestEmail } from '../utils/email';

const pool = getPool();

// Verify WooCommerce webhook signature
const verifyWooCommerceSignature = (payload: string, signature: string, secret: string): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  return signature === expectedSignature;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const signature = req.headers['x-wc-webhook-signature'] as string;
    const topic = req.headers['x-wc-webhook-topic'] as string;
    const source = req.headers['x-wc-webhook-source'] as string;

    // Verify signature if secret is configured
    if (process.env.WOOCOMMERCE_WEBHOOK_SECRET) {
      const payload = JSON.stringify(req.body);
      if (!verifyWooCommerceSignature(payload, signature, process.env.WOOCOMMERCE_WEBHOOK_SECRET)) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
    }

    console.log(`WooCommerce webhook received: ${topic} from ${source}`);

    const order = req.body;

    switch (topic) {
      case 'order.created':
        await handleOrderCreated(order, source);
        break;

      case 'order.updated':
        await handleOrderUpdated(order, source);
        break;

      case 'order.completed':
        await handleOrderCompleted(order, source);
        break;

      default:
        console.log(`Unhandled WooCommerce webhook topic: ${topic}`);
    }

    return res.status(200).json({ success: true, message: 'Webhook processed' });

  } catch (error: any) {
    console.error('WooCommerce webhook error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function handleOrderCreated(order: any, source: string) {
  try {
    // Create delivery request
    const query = `
      INSERT INTO delivery_requests (
        external_order_id, external_source, customer_email, customer_name,
        pickup_address, delivery_address, order_value, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING *
    `;

    const deliveryAddress = `${order.shipping.address_1} ${order.shipping.address_2 || ''}, ${order.shipping.city}, ${order.shipping.postcode}`;
    
    const result = await pool.query(query, [
      order.id.toString(),
      `woocommerce:${source}`,
      order.billing.email,
      `${order.billing.first_name} ${order.billing.last_name}`,
      source, // Store address
      deliveryAddress,
      parseFloat(order.total)
    ]);

    // Save tracking information if provided by WooCommerce
    if (order.meta_data) {
      const trackingMeta = order.meta_data.find((meta: any) => 
        meta.key === '_tracking_number' || meta.key === 'tracking_number'
      );
      const courierMeta = order.meta_data.find((meta: any) => 
        meta.key === '_tracking_provider' || meta.key === 'tracking_provider'
      );
      const trackingUrlMeta = order.meta_data.find((meta: any) => 
        meta.key === '_tracking_url' || meta.key === 'tracking_url'
      );

      if (trackingMeta?.value && courierMeta?.value) {
        await pool.query(
          `INSERT INTO tracking_data (
            order_id, tracking_number, courier, source, 
            external_tracking_url, external_order_id, status
          ) VALUES ($1, $2, $3, 'woocommerce', $4, $5, 'pending')
          ON CONFLICT (tracking_number, courier) DO NOTHING`,
          [
            result.rows[0].request_id,
            trackingMeta.value,
            courierMeta.value,
            trackingUrlMeta?.value,
            order.id.toString()
          ]
        );
      }
    }

    console.log(`Created delivery request for WooCommerce order ${order.number}`);
  } catch (error) {
    console.error('Error handling WooCommerce order created:', error);
    throw error;
  }
}

async function handleOrderUpdated(order: any, source: string) {
  try {
    const query = `
      UPDATE delivery_requests 
      SET order_value = $1, status = $2, updated_at = NOW()
      WHERE external_order_id = $3
    `;

    const status = order.status === 'completed' ? 'completed' : 
                   order.status === 'cancelled' ? 'cancelled' : 'pending';

    await pool.query(query, [
      parseFloat(order.total),
      status,
      order.id.toString()
    ]);

    console.log(`Updated delivery request for WooCommerce order ${order.number}`);
  } catch (error) {
    console.error('Error handling WooCommerce order updated:', error);
    throw error;
  }
}

async function handleOrderCompleted(order: any, source: string) {
  try {
    // Update delivery request
    const query = `
      UPDATE delivery_requests 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE external_order_id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [order.id.toString()]);

    if (result.rows.length > 0) {
      const deliveryRequest = result.rows[0];
      
      // Send review request email
      await sendReviewRequestEmail(order, deliveryRequest, source);
    }

    console.log(`Marked delivery as completed for WooCommerce order ${order.number}`);
  } catch (error) {
    console.error('Error handling WooCommerce order completed:', error);
    throw error;
  }
}

async function sendReviewRequestEmail(order: any, deliveryRequest: any, source: string) {
  try {
    // Generate unique review token
    const reviewToken = crypto.randomBytes(32).toString('hex');
    
    // Store review token
    await pool.query(
      'UPDATE delivery_requests SET review_link_token = $1, review_link_sent = true, review_link_sent_at = NOW() WHERE request_id = $2',
      [reviewToken, deliveryRequest.request_id]
    );
    
    // Generate review link
    const reviewLink = `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/review/${deliveryRequest.request_id}/${reviewToken}`;
    
    // Get courier name if assigned
    let courierName = 'Your courier';
    if (deliveryRequest.courier_id) {
      const courierResult = await pool.query(
        'SELECT first_name, last_name FROM users WHERE user_id = $1',
        [deliveryRequest.courier_id]
      );
      if (courierResult.rows.length > 0) {
        courierName = `${courierResult.rows[0].first_name} ${courierResult.rows[0].last_name}`;
      }
    }
    
    // Generate and send email
    const emailHtml = generateReviewRequestEmail({
      customerName: order.billing.first_name || 'Valued Customer',
      orderNumber: order.number,
      courierName,
      reviewLink
    });
    
    await sendEmail({
      to: order.billing.email,
      subject: `How was your delivery experience? Order #${order.number}`,
      html: emailHtml
    });
    
    console.log(`Review request email sent for WooCommerce order ${order.number}`);
  } catch (error) {
    console.error('Error sending review request email:', error);
  }
}
