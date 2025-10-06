import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import crypto from 'crypto';
import { applySecurityMiddleware } from '../middleware/security';
import { sendEmail, generateReviewRequestEmail } from '../utils/email';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Webhook verification secrets
const WEBHOOK_SECRETS = {
  shopify: process.env.SHOPIFY_WEBHOOK_SECRET,
  stripe: process.env.STRIPE_WEBHOOK_SECRET,
  external: process.env.EXTERNAL_WEBHOOK_SECRET
};

// Verify webhook signature
const verifyWebhookSignature = (payload: string, signature: string, secret: string, provider: string): boolean => {
  if (!secret) {
    console.error(`No webhook secret configured for ${provider}`);
    return false;
  }

  try {
    let expectedSignature: string;
    
    switch (provider) {
      case 'shopify':
        expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
        return signature === expectedSignature;
        
      case 'stripe':
        expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
        return signature === `sha256=${expectedSignature}`;
        
      case 'external':
        expectedSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
        return signature === expectedSignature;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

// Log webhook event
const logWebhookEvent = async (provider: string, event: string, payload: any, status: string, error?: string) => {
  try {
    const query = `
      INSERT INTO webhook_logs (provider, event_type, payload, status, error_message, received_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await pool.query(query, [provider, event, JSON.stringify(payload), status, error]);
  } catch (logError) {
    console.error('Failed to log webhook event:', logError);
  }
};

// Handle Shopify webhooks
const handleShopifyWebhook = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const signature = req.headers['x-shopify-hmac-sha256'] as string;
    const topic = req.headers['x-shopify-topic'] as string;
    const shopDomain = req.headers['x-shopify-shop-domain'] as string;
    
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRETS.shopify!, 'shopify')) {
      await logWebhookEvent('shopify', topic, req.body, 'failed', 'Invalid signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    console.log(`Shopify webhook received: ${topic} from ${shopDomain}`);

    switch (topic) {
      case 'orders/create':
        await handleShopifyOrderCreate(req.body, shopDomain);
        break;
        
      case 'orders/updated':
        await handleShopifyOrderUpdate(req.body, shopDomain);
        break;
        
      case 'orders/cancelled':
        await handleShopifyOrderCancel(req.body, shopDomain);
        break;
        
      case 'orders/fulfilled':
        await handleShopifyOrderFulfilled(req.body, shopDomain);
        break;
        
      default:
        console.log(`Unhandled Shopify webhook topic: ${topic}`);
    }

    await logWebhookEvent('shopify', topic, req.body, 'success');
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Shopify webhook error:', error);
    await logWebhookEvent('shopify', req.headers['x-shopify-topic'] as string, req.body, 'error', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Handle Shopify order creation
const handleShopifyOrderCreate = async (order: any, shopDomain: string) => {
  try {
    // Check if this shop is registered in our system
    const shopQuery = 'SELECT * FROM integrated_shops WHERE shop_domain = $1';
    const shopResult = await pool.query(shopQuery, [shopDomain]);
    
    if (shopResult.rows.length === 0) {
      console.log(`Shop ${shopDomain} not registered in system`);
      return;
    }

    const shop = shopResult.rows[0];
    
    // Create delivery request if order requires shipping
    if (order.shipping_address && order.fulfillment_status !== 'fulfilled') {
      const deliveryQuery = `
        INSERT INTO delivery_requests (
          shop_id, external_order_id, customer_email, customer_name,
          pickup_address, delivery_address, order_value, 
          urgency_level, service_type, created_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'pending')
        RETURNING *
      `;
      
      const pickupAddress = `${shop.address}, ${shop.city}, ${shop.postal_code}`;
      const deliveryAddress = `${order.shipping_address.address1} ${order.shipping_address.address2 || ''}, ${order.shipping_address.city}, ${order.shipping_address.zip}`;
      
      // Determine service type based on order value and shipping method
      let serviceType = 'standard';
      if (parseFloat(order.total_price) > 100) {
        serviceType = 'express';
      }
      if (order.shipping_lines?.[0]?.title?.toLowerCase().includes('express')) {
        serviceType = 'express';
      }
      
      const deliveryResult = await pool.query(deliveryQuery, [
        shop.shop_id,
        order.id.toString(),
        order.email,
        `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
        pickupAddress,
        deliveryAddress,
        parseFloat(order.total_price),
        'medium',
        serviceType
      ]);

      console.log(`Created delivery request for Shopify order ${order.order_number}`);

      // Auto-assign to best courier if enabled
      if (shop.auto_assign_couriers) {
        await autoAssignCourier(deliveryResult.rows[0]);
      }
    }

  } catch (error) {
    console.error('Error handling Shopify order create:', error);
    throw error;
  }
};

// Handle Shopify order updates
const handleShopifyOrderUpdate = async (order: any, shopDomain: string) => {
  try {
    // Update delivery request status if it exists
    const updateQuery = `
      UPDATE delivery_requests 
      SET 
        order_value = $1,
        status = CASE 
          WHEN $2 = 'cancelled' THEN 'cancelled'
          WHEN $2 = 'fulfilled' THEN 'completed'
          ELSE status
        END,
        updated_at = NOW()
      WHERE external_order_id = $3
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      parseFloat(order.total_price),
      order.fulfillment_status,
      order.id.toString()
    ]);

    if (result.rows.length > 0) {
      console.log(`Updated delivery request for Shopify order ${order.order_number}`);
    }

  } catch (error) {
    console.error('Error handling Shopify order update:', error);
    throw error;
  }
};

// Handle Shopify order cancellation
const handleShopifyOrderCancel = async (order: any, shopDomain: string) => {
  try {
    const cancelQuery = `
      UPDATE delivery_requests 
      SET status = 'cancelled', updated_at = NOW()
      WHERE external_order_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(cancelQuery, [order.id.toString()]);
    
    if (result.rows.length > 0) {
      console.log(`Cancelled delivery request for Shopify order ${order.order_number}`);
      
      // Notify assigned courier if any
      const deliveryRequest = result.rows[0];
      if (deliveryRequest.courier_id) {
        await notifyCourierOfCancellation(deliveryRequest);
      }
    }

  } catch (error) {
    console.error('Error handling Shopify order cancel:', error);
    throw error;
  }
};

// Handle Shopify order fulfillment
const handleShopifyOrderFulfilled = async (order: any, shopDomain: string) => {
  try {
    const fulfillQuery = `
      UPDATE delivery_requests 
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE external_order_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(fulfillQuery, [order.id.toString()]);
    console.log(`Marked delivery request as completed for Shopify order ${order.order_number}`);

    // Send review request email
    if (result.rows.length > 0) {
      await sendReviewRequestEmail(order, result.rows[0], shopDomain);
    }

  } catch (error) {
    console.error('Error handling Shopify order fulfillment:', error);
    throw error;
  }
};

// Handle Stripe webhooks
const handleStripeWebhook = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRETS.stripe!, 'stripe')) {
      await logWebhookEvent('stripe', 'unknown', req.body, 'failed', 'Invalid signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body;
    console.log(`Stripe webhook received: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleStripePaymentSuccess(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;
        
      case 'checkout.session.completed':
        await handleStripeCheckoutCompleted(event.data.object);
        break;
        
      default:
        console.log(`Unhandled Stripe webhook type: ${event.type}`);
    }

    await logWebhookEvent('stripe', event.type, req.body, 'success');
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    await logWebhookEvent('stripe', req.body?.type || 'unknown', req.body, 'error', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Handle successful Stripe payment
const handleStripePaymentSuccess = async (paymentIntent: any) => {
  try {
    if (paymentIntent.metadata?.type === 'lead_purchase') {
      // Lead purchase payment succeeded - already handled in leads API
      console.log(`Lead purchase payment succeeded: ${paymentIntent.id}`);
    } else if (paymentIntent.metadata?.type === 'delivery_payment') {
      // Mark delivery as paid
      const updateQuery = `
        UPDATE orders 
        SET payment_status = 'paid', payment_intent_id = $1, updated_at = NOW()
        WHERE order_id = $2
      `;
      await pool.query(updateQuery, [paymentIntent.id, paymentIntent.metadata.order_id]);
      console.log(`Delivery payment succeeded for order: ${paymentIntent.metadata.order_id}`);
    }
  } catch (error) {
    console.error('Error handling Stripe payment success:', error);
    throw error;
  }
};

// Handle failed Stripe payment
const handleStripePaymentFailed = async (paymentIntent: any) => {
  try {
    console.log(`Payment failed: ${paymentIntent.id}`);
    
    if (paymentIntent.metadata?.order_id) {
      const updateQuery = `
        UPDATE orders 
        SET payment_status = 'failed', updated_at = NOW()
        WHERE order_id = $1
      `;
      await pool.query(updateQuery, [paymentIntent.metadata.order_id]);
    }
  } catch (error) {
    console.error('Error handling Stripe payment failure:', error);
    throw error;
  }
};

// Handle completed Stripe checkout
const handleStripeCheckoutCompleted = async (session: any) => {
  try {
    if (session.metadata?.type === 'lead_purchase') {
      console.log(`Lead purchase checkout completed: ${session.id}`);
      // Additional processing if needed
    }
  } catch (error) {
    console.error('Error handling Stripe checkout completion:', error);
    throw error;
  }
};

// Handle external webhooks (custom integrations)
const handleExternalWebhook = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRETS.external!, 'external')) {
      await logWebhookEvent('external', 'unknown', req.body, 'failed', 'Invalid signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { event_type, data } = req.body;
    console.log(`External webhook received: ${event_type}`);

    switch (event_type) {
      case 'delivery_request':
        await handleExternalDeliveryRequest(data);
        break;
        
      case 'courier_update':
        await handleExternalCourierUpdate(data);
        break;
        
      case 'order_status_change':
        await handleExternalOrderStatusChange(data);
        break;
        
      default:
        console.log(`Unhandled external webhook type: ${event_type}`);
    }

    await logWebhookEvent('external', event_type, req.body, 'success');
    res.status(200).json({ success: true, message: 'Webhook processed successfully' });

  } catch (error: any) {
    console.error('External webhook error:', error);
    await logWebhookEvent('external', req.body?.event_type || 'unknown', req.body, 'error', error.message);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// Auto-assign courier to delivery request
const autoAssignCourier = async (deliveryRequest: any) => {
  try {
    // Find best available courier based on location and rating
    const courierQuery = `
      SELECT courier_id, courier_name, rating, city, postal_code
      FROM couriers 
      WHERE is_active = true 
        AND city = $1 
        AND (current_orders < max_concurrent_orders OR max_concurrent_orders IS NULL)
      ORDER BY rating DESC, created_at ASC
      LIMIT 1
    `;
    
    // Extract city from delivery address
    const deliveryCity = deliveryRequest.delivery_address.split(',')[1]?.trim();
    
    const courierResult = await pool.query(courierQuery, [deliveryCity]);
    
    if (courierResult.rows.length > 0) {
      const courier = courierResult.rows[0];
      
      // Assign courier to delivery request
      const assignQuery = `
        UPDATE delivery_requests 
        SET courier_id = $1, status = 'assigned', assigned_at = NOW(), updated_at = NOW()
        WHERE request_id = $2
      `;
      await pool.query(assignQuery, [courier.courier_id, deliveryRequest.request_id]);
      
      console.log(`Auto-assigned courier ${courier.courier_name} to delivery request ${deliveryRequest.request_id}`);
      
      // Send notification to courier
      await notifyCourierOfAssignment(courier, deliveryRequest);
    }
  } catch (error) {
    console.error('Error auto-assigning courier:', error);
  }
};

// Notify courier of new assignment
const notifyCourierOfAssignment = async (courier: any, deliveryRequest: any) => {
  try {
    // Send email notification
    const emailResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'delivery_assignment',
        courierEmail: courier.email,
        courierName: courier.courier_name,
        deliveryDetails: deliveryRequest
      })
    });

    if (!emailResponse.ok) {
      console.error('Failed to send courier assignment notification');
    }
  } catch (error) {
    console.error('Error notifying courier of assignment:', error);
  }
};

// Notify courier of cancellation
const notifyCourierOfCancellation = async (deliveryRequest: any) => {
  try {
    // Get courier details
    const courierQuery = 'SELECT * FROM couriers WHERE courier_id = $1';
    const courierResult = await pool.query(courierQuery, [deliveryRequest.courier_id]);
    
    if (courierResult.rows.length > 0) {
      const courier = courierResult.rows[0];
      
      // Send cancellation notification
      const emailResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'delivery_cancellation',
          courierEmail: courier.email,
          courierName: courier.courier_name,
          deliveryDetails: deliveryRequest
        })
      });

      if (!emailResponse.ok) {
        console.error('Failed to send courier cancellation notification');
      }
    }
  } catch (error) {
    console.error('Error notifying courier of cancellation:', error);
  }
};

// Handle external delivery request
const handleExternalDeliveryRequest = async (data: any) => {
  try {
    const insertQuery = `
      INSERT INTO delivery_requests (
        external_source, customer_email, customer_name,
        pickup_address, delivery_address, order_value,
        urgency_level, service_type, notes, created_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'pending')
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      data.source || 'external_api',
      data.customer_email,
      data.customer_name,
      data.pickup_address,
      data.delivery_address,
      data.order_value || 0,
      data.urgency_level || 'medium',
      data.service_type || 'standard',
      data.notes
    ]);

    console.log(`Created external delivery request: ${result.rows[0].request_id}`);
    
    // Auto-assign if enabled
    if (data.auto_assign !== false) {
      await autoAssignCourier(result.rows[0]);
    }
  } catch (error) {
    console.error('Error handling external delivery request:', error);
    throw error;
  }
};

// Handle external courier update
const handleExternalCourierUpdate = async (data: any) => {
  try {
    const updateQuery = `
      UPDATE couriers 
      SET 
        courier_name = COALESCE($2, courier_name),
        phone = COALESCE($3, phone),
        city = COALESCE($4, city),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE external_courier_id = $1
      RETURNING *
    `;
    
    await pool.query(updateQuery, [
      data.external_courier_id,
      data.courier_name,
      data.phone,
      data.city,
      data.is_active
    ]);

    console.log(`Updated external courier: ${data.external_courier_id}`);
  } catch (error) {
    console.error('Error handling external courier update:', error);
    throw error;
  }
};

// Handle external order status change
const handleExternalOrderStatusChange = async (data: any) => {
  try {
    const updateQuery = `
      UPDATE orders 
      SET 
        order_status = $2,
        tracking_number = COALESCE($3, tracking_number),
        updated_at = NOW()
      WHERE external_order_id = $1
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      data.external_order_id,
      data.status,
      data.tracking_number
    ]);

    if (result.rows.length > 0) {
      console.log(`Updated external order status: ${data.external_order_id} -> ${data.status}`);
      
      // Send status update notification to customer
      const order = result.rows[0];
      if (order.customer_email) {
        await sendOrderStatusNotification(order);
      }
    }
  } catch (error) {
    console.error('Error handling external order status change:', error);
    throw error;
  }
};

// Send order status notification
const sendOrderStatusNotification = async (order: any) => {
  try {
    const emailResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'order_status_update',
        orderId: order.order_id,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        status: order.order_status,
        statusMessage: `Your order status has been updated to: ${order.order_status}`,
        trackingUrl: order.tracking_number ? `https://performile.com/track/${order.tracking_number}` : null
      })
    });

    if (!emailResponse.ok) {
      console.error('Failed to send order status notification');
    }
  } catch (error) {
    console.error('Error sending order status notification:', error);
  }
};

// Send review request email after order fulfillment
const sendReviewRequestEmail = async (order: any, deliveryRequest: any, shopDomain: string) => {
  try {
    // Generate unique review token
    const reviewToken = crypto.randomBytes(32).toString('hex');
    
    // Store review token in database
    const tokenQuery = `
      UPDATE delivery_requests 
      SET review_link_token = $1, review_link_sent = true, review_link_sent_at = NOW()
      WHERE request_id = $2
    `;
    await pool.query(tokenQuery, [reviewToken, deliveryRequest.request_id]);
    
    // Generate review link
    const reviewLink = `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/review/${deliveryRequest.request_id}/${reviewToken}`;
    
    // Get courier name
    let courierName = 'Your courier';
    if (deliveryRequest.courier_id) {
      const courierQuery = 'SELECT first_name, last_name FROM users WHERE user_id = $1';
      const courierResult = await pool.query(courierQuery, [deliveryRequest.courier_id]);
      if (courierResult.rows.length > 0) {
        const courier = courierResult.rows[0];
        courierName = `${courier.first_name} ${courier.last_name}`;
      }
    }
    
    // Generate email HTML
    const emailHtml = generateReviewRequestEmail({
      customerName: order.customer?.first_name || deliveryRequest.customer_name || 'Valued Customer',
      orderNumber: order.order_number || order.id,
      courierName,
      reviewLink
    });
    
    // Send email
    await sendEmail({
      to: order.email || deliveryRequest.customer_email,
      subject: `How was your delivery experience? Order #${order.order_number}`,
      html: emailHtml
    });
    
    console.log(`Review request email sent for order ${order.order_number}`);
    
    // Schedule reminder for 7 days later
    await scheduleReviewReminder(deliveryRequest.request_id, 7);
    
  } catch (error) {
    console.error('Error sending review request email:', error);
    // Don't throw - we don't want to fail the webhook if email fails
  }
};

// Schedule review reminder
const scheduleReviewReminder = async (requestId: string, daysDelay: number) => {
  try {
    const reminderQuery = `
      INSERT INTO review_reminders (request_id, scheduled_for, status)
      VALUES ($1, NOW() + INTERVAL '${daysDelay} days', 'pending')
    `;
    await pool.query(reminderQuery, [requestId]);
    console.log(`Scheduled review reminder for request ${requestId} in ${daysDelay} days`);
  } catch (error) {
    console.error('Error scheduling review reminder:', error);
  }
};

// Main webhook handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply minimal security for webhooks (no auth required, but rate limiting)
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false,
    rateLimit: 'default'
  });
  
  if (!security.success) {
    return;
  }

  try {
    const { provider } = req.query;

    switch (provider) {
      case 'shopify':
        return await handleShopifyWebhook(req, res);
        
      case 'stripe':
        return await handleStripeWebhook(req, res);
        
      case 'external':
        return await handleExternalWebhook(req, res);
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook provider'
        });
    }
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Webhook processing failed'
    });
  }
}
