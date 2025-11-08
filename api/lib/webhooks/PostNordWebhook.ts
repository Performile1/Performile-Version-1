import { Request } from 'express';
import { SignatureVerifier } from './SignatureVerifier';
import { WebhookEvent } from './WebhookRouter';

/**
 * PostNord Webhook Handler
 * Parses and validates PostNord webhook events
 * 
 * PostNord Webhook Format:
 * {
 *   "shipmentId": "370123456789",
 *   "events": [
 *     {
 *       "eventCode": "DELIVERED",
 *       "eventTime": "2025-11-10T14:30:00Z",
 *       "eventDescription": "Delivered",
 *       "location": {
 *         "name": "Stockholm",
 *         "city": "Stockholm",
 *         "country": "SE"
 *       },
 *       "estimatedTimeOfArrival": "2025-11-10T18:00:00Z"
 *     }
 *   ]
 * }
 */

export class PostNordWebhook {
  /**
   * Verify PostNord webhook signature
   */
  static async verifySignature(req: Request): Promise<boolean> {
    return SignatureVerifier.verifyPostNord(req);
  }

  /**
   * Parse PostNord webhook event
   */
  static async parseEvent(req: Request): Promise<WebhookEvent> {
    const payload = req.body;

    if (!payload.shipmentId || !payload.events || payload.events.length === 0) {
      throw new Error('Invalid PostNord webhook payload');
    }

    // Get the latest event
    const latestEvent = payload.events[payload.events.length - 1];

    // Map PostNord event code to event type
    const eventType = this.mapEventType(latestEvent.eventCode);

    // Format location
    const location = latestEvent.location
      ? `${latestEvent.location.name || ''}, ${latestEvent.location.city || ''}, ${latestEvent.location.country || ''}`.trim()
      : undefined;

    return {
      courier_code: 'POSTNORD',
      tracking_number: payload.shipmentId,
      shipment_id: payload.shipmentId,
      event_type: eventType,
      event_timestamp: latestEvent.eventTime,
      event_description: latestEvent.eventDescription || latestEvent.eventCode,
      location: location,
      status: latestEvent.eventCode,
      estimated_delivery: latestEvent.estimatedTimeOfArrival,
      actual_delivery: latestEvent.eventCode === 'DELIVERED' ? latestEvent.eventTime : undefined,
      exception_reason: latestEvent.eventCode === 'STOPPED' ? latestEvent.eventDescription : undefined,
      signature: latestEvent.signature,
      photo_url: latestEvent.photoUrl,
      raw_payload: payload
    };
  }

  /**
   * Map PostNord event code to unified event type
   */
  static mapEventType(eventCode: string): string {
    const eventMap: Record<string, string> = {
      'INFORMED': 'label_created',
      'COLLECTED': 'picked_up',
      'IN_TRANSIT': 'in_transit',
      'ARRIVED_AT_DELIVERY_POINT': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'RETURNED': 'returned',
      'STOPPED': 'exception',
      'NOTIFICATION_SENT': 'notification',
      'READY_FOR_PICKUP': 'ready_for_pickup'
    };

    return eventMap[eventCode] || 'unknown';
  }

  /**
   * Extract ETA changes for OTD tracking
   */
  static extractETAChanges(payload: any): {
    previous_eta?: string;
    new_eta?: string;
    eta_changed: boolean;
  } {
    const events = payload.events || [];
    const etas = events
      .filter((e: any) => e.estimatedTimeOfArrival)
      .map((e: any) => e.estimatedTimeOfArrival);

    if (etas.length < 2) {
      return {
        new_eta: etas[0],
        eta_changed: false
      };
    }

    return {
      previous_eta: etas[etas.length - 2],
      new_eta: etas[etas.length - 1],
      eta_changed: etas[etas.length - 2] !== etas[etas.length - 1]
    };
  }
}
