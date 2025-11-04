# TECHNICAL PARTNER INTEGRATION GUIDE

**Version:** 1.0  
**Date:** November 4, 2025  
**Platform:** Performile V3.5  
**Audience:** Technical Partners, Integration Developers

---

## 📋 OVERVIEW

### What is Performile?

Performile is a **courier optimization and TrustScore platform** that helps e-commerce merchants:
- Select the best courier for each delivery
- Track shipments in real-time
- Collect and display customer reviews
- Optimize delivery performance

### Integration Opportunities:

1. **E-commerce Platforms** (Shopify, WooCommerce, Magento, etc.)
2. **Courier Services** (PostNord, Bring, DHL, UPS, FedEx, etc.)
3. **Payment Gateways** (Stripe, Klarna, Vipps, etc.)
4. **Marketing Tools** (Klaviyo, Mailchimp, etc.)
5. **Analytics Platforms** (Google Analytics, Mixpanel, etc.)

---

## 🏗️ TECHNICAL ARCHITECTURE

### Stack:
- **Frontend:** React 18 + TypeScript + Material-UI
- **Backend:** Node.js + Vercel Serverless Functions
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT + Supabase Auth
- **API:** REST + Webhooks
- **Deployment:** Vercel (Edge Network)

### Infrastructure:
- **Database:** Supabase (PostgreSQL with RLS)
- **API:** Vercel Serverless (140+ endpoints)
- **CDN:** Vercel Edge Network
- **SSL:** Automatic (Let's Encrypt)
- **Monitoring:** Vercel Analytics + Sentry

---

## 🔌 INTEGRATION TYPES

### 1. E-COMMERCE PLATFORM INTEGRATION

**Purpose:** Connect merchant stores to Performile

**Integration Points:**
- Order synchronization
- Courier selection at checkout
- Tracking page embedding
- Review collection
- Analytics tracking

**Supported Platforms:**
- ✅ Shopify (90% complete)
- ⏳ WooCommerce (planned)
- ⏳ Magento (planned)
- ⏳ PrestaShop (planned)
- ⏳ Custom platforms (API available)

**Technical Requirements:**
- OAuth 2.0 authentication
- Webhook support
- REST API access
- JavaScript SDK (for checkout widget)

---

### 2. COURIER API INTEGRATION

**Purpose:** Connect courier services for tracking and booking

**Integration Points:**
- Shipment booking
- Real-time tracking
- Label generation
- Rate calculation
- Service area lookup

**Supported Couriers:**
- ✅ PostNord
- ✅ Bring
- ✅ DHL
- ✅ UPS
- ✅ FedEx
- ✅ Instabox
- ✅ Budbee
- ✅ Porterbuddy

**Technical Requirements:**
- REST API or SOAP
- Webhook support (optional)
- API credentials per merchant
- Test environment access

---

### 3. WEBHOOK INTEGRATION

**Purpose:** Real-time event notifications

**Supported Events:**
- `order.created`
- `order.updated`
- `order.delivered`
- `tracking.updated`
- `review.submitted`
- `claim.created`

**Webhook Format:**
```json
{
  "event": "order.delivered",
  "timestamp": "2025-11-04T14:30:00Z",
  "data": {
    "order_id": "uuid",
    "tracking_number": "123456789",
    "courier": "postnord",
    "status": "delivered"
  }
}
```

---

## 🔐 AUTHENTICATION

### API Authentication:

**Method:** JWT Bearer Token

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Obtaining Token:**
```bash
POST /api/auth/login
{
  "email": "merchant@example.com",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### API Keys (for server-to-server):

**Format:** `pk_live_...` (production) or `pk_test_...` (testing)

**Headers:**
```
X-API-Key: pk_live_abc123...
Content-Type: application/json
```

---

## 📡 API ENDPOINTS

### Core Endpoints:

#### **Orders:**
```
GET    /api/orders              - List orders
GET    /api/orders/:id          - Get order
POST   /api/orders              - Create order
PUT    /api/orders/:id          - Update order
DELETE /api/orders/:id          - Cancel order
```

#### **Tracking:**
```
GET    /api/tracking/:number    - Track shipment
POST   /api/tracking/events     - Add tracking event
POST   /api/tracking/webhook    - Webhook receiver
```

#### **TrustScore:**
```
GET    /api/trustscore          - List all TrustScores
GET    /api/trustscore/:id      - Get courier TrustScore
POST   /api/trustscore/calculate - Recalculate score
```

#### **Reviews:**
```
GET    /api/reviews             - List reviews
POST   /api/reviews             - Submit review
GET    /api/reviews/public/:token - Public review page
```

#### **Integrations:**
```
GET    /api/integrations        - List integrations
POST   /api/integrations/shopify - Connect Shopify
POST   /api/integrations/test   - Test integration
```

### Full API Documentation:
**Swagger/OpenAPI:** Coming soon  
**Postman Collection:** Available on request

---

## 🛠️ INTEGRATION EXAMPLES

### Example 1: Shopify Plugin

**Purpose:** Display courier options with TrustScore at checkout

**Implementation:**
```javascript
// 1. Load Performile SDK
<script src="https://cdn.performile.com/sdk.js"></script>

// 2. Initialize
const performile = new Performile({
  apiKey: 'pk_live_...',
  merchantId: 'merchant_uuid'
});

// 3. Get courier options
const couriers = await performile.getCouriers({
  postalCode: '0150',
  weight: 2.5,
  dimensions: { length: 30, width: 20, height: 10 }
});

// 4. Display with TrustScore
couriers.forEach(courier => {
  console.log(`${courier.name}: ${courier.trustScore}/100`);
});
```

---

### Example 2: Courier Integration

**Purpose:** Connect courier API for tracking

**Implementation:**
```javascript
// 1. Save courier credentials
POST /api/courier-credentials
{
  "courier_name": "postnord",
  "api_key": "your_api_key",
  "customer_number": "123456"
}

// 2. Test connection
POST /api/courier-credentials/test
{
  "courier_name": "postnord",
  "credentials": { ... }
}

// 3. Track shipment
GET /api/tracking/ABC123456789

Response:
{
  "tracking_number": "ABC123456789",
  "status": "in_transit",
  "events": [
    {
      "timestamp": "2025-11-04T10:00:00Z",
      "status": "picked_up",
      "location": "Oslo"
    }
  ]
}
```

---

### Example 3: Webhook Integration

**Purpose:** Receive real-time updates

**Implementation:**
```javascript
// 1. Register webhook
POST /api/webhooks
{
  "url": "https://your-domain.com/webhooks/performile",
  "events": ["order.delivered", "tracking.updated"]
}

// 2. Handle webhook (your server)
app.post('/webhooks/performile', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'order.delivered') {
    // Send confirmation email
    sendEmail(data.order_id);
  }
  
  res.status(200).send('OK');
});
```

---

## 📦 SDK & LIBRARIES

### JavaScript SDK:

```bash
npm install @performile/sdk
```

```javascript
import Performile from '@performile/sdk';

const client = new Performile({
  apiKey: 'pk_live_...'
});

// Get couriers
const couriers = await client.couriers.list({
  postalCode: '0150'
});

// Create order
const order = await client.orders.create({
  tracking_number: '123456789',
  courier_id: 'courier_uuid',
  // ...
});
```

### React Components:

```bash
npm install @performile/react
```

```jsx
import { CourierSelector, TrustScoreIndicator } from '@performile/react';

function Checkout() {
  return (
    <CourierSelector
      postalCode="0150"
      onSelect={(courier) => console.log(courier)}
    />
  );
}
```

---

## 🧪 TESTING

### Test Environment:

**Base URL:** `https://api-test.performile.com`  
**Test API Key:** `pk_test_...`  
**Test Credentials:** Available on request

### Test Data:

**Test Merchant:**
- Email: `merchant@performile.com`
- Password: `TestPassword123!`

**Test Tracking Numbers:**
- `TEST123456789` - Delivered
- `TEST987654321` - In transit
- `TEST111222333` - Pending

### Testing Checklist:

- [ ] Authentication works
- [ ] API endpoints respond correctly
- [ ] Webhooks are received
- [ ] Error handling works
- [ ] Rate limiting respected
- [ ] Data validation works

---

## 📊 RATE LIMITING

### Limits:

**Standard Plan:**
- 1,000 requests/hour
- 10,000 requests/day
- Burst: 100 requests/minute

**Enterprise Plan:**
- 10,000 requests/hour
- 100,000 requests/day
- Burst: 1,000 requests/minute

### Headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1699104000
```

### Handling Rate Limits:
```javascript
if (response.status === 429) {
  const resetTime = response.headers['X-RateLimit-Reset'];
  // Wait until reset time
  await sleep(resetTime - Date.now());
  // Retry request
}
```

---

## 🔒 SECURITY

### Best Practices:

1. **API Keys:**
   - Never expose in client-side code
   - Use environment variables
   - Rotate regularly

2. **Webhooks:**
   - Verify signature
   - Use HTTPS only
   - Validate payload

3. **Data:**
   - Encrypt sensitive data
   - Use HTTPS for all requests
   - Follow GDPR guidelines

### Webhook Signature Verification:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## 📚 RESOURCES

### Documentation:
- **API Docs:** https://docs.performile.com/api
- **Integration Guides:** https://docs.performile.com/integrations
- **SDK Reference:** https://docs.performile.com/sdk
- **Changelog:** https://docs.performile.com/changelog

### Support:
- **Email:** partners@performile.com
- **Slack:** #performile-partners
- **GitHub:** https://github.com/performile
- **Status Page:** https://status.performile.com

### Developer Portal:
- **Dashboard:** https://partners.performile.com
- **API Keys:** https://partners.performile.com/api-keys
- **Webhooks:** https://partners.performile.com/webhooks
- **Logs:** https://partners.performile.com/logs

---

## 🤝 PARTNERSHIP OPPORTUNITIES

### Integration Partners:

**Benefits:**
- Revenue share (20-30%)
- Co-marketing opportunities
- Priority support
- Early access to features
- Technical documentation
- Dedicated account manager

**Requirements:**
- Active user base
- Technical capability
- Support commitment
- Quality standards

### Courier Partners:

**Benefits:**
- Increased visibility
- TrustScore listing
- Direct merchant connections
- Performance analytics
- API integration support

**Requirements:**
- API availability
- Webhook support
- Test environment
- Documentation
- Support commitment

---

## 📞 CONTACT

### Technical Support:
- **Email:** tech@performile.com
- **Response Time:** 24 hours
- **Escalation:** partners@performile.com

### Partnership Inquiries:
- **Email:** partnerships@performile.com
- **Website:** https://performile.com/partners

### Sales:
- **Email:** sales@performile.com
- **Phone:** +47 XXX XX XXX

---

## ✅ GETTING STARTED

### Quick Start (5 steps):

1. **Sign Up:** https://partners.performile.com/signup
2. **Get API Key:** Dashboard → API Keys → Create
3. **Read Docs:** https://docs.performile.com
4. **Test Integration:** Use test environment
5. **Go Live:** Switch to production API key

### Integration Timeline:

**Week 1:** Planning & setup
**Week 2:** Development & testing
**Week 3:** QA & refinement
**Week 4:** Launch & monitoring

**Total:** 4 weeks average

---

*Version: 1.0*  
*Last Updated: November 4, 2025*  
*For: Technical Partners*  
*Classification: Public*
