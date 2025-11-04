# Future Features Specification: RMA, TA, WMS & Click-and-Collect

**Date:** November 4, 2025  
**Version:** 1.0  
**Priority:** POST-LAUNCH (After December 9, 2025)  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.28  
**Status:** 📋 SPECIFICATION PHASE

---

## 🎯 EXECUTIVE SUMMARY

Four major feature sets for post-launch development:

1. **RMA (Return Merchandise Authorization)** - Consumer returns approved by merchants
2. **TA (Transport Authorization)** - Consumer-to-consumer shipping using Performile accounts
3. **WMS (Warehouse Management System)** - Multi-warehouse, shelves, pallets, locations
4. **Click-and-Collect** - Physical stores as micro-fulfillment centers

**Timeline:**
- **V4.0 (Q3-Q4 2026):** RMA + TA + Click-and-Collect
- **V5.0 (2027):** Full WMS with AI

---

## 📦 FEATURE 1: RMA (RETURN MERCHANDISE AUTHORIZATION)

### **Overview**
Enable consumers to initiate returns that require merchant approval before shipping.

### **User Flow**
1. Consumer selects order → chooses items → provides reason + photos → submits
2. Merchant reviews → approves/rejects → generates return label
3. Consumer receives QR code → goes to parcel shop → scans QR → label prints
4. Package ships back → merchant receives → confirms condition → processes refund

### **Key Database Tables**

```sql
-- Main return requests table
CREATE TABLE return_requests (
    return_id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id),
    customer_user_id UUID REFERENCES users(user_id),
    merchant_user_id UUID REFERENCES users(user_id),
    return_reason VARCHAR(50), -- defective, wrong_item, changed_mind, etc.
    status VARCHAR(50), -- pending, approved, rejected, in_transit, completed
    return_qr_code TEXT, -- For parcel shop scanning
    refund_amount DECIMAL(10, 2),
    refund_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Return items
CREATE TABLE return_items (
    return_item_id UUID PRIMARY KEY,
    return_id UUID REFERENCES return_requests(return_id),
    product_name VARCHAR(255),
    quantity INTEGER,
    condition_on_return VARCHAR(50),
    refund_amount DECIMAL(10, 2)
);

-- Tracking events
CREATE TABLE return_tracking_events (
    event_id UUID PRIMARY KEY,
    return_id UUID REFERENCES return_requests(return_id),
    event_type VARCHAR(50),
    event_timestamp TIMESTAMP DEFAULT NOW()
);
```

### **QR Code for Parcel Shop**

**Implementation:**
- Merchant approves return → generates QR code
- QR contains: return_id, tracking_number, label_data (base64)
- Consumer shows QR at parcel shop
- Staff scans → label prints → attaches to package

**API:**
```typescript
POST /api/parcel-shop/scan-return-qr
Body: { qr_code_data, location_id, staff_id }
Response: { label_pdf, tracking_number }
```

### **Key APIs**
- `POST /api/returns` - Create return request
- `POST /api/merchant/returns/:id/review` - Approve/reject
- `POST /api/merchant/returns/:id/generate-label` - Generate QR code
- `POST /api/merchant/returns/:id/process-refund` - Process refund

### **RMA App & Iframe Integration**

#### **Overview**
Embeddable RMA widget that merchants can add to their e-commerce stores, allowing customers to initiate returns directly from the merchant's website.

#### **Implementation Options**

**Option 1: Standalone RMA App**
- Separate React application hosted on Performile domain
- Merchants link to it from their store
- Full-featured return portal
- URL: `https://returns.performile.com/:merchant_id`

**Option 2: Embeddable Iframe Widget (RECOMMENDED)**
- Lightweight iframe that embeds in merchant's website
- Seamless user experience (no redirect)
- Customizable branding
- Responsive design

#### **Iframe Widget Features**

**Consumer View:**
- Order lookup (by order number + email)
- Item selection for return
- Reason selection with photos
- Return status tracking
- QR code display

**Merchant Configuration:**
- Branding (colors, logo)
- Return policies
- Auto-approval rules
- Notification settings

#### **Technical Implementation**

**1. Iframe Embed Code:**
```html
<!-- Merchant adds this to their website -->
<div id="performile-returns"></div>
<script src="https://cdn.performile.com/returns-widget.js"></script>
<script>
  PerformileReturns.init({
    merchantId: 'YOUR_MERCHANT_ID',
    apiKey: 'YOUR_API_KEY',
    container: '#performile-returns',
    theme: {
      primaryColor: '#4F46E5',
      fontFamily: 'Inter, sans-serif'
    },
    locale: 'en' // or 'no', 'sv', 'da'
  });
</script>
```

**2. Widget Application Structure:**
```
apps/
  └── returns-widget/
      ├── src/
      │   ├── components/
      │   │   ├── OrderLookup.tsx
      │   │   ├── ItemSelection.tsx
      │   │   ├── ReasonForm.tsx
      │   │   ├── PhotoUpload.tsx
      │   │   ├── StatusTracker.tsx
      │   │   └── QRCodeDisplay.tsx
      │   ├── App.tsx
      │   ├── index.tsx
      │   └── sdk.ts (initialization)
      ├── public/
      │   └── returns-widget.js (compiled SDK)
      ├── package.json
      └── vite.config.ts
```

**3. Widget API Endpoints:**
```typescript
// Public endpoints (no JWT required, uses API key)
GET /api/public/returns/lookup
Body: { order_number, email, merchant_id, api_key }
Response: { order_id, items, eligible_for_return }

POST /api/public/returns/create
Body: { 
  order_id, 
  merchant_id, 
  api_key,
  items: [{ product_name, quantity, reason }],
  photos: []
}
Response: { return_id, status }

GET /api/public/returns/:return_id/status
Query: ?merchant_id=X&api_key=Y
Response: { status, tracking_events, qr_code }
```

**4. Security Considerations:**

**API Key Authentication:**
- Merchant-specific API keys (not JWT)
- Rate limiting per API key
- Domain whitelist (CORS)
- Request signing for sensitive operations

**Data Protection:**
- Order lookup requires order_number + email match
- No sensitive data exposed in iframe
- HTTPS only
- CSP (Content Security Policy) headers

**5. Merchant Dashboard Integration:**

**Settings → Returns Widget:**
- Generate API key
- Configure widget appearance
- Set return policies
- View widget analytics
- Get embed code

**6. Widget Customization:**

```typescript
// Advanced configuration
PerformileReturns.init({
  merchantId: 'merchant_123',
  apiKey: 'pk_live_abc123',
  
  // Appearance
  theme: {
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '8px'
  },
  
  // Behavior
  autoApprove: {
    enabled: true,
    conditions: {
      maxDaysSinceDelivery: 30,
      maxOrderValue: 1000,
      excludeReasons: ['changed_mind']
    }
  },
  
  // Features
  features: {
    photoUpload: true,
    qrCode: true,
    tracking: true,
    maxPhotos: 5
  },
  
  // Localization
  locale: 'no',
  customTexts: {
    title: 'Returner',
    submitButton: 'Send returforespørsel'
  },
  
  // Callbacks
  onReturnCreated: (returnId) => {
    console.log('Return created:', returnId);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

**7. Shopify App Integration:**

**Shopify Extension:**
- Add "Returns" tab to customer account
- Embed Performile returns widget
- Auto-populate merchant_id and api_key
- Sync with Shopify orders

**Installation:**
```typescript
// apps/shopify/performile-delivery/extensions/returns-page/
import { useEffect } from 'react';

export default function ReturnsPage() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.performile.com/returns-widget.js';
    script.onload = () => {
      window.PerformileReturns.init({
        merchantId: window.shopifyMerchantId,
        apiKey: window.performileApiKey,
        container: '#returns-widget'
      });
    };
    document.body.appendChild(script);
  }, []);

  return <div id="returns-widget"></div>;
}
```

**8. WooCommerce Plugin Integration:**

**Shortcode:**
```php
// [performile_returns]
function performile_returns_shortcode($atts) {
    $merchant_id = get_option('performile_merchant_id');
    $api_key = get_option('performile_api_key');
    
    return "
        <div id='performile-returns'></div>
        <script src='https://cdn.performile.com/returns-widget.js'></script>
        <script>
            PerformileReturns.init({
                merchantId: '{$merchant_id}',
                apiKey: '{$api_key}',
                container: '#performile-returns'
            });
        </script>
    ";
}
add_shortcode('performile_returns', 'performile_returns_shortcode');
```

**9. Analytics & Monitoring:**

**Widget Analytics:**
- Page views
- Return requests initiated
- Completion rate
- Average time to complete
- Drop-off points
- Error rates

**Merchant Dashboard:**
- Widget performance metrics
- Return request trends
- Most common return reasons
- Photo upload rate

**10. Development Phases:**

**Phase 1: Core Widget (2 weeks)**
- Order lookup
- Item selection
- Reason form
- Basic styling
- API integration

**Phase 2: Enhanced Features (1 week)**
- Photo upload
- QR code display
- Status tracking
- Custom branding

**Phase 3: E-commerce Integration (1 week)**
- Shopify extension
- WooCommerce plugin
- Documentation
- Merchant onboarding

**Total Development Time:** 4 weeks  
**Cost:** $8,000 (included in $18,000 RMA total)

---

## 🚚 FEATURE 2: TA (TRANSPORT AUTHORIZATION) - C2C SHIPPING

### **Overview**
Enable consumers to create shipments to other consumers using Performile's courier accounts.

### **Business Model**
- Performile has master courier accounts (wholesale rates)
- Consumer pays Performile (retail rate with 15-25% markup)
- Performile creates shipment using merchant credentials
- Performile pays courier monthly
- Performile keeps markup as profit

**Example:**
- Courier wholesale: 80 NOK
- Performile markup: 20 NOK (25%)
- Consumer pays: 100 NOK
- Performile profit: 20 NOK

### **User Flow**
1. Consumer enters sender/recipient details
2. System shows courier quotes (with markup)
3. Consumer selects courier → pays Performile
4. System generates label using Performile's courier account
5. Consumer receives label/QR code
6. Tracks shipment → delivery

### **Key Database Table**

```sql
CREATE TABLE consumer_shipments (
    shipment_id UUID PRIMARY KEY,
    sender_user_id UUID REFERENCES users(user_id),
    sender_name VARCHAR(255),
    sender_address TEXT,
    recipient_name VARCHAR(255),
    recipient_address TEXT,
    weight_kg DECIMAL(10, 3),
    courier_id UUID REFERENCES couriers(courier_id),
    tracking_number VARCHAR(255),
    shipping_cost DECIMAL(10, 2), -- What consumer pays
    total_cost DECIMAL(10, 2),
    payment_status VARCHAR(50),
    shipment_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Key APIs**
- `POST /api/consumer-shipping/quote` - Get shipping quotes
- `POST /api/consumer-shipping/shipments` - Create shipment
- `GET /api/consumer-shipping/my-shipments` - List shipments
- `GET /api/consumer-shipping/track/:tracking_number` - Track

---

## 🏭 FEATURE 3: WMS (WAREHOUSE MANAGEMENT SYSTEM)

### **Overview**
Full WMS specification exists in `WMS_DEVELOPMENT_SPEC.md` (990 lines, 25 tables).

**Key Features:**
- Multi-warehouse locations
- Storage structure: Zones → Aisles → Bays → Shelves → Bins
- Location codes: `WH-NO-01-A-05-B-03`
- Inventory tracking per location
- Stock movements
- Picking & packing operations
- AI-powered slotting optimization

### **Integration with RMA**

**Return Receiving Workflow:**
1. Return arrives at warehouse
2. Scanned into WMS
3. Assigned to inspection location (quarantine zone)
4. Quality check performed
5. Decision: restock, refurbish, or dispose
6. If restock: moved to storage location
7. Inventory updated

**New Tables:**
```sql
ALTER TABLE stock_movements ADD COLUMN return_id UUID REFERENCES return_requests(return_id);
ALTER TABLE storage_locations ADD COLUMN quarantine_zone BOOLEAN DEFAULT FALSE;

CREATE TABLE return_inspections (
    inspection_id UUID PRIMARY KEY,
    return_id UUID REFERENCES return_requests(return_id),
    warehouse_id UUID REFERENCES warehouses(warehouse_id),
    condition VARCHAR(50), -- as_new, good, fair, poor, damaged
    decision VARCHAR(50), -- restock, refurbish, dispose
    restocked_location_id UUID REFERENCES storage_locations(location_id)
);
```

### **Integration with Click-and-Collect**

**Store as Micro-Fulfillment Center:**
- Physical store = mini warehouse in WMS
- Store has storage locations (back room, shelves)
- Inventory tracked per location
- Orders fulfilled from store inventory

**New Tables:**
```sql
ALTER TABLE stores ADD COLUMN warehouse_id UUID REFERENCES warehouses(warehouse_id);
ALTER TABLE stores ADD COLUMN is_fulfillment_center BOOLEAN DEFAULT FALSE;

CREATE TABLE store_inventory (
    inventory_id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(store_id),
    product_id UUID REFERENCES products(product_id),
    location_id UUID REFERENCES storage_locations(location_id),
    quantity INTEGER,
    reserved_quantity INTEGER,
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED
);
```

### **Implementation Phases**

**V4.0 (Q3-Q4 2026) - WMS Lite:**
- Multi-warehouse support
- Basic storage locations
- Inventory tracking
- Stock movements
- RMA + Click-and-Collect integration

**V5.0 (2027) - Full WMS:**
- AI-powered slotting (30-40% pick time reduction)
- Pick path optimization (35% faster)
- Demand-based positioning
- Warehouse robotics
- All 25 tables + 10 AI features

**Cost:** $197,000 | **Timeline:** 32 weeks | **ROI:** 580% Year 1

---

## 🏪 FEATURE 4: CLICK-AND-COLLECT

### **Overview**
Merchants with physical stores offer click-and-collect. Customers order online, pick up in store.

### **User Flow**

**Setup (Merchant):**
1. Enable click-and-collect for store
2. Configure as micro-fulfillment center
3. Add store inventory
4. Set pickup hours and capacity

**Order (Consumer):**
1. Selects "Pick up in store" at checkout
2. Chooses store location
3. Selects pickup time slot
4. Completes payment
5. Receives pickup code/QR

**Fulfillment (Merchant):**
1. Receives order
2. Picks from store inventory
3. Marks "Ready for pickup"
4. Consumer notified

**Pickup (Consumer):**
1. Arrives at store
2. Shows QR code/order number
3. Staff verifies → hands over order
4. Confirms receipt

### **Key Database Tables**

```sql
-- Pickup locations
CREATE TABLE click_and_collect_locations (
    location_id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(store_id),
    location_name VARCHAR(255),
    address TEXT,
    operating_hours JSONB, -- {mon: [{open: "09:00", close: "18:00"}]}
    max_orders_per_hour INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE
);

-- C&C orders
CREATE TABLE click_and_collect_orders (
    cc_order_id UUID PRIMARY KEY,
    order_id UUID REFERENCES orders(order_id) UNIQUE,
    location_id UUID REFERENCES click_and_collect_locations(location_id),
    pickup_time_slot_start TIMESTAMP,
    pickup_time_slot_end TIMESTAMP,
    pickup_code VARCHAR(20) UNIQUE, -- 6-digit code
    pickup_qr_code TEXT,
    status VARCHAR(50), -- pending, ready, picked_up, expired
    prepared_at TIMESTAMP,
    picked_up_at TIMESTAMP
);

-- Time slots
CREATE TABLE click_and_collect_time_slots (
    slot_id UUID PRIMARY KEY,
    location_id UUID REFERENCES click_and_collect_locations(location_id),
    slot_date DATE,
    slot_start_time TIME,
    slot_end_time TIME,
    max_capacity INTEGER,
    current_bookings INTEGER DEFAULT 0,
    available_capacity INTEGER GENERATED ALWAYS AS (max_capacity - current_bookings) STORED
);
```

### **Key APIs**
- `GET /api/click-and-collect/locations` - Find nearby locations
- `GET /api/click-and-collect/locations/:id/time-slots` - Available slots
- `POST /api/click-and-collect/orders` - Create C&C order
- `POST /api/merchant/click-and-collect/orders/:id/ready` - Mark ready
- `POST /api/merchant/click-and-collect/orders/:id/pickup` - Confirm pickup

---

## 💰 COST & TIMELINE SUMMARY

### **Development Costs**

| Feature | Tables | APIs | Components | Cost | Timeline |
|---------|--------|------|------------|------|----------|
| RMA | 3 | 8 | 10 | $18,000 | 4 weeks |
| TA (C2C Shipping) | 2 | 6 | 6 | $15,000 | 3 weeks |
| Click-and-Collect | 4 | 8 | 12 | $20,000 | 4 weeks |
| WMS Lite | 8 | 12 | 15 | $45,000 | 12 weeks |
| **V4.0 Total** | **17** | **34** | **43** | **$98,000** | **23 weeks** |

### **Full WMS (V5.0)**
- **Cost:** $197,000
- **Timeline:** 32 weeks
- **Tables:** 25
- **AI Features:** 10
- **ROI:** 580% Year 1

---

## 📋 IMPLEMENTATION ROADMAP

### **V4.0 (Q3-Q4 2026) - 23 weeks**

**Weeks 1-4: RMA System**
- Database tables
- Merchant approval workflow
- QR code generation for parcel shops
- Return tracking
- Refund processing

**Weeks 5-7: TA (C2C Shipping)**
- Consumer shipment creation
- Courier quote integration
- Payment processing
- Label generation
- Tracking

**Weeks 8-11: Click-and-Collect**
- Location management
- Time slot booking
- Pickup workflow
- Staff interface
- QR code pickup

**Weeks 12-23: WMS Lite**
- Multi-warehouse setup
- Storage locations
- Inventory tracking
- Stock movements
- RMA integration
- C&C integration

### **V5.0 (2027) - 32 weeks**
- Full WMS with all 25 tables
- 10 AI features
- Warehouse robotics
- Advanced optimization

---

## 🎯 SUCCESS METRICS

### **RMA**
- Return approval rate: >80%
- Average approval time: <24 hours
- Refund processing time: <48 hours
- QR code usage at parcel shops: >70%

### **TA (C2C Shipping)**
- Monthly shipments: 1,000+
- Average markup: 20-25%
- Customer satisfaction: >4.5/5
- Revenue: $20,000/month

### **Click-and-Collect**
- Adoption rate: 30% of orders
- Pickup completion rate: >95%
- Average preparation time: <2 hours
- Customer satisfaction: >4.7/5

### **WMS**
- Picking accuracy: 99.9%
- Space utilization: 85%+
- Orders per labor hour: 25+
- Inventory accuracy: 99.5%+

---

## ✅ NEXT STEPS

### **Immediate (Post-Launch)**
1. Review and approve this specification
2. Prioritize features (RMA → TA → C&C → WMS)
3. Create detailed technical specs for V4.0
4. Allocate development resources

### **Q1 2026**
1. Complete MVP launch (Dec 9, 2025)
2. Gather user feedback
3. Plan V4.0 development
4. Hire additional developers

### **Q2-Q4 2026**
1. Implement V4.0 features
2. Beta testing
3. Gradual rollout
4. User training

---

**Status:** 📋 SPECIFICATION COMPLETE  
**Next:** Get approval for V4.0 development  
**Priority:** POST-LAUNCH (after December 9, 2025)

---

**Created:** November 4, 2025  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.28  
**Version:** 1.0
