# PLUGIN DEPLOYMENT STRATEGY

**Date:** November 5, 2025, 5:56 PM  
**Status:** ARCHITECTURE DECISION  
**Question:** Should each e-commerce plugin have its own Vercel deployment?

---

## 🎯 CURRENT ARCHITECTURE

### **Existing Deployments:**

#### **1. Main Platform** ✅
- **URL:** `https://frontend-two-swart-31.vercel.app`
- **Purpose:** Main web app + API
- **Location:** Root project
- **Serves:**
  - React frontend (`apps/web/`)
  - All API endpoints (`api/`)
  - Database operations
  - Authentication
  - Analytics

#### **2. Shopify App** ✅
- **URL:** `https://performile-delivery-jm98ihmmx-rickard-wigrunds-projects.vercel.app`
- **Purpose:** Shopify-specific backend
- **Location:** `apps/shopify/performile-delivery/`
- **Serves:**
  - Shopify OAuth
  - Shopify webhooks
  - App Bridge integration
  - Checkout UI extension

---

## 💡 RECOMMENDED STRATEGY

### **YES - Separate Deployments for Each Platform** ⭐

**Reasoning:**

#### **1. WooCommerce Plugin** 
**Deployment:** ❌ **NOT NEEDED**
- **Type:** PHP plugin (runs on WordPress server)
- **Distribution:** WordPress.org plugin directory
- **No Vercel needed:** Plugin runs on merchant's WordPress installation
- **API Calls:** Points to main platform API

#### **2. Shopify App**
**Deployment:** ✅ **SEPARATE VERCEL** (Already exists)
- **Type:** Node.js serverless app
- **Requires:** OAuth, webhooks, App Bridge
- **Why Separate:** Shopify-specific authentication flow
- **URL:** `performile-shopify.vercel.app` (recommended rename)

#### **3. Magento Extension**
**Deployment:** ❌ **NOT NEEDED**
- **Type:** PHP extension (runs on Magento server)
- **Distribution:** Magento Marketplace
- **No Vercel needed:** Extension runs on merchant's Magento installation
- **API Calls:** Points to main platform API

#### **4. PrestaShop Module**
**Deployment:** ❌ **NOT NEEDED**
- **Type:** PHP module (runs on PrestaShop server)
- **Distribution:** PrestaShop Addons
- **No Vercel needed:** Module runs on merchant's PrestaShop installation
- **API Calls:** Points to main platform API

#### **5. BigCommerce App**
**Deployment:** ✅ **SEPARATE VERCEL RECOMMENDED**
- **Type:** Node.js serverless app
- **Requires:** OAuth, webhooks, API integration
- **Why Separate:** BigCommerce-specific authentication
- **URL:** `performile-bigcommerce.vercel.app`

#### **6. Wix App**
**Deployment:** ✅ **SEPARATE VERCEL RECOMMENDED**
- **Type:** Node.js serverless app
- **Requires:** OAuth, webhooks, Velo integration
- **Why Separate:** Wix-specific authentication
- **URL:** `performile-wix.vercel.app`

---

## 📊 DEPLOYMENT MATRIX

| Platform | Type | Deployment | Vercel Needed | Distribution |
|----------|------|------------|---------------|--------------|
| **Main Platform** | React + API | Vercel | ✅ Yes | Direct |
| **WooCommerce** | PHP Plugin | WordPress | ❌ No | WordPress.org |
| **Shopify** | Node.js App | Vercel | ✅ Yes | Shopify App Store |
| **Magento** | PHP Extension | Magento | ❌ No | Magento Marketplace |
| **PrestaShop** | PHP Module | PrestaShop | ❌ No | PrestaShop Addons |
| **OpenCart** | PHP Extension | OpenCart | ❌ No | OpenCart Marketplace |
| **BigCommerce** | Node.js App | Vercel | ✅ Yes | BigCommerce App Store |
| **Wix** | Node.js App | Vercel | ✅ Yes | Wix App Market |
| **Squarespace** | JavaScript | Squarespace | ❌ No | Squarespace Extensions |
| **Ecwid** | JavaScript | Ecwid | ❌ No | Ecwid App Market |

---

## 🏗️ RECOMMENDED ARCHITECTURE

### **Vercel Projects Needed:**

```
1. performile-platform.vercel.app
   └── Main web app + API
   
2. performile-shopify.vercel.app
   └── Shopify OAuth + webhooks
   
3. performile-bigcommerce.vercel.app
   └── BigCommerce OAuth + webhooks
   
4. performile-wix.vercel.app
   └── Wix OAuth + webhooks
```

### **Self-Hosted Plugins (No Vercel):**

```
WooCommerce Plugin
├── Runs on merchant's WordPress
├── Calls: performile-platform.vercel.app/api
└── Distributed via WordPress.org

Magento Extension
├── Runs on merchant's Magento
├── Calls: performile-platform.vercel.app/api
└── Distributed via Magento Marketplace

PrestaShop Module
├── Runs on merchant's PrestaShop
├── Calls: performile-platform.vercel.app/api
└── Distributed via PrestaShop Addons
```

---

## 🎯 WHY THIS APPROACH?

### **PHP-Based Platforms (No Vercel):**
✅ **Advantages:**
- Runs on merchant's server (no hosting cost for us)
- Easier installation (upload & activate)
- Better performance (local execution)
- No OAuth complexity
- Simpler maintenance

❌ **No Need for Vercel:**
- PHP runs on their server
- No serverless functions needed
- Direct API calls to main platform

### **SaaS Platforms (Separate Vercel):**
✅ **Advantages:**
- OAuth authentication required
- Webhook handling needed
- App-specific logic
- Isolated from main platform
- Independent scaling
- Easier debugging

✅ **Need Vercel:**
- OAuth flows (Shopify, BigCommerce, Wix)
- Webhook endpoints
- App Bridge integration
- Session management

---

## 💰 COST ANALYSIS

### **Current Setup:**
- Main Platform: Free tier (Hobby)
- Shopify App: Free tier (Hobby)
- **Total:** $0/month

### **Recommended Setup:**
- Main Platform: Free tier
- Shopify App: Free tier
- BigCommerce App: Free tier (when built)
- Wix App: Free tier (when built)
- **Total:** $0/month (within Vercel limits)

### **If We Need Pro:**
- Vercel Pro: $20/month per project
- 4 projects × $20 = $80/month
- **But:** Only if we exceed free tier limits

---

## 📝 IMPLEMENTATION PLAN

### **Phase 1: Current (Week 2)** ✅
- ✅ Main Platform deployed
- ✅ Shopify App deployed
- ✅ WooCommerce Plugin (no deployment needed)

### **Phase 2: Week 3**
- [ ] Rename Shopify Vercel project to `performile-shopify`
- [ ] Update Shopify app URLs
- [ ] Test Shopify OAuth flow
- [ ] Document Shopify deployment

### **Phase 3: Week 4-5**
- [ ] Create `performile-bigcommerce` Vercel project
- [ ] Build BigCommerce app
- [ ] Deploy and test
- [ ] Submit to BigCommerce App Store

### **Phase 4: Week 6-7**
- [ ] Create `performile-wix` Vercel project
- [ ] Build Wix app
- [ ] Deploy and test
- [ ] Submit to Wix App Market

---

## 🔧 CONFIGURATION

### **Main Platform (`vercel.json`):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/web/package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/apps/web/$1"
    }
  ]
}
```

### **Shopify App (`apps/shopify/performile-delivery/vercel.json`):**
```json
{
  "version": 2,
  "buildCommand": "echo 'No build needed'",
  "outputDirectory": ".",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

### **WooCommerce Plugin (No `vercel.json`):**
```php
// Just points to main API
define('PERFORMILE_API_URL', 'https://performile-platform.vercel.app/api');
```

---

## 🚀 DEPLOYMENT WORKFLOW

### **For PHP Plugins (WooCommerce, Magento, PrestaShop):**
1. Develop locally
2. Test with local WordPress/Magento/PrestaShop
3. Create plugin ZIP file
4. Submit to marketplace
5. Users install on their servers
6. Plugin calls main platform API

### **For SaaS Apps (Shopify, BigCommerce, Wix):**
1. Develop locally
2. Test with development store
3. Deploy to Vercel (separate project)
4. Configure OAuth credentials
5. Submit to app store
6. Users install via app store
7. App handles OAuth and webhooks

---

## 📊 SUMMARY

### **Vercel Deployments Needed:**
- ✅ Main Platform (1)
- ✅ Shopify App (1)
- ⏳ BigCommerce App (1) - Future
- ⏳ Wix App (1) - Future
- **Total:** 4 Vercel projects

### **No Vercel Needed:**
- WooCommerce (PHP)
- Magento (PHP)
- PrestaShop (PHP)
- OpenCart (PHP)
- Squarespace (JavaScript on their platform)
- Ecwid (JavaScript on their platform)

### **Cost:**
- **Current:** $0/month (free tier)
- **Future:** $0/month (still within limits)
- **If Needed:** $80/month (Pro tier for 4 projects)

---

## ✅ DECISION

**YES - Use separate Vercel deployments for:**
- ✅ Shopify (OAuth required)
- ✅ BigCommerce (OAuth required)
- ✅ Wix (OAuth required)

**NO - Don't use Vercel for:**
- ❌ WooCommerce (PHP plugin)
- ❌ Magento (PHP extension)
- ❌ PrestaShop (PHP module)
- ❌ OpenCart (PHP extension)

**Reasoning:** 
- PHP plugins run on merchant's server
- SaaS apps need OAuth and webhooks
- Separate deployments = better isolation
- Free tier covers all our needs

---

**Status:** ✅ ARCHITECTURE CONFIRMED  
**Next:** Implement as plugins are built  
**Cost:** $0/month (within free tier limits)
