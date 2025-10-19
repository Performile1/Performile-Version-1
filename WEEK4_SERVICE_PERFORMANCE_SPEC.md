# 🎯 WEEK 4: SERVICE-LEVEL PERFORMANCE & PARCEL POINT MAPPING

**Created:** October 19, 2025  
**Status:** Planning Phase  
**Priority:** HIGH  
**Estimated Time:** 5-7 days

---

## 📋 EXECUTIVE SUMMARY

Enhance the platform with **service-level performance tracking** (Home Delivery, Parcel Shop, Parcel Locker) and **parcel point mapping** system with postal code-based coverage visualization.

### **Key Features:**
1. Service-level TrustScore & ratings per courier
2. Interactive map of parcel shops & lockers
3. Home delivery coverage by postal code
4. Courier API integration for service point locations
5. RFQ (Request for Quotation) system for merchants

---

## 🔍 EXISTING INFRASTRUCTURE ANALYSIS

### **✅ Already Implemented:**

#### **1. Service Types Table** (servicetypes)
```sql
- service_type_id UUID
- service_code VARCHAR(50) -- 'home_delivery', 'parcel_shop', 'parcel_locker'
- service_name VARCHAR(100)
- description TEXT
- is_active BOOLEAN
```
**Status:** ✅ Table exists with 3 default service types

#### **2. Order Service Type Tracking** (orderservicetype)
```sql
- order_service_id UUID
- order_id UUID
- service_type_id UUID
- pickup_location_name VARCHAR(200)
- pickup_location_address TEXT
- pickup_location_code VARCHAR(50)
- locker_code VARCHAR(50)
```
**Status:** ✅ Table exists, tracks service type per order

#### **3. TrustScore System** (trustscore_functions.sql)
```sql
- calculate_trust_score(courier_id) function
- CourierTrustScores table with:
  - trust_score NUMERIC
  - average_rating NUMERIC
  - completion_rate NUMERIC
  - on_time_rate NUMERIC
  - customer_satisfaction_score NUMERIC
```
**Status:** ✅ Comprehensive TrustScore calculation exists

#### **4. Reviews System** (reviews table)
```sql
- review_id UUID
- courier_id UUID
- rating INTEGER (1-5)
- package_condition_rating INTEGER
- communication_rating INTEGER
- delivery_speed_rating INTEGER
```
**Status:** ✅ Multi-dimensional rating system exists

#### **5. Market Share Analytics** (marketsharesnapshots)
```sql
- service_type_id UUID (filter by service)
- country, postal_code, city
- checkout_share, order_share, delivery_share
```
**Status:** ✅ Service-level market share tracking exists

---

## 🚀 WHAT'S MISSING (TO BE BUILT)

### **Phase 1: Service-Level Performance Tracking**

#### **1.1 Service Performance Table** ⭐ NEW
```sql
CREATE TABLE service_performance (
  performance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(user_id),
  service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id),
  
  -- Geographic scope
  country VARCHAR(2),
  postal_code VARCHAR(20),
  city VARCHAR(100),
  
  -- Performance metrics
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  
  -- Ratings
  total_reviews INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2),
  package_condition_avg NUMERIC(3,2),
  communication_avg NUMERIC(3,2),
  delivery_speed_avg NUMERIC(3,2),
  
  -- Service-specific metrics
  trust_score NUMERIC(5,2),
  completion_rate NUMERIC(5,2),
  on_time_rate NUMERIC(5,2),
  avg_delivery_time_hours NUMERIC(10,2),
  
  -- Timestamps
  last_calculated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_courier_service_location 
    UNIQUE (courier_id, service_type_id, country, postal_code)
);

CREATE INDEX idx_sp_courier ON service_performance(courier_id);
CREATE INDEX idx_sp_service ON service_performance(service_type_id);
CREATE INDEX idx_sp_country ON service_performance(country);
CREATE INDEX idx_sp_postal ON service_performance(postal_code);
CREATE INDEX idx_sp_trust_score ON service_performance(trust_score DESC);
```

#### **1.2 Service Performance Calculation Function** ⭐ NEW
```sql
CREATE OR REPLACE FUNCTION calculate_service_performance(
  p_courier_id UUID,
  p_service_type_id UUID,
  p_country VARCHAR DEFAULT NULL,
  p_postal_code VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  courier_id UUID,
  service_type_id UUID,
  total_orders INTEGER,
  trust_score NUMERIC,
  average_rating NUMERIC,
  on_time_rate NUMERIC,
  ...
) AS $$
BEGIN
  -- Calculate performance metrics filtered by service type
  -- Join orders with orderservicetype
  -- Aggregate reviews by service type
  -- Calculate trust score per service
END;
$$ LANGUAGE plpgsql;
```

---

### **Phase 2: Parcel Point Mapping System**

#### **2.1 Parcel Points Table** ⭐ NEW
```sql
CREATE TABLE parcel_points (
  point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(user_id),
  service_type_id UUID NOT NULL REFERENCES servicetypes(service_type_id),
  
  -- Location details
  point_name VARCHAR(200) NOT NULL,
  point_code VARCHAR(100) UNIQUE, -- Courier's internal code
  address TEXT NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(2) NOT NULL,
  
  -- Coordinates
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  
  -- Point details
  opening_hours JSONB, -- {monday: "08:00-20:00", ...}
  facilities JSONB, -- ["parking", "wheelchair_access", "24/7"]
  capacity INTEGER, -- For lockers
  available_lockers INTEGER, -- For lockers
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- API sync
  external_id VARCHAR(100), -- ID from courier API
  last_synced_at TIMESTAMP,
  sync_source VARCHAR(50), -- 'dhl_api', 'postnord_api', 'manual'
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pp_courier ON parcel_points(courier_id);
CREATE INDEX idx_pp_service ON parcel_points(service_type_id);
CREATE INDEX idx_pp_postal ON parcel_points(postal_code);
CREATE INDEX idx_pp_country ON parcel_points(country);
CREATE INDEX idx_pp_location ON parcel_points USING GIST (
  ll_to_earth(latitude, longitude)
); -- For proximity searches
CREATE INDEX idx_pp_active ON parcel_points(is_active) WHERE is_active = true;
```

#### **2.2 Home Delivery Coverage Table** ⭐ NEW
```sql
CREATE TABLE delivery_coverage (
  coverage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Geographic area
  country VARCHAR(2) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  city VARCHAR(100),
  
  -- Coverage details
  is_covered BOOLEAN DEFAULT true,
  service_types TEXT[], -- ['home_delivery', 'parcel_shop']
  delivery_days INTEGER, -- Estimated delivery time
  
  -- Restrictions
  max_weight_kg NUMERIC(10,2),
  max_dimensions_cm VARCHAR(50), -- "120x80x80"
  restrictions JSONB, -- {"no_hazmat": true, "signature_required": false}
  
  -- Pricing (optional)
  base_price NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- API sync
  external_id VARCHAR(100),
  last_synced_at TIMESTAMP,
  sync_source VARCHAR(50),
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_courier_coverage 
    UNIQUE (courier_id, country, postal_code)
);

CREATE INDEX idx_dc_courier ON delivery_coverage(courier_id);
CREATE INDEX idx_dc_postal ON delivery_coverage(postal_code);
CREATE INDEX idx_dc_country ON delivery_coverage(country);
CREATE INDEX idx_dc_covered ON delivery_coverage(is_covered) WHERE is_covered = true;
```

---

### **Phase 3: Courier API Integration**

#### **3.1 DHL Service Point Locator API**
```typescript
// api/courier-apis/dhl-service-points.ts
interface DHLServicePointRequest {
  countryCode: string;
  postalCode: string;
  city?: string;
  radius?: number; // meters
  limit?: number;
}

interface DHLServicePoint {
  id: string;
  name: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  geoLocation: {
    latitude: number;
    longitude: number;
  };
  openingHours: Array<{
    dayOfWeek: string;
    opens: string;
    closes: string;
  }>;
  serviceTypes: string[]; // ['PARCEL_SHOP', 'PACKSTATION']
}

async function getDHLServicePoints(
  params: DHLServicePointRequest
): Promise<DHLServicePoint[]> {
  // Call DHL API
  // Transform to our parcel_points format
  // Store in database
}
```

#### **3.2 PostNord Service Point API**
```typescript
// api/courier-apis/postnord-service-points.ts
interface PostNordServicePointRequest {
  countryCode: string;
  postalCode: string;
  numberOfServicePoints?: number;
  srId?: string; // Coordinate system
}

async function getPostNordServicePoints(
  params: PostNordServicePointRequest
): Promise<ServicePoint[]> {
  // Call PostNord API
  // Map to parcel_points
}
```

#### **3.3 Bring Pickup Points API**
```typescript
// api/courier-apis/bring-pickup-points.ts
async function getBringPickupPoints(
  country: string,
  postalCode: string
): Promise<ServicePoint[]> {
  // Call Bring API
  // Map to parcel_points
}
```

#### **3.4 Generic Service Point Sync**
```typescript
// api/services/ServicePointSyncService.ts
class ServicePointSyncService {
  async syncAllCouriers(): Promise<void> {
    // Sync DHL
    // Sync PostNord
    // Sync Bring
    // Sync FedEx
    // Sync UPS
  }
  
  async syncCourier(courierId: UUID, courierName: string): Promise<void> {
    // Get coverage areas from delivery_coverage
    // For each postal code, fetch service points
    // Upsert to parcel_points table
  }
  
  async syncPostalCode(
    courierId: UUID,
    country: string,
    postalCode: string
  ): Promise<void> {
    // Fetch service points for specific postal code
    // Update parcel_points
  }
}
```

---

### **Phase 4: Frontend UI Components**

#### **4.1 Service Performance Dashboard**
```typescript
// apps/web/src/pages/couriers/ServicePerformance.tsx
interface ServicePerformanceProps {
  courierId: UUID;
}

export function ServicePerformanceDashboard({ courierId }: ServicePerformanceProps) {
  // Display 3 tabs: Home Delivery, Parcel Shop, Parcel Locker
  // Each tab shows:
  // - TrustScore for that service
  // - Average rating
  // - Performance metrics
  // - Recent reviews filtered by service type
  // - Geographic breakdown (by postal code/city)
  
  return (
    <Box>
      <Tabs>
        <Tab label="Home Delivery" />
        <Tab label="Parcel Shop" />
        <Tab label="Parcel Locker" />
      </Tabs>
      
      <ServiceMetricsCard serviceType="home_delivery" />
      <RatingBreakdown serviceType="home_delivery" />
      <GeographicPerformance serviceType="home_delivery" />
    </Box>
  );
}
```

#### **4.2 Interactive Parcel Point Map**
```typescript
// apps/web/src/pages/admin/ParcelPointMap.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

export function ParcelPointMap() {
  const [filters, setFilters] = useState({
    courier: null,
    serviceType: null,
    postalCode: '',
    country: 'SE',
  });
  
  const { data: parcelPoints } = useQuery({
    queryKey: ['parcel-points', filters],
    queryFn: () => apiClient.get('/api/parcel-points', { params: filters }),
  });
  
  return (
    <Box>
      <FilterPanel filters={filters} onChange={setFilters} />
      
      <MapContainer center={[59.3293, 18.0686]} zoom={10}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {parcelPoints?.map((point) => (
          <Marker 
            key={point.point_id} 
            position={[point.latitude, point.longitude]}
          >
            <Popup>
              <ParcelPointCard point={point} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <ParcelPointList points={parcelPoints} />
    </Box>
  );
}
```

#### **4.3 Coverage Map (Home Delivery)**
```typescript
// apps/web/src/pages/admin/CoverageMap.tsx
export function CoverageMap() {
  // Heatmap showing delivery coverage by postal code
  // Color-coded by:
  // - Number of couriers covering the area
  // - Average delivery time
  // - Average TrustScore
  
  return (
    <Box>
      <CoverageFilters />
      <HeatMapLayer data={coverageData} />
      <CoverageLegend />
      <PostalCodeSearch />
    </Box>
  );
}
```

#### **4.4 RFQ (Request for Quotation) System**
```typescript
// apps/web/src/pages/merchant/RequestQuote.tsx
export function RequestQuote() {
  const [rfqData, setRfqData] = useState({
    serviceType: 'home_delivery',
    fromPostalCode: '',
    toPostalCode: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
  });
  
  const { data: quotes } = useQuery({
    queryKey: ['rfq', rfqData],
    queryFn: () => apiClient.post('/api/rfq/calculate', rfqData),
    enabled: rfqData.fromPostalCode && rfqData.toPostalCode,
  });
  
  return (
    <Box>
      <RFQForm data={rfqData} onChange={setRfqData} />
      <QuoteResults quotes={quotes} />
      <CourierComparison quotes={quotes} />
    </Box>
  );
}
```

---

## 📊 DATABASE SCHEMA SUMMARY

### **New Tables (3):**
1. `service_performance` - Service-level metrics per courier
2. `parcel_points` - Physical locations (shops/lockers)
3. `delivery_coverage` - Postal code coverage data

### **Existing Tables (Used):**
1. `servicetypes` - Service type definitions ✅
2. `orderservicetype` - Order-service mapping ✅
3. `reviews` - Customer ratings ✅
4. `orders` - Order data ✅
5. `couriertrustscore` - Overall TrustScore ✅

---

## 🔌 API ENDPOINTS

### **Service Performance APIs:**
```
GET  /api/service-performance/:courierId
GET  /api/service-performance/:courierId/:serviceTypeId
POST /api/service-performance/calculate
GET  /api/service-performance/compare
```

### **Parcel Point APIs:**
```
GET  /api/parcel-points
GET  /api/parcel-points/search
GET  /api/parcel-points/nearby
POST /api/parcel-points/sync
GET  /api/parcel-points/:pointId
```

### **Coverage APIs:**
```
GET  /api/coverage/postal-code/:postalCode
GET  /api/coverage/courier/:courierId
POST /api/coverage/sync
GET  /api/coverage/map-data
```

### **RFQ APIs:**
```
POST /api/rfq/calculate
POST /api/rfq/submit
GET  /api/rfq/:rfqId
GET  /api/rfq/merchant/:merchantId
```

---

## 🎯 COURIER API INTEGRATIONS

### **Priority 1: DHL**
- **API:** DHL Service Point Locator
- **Endpoint:** `https://api.dhl.com/location-finder/v1/find-by-address`
- **Auth:** API Key
- **Services:** Parcel Shops, Packstations (lockers)
- **Coverage:** Global

### **Priority 2: PostNord**
- **API:** PostNord Service Point API
- **Endpoint:** `https://api2.postnord.com/rest/businesslocation/v1/servicepoints`
- **Auth:** API Key
- **Services:** Parcel Shops, Parcel Lockers
- **Coverage:** Nordic countries

### **Priority 3: Bring**
- **API:** Bring Pickup Point API
- **Endpoint:** `https://api.bring.com/pickuppoint/api/pickuppoint`
- **Auth:** API Key
- **Services:** Pickup Points
- **Coverage:** Norway, Sweden, Denmark, Finland

### **Priority 4: FedEx**
- **API:** FedEx Location Service
- **Services:** FedEx Locations
- **Coverage:** Global

### **Priority 5: UPS**
- **API:** UPS Locator API
- **Services:** UPS Access Points
- **Coverage:** Global

---

## 📋 IMPLEMENTATION PHASES

### **Week 4 Phase 1: Database & Backend (2-3 days)**
1. Create 3 new tables
2. Create service performance calculation function
3. Build API endpoints for service performance
4. Build API endpoints for parcel points
5. Build API endpoints for coverage

### **Week 4 Phase 2: Courier API Integration (2-3 days)**
1. DHL Service Point Locator integration
2. PostNord Service Point integration
3. Bring Pickup Point integration
4. Generic sync service
5. Scheduled sync jobs

### **Week 4 Phase 3: Frontend UI (2-3 days)**
1. Service Performance Dashboard
2. Interactive Parcel Point Map
3. Coverage Map with heatmap
4. RFQ system UI
5. Admin tools for managing points

### **Week 4 Phase 4: Testing & Documentation (1 day)**
1. API testing
2. UI testing
3. Integration testing
4. Documentation
5. User guides

---

## 🎨 UI/UX MOCKUPS

### **Service Performance View:**
```
┌─────────────────────────────────────────────────────────┐
│ DHL Express - Service Performance                      │
├─────────────────────────────────────────────────────────┤
│ [Home Delivery] [Parcel Shop] [Parcel Locker]         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📦 Home Delivery Performance                          │
│  ┌──────────┬──────────┬──────────┬──────────┐        │
│  │ Trust    │ Rating   │ On-Time  │ Avg Time │        │
│  │ Score    │          │ Rate     │          │        │
│  ├──────────┼──────────┼──────────┼──────────┤        │
│  │   92.5   │  4.6/5   │  94.2%   │ 1.2 days │        │
│  └──────────┴──────────┴──────────┴──────────┘        │
│                                                         │
│  📊 Performance by Region                              │
│  ┌─────────────────────────────────────────┐          │
│  │ Stockholm (111-119): ⭐⭐⭐⭐⭐ 95.2      │          │
│  │ Gothenburg (400-419): ⭐⭐⭐⭐ 89.1       │          │
│  │ Malmö (200-219): ⭐⭐⭐⭐ 87.5            │          │
│  └─────────────────────────────────────────┘          │
│                                                         │
│  💬 Recent Reviews (Home Delivery)                     │
│  [Review cards filtered by service type]               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Parcel Point Map:**
```
┌─────────────────────────────────────────────────────────┐
│ Parcel Points Map                                       │
├─────────────────────────────────────────────────────────┤
│ Filters: [DHL ▼] [Parcel Shop ▼] [Stockholm ▼]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                   🗺️ MAP                        │  │
│  │                                                  │  │
│  │    📍 Parcel Shop (15 locations)                │  │
│  │    🔒 Parcel Locker (8 locations)               │  │
│  │                                                  │  │
│  │    [Interactive map with markers]               │  │
│  │                                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  📍 Nearby Locations (within 2km)                      │
│  ┌─────────────────────────────────────────┐          │
│  │ 🏪 7-Eleven Vasagatan                   │          │
│  │    Vasagatan 12, 111 20 Stockholm       │          │
│  │    Open: Mon-Sun 07:00-23:00            │          │
│  │    Distance: 0.3 km                     │          │
│  ├─────────────────────────────────────────┤          │
│  │ 🔒 DHL Packstation #4521                │          │
│  │    Kungsgatan 45, 111 56 Stockholm      │          │
│  │    Open: 24/7                           │          │
│  │    Available lockers: 12/48             │          │
│  │    Distance: 0.5 km                     │          │
│  └─────────────────────────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 SECURITY & PERMISSIONS

### **Admin Access:**
- Full access to all maps and data
- Can sync courier APIs
- Can manage parcel points
- Can view all RFQs

### **Merchant Access:**
- View parcel points in their coverage area
- Request quotes (RFQ)
- View service performance for available couriers
- Cannot sync APIs

### **Customer Access:**
- View nearby parcel points
- View service ratings
- No RFQ access

---

## 📈 SUCCESS METRICS

### **Performance:**
- Service-level TrustScore calculated for all couriers
- 90%+ of parcel points mapped
- <2s API response time for map data
- Real-time sync with courier APIs

### **Business:**
- Merchants can compare services accurately
- RFQ system generates leads
- Coverage gaps identified
- Data-driven courier selection

---

## 🚀 NEXT STEPS

1. ✅ Review this specification
2. ⏳ Approve database schema
3. ⏳ Set up courier API credentials
4. ⏳ Begin Phase 1 implementation
5. ⏳ Create UI mockups

---

**Created By:** Cascade AI  
**Date:** October 19, 2025  
**Status:** Ready for Review  
**Estimated Completion:** Week 4 (5-7 days)

---

*"The best way to predict the future is to create it."* - Peter Drucker

**Let's build the future of logistics performance! 🚀**
