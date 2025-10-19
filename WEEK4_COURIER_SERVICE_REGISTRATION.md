# 🚚 COURIER SERVICE REGISTRATION & INTEGRATION ENHANCEMENT

**Created:** October 19, 2025  
**Priority:** HIGH  
**Status:** Planning  

---

## 🎯 OBJECTIVE

Enhance courier registration and integration to properly track which services each courier provides, with detailed capabilities, pricing, and geographic coverage per service type.

---

## 🔍 CURRENT STATE ANALYSIS

### **Existing Structure:**

**Couriers Table:**
```sql
CREATE TABLE couriers (
  courier_id UUID PRIMARY KEY,
  courier_name VARCHAR(200),
  service_types TEXT[],  -- ⚠️ Simple array, not structured
  coverage_countries TEXT[],  -- ⚠️ No per-service breakdown
  ...
);
```

**Problems:**
- ❌ `service_types` is just a text array (no details)
- ❌ No pricing per service
- ❌ No capabilities per service
- ❌ No geographic coverage per service
- ❌ No SLA (Service Level Agreement) data
- ❌ No restrictions per service

---

## 🚀 ENHANCED SOLUTION

### **1. Courier Service Offerings Table** ⭐ NEW

```sql
CREATE TABLE courier_service_offerings (
  offering_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id),
  
  -- Service availability
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Geographic coverage
  countries TEXT[], -- ['SE', 'NO', 'DK', 'FI']
  regions TEXT[], -- ['Stockholm', 'Gothenburg', 'Malmö']
  postal_codes TEXT[], -- ['111', '112', '113'] or ['111-119']
  coverage_type VARCHAR(50), -- 'nationwide', 'regional', 'postal_codes'
  
  -- Service capabilities
  capabilities JSONB, -- See detailed structure below
  
  -- Pricing (optional - can be in separate table)
  base_price NUMERIC(10,2),
  price_per_kg NUMERIC(10,2),
  price_per_km NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'SEK',
  pricing_model VARCHAR(50), -- 'flat', 'weight_based', 'distance_based', 'zone_based'
  
  -- Service Level Agreement (SLA)
  sla_delivery_time_hours INTEGER, -- Expected delivery time
  sla_on_time_guarantee NUMERIC(5,2), -- 95.0 = 95% on-time guarantee
  sla_compensation_policy TEXT,
  
  -- Restrictions
  max_weight_kg NUMERIC(10,2),
  max_length_cm NUMERIC(10,2),
  max_width_cm NUMERIC(10,2),
  max_height_cm NUMERIC(10,2),
  max_value_amount NUMERIC(10,2),
  restrictions JSONB, -- Detailed restrictions
  
  -- Integration details
  api_endpoint TEXT,
  requires_api_key BOOLEAN DEFAULT false,
  supports_tracking BOOLEAN DEFAULT true,
  supports_label_generation BOOLEAN DEFAULT false,
  supports_pickup_scheduling BOOLEAN DEFAULT false,
  
  -- Metadata
  display_name VARCHAR(200), -- "DHL Express Same Day"
  description TEXT,
  icon_url TEXT,
  terms_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_courier_service UNIQUE (courier_id, service_type_id)
);

CREATE INDEX idx_cso_courier ON courier_service_offerings(courier_id);
CREATE INDEX idx_cso_service ON courier_service_offerings(service_type_id);
CREATE INDEX idx_cso_active ON courier_service_offerings(is_active) WHERE is_active = true;
CREATE INDEX idx_cso_countries ON courier_service_offerings USING GIN(countries);
CREATE INDEX idx_cso_postal_codes ON courier_service_offerings USING GIN(postal_codes);
```

---

### **2. Capabilities JSONB Structure**

```json
{
  "delivery_options": {
    "same_day": true,
    "next_day": true,
    "standard": true,
    "economy": false,
    "scheduled": true,
    "time_slot": ["morning", "afternoon", "evening"]
  },
  "pickup_options": {
    "home_pickup": true,
    "drop_off": true,
    "scheduled_pickup": true,
    "pickup_time_slots": ["08:00-12:00", "12:00-18:00"]
  },
  "special_services": {
    "signature_required": true,
    "age_verification": true,
    "insurance": true,
    "cash_on_delivery": false,
    "return_service": true,
    "fragile_handling": true,
    "temperature_controlled": false
  },
  "tracking": {
    "real_time": true,
    "sms_notifications": true,
    "email_notifications": true,
    "push_notifications": false,
    "delivery_photo": true,
    "signature_capture": true
  },
  "packaging": {
    "accepts_own_packaging": true,
    "provides_packaging": false,
    "envelope": true,
    "small_box": true,
    "medium_box": true,
    "large_box": true,
    "pallet": false
  },
  "parcel_shop_features": {
    "24_7_access": false,
    "weekend_pickup": true,
    "extended_storage": 7,
    "storage_unit": "days"
  },
  "parcel_locker_features": {
    "24_7_access": true,
    "size_options": ["S", "M", "L", "XL"],
    "refrigerated": false,
    "storage_duration": 72,
    "storage_unit": "hours"
  }
}
```

---

### **3. Restrictions JSONB Structure**

```json
{
  "prohibited_items": [
    "hazardous_materials",
    "flammable_liquids",
    "explosives",
    "live_animals",
    "perishables"
  ],
  "restricted_items": [
    {
      "item": "alcohol",
      "conditions": "Age verification required, max 5L"
    },
    {
      "item": "batteries",
      "conditions": "Lithium batteries must be declared"
    }
  ],
  "geographic_restrictions": {
    "excluded_postal_codes": ["981", "982"],
    "excluded_regions": ["Gotland"],
    "international_restrictions": {
      "customs_required": true,
      "max_value_eur": 1000
    }
  },
  "time_restrictions": {
    "no_weekend_delivery": false,
    "no_holiday_delivery": true,
    "blackout_dates": ["2025-12-24", "2025-12-25"]
  },
  "volume_restrictions": {
    "max_parcels_per_shipment": 10,
    "max_weight_per_shipment_kg": 100
  }
}
```

---

### **4. Service Pricing Table** ⭐ NEW (Optional - for complex pricing)

```sql
CREATE TABLE courier_service_pricing (
  pricing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES courier_service_offerings(offering_id) ON DELETE CASCADE,
  
  -- Pricing structure
  pricing_type VARCHAR(50) NOT NULL, -- 'base', 'weight_tier', 'distance_zone', 'volume_tier'
  
  -- Weight-based pricing
  weight_from_kg NUMERIC(10,2),
  weight_to_kg NUMERIC(10,2),
  
  -- Distance-based pricing
  distance_from_km NUMERIC(10,2),
  distance_to_km NUMERIC(10,2),
  
  -- Zone-based pricing
  zone_code VARCHAR(50), -- 'zone_1', 'zone_2', etc.
  zone_name VARCHAR(100),
  
  -- Price
  price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Additional fees
  fuel_surcharge_percent NUMERIC(5,2),
  handling_fee NUMERIC(10,2),
  insurance_fee_percent NUMERIC(5,2),
  
  -- Validity
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_csp_offering ON courier_service_pricing(offering_id);
CREATE INDEX idx_csp_weight ON courier_service_pricing(weight_from_kg, weight_to_kg);
CREATE INDEX idx_csp_distance ON courier_service_pricing(distance_from_km, distance_to_km);
CREATE INDEX idx_csp_zone ON courier_service_pricing(zone_code);
CREATE INDEX idx_csp_active ON courier_service_pricing(is_active) WHERE is_active = true;
```

---

### **5. Service Coverage Zones Table** ⭐ NEW

```sql
CREATE TABLE courier_service_zones (
  zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id UUID NOT NULL REFERENCES courier_service_offerings(offering_id) ON DELETE CASCADE,
  
  -- Zone details
  zone_code VARCHAR(50) NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  zone_type VARCHAR(50), -- 'urban', 'suburban', 'rural', 'remote'
  
  -- Geographic definition
  country VARCHAR(2) NOT NULL,
  regions TEXT[],
  postal_codes TEXT[],
  cities TEXT[],
  
  -- Geometry (optional - for map visualization)
  boundary_geojson JSONB, -- GeoJSON polygon
  center_latitude NUMERIC(10,7),
  center_longitude NUMERIC(10,7),
  
  -- Service parameters for this zone
  delivery_time_hours INTEGER,
  delivery_days INTEGER,
  cutoff_time TIME, -- Orders before this time ship same day
  
  -- Pricing reference
  pricing_zone VARCHAR(50), -- Links to courier_service_pricing.zone_code
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_offering_zone UNIQUE (offering_id, zone_code)
);

CREATE INDEX idx_csz_offering ON courier_service_zones(offering_id);
CREATE INDEX idx_csz_country ON courier_service_zones(country);
CREATE INDEX idx_csz_postal_codes ON courier_service_zones USING GIN(postal_codes);
CREATE INDEX idx_csz_active ON courier_service_zones(is_active) WHERE is_active = true;
```

---

## 📋 COURIER REGISTRATION FLOW

### **Step 1: Basic Information**
```typescript
interface CourierRegistration {
  // Company details
  companyName: string;
  businessRegistrationNumber: string;
  vatNumber?: string;
  
  // Contact
  email: string;
  phone: string;
  website?: string;
  
  // Address
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  
  // Business info
  description: string;
  logo?: File;
  yearEstablished?: number;
  numberOfEmployees?: string; // '1-10', '11-50', etc.
}
```

### **Step 2: Service Selection**
```typescript
interface ServiceSelection {
  services: Array<{
    serviceTypeId: UUID; // home_delivery, parcel_shop, parcel_locker
    displayName: string; // "DHL Express Same Day"
    description: string;
    isActive: boolean;
  }>;
}
```

### **Step 3: Coverage Configuration (Per Service)**
```typescript
interface CoverageConfiguration {
  serviceTypeId: UUID;
  
  coverageType: 'nationwide' | 'regional' | 'postal_codes' | 'zones';
  
  // For nationwide
  countries?: string[]; // ['SE', 'NO', 'DK']
  
  // For regional
  regions?: string[]; // ['Stockholm', 'Gothenburg']
  
  // For postal codes
  postalCodes?: string[]; // ['111', '112', '113-119']
  
  // For zones
  zones?: Array<{
    zoneName: string;
    postalCodes: string[];
    deliveryDays: number;
  }>;
}
```

### **Step 4: Service Capabilities (Per Service)**
```typescript
interface ServiceCapabilities {
  serviceTypeId: UUID;
  
  // Delivery options
  deliveryOptions: {
    sameDay: boolean;
    nextDay: boolean;
    standard: boolean;
    scheduled: boolean;
    timeSlots?: string[]; // ['morning', 'afternoon', 'evening']
  };
  
  // Special services
  specialServices: {
    signatureRequired: boolean;
    ageVerification: boolean;
    insurance: boolean;
    cashOnDelivery: boolean;
    returnService: boolean;
    fragileHandling: boolean;
  };
  
  // Tracking
  tracking: {
    realTime: boolean;
    smsNotifications: boolean;
    emailNotifications: boolean;
    deliveryPhoto: boolean;
  };
  
  // Parcel shop specific (if applicable)
  parcelShopFeatures?: {
    weekendPickup: boolean;
    extendedStorageDays: number;
  };
  
  // Parcel locker specific (if applicable)
  parcelLockerFeatures?: {
    access24_7: boolean;
    sizeOptions: string[]; // ['S', 'M', 'L', 'XL']
    storageDurationHours: number;
  };
}
```

### **Step 5: Pricing Configuration (Per Service)**
```typescript
interface PricingConfiguration {
  serviceTypeId: UUID;
  
  pricingModel: 'flat' | 'weight_based' | 'distance_based' | 'zone_based';
  
  // Flat rate
  flatRate?: {
    price: number;
    currency: string;
  };
  
  // Weight-based
  weightTiers?: Array<{
    fromKg: number;
    toKg: number;
    price: number;
  }>;
  
  // Distance-based
  distanceTiers?: Array<{
    fromKm: number;
    toKm: number;
    pricePerKm: number;
  }>;
  
  // Zone-based
  zonePricing?: Array<{
    zoneCode: string;
    zoneName: string;
    price: number;
  }>;
  
  // Additional fees
  additionalFees?: {
    fuelSurchargePercent?: number;
    handlingFee?: number;
    insuranceFeePercent?: number;
  };
}
```

### **Step 6: Restrictions & SLA (Per Service)**
```typescript
interface RestrictionsAndSLA {
  serviceTypeId: UUID;
  
  // Physical restrictions
  maxWeightKg: number;
  maxDimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };
  maxValueAmount?: number;
  
  // Item restrictions
  prohibitedItems: string[];
  restrictedItems?: Array<{
    item: string;
    conditions: string;
  }>;
  
  // SLA
  sla: {
    deliveryTimeHours: number;
    onTimeGuaranteePercent: number;
    compensationPolicy?: string;
  };
  
  // Integration
  integration: {
    apiEndpoint?: string;
    supportsTracking: boolean;
    supportsLabelGeneration: boolean;
    supportsPickupScheduling: boolean;
  };
}
```

---

## 🎨 REGISTRATION UI MOCKUP

```
┌─────────────────────────────────────────────────────────┐
│ Courier Registration - Step 2: Services                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Select Services You Provide:                          │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ ☑ Home Delivery                               │    │
│  │   Direct delivery to customer's address       │    │
│  │   [Configure →]                               │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ ☑ Parcel Shop                                 │    │
│  │   Pickup from retail partner locations        │    │
│  │   [Configure →]                               │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │ ☐ Parcel Locker                               │    │
│  │   Pickup from automated locker systems        │    │
│  │   [Configure]                                 │    │
│  └───────────────────────────────────────────────┘    │
│                                                         │
│  [← Back]                          [Next: Coverage →]  │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Configure: Home Delivery                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Service Name: [DHL Express Home Delivery______]       │
│  Description:  [Fast and reliable home delivery]       │
│                                                         │
│  📦 Delivery Options                                   │
│  ☑ Same Day    ☑ Next Day    ☑ Standard               │
│  ☐ Economy     ☑ Scheduled Delivery                    │
│                                                         │
│  Time Slots:                                           │
│  ☑ Morning (08:00-12:00)                               │
│  ☑ Afternoon (12:00-18:00)                             │
│  ☑ Evening (18:00-21:00)                               │
│                                                         │
│  🎯 Special Services                                   │
│  ☑ Signature Required    ☑ Age Verification            │
│  ☑ Insurance Available   ☐ Cash on Delivery            │
│  ☑ Return Service        ☑ Fragile Handling            │
│                                                         │
│  📍 Coverage                                           │
│  Coverage Type: [Nationwide ▼]                         │
│  Countries: [Sweden ▼] [+ Add Country]                │
│                                                         │
│  💰 Pricing                                            │
│  Model: [Weight-based ▼]                               │
│  0-5 kg:    [89 SEK]                                   │
│  5-10 kg:   [129 SEK]                                  │
│  10-20 kg:  [189 SEK]                                  │
│  [+ Add Tier]                                          │
│                                                         │
│  📏 Restrictions                                       │
│  Max Weight:  [30_] kg                                 │
│  Max Length:  [120_] cm                                │
│  Max Width:   [80_] cm                                 │
│  Max Height:  [80_] cm                                 │
│                                                         │
│  ⏱️ Service Level Agreement                            │
│  Delivery Time: [24_] hours                            │
│  On-Time Rate:  [95_] %                                │
│                                                         │
│  [Cancel]                              [Save Service]  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS

### **Courier Registration:**
```
POST /api/courier/register
POST /api/courier/services/add
PUT  /api/courier/services/:offeringId
DELETE /api/courier/services/:offeringId
GET  /api/courier/services
```

### **Service Configuration:**
```
POST /api/courier/services/:offeringId/coverage
POST /api/courier/services/:offeringId/pricing
POST /api/courier/services/:offeringId/capabilities
GET  /api/courier/services/:offeringId/details
```

### **Public Service Discovery:**
```
GET  /api/services/search
POST /api/services/calculate-quote
GET  /api/services/available
GET  /api/services/courier/:courierId
```

---

## 💡 ADDITIONAL FEATURES TO CONSIDER

### **1. Service Comparison Matrix** ⭐
```typescript
// Allow merchants to compare services side-by-side
interface ServiceComparison {
  services: Array<{
    courierId: UUID;
    courierName: string;
    serviceTypeId: UUID;
    serviceTypeName: string;
    price: number;
    deliveryTime: number;
    trustScore: number;
    capabilities: string[];
    restrictions: string[];
  }>;
}
```

### **2. Service Availability Checker** ⭐
```typescript
// Check if service is available for specific route
interface AvailabilityCheck {
  fromPostalCode: string;
  toPostalCode: string;
  weight: number;
  dimensions: { length: number; width: number; height: number };
  serviceType?: string;
  
  // Returns available services with pricing
  availableServices: Array<{
    courierId: UUID;
    serviceTypeId: UUID;
    price: number;
    estimatedDelivery: Date;
    available: boolean;
    reason?: string; // If not available
  }>;
}
```

### **3. Service Performance Tracking** ⭐
```typescript
// Track performance per service offering
interface ServicePerformanceMetrics {
  offeringId: UUID;
  period: 'day' | 'week' | 'month';
  
  metrics: {
    totalOrders: number;
    completedOrders: number;
    onTimeDeliveries: number;
    averageDeliveryTime: number;
    customerRating: number;
    trustScore: number;
  };
}
```

### **4. Dynamic Pricing** ⭐
```typescript
// Allow couriers to adjust pricing based on demand
interface DynamicPricing {
  offeringId: UUID;
  
  rules: Array<{
    condition: 'peak_hours' | 'high_demand' | 'weather' | 'holiday';
    priceMultiplier: number; // 1.2 = 20% increase
    validFrom: Date;
    validTo: Date;
  }>;
}
```

### **5. Service Bundles** ⭐
```typescript
// Allow couriers to create service packages
interface ServiceBundle {
  bundleId: UUID;
  courierId: UUID;
  bundleName: string;
  
  includedServices: Array<{
    serviceTypeId: UUID;
    quantity: number; // e.g., 100 home deliveries
  }>;
  
  pricing: {
    totalPrice: number;
    discountPercent: number;
    validityDays: number;
  };
}
```

### **6. Service Certifications** ⭐
```typescript
// Track certifications and compliance
interface ServiceCertifications {
  offeringId: UUID;
  
  certifications: Array<{
    name: string; // 'ISO 9001', 'GDPR Compliant', 'Carbon Neutral'
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
  }>;
}
```

### **7. Service SLA Monitoring** ⭐
```typescript
// Monitor SLA compliance
interface SLAMonitoring {
  offeringId: UUID;
  period: 'day' | 'week' | 'month';
  
  slaMetrics: {
    promisedDeliveryTime: number; // hours
    actualAverageTime: number;
    onTimeRate: number; // percentage
    slaViolations: number;
    compensationsPaid: number;
  };
  
  alerts: Array<{
    type: 'sla_breach' | 'approaching_threshold';
    message: string;
    timestamp: Date;
  }>;
}
```

### **8. Service Integration Status** ⭐
```typescript
// Track API integration health
interface IntegrationStatus {
  offeringId: UUID;
  
  apiHealth: {
    isConnected: boolean;
    lastSuccessfulCall: Date;
    lastFailedCall?: Date;
    uptime: number; // percentage
    averageResponseTime: number; // ms
  };
  
  features: {
    tracking: 'active' | 'inactive' | 'error';
    labelGeneration: 'active' | 'inactive' | 'error';
    pickupScheduling: 'active' | 'inactive' | 'error';
  };
}
```

### **9. Service Marketplace** ⭐
```typescript
// Public marketplace for merchants to discover services
interface ServiceMarketplace {
  filters: {
    serviceType?: string;
    country?: string;
    maxPrice?: number;
    minTrustScore?: number;
    capabilities?: string[];
  };
  
  results: Array<{
    courierId: UUID;
    courierName: string;
    offeringId: UUID;
    serviceTypeName: string;
    displayName: string;
    trustScore: number;
    averagePrice: number;
    deliveryTime: string;
    capabilities: string[];
    featured: boolean;
  }>;
}
```

### **10. Service Analytics Dashboard** ⭐
```typescript
// Analytics for courier to optimize services
interface ServiceAnalytics {
  offeringId: UUID;
  
  performance: {
    orderVolume: TimeSeries;
    revenue: TimeSeries;
    averageOrderValue: number;
    customerRetention: number;
  };
  
  geographic: {
    topRegions: Array<{
      region: string;
      orderCount: number;
      revenue: number;
    }>;
    coverageUtilization: number; // % of coverage area used
  };
  
  competitive: {
    marketShare: number;
    pricePosition: 'lowest' | 'average' | 'premium';
    trustScoreRanking: number;
  };
}
```

---

## 📊 DATABASE SUMMARY

### **New Tables (4):**
1. `courier_service_offerings` - Main service configuration
2. `courier_service_pricing` - Detailed pricing tiers
3. `courier_service_zones` - Geographic zones
4. `service_certifications` - Compliance tracking (optional)

### **Enhanced Tables:**
1. `couriers` - Remove simple `service_types` array
2. `servicetypes` - Keep as reference table

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Core Service Registration (HIGH)**
- ✅ courier_service_offerings table
- ✅ Basic registration flow
- ✅ Service selection UI
- ✅ Coverage configuration

### **Phase 2: Pricing & Capabilities (HIGH)**
- ✅ courier_service_pricing table
- ✅ Pricing configuration UI
- ✅ Capabilities configuration
- ✅ Restrictions management

### **Phase 3: Service Discovery (MEDIUM)**
- ✅ Public service search API
- ✅ Availability checker
- ✅ Quote calculator
- ✅ Service comparison

### **Phase 4: Advanced Features (LOW)**
- ⏳ Dynamic pricing
- ⏳ Service bundles
- ⏳ SLA monitoring
- ⏳ Analytics dashboard

---

## ✅ BENEFITS

### **For Couriers:**
- ✅ Detailed service configuration
- ✅ Flexible pricing models
- ✅ Geographic targeting
- ✅ Competitive positioning
- ✅ Performance tracking

### **For Merchants:**
- ✅ Clear service comparison
- ✅ Accurate pricing
- ✅ Service availability checking
- ✅ Informed decision making
- ✅ Better matching

### **For Platform:**
- ✅ Rich service data
- ✅ Better recommendations
- ✅ Market insights
- ✅ Revenue opportunities (featured listings)
- ✅ Quality control

---

**Created By:** Cascade AI  
**Date:** October 19, 2025  
**Status:** Ready for Review  
**Estimated Time:** 3-4 days for Phases 1-2

---

*"The details are not the details. They make the design."* - Charles Eames

**Let's build a comprehensive service registration system! 🚀**
