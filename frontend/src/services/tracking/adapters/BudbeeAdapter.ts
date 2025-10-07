// =====================================================
// Budbee Tracking Adapter
// =====================================================

import { BaseTrackingAdapter } from '../BaseAdapter';
import { TrackingInfo, TrackingStatus, TrackingEvent } from '../types';

export class BudbeeAdapter extends BaseTrackingAdapter {
  get name(): string {
    return 'Budbee';
  }
  
  validateTrackingNumber(trackingNumber: string): boolean {
    // Budbee uses alphanumeric tracking numbers
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    return /^[A-Z0-9]{8,20}$/.test(cleaned);
  }
  
  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }
  
  async track(trackingNumber: string): Promise<TrackingInfo> {
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    
    if (!this.validateTrackingNumber(cleaned)) {
      throw new Error('Invalid Budbee tracking number format');
    }
    
    try {
      const data = await this.makeRequest(
        `/track/${cleaned}`
      );
      
      return this.normalizeData(data, cleaned);
    } catch (error: any) {
      throw new Error(`Budbee tracking failed: ${error.message}`);
    }
  }
  
  private normalizeData(raw: any, trackingNumber: string): TrackingInfo {
    const shipment = raw.shipment || raw;
    
    if (!shipment) {
      throw new Error('No tracking information found');
    }
    
    const events = shipment.events || [];
    
    // Map events
    const trackingEvents: TrackingEvent[] = events.map((event: any) => ({
      eventTime: this.formatDate(event.timestamp),
      status: this.mapStatus(event.status),
      statusDescription: event.description || event.status,
      location: event.location ? {
        name: event.location.address,
        city: event.location.city,
        postalCode: event.location.postalCode,
        coordinates: event.location.coordinates ? {
          lat: event.location.coordinates.latitude,
          lng: event.location.coordinates.longitude,
        } : undefined,
      } : undefined,
      courierEventCode: event.status,
    }));
    
    const currentStatus = this.mapStatus(shipment.status);
    
    return {
      trackingNumber,
      courier: 'Budbee',
      status: currentStatus,
      statusDescription: shipment.statusDescription,
      currentLocation: shipment.currentLocation ? {
        name: shipment.currentLocation.address,
        city: shipment.currentLocation.city,
      } : undefined,
      estimatedDelivery: shipment.deliveryWindow?.start 
        ? this.formatDate(shipment.deliveryWindow.start) 
        : undefined,
      deliveryWindowStart: shipment.deliveryWindow?.start 
        ? this.formatDate(shipment.deliveryWindow.start) 
        : undefined,
      deliveryWindowEnd: shipment.deliveryWindow?.end 
        ? this.formatDate(shipment.deliveryWindow.end) 
        : undefined,
      actualDelivery: currentStatus === TrackingStatus.DELIVERED && shipment.deliveredAt
        ? this.formatDate(shipment.deliveredAt)
        : undefined,
      events: trackingEvents,
      recipient: shipment.recipient ? {
        name: shipment.recipient.name,
        signature: shipment.recipient.signature,
      } : undefined,
      lastUpdated: new Date(),
      rawData: raw,
    };
  }
  
  private mapStatus(status: string): TrackingStatus {
    const statusMap: Record<string, TrackingStatus> = {
      'delivered': TrackingStatus.DELIVERED,
      'out_for_delivery': TrackingStatus.OUT_FOR_DELIVERY,
      'in_transit': TrackingStatus.IN_TRANSIT,
      'at_terminal': TrackingStatus.IN_TRANSIT,
      'picked_up': TrackingStatus.PICKED_UP,
      'created': TrackingStatus.PENDING,
      'failed': TrackingStatus.FAILED_DELIVERY,
      'returned': TrackingStatus.RETURNED,
      'cancelled': TrackingStatus.CANCELLED,
    };
    
    return statusMap[status.toLowerCase()] || TrackingStatus.PENDING;
  }
}
