import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Unified Webhook Router
 * Routes webhook events from ALL couriers to appropriate handlers
 * 
 * Critical for:
 * - Real-time tracking updates
 * - ETA tracking (for OTD metrics)
 * - Delivery confirmation (for ratings)
 * - Exception detection (for reviews)
 * - Performance analytics (TrustScore)
 */

export interface WebhookEvent {
  courier_code: string;
  tracking_number: string;
  shipment_id?: string;
  event_type: string;
  event_timestamp: string;
  event_description: string;
  location?: string;
  status: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  exception_reason?: string;
  signature?: string;
  photo_url?: string;
  raw_payload: any;
}

export interface WebhookResult {
  success: boolean;
  order_id?: string;
  tracking_number: string;
  event_type: string;
  status_changed: boolean;
  old_status?: string;
  new_status?: string;
  eta_changed: boolean;
  old_eta?: string;
  new_eta?: string;
  otd_status?: 'on_time' | 'delayed' | 'early' | 'unknown';
  error?: string;
}

export class WebhookRouter {
  /**
   * Detect courier from webhook request
   */
  static detectCourier(req: Request): string | null {
    // Check X-Courier header
    const courierHeader = req.headers['x-courier'] as string;
    if (courierHeader) {
      return courierHeader.toLowerCase();
    }

    // Check User-Agent
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    if (userAgent.includes('postnord')) return 'postnord';
    if (userAgent.includes('bring')) return 'bring';
    if (userAgent.includes('budbee')) return 'budbee';
    if (userAgent.includes('dhl')) return 'dhl';

    // Check payload structure
    const body = req.body;
    if (body?.shipmentId && body?.events) return 'postnord';
    if (body?.consignmentId) return 'bring';
    if (body?.orderId && body?.status) return 'budbee';
    if (body?.shipments && body?.events) return 'dhl';

    return null;
  }

  /**
   * Route webhook to appropriate handler
   */
  static async route(req: Request, res: Response): Promise<WebhookResult> {
    const courier = this.detectCourier(req);

    if (!courier) {
      throw new Error('Unable to detect courier from webhook');
    }

    // Import courier-specific handler
    let handler;
    switch (courier) {
      case 'postnord':
        const { PostNordWebhook } = await import('./PostNordWebhook');
        handler = PostNordWebhook;
        break;
      case 'bring':
        const { BringWebhook } = await import('./BringWebhook');
        handler = BringWebhook;
        break;
      case 'budbee':
        const { BudbeeWebhook } = await import('./BudbeeWebhook');
        handler = BudbeeWebhook;
        break;
      case 'dhl':
        const { DHLWebhook } = await import('./DHLWebhook');
        handler = DHLWebhook;
        break;
      default:
        throw new Error(`Unsupported courier: ${courier}`);
    }

    // Verify signature
    const isValid = await handler.verifySignature(req);
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    // Parse event
    const event = await handler.parseEvent(req);

    // Process event
    const result = await this.processEvent(event);

    return result;
  }

  /**
   * Process webhook event
   * Updates order, tracking cache, creates events, calculates metrics
   */
  static async processEvent(event: WebhookEvent): Promise<WebhookResult> {
    try {
      // Find order by tracking number
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          order_id,
          tracking_number,
          order_status,
          estimated_delivery,
          created_at,
          courier_metadata,
          courier_id,
          couriers!inner (courier_code)
        `)
        .eq('tracking_number', event.tracking_number)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found for tracking number: ${event.tracking_number}`);
      }

      const oldStatus = order.order_status;
      const oldEta = order.estimated_delivery;

      // Map courier status to Performile status
      const newStatus = this.mapStatus(event.status, event.courier_code);

      // Update courier metadata
      const courierMetadata = order.courier_metadata || {};
      const courierKey = event.courier_code.toLowerCase();
      
      courierMetadata[courierKey] = {
        ...courierMetadata[courierKey],
        last_tracking_update: event.event_timestamp,
        tracking_status: event.status,
        latest_event: {
          timestamp: event.event_timestamp,
          description: event.event_description,
          location: event.location
        },
        events_count: (courierMetadata[courierKey]?.events_count || 0) + 1
      };

      // Update ETA if provided
      if (event.estimated_delivery) {
        courierMetadata[courierKey].estimated_delivery = event.estimated_delivery;
      }

      // Add delivery proof if provided
      if (event.signature || event.photo_url) {
        courierMetadata[courierKey].proof_of_delivery = {
          signature: event.signature,
          photo_url: event.photo_url,
          delivered_at: event.actual_delivery || event.event_timestamp
        };
      }

      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          order_status: newStatus,
          estimated_delivery: event.estimated_delivery || order.estimated_delivery,
          courier_metadata: courierMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', order.order_id);

      if (updateError) {
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      // Create tracking event
      await supabase
        .from('tracking_events')
        .insert({
          order_id: order.order_id,
          event_type: event.event_type,
          event_timestamp: event.event_timestamp,
          event_description: event.event_description,
          location: event.location,
          status: event.status,
          courier_status: event.status,
          performile_status: newStatus,
          raw_data: event.raw_payload
        });

      // Update tracking cache
      await supabase.rpc('update_tracking_cache', {
        p_courier_id: order.courier_id,
        p_tracking_number: event.tracking_number,
        p_tracking_data: event.raw_payload,
        p_ttl_minutes: 60
      });

      // Calculate OTD status
      const otdStatus = this.calculateOTDStatus(
        order.created_at,
        order.estimated_delivery,
        event.actual_delivery,
        newStatus
      );

      // If delivered, calculate performance metrics
      if (newStatus === 'delivered' && event.actual_delivery) {
        await this.updatePerformanceMetrics(
          order.courier_id,
          order.order_id,
          order.estimated_delivery,
          event.actual_delivery,
          otdStatus
        );
      }

      // Log webhook
      await supabase
        .from('courier_api_requests')
        .insert({
          courier_id: order.courier_id,
          request_type: 'webhook',
          endpoint: `/webhook/${event.courier_code}`,
          request_data: event.raw_payload,
          response_data: { success: true },
          status_code: 200,
          response_time_ms: 0
        });

      // Send notifications (if status changed)
      if (oldStatus !== newStatus) {
        const { UnifiedNotificationService } = await import('../services/UnifiedNotificationService');
        
        // Get order details for notifications
        const { data: orderDetails } = await supabase
          .from('orders')
          .select(`
            customer_email,
            customer_name,
            stores!inner (
              store_name,
              owner_user_id,
              users!inner (email, full_name)
            ),
            couriers!inner (courier_name)
          `)
          .eq('order_id', order.order_id)
          .single();

        if (orderDetails && orderDetails.stores && orderDetails.couriers) {
          const store: any = Array.isArray(orderDetails.stores) ? orderDetails.stores[0] : orderDetails.stores;
          const courier: any = Array.isArray(orderDetails.couriers) ? orderDetails.couriers[0] : orderDetails.couriers;
          const user: any = store && Array.isArray(store.users) ? store.users[0] : store?.users;

          await UnifiedNotificationService.sendNotifications({
            order_id: order.order_id,
            tracking_number: event.tracking_number,
            event_type: event.event_type,
            old_status: oldStatus,
            new_status: newStatus,
            courier_name: courier?.courier_name || event.courier_code,
            courier_code: event.courier_code,
            customer_email: orderDetails.customer_email,
            customer_name: orderDetails.customer_name,
            merchant_email: user?.email,
            merchant_name: user?.full_name,
            store_name: store?.store_name,
            estimated_delivery: event.estimated_delivery,
            actual_delivery: event.actual_delivery,
            exception_reason: event.exception_reason,
            otd_status: otdStatus
          });
        }
      }

      return {
        success: true,
        order_id: order.order_id,
        tracking_number: event.tracking_number,
        event_type: event.event_type,
        status_changed: oldStatus !== newStatus,
        old_status: oldStatus,
        new_status: newStatus,
        eta_changed: oldEta !== event.estimated_delivery,
        old_eta: oldEta,
        new_eta: event.estimated_delivery,
        otd_status: otdStatus
      };
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        tracking_number: event.tracking_number,
        event_type: event.event_type,
        status_changed: false,
        eta_changed: false,
        error: error.message
      };
    }
  }

  /**
   * Map courier-specific status to Performile unified status
   */
  static mapStatus(courierStatus: string, courierCode: string): string {
    const statusMap: Record<string, Record<string, string>> = {
      postnord: {
        'INFORMED': 'pending',
        'COLLECTED': 'picked_up',
        'IN_TRANSIT': 'in_transit',
        'ARRIVED_AT_DELIVERY_POINT': 'out_for_delivery',
        'DELIVERED': 'delivered',
        'RETURNED': 'returned',
        'STOPPED': 'exception',
        'NOTIFICATION_SENT': 'out_for_delivery',
        'READY_FOR_PICKUP': 'ready_for_pickup'
      },
      bring: {
        'REGISTERED': 'pending',
        'COLLECTED': 'picked_up',
        'IN_TRANSIT': 'in_transit',
        'DELIVERED': 'delivered',
        'RETURNED': 'returned',
        'EXCEPTION': 'exception'
      },
      budbee: {
        'CREATED': 'pending',
        'PICKED_UP': 'picked_up',
        'IN_TRANSIT': 'in_transit',
        'OUT_FOR_DELIVERY': 'out_for_delivery',
        'DELIVERED': 'delivered',
        'EXCEPTION': 'exception'
      },
      dhl: {
        'TRANSIT': 'in_transit',
        'DELIVERED': 'delivered',
        'EXCEPTION': 'exception',
        'RETURNED': 'returned'
      }
    };

    const map = statusMap[courierCode.toLowerCase()];
    return map?.[courierStatus] || 'pending';
  }

  /**
   * Calculate On-Time Delivery (OTD) status
   * Critical for courier ratings and TrustScore
   */
  static calculateOTDStatus(
    orderDate: string,
    estimatedDelivery: string | null,
    actualDelivery: string | null,
    status: string
  ): 'on_time' | 'delayed' | 'early' | 'unknown' {
    if (!estimatedDelivery || !actualDelivery || status !== 'delivered') {
      return 'unknown';
    }

    const eta = new Date(estimatedDelivery);
    const actual = new Date(actualDelivery);

    // On time: delivered on or before ETA
    if (actual <= eta) {
      // Early: delivered more than 1 day before ETA
      const diffDays = (eta.getTime() - actual.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 1 ? 'early' : 'on_time';
    }

    // Delayed: delivered after ETA
    return 'delayed';
  }

  /**
   * Update courier performance metrics
   * Used for ratings, reviews, and TrustScore calculation
   */
  static async updatePerformanceMetrics(
    courierId: string,
    orderId: string,
    estimatedDelivery: string | null,
    actualDelivery: string,
    otdStatus: string
  ) {
    try {
      // Calculate delivery time in hours
      const eta = estimatedDelivery ? new Date(estimatedDelivery) : null;
      const actual = new Date(actualDelivery);
      const deliveryTimeHours = eta 
        ? Math.abs(actual.getTime() - eta.getTime()) / (1000 * 60 * 60)
        : null;

      // Insert or update courier performance record
      await supabase
        .from('courier_performance')
        .upsert({
          courier_id: courierId,
          order_id: orderId,
          estimated_delivery: estimatedDelivery,
          actual_delivery: actualDelivery,
          on_time_delivery: otdStatus === 'on_time' || otdStatus === 'early',
          delivery_time_hours: deliveryTimeHours,
          otd_status: otdStatus,
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'order_id'
        });

      // Update courier aggregate metrics (for TrustScore)
      await supabase.rpc('update_courier_metrics', {
        p_courier_id: courierId
      });
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
    }
  }
}
