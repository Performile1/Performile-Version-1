# 💳 NORDIC PAYMENTS - COMPLETE INTEGRATION

**Date:** November 9, 2025  
**Status:** COMPLETE ✅  
**Coverage:** Norway (Vipps) + Sweden (Swish)

---

## 📋 OVERVIEW

Complete payment integration for Nordic markets supporting:
- **Subscriptions** - Monthly recurring payments
- **C2C Shipments** - Consumer-to-consumer shipping payments
- **Returns** - Return shipment payments

### **Payment Methods:**

| Country | Method | Use Cases | Status |
|---------|--------|-----------|--------|
| 🇳🇴 Norway | Vipps | Subscriptions, C2C, Returns | ✅ Complete |
| 🇸🇪 Sweden | Swish | C2C, Returns, Subscriptions | ✅ Complete |
| 🌍 International | Stripe | Subscriptions only | ✅ Complete |

---

## 🇳🇴 VIPPS (NORWAY)

### **Overview:**
- **Users:** 4+ million in Norway
- **API:** ePayment API v1
- **Currency:** NOK (Norwegian Krone)
- **Use Cases:** Subscriptions, C2C shipments, Returns

### **Setup:**

**Environment Variables:**
```bash
VIPPS_ENV=test                          # 'test' or 'production'
VIPPS_CLIENT_ID=your-client-id
VIPPS_CLIENT_SECRET=your-client-secret
VIPPS_SUBSCRIPTION_KEY=your-subscription-key
VIPPS_MERCHANT_SERIAL_NUMBER=123456
```

**Database Migration:**
```bash
psql $DATABASE_URL -f database/migrations/add_vipps_payments.sql
```

### **API Endpoints:**

**Create Payment:**
```typescript
POST /api/vipps/create-payment

// For Subscriptions
{
  "planId": 1,
  "paymentType": "subscription",
  "returnUrl": "https://performile.com/success"
}

// For C2C Shipments
{
  "orderId": "uuid",
  "amount": 150,  // NOK
  "paymentType": "c2c_shipment",
  "returnUrl": "https://performile.com/c2c/success"
}

// For Returns
{
  "orderId": "uuid",
  "amount": 75,  // NOK
  "paymentType": "return",
  "returnUrl": "https://performile.com/return/success"
}
```

**Webhook:**
```typescript
POST /api/vipps/webhook

// Handles events:
- epayments.payment.authorized.v1
- epayments.payment.captured.v1
- epayments.payment.cancelled.v1
- epayments.payment.refunded.v1
```

### **Payment Flow:**

```
1. User initiates payment
   ↓
2. Frontend calls /api/vipps/create-payment
   ↓
3. Backend creates payment with Vipps
   ↓
4. User redirected to Vipps app/web
   ↓
5. User approves in Vipps
   ↓
6. Vipps sends webhook (authorized)
   ↓
7. Vipps captures payment
   ↓
8. Vipps sends webhook (captured)
   ↓
9. Backend processes payment:
   - Subscription: Activate subscription
   - C2C: Create shipment label
   - Return: Create return label
   ↓
10. User redirected to success page
```

---

## 🇸🇪 SWISH (SWEDEN)

### **Overview:**
- **Users:** 8+ million in Sweden
- **API:** Swish API v2
- **Currency:** SEK (Swedish Krona)
- **Use Cases:** C2C shipments, Returns, Subscriptions

### **Setup:**

**Environment Variables:**
```bash
SWISH_ENV=test                          # 'test' or 'production'
SWISH_PAYEE_NUMBER=1231181189          # Performile's Swish number
SWISH_CALLBACK_URL=https://performile.com/api/swish/callback

# Client certificates (base64 encoded)
SWISH_CERT=base64-encoded-cert
SWISH_KEY=base64-encoded-key
SWISH_CA=base64-encoded-ca
```

**Database Migration:**
```bash
psql $DATABASE_URL -f database/migrations/add_swish_payments.sql
```

### **API Endpoints:**

**Create Payment:**
```typescript
POST /api/swish/create-payment

// For C2C Shipments
{
  "orderId": "uuid",
  "amount": 150,  // SEK
  "payerPhone": "46701234567",  // Swedish phone number
  "message": "C2C Shipment Payment",
  "paymentType": "c2c_shipment"
}

// For Returns
{
  "orderId": "uuid",
  "amount": 75,  // SEK
  "payerPhone": "46701234567",
  "message": "Return Shipment Payment",
  "paymentType": "return"
}
```

**Callback:**
```typescript
POST /api/swish/callback

// Handles statuses:
- PAID
- DECLINED
- ERROR
- CANCELLED
```

### **Payment Flow:**

```
1. User initiates payment
   ↓
2. Frontend calls /api/swish/create-payment
   ↓
3. Backend creates payment with Swish
   ↓
4. User receives Swish notification on phone
   ↓
5. User approves in Swish app
   ↓
6. Swish sends callback (PAID)
   ↓
7. Backend processes payment:
   - C2C: Create shipment label
   - Return: Create return label
   ↓
8. User sees confirmation
```

---

## 💾 DATABASE SCHEMA

### **vipps_payments:**
```sql
CREATE TABLE vipps_payments (
  payment_id UUID PRIMARY KEY,
  reference VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES users(user_id),
  plan_id INTEGER REFERENCES subscription_plans(plan_id),
  order_id UUID REFERENCES orders(order_id),
  payment_type VARCHAR(50),  -- 'subscription', 'c2c_shipment', 'return'
  amount INTEGER,            -- Amount in øre (NOK cents)
  currency VARCHAR(3),       -- 'NOK'
  status VARCHAR(50),        -- 'INITIATED', 'AUTHORIZED', 'CAPTURED', etc.
  vipps_payment_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **swish_payments:**
```sql
CREATE TABLE swish_payments (
  payment_id UUID PRIMARY KEY,
  reference VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES users(user_id),
  plan_id INTEGER REFERENCES subscription_plans(plan_id),
  order_id UUID REFERENCES orders(order_id),
  payment_type VARCHAR(50),  -- 'subscription', 'c2c_shipment', 'return'
  amount INTEGER,            -- Amount in öre (SEK cents)
  currency VARCHAR(3),       -- 'SEK'
  status VARCHAR(50),        -- 'CREATED', 'PENDING', 'PAID', 'DECLINED', etc.
  swish_payment_id VARCHAR(255),
  payer_phone_number VARCHAR(20),
  payee_phone_number VARCHAR(20),
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🎯 USE CASES

### **1. Subscription Payment**

**Vipps (Norway):**
```typescript
const response = await fetch('/api/vipps/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 1,  // Starter plan
    paymentType: 'subscription',
    returnUrl: window.location.origin + '/subscription/success',
  }),
});

const { data } = await response.json();
window.location.href = data.checkoutUrl;  // Redirect to Vipps
```

**Swish (Sweden):**
```typescript
const response = await fetch('/api/swish/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    planId: 1,
    amount: 499,  // SEK
    payerPhone: '46701234567',
    message: 'Performile Starter Plan',
    paymentType: 'subscription',
  }),
});

// User receives notification on phone
```

---

### **2. C2C Shipment Payment**

**Vipps (Norway):**
```typescript
const response = await fetch('/api/vipps/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: shipment.order_id,
    amount: 150,  // NOK
    paymentType: 'c2c_shipment',
    returnUrl: window.location.origin + '/c2c/success',
  }),
});

const { data } = await response.json();
window.location.href = data.checkoutUrl;
```

**Swish (Sweden):**
```typescript
const response = await fetch('/api/swish/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: shipment.order_id,
    amount: 150,  // SEK
    payerPhone: user.phone_number,
    message: 'C2C Shipment - Oslo to Stockholm',
    paymentType: 'c2c_shipment',
  }),
});

// User approves on phone
```

---

### **3. Return Payment**

**Vipps (Norway):**
```typescript
const response = await fetch('/api/vipps/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: return.order_id,
    amount: 75,  // NOK
    paymentType: 'return',
    returnUrl: window.location.origin + '/return/success',
  }),
});
```

**Swish (Sweden):**
```typescript
const response = await fetch('/api/swish/create-payment', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    orderId: return.order_id,
    amount: 75,  // SEK
    payerPhone: user.phone_number,
    message: 'Return Shipment Payment',
    paymentType: 'return',
  }),
});
```

---

## 📊 ANALYTICS

### **Payment Success Rates:**
```sql
-- Vipps success rate
SELECT 
  payment_type,
  COUNT(*) FILTER (WHERE status = 'CAPTURED') * 100.0 / COUNT(*) as success_rate
FROM vipps_payments
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_type;

-- Swish success rate
SELECT 
  payment_type,
  COUNT(*) FILTER (WHERE status = 'PAID') * 100.0 / COUNT(*) as success_rate
FROM swish_payments
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_type;
```

### **Revenue by Payment Method:**
```sql
SELECT 
  'Vipps' as method,
  payment_type,
  SUM(amount) / 100.0 as total_nok
FROM vipps_payments
WHERE status = 'CAPTURED'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_type

UNION ALL

SELECT 
  'Swish' as method,
  payment_type,
  SUM(amount) / 100.0 as total_sek
FROM swish_payments
WHERE status = 'PAID'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY payment_type;
```

---

## ✅ CHECKLIST

### **Implementation:**
- ✅ Vipps API endpoints
- ✅ Swish API endpoints
- ✅ Database migrations
- ✅ Webhook handlers
- ✅ Error handling
- ✅ Documentation

### **Configuration:**
- ⏳ Vipps merchant account
- ⏳ Swish merchant account
- ⏳ Environment variables
- ⏳ Webhook URLs configured
- ⏳ Test environments verified

### **Testing:**
- ⏳ Subscription payments
- ⏳ C2C shipment payments
- ⏳ Return payments
- ⏳ Webhook callbacks
- ⏳ Error scenarios

---

## 🎯 BUSINESS IMPACT

### **Market Coverage:**
- 🇳🇴 Norway: 4M+ Vipps users
- 🇸🇪 Sweden: 8M+ Swish users
- **Total:** 12M+ potential users

### **Revenue Opportunity:**
- **C2C Shipments:** €6M ARR potential (Year 5)
- **Subscriptions:** €5.7M ARR potential (Year 5)
- **Total:** €11.7M ARR potential

### **Competitive Advantage:**
- ✅ Native payment methods (better conversion)
- ✅ Instant payments (better UX)
- ✅ Mobile-first (modern users)
- ✅ Nordic market leader

---

**STATUS:** ✅ IMPLEMENTATION COMPLETE  
**TESTING:** ⏳ PENDING CREDENTIALS  
**PRODUCTION:** ⏳ PENDING TESTING

---

**Last Updated:** November 9, 2025, 2:30 PM
