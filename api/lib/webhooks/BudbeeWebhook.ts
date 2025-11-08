import { Request } from 'express';
import { SignatureVerifier } from './SignatureVerifier';
import { WebhookEvent } from './WebhookRouter';

/**
 * Budbee Webhook Handler
 * Parses and validates Budbee webhook events
 */

export class BudbeeWebhook {
  static async verifySignature(req: Request): Promise<boolean> {
    return SignatureVerifier.verifyBudbee(req);
  }

  static async parseEvent(req: Request): Promise<WebhookEvent> {
    const payload = req.body;

    if (!payload.orderId || !payload.status) {
      throw new Error('Invalid Budbee webhook payload');
    }

    const eventType = this.mapEventType(payload.status);

    return {
      courier_code: 'BUDBEE',
      tracking_number: payload.orderId,
      shipment_id: payload.orderId,
      event_type: eventType,
      event_timestamp: payload.timestamp || new Date().toISOString(),
      event_description: payload.statusDescription || payload.status,
      location: payload.location,
      status: payload.status,
      estimated_delivery: payload.estimatedDelivery,
      actual_delivery: payload.status === 'DELIVERED' ? payload.timestamp : undefined,
      exception_reason: payload.status === 'EXCEPTION' ? payload.statusDescription : undefined,
      raw_payload: payload
    };
  }

  static mapEventType(status: string): string {
    const eventMap: Record<string, string> = {
      'CREATED': 'label_created',
      'PICKED_UP': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'EXCEPTION': 'exception'
    };

    return eventMap[status] || 'unknown';
  }
}
