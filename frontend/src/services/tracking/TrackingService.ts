// =====================================================
// Unified Tracking Service
// =====================================================

import { TrackingAdapter, TrackingInfo, CourierAPIConfig } from './types';
import { PostNordAdapter } from './adapters/PostNordAdapter';

export class TrackingService {
  private adapters: Map<string, TrackingAdapter> = new Map();
  private cache: Map<string, { data: TrackingInfo; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  constructor() {
    this.initializeAdapters();
  }
  
  private initializeAdapters() {
    // Initialize PostNord
    const postNordConfig: CourierAPIConfig = {
      courierName: 'PostNord',
      apiKey: process.env.POSTNORD_API_KEY || '',
      baseUrl: 'https://api.postnord.com/rest/shipment/v5',
      apiVersion: 'v5',
      rateLimitPerMinute: 60,
    };
    this.adapters.set('postnord', new PostNordAdapter(postNordConfig));
    
    // Add more adapters as they're implemented
    // this.adapters.set('dhl', new DHLAdapter(dhlConfig));
    // this.adapters.set('bring', new BringAdapter(bringConfig));
  }
  
  /**
   * Get tracking information for a shipment
   */
  async getTracking(trackingNumber: string, courier: string): Promise<TrackingInfo> {
    const cacheKey = `${courier}:${trackingNumber}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    // Get adapter
    const adapter = this.getAdapter(courier);
    if (!adapter) {
      throw new Error(`Unsupported courier: ${courier}`);
    }
    
    // Validate tracking number
    if (!adapter.validateTrackingNumber(trackingNumber)) {
      throw new Error(`Invalid tracking number format for ${courier}`);
    }
    
    // Fetch tracking data
    const trackingInfo = await adapter.track(trackingNumber);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: trackingInfo,
      timestamp: Date.now(),
    });
    
    // Save to database
    await this.saveToDatabase(trackingInfo);
    
    return trackingInfo;
  }
  
  /**
   * Refresh tracking data (bypass cache)
   */
  async refreshTracking(trackingNumber: string, courier: string): Promise<TrackingInfo> {
    const cacheKey = `${courier}:${trackingNumber}`;
    this.cache.delete(cacheKey);
    return this.getTracking(trackingNumber, courier);
  }
  
  /**
   * Get adapter for a specific courier
   */
  private getAdapter(courier: string): TrackingAdapter | undefined {
    return this.adapters.get(courier.toLowerCase());
  }
  
  /**
   * Get list of supported couriers
   */
  getSupportedCouriers(): string[] {
    return Array.from(this.adapters.keys());
  }
  
  /**
   * Check if a courier is supported
   */
  isCourierSupported(courier: string): boolean {
    return this.adapters.has(courier.toLowerCase());
  }
  
  /**
   * Save tracking data to database
   */
  private async saveToDatabase(trackingInfo: TrackingInfo): Promise<void> {
    try {
      await fetch('/api/tracking/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackingInfo),
      });
    } catch (error) {
      console.error('Failed to save tracking data:', error);
      // Don't throw - tracking should work even if save fails
    }
  }
  
  /**
   * Subscribe to tracking updates
   */
  async subscribeToUpdates(
    trackingNumber: string,
    courier: string,
    webhookUrl?: string,
    email?: string,
    sms?: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/tracking/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber,
          courier,
          webhookUrl,
          email,
          sms,
        }),
      });
      
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Failed to subscribe to tracking updates:', error);
      return false;
    }
  }
  
  /**
   * Get tracking history from database
   */
  async getTrackingHistory(trackingNumber: string): Promise<TrackingInfo | null> {
    try {
      const response = await fetch(`/api/tracking/${trackingNumber}`);
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to get tracking history:', error);
      return null;
    }
  }
  
  /**
   * Clear cache for a specific tracking number
   */
  clearCache(trackingNumber?: string, courier?: string) {
    if (trackingNumber && courier) {
      this.cache.delete(`${courier}:${trackingNumber}`);
    } else {
      this.cache.clear();
    }
  }
}

// Export singleton instance
export const trackingService = new TrackingService();
