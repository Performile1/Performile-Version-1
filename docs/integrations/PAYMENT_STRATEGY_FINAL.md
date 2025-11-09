# 💳 PAYMENT STRATEGY - FINAL ARCHITECTURE

**Date:** November 9, 2025  
**Status:** ✅ COMPLETE STRATEGY  
**Approach:** Clear separation between Consumer Payments and Subscription Payments

---

## 🎯 TWO-TIER PAYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMILE PAYMENTS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👤 CONSUMER PAYMENTS (C2C Shipments + Returns)                 │
│  ├─ 🇳🇴 Vipps (Norway)                                          │
│  ├─ 🇸🇪 Swish (Sweden)                                          │
│  ├─ 🇩🇰 MobilePay (Denmark) - Future                           │
│  └─ 🇫🇮 Pivo (Finland) - Future                                │
│                                                                  │
│  💼 SUBSCRIPTION PAYMENTS (Merchant/Courier Plans)              │
│  ├─ 💳 Stripe (Primary - Global)                               │
│  ├─ 💳 Adyen (Secondary - Enterprise)                          │
│  └─ 💳 PayPal (Alternative - Global)                           │
│                                                                  │
│  🛒 CHECKOUT INTEGRATIONS (E-commerce Payments)                 │
│  ├─ Klarna                                                      │
│  ├─ Adyen                                                       │
│  ├─ Worldpay                                                    │
│  ├─ Qliro                                                       │
│  ├─ Walley (formerly Collector)                                │
│  ├─ Kustom                                                      │
│  ├─ Svea WebPay                                                 │
│  └─ Swedbank Pay                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 PAYMENT CATEGORIES

### **CATEGORY 1: CONSUMER PAYMENTS** 👤
**Use Cases:** C2C Shipments, Returns  
**Users:** End consumers  
**Frequency:** One-time payments  
**Amount:** €10 - €200

| Provider | Country | Users | Priority | Status |
|----------|---------|-------|----------|--------|
| **Vipps** | 🇳🇴 Norway | 4M+ | 🔴 HIGH | ✅ Complete |
| **Swish** | 🇸🇪 Sweden | 8M+ | 🔴 HIGH | ✅ Complete |
| **MobilePay** | 🇩🇰 Denmark | 4M+ | 🟡 MEDIUM | ⏳ Q2 2026 |
| **Pivo** | 🇫🇮 Finland | 1M+ | 🟢 LOW | ⏳ Q3 2026 |

**Why These:**
- ✅ Instant payments
- ✅ Mobile-first
- ✅ High adoption in Nordic countries
- ✅ Lower fees (1-1.5%)
- ✅ No card details needed
- ✅ Trusted by consumers

---

### **CATEGORY 2: SUBSCRIPTION PAYMENTS** 💼
**Use Cases:** Merchant/Courier monthly subscriptions  
**Users:** Business customers  
**Frequency:** Recurring monthly  
**Amount:** €49 - €999/month

| Provider | Coverage | Priority | Status | Use Case |
|----------|----------|----------|--------|----------|
| **Stripe** | 🌍 Global | 🔴 PRIMARY | ✅ Complete | All subscriptions |
| **Adyen** | 🌍 Global | 🟡 SECONDARY | ⏳ Q2 2026 | Enterprise customers |
| **PayPal** | 🌍 Global | 🟢 ALTERNATIVE | ⏳ Q3 2026 | Alternative option |

**Why These:**
- ✅ Built for recurring billing
- ✅ Subscription management
- ✅ Customer portals
- ✅ Dunning management
- ✅ Tax handling
- ✅ Invoice generation
- ✅ Failed payment recovery

---

### **CATEGORY 3: CHECKOUT INTEGRATIONS** 🛒
**Use Cases:** E-commerce checkout widget integration  
**Users:** Merchants' customers (end shoppers)  
**Frequency:** Per order  
**Amount:** Variable

| Provider | Region | Priority | Status | Notes |
|----------|--------|----------|--------|-------|
| **Klarna** | 🇸🇪 Nordic | 🔴 HIGH | ⏳ Q2 2026 | Buy now, pay later |
| **Adyen** | 🌍 Global | 🔴 HIGH | ⏳ Q2 2026 | Enterprise solution |
| **Worldpay** | 🌍 Global | 🟡 MEDIUM | ⏳ Q3 2026 | Large merchants |
| **Qliro** | 🇸🇪 Nordic | 🟡 MEDIUM | ⏳ Q3 2026 | Nordic focus |
| **Walley** | 🇸🇪 Nordic | 🟡 MEDIUM | ⏳ Q3 2026 | B2B + B2C |
| **Kustom** | 🇸🇪 Sweden | 🟢 LOW | ⏳ Q4 2026 | Niche |
| **Svea WebPay** | 🇸🇪 Nordic | 🟢 LOW | ⏳ Q4 2026 | Invoice payments |
| **Swedbank Pay** | 🇸🇪 Nordic | 🟢 LOW | ⏳ Q4 2026 | Bank-backed |

**Why These:**
- ✅ Merchant checkout integration
- ✅ Multiple payment methods
- ✅ Buy now, pay later options
- ✅ Invoice payments
- ✅ B2B payment terms
- ✅ Fraud protection

---

## 🎯 STRATEGIC SEPARATION

### **Consumer Payments (Vipps/Swish):**
```
WHO: End consumers
WHAT: C2C shipments, returns
WHY: Fast, mobile, trusted
HOW: Phone-based instant payments
WHEN: One-time transactions
WHERE: Nordic countries
```

### **Subscription Payments (Stripe/Adyen):**
```
WHO: Merchants, couriers (businesses)
WHAT: Monthly subscription plans
WHY: Recurring billing, management
HOW: Card-based recurring charges
WHEN: Monthly automatic billing
WHERE: Global
```

### **Checkout Integrations (Klarna/Adyen/etc):**
```
WHO: Merchants' customers (shoppers)
WHAT: E-commerce checkout
WHY: Multiple payment options
HOW: Integrated into merchant checkout
WHEN: Per order
WHERE: Merchant's webshop
```

---

## 💾 DATABASE ARCHITECTURE

### **Consumer Payments:**
```sql
-- Vipps (Norway)
CREATE TABLE vipps_payments (
  payment_id UUID PRIMARY KEY,
  reference VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES users(user_id),
  order_id UUID REFERENCES orders(order_id),
  payment_type VARCHAR(50),  -- 'c2c_shipment' or 'return'
  amount INTEGER,  -- øre (NOK cents)
  currency VARCHAR(3) DEFAULT 'NOK',
  status VARCHAR(50),
  created_at TIMESTAMP
);

-- Swish (Sweden)
CREATE TABLE swish_payments (
  payment_id UUID PRIMARY KEY,
  reference VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES users(user_id),
  order_id UUID REFERENCES orders(order_id),
  payment_type VARCHAR(50),  -- 'c2c_shipment' or 'return'
  amount INTEGER,  -- öre (SEK cents)
  currency VARCHAR(3) DEFAULT 'SEK',
  status VARCHAR(50),
  payer_phone_number VARCHAR(20),
  created_at TIMESTAMP
);
```

### **Subscription Payments:**
```sql
-- Handled by payment providers
-- We store references only:
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN adyen_shopper_reference VARCHAR(255);
ALTER TABLE users ADD COLUMN paypal_customer_id VARCHAR(255);

-- Subscription tracking
CREATE TABLE subscriptions (
  subscription_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  plan_id INTEGER REFERENCES subscription_plans(plan_id),
  payment_provider VARCHAR(50),  -- 'stripe', 'adyen', 'paypal'
  provider_subscription_id VARCHAR(255),
  status VARCHAR(50),
  start_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  created_at TIMESTAMP
);
```

### **Checkout Integrations:**
```sql
-- Merchant checkout configuration
CREATE TABLE merchant_checkout_config (
  config_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(merchant_id),
  provider VARCHAR(50),  -- 'klarna', 'adyen', 'worldpay', etc.
  api_key_encrypted TEXT,
  settings JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);

-- Checkout transactions (for tracking)
CREATE TABLE checkout_transactions (
  transaction_id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(merchant_id),
  order_id UUID REFERENCES orders(order_id),
  provider VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  amount INTEGER,
  currency VARCHAR(3),
  status VARCHAR(50),
  created_at TIMESTAMP
);
```

---

## 🔄 PAYMENT FLOWS

### **1. Consumer C2C Payment (Vipps/Swish):**
```
Consumer books C2C shipment
  ↓
System calculates price (€50)
  ↓
Consumer selects Vipps/Swish
  ↓
Consumer approves on phone
  ↓
Payment confirmed instantly
  ↓
Shipment label created
  ↓
Courier notified
```

### **2. Subscription Payment (Stripe/Adyen):**
```
Merchant selects plan
  ↓
Redirected to Stripe/Adyen
  ↓
Enters card details
  ↓
First payment processed
  ↓
Subscription activated
  ↓
Monthly automatic billing
  ↓
Invoice sent via email
```

### **3. Checkout Integration (Klarna/Adyen):**
```
Shopper adds items to cart
  ↓
Clicks checkout
  ↓
Performile widget shows couriers
  ↓
Shopper selects courier
  ↓
Merchant's checkout (Klarna/Adyen)
  ↓
Shopper pays merchant
  ↓
Order created in Performile
  ↓
Courier assigned
```

---

## 📋 IMPLEMENTATION ROADMAP

### **✅ PHASE 1: COMPLETE (Nov 2025)**
- ✅ Stripe (Subscriptions)
- ✅ Vipps (Norway C2C/Returns)
- ✅ Swish (Sweden C2C/Returns)

### **🔴 PHASE 2: Q1 2026 (HIGH PRIORITY)**
**Subscription Alternatives:**
- Adyen (Enterprise subscriptions)
- PayPal (Alternative payment method)

**Checkout Integrations (Top 2):**
- Klarna (Nordic leader)
- Adyen Checkout (Global solution)

**Investment:** €40K - €60K  
**Timeline:** 8-10 weeks

### **🟡 PHASE 3: Q2 2026 (MEDIUM PRIORITY)**
**Consumer Payments:**
- MobilePay (Denmark)

**Checkout Integrations:**
- Worldpay
- Qliro
- Walley

**Investment:** €30K - €45K  
**Timeline:** 6-8 weeks

### **🟢 PHASE 4: Q3-Q4 2026 (LOW PRIORITY)**
**Consumer Payments:**
- Pivo (Finland)

**Checkout Integrations:**
- Kustom
- Svea WebPay
- Swedbank Pay

**Investment:** €25K - €35K  
**Timeline:** 4-6 weeks

---

## 💰 BUSINESS CASE

### **Consumer Payments (Vipps/Swish):**
**Revenue:** €6M ARR (Year 5)  
**Margin:** 20-30% on C2C shipments  
**Fees:** 1-1.5% (lower than cards)  
**ROI:** Excellent

### **Subscription Payments (Stripe/Adyen):**
**Revenue:** €5.7M ARR (Year 5)  
**Margin:** 100% (subscription revenue)  
**Fees:** 2.9% + €0.25  
**ROI:** Excellent

### **Checkout Integrations (Klarna/Adyen):**
**Revenue:** Commission on merchant orders  
**Margin:** 5-10% commission  
**Fees:** Passed to merchant  
**ROI:** High (enables merchant sales)

**Total Revenue Potential:** €11.7M+ ARR

---

## 🎯 PRIORITY MATRIX

### **Immediate (Complete):**
1. ✅ Stripe - Subscriptions
2. ✅ Vipps - Norway C2C
3. ✅ Swish - Sweden C2C

### **Q1 2026 (Critical):**
1. 🔴 Klarna - Checkout integration
2. 🔴 Adyen - Subscriptions + Checkout
3. 🟡 PayPal - Subscription alternative

### **Q2 2026 (Important):**
1. 🟡 MobilePay - Denmark C2C
2. 🟡 Worldpay - Checkout
3. 🟡 Qliro - Nordic checkout

### **Q3-Q4 2026 (Nice to Have):**
1. 🟢 Walley - B2B checkout
2. 🟢 Pivo - Finland C2C
3. 🟢 Svea WebPay - Invoice payments

---

## 🔧 TECHNICAL ARCHITECTURE

### **API Structure:**
```
api/
├── consumer-payments/          # C2C + Returns
│   ├── vipps/
│   │   ├── create-payment.ts
│   │   └── webhook.ts
│   ├── swish/
│   │   ├── create-payment.ts
│   │   └── callback.ts
│   └── mobilepay/             # Future
│
├── subscriptions/              # Monthly plans
│   ├── stripe/
│   │   ├── create-checkout-session.ts
│   │   ├── create-portal-session.ts
│   │   └── webhook.ts
│   ├── adyen/                 # Future
│   └── paypal/                # Future
│
└── checkout-integrations/      # E-commerce
    ├── klarna/                # Future
    ├── adyen-checkout/        # Future
    ├── worldpay/              # Future
    ├── qliro/                 # Future
    ├── walley/                # Future
    ├── kustom/                # Future
    ├── svea/                  # Future
    └── swedbank/              # Future
```

---

## 📊 COMPARISON MATRIX

### **Consumer Payments:**
| Feature | Vipps | Swish | MobilePay | Pivo |
|---------|-------|-------|-----------|------|
| Country | 🇳🇴 | 🇸🇪 | 🇩🇰 | 🇫🇮 |
| Users | 4M+ | 8M+ | 4M+ | 1M+ |
| Fee | 1.5% | 1.0% | 1.2% | 1.5% |
| Speed | Instant | Instant | Instant | Instant |
| Status | ✅ | ✅ | ⏳ | ⏳ |

### **Subscription Payments:**
| Feature | Stripe | Adyen | PayPal |
|---------|--------|-------|--------|
| Coverage | Global | Global | Global |
| Fee | 2.9% + €0.25 | 2.5% + €0.10 | 3.4% + €0.35 |
| Recurring | ✅ Excellent | ✅ Excellent | ✅ Good |
| Portal | ✅ Yes | ✅ Yes | ✅ Yes |
| Status | ✅ | ⏳ | ⏳ |

### **Checkout Integrations:**
| Provider | Region | BNPL | Invoice | B2B | Status |
|----------|--------|------|---------|-----|--------|
| Klarna | Nordic | ✅ | ✅ | ❌ | ⏳ |
| Adyen | Global | ✅ | ❌ | ✅ | ⏳ |
| Worldpay | Global | ❌ | ❌ | ✅ | ⏳ |
| Qliro | Nordic | ✅ | ✅ | ✅ | ⏳ |
| Walley | Nordic | ✅ | ✅ | ✅ | ⏳ |
| Svea | Nordic | ❌ | ✅ | ✅ | ⏳ |

---

## ✅ SUCCESS CRITERIA

### **Consumer Payments:**
- Payment success rate > 95%
- Average payment time < 30 seconds
- User satisfaction > 90%
- Fee savings vs cards > 50%

### **Subscription Payments:**
- Churn rate < 5%
- Failed payment rate < 2%
- Customer portal usage > 60%
- Dunning recovery rate > 40%

### **Checkout Integrations:**
- Merchant adoption > 70%
- Checkout conversion rate > 80%
- Integration time < 2 hours
- Support tickets < 1% of transactions

---

**STATUS:** ✅ STRATEGY COMPLETE  
**CLARITY:** 💯 Crystal clear separation  
**SCALABILITY:** 🚀 Ready for growth  
**INVESTMENT:** €95K - €140K total  
**ROI:** €11.7M+ ARR potential

---

**Last Updated:** November 9, 2025, 2:50 PM
