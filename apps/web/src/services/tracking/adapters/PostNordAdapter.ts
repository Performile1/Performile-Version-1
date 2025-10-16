// =====================================================
// PostNord Tracking Adapter
// =====================================================

import { BaseTrackingAdapter } from '../BaseAdapter';
import { TrackingInfo, TrackingStatus, TrackingEvent, Location } from '../types';

export class PostNordAdapter extends BaseTrackingAdapter {
  get name(): string {
    return 'PostNord';
  }
  
  validateTrackingNumber(trackingNumber: string): boolean {
    // PostNord tracking numbers are typically 18-20 digits
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    return /^[0-9]{18,20}$/.test(cleaned);
  }
  
  protected getAuthHeaders(): Record<string, string> {
    return {
      'apikey': this.config.apiKey || '',
    };
  }
  
  async track(trackingNumber: string): Promise<TrackingInfo> {
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    
    if (!this.validateTrackingNumber(cleaned)) {
      throw new Error('Invalid PostNord tracking number format');
    }
    
    try {
      const data = await this.makeRequest(
        `/trackandtrace/findByIdentifier.json?id=${cleaned}&locale=en`
      );
      
      return this.normalizeData(data, cleaned);
    } catch (error: any) {
      throw new Error(`PostNord tracking failed: ${error.message}`);
    }
  }
  
  private normalizeData(raw: any, trackingNumber: string): TrackingInfo {
    const shipment = raw.TrackingInformationResponse?.shipments?.[0];
    
    if (!shipment) {
      throw new Error('No tracking information found');
    }
    
    const item = shipment.items?.[0];
    const events = item?.events || [];
    
    // Map events
    const trackingEvents: TrackingEvent[] = events.map((event: any) => ({
      eventTime: this.formatDate(event.eventTime),
      status: this.mapStatus(event.eventCode),
      statusDescription: event.eventDescription || '',
      location: this.parseLocation(event.location),
      courierEventCode: event.eventCode,
      courierEventDescription: event.eventDescription,
    }));
    
    // Get latest event
    const latestEvent = events[0];
    const currentStatus = this.mapStatus(latestEvent?.eventCode || shipment.statusCode);
    
    return {
      trackingNumber,
      courier: 'PostNord',
      status: currentStatus,
      statusDescription: shipment.statusText?.header || latestEvent?.eventDescription,
      currentLocation: this.parseLocation(latestEvent?.location),
      estimatedDelivery: shipment.estimatedTimeOfArrival 
        ? this.formatDate(shipment.estimatedTimeOfArrival) 
        : undefined,
      actualDelivery: currentStatus === TrackingStatus.DELIVERED && latestEvent?.eventTime
        ? this.formatDate(latestEvent.eventTime)
        : undefined,
      events: trackingEvents,
      lastUpdated: new Date(),
      rawData: raw,
    };
  }
  
  private mapStatus(eventCode: string): TrackingStatus {
    const statusMap: Record<string, TrackingStatus> = {
      // Delivered
      'DELIVERED': TrackingStatus.DELIVERED,
      'DELIVERED_TO_RECIPIENT': TrackingStatus.DELIVERED,
      'DELIVERED_TO_AGENT': TrackingStatus.DELIVERED,
      
      // Out for delivery
      'OUT_FOR_DELIVERY': TrackingStatus.OUT_FOR_DELIVERY,
      'LOADED_FOR_DELIVERY': TrackingStatus.OUT_FOR_DELIVERY,
      
      // In transit
      'IN_TRANSIT': TrackingStatus.IN_TRANSIT,
      'ARRIVED_AT_DELIVERY_FACILITY': TrackingStatus.IN_TRANSIT,
      'DEPARTED_FROM_FACILITY': TrackingStatus.IN_TRANSIT,
      
      // Picked up
      'PICKED_UP': TrackingStatus.PICKED_UP,
      'COLLECTED': TrackingStatus.PICKED_UP,
      
      // Failed
      'DELIVERY_FAILED': TrackingStatus.FAILED_DELIVERY,
      'DELIVERY_ATTEMPT_FAILED': TrackingStatus.FAILED_DELIVERY,
      'RECIPIENT_NOT_HOME': TrackingStatus.FAILED_DELIVERY,
      
      // Returned
      'RETURNED_TO_SENDER': TrackingStatus.RETURNED,
      'RETURN_IN_PROGRESS': TrackingStatus.RETURNED,
      
      // Exception
      'EXCEPTION': TrackingStatus.EXCEPTION,
      'DAMAGED': TrackingStatus.EXCEPTION,
      'LOST': TrackingStatus.EXCEPTION,
    };
    
    return statusMap[eventCode] || TrackingStatus.PENDING;
  }
  
  private parseLocation(location: any): Location | undefined {
    if (!location) return undefined;
    
    return {
      name: location.displayName || location.name,
      city: location.city,
      country: location.country,
      postalCode: location.postCode,
      coordinates: location.coordinate ? {
        lat: parseFloat(location.coordinate.northing),
        lng: parseFloat(location.coordinate.easting),
      } : undefined,
    };
  }
}
