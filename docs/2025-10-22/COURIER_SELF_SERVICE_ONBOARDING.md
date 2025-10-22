# 🚚 COURIER SELF-SERVICE ONBOARDING SYSTEM

**Date:** October 22, 2025  
**Purpose:** Enable couriers to integrate themselves with Performile platform  
**Status:** 📋 DESIGN PHASE

---

## 🎯 OBJECTIVE

**Make it easy for ANY courier to integrate with Performile without our manual intervention.**

### **Benefits:**
- ✅ Faster courier onboarding
- ✅ Reduced manual work
- ✅ Scalable to 100+ couriers
- ✅ Couriers control their own integration
- ✅ Automatic API testing & validation
- ✅ Self-service documentation

---

## 📋 ONBOARDING FLOW

### **Step 1: Courier Registration** (5 minutes)

**Page:** `/courier/register`

**Form Fields:**
```typescript
{
  // Company Information
  companyName: string;
  courierCode: string; // Unique identifier (e.g., "POSTNORD", "BRING")
  website: string;
  description: string;
  logo: File; // Upload logo
  
  // Contact Information
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  supportEmail: string;
  supportPhone: string;
  
  // Service Coverage
  countries: string[]; // Multi-select: SE, NO, DK, FI, etc.
  serviceTypes: string[]; // Home, Parcel Shop, Locker, Express
  
  // Business Details
  companyRegistrationNumber: string;
  vatNumber: string;
  businessAddress: Address;
}
```

**Validation:**
- ✅ Email verification required
- ✅ Unique courier code
- ✅ Valid company registration number
- ✅ Logo size < 2MB

---

### **Step 2: API Configuration** (10 minutes)

**Page:** `/courier/onboarding/api-setup`

**API Integration Options:**

#### **Option A: Standard REST API** (Recommended)
```typescript
{
  // Base Configuration
  baseUrl: string; // e.g., https://api.yourcourier.com
  apiVersion: string; // e.g., v1, v2
  
  // Authentication
  authType: 'api_key' | 'oauth2' | 'basic_auth' | 'bearer_token';
  
  // If API Key
  apiKeyHeader: string; // e.g., "X-API-Key"
  apiKeyValue: string; // Encrypted
  
  // If OAuth2
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes: string[];
  
  // Rate Limits
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}
```

#### **Option B: Webhook Integration**
```typescript
{
  // Webhook Configuration
  webhookUrl: string; // Your webhook endpoint
  webhookSecret: string; // For signature verification
  events: string[]; // Which events to send
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // seconds
  };
}
```

#### **Option C: Manual Integration** (For legacy systems)
- Email-based order notifications
- Manual tracking updates
- CSV file uploads

---

### **Step 3: API Endpoint Mapping** (15 minutes)

**Page:** `/courier/onboarding/endpoints`

**Required Endpoints:**

#### **1. Tracking API** 🔴 REQUIRED
```typescript
{
  endpoint: string; // e.g., /tracking/{trackingNumber}
  method: 'GET' | 'POST';
  requestFormat: {
    trackingNumberParam: string; // e.g., "tracking_number", "id"
    additionalParams?: Record<string, string>;
  };
  responseFormat: {
    trackingNumberField: string; // e.g., "shipmentId"
    statusField: string; // e.g., "status"
    eventsField: string; // e.g., "events"
    deliveryDateField: string; // e.g., "estimatedDelivery"
  };
  statusMapping: Record<string, PerformileStatus>; // Map your statuses to ours
  testTrackingNumber: string; // For validation
}
```

**Status Mapping:**
```typescript
enum PerformileStatus {
  CREATED = 'created',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled'
}

// Example mapping:
{
  "PACKAGE_RECEIVED": "created",
  "IN_TRANSIT": "in_transit",
  "AT_DELIVERY_DEPOT": "out_for_delivery",
  "DELIVERED": "delivered",
  "DELIVERY_FAILED": "failed"
}
```

#### **2. Booking API** 🟡 OPTIONAL
```typescript
{
  endpoint: string; // e.g., /shipments
  method: 'POST';
  requestFormat: {
    senderFields: string[];
    receiverFields: string[];
    parcelFields: string[];
    serviceFields: string[];
  };
  responseFormat: {
    shipmentIdField: string;
    trackingNumberField: string;
    labelUrlField: string;
  };
}
```

#### **3. Rate/Quote API** 🟡 OPTIONAL
```typescript
{
  endpoint: string; // e.g., /rates
  method: 'GET' | 'POST';
  requestFormat: {
    originFields: string[];
    destinationFields: string[];
    parcelFields: string[];
  };
  responseFormat: {
    priceField: string;
    currencyField: string;
    deliveryTimeField: string;
    serviceNameField: string;
  };
}
```

#### **4. Label API** 🟡 OPTIONAL
```typescript
{
  endpoint: string; // e.g., /labels/{shipmentId}
  method: 'GET';
  responseFormat: {
    labelUrlField: string;
    labelFormat: 'PDF' | 'ZPL' | 'PNG';
  };
}
```

#### **5. Service Points API** 🟡 OPTIONAL
```typescript
{
  endpoint: string; // e.g., /service-points
  method: 'GET';
  requestFormat: {
    postalCodeParam: string;
    countryParam: string;
    radiusParam?: string;
  };
  responseFormat: {
    idField: string;
    nameField: string;
    addressField: string;
    coordinatesField: string;
    openingHoursField: string;
  };
}
```

---

### **Step 4: API Testing & Validation** (5 minutes)

**Page:** `/courier/onboarding/testing`

**Automatic Tests:**

#### **Test 1: Authentication** ✅
```typescript
// Test API credentials
const testAuth = async () => {
  try {
    const response = await fetch(baseUrl + '/test', {
      headers: authHeaders
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};
```

#### **Test 2: Tracking API** ✅
```typescript
// Test with provided test tracking number
const testTracking = async (testNumber: string) => {
  const response = await callTrackingAPI(testNumber);
  
  // Validate response structure
  const hasRequiredFields = 
    response[trackingNumberField] &&
    response[statusField] &&
    response[eventsField];
    
  return {
    success: hasRequiredFields,
    sampleResponse: response
  };
};
```

#### **Test 3: Status Mapping** ✅
```typescript
// Verify all your statuses are mapped
const testStatusMapping = () => {
  const unmappedStatuses = yourStatuses.filter(
    status => !statusMapping[status]
  );
  
  return {
    success: unmappedStatuses.length === 0,
    unmappedStatuses
  };
};
```

#### **Test 4: Rate Limits** ✅
```typescript
// Test rate limiting
const testRateLimits = async () => {
  const requests = Array(10).fill(null).map(() => 
    callTrackingAPI(testNumber)
  );
  
  const results = await Promise.allSettled(requests);
  const failures = results.filter(r => r.status === 'rejected');
  
  return {
    success: failures.length === 0,
    successRate: (results.length - failures.length) / results.length
  };
};
```

**Test Results Display:**
```
✅ Authentication: PASSED
✅ Tracking API: PASSED
✅ Status Mapping: PASSED
⚠️ Rate Limits: WARNING (2/10 requests failed)
❌ Booking API: FAILED (Invalid response format)

Overall: 3/5 tests passed
Status: READY FOR REVIEW (with warnings)
```

---

### **Step 5: Service Configuration** (10 minutes)

**Page:** `/courier/onboarding/services`

**Define Your Services:**

```typescript
interface CourierService {
  serviceId: string;
  serviceName: string;
  serviceType: 'home' | 'parcel_shop' | 'locker' | 'express';
  description: string;
  
  // Pricing
  basePrice: number;
  currency: string;
  pricePerKg?: number;
  pricePerKm?: number;
  
  // Capabilities
  maxWeight: number; // kg
  maxDimensions: {
    length: number; // cm
    width: number;
    height: number;
  };
  
  // Delivery
  estimatedDeliveryDays: number;
  deliveryWindows?: string[]; // e.g., ["09:00-12:00", "12:00-17:00"]
  
  // Features
  features: {
    tracking: boolean;
    insurance: boolean;
    signatureRequired: boolean;
    cashOnDelivery: boolean;
    saturdayDelivery: boolean;
    sundayDelivery: boolean;
  };
  
  // Coverage
  availableCountries: string[];
  excludedPostalCodes?: string[];
}
```

**Example Service:**
```json
{
  "serviceId": "HOME_STANDARD",
  "serviceName": "Home Delivery Standard",
  "serviceType": "home",
  "description": "Standard home delivery within 2-3 business days",
  "basePrice": 49.00,
  "currency": "SEK",
  "pricePerKg": 5.00,
  "maxWeight": 35,
  "maxDimensions": {
    "length": 120,
    "width": 60,
    "height": 60
  },
  "estimatedDeliveryDays": 2,
  "features": {
    "tracking": true,
    "insurance": true,
    "signatureRequired": false,
    "cashOnDelivery": false,
    "saturdayDelivery": false,
    "sundayDelivery": false
  },
  "availableCountries": ["SE", "NO", "DK", "FI"]
}
```

---

### **Step 6: Documentation Upload** (5 minutes)

**Page:** `/courier/onboarding/documentation`

**Upload Documents:**
- [ ] API Documentation (PDF/Markdown)
- [ ] Integration Guide
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] SLA Agreement
- [ ] Insurance Policy
- [ ] Pricing Sheet

**Optional:**
- [ ] Postman Collection
- [ ] OpenAPI/Swagger Spec
- [ ] Code Examples (Node.js, Python, PHP)

---

### **Step 7: Review & Approval** (1-2 business days)

**Page:** `/courier/onboarding/review`

**Performile Team Reviews:**
1. ✅ API integration works correctly
2. ✅ Test tracking numbers return valid data
3. ✅ Status mapping is complete
4. ✅ Services are properly configured
5. ✅ Documentation is complete
6. ✅ Legal documents are valid
7. ✅ Company verification passed

**Approval Process:**
- **Auto-Approved:** If all automated tests pass (90%+ success rate)
- **Manual Review:** If tests have warnings or failures
- **Rejected:** If critical issues found (with feedback)

**Timeline:**
- Auto-approved: Instant
- Manual review: 1-2 business days
- Rejected: Resubmit after fixes

---

### **Step 8: Go Live!** 🚀

**Page:** `/courier/dashboard`

**Courier Dashboard Features:**

#### **1. Integration Status**
```
✅ API Connected
✅ Tracking Active
✅ 1,234 shipments tracked
✅ 98.5% uptime
```

#### **2. Performance Metrics**
- Total shipments
- On-time delivery rate
- Average delivery time
- Customer satisfaction score
- TrustScore ranking

#### **3. API Usage**
- Requests today: 1,234 / 10,000
- Requests this month: 45,678 / 500,000
- Error rate: 0.5%
- Average response time: 245ms

#### **4. Settings**
- Update API credentials
- Modify service offerings
- Update pricing
- Configure webhooks
- Manage team access

#### **5. Analytics**
- Shipment trends
- Geographic distribution
- Service type breakdown
- Revenue tracking
- Customer feedback

---

## 🎨 UI/UX DESIGN

### **Onboarding Progress Bar:**
```
[1. Register] → [2. API Setup] → [3. Endpoints] → [4. Testing] → [5. Services] → [6. Docs] → [7. Review] → [8. Live!]
    ✅            ✅               ✅              🔄             ⏳            ⏳          ⏳           ⏳
```

### **Step-by-Step Wizard:**
- Clean, modern interface
- Progress saved automatically
- Can pause and resume anytime
- Helpful tooltips and examples
- Live validation feedback
- Test buttons for each API

### **Documentation Helper:**
```
❓ Need help?
- 📚 View integration guide
- 💬 Chat with support
- 📧 Email: courier-support@performile.com
- 📞 Call: +46 (0)8 123 4567
```

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Database Schema:**

```sql
-- Courier Onboarding Table
CREATE TABLE courier_onboarding (
  onboarding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Progress
  current_step INTEGER DEFAULT 1,
  completed_steps INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, pending_review, approved, rejected
  
  -- API Configuration
  api_config JSONB, -- Stores all API settings
  endpoint_mapping JSONB, -- Stores endpoint configurations
  status_mapping JSONB, -- Stores status mappings
  
  -- Test Results
  test_results JSONB, -- Stores automated test results
  test_passed BOOLEAN DEFAULT false,
  
  -- Services
  services JSONB[], -- Array of service configurations
  
  -- Documentation
  documents JSONB, -- URLs to uploaded documents
  
  -- Review
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  approved_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courier API Credentials (Encrypted)
CREATE TABLE courier_api_credentials (
  credential_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Authentication
  auth_type VARCHAR(50), -- api_key, oauth2, basic_auth, bearer_token
  api_key_encrypted TEXT, -- Encrypted with AES-256
  client_id_encrypted TEXT,
  client_secret_encrypted TEXT,
  token_url TEXT,
  
  -- Configuration
  base_url TEXT NOT NULL,
  api_version VARCHAR(20),
  rate_limit_per_minute INTEGER,
  rate_limit_per_hour INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP,
  test_status VARCHAR(50), -- passed, failed, warning
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courier Services
CREATE TABLE courier_services (
  service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Service Details
  service_code VARCHAR(50) NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(50), -- home, parcel_shop, locker, express
  description TEXT,
  
  -- Pricing
  base_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'SEK',
  price_per_kg DECIMAL(10, 2),
  price_per_km DECIMAL(10, 2),
  
  -- Capabilities
  max_weight_kg DECIMAL(10, 2),
  max_length_cm INTEGER,
  max_width_cm INTEGER,
  max_height_cm INTEGER,
  
  -- Delivery
  estimated_delivery_days INTEGER,
  delivery_windows JSONB,
  
  -- Features
  features JSONB,
  
  -- Coverage
  available_countries VARCHAR(2)[],
  excluded_postal_codes TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(courier_id, service_code)
);

-- API Test Results
CREATE TABLE courier_api_tests (
  test_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Test Details
  test_type VARCHAR(50), -- auth, tracking, booking, rate_limit
  test_status VARCHAR(50), -- passed, failed, warning
  
  -- Results
  request_sent JSONB,
  response_received JSONB,
  error_message TEXT,
  response_time_ms INTEGER,
  
  -- Metrics
  success_rate DECIMAL(5, 2), -- For rate limit tests
  
  tested_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 ADMIN DASHBOARD

### **Courier Management:**

**Page:** `/admin/couriers`

**Features:**
- List all couriers (active, pending, rejected)
- Filter by status, country, service type
- Quick approve/reject buttons
- View integration details
- Test API connections
- Monitor performance
- Manage team access

**Courier Card:**
```
┌─────────────────────────────────────────┐
│ 🚚 YourCourier AB                       │
│ Status: ⏳ Pending Review               │
│ Progress: 6/8 steps complete            │
│                                         │
│ ✅ API Connected                        │
│ ✅ Tests: 4/5 passed                    │
│ ⚠️ Warning: Rate limit test failed     │
│                                         │
│ Countries: SE, NO, DK, FI               │
│ Services: 3 configured                  │
│                                         │
│ [View Details] [Approve] [Reject]      │
└─────────────────────────────────────────┘
```

---

## 🔐 SECURITY

### **API Credential Storage:**
- ✅ AES-256 encryption at rest
- ✅ Encrypted in transit (HTTPS only)
- ✅ Separate encryption keys per environment
- ✅ Key rotation every 90 days
- ✅ Access logging

### **Webhook Security:**
- ✅ HMAC signature verification
- ✅ IP whitelist
- ✅ Rate limiting
- ✅ Replay attack prevention
- ✅ TLS 1.3 required

### **Access Control:**
- ✅ Role-based permissions
- ✅ Multi-factor authentication
- ✅ API key rotation
- ✅ Audit logging
- ✅ Session management

---

## 📈 SUCCESS METRICS

### **Onboarding KPIs:**
- Time to complete onboarding: < 1 hour
- Auto-approval rate: > 80%
- Test pass rate: > 95%
- Courier satisfaction: > 4.5/5 stars
- Support tickets per onboarding: < 2

### **Integration Quality:**
- API uptime: > 99.5%
- Average response time: < 500ms
- Error rate: < 1%
- Tracking accuracy: > 98%

---

## 🚀 ROLLOUT PLAN

### **Phase 1: MVP** (Week 1-2)
- [ ] Basic registration form
- [ ] API configuration
- [ ] Tracking API integration
- [ ] Manual approval process

### **Phase 2: Automation** (Week 3-4)
- [ ] Automated testing
- [ ] Auto-approval for passing tests
- [ ] Webhook integration
- [ ] Courier dashboard

### **Phase 3: Advanced** (Week 5-6)
- [ ] Booking API integration
- [ ] Service configuration
- [ ] Rate/quote API
- [ ] Service points API

### **Phase 4: Scale** (Week 7-8)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] API marketplace
- [ ] Partner program

---

## 💡 BENEFITS FOR COURIERS

### **Why Join Performile?**

**1. Increased Visibility** 📈
- Listed in courier directory
- Shown in merchant checkouts
- Featured in TrustScore rankings
- Marketing exposure

**2. More Business** 💰
- Access to merchant network
- Automatic order routing
- Volume discounts
- Revenue sharing

**3. Better Tools** 🛠️
- Real-time tracking dashboard
- Performance analytics
- Customer feedback
- API monitoring

**4. Easy Integration** ⚡
- Self-service onboarding
- Automated testing
- Clear documentation
- Technical support

**5. Fair Competition** ⚖️
- TrustScore-based ranking
- Performance-based visibility
- Transparent pricing
- Customer reviews

---

## 📞 SUPPORT

### **Courier Support Channels:**
- 📧 Email: courier-support@performile.com
- 💬 Live Chat: Available 9 AM - 5 PM CET
- 📞 Phone: +46 (0)8 123 4567
- 📚 Documentation: https://docs.performile.com/courier
- 🎥 Video Tutorials: https://learn.performile.com

### **Response Times:**
- Critical issues: < 2 hours
- High priority: < 4 hours
- Medium priority: < 24 hours
- Low priority: < 48 hours

---

**Created:** October 22, 2025, 12:30 PM  
**Status:** 📋 DESIGN PHASE  
**Next:** Implementation planning

# 🎯 MAKE IT EASY FOR COURIERS TO JOIN PERFORMILE!
