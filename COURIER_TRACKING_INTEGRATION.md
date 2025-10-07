# Courier Tracking API Integration Plan

**Created:** October 7, 2025, 11:48  
**Priority:** High  
**Timeline:** 4-6 weeks  
**Status:** Planning Phase

---

## 📋 **EXECUTIVE SUMMARY**

Integrate real-time tracking from major courier APIs to provide unified tracking experience for merchants and consumers. This will enable:
- Real-time shipment visibility
- Automated status updates
- Delivery notifications
- Performance monitoring
- Customer satisfaction

---

## 🎯 **OBJECTIVES**

### **Primary Goals:**
1. Integrate 5-10 major courier tracking APIs
2. Create unified tracking interface
3. Normalize tracking data across couriers
4. Provide real-time updates
5. Enable delivery notifications

### **Success Metrics:**
- 95%+ tracking accuracy
- <2 second API response time
- 99.9% uptime
- 90%+ customer satisfaction
- 50% reduction in "where is my order" inquiries

---

## 🚚 **COURIER APIS TO INTEGRATE**

### **Phase 1: Nordic Couriers (Priority)**

#### **1. PostNord**
- **API Type:** REST API
- **Documentation:** https://developer.postnord.com
- **Authentication:** API Key
- **Rate Limits:** 1000 requests/hour
- **Cost:** Free for basic tracking
- **Features:**
  - Real-time tracking
  - Delivery notifications
  - Proof of delivery
  - Estimated delivery time

#### **2. DHL Express**
- **API Type:** REST/XML API
- **Documentation:** https://developer.dhl.com
- **Authentication:** API Key + Secret
- **Rate Limits:** 250 requests/minute
- **Cost:** Free tier available
- **Features:**
  - Global tracking
  - Shipment events
  - Delivery signatures
  - Time-definite delivery

#### **3. Bring (Posten Norge)**
- **API Type:** REST API
- **Documentation:** https://developer.bring.com
- **Authentication:** API Key
- **Rate Limits:** 120 requests/minute
- **Cost:** Free
- **Features:**
  - Detailed tracking events
  - Estimated delivery
  - Recipient notifications
  - Pickup point info

#### **4. Budbee**
- **API Type:** REST API
- **Documentation:** https://developer.budbee.com
- **Authentication:** OAuth 2.0
- **Rate Limits:** 100 requests/minute
- **Cost:** Free for partners
- **Features:**
  - Live tracking
  - SMS notifications
  - Delivery window
  - Driver location

#### **5. Instabox**
- **API Type:** REST API
- **Documentation:** https://developer.instabox.io
- **Authentication:** API Key
- **Rate Limits:** 60 requests/minute
- **Cost:** Free
- **Features:**
  - Locker tracking
  - Pickup notifications
  - QR code generation
  - Return handling

---

### **Phase 2: International Couriers**

#### **6. UPS**
- **API Type:** REST API
- **Documentation:** https://developer.ups.com
- **Authentication:** OAuth 2.0
- **Rate Limits:** 250 requests/minute
- **Cost:** Free tier (1000 requests/day)

#### **7. FedEx**
- **API Type:** REST API
- **Documentation:** https://developer.fedex.com
- **Authentication:** API Key
- **Rate Limits:** 100 requests/minute
- **Cost:** Free tier available

#### **8. DPD**
- **API Type:** REST API
- **Documentation:** https://esolutions.dpd.com
- **Authentication:** API Key
- **Rate Limits:** 60 requests/minute
- **Cost:** Free for partners

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **1. Tracking Service Layer**

```typescript
// Unified Tracking Service
interface TrackingService {
  getTracking(trackingNumber: string, courier: string): Promise<TrackingInfo>;
  subscribeToUpdates(trackingNumber: string): Promise<void>;
  getDeliveryProof(trackingNumber: string): Promise<ProofOfDelivery>;
}

// Normalized Tracking Data
interface TrackingInfo {
  trackingNumber: string;
  courier: string;
  status: TrackingStatus;
  events: TrackingEvent[];
  estimatedDelivery: Date | null;
  actualDelivery: Date | null;
  currentLocation: Location | null;
  recipient: RecipientInfo | null;
  proofOfDelivery: ProofOfDelivery | null;
}

enum TrackingStatus {
  PENDING = 'pending',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED_DELIVERY = 'failed_delivery',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}

interface TrackingEvent {
  timestamp: Date;
  status: string;
  location: string;
  description: string;
  courierEventCode: string;
}
```

---

### **2. Courier Adapters**

Each courier gets its own adapter:

```typescript
// Base Adapter Interface
interface CourierAdapter {
  name: string;
  track(trackingNumber: string): Promise<RawTrackingData>;
  normalizeData(raw: RawTrackingData): TrackingInfo;
  validateTrackingNumber(trackingNumber: string): boolean;
}

// Example: PostNord Adapter
class PostNordAdapter implements CourierAdapter {
  name = 'PostNord';
  
  async track(trackingNumber: string) {
    const response = await fetch(
      `https://api.postnord.com/rest/shipment/v5/trackandtrace/findByIdentifier.json`,
      {
        headers: {
          'apikey': process.env.POSTNORD_API_KEY,
          'Accept': 'application/json'
        },
        params: {
          id: trackingNumber,
          locale: 'en'
        }
      }
    );
    return response.json();
  }
  
  normalizeData(raw: any): TrackingInfo {
    // Convert PostNord format to unified format
    return {
      trackingNumber: raw.TrackingInformationResponse.shipments[0].shipmentId,
      courier: 'PostNord',
      status: this.mapStatus(raw.TrackingInformationResponse.shipments[0].statusCode),
      events: raw.TrackingInformationResponse.shipments[0].items[0].events.map(e => ({
        timestamp: new Date(e.eventTime),
        status: e.eventDescription,
        location: e.location.displayName,
        description: e.eventDescription,
        courierEventCode: e.eventCode
      })),
      // ... more fields
    };
  }
  
  mapStatus(courierStatus: string): TrackingStatus {
    const statusMap = {
      'DELIVERED': TrackingStatus.DELIVERED,
      'IN_TRANSIT': TrackingStatus.IN_TRANSIT,
      'READY_FOR_DELIVERY': TrackingStatus.OUT_FOR_DELIVERY,
      // ... more mappings
    };
    return statusMap[courierStatus] || TrackingStatus.PENDING;
  }
}
```

---

### **3. Database Schema**

```sql
-- Tracking data table
CREATE TABLE tracking_data (
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id),
  tracking_number VARCHAR(255) NOT NULL,
  courier VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_location JSONB,
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW(),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_tracking_number (tracking_number),
  INDEX idx_order_id (order_id),
  INDEX idx_status (status)
);

-- Tracking events table
CREATE TABLE tracking_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID REFERENCES tracking_data(tracking_id),
  event_time TIMESTAMP NOT NULL,
  status VARCHAR(50),
  location VARCHAR(255),
  description TEXT,
  courier_event_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_tracking_id (tracking_id),
  INDEX idx_event_time (event_time)
);

-- Tracking subscriptions (for webhooks)
CREATE TABLE tracking_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number VARCHAR(255) NOT NULL,
  courier VARCHAR(100) NOT NULL,
  webhook_url VARCHAR(500),
  user_id UUID REFERENCES users(user_id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_tracking_number (tracking_number)
);
```

---

### **4. API Endpoints**

```typescript
// Get tracking information
GET /api/tracking/:trackingNumber
Response: {
  success: true,
  data: TrackingInfo
}

// Get tracking by order ID
GET /api/orders/:orderId/tracking
Response: {
  success: true,
  data: TrackingInfo[]
}

// Subscribe to tracking updates
POST /api/tracking/:trackingNumber/subscribe
Body: {
  webhookUrl?: string,
  notifyEmail?: string,
  notifySMS?: string
}

// Refresh tracking data (force update)
POST /api/tracking/:trackingNumber/refresh

// Get delivery proof
GET /api/tracking/:trackingNumber/proof
Response: {
  success: true,
  data: {
    signature: string (base64),
    photo: string (URL),
    timestamp: Date,
    recipientName: string
  }
}
```

---

## 🎨 **USER INTERFACE**

### **1. Tracking Page**

```
┌─────────────────────────────────────────────────────────────┐
│  📦 Track Your Shipment                                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tracking Number: ABC123456789                               │
│  Courier: PostNord                                           │
│  Status: ● Out for Delivery                                  │
│  Estimated Delivery: Today, 14:00-16:00                      │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📍 Current Location                                   │  │
│  │  [MAP showing delivery route and current location]     │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📋 Tracking History                                   │  │
│  │                                                         │  │
│  │  ✅ Oct 7, 10:30 - Out for Delivery                   │  │
│  │     Stockholm Distribution Center                       │  │
│  │                                                         │  │
│  │  ✅ Oct 7, 08:15 - Arrived at Facility                │  │
│  │     Stockholm Distribution Center                       │  │
│  │                                                         │  │
│  │  ✅ Oct 6, 22:45 - In Transit                         │  │
│  │     Gothenburg Hub                                      │  │
│  │                                                         │  │
│  │  ✅ Oct 6, 18:00 - Picked Up                          │  │
│  │     Merchant Location                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  [🔔 Enable Notifications]  [📧 Share Tracking]             │
└─────────────────────────────────────────────────────────────┘
```

---

### **2. Merchant Dashboard Widget**

```
┌─────────────────────────────────────────┐
│  📦 Active Shipments (24)               │
├─────────────────────────────────────────┤
│  ● Out for Delivery (8)                 │
│  ● In Transit (12)                      │
│  ● Picked Up (4)                        │
│                                          │
│  Recent Updates:                         │
│  • Order #1234 - Delivered ✅           │
│  • Order #1235 - Out for Delivery 🚚   │
│  • Order #1236 - Delayed ⚠️            │
│                                          │
│  [View All Shipments]                   │
└─────────────────────────────────────────┘
```

---

## 🔄 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation (Week 1-2)**
- [ ] Design database schema
- [ ] Create base adapter interface
- [ ] Implement tracking service layer
- [ ] Set up API endpoints
- [ ] Create admin interface

### **Phase 2: Nordic Couriers (Week 2-3)**
- [ ] PostNord adapter
- [ ] DHL Express adapter
- [ ] Bring adapter
- [ ] Budbee adapter
- [ ] Instabox adapter

### **Phase 3: UI & Notifications (Week 3-4)**
- [ ] Tracking page design
- [ ] Merchant dashboard widget
- [ ] Email notifications
- [ ] SMS notifications (optional)
- [ ] Webhook system

### **Phase 4: International (Week 4-5)**
- [ ] UPS adapter
- [ ] FedEx adapter
- [ ] DPD adapter

### **Phase 5: Polish & Launch (Week 5-6)**
- [ ] Testing & QA
- [ ] Performance optimization
- [ ] Documentation
- [ ] Beta launch

---

## 💰 **COST ANALYSIS**

### **API Costs:**
- Most courier APIs: Free for basic tracking
- UPS: Free tier (1000/day), then $0.01/request
- FedEx: Free tier, then $0.02/request
- **Estimated:** $50-200/month initially

### **Development:**
- 1 Senior Developer: 6 weeks × $8,000 = $48,000
- 1 Junior Developer: 4 weeks × $4,000 = $16,000
- **Total:** $64,000

### **Infrastructure:**
- Database storage: $20/month
- API hosting: $50/month
- Monitoring: $30/month
- **Total:** $100/month

---

## 📈 **REVENUE POTENTIAL**

### **Pricing Models:**

**Option 1: Included in Subscription**
- No additional charge
- Increases platform value
- Attracts more merchants

**Option 2: Per-Tracking Fee**
- $0.10-0.25 per tracking request
- 10,000 requests/month = $1,000-2,500/month

**Option 3: Tiered Add-on**
- Basic: Free (100 trackings/month)
- Pro: $29/month (1,000 trackings)
- Enterprise: $99/month (unlimited)

**Recommended:** Option 1 (included) for competitive advantage

---

## 🎯 **SUCCESS CRITERIA**

- ✅ 5+ courier APIs integrated
- ✅ <2 second average response time
- ✅ 95%+ tracking accuracy
- ✅ 99.9% uptime
- ✅ Real-time updates (<5 min delay)
- ✅ Mobile-responsive UI
- ✅ Email notifications working
- ✅ Merchant satisfaction >90%

---

## 🚀 **NEXT STEPS**

1. **Immediate (This Week):**
   - Register for courier API access
   - Set up test accounts
   - Design database schema
   - Create project structure

2. **Short-term (Next 2 Weeks):**
   - Implement PostNord adapter (most common in Nordics)
   - Build tracking UI
   - Test with real tracking numbers

3. **Medium-term (Month 1-2):**
   - Complete all Phase 1 couriers
   - Launch beta to select merchants
   - Gather feedback

---

**Ready to start implementation?** 🚀

