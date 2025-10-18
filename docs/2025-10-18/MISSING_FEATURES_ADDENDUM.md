# 📋 MISSING FEATURES ADDENDUM V1.18

**Date:** October 18, 2025, 8:25 PM UTC+2  
**Purpose:** Document ALL discussed features not yet in master document  
**Status:** To be integrated into V1.19

---

## 🚨 FEATURES DISCUSSED BUT NOT DOCUMENTED

### 1. **TMS (Transport Management System)** ❌ 0%

**Description:** Full transport management capabilities for couriers

**Features:**
- Fleet management (vehicles, drivers)
- Route optimization
- Load planning
- Delivery scheduling
- Driver assignment
- Vehicle tracking
- Fuel management
- Maintenance scheduling

**Database Tables Needed:**
```sql
vehicles (15 columns)
- vehicle_id, courier_id, vehicle_type, license_plate
- capacity_kg, capacity_m3, fuel_type
- current_location, is_active, last_maintenance
- driver_id, status

drivers (12 columns)
- driver_id, courier_id, user_id, license_number
- license_expiry, vehicle_id, is_active
- current_location, status

routes (10 columns)
- route_id, courier_id, driver_id, vehicle_id
- start_location, end_location, waypoints (JSONB)
- estimated_duration, actual_duration, status

route_stops (8 columns)
- stop_id, route_id, order_id, sequence
- arrival_time, departure_time, status, notes
```

**API Endpoints:**
```
GET    /api/tms/vehicles
POST   /api/tms/vehicles
PUT    /api/tms/vehicles/:id
DELETE /api/tms/vehicles/:id

GET    /api/tms/drivers
POST   /api/tms/drivers
PUT    /api/tms/drivers/:id

GET    /api/tms/routes
POST   /api/tms/routes
PUT    /api/tms/routes/:id
POST   /api/tms/routes/:id/optimize

GET    /api/tms/fleet/status
GET    /api/tms/fleet/location
```

**Priority:** MEDIUM  
**Estimated Effort:** 2-3 weeks  
**Dependencies:** Courier API integration

---

### 2. **Subscription Visibility in Views** ⚠️ 50%

**Current Status:** Backend exists, frontend missing

**Missing Components:**
- Subscription status badge in header
- Usage meter (orders used / limit)
- Upgrade prompts when limits reached
- Billing history page
- Invoice download
- Payment method management UI

**Frontend Pages Needed:**
```
/settings/subscription - Subscription management
/settings/billing - Billing history
/settings/payment-methods - Payment methods
/upgrade - Upgrade flow
```

**Components Needed:**
```typescript
<SubscriptionBadge />
<UsageMeter />
<UpgradePrompt />
<BillingHistory />
<InvoiceList />
<PaymentMethodCard />
```

**Priority:** HIGH  
**Estimated Effort:** 1 week

---

### 3. **Playwright Testing Plan** ⚠️ 30%

**Current Status:** Plan exists, implementation partial

**Completed:**
- ✅ Testing plan document created
- ✅ Test utilities designed
- ✅ Console/Network/API loggers specified

**Missing:**
- ❌ Actual test files implementation
- ❌ CI/CD integration
- ❌ Test data fixtures
- ❌ Test reports generation
- ❌ Automated test runs

**Files to Create:**
```
e2e-tests/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── register.spec.ts
│   ├── admin/
│   │   ├── dashboard.spec.ts
│   │   ├── users.spec.ts
│   │   └── couriers.spec.ts
│   ├── merchant/
│   │   ├── dashboard.spec.ts
│   │   ├── orders.spec.ts
│   │   └── settings.spec.ts
│   ├── courier/
│   │   ├── dashboard.spec.ts
│   │   └── deliveries.spec.ts
│   └── consumer/
│       ├── tracking.spec.ts
│       └── reviews.spec.ts
├── utils/
│   ├── console-logger.ts
│   ├── network-logger.ts
│   └── api-logger.ts
└── fixtures/
    └── test-data.ts
```

**Priority:** HIGH  
**Estimated Effort:** 1-2 weeks

---

### 4. **E-commerce Plugins (Full Features)** ❌ 0%

**Description:** Complete plugins for major e-commerce platforms

**Platforms:**
- Shopify
- WooCommerce
- Magento
- PrestaShop
- BigCommerce
- Wix
- Squarespace

**Features per Plugin:**
- Automatic order sync
- Real-time tracking updates
- Courier selection
- Label generation
- Return creation
- Claims filing
- Analytics integration
- Webhook support

**Database Tables:**
```sql
ecommerce_plugins (12 columns)
- plugin_id, platform_name, version
- store_id, api_key, api_secret
- webhook_url, is_active, last_sync
- settings (JSONB), created_at, updated_at

plugin_sync_logs (10 columns)
- log_id, plugin_id, sync_type
- status, records_synced, errors
- started_at, completed_at, metadata (JSONB)
```

**API Endpoints:**
```
GET    /api/plugins
POST   /api/plugins/install
PUT    /api/plugins/:id/configure
DELETE /api/plugins/:id/uninstall
POST   /api/plugins/:id/sync
GET    /api/plugins/:id/logs
```

**Priority:** MEDIUM  
**Estimated Effort:** 4-6 weeks (all platforms)

---

### 5. **iFrame Embeddable Widgets** ❌ 0%

**Description:** Embeddable widgets for merchant websites

**Widgets:**

#### 5.1 Checkout Widget
```html
<iframe src="https://performile.com/embed/checkout?store_id=XXX" />
```

**Features:**
- Shipping method selection
- Courier selection
- Delivery date picker
- Address validation
- Cost calculation
- Embedded in merchant checkout

#### 5.2 Tracking Widget
```html
<iframe src="https://performile.com/embed/track?order_id=XXX" />
```

**Features:**
- Real-time tracking
- Status timeline
- Estimated delivery
- Courier contact
- Delivery proof

#### 5.3 Claims Widget
```html
<iframe src="https://performile.com/embed/claims?order_id=XXX" />
```

**Features:**
- File claim
- Upload evidence
- Track claim status
- View resolution

**Implementation:**
```
apps/web/src/pages/embed/
├── Checkout.tsx
├── Tracking.tsx
├── Claims.tsx
└── Returns.tsx
```

**API Endpoints:**
```
GET /api/embed/checkout/:store_id
GET /api/embed/track/:order_id
GET /api/embed/claims/:order_id
GET /api/embed/returns/:order_id
```

**Priority:** HIGH  
**Estimated Effort:** 2-3 weeks

---

### 6. **Returns Management System (RMA)** ❌ 0%

**Description:** Complete returns and refunds management

**Features:**
- Create return request
- Return reasons (defective, wrong item, changed mind)
- Return labels generation
- Return tracking
- Refund processing
- Return analytics

**Database Tables:**
```sql
returns (18 columns)
- return_id, order_id, store_id, courier_id
- return_number, return_reason, return_type
- status (requested, approved, in_transit, received, refunded)
- customer_email, customer_name
- return_address, pickup_address
- refund_amount, refund_method, refunded_at
- return_label_url, tracking_number
- notes, created_at, updated_at

return_items (8 columns)
- item_id, return_id, product_name, quantity
- reason, condition, refund_amount, notes

return_history (7 columns)
- history_id, return_id, user_id
- action, old_value, new_value, created_at
```

**API Endpoints:**
```
GET    /api/returns
GET    /api/returns/:id
POST   /api/returns
PUT    /api/returns/:id
DELETE /api/returns/:id
POST   /api/returns/:id/approve
POST   /api/returns/:id/reject
POST   /api/returns/:id/generate-label
POST   /api/returns/:id/refund
GET    /api/returns/:id/history
```

**Frontend Pages:**
```
/returns - Returns list
/returns/:id - Return details
/returns/create - Create return
/orders/:id/return - Create return from order
```

**Components:**
```typescript
<ReturnsList />
<ReturnDetails />
<ReturnForm />
<ReturnStatusBadge />
<ReturnTimeline />
<ReturnLabel />
```

**iFrame Version:**
```html
<iframe src="https://performile.com/embed/returns/create?order_id=XXX" />
```

**Priority:** HIGH  
**Estimated Effort:** 2-3 weeks

---

### 7. **Open API for Claims** ❌ 0%

**Description:** Public API for reading claims data

**Use Cases:**
- External systems read claim status
- Third-party integrations
- Analytics platforms
- Reporting tools

**API Endpoints:**
```
# Public API (with API key)
GET /api/v1/public/claims
GET /api/v1/public/claims/:id
GET /api/v1/public/claims/by-order/:order_id
GET /api/v1/public/claims/stats

# Webhook notifications
POST /api/v1/webhooks/claims/created
POST /api/v1/webhooks/claims/updated
POST /api/v1/webhooks/claims/resolved
```

**Authentication:**
- API key in header: `X-API-Key: pk_live_xxxxx`
- Rate limiting: 1000 requests/hour
- Scoped permissions

**Response Format:**
```json
{
  "claim_id": "claim_123",
  "order_id": "order_456",
  "status": "approved",
  "claim_type": "damaged",
  "claim_amount": 150.00,
  "approved_amount": 120.00,
  "created_at": "2025-10-18T10:00:00Z",
  "resolved_at": "2025-10-19T15:30:00Z"
}
```

**Priority:** MEDIUM  
**Estimated Effort:** 1 week

---

### 8. **Courier API Integration (Full)** ⚠️ 40%

**Description:** Complete API integration with courier services

**Current Status:**
- ✅ Credentials management
- ✅ API service layer
- ✅ Rate limiting
- ⚠️ Tracking API (partial)
- ❌ Shipment creation
- ❌ Label generation
- ❌ Returns booking

**Missing Features:**

#### 8.1 Tracking API
```typescript
GET /api/courier/:courier_name/track/:tracking_number
```

**Response:**
```json
{
  "tracking_number": "1Z999AA10123456784",
  "status": "in_transit",
  "location": "Stockholm Distribution Center",
  "estimated_delivery": "2025-10-20",
  "events": [
    {
      "timestamp": "2025-10-18T10:00:00Z",
      "status": "picked_up",
      "location": "Sender Address"
    }
  ]
}
```

#### 8.2 Create Shipment
```typescript
POST /api/courier/:courier_name/shipments
```

**Request:**
```json
{
  "sender": {
    "name": "Store Name",
    "address": "123 Main St",
    "postal_code": "12345",
    "city": "Stockholm"
  },
  "recipient": {
    "name": "John Doe",
    "address": "456 Oak Ave",
    "postal_code": "67890",
    "city": "Gothenburg"
  },
  "package": {
    "weight": 2.5,
    "dimensions": "30x20x10",
    "value": 150.00
  },
  "service_type": "express"
}
```

**Response:**
```json
{
  "shipment_id": "ship_123",
  "tracking_number": "1Z999AA10123456784",
  "label_url": "https://...",
  "cost": 45.00
}
```

#### 8.3 Generate Label
```typescript
POST /api/courier/:courier_name/labels
GET  /api/courier/:courier_name/labels/:shipment_id
```

#### 8.4 Book Return
```typescript
POST /api/courier/:courier_name/returns
```

**Request:**
```json
{
  "original_tracking_number": "1Z999AA10123456784",
  "return_reason": "defective",
  "pickup_address": {
    "name": "John Doe",
    "address": "456 Oak Ave",
    "postal_code": "67890",
    "city": "Gothenburg"
  },
  "return_address": {
    "name": "Store Name",
    "address": "123 Main St",
    "postal_code": "12345",
    "city": "Stockholm"
  }
}
```

**Response:**
```json
{
  "return_id": "ret_123",
  "return_tracking_number": "1Z999AA10987654321",
  "return_label_url": "https://...",
  "pickup_date": "2025-10-20"
}
```

**Priority:** HIGH  
**Estimated Effort:** 3-4 weeks

---

## 📊 SUMMARY OF MISSING FEATURES

| Feature | Status | Priority | Effort | Completion |
|---------|--------|----------|--------|------------|
| **TMS (Transport Management)** | ❌ Not Started | MEDIUM | 2-3 weeks | 0% |
| **Subscription UI Visibility** | ⚠️ Partial | HIGH | 1 week | 50% |
| **Playwright Testing** | ⚠️ Partial | HIGH | 1-2 weeks | 30% |
| **E-commerce Plugins** | ❌ Not Started | MEDIUM | 4-6 weeks | 0% |
| **iFrame Widgets** | ❌ Not Started | HIGH | 2-3 weeks | 0% |
| **Returns Management (RMA)** | ❌ Not Started | HIGH | 2-3 weeks | 0% |
| **Open API for Claims** | ❌ Not Started | MEDIUM | 1 week | 0% |
| **Courier API (Full)** | ⚠️ Partial | HIGH | 3-4 weeks | 40% |

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 2A: High Priority (Next 4 weeks)
1. **Subscription UI Visibility** (1 week) - Complete existing feature
2. **iFrame Widgets** (2-3 weeks) - High business value
3. **Returns Management** (2-3 weeks) - Critical for e-commerce
4. **Playwright Testing** (1-2 weeks) - Quality assurance

### Phase 2B: Medium Priority (Weeks 5-8)
5. **Courier API (Full)** (3-4 weeks) - Complete integration
6. **Open API for Claims** (1 week) - Enable integrations
7. **E-commerce Plugins** (4-6 weeks) - Start with Shopify

### Phase 3: Future (Weeks 9+)
8. **TMS** (2-3 weeks) - Advanced courier features

---

## 📝 ACTION ITEMS

### Immediate (This Week)
- [ ] Update PERFORMILE_MASTER_V1.19.md with all missing features
- [ ] Create detailed specs for each missing feature
- [ ] Prioritize based on business value
- [ ] Allocate resources and timeline

### Next Week
- [ ] Start Subscription UI implementation
- [ ] Design iFrame widget architecture
- [ ] Plan Returns Management database schema
- [ ] Begin Playwright test implementation

---

**Last Updated:** October 18, 2025, 8:25 PM UTC+2  
**To be integrated into:** PERFORMILE_MASTER_V1.19.md  
**Total Missing Features:** 8  
**Estimated Total Effort:** 15-20 weeks
