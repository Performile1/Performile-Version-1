// =====================================================
// Tracking System Types
// =====================================================

export enum TrackingStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
  EXCEPTION = 'exception'
}

export interface Location {
  name?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TrackingEvent {
  eventTime: Date;
  status: TrackingStatus;
  statusDescription: string;
  location?: Location;
  courierEventCode?: string;
  courierEventDescription?: string;
}

export interface RecipientInfo {
  name?: string;
  signature?: string; // Base64 encoded
  deliveryNotes?: string;
}

export interface ProofOfDelivery {
  signatureImage?: string;
  deliveryPhotoUrl?: string;
  recipientName?: string;
  deliveryNotes?: string;
  timestamp: Date;
  location?: Location;
}

export interface TrackingInfo {
  trackingId?: string;
  trackingNumber: string;
  courier: string;
  orderId?: string;
  
  // Status
  status: TrackingStatus;
  statusDescription?: string;
  
  // Location
  currentLocation?: Location;
  originLocation?: Location;
  destinationLocation?: Location;
  
  // Delivery
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  deliveryWindowStart?: Date;
  deliveryWindowEnd?: Date;
  
  // Events
  events: TrackingEvent[];
  
  // Recipient
  recipient?: RecipientInfo;
  
  // Proof
  proofOfDelivery?: ProofOfDelivery;
  
  // Metadata
  lastUpdated: Date;
  rawData?: any;
}

export interface TrackingAdapter {
  name: string;
  
  // Core methods
  track(trackingNumber: string): Promise<TrackingInfo>;
  validateTrackingNumber(trackingNumber: string): boolean;
  
  // Optional methods
  getProofOfDelivery?(trackingNumber: string): Promise<ProofOfDelivery | null>;
  subscribeToUpdates?(trackingNumber: string, webhookUrl: string): Promise<boolean>;
}

export interface CourierAPIConfig {
  courierName: string;
  apiKey?: string;
  apiSecret?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl: string;
  apiVersion?: string;
  rateLimitPerMinute: number;
}
