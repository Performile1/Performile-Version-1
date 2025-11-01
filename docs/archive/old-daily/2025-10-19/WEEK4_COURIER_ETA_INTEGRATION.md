# 🚚 COURIER ETA/TRACKING API INTEGRATION

**Date:** October 19, 2025, 8:31 PM  
**Purpose:** Fetch real-time Expected Delivery Date from courier APIs  
**Priority:** HIGH - Required for accurate on-time delivery tracking

---

## 🎯 PROBLEM

Currently, `orders.estimated_delivery` is a static field that doesn't reflect:
- ✅ Real-time courier tracking updates
- ✅ Actual ETA from courier systems
- ✅ Delays or route changes
- ✅ Dynamic delivery windows

**Impact:**
- ❌ Inaccurate on-time delivery calculations
- ❌ Can't track if courier met their own ETA
- ❌ No real-time performance monitoring

---

## 🔧 SOLUTION: COURIER API INTEGRATION

### **Approach:**

1. **Fetch ETA from Courier Tracking APIs**
2. **Store in new table: `tracking_updates`**
3. **Use latest ETA for on-time calculations**
4. **Track ETA changes over time**

---

## 📊 DATABASE SCHEMA UPDATES

### **New Table: tracking_updates**

```sql
CREATE TABLE tracking_updates (
    tracking_update_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) NOT NULL,
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    
    -- Tracking Status
    status VARCHAR(50) NOT NULL, -- 'in_transit', 'out_for_delivery', 'delivered', 'exception', etc.
    status_description TEXT,
    location VARCHAR(200), -- Current location
    
    -- ETA Information
    estimated_delivery_date DATE, -- Courier's current ETA
    estimated_delivery_time TIME, -- If available
    estimated_delivery_window_start TIMESTAMP,
    estimated_delivery_window_end TIMESTAMP,
    
    -- Event Details
    event_type VARCHAR(50), -- 'pickup', 'in_transit', 'out_for_delivery', 'delivered', 'delayed', etc.
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    event_location VARCHAR(200),
    event_description TEXT,
    
    -- API Source
    api_source VARCHAR(50), -- 'dhl', 'postnord', 'bring', 'ups', 'fedex', etc.
    api_response JSONB, -- Full API response for debugging
    
    -- Metadata
    is_latest BOOLEAN DEFAULT true, -- Mark latest update per order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT tracking_updates_order_tracking_unique UNIQUE(order_id, event_timestamp)
);

CREATE INDEX idx_tracking_updates_order ON tracking_updates(order_id);
CREATE INDEX idx_tracking_updates_tracking_number ON tracking_updates(tracking_number);
CREATE INDEX idx_tracking_updates_courier ON tracking_updates(courier_id);
CREATE INDEX idx_tracking_updates_status ON tracking_updates(status);
CREATE INDEX idx_tracking_updates_latest ON tracking_updates(is_latest) WHERE is_latest = true;
CREATE INDEX idx_tracking_updates_event_time ON tracking_updates(event_timestamp DESC);
```

### **Update orders table:**

```sql
-- Add columns to track ETA changes
ALTER TABLE orders ADD COLUMN IF NOT EXISTS initial_estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS eta_changed_count INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_tracking_update TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN orders.initial_estimated_delivery IS 'Original ETA when order was created';
COMMENT ON COLUMN orders.current_estimated_delivery IS 'Latest ETA from courier tracking API';
COMMENT ON COLUMN orders.eta_changed_count IS 'Number of times ETA was updated';
COMMENT ON COLUMN orders.last_tracking_update IS 'Last time tracking was updated from API';
```

---

## 🔌 COURIER API ENDPOINTS

### **1. DHL Express API**

**Endpoint:** `https://api-eu.dhl.com/track/shipments`

**Request:**
```http
GET /track/shipments?trackingNumber={tracking_number}
Authorization: Bearer {api_key}
```

**Response:**
```json
{
  "shipments": [{
    "id": "1234567890",
    "status": {
      "statusCode": "transit",
      "status": "In Transit"
    },
    "estimatedDeliveryDate": "2025-10-22",
    "estimatedTimeOfDelivery": "2025-10-22T14:00:00",
    "events": [{
      "timestamp": "2025-10-19T10:30:00",
      "location": "Stockholm",
      "description": "Shipment picked up"
    }]
  }]
}
```

**ETA Field:** `estimatedDeliveryDate` or `estimatedTimeOfDelivery`

---

### **2. PostNord API**

**Endpoint:** `https://api2.postnord.com/rest/shipment/v5/trackandtrace/findByIdentifier.json`

**Request:**
```http
GET /rest/shipment/v5/trackandtrace/findByIdentifier.json?id={tracking_number}&apikey={api_key}
```

**Response:**
```json
{
  "TrackingInformationResponse": {
    "shipments": [{
      "shipmentId": "1234567890",
      "statusText": "In transit",
      "estimatedTimeOfArrival": "2025-10-22T00:00:00",
      "items": [{
        "events": [{
          "eventTime": "2025-10-19T10:30:00",
          "location": "Stockholm",
          "eventDescription": "Item received"
        }]
      }]
    }]
  }
}
```

**ETA Field:** `estimatedTimeOfArrival`

---

### **3. Bring API**

**Endpoint:** `https://api.bring.com/tracking/api/tracking.json`

**Request:**
```http
GET /tracking/api/tracking.json?q={tracking_number}
X-Mybring-API-Key: {api_key}
```

**Response:**
```json
{
  "consignmentSet": [{
    "packageSet": [{
      "statusDescription": "In transit",
      "estimatedDeliveryDate": "2025-10-22",
      "eventSet": [{
        "displayDate": "2025-10-19",
        "displayTime": "10:30",
        "city": "Oslo",
        "description": "Package received"
      }]
    }]
  }]
}
```

**ETA Field:** `estimatedDeliveryDate`

---

### **4. UPS API**

**Endpoint:** `https://onlinetools.ups.com/track/v1/details/{tracking_number}`

**Request:**
```http
GET /track/v1/details/{tracking_number}
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "trackResponse": {
    "shipment": [{
      "package": [{
        "currentStatus": {
          "statusCode": "IT",
          "description": "In Transit"
        },
        "deliveryDate": [{
          "date": "20251022"
        }],
        "activity": [{
          "date": "20251019",
          "time": "103000",
          "location": "Stockholm, SE"
        }]
      }]
    }]
  }
}
```

**ETA Field:** `deliveryDate.date`

---

### **5. FedEx API**

**Endpoint:** `https://apis.fedex.com/track/v1/trackingnumbers`

**Request:**
```http
POST /track/v1/trackingnumbers
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "trackingInfo": [{
    "trackingNumberInfo": {
      "trackingNumber": "1234567890"
    }
  }]
}
```

**Response:**
```json
{
  "output": {
    "completeTrackResults": [{
      "trackingNumber": "1234567890",
      "trackResults": [{
        "latestStatusDetail": {
          "statusByLocale": "In transit"
        },
        "estimatedDeliveryTimeWindow": {
          "window": {
            "begins": "2025-10-22T08:00:00",
            "ends": "2025-10-22T17:00:00"
          }
        }
      }]
    }]
  }
}
```

**ETA Field:** `estimatedDeliveryTimeWindow`

---

## 🔄 IMPLEMENTATION FLOW

### **1. Tracking Update Worker (Backend)**

```typescript
// api/workers/tracking-updater.ts

import { createClient } from '@supabase/supabase-js';

interface TrackingUpdate {
  orderId: string;
  trackingNumber: string;
  courierId: string;
  status: string;
  estimatedDeliveryDate: string;
  eventTimestamp: string;
  location: string;
  apiResponse: any;
}

async function updateOrderTracking(orderId: string) {
  // 1. Get order details
  const order = await supabase
    .from('orders')
    .select('tracking_number, courier_id, couriers(courier_code)')
    .eq('order_id', orderId)
    .single();
  
  // 2. Fetch tracking from courier API
  const trackingData = await fetchCourierTracking(
    order.couriers.courier_code,
    order.tracking_number
  );
  
  // 3. Extract ETA
  const newETA = extractETA(trackingData, order.couriers.courier_code);
  
  // 4. Store tracking update
  await supabase.from('tracking_updates').insert({
    order_id: orderId,
    tracking_number: order.tracking_number,
    courier_id: order.courier_id,
    status: trackingData.status,
    estimated_delivery_date: newETA,
    event_timestamp: trackingData.eventTime,
    location: trackingData.location,
    api_source: order.couriers.courier_code,
    api_response: trackingData,
    is_latest: true
  });
  
  // 5. Update order with latest ETA
  await supabase
    .from('orders')
    .update({
      current_estimated_delivery: newETA,
      last_tracking_update: new Date().toISOString(),
      eta_changed_count: order.eta_changed_count + 1
    })
    .eq('order_id', orderId);
}

async function fetchCourierTracking(courierCode: string, trackingNumber: string) {
  switch (courierCode.toLowerCase()) {
    case 'dhl':
      return fetchDHLTracking(trackingNumber);
    case 'postnord':
      return fetchPostNordTracking(trackingNumber);
    case 'bring':
      return fetchBringTracking(trackingNumber);
    case 'ups':
      return fetchUPSTracking(trackingNumber);
    case 'fedex':
      return fetchFedExTracking(trackingNumber);
    default:
      throw new Error(`Unsupported courier: ${courierCode}`);
  }
}
```

### **2. Scheduled Job (Cron)**

```typescript
// Run every hour for active orders
export async function trackingUpdateJob() {
  const activeOrders = await supabase
    .from('orders')
    .select('order_id')
    .in('order_status', ['pending', 'in_transit', 'out_for_delivery'])
    .is('tracking_number', 'not', null);
  
  for (const order of activeOrders) {
    try {
      await updateOrderTracking(order.order_id);
    } catch (error) {
      console.error(`Failed to update tracking for order ${order.order_id}:`, error);
    }
  }
}
```

### **3. Updated Performance Calculation**

```sql
-- Use current_estimated_delivery instead of estimated_delivery
CREATE OR REPLACE FUNCTION calculate_service_performance(
    p_courier_id UUID,
    p_service_type_id UUID,
    p_period_start DATE,
    p_period_end DATE,
    p_period_type VARCHAR(20)
)
RETURNS UUID AS $$
DECLARE
    v_on_time_orders INTEGER;
BEGIN
    -- Calculate on-time orders using CURRENT ETA from courier
    SELECT COUNT(*) FILTER (
        WHERE o.delivery_date::DATE <= COALESCE(o.current_estimated_delivery, o.initial_estimated_delivery, o.estimated_delivery)
        AND o.order_status = 'delivered'
    )
    INTO v_on_time_orders
    FROM orders o
    JOIN orderservicetype ost ON o.order_id = ost.order_id
    WHERE o.courier_id = p_courier_id
      AND ost.service_type_id = p_service_type_id
      AND o.order_date BETWEEN p_period_start AND p_period_end;
    
    -- Rest of calculation...
END;
$$ LANGUAGE plpgsql;
```

---

## 📋 IMPLEMENTATION PHASES

### **Phase A: Database Schema** (30 min)
- [ ] Create `tracking_updates` table
- [ ] Add ETA columns to `orders` table
- [ ] Create indexes
- [ ] Update RLS policies

### **Phase B: API Integrations** (4-6 hours)
- [ ] DHL tracking integration
- [ ] PostNord tracking integration
- [ ] Bring tracking integration
- [ ] UPS tracking integration (optional)
- [ ] FedEx tracking integration (optional)

### **Phase C: Backend Worker** (2-3 hours)
- [ ] Create tracking update worker
- [ ] Implement cron job
- [ ] Add error handling & retry logic
- [ ] Add rate limiting

### **Phase D: Update Performance Calculations** (1 hour)
- [ ] Update `calculate_service_performance` function
- [ ] Use `current_estimated_delivery` for on-time calculations
- [ ] Track ETA accuracy metrics

### **Phase E: Frontend Display** (2-3 hours)
- [ ] Show ETA updates in order details
- [ ] Display ETA change history
- [ ] Show "ETA changed" notifications
- [ ] Add tracking timeline

---

## 🎯 BENEFITS

### **Accurate Performance Metrics:**
- ✅ On-time delivery based on courier's own ETA
- ✅ Track if courier met their promised delivery date
- ✅ Identify couriers who frequently change ETAs

### **Better Customer Experience:**
- ✅ Real-time delivery updates
- ✅ Accurate ETA information
- ✅ Proactive delay notifications

### **Business Intelligence:**
- ✅ ETA accuracy per courier
- ✅ Identify unreliable couriers
- ✅ Track delivery performance trends

---

## 📊 METRICS TO TRACK

1. **ETA Accuracy Rate**
   - % of deliveries that met the ETA
   - Average ETA deviation (days)

2. **ETA Stability**
   - Average number of ETA changes per order
   - % of orders with ETA changes

3. **Courier Reliability**
   - Which couriers provide accurate ETAs
   - Which couriers frequently change ETAs

---

## 🔐 API CREDENTIALS NEEDED

Store in `courier_api_credentials` table:

```sql
-- DHL
api_key: "your-dhl-api-key"
base_url: "https://api-eu.dhl.com"

-- PostNord
api_key: "your-postnord-api-key"
base_url: "https://api2.postnord.com"

-- Bring
api_key: "your-bring-api-key"
base_url: "https://api.bring.com"

-- UPS
client_id: "your-ups-client-id"
client_secret: "your-ups-client-secret"
base_url: "https://onlinetools.ups.com"

-- FedEx
client_id: "your-fedex-client-id"
client_secret: "your-fedex-client-secret"
base_url: "https://apis.fedex.com"
```

---

## ⚠️ IMPORTANT NOTES

1. **Rate Limits:**
   - DHL: 250 requests/day (free tier)
   - PostNord: 1000 requests/day
   - Bring: 500 requests/day
   - UPS: 1000 requests/day
   - FedEx: 500 requests/day

2. **Caching:**
   - Cache tracking data for 1 hour
   - Only update if status changed
   - Reduce API calls

3. **Fallback:**
   - If API fails, use `estimated_delivery` from order
   - Log API failures for monitoring

4. **Testing:**
   - Use test tracking numbers from courier docs
   - Test with real tracking numbers in staging

---

## 🚀 RECOMMENDATION

**For Week 4 Phase 1:**
- ✅ Use `estimated_delivery` for now (temporary)
- ✅ Add note that it will be replaced with real ETA
- ✅ Plan Phase B for courier API integration

**For Week 4 Phase B (After Phase 1-3):**
- ✅ Implement tracking API integrations
- ✅ Create tracking update worker
- ✅ Update performance calculations
- ✅ Add ETA accuracy metrics

---

## 📝 TEMPORARY FIX FOR PHASE 1

For now, let's use the existing `estimated_delivery` field and add a comment:

```sql
-- TEMPORARY: Uses estimated_delivery until courier API integration (Week 4 Phase B)
-- TODO: Replace with current_estimated_delivery from tracking_updates table
COUNT(*) FILTER (WHERE o.delivery_date::DATE <= o.estimated_delivery AND o.order_status = 'delivered')
```

---

**Created By:** Cascade AI  
**Date:** October 19, 2025, 8:35 PM  
**Status:** Specification Complete  
**Next:** Implement in Week 4 Phase B (after Phase 1-3)

---

*"The best time to integrate tracking APIs was at the start. The second best time is now."*

**Let's build accurate performance tracking! 🚀**
