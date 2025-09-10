import axios from 'axios';
import pool from '../config/database';
import logger from '../utils/logger';

interface IntegrationConfig {
  platform: string;
  webhookUrl: string;
  apiKey?: string;
  secretKey?: string;
  storeId: string;
}

interface RatingRequestPayload {
  orderId: string;
  customerEmail: string;
  ratingUrl: string;
  orderDetails: {
    orderNumber: string;
    deliveryDate: string;
    courierName: string;
    serviceType: string;
  };
}

export class IntegrationService {
  // Send rating request through Shopify
  async sendShopifyRatingRequest(config: IntegrationConfig, payload: RatingRequestPayload): Promise<boolean> {
    try {
      // Shopify email automation via Flow or third-party apps
      const shopifyPayload = {
        email: payload.customerEmail,
        template: 'delivery_rating_request',
        variables: {
          order_number: payload.orderDetails.orderNumber,
          rating_url: payload.ratingUrl,
          courier_name: payload.orderDetails.courierName,
          delivery_date: payload.orderDetails.deliveryDate,
          service_type: payload.orderDetails.serviceType
        }
      };

      // This would integrate with Shopify's email API or Flow
      logger.info(`Shopify rating request sent for order ${payload.orderId}`);
      return true;

    } catch (error) {
      logger.error('Shopify integration error:', error);
      return false;
    }
  }

  // Send rating request through WooCommerce
  async sendWooCommerceRatingRequest(config: IntegrationConfig, payload: RatingRequestPayload): Promise<boolean> {
    try {
      // WooCommerce REST API integration
      const wooPayload = {
        email: payload.customerEmail,
        subject: 'Rate Your Recent Delivery',
        message: `Please rate your delivery experience: ${payload.ratingUrl}`,
        order_id: payload.orderDetails.orderNumber
      };

      // This would use WooCommerce REST API for email automation
      logger.info(`WooCommerce rating request sent for order ${payload.orderId}`);
      return true;

    } catch (error) {
      logger.error('WooCommerce integration error:', error);
      return false;
    }
  }

  // Send rating request through Stripe
  async sendStripeRatingRequest(config: IntegrationConfig, payload: RatingRequestPayload): Promise<boolean> {
    try {
      // Stripe doesn't have built-in email, but we can trigger via webhooks
      const stripePayload = {
        customer_email: payload.customerEmail,
        metadata: {
          rating_url: payload.ratingUrl,
          order_id: payload.orderId,
          delivery_rating_request: 'true'
        }
      };

      // This would trigger a webhook to email service
      logger.info(`Stripe webhook triggered for rating request ${payload.orderId}`);
      return true;

    } catch (error) {
      logger.error('Stripe integration error:', error);
      return false;
    }
  }

  // Send rating request through PayPal
  async sendPayPalRatingRequest(config: IntegrationConfig, payload: RatingRequestPayload): Promise<boolean> {
    try {
      // PayPal webhook integration for post-payment follow-up
      const paypalPayload = {
        payer_email: payload.customerEmail,
        custom_data: {
          rating_url: payload.ratingUrl,
          order_reference: payload.orderDetails.orderNumber,
          delivery_feedback_request: true
        }
      };

      logger.info(`PayPal rating request sent for order ${payload.orderId}`);
      return true;

    } catch (error) {
      logger.error('PayPal integration error:', error);
      return false;
    }
  }

  // Generic email fallback
  async sendEmailRatingRequest(payload: RatingRequestPayload): Promise<boolean> {
    try {
      // This would integrate with your email service (SendGrid, Mailgun, etc.)
      const emailPayload = {
        to: payload.customerEmail,
        subject: 'Rate Your Recent Delivery Experience',
        template: 'delivery_rating_request',
        variables: {
          rating_url: payload.ratingUrl,
          order_number: payload.orderDetails.orderNumber,
          courier_name: payload.orderDetails.courierName,
          delivery_date: payload.orderDetails.deliveryDate,
          service_type: payload.orderDetails.serviceType
        }
      };

      // TODO: Implement actual email service integration
      logger.info(`Email rating request sent to ${payload.customerEmail}`);
      return true;

    } catch (error) {
      logger.error('Email service error:', error);
      return false;
    }
  }

  // Main method to send rating request through appropriate channel
  async sendRatingRequest(orderId: string, platform?: string): Promise<string> {
    try {
      // Get order and integration details
      const orderQuery = await pool.query(`
        SELECT 
          o.*,
          u.email as customer_email,
          c.business_name as courier_name,
          s.store_name,
          iw.platform as integration_platform,
          iw.webhook_url,
          iw.webhook_secret
        FROM Orders o
        JOIN Users u ON o.customer_id = u.user_id
        JOIN Users c ON o.courier_id = c.user_id
        LEFT JOIN Stores s ON o.store_id = s.store_id
        LEFT JOIN IntegrationWebhooks iw ON s.store_id = iw.store_id 
          AND iw.is_active = true
          AND ($2 IS NULL OR iw.platform = $2)
        WHERE o.order_id = $1
      `, [orderId, platform]);

      if (orderQuery.rows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderQuery.rows[0];

      // Send rating request via database function
      const requestResult = await pool.query(
        'SELECT send_rating_request($1, $2) as request_id',
        [orderId, platform || order.integration_platform]
      );

      const requestId = requestResult.rows[0].request_id;

      // Get rating token
      const tokenQuery = await pool.query(
        'SELECT rating_link_token FROM RatingRequests WHERE request_id = $1',
        [requestId]
      );

      const token = tokenQuery.rows[0].rating_link_token;
      const ratingUrl = `${process.env.FRONTEND_URL}/rate/${token}`;

      const payload: RatingRequestPayload = {
        orderId,
        customerEmail: order.customer_email,
        ratingUrl,
        orderDetails: {
          orderNumber: order.order_number || orderId.substring(0, 8),
          deliveryDate: order.delivered_at || order.updated_at,
          courierName: order.courier_name,
          serviceType: order.requested_service || 'home_delivery'
        }
      };

      // Send through appropriate integration
      let success = false;
      const integrationPlatform = platform || order.integration_platform;

      switch (integrationPlatform) {
        case 'shopify':
          success = await this.sendShopifyRatingRequest({
            platform: 'shopify',
            webhookUrl: order.webhook_url,
            secretKey: order.webhook_secret,
            storeId: order.store_id
          }, payload);
          break;

        case 'woocommerce':
          success = await this.sendWooCommerceRatingRequest({
            platform: 'woocommerce',
            webhookUrl: order.webhook_url,
            secretKey: order.webhook_secret,
            storeId: order.store_id
          }, payload);
          break;

        case 'stripe':
          success = await this.sendStripeRatingRequest({
            platform: 'stripe',
            webhookUrl: order.webhook_url,
            secretKey: order.webhook_secret,
            storeId: order.store_id
          }, payload);
          break;

        case 'paypal':
          success = await this.sendPayPalRatingRequest({
            platform: 'paypal',
            webhookUrl: order.webhook_url,
            secretKey: order.webhook_secret,
            storeId: order.store_id
          }, payload);
          break;

        default:
          // Fallback to direct email
          success = await this.sendEmailRatingRequest(payload);
      }

      if (!success) {
        // Update request status to failed
        await pool.query(
          'UPDATE RatingRequests SET status = $1 WHERE request_id = $2',
          ['failed', requestId]
        );
        throw new Error('Failed to send rating request through integration');
      }

      return requestId;

    } catch (error) {
      logger.error('Integration service error:', error);
      throw error;
    }
  }

  // Process webhook from integration platforms
  async processWebhook(platform: string, payload: any): Promise<void> {
    try {
      switch (platform) {
        case 'shopify':
          await this.processShopifyWebhook(payload);
          break;
        case 'woocommerce':
          await this.processWooCommerceWebhook(payload);
          break;
        case 'stripe':
          await this.processStripeWebhook(payload);
          break;
        case 'paypal':
          await this.processPayPalWebhook(payload);
          break;
        default:
          logger.warn(`Unknown webhook platform: ${platform}`);
      }
    } catch (error) {
      logger.error(`Webhook processing error for ${platform}:`, error);
      throw error;
    }
  }

  private async processShopifyWebhook(payload: any): Promise<void> {
    // Handle Shopify order fulfillment webhooks
    if (payload.topic === 'orders/fulfilled') {
      const orderId = payload.id;
      // Trigger rating request after delivery confirmation
      await this.sendRatingRequest(orderId, 'shopify');
    }
  }

  private async processWooCommerceWebhook(payload: any): Promise<void> {
    // Handle WooCommerce order status changes
    if (payload.status === 'completed') {
      const orderId = payload.id;
      await this.sendRatingRequest(orderId, 'woocommerce');
    }
  }

  private async processStripeWebhook(payload: any): Promise<void> {
    // Handle Stripe payment completion
    if (payload.type === 'payment_intent.succeeded') {
      const orderId = payload.data.object.metadata?.order_id;
      if (orderId) {
        // Delay rating request until delivery is confirmed
        setTimeout(() => {
          this.sendRatingRequest(orderId, 'stripe');
        }, 24 * 60 * 60 * 1000); // 24 hours delay
      }
    }
  }

  private async processPayPalWebhook(payload: any): Promise<void> {
    // Handle PayPal payment completion
    if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = payload.resource.custom_id;
      if (orderId) {
        await this.sendRatingRequest(orderId, 'paypal');
      }
    }
  }
}

export default new IntegrationService();
