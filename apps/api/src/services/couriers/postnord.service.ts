/**
 * PostNord API Integration Service
 * 
 * Provides tracking, booking, and rate calculation for PostNord shipments
 * API Documentation: https://developer.postnord.com/
 */

import axios, { AxiosInstance } from 'axios';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface PostNordConfig {
  apiKey: string;
  baseUrl?: string;
  apiVersion?: string;
  locale?: string;
  timeout?: number;
}

export interface TrackingRequest {
  trackingNumber: string;
  locale?: string;
}

export interface TrackingEvent {
  eventCode: string;
  eventDescription: string;
  eventTime: string;
  location: {
    city?: string;
    country?: string;
    postalCode?: string;
  };
  status: string;
}

export interface TrackingResponse {
  shipmentId: string;
  trackingNumber: string;
  status: string;
  statusDescription: string;
  estimatedDeliveryDate?: string;
  deliveryDate?: string;
  events: TrackingEvent[];
  currentLocation?: {
    city: string;
    country: string;
  };
  recipientSignature?: string;
}

export interface BookingRequest {
  sender: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    email: string;
  };
  receiver: {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    phone: string;
    email?: string;
  };
  parcels: Array<{
    weight: number; // kg
    length: number; // cm
    width: number;
    height: number;
    contents?: string;
  }>;
  serviceCode: string;
  reference?: string;
  deliveryInstructions?: string;
}

export interface BookingResponse {
  shipmentId: string;
  trackingNumber: string;
  labelUrl: string;
  estimatedDeliveryDate: string;
  cost: {
    amount: number;
    currency: string;
  };
}

export interface RateRequest {
  fromPostalCode: string;
  fromCountry: string;
  toPostalCode: string;
  toCountry: string;
  weight: number; // kg
  serviceCode?: string;
  dateOfDeparture?: string;
}

export interface RateResponse {
  serviceCode: string;
  serviceName: string;
  price: {
    amount: number;
    currency: string;
  };
  estimatedDeliveryDate: string;
  transitDays: number;
}

export interface ServicePoint {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  openingHours: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  distance?: number; // meters
}

// =====================================================
// POSTNORD SERVICE CLASS
// =====================================================

export class PostNordService {
  private client: AxiosInstance;
  private config: PostNordConfig;

  constructor(config: PostNordConfig) {
    this.config = {
      baseUrl: config.baseUrl || 'https://api2.postnord.com/rest',
      apiVersion: config.apiVersion || 'v1',
      locale: config.locale || 'en',
      timeout: config.timeout || 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'apikey': this.config.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'locale': this.config.locale,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[PostNord] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[PostNord] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[PostNord] Response error:', error.response?.data || error.message);
        throw this.handleError(error);
      }
    );
  }

  // =====================================================
  // TRACKING API
  // =====================================================

  /**
   * Track a shipment by tracking number
   */
  async trackShipment(request: TrackingRequest): Promise<TrackingResponse> {
    try {
      const response = await this.client.get(
        `/business/${this.config.apiVersion}/shipment/trackandtrace/findByIdentifier.json`,
        {
          params: {
            id: request.trackingNumber,
            locale: request.locale || this.config.locale,
          },
        }
      );

      return this.parseTrackingResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to track shipment: ${error.message}`);
    }
  }

  /**
   * Track multiple shipments
   */
  async trackMultipleShipments(trackingNumbers: string[]): Promise<TrackingResponse[]> {
    const promises = trackingNumbers.map((trackingNumber) =>
      this.trackShipment({ trackingNumber })
    );

    const results = await Promise.allSettled(promises);

    return results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<TrackingResponse>).value);
  }

  /**
   * Parse PostNord tracking response to our standard format
   */
  private parseTrackingResponse(data: any): TrackingResponse {
    const shipment = data.TrackingInformationResponse?.shipments?.[0];

    if (!shipment) {
      throw new Error('No shipment data found in response');
    }

    const events: TrackingEvent[] = (shipment.items?.[0]?.events || []).map((event: any) => ({
      eventCode: event.eventCode || '',
      eventDescription: event.eventDescription || '',
      eventTime: event.eventTime || '',
      location: {
        city: event.location?.city,
        country: event.location?.countryCode,
        postalCode: event.location?.postCode,
      },
      status: this.mapPostNordStatus(event.status),
    }));

    // Get current location from latest event
    const latestEvent = events[0];

    return {
      shipmentId: shipment.shipmentId,
      trackingNumber: shipment.shipmentId,
      status: this.mapPostNordStatus(shipment.status),
      statusDescription: shipment.statusText?.header || '',
      estimatedDeliveryDate: shipment.estimatedTimeOfArrival,
      deliveryDate: shipment.deliveryDate,
      events,
      currentLocation: latestEvent?.location.city
        ? {
            city: latestEvent.location.city,
            country: latestEvent.location.country || '',
          }
        : undefined,
      recipientSignature: shipment.recipientSignature?.name,
    };
  }

  /**
   * Map PostNord status to our standard status
   */
  private mapPostNordStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'CREATED': 'created',
      'INFORMED': 'created',
      'COLLECTED': 'in_transit',
      'IN_TRANSIT': 'in_transit',
      'ARRIVED_AT_DELIVERY_POINT': 'out_for_delivery',
      'OUT_FOR_DELIVERY': 'out_for_delivery',
      'DELIVERED': 'delivered',
      'RETURNED': 'returned',
      'STOPPED': 'failed',
      'DELAYED': 'delayed',
    };

    return statusMap[status] || 'unknown';
  }

  // =====================================================
  // BOOKING API
  // =====================================================

  /**
   * Create a new shipment booking
   */
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await this.client.post(
        `/business/v3/booking`,
        this.formatBookingRequest(request)
      );

      return this.parseBookingResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
  }

  /**
   * Format booking request for PostNord API
   */
  private formatBookingRequest(request: BookingRequest): any {
    return {
      shipment: {
        sender: {
          name: request.sender.name,
          address: {
            streetName: request.sender.address,
            postalCode: request.sender.postalCode,
            city: request.sender.city,
            countryCode: request.sender.country,
          },
          contact: {
            phone: request.sender.phone,
            email: request.sender.email,
          },
        },
        receiver: {
          name: request.receiver.name,
          address: {
            streetName: request.receiver.address,
            postalCode: request.receiver.postalCode,
            city: request.receiver.city,
            countryCode: request.receiver.country,
          },
          contact: {
            phone: request.receiver.phone,
            email: request.receiver.email,
          },
        },
        parcels: request.parcels.map((parcel) => ({
          weight: {
            value: parcel.weight,
            unit: 'KG',
          },
          dimensions: {
            length: parcel.length,
            width: parcel.width,
            height: parcel.height,
            unit: 'CM',
          },
          contents: parcel.contents,
        })),
        service: {
          code: request.serviceCode,
        },
        reference: request.reference,
        deliveryInstructions: request.deliveryInstructions,
      },
    };
  }

  /**
   * Parse booking response
   */
  private parseBookingResponse(data: any): BookingResponse {
    return {
      shipmentId: data.shipmentId,
      trackingNumber: data.trackingNumber,
      labelUrl: data.labelUrl,
      estimatedDeliveryDate: data.estimatedDeliveryDate,
      cost: {
        amount: data.cost?.amount || 0,
        currency: data.cost?.currency || 'SEK',
      },
    };
  }

  // =====================================================
  // RATE CALCULATION API
  // =====================================================

  /**
   * Get shipping rates for a route
   */
  async getRates(request: RateRequest): Promise<RateResponse[]> {
    try {
      const response = await this.client.get(
        `/business/${this.config.apiVersion}/shippingguide/rates`,
        {
          params: {
            fromPostalCode: request.fromPostalCode,
            fromCountryCode: request.fromCountry,
            toPostalCode: request.toPostalCode,
            toCountryCode: request.toCountry,
            weight: request.weight,
            serviceCode: request.serviceCode,
            dateOfDeparture: request.dateOfDeparture,
          },
        }
      );

      return this.parseRatesResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to get rates: ${error.message}`);
    }
  }

  /**
   * Parse rates response
   */
  private parseRatesResponse(data: any): RateResponse[] {
    const services = data.services || [];

    return services.map((service: any) => ({
      serviceCode: service.code,
      serviceName: service.name,
      price: {
        amount: service.price?.amount || 0,
        currency: service.price?.currency || 'SEK',
      },
      estimatedDeliveryDate: service.estimatedDeliveryDate,
      transitDays: service.transitDays || 0,
    }));
  }

  // =====================================================
  // SERVICE POINTS API
  // =====================================================

  /**
   * Find service points near a location
   */
  async findServicePoints(
    postalCode: string,
    country: string,
    radius?: number
  ): Promise<ServicePoint[]> {
    try {
      const response = await this.client.get(
        `/business/${this.config.apiVersion}/servicepoint/findNearestByAddress.json`,
        {
          params: {
            postalCode,
            countryCode: country,
            numberOfServicePoints: 10,
            srId: radius || 5000, // Search radius in meters
          },
        }
      );

      return this.parseServicePointsResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to find service points: ${error.message}`);
    }
  }

  /**
   * Parse service points response
   */
  private parseServicePointsResponse(data: any): ServicePoint[] {
    const servicePoints = data.servicePointInformationResponse?.servicePoints || [];

    return servicePoints.map((sp: any) => ({
      id: sp.servicePointId,
      name: sp.name,
      address: sp.deliveryAddress?.streetName || '',
      postalCode: sp.deliveryAddress?.postalCode || '',
      city: sp.deliveryAddress?.city || '',
      country: sp.deliveryAddress?.countryCode || '',
      coordinates: {
        latitude: parseFloat(sp.coordinate?.northing || '0'),
        longitude: parseFloat(sp.coordinate?.easting || '0'),
      },
      openingHours: this.parseOpeningHours(sp.openingHours),
      distance: sp.routeDistance,
    }));
  }

  /**
   * Parse opening hours
   */
  private parseOpeningHours(openingHours: any): Array<{ day: string; open: string; close: string }> {
    if (!openingHours) return [];

    return Object.entries(openingHours).map(([day, hours]: [string, any]) => ({
      day,
      open: hours.from || '',
      close: hours.to || '',
    }));
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  /**
   * Validate tracking number format
   */
  validateTrackingNumber(trackingNumber: string): boolean {
    // PostNord tracking numbers are typically alphanumeric with country code
    // Example: 84971563697SE
    const regex = /^[A-Z0-9]{10,20}[A-Z]{2}$/;
    return regex.test(trackingNumber);
  }

  /**
   * Get available service codes
   */
  getAvailableServices(): Array<{ code: string; name: string; description: string }> {
    return [
      {
        code: '19',
        name: 'MyPack Home',
        description: 'Home delivery with notification',
      },
      {
        code: '17',
        name: 'MyPack Collect',
        description: 'Delivery to service point',
      },
      {
        code: 'PNSE',
        name: 'Parcel to Service Point',
        description: 'Standard parcel to service point',
      },
      {
        code: 'PNHM',
        name: 'Parcel to Home',
        description: 'Standard home delivery',
      },
    ];
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Bad request: ${message}`);
        case 401:
          return new Error('Authentication failed: Invalid API key');
        case 404:
          return new Error('Shipment not found');
        case 429:
          return new Error('Rate limit exceeded');
        case 500:
          return new Error('PostNord API error');
        default:
          return new Error(`API error (${status}): ${message}`);
      }
    }

    return new Error(`Network error: ${error.message}`);
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      // Use a known test tracking number
      await this.trackShipment({ trackingNumber: 'TESTPACKAGEDELIVERED' });
      return true;
    } catch (error) {
      console.error('[PostNord] Connection test failed:', error);
      return false;
    }
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

/**
 * Create a PostNord service instance
 */
export function createPostNordService(config: PostNordConfig): PostNordService {
  return new PostNordService(config);
}

// =====================================================
// EXPORTS
// =====================================================

export default PostNordService;
