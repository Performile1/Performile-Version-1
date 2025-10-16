// =====================================================
// Base Tracking Adapter
// =====================================================

import { TrackingAdapter, TrackingInfo, CourierAPIConfig } from './types';

export abstract class BaseTrackingAdapter implements TrackingAdapter {
  protected config: CourierAPIConfig;
  
  constructor(config: CourierAPIConfig) {
    this.config = config;
  }
  
  abstract get name(): string;
  
  abstract track(trackingNumber: string): Promise<TrackingInfo>;
  
  abstract validateTrackingNumber(trackingNumber: string): boolean;
  
  // Optional methods with default implementations
  async getProofOfDelivery(trackingNumber: string) {
    return null;
  }
  
  async subscribeToUpdates(trackingNumber: string, webhookUrl: string) {
    return false;
  }
  
  // Helper methods for all adapters
  protected async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log successful request
      await this.logRequest(endpoint, options.method || 'GET', response.status, responseTime, false);
      
      return data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log failed request
      await this.logRequest(endpoint, options.method || 'GET', 0, responseTime, true, error.message);
      
      throw error;
    }
  }
  
  protected abstract getAuthHeaders(): Record<string, string>;
  
  protected async logRequest(
    endpoint: string,
    method: string,
    status: number,
    responseTime: number,
    isError: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      // Log to database via API
      await fetch('/api/tracking/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier: this.name,
          endpoint,
          method,
          status,
          responseTime,
          isError,
          errorMessage,
        }),
      });
    } catch (err) {
      console.error('Failed to log tracking request:', err);
    }
  }
  
  protected formatDate(date: string | Date): Date {
    return new Date(date);
  }
  
  protected cleanTrackingNumber(trackingNumber: string): string {
    return trackingNumber.trim().toUpperCase().replace(/\s+/g, '');
  }
}
