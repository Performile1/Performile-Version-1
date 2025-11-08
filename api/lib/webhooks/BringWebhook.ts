import { Request } from 'express';
import { SignatureVerifier } from './SignatureVerifier';
import { WebhookEvent } from './WebhookRouter';

/**
 * Bring Webhook Handler
 * Parses and validates Bring webhook events
 * 
 * Bring Webhook Format:
 * {
 *   "consignmentId": "SHIPMENTID123",
 *   "trackingNumber": "370123456789",
 *   "event": {
 *     "status": "DELIVERED",
 *     "timestamp": "2025-11-10T14:30:00Z",
 *     "description": "Delivered to recipient",
 *     "location": "Oslo, Norway",
 *     "estimatedDeliveryDate": "2025-11-10"
 *   }
 * }
 */

export class BringWebhook {
  /**
   * Verify Bring webhook signature
   */
  static async verifySignature(req: Request): Promise<boolean> {
    return SignatureVerifier.verifyBring(req);
  }

  /**
   * Parse Bring webhook event
   */
  static async parseEvent(req: Request): Promise<WebhookEvent> {
    const payload = req.body;

    if (!payload.trackingNumber || !payload.event) {
      throw new Error('Invalid Bring webhook payload');
    }

    const event = payload.event;
    const eventType = this.mapEventType(event.status);

    return {
      courier_code: 'BRING',
      tracking_number: payload.trackingNumber,
      shipment_id: payload.consignmentId,
      event_type: eventType,
      event_timestamp: event.timestamp,
      event_description: event.description || event.status,
      location: event.location,
      status: event.status,
      estimated_delivery: event.estimatedDeliveryDate 
        ? `${event.estimatedDeliveryDate}T18:00:00Z` 
        : undefined,
      actual_delivery: event.status === 'DELIVERED' ? event.timestamp : undefined,
      exception_reason: event.status === 'EXCEPTION' ? event.description : undefined,
      signature: event.signature,
      photo_url: event.photoUrl,
      raw_payload: payload
    };
  }

  /**
   * Map Bring status to unified event type
   */
  static mapEventType(status: string): string {
    const eventMap: Record<string, string> = {
      'REGISTERED': 'label_created',
      'COLLECTED': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'DELIVERED': 'delivered',
      'RETURNED': 'returned',
      'EXCEPTION': 'exception',
      'READY_FOR_PICKUP': 'ready_for_pickup'
    };

    return eventMap[status] || 'unknown';
  }
}
