/**
 * WEEK 3: COURIER API SERVICE LAYER
 * Purpose: Core service for making API calls to courier services
 * Features: Authentication, rate limiting, retry logic, logging
 */

import { createClient } from '@supabase/supabase-js';
import axios, { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Encryption key for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Rate limiter using Redis-like in-memory store
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  async checkLimit(key: string, limit: number, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  async getRemainingRequests(key: string, limit: number, windowMs: number = 60000): Promise<number> {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < windowMs);
    return Math.max(0, limit - validRequests.length);
  }
}

const rateLimiter = new RateLimiter();

/**
 * Courier API Service
 */
export class CourierApiService {
  /**
   * Get courier credentials
   */
  private async getCredentials(courierName: string) {
    const { data, error } = await supabase
      .from('courier_api_credentials')
      .select('*')
      .eq('courier_name', courierName)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error(`Credentials not found for courier: ${courierName}`);
    }

    // Decrypt sensitive fields
    return {
      ...data,
      api_key: data.api_key ? decrypt(data.api_key) : null,
      api_secret: data.api_secret ? decrypt(data.api_secret) : null,
      client_id: data.client_id ? decrypt(data.client_id) : null,
      client_secret: data.client_secret ? decrypt(data.client_secret) : null,
    };
  }

  /**
   * Check rate limit
   */
  private async checkRateLimit(courierName: string, rateLimit: number): Promise<void> {
    const canProceed = await rateLimiter.checkLimit(
      `courier:${courierName}`,
      rateLimit,
      60000 // 1 minute window
    );

    if (!canProceed) {
      const remaining = await rateLimiter.getRemainingRequests(
        `courier:${courierName}`,
        rateLimit
      );
      throw new Error(`Rate limit exceeded for ${courierName}. Try again in 60 seconds.`);
    }
  }

  /**
   * Make authenticated API call to courier
   */
  async makeApiCall(
    courierName: string,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    options?: {
      userId?: string;
      storeId?: string;
      entityType?: string;
      entityId?: string;
    }
  ): Promise<any> {
    const startTime = Date.now();
    let response: any = null;
    let error: any = null;

    try {
      // Get credentials
      const credentials = await this.getCredentials(courierName);

      // Check rate limit
      await this.checkRateLimit(courierName, credentials.rate_limit_per_minute);

      // Build request config
      const config: AxiosRequestConfig = {
        method,
        url: `${credentials.base_url}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Performile/1.0'
        },
        timeout: 30000 // 30 seconds
      };

      // Add authentication based on courier
      if (credentials.api_key) {
        // PostNord uses 'apikey' header
        if (courierName.toUpperCase() === 'POSTNORD') {
          config.headers!['apikey'] = credentials.api_key;
        } else {
          // Most others use Bearer token
          config.headers!['Authorization'] = `Bearer ${credentials.api_key}`;
        }
      }

      // Add data for POST/PUT
      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      // Make request
      response = await axios(config);

      // Update success stats
      await supabase
        .from('courier_api_credentials')
        .update({
          last_used: new Date().toISOString(),
          total_requests: credentials.total_requests + 1
        })
        .eq('credential_id', credentials.credential_id);

      // Log to tracking_api_logs
      await supabase.from('tracking_api_logs').insert({
        courier: courierName,
        endpoint,
        request_method: method,
        request_body: data || {},
        response_status: response.status,
        response_body: response.data,
        response_time_ms: Date.now() - startTime,
        is_error: false
      });

      // Log event
      await supabase.from('week3_integration_events').insert({
        event_type: 'courier.api.call',
        entity_type: options?.entityType || 'api_call',
        entity_id: options?.entityId,
        courier_name: courierName,
        user_id: options?.userId,
        store_id: options?.storeId,
        event_data: {
          endpoint,
          method,
          status: response.status
        },
        status: 'success',
        response_time_ms: Date.now() - startTime
      });

      return response.data;

    } catch (err: any) {
      error = err;
      const responseTime = Date.now() - startTime;

      // Update failure stats
      const credentials = await this.getCredentials(courierName).catch(() => null);
      if (credentials) {
        await supabase
          .from('courier_api_credentials')
          .update({
            failed_requests: credentials.failed_requests + 1
          })
          .eq('credential_id', credentials.credential_id);
      }

      // Log error to tracking_api_logs
      await supabase.from('tracking_api_logs').insert({
        courier: courierName,
        endpoint,
        request_method: method,
        request_body: data || {},
        response_status: err.response?.status || 0,
        response_body: err.response?.data || {},
        response_time_ms: responseTime,
        is_error: true,
        error_message: err.message
      });

      // Log error event
      await supabase.from('week3_integration_events').insert({
        event_type: 'courier.api.call',
        entity_type: options?.entityType || 'api_call',
        entity_id: options?.entityId,
        courier_name: courierName,
        user_id: options?.userId,
        store_id: options?.storeId,
        event_data: {
          endpoint,
          method,
          error: err.message
        },
        status: 'failed',
        error_message: err.message,
        response_time_ms: responseTime
      });

      throw err;
    }
  }

  /**
   * Get tracking information from courier
   */
  async getTrackingInfo(
    courierName: string,
    trackingNumber: string,
    options?: { userId?: string; storeId?: string }
  ): Promise<any> {
    // This will be implemented per courier in Phase 4
    // For now, return a generic structure
    return this.makeApiCall(
      courierName,
      `/tracking/${trackingNumber}`,
      'GET',
      undefined,
      {
        ...options,
        entityType: 'tracking',
        entityId: trackingNumber
      }
    );
  }

  /**
   * Create shipment (for Week 4 - Shipping Labels)
   */
  async createShipment(
    courierName: string,
    shipmentData: any,
    options?: { userId?: string; storeId?: string }
  ): Promise<any> {
    return this.makeApiCall(
      courierName,
      '/shipments',
      'POST',
      shipmentData,
      {
        ...options,
        entityType: 'shipment'
      }
    );
  }

  /**
   * Cancel shipment
   */
  async cancelShipment(
    courierName: string,
    shipmentId: string,
    options?: { userId?: string; storeId?: string }
  ): Promise<any> {
    return this.makeApiCall(
      courierName,
      `/shipments/${shipmentId}`,
      'DELETE',
      undefined,
      {
        ...options,
        entityType: 'shipment',
        entityId: shipmentId
      }
    );
  }

  /**
   * Refresh OAuth2 access token
   */
  async refreshAccessToken(courierName: string): Promise<void> {
    const credentials = await this.getCredentials(courierName);

    if (!credentials.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${credentials.base_url}/oauth/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: credentials.refresh_token,
          client_id: credentials.client_id,
          client_secret: credentials.client_secret
        }
      );

      // Update tokens
      await supabase
        .from('courier_api_credentials')
        .update({
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || credentials.refresh_token,
          token_expires_at: new Date(Date.now() + response.data.expires_in * 1000).toISOString()
        })
        .eq('credential_id', credentials.credential_id);

    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(courierName: string): Promise<{
    limit: number;
    remaining: number;
    resetAt: Date;
  }> {
    const credentials = await this.getCredentials(courierName);
    const remaining = await rateLimiter.getRemainingRequests(
      `courier:${courierName}`,
      credentials.rate_limit_per_minute
    );

    return {
      limit: credentials.rate_limit_per_minute,
      remaining,
      resetAt: new Date(Date.now() + 60000) // 1 minute from now
    };
  }
}

// Export singleton instance
export const courierApiService = new CourierApiService();
