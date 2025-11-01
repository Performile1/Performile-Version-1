# 🚀 WEEK 3 IMPLEMENTATION SPEC

**Sprint:** Courier Integrations & API Platform  
**Date:** October 17, 2025  
**Framework:** Spec-Driven v1.17 (14 Hard Rules)  
**Status:** ✅ Database Validated - Ready to Implement  

---

## 🎯 SPRINT OBJECTIVES

### **Primary Goal:**
Build the foundation for courier integrations and external API access to enable shipping label generation in Week 4.

### **Strategic Vision:**
1. ✅ Week 3: Courier integrations (foundation)
2. 🔮 Week 4: Merchant tools (shipping labels using integrations)
3. 🔮 Future: Transport Administration System
4. 🔮 Future: Full TMS for small fleets & gig couriers

### **Success Criteria:**
- ✅ Merchants can connect courier API credentials
- ✅ System can make authenticated API calls to couriers
- ✅ Webhooks receive and process tracking updates
- ✅ API keys allow external access to Performile
- ✅ All API calls are logged and monitored
- ✅ Rate limiting prevents abuse
- ✅ Zero breaking changes to existing system

---

## 📊 DATABASE VALIDATION RESULTS

### **EXISTING TABLES (5):**

✅ **couriers** (22 columns)
- Has: api_endpoint, api_key_encrypted, tracking_url_template
- Status: 11 couriers, 0 with active integrations
- Ready for: Linking to courier_api_credentials

✅ **courier_api_credentials** (18 columns)
- Has: OAuth2 support (client_id, client_secret, access_token, refresh_token)
- Has: Rate limiting (rate_limit_per_minute)
- Has: Monitoring (total_requests, failed_requests)
- Ready for: Storing courier API credentials

✅ **ecommerce_integrations** (15 columns)
- Has: Webhook support, sync tracking
- Purpose: E-commerce platform connections (Shopify, WooCommerce)
- Ready for: Order import from e-commerce

✅ **shopintegrations** (15 columns)
- Same structure as ecommerce_integrations
- Purpose: TBD (likely duplicate or legacy)

✅ **tracking_api_logs** (12 columns)
- Has: Full request/response logging (JSONB)
- Has: Performance tracking (response_time_ms)
- Has: Error tracking (is_error, error_message)
- Ready for: Logging all courier API calls

### **TABLES TO CREATE (4):**

❌ **webhooks** - Incoming webhook management
❌ **api_keys** - Performile API access for merchants
❌ **integration_events** - Event tracking & audit trail
❌ **shipping_labels** - Label generation & storage (Week 4)

---

## 🏗️ ARCHITECTURE

### **Integration Flow:**

```
┌─────────────┐
│   Merchant  │
└──────┬──────┘
       │ 1. Configure Credentials
       ▼
┌─────────────────────────────┐
│  Performile Platform        │
│  ┌──────────────────────┐   │
│  │ Courier Integration  │   │
│  │ Management UI        │   │
│  └──────────┬───────────┘   │
│             │                │
│             ▼                │
│  ┌──────────────────────┐   │
│  │ courier_api_         │   │
│  │ credentials          │   │
│  └──────────┬───────────┘   │
│             │                │
│             ▼                │
│  ┌──────────────────────┐   │
│  │ Courier API Service  │   │
│  │ - Auth               │   │
│  │ - Rate Limiting      │   │
│  │ - Retry Logic        │   │
│  └──────────┬───────────┘   │
│             │                │
└─────────────┼────────────────┘
              │ 2. API Calls
              ▼
┌─────────────────────────────┐
│   Courier APIs              │
│   - DHL                     │
│   - FedEx                   │
│   - UPS                     │
│   - PostNord                │
│   - Bring                   │
└──────────┬──────────────────┘
           │ 3. Webhooks
           ▼
┌─────────────────────────────┐
│  Webhook Receiver           │
│  /api/webhooks/courier      │
└──────────┬──────────────────┘
           │ 4. Update Orders
           ▼
┌─────────────────────────────┐
│  Orders & Tracking          │
└─────────────────────────────┘
```

---

## 📋 DELIVERABLES

### **PHASE 1: DATABASE (Days 1-2)**

#### **1.1 Create webhooks table**
```sql
CREATE TABLE webhooks (
  webhook_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  shop_id UUID REFERENCES shops(shop_id),
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL, -- For signature verification
  event_types TEXT[] NOT NULL, -- ['order.created', 'tracking.updated', etc.]
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.2 Create api_keys table**
```sql
CREATE TABLE api_keys (
  api_key_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  shop_id UUID REFERENCES shops(shop_id),
  key_name VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL UNIQUE, -- Hashed
  api_key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for display
  permissions JSONB DEFAULT '{}', -- {'orders': ['read', 'write'], 'tracking': ['read']}
  rate_limit_per_hour INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  total_requests INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.3 Create integration_events table**
```sql
CREATE TABLE integration_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- 'courier.api.call', 'webhook.received', etc.
  entity_type VARCHAR(50), -- 'order', 'tracking', 'label'
  entity_id UUID,
  courier_name VARCHAR(255),
  integration_id UUID,
  event_data JSONB,
  status VARCHAR(50), -- 'success', 'failed', 'pending'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **1.4 Add indexes**
```sql
CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_shop_id ON webhooks(shop_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_shop_id ON api_keys(shop_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key);
CREATE INDEX idx_integration_events_type ON integration_events(event_type);
CREATE INDEX idx_integration_events_entity ON integration_events(entity_type, entity_id);
CREATE INDEX idx_integration_events_created ON integration_events(created_at);
```

---

### **PHASE 2: BACKEND APIs (Days 3-5)**

#### **2.1 Courier Credentials Management**

**POST /api/integrations/courier/credentials**
- Add courier API credentials
- Encrypt sensitive data
- Validate API connection
- Store in courier_api_credentials

**GET /api/integrations/courier/credentials**
- List all courier credentials for user
- Mask sensitive data
- Show connection status

**PUT /api/integrations/courier/credentials/:id**
- Update credentials
- Re-validate connection
- Update encryption

**DELETE /api/integrations/courier/credentials/:id**
- Remove credentials
- Archive logs
- Notify affected orders

**POST /api/integrations/courier/credentials/:id/test**
- Test API connection
- Validate credentials
- Return connection status

#### **2.2 Courier API Service Layer**

**File:** `api/services/courierApiService.ts`

```typescript
class CourierApiService {
  // Make authenticated API call to courier
  async makeApiCall(courierName, endpoint, method, data)
  
  // Get tracking info from courier
  async getTrackingInfo(courierName, trackingNumber)
  
  // Create shipment (for Week 4)
  async createShipment(courierName, shipmentData)
  
  // Cancel shipment
  async cancelShipment(courierName, shipmentId)
  
  // Handle OAuth2 token refresh
  async refreshAccessToken(credentialId)
  
  // Rate limiting check
  async checkRateLimit(courierName)
  
  // Log API call
  async logApiCall(callData)
}
```

#### **2.3 Webhook Management**

**POST /api/webhooks**
- Create webhook subscription
- Generate webhook secret
- Return webhook URL

**GET /api/webhooks**
- List all webhooks for user
- Show delivery stats

**PUT /api/webhooks/:id**
- Update webhook config
- Change event types
- Update URL

**DELETE /api/webhooks/:id**
- Remove webhook
- Archive delivery logs

**POST /api/webhooks/courier/:courier_name**
- Receive webhook from courier
- Verify signature
- Process event
- Update order/tracking
- Log event

#### **2.4 Performile API (for Merchants)**

**POST /api/external/auth/api-key**
- Generate API key for merchant
- Set permissions
- Set rate limits
- Return key (show once)

**GET /api/external/orders**
- List orders (with API key auth)
- Filter, pagination
- Respect permissions

**GET /api/external/orders/:id**
- Get order details
- Include tracking info

**POST /api/external/orders**
- Create order via API
- Validate data
- Check subscription limits

**GET /api/external/tracking/:tracking_number**
- Get tracking status
- Real-time from courier

---

### **PHASE 3: FRONTEND UI (Days 6-7)**

#### **3.1 Courier Integration Settings**

**Component:** `CourierIntegrationSettings.tsx`  
**Route:** `/settings/integrations/couriers`

**Features:**
- List all available couriers
- Add credentials form (API key, OAuth2)
- Test connection button
- Edit/delete credentials
- Connection status indicators
- API usage stats

#### **3.2 Webhook Management**

**Component:** `WebhookManagement.tsx`  
**Route:** `/settings/webhooks`

**Features:**
- Create webhook
- List webhooks with stats
- Edit webhook (URL, events)
- View delivery logs
- Test webhook
- Regenerate secret

#### **3.3 API Keys Management**

**Component:** `ApiKeysManagement.tsx`  
**Route:** `/settings/api-keys`

**Features:**
- Generate API key
- List API keys
- Set permissions
- Set rate limits
- View usage stats
- Revoke keys
- Show API documentation link

#### **3.4 Integration Dashboard**

**Component:** `IntegrationDashboard.tsx`  
**Route:** `/integrations`

**Features:**
- Overview of all integrations
- Connection status
- API call statistics
- Recent events
- Error logs
- Quick actions

---

### **PHASE 4: COURIER IMPLEMENTATIONS (Days 8-10)**

#### **4.1 DHL Integration**

**File:** `api/services/couriers/dhl.ts`

```typescript
class DHLService {
  async authenticate()
  async getTrackingInfo(trackingNumber)
  async createShipment(shipmentData) // Week 4
  async getLabel(shipmentId) // Week 4
  async cancelShipment(shipmentId)
}
```

#### **4.2 FedEx Integration**

**File:** `api/services/couriers/fedex.ts`

```typescript
class FedExService {
  async authenticate()
  async getTrackingInfo(trackingNumber)
  async createShipment(shipmentData) // Week 4
  async getLabel(shipmentId) // Week 4
  async cancelShipment(shipmentId)
}
```

#### **4.3 UPS Integration**

**File:** `api/services/couriers/ups.ts`

```typescript
class UPSService {
  async authenticate()
  async getTrackingInfo(trackingNumber)
  async createShipment(shipmentData) // Week 4
  async getLabel(shipmentId) // Week 4
  async cancelShipment(shipmentId)
}
```

#### **4.4 PostNord Integration**

**File:** `api/services/couriers/postnord.ts`

```typescript
class PostNordService {
  async authenticate()
  async getTrackingInfo(trackingNumber)
  async createShipment(shipmentData) // Week 4
  async getLabel(shipmentId) // Week 4
}
```

#### **4.5 Bring (Posten Norge) Integration**

**File:** `api/services/couriers/bring.ts`

```typescript
class BringService {
  async authenticate()
  async getTrackingInfo(trackingNumber)
  async createShipment(shipmentData) // Week 4
  async getLabel(shipmentId) // Week 4
}
```

---

## 🔒 SECURITY CONSIDERATIONS

### **1. API Credentials Encryption**
- Use `crypto` module for encryption
- Store encryption key in environment variable
- Never log decrypted credentials

### **2. Webhook Signature Verification**
- HMAC-SHA256 signature
- Verify on every webhook request
- Reject invalid signatures

### **3. API Key Security**
- Hash API keys before storage (bcrypt)
- Show full key only once on creation
- Store only prefix for display
- Implement key rotation

### **4. Rate Limiting**
- Per-courier rate limits
- Per-API-key rate limits
- Redis for distributed rate limiting
- Return 429 with Retry-After header

### **5. Input Validation**
- Validate all API inputs
- Sanitize webhook payloads
- Check subscription limits
- Verify permissions

---

## 📊 MONITORING & LOGGING

### **1. API Call Logging**
- Log to `tracking_api_logs` table
- Include: request, response, timing, errors
- Retention: 30 days

### **2. Integration Events**
- Log to `integration_events` table
- Track: API calls, webhooks, errors
- Retention: 90 days

### **3. Metrics to Track**
- API success rate per courier
- Average response time
- Failed requests count
- Webhook delivery rate
- API key usage

### **4. Alerts**
- Failed API calls > 10% in 5 minutes
- Webhook delivery failures > 5 consecutive
- Rate limit exceeded
- Credential expiration (7 days before)

---

## 🧪 TESTING STRATEGY

### **1. Unit Tests**
- Courier service classes
- Encryption/decryption
- Signature verification
- Rate limiting logic

### **2. Integration Tests**
- API endpoints
- Database operations
- Webhook processing
- API key authentication

### **3. Manual Testing**
- Test with courier sandbox APIs
- Webhook delivery testing
- API key generation & usage
- UI workflows

---

## 📚 DOCUMENTATION

### **1. API Documentation**
- Create OpenAPI/Swagger spec
- Document all external API endpoints
- Include authentication examples
- Add rate limit info

### **2. Integration Guides**
- How to connect each courier
- Webhook setup instructions
- API key usage guide
- Troubleshooting common issues

### **3. Developer Docs**
- Courier service architecture
- Adding new courier integrations
- Webhook event types
- API key permissions

---

## 🎯 SUCCESS METRICS

### **Week 3 Goals:**
- ✅ 5 courier integrations implemented
- ✅ Webhook system operational
- ✅ API key system working
- ✅ 100% API call logging
- ✅ Rate limiting active
- ✅ Zero breaking changes

### **Performance Targets:**
- API response time < 2 seconds
- Webhook processing < 500ms
- 99% API success rate
- 100% webhook delivery (with retries)

---

## 🔄 FRAMEWORK COMPLIANCE

### **All 14 Rules Followed:**

1. ✅ **Database Validation First** - Validated existing tables
2. ✅ **Only ADD, Never Change** - Creating new tables only
3. ✅ **Conform to Existing** - Following established patterns
4. ✅ **Supabase Compatible** - RLS policies will be added
5. ✅ **Vercel Compatible** - Serverless functions
6. ✅ **Use Existing APIs** - Leveraging tracking_api_logs
7. ✅ **Test Queries First** - Validation scripts run
8. ✅ **Document Schema** - All tables documented
9. ✅ **Error Handling** - Comprehensive error handling
10. ✅ **Loading States** - All UI components
11. ✅ **Smart UI Organization** - Tabs for integrations
12. ✅ **Role-Based Access** - Admin/Merchant access
13. ✅ **Subscription Limits** - API call limits
14. ✅ **Package.json Validation** - Check dependencies

---

## 📅 TIMELINE

### **Day 1-2: Database**
- Create 3 new tables
- Add indexes
- Run validation
- Apply RLS policies

### **Day 3-5: Backend**
- Courier credentials APIs
- Courier API service layer
- Webhook receiver
- API key management
- Rate limiting

### **Day 6-7: Frontend**
- Courier integration settings
- Webhook management
- API keys management
- Integration dashboard

### **Day 8-10: Courier Implementations**
- DHL integration
- FedEx integration
- UPS integration
- PostNord integration
- Bring integration

---

## 🚀 WEEK 4 PREPARATION

**What Week 3 Enables:**
- ✅ Authenticated courier API access
- ✅ Credential management
- ✅ API call infrastructure
- ✅ Webhook tracking updates

**Week 4 Will Add:**
- Shipping label generation
- Label printing
- Bulk label creation
- Label templates
- Address validation

---

## ✅ APPROVAL CHECKLIST

**Before Implementation:**
- ✅ Database validated
- ✅ Spec reviewed
- ✅ Framework compliance verified
- ✅ Security reviewed
- ✅ Timeline agreed
- ⏳ User approval

---

**STATUS:** ✅ READY FOR IMPLEMENTATION  
**NEXT:** User approval to begin Week 3  
**Framework:** v1.17 (14 Rules)  
**Estimated Duration:** 10 days  

---

*Generated by Spec-Driven Development Framework v1.17*  
*Performile Platform - Courier Integrations Sprint*  
*October 17, 2025*
