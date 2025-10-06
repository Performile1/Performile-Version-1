import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import crypto from 'crypto';
import { sendEmail, generateReviewRequestEmail } from '../utils/email';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Universal E-commerce Webhook Handler
 * Supports: WooCommerce, OpenCart, PrestaShop, Magento, Wix, Squarespace
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { platform } = req.query; // ?platform=woocommerce

    if (!platform) {
      return res.status(400).json({ error: 'Platform parameter required' });
    }

    console.log(`E-commerce webhook received from ${platform}`);

    switch (platform) {
      case 'woocommerce':
        return await handleWooCommerce(req, res);
      
      case 'opencart':
        return await handleOpenCart(req, res);
      
      case 'prestashop':
        return await handlePrestaShop(req, res);
      
      case 'magento':
        return await handleMagento(req, res);
      
      case 'wix':
        return await handleWix(req, res);
      
      case 'squarespace':
        return await handleSquarespace(req, res);
      
      default:
        return res.status(400).json({ error: 'Unsupported platform' });
    }

  } catch (error: any) {
    console.error('E-commerce webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// WooCommerce Handler
async function handleWooCommerce(req: VercelRequest, res: VercelResponse) {
  const topic = req.headers['x-wc-webhook-topic'] as string;
  const order = req.body;

  if (topic === 'order.completed') {
    await processOrderCompletion({
      platform: 'woocommerce',
      orderId: order.id.toString(),
      orderNumber: order.number,
      customerEmail: order.billing.email,
      customerName: `${order.billing.first_name} ${order.billing.last_name}`,
      orderValue: parseFloat(order.total),
      shippingAddress: `${order.shipping.address_1}, ${order.shipping.city}, ${order.shipping.postcode}`
    });
  }

  return res.status(200).json({ success: true });
}

// OpenCart Handler
async function handleOpenCart(req: VercelRequest, res: VercelResponse) {
  const { event, order } = req.body;

  if (event === 'order_complete') {
    await processOrderCompletion({
      platform: 'opencart',
      orderId: order.order_id,
      orderNumber: order.order_id,
      customerEmail: order.email,
      customerName: `${order.firstname} ${order.lastname}`,
      orderValue: parseFloat(order.total),
      shippingAddress: `${order.shipping_address_1}, ${order.shipping_city}, ${order.shipping_postcode}`
    });
  }

  return res.status(200).json({ success: true });
}

// PrestaShop Handler
async function handlePrestaShop(req: VercelRequest, res: VercelResponse) {
  const { action, order } = req.body;

  if (action === 'orderStatusUpdate' && order.current_state === '5') { // 5 = Delivered
    await processOrderCompletion({
      platform: 'prestashop',
      orderId: order.id_order,
      orderNumber: order.reference,
      customerEmail: order.customer_email,
      customerName: `${order.customer_firstname} ${order.customer_lastname}`,
      orderValue: parseFloat(order.total_paid),
      shippingAddress: `${order.delivery_address}, ${order.delivery_city}, ${order.delivery_postcode}`
    });
  }

  return res.status(200).json({ success: true });
}

// Magento Handler
async function handleMagento(req: VercelRequest, res: VercelResponse) {
  const { event, order } = req.body;

  if (event === 'order_shipment_save_after' || order.status === 'complete') {
    const billingAddress = order.billing_address || {};
    const shippingAddress = order.extension_attributes?.shipping_assignments?.[0]?.shipping?.address || {};

    await processOrderCompletion({
      platform: 'magento',
      orderId: order.entity_id,
      orderNumber: order.increment_id,
      customerEmail: order.customer_email,
      customerName: `${billingAddress.firstname} ${billingAddress.lastname}`,
      orderValue: parseFloat(order.grand_total),
      shippingAddress: `${shippingAddress.street?.[0]}, ${shippingAddress.city}, ${shippingAddress.postcode}`
    });
  }

  return res.status(200).json({ success: true });
}

// Wix Handler
async function handleWix(req: VercelRequest, res: VercelResponse) {
  const { eventType, data } = req.body;

  if (eventType === 'orders/fulfilled' || data.fulfillmentStatus === 'FULFILLED') {
    const order = data;
    const buyerInfo = order.buyerInfo || {};
    const shippingInfo = order.shippingInfo?.logistics?.shippingDestination?.address || {};

    await processOrderCompletion({
      platform: 'wix',
      orderId: order.id,
      orderNumber: order.number,
      customerEmail: buyerInfo.email,
      customerName: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
      orderValue: parseFloat(order.priceSummary?.total || 0),
      shippingAddress: `${shippingInfo.addressLine}, ${shippingInfo.city}, ${shippingInfo.postalCode}`
    });
  }

  return res.status(200).json({ success: true });
}

// Squarespace Handler
async function handleSquarespace(req: VercelRequest, res: VercelResponse) {
  const { type, data } = req.body;

  if (type === 'order.fulfill') {
    const order = data;
    const billingAddress = order.billingAddress || {};
    const shippingAddress = order.shippingAddress || {};

    await processOrderCompletion({
      platform: 'squarespace',
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: `${billingAddress.firstName} ${billingAddress.lastName}`,
      orderValue: parseFloat(order.grandTotal),
      shippingAddress: `${shippingAddress.address1}, ${shippingAddress.city}, ${shippingAddress.postalCode}`
    });
  }

  return res.status(200).json({ success: true });
}

// Universal order completion processor
async function processOrderCompletion(orderData: {
  platform: string;
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  orderValue: number;
  shippingAddress: string;
}) {
  try {
    // Create or update delivery request
    const query = `
      INSERT INTO delivery_requests (
        external_order_id, external_source, customer_email, customer_name,
        delivery_address, order_value, status, completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), NOW())
      ON CONFLICT (external_order_id) 
      DO UPDATE SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(query, [
      orderData.orderId,
      orderData.platform,
      orderData.customerEmail,
      orderData.customerName,
      orderData.shippingAddress,
      orderData.orderValue
    ]);

    const deliveryRequest = result.rows[0];

    // Send review request email
    await sendReviewRequestEmail(orderData, deliveryRequest);

    console.log(`Processed order completion for ${orderData.platform} order ${orderData.orderNumber}`);

  } catch (error) {
    console.error('Error processing order completion:', error);
    throw error;
  }
}

// Send review request email
async function sendReviewRequestEmail(orderData: any, deliveryRequest: any) {
  try {
    // Generate unique review token
    const reviewToken = crypto.randomBytes(32).toString('hex');
    
    // Store review token
    await pool.query(
      `UPDATE delivery_requests 
       SET review_link_token = $1, review_link_sent = true, review_link_sent_at = NOW() 
       WHERE request_id = $2`,
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
      customerName: orderData.customerName.split(' ')[0] || 'Valued Customer',
      orderNumber: orderData.orderNumber,
      courierName,
      reviewLink
    });
    
    await sendEmail({
      to: orderData.customerEmail,
      subject: `How was your delivery experience? Order #${orderData.orderNumber}`,
      html: emailHtml
    });
    
    console.log(`Review request email sent for ${orderData.platform} order ${orderData.orderNumber}`);

  } catch (error) {
    console.error('Error sending review request email:', error);
    // Don't throw - we don't want to fail the webhook if email fails
  }
}
