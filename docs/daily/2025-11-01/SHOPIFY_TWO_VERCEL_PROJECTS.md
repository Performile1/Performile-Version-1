# SHOPIFY TWO VERCEL PROJECTS - ARCHITECTURE

**Date:** November 1, 2025, 7:52 PM  
**Status:** ✅ ARCHITECTURE DOCUMENTED

---

## 🏗️ TWO VERCEL PROJECTS SETUP

### **Project 1: Main Performile Platform** 🎯
**URL:** `https://frontend-two-swart-31.vercel.app`

**Purpose:**
- Main web application (React frontend)
- All API endpoints (`/api/*`)
- Database operations
- User authentication
- Order management
- Analytics
- Reviews & ratings

**Deployment:**
- Root `vercel.json` configuration
- Builds from `apps/web/`
- API functions in `api/`

---

### **Project 2: Shopify App** 🛍️
**URL:** `https://performile-delivery-jm98ihmmx-rickard-wigrunds-projects.vercel.app`

**Purpose:**
- Shopify OAuth authentication
- Shopify webhook handling
- Shopify App Bridge integration
- Checkout UI extension hosting

**Deployment:**
- `apps/shopify/performile-delivery/vercel.json`
- Minimal build (serverless functions only)
- No frontend build needed

---

## 🔄 HOW THEY WORK TOGETHER

### **Architecture Flow:**

```
Shopify Store
    ↓
Shopify Checkout
    ↓
Checkout UI Extension (hosted on Project 2)
    ↓
    ├─→ Fetches courier data from: Project 1 API
    │   https://frontend-two-swart-31.vercel.app/api/couriers/ratings-by-postal
    │
    └─→ Sends analytics to: Project 1 API
        https://frontend-two-swart-31.vercel.app/api/courier/checkout-analytics/track
```

### **Key Points:**
1. **Shopify App (Project 2)** handles OAuth and webhooks
2. **Checkout Extension** runs in Shopify checkout (sandboxed)
3. **Extension calls Main Platform API (Project 1)** for data
4. **All business logic** lives in Project 1

---

## ✅ CURRENT CONFIGURATION

### **Checkout Extension API Calls:**
```jsx
// Line 43 in Checkout.jsx
const apiBaseUrl = settings.api_url || 'https://frontend-two-swart-31.vercel.app/api';

// Calls to Project 1:
// 1. GET /api/couriers/ratings-by-postal?postal_code=XXX
// 2. POST /api/courier/checkout-analytics/track
```

**This is CORRECT!** ✅

The checkout extension should call the main platform API, not the Shopify app.

---

## 🔧 WHAT NEEDS TO BE CONFIGURED

### **1. Extension Settings in Shopify Admin**

When you install the extension, configure these settings:

```
api_url: https://frontend-two-swart-31.vercel.app/api
merchant_id: [Your merchant UUID from database]
```

**How to set:**
1. Go to Shopify Admin → Apps → Performile Delivery
2. Click on checkout extension settings
3. Set `api_url` and `merchant_id`

---

### **2. CORS Configuration on Main Platform**

The main platform API must allow requests from Shopify checkout:

**File:** `api/` (middleware or individual endpoints)

```typescript
// Add CORS headers to allow Shopify checkout
res.setHeader('Access-Control-Allow-Origin', '*'); // Or specific Shopify domains
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

**Allowed Origins:**
- `https://*.myshopify.com`
- `https://checkout.shopify.com`
- `https://*.shopifycdn.com`

---

### **3. Network Access in Extension**

**File:** `apps/shopify/performile-delivery/extensions/checkout-ui/shopify.extension.toml`

```toml
[extensions.capabilities]
network_access = true  ✅ Already enabled
api_access = true      ✅ Already enabled
```

**This is already correct!** ✅

---

## 🚨 POTENTIAL ISSUES & FIXES

### **Issue 1: CORS Errors**
**Symptom:** Network errors, blocked requests  
**Cause:** Main platform API not allowing Shopify domains  
**Fix:** Add CORS headers to API endpoints

### **Issue 2: 401 Unauthorized**
**Symptom:** API returns 401  
**Cause:** Missing checkout scopes (FIXED ✅)  
**Status:** Should be resolved after reinstalling app

### **Issue 3: Wrong API URL**
**Symptom:** 404 errors, no data  
**Cause:** Extension using wrong API URL  
**Fix:** Configure `api_url` in extension settings

### **Issue 4: Missing Merchant ID**
**Symptom:** Analytics not tracking  
**Cause:** `merchant_id` not set in extension settings  
**Fix:** Configure `merchant_id` in extension settings

---

## 📋 DEPLOYMENT CHECKLIST

### **Main Platform (Project 1):**
- [x] API endpoints deployed
- [ ] CORS headers configured for Shopify
- [ ] `/api/couriers/ratings-by-postal` working
- [ ] `/api/courier/checkout-analytics/track` working

### **Shopify App (Project 2):**
- [x] OAuth scopes updated (✅ Fixed today)
- [ ] App redeployed with new scopes
- [ ] App reinstalled in Shopify
- [ ] Extension settings configured

### **Testing:**
- [ ] Checkout extension loads
- [ ] API calls successful (200 OK)
- [ ] Real courier data displays
- [ ] Analytics tracking works
- [ ] No CORS errors

---

## 🔍 DEBUGGING TIPS

### **Check API Calls:**
1. Open Shopify checkout
2. Open Chrome DevTools → Network tab
3. Filter by "Fetch/XHR"
4. Look for calls to `frontend-two-swart-31.vercel.app`

**Expected:**
- ✅ Status 200 OK
- ✅ Response has courier data
- ✅ No CORS errors

**If you see errors:**
- 401 → Reinstall app with new scopes
- 404 → Check API endpoint exists
- CORS → Add CORS headers to API
- Network error → Check `api_url` setting

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    SHOPIFY STORE                        │
│  (performile-teststore.myshopify.com)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SHOPIFY CHECKOUT PAGE                      │
│  (checkout.shopify.com)                                 │
│                                                          │
│  ┌────────────────────────────────────────────┐        │
│  │  Checkout UI Extension                     │        │
│  │  (Hosted on Project 2)                     │        │
│  │  performile-delivery-jm98ihmmx...          │        │
│  └────────────────┬───────────────────────────┘        │
└───────────────────┼──────────────────────────────────────┘
                    │
                    │ API Calls
                    ▼
┌─────────────────────────────────────────────────────────┐
│         MAIN PERFORMILE PLATFORM (Project 1)            │
│         frontend-two-swart-31.vercel.app                │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │  API Endpoints                           │          │
│  │  • /api/couriers/ratings-by-postal       │          │
│  │  • /api/courier/checkout-analytics/track │          │
│  └──────────────┬───────────────────────────┘          │
│                 │                                        │
│                 ▼                                        │
│  ┌──────────────────────────────────────────┐          │
│  │  Supabase Database                       │          │
│  │  • couriers                              │          │
│  │  • courier_analytics                     │          │
│  │  • checkout_analytics                    │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ SUMMARY

**Two Projects:**
1. **Main Platform** (frontend-two-swart-31) - All business logic & APIs
2. **Shopify App** (performile-delivery-jm98ihmmx) - OAuth & webhooks

**Data Flow:**
- Checkout extension → Calls main platform API → Returns courier data

**Configuration Needed:**
1. ✅ Add checkout scopes (DONE)
2. ⏳ Reinstall Shopify app
3. ⏳ Configure extension settings (api_url, merchant_id)
4. ⏳ Add CORS headers to main platform API

**Status:** Architecture is correct, just needs configuration!

---

*Created: November 1, 2025, 7:52 PM*  
*Session: Day 6 - Development Session 1*
