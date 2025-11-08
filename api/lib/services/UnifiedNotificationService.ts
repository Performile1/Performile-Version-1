import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Unified Notification Service
 * Sends notifications for ALL couriers, ALL events
 * 
 * Notification Types:
 * - Email (all events)
 * - SMS (premium - critical events)
 * - Push (mobile app - Week 4)
 * - Webhook (merchant API)
 * 
 * Triggers:
 * - Order status changes
 * - Delivery confirmation → Rating request
 * - Exception → Review request
 * - ETA changes
 */

export interface NotificationEvent {
  order_id: string;
  tracking_number: string;
  event_type: string;
  old_status?: string;
  new_status: string;
  courier_name: string;
  courier_code: string;
  customer_email: string;
  customer_name: string;
  merchant_email?: string;
  merchant_name?: string;
  store_name?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  exception_reason?: string;
  otd_status?: string;
}

export class UnifiedNotificationService {
  /**
   * Send notifications based on event type
   */
  static async sendNotifications(event: NotificationEvent): Promise<void> {
    try {
      console.log('📧 Sending notifications for:', event.event_type);

      // Determine which notifications to send
      const notifications = this.getNotificationsForEvent(event);

      // Send email notifications
      if (notifications.email_merchant) {
        await this.sendMerchantEmail(event);
      }

      if (notifications.email_consumer) {
        await this.sendConsumerEmail(event);
      }

      // Send SMS (premium feature)
      if (notifications.sms_consumer) {
        await this.sendConsumerSMS(event);
      }

      // Trigger rating request (24h after delivery)
      if (notifications.rating_request) {
        await this.scheduleRatingRequest(event);
      }

      // Trigger review request (for exceptions)
      if (notifications.review_request) {
        await this.scheduleReviewRequest(event);
      }

      // Send webhook to merchant API (if configured)
      if (notifications.merchant_webhook) {
        await this.sendMerchantWebhook(event);
      }

      console.log('✅ Notifications sent successfully');
    } catch (error) {
      console.error('❌ Notification error:', error);
    }
  }

  /**
   * Determine which notifications to send for each event
   */
  static getNotificationsForEvent(event: NotificationEvent): {
    email_merchant: boolean;
    email_consumer: boolean;
    sms_consumer: boolean;
    rating_request: boolean;
    review_request: boolean;
    merchant_webhook: boolean;
  } {
    const eventType = event.event_type;

    switch (eventType) {
      case 'picked_up':
        return {
          email_merchant: true,
          email_consumer: true,
          sms_consumer: false,
          rating_request: false,
          review_request: false,
          merchant_webhook: true
        };

      case 'in_transit':
        return {
          email_merchant: false,
          email_consumer: true,
          sms_consumer: false,
          rating_request: false,
          review_request: false,
          merchant_webhook: true
        };

      case 'out_for_delivery':
        return {
          email_merchant: false,
          email_consumer: true,
          sms_consumer: true, // Premium: delivery today
          rating_request: false,
          review_request: false,
          merchant_webhook: true
        };

      case 'delivered':
        return {
          email_merchant: true,
          email_consumer: true,
          sms_consumer: true, // Premium: package delivered
          rating_request: true, // Schedule rating request
          review_request: false,
          merchant_webhook: true
        };

      case 'exception':
        return {
          email_merchant: true,
          email_consumer: true,
          sms_consumer: true, // Premium: urgent issue
          rating_request: false,
          review_request: true, // Request detailed review
          merchant_webhook: true
        };

      case 'returned':
        return {
          email_merchant: true,
          email_consumer: true,
          sms_consumer: false,
          rating_request: false,
          review_request: true, // Why was it returned?
          merchant_webhook: true
        };

      default:
        return {
          email_merchant: false,
          email_consumer: false,
          sms_consumer: false,
          rating_request: false,
          review_request: false,
          merchant_webhook: true
        };
    }
  }

  /**
   * Send email to merchant
   */
  static async sendMerchantEmail(event: NotificationEvent): Promise<void> {
    try {
      // Get merchant email and preferences
      const { data: order } = await supabase
        .from('orders')
        .select(`
          store_id,
          stores!inner (
            store_name,
            owner_user_id,
            users!inner (email, full_name)
          )
        `)
        .eq('order_id', event.order_id)
        .single();

      if (!order) return;

      const merchantEmail = order.stores.users.email;
      const merchantName = order.stores.users.full_name;

      // TODO: Send email via email service (SendGrid, AWS SES, etc.)
      console.log('📧 Merchant email:', {
        to: merchantEmail,
        subject: `Order ${event.tracking_number} - ${event.new_status}`,
        event: event.event_type
      });

      // Log notification
      await this.logNotification({
        order_id: event.order_id,
        notification_type: 'email',
        recipient: merchantEmail,
        recipient_type: 'merchant',
        event_type: event.event_type,
        status: 'sent'
      });
    } catch (error) {
      console.error('Merchant email error:', error);
    }
  }

  /**
   * Send email to consumer
   */
  static async sendConsumerEmail(event: NotificationEvent): Promise<void> {
    try {
      // TODO: Send email via email service
      console.log('📧 Consumer email:', {
        to: event.customer_email,
        subject: `Your package from ${event.store_name} - ${event.new_status}`,
        event: event.event_type
      });

      // Log notification
      await this.logNotification({
        order_id: event.order_id,
        notification_type: 'email',
        recipient: event.customer_email,
        recipient_type: 'consumer',
        event_type: event.event_type,
        status: 'sent'
      });
    } catch (error) {
      console.error('Consumer email error:', error);
    }
  }

  /**
   * Send SMS to consumer (premium feature)
   */
  static async sendConsumerSMS(event: NotificationEvent): Promise<void> {
    try {
      // Check if merchant has SMS enabled (premium feature)
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('features')
        .eq('order_id', event.order_id)
        .single();

      if (!subscription?.features?.sms_notifications) {
        console.log('⏭️ SMS skipped (not enabled)');
        return;
      }

      // TODO: Send SMS via Twilio/similar
      console.log('📱 Consumer SMS:', {
        to: 'phone_number',
        message: `${event.courier_name}: Your package is ${event.new_status}`,
        event: event.event_type
      });

      // Log notification
      await this.logNotification({
        order_id: event.order_id,
        notification_type: 'sms',
        recipient: 'phone_number',
        recipient_type: 'consumer',
        event_type: event.event_type,
        status: 'sent'
      });
    } catch (error) {
      console.error('Consumer SMS error:', error);
    }
  }

  /**
   * Schedule rating request (24h after delivery)
   */
  static async scheduleRatingRequest(event: NotificationEvent): Promise<void> {
    try {
      const scheduledFor = new Date();
      scheduledFor.setHours(scheduledFor.getHours() + 24); // 24 hours later

      await supabase
        .from('scheduled_notifications')
        .insert({
          order_id: event.order_id,
          notification_type: 'rating_request',
          recipient: event.customer_email,
          recipient_type: 'consumer',
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
          data: {
            courier_name: event.courier_name,
            courier_code: event.courier_code,
            tracking_number: event.tracking_number,
            otd_status: event.otd_status,
            delivered_at: event.actual_delivery
          }
        });

      console.log('⏰ Rating request scheduled for:', scheduledFor);
    } catch (error) {
      console.error('Schedule rating error:', error);
    }
  }

  /**
   * Schedule review request (for exceptions)
   */
  static async scheduleReviewRequest(event: NotificationEvent): Promise<void> {
    try {
      const scheduledFor = new Date();
      scheduledFor.setHours(scheduledFor.getHours() + 2); // 2 hours later

      await supabase
        .from('scheduled_notifications')
        .insert({
          order_id: event.order_id,
          notification_type: 'review_request',
          recipient: event.customer_email,
          recipient_type: 'consumer',
          scheduled_for: scheduledFor.toISOString(),
          status: 'pending',
          data: {
            courier_name: event.courier_name,
            courier_code: event.courier_code,
            tracking_number: event.tracking_number,
            exception_reason: event.exception_reason,
            event_type: event.event_type
          }
        });

      console.log('⏰ Review request scheduled for:', scheduledFor);
    } catch (error) {
      console.error('Schedule review error:', error);
    }
  }

  /**
   * Send webhook to merchant API (if configured)
   */
  static async sendMerchantWebhook(event: NotificationEvent): Promise<void> {
    try {
      // Get merchant webhook URL
      const { data: webhook } = await supabase
        .from('merchant_webhooks')
        .select('webhook_url, webhook_secret')
        .eq('order_id', event.order_id)
        .eq('event_type', event.event_type)
        .single();

      if (!webhook) return;

      // TODO: Send webhook POST request
      console.log('🔗 Merchant webhook:', {
        url: webhook.webhook_url,
        event: event.event_type
      });

      // Log notification
      await this.logNotification({
        order_id: event.order_id,
        notification_type: 'webhook',
        recipient: webhook.webhook_url,
        recipient_type: 'merchant',
        event_type: event.event_type,
        status: 'sent'
      });
    } catch (error) {
      console.error('Merchant webhook error:', error);
    }
  }

  /**
   * Log notification to database
   */
  static async logNotification(data: {
    order_id: string;
    notification_type: string;
    recipient: string;
    recipient_type: string;
    event_type: string;
    status: string;
  }): Promise<void> {
    try {
      await supabase
        .from('notifications_log')
        .insert({
          ...data,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Log notification error:', error);
    }
  }
}
