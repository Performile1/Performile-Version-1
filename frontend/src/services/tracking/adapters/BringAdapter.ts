// =====================================================
// Bring (Posten Norge) Tracking Adapter
// =====================================================

import { BaseTrackingAdapter } from '../BaseAdapter';
import { TrackingInfo, TrackingStatus, TrackingEvent } from '../types';

export class BringAdapter extends BaseTrackingAdapter {
  get name(): string {
    return 'Bring';
  }
  
  validateTrackingNumber(trackingNumber: string): boolean {
    // Bring tracking numbers are typically 16-18 digits
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    return /^[0-9]{16,18}$/.test(cleaned) || /^TESTPACKAGE/.test(cleaned);
  }
  
  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-MyBring-API-Uid': this.config.clientId || '',
      'X-MyBring-API-Key': this.config.apiKey || '',
      'X-Bring-Client-URL': 'https://performile.com',
    };
  }
  
  async track(trackingNumber: string): Promise<TrackingInfo> {
    const cleaned = this.cleanTrackingNumber(trackingNumber);
    
    if (!this.validateTrackingNumber(cleaned)) {
      throw new Error('Invalid Bring tracking number format');
    }
    
    try {
      const data = await this.makeRequest(
        `/tracking.json?q=${cleaned}`
      );
      
      return this.normalizeData(data, cleaned);
    } catch (error: any) {
      throw new Error(`Bring tracking failed: ${error.message}`);
    }
  }
  
  private normalizeData(raw: any, trackingNumber: string): TrackingInfo {
    const consignment = raw.consignmentSet?.[0];
    
    if (!consignment) {
      throw new Error('No tracking information found');
    }
    
    const packageItem = consignment.packageSet?.[0];
    const events = packageItem?.eventSet || [];
    
    // Map events
    const trackingEvents: TrackingEvent[] = events.map((event: any) => ({
      eventTime: this.formatDate(event.dateIso),
      status: this.mapStatus(event.status),
      statusDescription: event.displayMessage || event.description || '',
      location: {
        name: event.displayLocation,
        city: event.city,
        country: event.country,
        postalCode: event.postalCode,
      },
      courierEventCode: event.status,
      courierEventDescription: event.description,
    }));
    
    // Get current status
    const latestEvent = events[0];
    const currentStatus = this.mapStatus(latestEvent?.status || consignment.status);
    
    return {
      trackingNumber,
      courier: 'Bring',
      status: currentStatus,
      statusDescription: latestEvent?.displayMessage || consignment.statusDescription,
      currentLocation: latestEvent ? {
        name: latestEvent.displayLocation,
        city: latestEvent.city,
        country: latestEvent.country,
      } : undefined,
      estimatedDelivery: consignment.estimatedDeliveryDate 
        ? this.formatDate(consignment.estimatedDeliveryDate) 
        : undefined,
      actualDelivery: currentStatus === TrackingStatus.DELIVERED && latestEvent?.dateIso
        ? this.formatDate(latestEvent.dateIso)
        : undefined,
      events: trackingEvents,
      lastUpdated: new Date(),
      rawData: raw,
    };
  }
  
  private mapStatus(status: string): TrackingStatus {
    const statusMap: Record<string, TrackingStatus> = {
      'DELIVERED': TrackingStatus.DELIVERED,
      'DELIVERED_SENDER': TrackingStatus.DELIVERED,
      'OUT_FOR_DELIVERY': TrackingStatus.OUT_FOR_DELIVERY,
      'TRANSPORT_TO_RECIPIENT': TrackingStatus.OUT_FOR_DELIVERY,
      'IN_TRANSIT': TrackingStatus.IN_TRANSIT,
      'ARRIVED_DELIVERY': TrackingStatus.IN_TRANSIT,
      'COLLECTED': TrackingStatus.PICKED_UP,
      'READY_FOR_PICKUP': TrackingStatus.PICKED_UP,
      'DELIVERY_FAILED': TrackingStatus.FAILED_DELIVERY,
      'RETURNED': TrackingStatus.RETURNED,
      'RETURN_TO_SENDER': TrackingStatus.RETURNED,
      'EXCEPTION': TrackingStatus.EXCEPTION,
    };
    
    return statusMap[status] || TrackingStatus.PENDING;
  }
}
