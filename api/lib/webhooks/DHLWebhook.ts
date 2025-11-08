import { Request } from 'express';
import { SignatureVerifier } from './SignatureVerifier';
import { WebhookEvent } from './WebhookRouter';

/**
 * DHL Webhook Handler
 * Parses and validates DHL webhook events
 */

export class DHLWebhook {
  static async verifySignature(req: Request): Promise<boolean> {
    return SignatureVerifier.verifyDHL(req);
  }

  static async parseEvent(req: Request): Promise<WebhookEvent> {
    const payload = req.body;

    if (!payload.shipments || payload.shipments.length === 0) {
      throw new Error('Invalid DHL webhook payload');
    }

    const shipment = payload.shipments[0];
    const latestEvent = shipment.events?.[shipment.events.length - 1];

    if (!latestEvent) {
      throw new Error('No events in DHL webhook');
    }

    const eventType = this.mapEventType(latestEvent.statusCode);

    return {
      courier_code: 'DHL',
      tracking_number: shipment.id,
      shipment_id: shipment.id,
      event_type: eventType,
      event_timestamp: latestEvent.timestamp,
      event_description: latestEvent.description || latestEvent.statusCode,
      location: latestEvent.location?.address?.addressLocality,
      status: latestEvent.statusCode,
      estimated_delivery: shipment.estimatedDeliveryDate,
      actual_delivery: latestEvent.statusCode === 'DELIVERED' ? latestEvent.timestamp : undefined,
      exception_reason: latestEvent.statusCode === 'EXCEPTION' ? latestEvent.description : undefined,
      raw_payload: payload
    };
  }

  static mapEventType(statusCode: string): string {
    const eventMap: Record<string, string> = {
      'TRANSIT': 'in_transit',
      'DELIVERED': 'delivered',
      'EXCEPTION': 'exception',
      'RETURNED': 'returned',
      'OUT_FOR_DELIVERY': 'out_for_delivery'
    };

    return eventMap[statusCode] || 'unknown';
  }
}
