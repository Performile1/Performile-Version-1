import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TrackingResponse {
  shipmentId: string;
  status: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  description: string;
  status: string;
}

export class PostNordCourier {
  private apiKey: string;
  private baseUrl = 'https://api2.postnord.com';
  private courierId: string;

  constructor(apiKey: string, courierId: string) {
    this.apiKey = apiKey;
    this.courierId = courierId;
  }

  // Track shipment by ID
  async trackByShipmentId(shipmentId: string): Promise<TrackingResponse> {
    const startTime = Date.now();
    const endpoint = `${this.baseUrl}/rest/shipment/v7/trackandtrace/findByIdentifier.json`;
    const url = `${endpoint}?apikey=${this.apiKey}&id=${shipmentId}&locale=en`;

    try {
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      // Log request
      await this.logApiRequest(
        endpoint,
        'GET',
        null,
        response.status,
        data,
        responseTime,
        response.ok,
        shipmentId
      );

      if (!response.ok) {
        throw new Error(data.error?.description || 'Tracking failed');
      }

      return this.parseTrackingResponse(data);
    } catch (error: any) {
      await this.logApiRequest(
        endpoint,
        'GET',
        null,
        0,
        null,
        Date.now() - startTime,
        false,
        shipmentId,
        error.message
      );
      throw error;
    }
  }

  // Generate tracking URL
  async getTrackingUrl(shipmentId: string, countryCode: string = 'SE'): Promise<string> {
    const endpoint = `${this.baseUrl}/rest/links/v1/shipment/tracking/url`;
    const url = `${endpoint}?apikey=${this.apiKey}&shipmentId=${shipmentId}&countryCode=${countryCode}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Failed to generate tracking URL');
    }

    return data.url;
  }

  // Search postal code
  async searchPostalCode(postalCode: string, countryCode: string = 'SE'): Promise<any> {
    const endpoint = `${this.baseUrl}/rest/location/v2/address/search`;
    const url = `${endpoint}?apikey=${this.apiKey}&channel_id=performile&q=${postalCode}&country=${countryCode}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error('Postal code search failed');
    }

    return data;
  }

  // Parse tracking response
  private parseTrackingResponse(data: any): TrackingResponse {
    const shipment = data.TrackingInformationResponse?.shipments?.[0];
    const item = shipment?.items?.[0];
    const events = item?.events || [];

    return {
      shipmentId: shipment?.shipmentId || '',
      status: item?.status || 'UNKNOWN',
      estimatedDelivery: item?.estimatedTimeOfArrival,
      events: events.map((e: any) => ({
        timestamp: e.eventTime,
        location: e.location?.displayName || '',
        description: e.eventDescription,
        status: e.status
      }))
    };
  }

  // Log API request
  private async logApiRequest(
    endpoint: string,
    method: string,
    requestBody: any,
    status: number,
    responseBody: any,
    responseTime: number,
    success: boolean,
    trackingNumber?: string,
    errorMessage?: string
  ) {
    try {
      await supabase.rpc('log_courier_api_request', {
        p_courier_id: this.courierId,
        p_merchant_id: null,
        p_order_id: null,
        p_api_endpoint: endpoint,
        p_http_method: method,
        p_request_body: requestBody,
        p_response_status: status,
        p_response_body: responseBody,
        p_response_time_ms: responseTime,
        p_success: success,
        p_error_message: errorMessage,
        p_tracking_number: trackingNumber
      });
    } catch (error) {
      console.error('Failed to log API request:', error);
    }
  }
}
