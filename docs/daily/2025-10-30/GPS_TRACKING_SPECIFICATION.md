# GPS Tracking & Real-Time Delivery Mapping Specification

**Date:** October 30, 2025  
**Version:** 1.0  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.25  
**Status:** 📋 SPECIFICATION PHASE

---

## 🎯 OVERVIEW

### **Real-Time GPS Tracking System**

**Purpose:** Track courier location in real-time, display on map, and manage delivery statuses.

**Key Features:**
- Real-time GPS tracking
- Live delivery map
- Route visualization
- Delivery status management
- Proof of delivery
- Failed delivery handling
- Customer notifications

---

## 📱 GPS TRACKING FEATURES

### **1. Real-Time Location Tracking**

**Courier App:**
- Continuous GPS tracking during delivery
- Location updates every 10-30 seconds
- Background location tracking
- Battery optimization
- Offline location caching

**Permissions Required:**
- Location (Always) - iOS
- ACCESS_FINE_LOCATION - Android
- ACCESS_BACKGROUND_LOCATION - Android

**Technical Implementation:**
```typescript
// React Native Geolocation
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';

// Start tracking
BackgroundGeolocation.ready({
  desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
  distanceFilter: 10, // meters
  stopTimeout: 5, // minutes
  debug: false,
  logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
  stopOnTerminate: false,
  startOnBoot: true,
}).then((state) => {
  BackgroundGeolocation.start();
});

// Location update handler
BackgroundGeolocation.onLocation((location) => {
  console.log('[location] ', location);
  // Send to server
  updateCourierLocation(location);
});
```

---

### **2. Live Delivery Map**

**Map Features:**
- Real-time courier location
- Delivery route visualization
- All stops marked on map
- Completed vs pending stops
- ETA for each stop
- Traffic conditions
- Alternative routes

**Map Providers:**
- **iOS:** Apple Maps (native)
- **Android:** Google Maps
- **Alternative:** Mapbox (cross-platform)

**Map Components:**
- Courier marker (moving)
- Customer markers (stops)
- Route polyline
- Geofence circles
- Traffic overlay

**Technical Implementation:**
```typescript
// React Native Maps
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

<MapView
  style={styles.map}
  initialRegion={{
    latitude: courier.latitude,
    longitude: courier.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
  showsUserLocation={true}
  showsTraffic={true}
  followsUserLocation={true}
>
  {/* Courier current location */}
  <Marker
    coordinate={{
      latitude: courier.latitude,
      longitude: courier.longitude,
    }}
    title="Your Location"
    pinColor="blue"
  />
  
  {/* Delivery stops */}
  {stops.map((stop) => (
    <Marker
      key={stop.stop_id}
      coordinate={{
        latitude: stop.latitude,
        longitude: stop.longitude,
      }}
      title={stop.customer_name}
      description={stop.address}
      pinColor={stop.status === 'completed' ? 'green' : 'red'}
    />
  ))}
  
  {/* Route polyline */}
  <Polyline
    coordinates={routeCoordinates}
    strokeColor="#0000FF"
    strokeWidth={3}
  />
  
  {/* Geofence for arrival detection */}
  <Circle
    center={{
      latitude: nextStop.latitude,
      longitude: nextStop.longitude,
    }}
    radius={50} // 50 meters
    fillColor="rgba(0, 150, 255, 0.2)"
    strokeColor="rgba(0, 150, 255, 0.5)"
  />
</MapView>
```

---

### **3. Delivery Status Management**

**Available Statuses:**
1. **Delivered** ✅
   - Successful delivery
   - Requires: Signature/Photo/PIN
   - Updates: Order status to "delivered"
   - Triggers: Customer notification

2. **Failed Delivery** ❌
   - Delivery attempt failed
   - Requires: Reason selection
   - Options:
     - Customer not home
     - Wrong address
     - Access denied
     - Customer refused
     - Damaged package
     - Other (with notes)
   - Action: Schedule re-delivery

3. **Partial Delivery** ⚠️
   - Some items delivered
   - Requires: Item selection
   - Reason for missing items
   - Photo proof

4. **Return to Sender** 🔄
   - Package returned
   - Requires: Reason
   - Updates: Order status
   - Triggers: Merchant notification

5. **Delivery Attempted** 🔔
   - Left notice
   - Customer not available
   - Scheduled next attempt
   - Left at safe location

6. **Damaged Package** 📦
   - Package damaged in transit
   - Requires: Photo evidence
   - Triggers: Claims process

**Status Update Flow:**
```typescript
interface DeliveryStatus {
  order_id: string;
  courier_id: string;
  status: 'delivered' | 'failed' | 'partial' | 'returned' | 'attempted' | 'damaged';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  proof?: {
    signature_url?: string;
    photo_url?: string;
    recipient_name?: string;
    recipient_relation?: string;
    pin_code?: string;
  };
  failure_reason?: string;
  notes?: string;
}

// Update delivery status
const updateDeliveryStatus = async (status: DeliveryStatus) => {
  try {
    // Validate required fields
    if (status.status === 'delivered' && !status.proof) {
      throw new Error('Proof of delivery required');
    }
    
    if (status.status === 'failed' && !status.failure_reason) {
      throw new Error('Failure reason required');
    }
    
    // Send to API
    const response = await api.post('/api/courier/delivery/status', status);
    
    // Update local state
    updateLocalDelivery(status);
    
    // Send notification
    sendCustomerNotification(status);
    
    return response.data;
  } catch (error) {
    console.error('Failed to update status:', error);
    throw error;
  }
};
```

---

## 🗄️ DATABASE ENHANCEMENTS

### **Enhanced: delivery_scans table**

```sql
-- Add delivery status columns
ALTER TABLE delivery_scans
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(255),
ADD COLUMN IF NOT EXISTS failure_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS recipient_pin_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS left_at_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS next_attempt_date DATE,
ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
ADD COLUMN IF NOT EXISTS customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_feedback TEXT;

-- Add constraint
ALTER TABLE delivery_scans
ADD CONSTRAINT valid_delivery_status CHECK (
  delivery_status IN (
    'pending', 'in_transit', 'arrived', 'delivered', 
    'failed', 'partial', 'returned', 'attempted', 'damaged'
  )
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_delivery_scans_status ON delivery_scans(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_scans_next_attempt ON delivery_scans(next_attempt_date);
```

---

### **New Table: courier_location_history**

```sql
CREATE TABLE IF NOT EXISTS courier_location_history (
  location_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  route_id UUID REFERENCES delivery_routes(route_id) ON DELETE SET NULL,
  
  -- Location Data
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2), -- meters
  altitude DECIMAL(10,2), -- meters
  speed DECIMAL(10,2), -- km/h
  heading DECIMAL(5,2), -- degrees (0-360)
  
  -- Device Info
  device_id UUID REFERENCES mobile_devices(device_id),
  battery_level INTEGER, -- percentage
  is_charging BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_moving BOOLEAN DEFAULT TRUE,
  activity_type VARCHAR(50), -- driving, walking, stationary
  
  -- Timestamps
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT valid_accuracy CHECK (accuracy >= 0),
  CONSTRAINT valid_speed CHECK (speed >= 0),
  CONSTRAINT valid_heading CHECK (heading >= 0 AND heading <= 360),
  CONSTRAINT valid_battery CHECK (battery_level >= 0 AND battery_level <= 100)
);

-- Indexes
CREATE INDEX idx_courier_location_courier_id ON courier_location_history(courier_id);
CREATE INDEX idx_courier_location_route_id ON courier_location_history(route_id);
CREATE INDEX idx_courier_location_recorded_at ON courier_location_history(recorded_at);
CREATE INDEX idx_courier_location_coords ON courier_location_history(latitude, longitude);

-- Spatial index for geographic queries
CREATE INDEX idx_courier_location_geog ON courier_location_history 
  USING GIST (ST_MakePoint(longitude, latitude)::geography);

-- RLS Policies
ALTER TABLE courier_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY courier_own_location ON courier_location_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM couriers
      WHERE couriers.courier_id = courier_location_history.courier_id
      AND couriers.user_id = auth.uid()
    )
  );

CREATE POLICY admin_all_locations ON courier_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );

-- Merchant can see courier location for their orders
CREATE POLICY merchant_order_courier_location ON courier_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN stores s ON o.store_id = s.store_id
      JOIN delivery_routes dr ON o.order_id = ANY(
        SELECT order_id FROM route_stops WHERE route_id = dr.route_id
      )
      WHERE dr.courier_id = courier_location_history.courier_id
      AND s.owner_user_id = auth.uid()
      AND o.order_status IN ('in_transit', 'out_for_delivery')
    )
  );

-- Consumer can see courier location for their order
CREATE POLICY consumer_order_courier_location ON courier_location_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN delivery_routes dr ON o.order_id = ANY(
        SELECT order_id FROM route_stops WHERE route_id = dr.route_id
      )
      WHERE dr.courier_id = courier_location_history.courier_id
      AND o.customer_email = (
        SELECT email FROM users WHERE user_id = auth.uid()
      )
      AND o.order_status IN ('in_transit', 'out_for_delivery')
    )
  );
```

---

### **New Table: geofence_events**

```sql
CREATE TABLE IF NOT EXISTS geofence_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  stop_id UUID REFERENCES route_stops(stop_id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
  
  -- Event Information
  event_type VARCHAR(50) NOT NULL, -- entered, exited, dwelling
  
  -- Location
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  geofence_radius DECIMAL(10,2) DEFAULT 50, -- meters
  distance_from_center DECIMAL(10,2), -- meters
  
  -- Timing
  event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dwell_time_seconds INTEGER, -- time spent in geofence
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN ('entered', 'exited', 'dwelling'))
);

-- Indexes
CREATE INDEX idx_geofence_events_courier_id ON geofence_events(courier_id);
CREATE INDEX idx_geofence_events_stop_id ON geofence_events(stop_id);
CREATE INDEX idx_geofence_events_order_id ON geofence_events(order_id);
CREATE INDEX idx_geofence_events_type ON geofence_events(event_type);
CREATE INDEX idx_geofence_events_time ON geofence_events(event_time);
```

---

## 🔔 AUTOMATIC NOTIFICATIONS

### **Geofence-Based Notifications:**

**1. Courier Approaching (500m radius)**
- Trigger: Courier enters 500m geofence
- Notify: Customer
- Message: "Your courier is 5 minutes away!"

**2. Courier Arrived (50m radius)**
- Trigger: Courier enters 50m geofence
- Notify: Customer
- Message: "Your courier has arrived!"

**3. Delivery Completed**
- Trigger: Status updated to "delivered"
- Notify: Customer & Merchant
- Message: "Your package has been delivered!"

**4. Delivery Failed**
- Trigger: Status updated to "failed"
- Notify: Customer & Merchant
- Message: "Delivery attempt failed. Reason: [reason]"

**5. Courier Delayed**
- Trigger: ETA exceeded by 15 minutes
- Notify: Customer
- Message: "Your delivery is running late. New ETA: [time]"

---

## 📱 MOBILE APP UI/UX

### **Courier App - Delivery Screen**

```typescript
interface DeliveryScreen {
  // Top Section
  header: {
    currentStop: string; // "Stop 3 of 12"
    eta: string; // "ETA: 2:30 PM"
    distance: string; // "0.5 km away"
  };
  
  // Map Section (60% of screen)
  map: {
    courierLocation: Marker;
    customerLocation: Marker;
    route: Polyline;
    geofence: Circle;
    traffic: boolean;
  };
  
  // Delivery Info Section
  deliveryInfo: {
    customerName: string;
    address: string;
    phone: string;
    instructions: string;
    packageCount: number;
  };
  
  // Action Buttons
  actions: {
    navigate: () => void; // Open navigation app
    call: () => void; // Call customer
    arrived: () => void; // Mark as arrived
    deliver: () => void; // Complete delivery
  };
}

// Delivery Status Modal
interface DeliveryStatusModal {
  title: string; // "Complete Delivery"
  
  statusOptions: [
    { value: 'delivered', label: 'Delivered', icon: '✅' },
    { value: 'failed', label: 'Failed', icon: '❌' },
    { value: 'partial', label: 'Partial', icon: '⚠️' },
    { value: 'returned', label: 'Return', icon: '🔄' },
    { value: 'attempted', label: 'Attempted', icon: '🔔' },
  ];
  
  proofOfDelivery: {
    signature: () => void;
    photo: () => void;
    pin: () => void;
    recipientName: string;
    recipientRelation: string;
  };
  
  failureReasons: [
    'Customer not home',
    'Wrong address',
    'Access denied',
    'Customer refused',
    'Damaged package',
    'Other',
  ];
  
  notes: string;
  
  actions: {
    submit: () => void;
    cancel: () => void;
  };
}
```

---

### **Customer App - Live Tracking Screen**

```typescript
interface LiveTrackingScreen {
  // Map Section (70% of screen)
  map: {
    courierLocation: Marker; // Real-time
    myLocation: Marker;
    route: Polyline;
    eta: string;
  };
  
  // Courier Info
  courierInfo: {
    name: string;
    photo: string;
    rating: number;
    phone: string;
    vehicleType: string;
  };
  
  // Delivery Status
  status: {
    current: string; // "On the way"
    progress: number; // 75%
    stops: {
      completed: number;
      total: number;
    };
  };
  
  // ETA Info
  eta: {
    time: string; // "2:30 PM"
    distance: string; // "2.5 km"
    traffic: string; // "Light traffic"
  };
  
  // Actions
  actions: {
    call: () => void; // Call courier
    message: () => void; // Message courier
    changeAddress: () => void;
    addInstructions: () => void;
  };
}
```

---

## 🔧 API ENDPOINTS

### **POST /api/courier/location/update**
**Purpose:** Update courier location  
**Auth:** Required (courier role)  
**Body:**
```typescript
{
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  battery_level?: number;
  is_charging?: boolean;
  activity_type?: string;
  route_id?: string;
}
```

---

### **GET /api/courier/location/current/:courierId**
**Purpose:** Get current courier location  
**Auth:** Required (admin, merchant with active order, consumer with active order)  
**Response:**
```typescript
{
  success: boolean;
  data: {
    courier_id: string;
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number;
    heading: number;
    last_updated: string;
    is_moving: boolean;
    activity_type: string;
  };
}
```

---

### **GET /api/courier/location/history/:courierId**
**Purpose:** Get courier location history  
**Auth:** Required (admin, courier)  
**Query:** `?start_time=2025-10-30T08:00:00Z&end_time=2025-10-30T18:00:00Z`  
**Response:**
```typescript
{
  success: boolean;
  data: Array<{
    latitude: number;
    longitude: number;
    recorded_at: string;
    speed: number;
    accuracy: number;
  }>;
}
```

---

### **POST /api/courier/delivery/status**
**Purpose:** Update delivery status  
**Auth:** Required (courier role)  
**Body:**
```typescript
{
  order_id: string;
  status: 'delivered' | 'failed' | 'partial' | 'returned' | 'attempted' | 'damaged';
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  proof?: {
    signature_url?: string;
    photo_url?: string;
    recipient_name?: string;
    recipient_relation?: string;
    pin_code?: string;
  };
  failure_reason?: string;
  notes?: string;
}
```

---

### **GET /api/order/:orderId/tracking**
**Purpose:** Get real-time order tracking  
**Auth:** Required (merchant, consumer, admin)  
**Response:**
```typescript
{
  success: boolean;
  data: {
    order_id: string;
    order_status: string;
    courier: {
      courier_id: string;
      name: string;
      phone: string;
      photo_url: string;
      rating: number;
      current_location: {
        latitude: number;
        longitude: number;
        last_updated: string;
      };
    };
    route: {
      total_stops: number;
      completed_stops: number;
      current_stop: number;
      eta: string;
      distance_remaining: number;
    };
    delivery_address: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
}
```

---

## 📊 ANALYTICS & REPORTING

### **Metrics to Track:**

1. **Location Accuracy**
   - Average GPS accuracy
   - Location update frequency
   - Battery impact

2. **Delivery Performance**
   - Time at each stop
   - Route adherence
   - Delivery success rate
   - Failed delivery reasons

3. **Customer Experience**
   - ETA accuracy
   - Notification delivery
   - Customer satisfaction
   - Tracking page views

4. **Courier Behavior**
   - Speed patterns
   - Route deviations
   - Break times
   - Idle time

---

## 🔒 PRIVACY & SECURITY

### **Data Protection:**
- Location data encrypted in transit (HTTPS)
- Location data encrypted at rest
- Automatic data deletion after 90 days
- GDPR compliant
- User consent required

### **Access Control:**
- Couriers: Own location only
- Merchants: Active order couriers only
- Consumers: Their order courier only
- Admins: All locations (with audit log)

### **Battery Optimization:**
- Adaptive location frequency
- Geofence-based tracking
- Background task optimization
- Low battery mode

---

## ⏰ IMPLEMENTATION TIMELINE

### **Week 1-2: GPS Infrastructure**
- Set up location permissions
- Implement background tracking
- Create location update API
- Database tables

### **Week 3: Map Integration**
- Integrate map providers
- Real-time courier marker
- Route visualization
- Geofencing

### **Week 4: Delivery Status**
- Status update UI
- Proof of delivery
- Failure reasons
- Notifications

### **Week 5: Testing**
- Field testing
- Battery optimization
- Performance tuning
- Bug fixes

**Total:** 5 weeks

---

## 💰 COST ESTIMATE

**Development:**
- GPS tracking: 40 hours × $100 = $4,000
- Map integration: 30 hours × $100 = $3,000
- Delivery status: 20 hours × $100 = $2,000
- Testing: 10 hours × $100 = $1,000
- **Total:** $10,000

**Infrastructure:**
- Map API (Google/Mapbox): $200/month
- Push notifications: Included
- **Total:** $200/month

---

**Status:** ✅ SPECIFICATION COMPLETE  
**Next:** IMPLEMENT GPS TRACKING  
**Framework:** ✅ SPEC_DRIVEN_FRAMEWORK v1.25
