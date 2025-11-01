# CHECKOUT ANALYTICS ACCESS CONTROL

**Date:** November 1, 2025, 8:54 PM  
**Purpose:** Define role-based access to checkout analytics data  
**Status:** Specification

---

## **📊 Overview**

Checkout analytics should be accessible to different roles with appropriate permissions and subscription-based limits:

- **Admin** - Full access to all data
- **Merchant** - See their own checkout data
- **Courier** - See their own performance data (with subscription limits)

---

## **🔐 Role-Based Access**

### **1. ADMIN Role**

**Access Level:** FULL

**Can View:**
- ✅ All merchants' checkout analytics
- ✅ All couriers' performance data
- ✅ Platform-wide conversion metrics
- ✅ Unlimited time range
- ✅ All merchants (no limit)

**Endpoints:**
```typescript
GET /api/admin/checkout-analytics
GET /api/admin/checkout-analytics/merchant/:merchantId
GET /api/admin/checkout-analytics/courier/:courierId
GET /api/admin/checkout-analytics/platform
```

**No Subscription Limits**

---

### **2. MERCHANT Role**

**Access Level:** OWN DATA ONLY

**Can View:**
- ✅ Their own checkout sessions
- ✅ Which couriers were shown
- ✅ Which couriers were selected
- ✅ Conversion rates per courier
- ✅ Position performance
- ✅ Time-based trends

**Endpoints:**
```typescript
GET /api/merchant/checkout-analytics
GET /api/merchant/checkout-analytics/couriers
GET /api/merchant/checkout-analytics/trends
```

**Subscription Limits:**
| Tier | Time Range | Top Couriers | Export |
|------|-----------|--------------|--------|
| Free | 7 days | Top 5 | ❌ No |
| Basic | 30 days | Top 10 | ✅ CSV |
| Pro | 90 days | Top 20 | ✅ CSV + Excel |
| Enterprise | Unlimited | Unlimited | ✅ All formats |

**Data Returned:**
```typescript
{
  summary: {
    totalCheckouts: number,
    totalSelections: number,
    conversionRate: number,
    avgCouriersShown: number
  },
  topCouriers: [{
    courierId: string,
    courierName: string,
    timesShown: number,
    timesSelected: number,
    selectionRate: number,
    avgPosition: number
  }],
  trends: [{
    date: string,
    checkouts: number,
    selections: number,
    conversionRate: number
  }],
  subscription: {
    tier: number,
    maxDays: number,
    maxCouriers: number,
    isLimited: boolean,
    upgradeMessage?: string
  }
}
```

---

### **3. COURIER Role**

**Access Level:** OWN DATA ONLY

**Can View:**
- ✅ Their own checkout appearances
- ✅ Which merchants showed them
- ✅ Selection rate
- ✅ Average position
- ✅ Position performance (1st vs 2nd vs 3rd)
- ✅ Trend over time

**Endpoints:**
```typescript
GET /api/courier/checkout-analytics
GET /api/courier/checkout-analytics/merchant/:merchantId (premium)
```

**Subscription Limits:**
| Tier | Time Range | Merchants | Premium Insights |
|------|-----------|-----------|------------------|
| Free | 7 days | Top 3 | ❌ No |
| Basic | 30 days | Top 10 | ❌ No |
| Pro | 90 days | Top 20 | ✅ Yes ($49/merchant) |
| Enterprise | Unlimited | Unlimited | ✅ All included |

**Data Returned:**
```typescript
{
  summary: {
    avgPosition: number,
    totalAppearances: number,
    timesSelected: number,
    selectionRate: number,
    avgTrustScore: number,
    avgPrice: number
  },
  distribution: [{
    position: number,
    count: number,
    percentage: number
  }],
  topMerchants: [{
    merchantId: string,
    merchantName: string,
    storeName: string,
    avgPosition: number,
    appearances: number,
    selections: number,
    selectionRate: number
  }],
  trend: [{
    date: string,
    avgPosition: number,
    appearances: number,
    selections: number
  }],
  subscription: {
    tier: number,
    maxMerchants: number,
    maxDays: number,
    isLimited: boolean,
    hiddenMerchants: number,
    upgradeMessage?: string
  }
}
```

---

## **🗄️ Database Schema**

### **Table: checkout_courier_analytics**

```sql
CREATE TABLE checkout_courier_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Merchant & Courier
  merchant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
  
  -- Session tracking
  checkout_session_id VARCHAR(100) NOT NULL,
  
  -- Display metrics
  position_shown INTEGER,
  total_couriers_shown INTEGER,
  was_selected BOOLEAN DEFAULT false,
  
  -- Courier data at time of display
  trust_score_at_time NUMERIC(3,2),
  price_at_time NUMERIC(10,2),
  delivery_time_estimate_hours INTEGER,
  distance_km NUMERIC(10,2),
  
  -- Order context
  order_value NUMERIC(10,2),
  items_count INTEGER,
  package_weight_kg NUMERIC(10,2),
  
  -- Delivery location
  delivery_postal_code VARCHAR(20),
  delivery_city VARCHAR(100),
  delivery_country VARCHAR(2),
  
  -- Timestamps
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_session_courier UNIQUE (checkout_session_id, courier_id)
);
```

---

## **🔒 Row Level Security (RLS)**

### **Merchant Policy**
```sql
CREATE POLICY merchant_view_own_checkout_analytics 
ON checkout_courier_analytics
FOR SELECT
USING (
  merchant_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'merchant'
  )
);
```

### **Courier Policy**
```sql
CREATE POLICY courier_view_own_checkout_analytics 
ON checkout_courier_analytics
FOR SELECT
USING (
  courier_id IN (
    SELECT courier_id FROM couriers 
    WHERE user_id = auth.uid()
  )
);
```

### **Admin Policy**
```sql
CREATE POLICY admin_view_all_checkout_analytics 
ON checkout_courier_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.user_role = 'admin'
  )
);
```

### **Public Insert Policy**
```sql
-- For Shopify checkout extension (no auth)
CREATE POLICY public_insert_checkout_analytics 
ON checkout_courier_analytics
FOR INSERT
WITH CHECK (true);
```

---

## **📈 API Endpoints**

### **Already Implemented:**
- ✅ `GET /api/courier/checkout-analytics` (with subscription limits)
- ✅ `GET /api/courier/checkout-analytics/merchant/:merchantId` (premium)
- ✅ `GET /api/merchant/checkout-analytics` (basic version)

### **Need to Implement:**
- ❌ `GET /api/admin/checkout-analytics/platform`
- ❌ `GET /api/admin/checkout-analytics/merchant/:merchantId`
- ❌ `GET /api/admin/checkout-analytics/courier/:courierId`
- ❌ Subscription limit enforcement for merchants
- ❌ Export functionality (CSV, Excel)

---

## **🎯 Implementation Checklist**

### **Phase 1: Database (DONE)**
- [x] Create `checkout_courier_analytics` table
- [x] Add RLS policies
- [x] Add indexes for performance

### **Phase 2: Courier Analytics (DONE)**
- [x] Courier view own data
- [x] Subscription limits (Tier 1-4)
- [x] Premium merchant insights
- [x] Position distribution
- [x] Trend analysis

### **Phase 3: Merchant Analytics (PARTIAL)**
- [x] Basic merchant analytics exists
- [ ] Add subscription limits
- [ ] Add top couriers list
- [ ] Add trend analysis
- [ ] Add export functionality

### **Phase 4: Admin Analytics (TODO)**
- [ ] Platform-wide metrics
- [ ] Merchant-specific view
- [ ] Courier-specific view
- [ ] Conversion funnel analysis

---

## **💰 Subscription Tiers**

### **Courier Tiers:**
```typescript
const COURIER_TIERS = {
  FREE: {
    tier: 1,
    maxMerchants: 3,
    maxDays: 7,
    premiumInsights: false,
    price: 0
  },
  BASIC: {
    tier: 2,
    maxMerchants: 10,
    maxDays: 30,
    premiumInsights: false,
    price: 29
  },
  PRO: {
    tier: 3,
    maxMerchants: 20,
    maxDays: 90,
    premiumInsights: true, // $49/merchant
    price: 99
  },
  ENTERPRISE: {
    tier: 4,
    maxMerchants: 999,
    maxDays: 365,
    premiumInsights: true, // included
    price: 299
  }
};
```

### **Merchant Tiers:**
```typescript
const MERCHANT_TIERS = {
  FREE: {
    tier: 1,
    maxDays: 7,
    maxCouriers: 5,
    export: false,
    price: 0
  },
  BASIC: {
    tier: 2,
    maxDays: 30,
    maxCouriers: 10,
    export: 'csv',
    price: 49
  },
  PRO: {
    tier: 3,
    maxDays: 90,
    maxCouriers: 20,
    export: 'all',
    price: 149
  },
  ENTERPRISE: {
    tier: 4,
    maxDays: 365,
    maxCouriers: 999,
    export: 'all',
    price: 499
  }
};
```

---

## **🚀 Deployment Steps**

### **Step 1: Deploy Table**
```sql
database/CREATE_CHECKOUT_ANALYTICS_TABLE.sql
```

### **Step 2: Verify RLS Policies**
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'checkout_courier_analytics';
```

### **Step 3: Test Access**
```sql
-- As merchant
SELECT * FROM checkout_courier_analytics 
WHERE merchant_id = 'merchant-uuid';

-- As courier
SELECT * FROM checkout_courier_analytics 
WHERE courier_id = 'courier-uuid';

-- As admin
SELECT * FROM checkout_courier_analytics;
```

### **Step 4: Deploy API Endpoints**
- Already exists: `backend/src/routes/courier-checkout-analytics.ts`
- Already exists: `backend/src/routes/merchant-checkout-analytics.ts`
- Need to create: `backend/src/routes/admin-checkout-analytics.ts`

---

## **✅ Success Criteria**

**Deployment is successful when:**
1. ✅ Table exists with RLS policies
2. ✅ Merchants can see their own data only
3. ✅ Couriers can see their own data only
4. ✅ Admins can see all data
5. ✅ Subscription limits are enforced
6. ✅ Premium features require payment
7. ✅ Public insert works (Shopify extension)

---

**Status:** Ready for deployment after table creation! 🚀
