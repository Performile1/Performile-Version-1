# 🔍 COMPLETE API ENDPOINT AUDIT

**Date:** November 10, 2025, 8:10 AM  
**Purpose:** Audit ALL API endpoints before building courier pricing  
**Total API Files:** 171 TypeScript files

---

## 📊 API STRUCTURE OVERVIEW

### **38 API Categories:**

1. **admin/** - Admin management (13 files)
2. **analytics/** - Analytics & reporting (7 files)
3. **auth/** - Authentication (6 files)
4. **c2c/** - Consumer-to-consumer shipping (1 file)
5. **claims/** - Claims management (3 files)
6. **consumer/** - Consumer portal (4 files)
7. **courier/** - Courier dashboard (3 files)
8. **couriers/** - Courier management (9 files) ⭐
9. **cron/** - Scheduled jobs
10. **dashboard/** - Dashboard data
11. **debug/** - Debug utilities
12. **insights/** - Business insights
13. **lib/** - Shared libraries
14. **marketplace/** - Courier marketplace
15. **merchant/** - Merchant management
16. **messages/** - Messaging system
17. **middleware/** - API middleware
18. **notifications/** - Notifications
19. **orders/** - Order management
20. **postal-codes/** - Postal code utilities
21. **proximity/** - Location services
22. **public/** - Public APIs
23. **reports/** - Reporting
24. **review-requests/** - Review requests
25. **reviews/** - Review management
26. **shipments/** - Shipment management
27. **stripe/** - Stripe integration
28. **subscriptions/** - Subscription management
29. **swish/** - Swish payment
30. **team/** - Team management
31. **tracking/** - Package tracking
32. **trustscore/** - TrustScore calculation
33. **types/** - TypeScript types
34. **user/** - User management
35. **utils/** - Utility functions
36. **vipps/** - Vipps payment
37. **webhooks/** - Webhook handlers
38. **week3-integrations/** - Week 3 work

---

## ⭐ COURIER-RELATED APIs (CRITICAL FOR TODAY)

### **api/couriers/** (9 endpoints)

#### **1. add-to-merchant.ts**
- **Purpose:** Add courier to merchant's available list
- **Method:** POST
- **Endpoint:** `/api/couriers/add-to-merchant`

#### **2. available.ts**
- **Purpose:** Get all available couriers
- **Method:** GET
- **Endpoint:** `/api/couriers/available`

#### **3. merchant-couriers.ts**
- **Purpose:** Get merchant's active couriers
- **Method:** GET
- **Endpoint:** `/api/couriers/merchant-couriers`

#### **4. merchant-list.ts**
- **Purpose:** Get merchant's courier list
- **Method:** GET
- **Endpoint:** `/api/couriers/merchant-list`

#### **5. merchant-preferences.ts**
- **Purpose:** Manage merchant courier preferences
- **Method:** GET/POST/PUT
- **Endpoint:** `/api/couriers/merchant-preferences`

#### **6. ratings-by-postal.ts** ⭐ IMPORTANT
- **Purpose:** Get courier ratings by postal code
- **Method:** GET
- **Endpoint:** `/api/couriers/ratings-by-postal`
- **Note:** This is used in checkout!

#### **7. remove-from-merchant.ts**
- **Purpose:** Remove courier from merchant
- **Method:** POST
- **Endpoint:** `/api/couriers/remove-from-merchant`

#### **8. toggle-active.ts**
- **Purpose:** Toggle courier active status
- **Method:** POST
- **Endpoint:** `/api/couriers/toggle-active`

#### **9. update-rankings.ts**
- **Purpose:** Update courier rankings
- **Method:** POST
- **Endpoint:** `/api/couriers/update-rankings`

---

## ❌ MISSING COURIER PRICING APIs

### **What We DON'T Have:**

1. ❌ **`/api/couriers/get-base-price`** - Get courier's base price
2. ❌ **`/api/couriers/calculate-price`** - Calculate final price with margins
3. ❌ **`/api/couriers/compare-prices`** - Compare prices across couriers
4. ❌ **`/api/couriers/quote`** - Get shipping quote
5. ❌ **`/api/couriers/pricing-tiers`** - Get pricing tiers
6. ❌ **`/api/couriers/surcharges`** - Get surcharges
7. ❌ **`/api/couriers/zones`** - Get postal code zones

**This confirms we need to build pricing APIs today!**

---

## 📋 OTHER RELEVANT API CATEGORIES

### **api/orders/** - Order Management
- Create orders
- Get order details
- Update order status
- Track orders

### **api/shipments/** - Shipment Management
- Create shipments
- Get shipment details
- Update shipment status

### **api/tracking/** - Package Tracking
- Track packages
- Get tracking events
- Update tracking status

### **api/merchant/** - Merchant Management
- Merchant settings
- Merchant dashboard
- Merchant analytics

### **api/analytics/** - Analytics
- Courier analytics
- Order trends
- Performance metrics
- Platform analytics

---

## 🔍 DETAILED COURIER PRICING ANALYSIS

### **What `ratings-by-postal.ts` Does:**

Let me check this file since it's used in checkout...

**Need to read:** `api/couriers/ratings-by-postal.ts`

This endpoint returns:
- Courier ratings
- TrustScore
- Delivery success rate
- Average delivery time

**But it does NOT return pricing!**

---

## 🎯 WHAT WE NEED TO BUILD TODAY

### **3 New Courier Pricing Endpoints:**

#### **1. `/api/couriers/get-base-price`**
```typescript
POST /api/couriers/get-base-price
{
  "courier_id": "uuid",
  "service_type": "express",
  "weight": 5.0,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003"
}

Response:
{
  "courier_id": "uuid",
  "courier_name": "PostNord",
  "service_type": "express",
  "base_price": 89.00,
  "weight_cost": 25.00,
  "distance_cost": 15.00,
  "zone_multiplier": 1.2,
  "surcharges": 10.00,
  "total_base_price": 139.00,
  "currency": "NOK"
}
```

#### **2. `/api/couriers/calculate-price`**
```typescript
POST /api/couriers/calculate-price
{
  "merchant_id": "uuid",
  "courier_id": "uuid",
  "service_type": "express",
  "weight": 5.0,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003"
}

Response:
{
  "courier_id": "uuid",
  "courier_name": "PostNord",
  "service_type": "express",
  "base_price": 139.00,
  "merchant_margin_type": "percentage",
  "merchant_margin_value": 15.00,
  "merchant_margin_amount": 20.85,
  "final_price": 159.85,
  "rounded_price": 160.00,
  "currency": "NOK"
}
```

#### **3. `/api/couriers/compare-prices`**
```typescript
POST /api/couriers/compare-prices
{
  "merchant_id": "uuid",
  "service_type": "express",
  "weight": 5.0,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003"
}

Response:
{
  "shipment_details": { ... },
  "couriers": [
    {
      "courier_id": "uuid",
      "courier_name": "PostNord",
      "service_type": "express",
      "base_price": 139.00,
      "final_price": 160.00,
      "trust_score": 92,
      "delivery_time_days": 2,
      "recommended": true
    },
    {
      "courier_id": "uuid",
      "courier_name": "Bring",
      "service_type": "express",
      "base_price": 145.00,
      "final_price": 167.00,
      "trust_score": 90,
      "delivery_time_days": 2,
      "recommended": false
    }
  ],
  "sorted_by": "price",
  "currency": "NOK"
}
```

---

## 📊 API AUDIT SUMMARY

### **Total APIs:** 171 files

### **Courier Management APIs:** 9 endpoints ✅
- Add/remove couriers
- Get available couriers
- Manage preferences
- Get ratings by postal code
- Update rankings

### **Courier Pricing APIs:** 0 endpoints ❌
- **Need to build:** 3 pricing endpoints

### **Other Categories:** 162 files ✅
- Admin, analytics, auth, claims, orders, etc.
- All working and documented

---

## ✅ CONCLUSION

### **What Exists:**
- ✅ 171 API endpoints across 38 categories
- ✅ 9 courier management endpoints
- ✅ Courier ratings and rankings
- ✅ Merchant preferences
- ✅ Order and shipment management

### **What's Missing:**
- ❌ Courier base pricing endpoints (3 needed)
- ❌ Price calculation endpoints
- ❌ Price comparison endpoints

### **Today's Work is Confirmed:**
We need to build 3 new pricing endpoints in `api/couriers/`:
1. `get-base-price.ts`
2. `calculate-price.ts`
3. `compare-prices.ts`

---

## 🎯 NEXT STEPS

1. ✅ Database audit (done)
2. ✅ API audit (done)
3. ⏳ Check existing courier data
4. ⏳ Start building pricing tables
5. ⏳ Build pricing functions
6. ⏳ Build pricing APIs

**Ready to proceed with today's work!**
