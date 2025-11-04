# CHECKOUT ENHANCEMENT PLAN - November 4, 2025

**Date:** November 4, 2025, 4:27 PM  
**Session:** Week 2 Day 2 Afternoon  
**Priority:** HIGH  
**Timeline:** Week 2-3 (Nov 4-15)

---

## 🎯 OBJECTIVES

### **Primary Goals:**
1. ✅ Add pricing settings (set margins on courier prices)
2. ✅ Add courier logos in checkout
3. ✅ Plan integrations for 13 e-commerce platforms
4. ✅ Plan integrations for 12 payment gateways

---

## 📋 FEATURE 1: PRICING & MARGINS SETTINGS

### **Business Requirement:**
Merchants need to add margins on top of courier prices for all services.

### **User Story:**
> As a merchant, I want to set custom pricing margins on courier delivery services so that I can add my handling fees and profit margins to the delivery cost shown to customers.

### **Features:**
1. **Global Margin Settings**
   - Set default margin % for all couriers
   - Set default fixed amount for all couriers
   - Choose margin type: percentage or fixed

2. **Per-Courier Margin Settings**
   - Override global settings per courier
   - Different margins for different couriers
   - Example: DHL +20%, PostNord +15%

3. **Per-Service Margin Settings**
   - Different margins for different service types
   - Example: Express +25%, Standard +15%, Economy +10%

4. **Margin Preview**
   - Show original price vs. final price
   - Calculate profit per delivery
   - Monthly revenue projections

### **Database Schema:**

```sql
-- Add to merchant_courier_selections table
ALTER TABLE merchant_courier_selections
ADD COLUMN IF NOT EXISTS margin_type VARCHAR(20) DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS margin_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS round_to DECIMAL(10,2) DEFAULT 1.00;

-- Add global pricing settings table
CREATE TABLE IF NOT EXISTS merchant_pricing_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id),
    
    -- Global margins
    default_margin_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
    default_margin_value DECIMAL(10,2) DEFAULT 0,
    
    -- Price rounding
    round_prices BOOLEAN DEFAULT true,
    round_to DECIMAL(10,2) DEFAULT 1.00, -- Round to nearest 1.00, 5.00, 10.00
    
    -- Price limits
    min_delivery_price DECIMAL(10,2),
    max_delivery_price DECIMAL(10,2),
    
    -- Display settings
    show_original_price BOOLEAN DEFAULT false,
    show_savings BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(merchant_id)
);

-- Enable RLS
ALTER TABLE merchant_pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "merchant_pricing_settings_select" 
ON merchant_pricing_settings FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "merchant_pricing_settings_insert" 
ON merchant_pricing_settings FOR INSERT 
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "merchant_pricing_settings_update" 
ON merchant_pricing_settings FOR UPDATE 
USING (merchant_id = auth.uid());

-- Service-specific margins
CREATE TABLE IF NOT EXISTS courier_service_margins (
    margin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    service_type VARCHAR(50) NOT NULL, -- 'express', 'standard', 'economy', 'same_day'
    
    -- Margin settings
    margin_type VARCHAR(20) DEFAULT 'percentage',
    margin_value DECIMAL(10,2) DEFAULT 0,
    
    -- Price overrides
    fixed_price DECIMAL(10,2), -- Override with fixed price
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(merchant_id, courier_id, service_type)
);

-- Enable RLS
ALTER TABLE courier_service_margins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "courier_service_margins_select" 
ON courier_service_margins FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "courier_service_margins_insert" 
ON courier_service_margins FOR INSERT 
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "courier_service_margins_update" 
ON courier_service_margins FOR UPDATE 
USING (merchant_id = auth.uid());
```

### **API Endpoints:**

```typescript
// GET /api/merchant/pricing-settings
// Get merchant pricing settings
interface PricingSettings {
  default_margin_type: 'percentage' | 'fixed';
  default_margin_value: number;
  round_prices: boolean;
  round_to: number;
  min_delivery_price?: number;
  max_delivery_price?: number;
  show_original_price: boolean;
  show_savings: boolean;
}

// POST /api/merchant/pricing-settings
// Update pricing settings
{
  default_margin_type: 'percentage',
  default_margin_value: 15,
  round_prices: true,
  round_to: 5.00
}

// GET /api/merchant/courier-margins
// Get all courier-specific margins
interface CourierMargin {
  courier_id: string;
  courier_name: string;
  margin_type: 'percentage' | 'fixed';
  margin_value: number;
  services: ServiceMargin[];
}

// POST /api/merchant/courier-margins
// Update courier-specific margins
{
  courier_id: 'uuid',
  margin_type: 'percentage',
  margin_value: 20,
  services: [
    { service_type: 'express', margin_value: 25 },
    { service_type: 'standard', margin_value: 15 }
  ]
}

// POST /api/merchant/calculate-price
// Calculate final price with margins
{
  courier_id: 'uuid',
  service_type: 'express',
  base_price: 65.00
}
// Returns:
{
  base_price: 65.00,
  margin_amount: 13.00,
  final_price: 78.00,
  rounded_price: 80.00
}
```

### **UI Components:**

**Location:** Settings → Pricing

**Sections:**
1. **Global Pricing Settings**
   - Default margin type (dropdown)
   - Default margin value (input)
   - Price rounding options
   - Min/max price limits

2. **Courier-Specific Margins**
   - Table of all selected couriers
   - Edit margin per courier
   - Preview calculated prices

3. **Service-Specific Margins**
   - Expandable per courier
   - Different margins for Express, Standard, Economy
   - Override with fixed prices

4. **Price Preview**
   - Sample calculations
   - Monthly revenue projection
   - Profit margin analysis

---

## 📋 FEATURE 2: COURIER LOGOS IN CHECKOUT

### **Business Requirement:**
Display courier logos in checkout for better brand recognition and trust.

### **Implementation:**

#### **1. Logo Storage:**

```sql
-- Add logo URL to couriers table
ALTER TABLE couriers
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_dark_url TEXT, -- For dark mode
ADD COLUMN IF NOT EXISTS logo_square_url TEXT, -- Square version
ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7); -- Hex color
```

#### **2. Logo Assets:**

**Location:** `apps/web/public/images/couriers/`

**Required Logos:**
- DHL: `dhl-logo.svg`, `dhl-logo-dark.svg`
- PostNord: `postnord-logo.svg`, `postnord-logo-dark.svg`
- Bring: `bring-logo.svg`, `bring-logo-dark.svg`
- UPS: `ups-logo.svg`, `ups-logo-dark.svg`
- FedEx: `fedex-logo.svg`, `fedex-logo-dark.svg`
- Instabox: `instabox-logo.svg`, `instabox-logo-dark.svg`
- Budbee: `budbee-logo.svg`, `budbee-logo-dark.svg`
- Porterbuddy: `porterbuddy-logo.svg`, `porterbuddy-logo-dark.svg`

**Specifications:**
- Format: SVG (preferred) or PNG (fallback)
- Size: 120x40px (3:1 ratio)
- Background: Transparent
- Quality: High resolution

#### **3. UI Updates:**

**CheckoutDemo.tsx:**
```typescript
// Add logo to CourierOption interface
interface CourierOption {
  // ... existing fields
  logo_url?: string;
  logo_dark_url?: string;
  brand_color?: string;
}

// Update courier cards to show logos
<Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
  {courier.logo_url && (
    <img 
      src={courier.logo_url} 
      alt={courier.courier_name}
      style={{ height: 40, marginRight: 16 }}
    />
  )}
  <Typography variant="h6">{courier.courier_name}</Typography>
</Box>
```

**CourierComparisonView.tsx:**
- Add logo display in courier cards
- Responsive logo sizing
- Fallback to courier name if logo missing
- Dark mode support

---

## 📋 FEATURE 3: E-COMMERCE PLATFORM INTEGRATIONS

### **Target Platforms (13):**

#### **1. WooCommerce** ✅ (Already Started)
**Status:** 90% Complete  
**Location:** `plugins/woocommerce/performile-delivery/`  
**Priority:** P0 (Complete this week)

**Remaining Work:**
- [ ] Add pricing margins to settings
- [ ] Add courier logo display
- [ ] Test with WooCommerce 8.x
- [ ] Submit to WordPress.org

---

#### **2. Shopify** ✅ (Already Started)
**Status:** 80% Complete  
**Location:** `apps/shopify/performile-delivery/`  
**Priority:** P0 (Complete this week)

**Remaining Work:**
- [ ] Add pricing margins to admin
- [ ] Add courier logos to checkout
- [ ] Test with Shopify Checkout Extensions
- [ ] Submit to Shopify App Store

---

#### **3. PrestaShop**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Medium

**Implementation Plan:**
```
plugins/prestashop/performile-delivery/
├── performile.php (Main module file)
├── config.xml (Module configuration)
├── controllers/
│   ├── front/
│   │   └── checkout.php
│   └── admin/
│       └── AdminPerformileController.php
├── views/
│   ├── templates/
│   │   ├── front/
│   │   │   └── checkout.tpl
│   │   └── admin/
│   │       └── configure.tpl
│   └── css/
│       └── performile.css
└── translations/
    ├── en.php
    └── no.php
```

**Key Features:**
- Hook into `displayCarrier` for checkout
- Admin panel for settings
- Multi-store support
- Multi-language support

---

#### **4. OpenCart**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Medium

**Implementation Plan:**
```
plugins/opencart/performile-delivery/
├── upload/
│   ├── admin/
│   │   ├── controller/extension/shipping/performile.php
│   │   ├── language/en-gb/extension/shipping/performile.php
│   │   └── view/template/extension/shipping/performile.tpl
│   └── catalog/
│       ├── controller/extension/shipping/performile.php
│       ├── language/en-gb/extension/shipping/performile.php
│       └── model/extension/shipping/performile.php
└── install.xml
```

**Key Features:**
- Shipping method integration
- Admin configuration
- Multi-store support
- OpenCart 3.x and 4.x compatibility

---

#### **5. Ecwid**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Low (API-based)

**Implementation Plan:**
- Ecwid App using OAuth
- Webhook integration
- Shipping rate calculation API
- Admin panel in Ecwid dashboard

**API Integration:**
```javascript
// Ecwid Shipping Rate API
POST https://app.ecwid.com/api/v3/{store_id}/shipping/rates
{
  "origin": {...},
  "destination": {...},
  "items": [...],
  "performile_merchant_id": "uuid"
}
```

---

#### **6. Magento**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** High

**Implementation Plan:**
```
plugins/magento/Performile/Delivery/
├── etc/
│   ├── module.xml
│   ├── config.xml
│   └── di.xml
├── Model/
│   ├── Carrier/
│   │   └── Performile.php
│   └── Config/
│       └── Source/
├── Controller/
│   └── Adminhtml/
├── view/
│   ├── adminhtml/
│   └── frontend/
└── registration.php
```

**Key Features:**
- Magento 2.4+ support
- Carrier integration
- Admin configuration
- Multi-store support
- GraphQL API support

---

#### **7. Norce (Jetshop)**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- API integration (Norce Commerce API)
- Webhook for order events
- Shipping provider plugin
- Admin configuration in Norce

---

#### **8. Viskan**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Viskan API integration
- Custom shipping module
- Admin panel integration

---

#### **9. Askås**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Askås API integration
- Shipping method plugin
- Configuration interface

---

#### **10. Wikinggruppen**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Wikinggruppen platform integration
- Custom shipping module
- Admin configuration

---

#### **11. Rakuten**
**Status:** Not Started  
**Priority:** P3 (Week 5)  
**Complexity:** High

**Implementation:**
- Rakuten Marketplace API
- Shipping service integration
- Multi-region support

---

#### **12. Shopware**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation Plan:**
```
plugins/shopware/PerformileDelivery/
├── src/
│   ├── Core/
│   │   └── Checkout/
│   │       └── Shipping/
│   ├── Resources/
│   │   ├── config/
│   │   └── views/
│   └── PerformileDelivery.php
└── composer.json
```

**Key Features:**
- Shopware 6 plugin
- Shipping method integration
- Admin module
- Rule builder integration

---

#### **13. Abicart**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Abicart API integration
- Shipping provider module
- Admin configuration

---

#### **14. Squarespace**
**Status:** Not Started  
**Priority:** P3 (Week 5)  
**Complexity:** Low (Limited API)

**Implementation:**
- Squarespace Commerce API
- Webhook integration
- Limited customization (Squarespace restrictions)

---

## 📋 FEATURE 4: PAYMENT GATEWAY INTEGRATIONS

### **Target Payment Gateways (12):**

#### **1. Klarna**
**Status:** Not Started  
**Priority:** P0 (Week 2)  
**Complexity:** High

**Implementation:**
- Klarna Checkout API v3
- Klarna Payments API
- Shipping options integration
- Order management

**API Endpoints:**
```typescript
POST /api/payment/klarna/create-session
POST /api/payment/klarna/update-shipping
POST /api/payment/klarna/confirm-order
```

---

#### **2. Kustom (Collector Bank)**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Medium

**Implementation:**
- Collector Checkout API
- Shipping method integration
- Order confirmation

---

#### **3. Qliro**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Medium

**Implementation:**
- Qliro One API
- Checkout integration
- Shipping options

---

#### **4. Walley (formerly Collector)**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Medium

**Implementation:**
- Walley Checkout API
- Payment and shipping integration

---

#### **5. Adyen**
**Status:** Not Started  
**Priority:** P0 (Week 2)  
**Complexity:** High

**Implementation:**
- Adyen Checkout API
- Payment methods
- Shipping integration
- Webhook handling

---

#### **6. Stripe** ✅ (Partially Implemented)
**Status:** 60% Complete  
**Priority:** P0 (Week 2)  
**Complexity:** Medium

**Remaining Work:**
- [ ] Add shipping rate calculation
- [ ] Integrate with Stripe Checkout
- [ ] Add webhook for order updates

---

#### **7. PayPal**
**Status:** Not Started  
**Priority:** P1 (Week 3)  
**Complexity:** Medium

**Implementation:**
- PayPal Checkout SDK
- Shipping options API
- Order tracking integration

---

#### **8. Amazon Pay**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Amazon Pay API
- Shipping address validation
- Order management

---

#### **9. Shopify Payments**
**Status:** Integrated with Shopify App  
**Priority:** P0 (Week 2)  
**Complexity:** Low

**Implementation:**
- Already integrated via Shopify app
- No additional work needed

---

#### **10. Worldpay**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Worldpay API integration
- Shipping method support

---

#### **11. Afterpay**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Afterpay API
- Checkout integration
- Shipping options

---

#### **12. Affirm**
**Status:** Not Started  
**Priority:** P2 (Week 4)  
**Complexity:** Medium

**Implementation:**
- Affirm Checkout API
- Shipping integration

---

## 📊 IMPLEMENTATION TIMELINE

### **Week 2 (Nov 4-8): Immediate Priorities**

**Day 2-3 (Nov 4-5):**
- [ ] Design pricing settings UI
- [ ] Create database migrations for pricing
- [ ] Build pricing settings page
- [ ] Add courier logos to checkout
- [ ] Update WooCommerce plugin with pricing

**Day 4-5 (Nov 6-8):**
- [ ] Complete WooCommerce plugin (100%)
- [ ] Complete Shopify app (100%)
- [ ] Test pricing margins end-to-end
- [ ] Test courier logos in checkout

---

### **Week 3 (Nov 11-15): Core Integrations**

**E-Commerce Platforms:**
- [ ] PrestaShop plugin (80%)
- [ ] OpenCart extension (80%)
- [ ] Ecwid app (80%)

**Payment Gateways:**
- [ ] Klarna integration (100%)
- [ ] Adyen integration (100%)
- [ ] Stripe completion (100%)
- [ ] Kustom integration (80%)
- [ ] Qliro integration (80%)
- [ ] Walley integration (80%)

---

### **Week 4 (Nov 18-22): Extended Integrations**

**E-Commerce Platforms:**
- [ ] Magento extension (80%)
- [ ] Shopware plugin (80%)
- [ ] Norce integration (60%)
- [ ] Viskan integration (60%)
- [ ] Askås integration (60%)
- [ ] Wikinggruppen integration (60%)
- [ ] Abicart integration (60%)

**Payment Gateways:**
- [ ] PayPal integration (100%)
- [ ] Amazon Pay integration (80%)
- [ ] Worldpay integration (60%)
- [ ] Afterpay integration (60%)
- [ ] Affirm integration (60%)

---

### **Week 5 (Nov 25-29): Final Polish**

**E-Commerce Platforms:**
- [ ] Rakuten integration (60%)
- [ ] Squarespace integration (40%)
- [ ] Complete all platform testing
- [ ] Documentation for all platforms

**Payment Gateways:**
- [ ] Complete all gateway testing
- [ ] Documentation for all gateways
- [ ] Integration guides

---

## 📁 PROJECT STRUCTURE

```
performile-platform/
├── plugins/
│   ├── woocommerce/
│   │   └── performile-delivery/ ✅ (90% complete)
│   ├── shopify/ (moved to apps/shopify)
│   ├── prestashop/
│   │   └── performile-delivery/ (to create)
│   ├── opencart/
│   │   └── performile-delivery/ (to create)
│   ├── magento/
│   │   └── Performile/Delivery/ (to create)
│   ├── shopware/
│   │   └── PerformileDelivery/ (to create)
│   └── [other platforms]/
├── apps/
│   ├── shopify/
│   │   └── performile-delivery/ ✅ (80% complete)
│   └── web/
│       └── src/
│           ├── pages/
│           │   ├── CheckoutDemo.tsx ✅
│           │   └── settings/
│           │       └── PricingSettings.tsx (to create)
│           └── components/
│               └── checkout/
│                   └── CourierComparisonView.tsx ✅
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── pricing-settings.ts (to create)
│       │   └── payment-gateways/ (to create)
│       └── integrations/
│           ├── ecommerce/ (to create)
│           └── payments/ (to create)
└── database/
    └── migrations/
        ├── add_pricing_settings.sql (to create)
        └── add_courier_logos.sql (to create)
```

---

## 🎯 SUCCESS CRITERIA

### **Pricing & Margins:**
- [ ] Merchants can set global margin %
- [ ] Merchants can set per-courier margins
- [ ] Merchants can set per-service margins
- [ ] Prices calculate correctly in checkout
- [ ] Prices round correctly
- [ ] Preview shows accurate calculations

### **Courier Logos:**
- [ ] All 8 courier logos added
- [ ] Logos display in checkout
- [ ] Logos work in light/dark mode
- [ ] Fallback works if logo missing
- [ ] Responsive on mobile

### **E-Commerce Integrations:**
- [ ] WooCommerce: 100% complete
- [ ] Shopify: 100% complete
- [ ] PrestaShop: 80% complete
- [ ] OpenCart: 80% complete
- [ ] Ecwid: 80% complete
- [ ] Others: 60%+ complete

### **Payment Gateways:**
- [ ] Klarna: 100% complete
- [ ] Adyen: 100% complete
- [ ] Stripe: 100% complete
- [ ] Others: 80%+ complete

---

## 📝 NEXT STEPS

### **Immediate (Today - Nov 4):**
1. ✅ Create this planning document
2. [ ] Design pricing settings UI mockups
3. [ ] Create database migration for pricing
4. [ ] Start pricing settings page

### **Tomorrow (Nov 5):**
1. [ ] Complete pricing settings page
2. [ ] Add courier logos to assets
3. [ ] Update checkout to show logos
4. [ ] Test pricing calculations

### **This Week (Nov 6-8):**
1. [ ] Complete WooCommerce plugin
2. [ ] Complete Shopify app
3. [ ] Start PrestaShop plugin
4. [ ] Start Klarna integration

---

## 💰 BUDGET ALLOCATION

**Week 2 Budget:** $2,000

**Breakdown:**
- Pricing & Margins Feature: $400 (20%)
- Courier Logos: $200 (10%)
- WooCommerce Completion: $300 (15%)
- Shopify Completion: $300 (15%)
- Payment Gateway Planning: $400 (20%)
- Testing & QA: $400 (20%)

**Week 3 Budget:** $1,000 (Marketing Prep)
- Platform integrations: $600
- Payment gateway integrations: $400

---

## 🎉 EXPECTED OUTCOMES

### **By End of Week 2:**
- ✅ Merchants can set custom pricing
- ✅ Checkout shows courier logos
- ✅ WooCommerce plugin ready for launch
- ✅ Shopify app ready for launch

### **By End of Week 3:**
- ✅ 5+ e-commerce platforms integrated
- ✅ 6+ payment gateways integrated
- ✅ Beta merchants can test integrations

### **By Launch (Dec 9):**
- ✅ 10+ e-commerce platforms available
- ✅ 10+ payment gateways available
- ✅ Complete documentation
- ✅ Integration guides published

---

*Plan Created: November 4, 2025, 4:27 PM*  
*Status: Ready to Execute*  
*Priority: HIGH*  
*Timeline: Week 2-5 (Nov 4 - Dec 6)*
