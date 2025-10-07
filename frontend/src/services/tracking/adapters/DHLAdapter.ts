// =====================================================
// DHL Express Tracking Adapter
// =====================================================

import { BaseTrackingAdapter } from '../BaseAdapter';
import { TrackingInfo, TrackingStatus, TrackingEvent, Location } from '../types';

export class DHLAdapter extends BaseTrackingAdapter {
  get name(): string {
    return 'DHL';
  }
  
  validateTrackingNumber(trackingNumber: string): boolean {
    // DHL tracking numbers are typically 10 digits
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    return /^[0-9]{10}$/.test(cleaned);
  }
  
  protected getAuthHeaders(): Record<string, string> {
    return {
      'DHL-API-Key': this.config.apiKey || '',
    };
  }
  
  async track(trackingNumber: string): Promise<TrackingInfo> {
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    
    if (!this.validateTrackingNumber(cleaned)) {
      throw new Error('Invalid DHL tracking number format');
    }
    
    try {
      const data = await this.makeRequest(
        `/shipments?trackingNumber=${cleaned}`
      );
      
      return this.normalizeData(data, cleaned);
    } catch (error: any) {
      throw new Error(`DHL tracking failed: ${error.message}`);
    }
  }
  
  private normalizeData(raw: any, trackingNumber: string): TrackingInfo {
    const shipment = raw.shipments?.[0];
    
    if (!shipment) {
      throw new Error('No tracking information found');
    }
    
    const events = shipment.events || [];
    
    // Map events
    const trackingEvents: TrackingEvent[] = events.map((event: any) => ({
      eventTime: this.formatDate(event.timestamp),
      status: this.mapStatus(event.statusCode),
      statusDescription: event.description || '',
      location: this.parseLocation(event.location),
      courierEventCode: event.statusCode,
      courierEventDescription: event.description,
    }));
    
    // Get current status
    const currentStatus = this.mapStatus(shipment.status.statusCode);
    
    return {
      trackingNumber,
      courier: 'DHL',
      status: currentStatus,
      statusDescription: shipment.status.description,
      currentLocation: this.parseLocation(events[0]?.location),
      estimatedDelivery: shipment.estimatedDeliveryDate 
        ? this.formatDate(shipment.estimatedDeliveryDate) 
        : undefined,
      actualDelivery: currentStatus === TrackingStatus.DELIVERED && events[0]?.timestamp
        ? this.formatDate(events[0].timestamp)
        : undefined,
      events: trackingEvents,
      lastUpdated: new Date(),
      rawData: raw,
    };
  }
  
  private mapStatus(statusCode: string): TrackingStatus {
    const statusMap: Record<string, TrackingStatus> = {
      'delivered': TrackingStatus.DELIVERED,
      'ok': TrackingStatus.DELIVERED,
      'transit': TrackingStatus.IN_TRANSIT,
      'pickup': TrackingStatus.PICKED_UP,
      'failure': TrackingStatus.FAILED_DELIVERY,
      'unknown': TrackingStatus.EXCEPTION,
    };
    
    return statusMap[statusCode.toLowerCase()] || TrackingStatus.PENDING;
  }
  
  private parseLocation(location: any): Location | undefined {
    if (!location) return undefined;
    
    return {
      name: location.address?.addressLocality,
      city: location.address?.addressLocality,
      country: location.address?.countryCode,
      postalCode: location.address?.postalCode,
    };
  }
}
