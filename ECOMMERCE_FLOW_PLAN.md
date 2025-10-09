# Performile E-commerce Integration Flow & Strategic Features

**Created:** October 9, 2025, 08:38  
**Status:** Strategic Planning  
**Priority:** Core Revenue Features

---

## 🔄 COMPLETE E-COMMERCE ORDER FLOW

### **Phase 1: Order Creation**
```
E-commerce Platform (Shopify/WooCommerce/etc.)
  ↓
Order Created Event
  ↓
Webhook → /api/webhooks/ecommerce
  ↓
Performile receives:
  - Order ID
  - Customer info (email, name, address)
  - Items & value
  - Selected courier (if any)
  - Shipping method
  ↓
Store in `orders` table
Create `delivery_requests` entry
```

**Current Status:** ✅ IMPLEMENTED  
**What We Have:**
- Webhook handlers for 7 platforms
- Order creation automation
- Basic data capture

**What's Missing:**
- ❌ Parcel size/weight capture
- ❌ Shipping cost capture
- ❌ Customer courier preference tracking

---

### **Phase 2: Order Updates (Before TMS/TMS Integration)**
```
E-commerce Platform
  ↓
Order Status Updated (Processing → Shipped)
  ↓
Webhook → /api/webhooks/order-update
  ↓
Performile receives:
  - Tracking number
  - Courier name
  - Shipment date
  - Estimated delivery date
  ↓
Update `orders` table:
  - tracking_number
  - courier_id (match by name)
  - order_status = 'shipped'
  - shipment_date
  ↓
Trigger tracking listener
```

**Current Status:** ⚠️ PARTIALLY IMPLEMENTED  
**What We Have:**
- Order status updates via webhooks
- Tracking number capture

**What's Missing:**
- ❌ Real-time tracking number detection
- ❌ Automatic courier matching by tracking format
- ❌ Shipment date capture
- ❌ Integration with merchant's TMS (if they use one)

**Tasks to Implement:**
- [ ] Create `/api/webhooks/order-update` endpoint
- [ ] Add tracking number validation
- [ ] Build courier auto-detection (by tracking format)
- [ ] Add shipment_date field to orders table
- [ ] Handle TMS integration (ShipStation, Shippo, etc.)

**Estimated Time:** 4 hours

---

### **Phase 3: Tracking Updates (Courier API Integration)**
```
Tracking Number Added
  ↓
Identify Courier (by tracking format or explicit selection)
  ↓
Start Polling Courier Tracking API
  ↓
Every 6 hours:
  - Call courier tracking API
  - Get status updates
  - Store in `tracking_events` table
  ↓
When status = 'delivered':
  - Update order_status = 'delivered'
  - Set delivery_date
  - Trigger review request (immediate or +5 days)
```

**Current Status:** ⚠️ PARTIALLY IMPLEMENTED  
**What We Have:**
- 4 courier tracking APIs integrated (PostNord, DHL, Bring, Budbee)
- Basic tracking endpoint `/api/tracking/:trackingNumber`

**What's Missing:**
- ❌ Automatic polling system (cron job)
- ❌ `tracking_events` table for history
- ❌ Delivery confirmation detection
- ❌ Real-time webhook support (where available)

**Tasks to Implement:**
- [ ] Create `tracking_events` table
- [ ] Build cron job for polling (every 6 hours)
- [ ] Add delivery detection logic
- [ ] Implement webhook receivers for couriers that support it
- [ ] Add retry logic for failed API calls
- [ ] Store tracking history for analytics

**Estimated Time:** 6 hours

---

### **Phase 4: Review Request (Fallback System)**
```
IF tracking API provides delivery confirmation:
  ↓
  Wait 1 day after delivery
  ↓
  Send review request
ELSE IF no tracking updates for 5 days:
  ↓
  Assume delivered
  ↓
  Send review request
  ↓
  Email or E-commerce platform notification
```

**Current Status:** ⚠️ PARTIALLY IMPLEMENTED  
**What We Have:**
- Review request email templates
- Manual review submission endpoint
- Cron job for sending reminders

**What's Missing:**
- ❌ Smart timing (1 day after delivery vs 5 days no update)
- ❌ E-commerce platform notification integration
- ❌ SMS review requests (for higher response rate)
- ❌ In-app review requests (if merchant has mobile app)

**Tasks to Implement:**
- [ ] Add delivery_date tracking
- [ ] Create smart review timing logic
- [ ] Integrate with e-commerce email systems (use their templates)
- [ ] Add SMS option (Twilio integration)
- [ ] Build review request analytics (open rate, response rate)

**Estimated Time:** 5 hours

---

## 📊 PERFORMILE MERCHANT INTELLIGENCE SYSTEM

### **1. Merchant Checkout & Settings Tracking**

#### **Data to Capture:**
```javascript
merchant_settings: {
  merchant_id: uuid,
  store_id: uuid,
  
  // Courier Configuration
  enabled_couriers: [
    {
      courier_id: uuid,
      courier_name: string,
      is_default: boolean,
      priority: integer,
      min_order_value: decimal,
      max_order_value: decimal,
      allowed_countries: [string],
      allowed_postal_codes: [string],
      pricing_rules: {
        base_rate: decimal,
        per_kg_rate: decimal,
        per_km_rate: decimal,
        insurance_rate: decimal
      }
    }
  ],
  
  // Shipping Configuration
  shipping_zones: [
    {
      zone_name: string,
      countries: [string],
      postal_code_ranges: [string],
      available_couriers: [uuid],
      default_courier: uuid
    }
  ],
  
  // Parcel Configuration
  default_parcel_settings: {
    weight_unit: 'kg' | 'lb',
    dimension_unit: 'cm' | 'in',
    default_weight: decimal,
    default_length: decimal,
    default_width: decimal,
    default_height: decimal
  },
  
  // Review Settings
  review_settings: {
    auto_send: boolean,
    send_delay_days: integer,
    send_via: 'email' | 'sms' | 'both',
    use_merchant_branding: boolean,
    custom_message: string
  },
  
  // Analytics Preferences
  analytics_settings: {
    track_conversion: boolean,
    track_cart_abandonment: boolean,
    track_courier_performance: boolean,
    share_data_with_couriers: boolean
  }
}
```

**Database Table Needed:**
```sql
CREATE TABLE merchant_settings (
  setting_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES users(user_id),
  store_id UUID REFERENCES stores(store_id),
  enabled_couriers JSONB,
  shipping_zones JSONB,
  parcel_settings JSONB,
  review_settings JSONB,
  analytics_settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks to Implement:**
- [ ] Create merchant_settings table
- [ ] Build settings management UI
- [ ] Add courier selection wizard
- [ ] Create shipping zone configurator
- [ ] Add parcel defaults form
- [ ] Build review settings page

**Estimated Time:** 8 hours

---

### **2. Courier Usage Analytics**

#### **Track for Each Merchant:**
```javascript
courier_usage_analytics: {
  merchant_id: uuid,
  period: 'daily' | 'weekly' | 'monthly',
  
  courier_stats: [
    {
      courier_id: uuid,
      courier_name: string,
      
      // Volume
      total_shipments: integer,
      percentage_of_total: decimal,
      
      // Geography
      countries_shipped_to: [string],
      top_destinations: [
        { country: string, city: string, count: integer }
      ],
      
      // Parcel Data
      avg_weight_kg: decimal,
      avg_dimensions: { length, width, height },
      weight_distribution: {
        '0-1kg': integer,
        '1-5kg': integer,
        '5-10kg': integer,
        '10-20kg': integer,
        '20+kg': integer
      },
      
      // Performance
      avg_delivery_days: decimal,
      on_time_rate: decimal,
      customer_satisfaction: decimal,
      issue_rate: decimal,
      
      // Cost
      total_shipping_cost: decimal,
      avg_cost_per_shipment: decimal,
      cost_per_kg: decimal,
      
      // Trends
      volume_trend: 'increasing' | 'stable' | 'decreasing',
      cost_trend: 'increasing' | 'stable' | 'decreasing'
    }
  ],
  
  // Recommendations
  recommendations: [
    {
      type: 'cost_savings' | 'performance' | 'coverage',
      message: string,
      potential_savings: decimal,
      alternative_courier: uuid
    }
  ]
}
```

**Database Table Needed:**
```sql
CREATE TABLE merchant_courier_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES users(user_id),
  period_start DATE,
  period_end DATE,
  courier_stats JSONB,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks to Implement:**
- [ ] Create merchant_courier_analytics table
- [ ] Build analytics calculation function
- [ ] Create merchant analytics dashboard
- [ ] Add courier comparison tool
- [ ] Build cost optimization recommendations
- [ ] Add export to CSV/PDF

**Estimated Time:** 10 hours

---

### **3. Parcel Data Capture System**

#### **Methods to Capture Parcel Data:**

**Method 1: E-commerce Platform Integration**
```javascript
// Capture from order metadata
order_data: {
  items: [
    {
      product_id: string,
      weight: decimal,
      dimensions: { length, width, height },
      quantity: integer
    }
  ],
  total_weight: decimal,
  total_dimensions: { length, width, height }
}
```

**Method 2: Merchant Input (Manual/Bulk)**
```javascript
// Allow merchants to set defaults per product
product_shipping_data: {
  product_id: string,
  weight: decimal,
  dimensions: { length, width, height },
  fragile: boolean,
  requires_signature: boolean
}
```

**Method 3: TMS Integration**
```javascript
// If merchant uses ShipStation, Shippo, etc.
tms_data: {
  tracking_number: string,
  weight: decimal,
  dimensions: { length, width, height },
  service_level: string,
  cost: decimal
}
```

**Database Schema Update:**
```sql
ALTER TABLE orders ADD COLUMN parcel_weight DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN parcel_length DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN parcel_width DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN parcel_height DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN parcel_volume DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN is_fragile BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN requires_signature BOOLEAN DEFAULT FALSE;

CREATE TABLE product_shipping_defaults (
  product_id VARCHAR(255) PRIMARY KEY,
  store_id UUID REFERENCES stores(store_id),
  weight DECIMAL(10,2),
  length DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  fragile BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Tasks to Implement:**
- [ ] Update orders table schema
- [ ] Create product_shipping_defaults table
- [ ] Build product shipping data UI
- [ ] Add bulk import for product data
- [ ] Integrate with e-commerce product APIs
- [ ] Calculate total weight/dimensions from line items

**Estimated Time:** 6 hours

---

### **4. Cost Tracking & Optimization System** 🔥 HIGH VALUE

#### **Courier Agreement Tracking:**
```javascript
courier_agreements: {
  agreement_id: uuid,
  merchant_id: uuid,
  courier_id: uuid,
  
  // Contract Details
  contract_type: 'volume_based' | 'flat_rate' | 'tiered' | 'custom',
  start_date: date,
  end_date: date,
  
  // Pricing Structure
  pricing: {
    base_rate: decimal,
    
    // Weight-based
    weight_tiers: [
      { max_weight: decimal, rate: decimal }
    ],
    
    // Zone-based
    zone_rates: [
      { zone: string, countries: [string], rate: decimal }
    ],
    
    // Volume discounts
    volume_tiers: [
      { min_shipments: integer, discount_percent: decimal }
    ],
    
    // Additional fees
    fuel_surcharge: decimal,
    insurance_rate: decimal,
    signature_fee: decimal,
    residential_fee: decimal
  },
  
  // Minimum Commitments
  minimum_monthly_shipments: integer,
  minimum_monthly_revenue: decimal,
  penalty_for_underperformance: decimal,
  
  // Performance Guarantees
  guaranteed_delivery_days: integer,
  on_time_guarantee_percent: decimal,
  refund_policy: string
}
```

**Database Table:**
```sql
CREATE TABLE courier_agreements (
  agreement_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES users(user_id),
  courier_id UUID REFERENCES couriers(courier_id),
  contract_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  pricing_structure JSONB,
  minimum_commitments JSONB,
  performance_guarantees JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shipment_costs (
  cost_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(order_id),
  merchant_id UUID REFERENCES users(user_id),
  courier_id UUID REFERENCES couriers(courier_id),
  agreement_id UUID REFERENCES courier_agreements(agreement_id),
  
  -- Actual Cost
  actual_cost DECIMAL(10,2),
  base_rate DECIMAL(10,2),
  fuel_surcharge DECIMAL(10,2),
  additional_fees DECIMAL(10,2),
  
  -- Customer Charged
  customer_charged DECIMAL(10,2),
  
  -- Profit/Loss
  merchant_profit DECIMAL(10,2),
  profit_margin DECIMAL(5,2),
  
  -- Alternative Costs (what if)
  alternative_courier_costs JSONB,
  potential_savings DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Cost Analysis Features:**

**1. Real-time Cost Calculation**
```javascript
// When customer selects courier at checkout
calculateShippingCost(order, courier, customer_address) {
  // Find merchant's agreement with courier
  agreement = getAgreement(merchant_id, courier_id);
  
  // Calculate based on:
  // - Parcel weight/dimensions
  // - Destination zone
  // - Volume tier (monthly shipments)
  // - Additional services (signature, insurance)
  
  cost = calculateFromAgreement(agreement, order);
  
  // Compare with other couriers
  alternatives = getAllCouriers().map(c => {
    return {
      courier: c,
      cost: calculateFromAgreement(getAgreement(merchant_id, c.id), order),
      savings: cost - calculateFromAgreement(...)
    }
  });
  
  return {
    selected_courier_cost: cost,
    alternatives: alternatives.sort((a,b) => a.cost - b.cost),
    recommendation: alternatives[0].courier
  };
}
```

**2. Post-Shipment Analysis**
```javascript
// After order is delivered
analyzeShipmentCost(order_id) {
  actual_cost = getActualCost(order_id);
  customer_charged = getCustomerCharge(order_id);
  
  // Calculate what it would have cost with other couriers
  alternative_costs = getAllCouriers().map(courier => {
    return {
      courier: courier,
      estimated_cost: calculateCost(order, courier),
      savings: actual_cost - calculateCost(order, courier)
    }
  });
  
  // Store analysis
  storeAnalysis({
    order_id,
    actual_cost,
    customer_charged,
    profit: customer_charged - actual_cost,
    alternative_costs,
    best_alternative: alternative_costs.sort()[0]
  });
  
  // If merchant is losing money, flag it
  if (profit < 0) {
    createAlert({
      type: 'cost_warning',
      message: `Order ${order_id} resulted in ${profit} loss`,
      recommendation: `Switch to ${best_alternative.courier} to save ${savings}`
    });
  }
}
```

**3. Monthly Cost Optimization Report**
```javascript
generateMonthlyCostReport(merchant_id, month) {
  orders = getOrders(merchant_id, month);
  
  report = {
    total_shipments: orders.length,
    total_cost: sum(orders.map(o => o.actual_cost)),
    total_revenue: sum(orders.map(o => o.customer_charged)),
    total_profit: total_revenue - total_cost,
    avg_profit_per_shipment: total_profit / total_shipments,
    
    // By Courier
    courier_breakdown: groupBy(orders, 'courier').map(courier_orders => {
      return {
        courier: courier,
        shipments: courier_orders.length,
        cost: sum(courier_orders.map(o => o.actual_cost)),
        revenue: sum(courier_orders.map(o => o.customer_charged)),
        profit: revenue - cost,
        avg_cost: cost / shipments
      }
    }),
    
    // Optimization Opportunities
    savings_opportunities: orders.filter(o => o.potential_savings > 0).map(o => {
      return {
        order_id: o.id,
        current_courier: o.courier,
        current_cost: o.actual_cost,
        recommended_courier: o.best_alternative.courier,
        recommended_cost: o.best_alternative.cost,
        potential_savings: o.potential_savings
      }
    }),
    
    total_potential_savings: sum(savings_opportunities.map(o => o.potential_savings)),
    
    // Recommendations
    recommendations: [
      {
        type: 'switch_courier',
        message: `Switch 30% of shipments to ${courier} to save ${amount}/month`,
        impact: amount
      },
      {
        type: 'renegotiate',
        message: `Renegotiate with ${courier} - you're above volume tier`,
        impact: amount
      }
    ]
  };
  
  return report;
}
```

**Tasks to Implement:**
- [ ] Create courier_agreements table
- [ ] Create shipment_costs table
- [ ] Build agreement management UI
- [ ] Create cost calculation engine
- [ ] Build real-time cost comparison at checkout
- [ ] Create post-shipment analysis system
- [ ] Build monthly optimization report
- [ ] Add cost alerts and notifications
- [ ] Create merchant cost dashboard

**Estimated Time:** 15 hours

**Revenue Potential:** 🔥 **HIGH** - This is a premium feature that merchants will pay for

---

## 💡 ADDITIONAL STRATEGIC FEATURES

### **5. Smart Courier Recommendation Engine** 🤖

**AI-powered courier selection based on:**
```javascript
recommendCourier(order, customer_preferences) {
  factors = {
    // Historical Performance
    courier_performance: getCourierPerformance(destination),
    
    // Cost
    cost: calculateCost(order, all_couriers),
    
    // Speed
    estimated_delivery_days: getEstimatedDelivery(all_couriers, destination),
    
    // Customer Preference
    customer_past_ratings: getCustomerRatings(customer_id),
    
    // Merchant Priority
    merchant_preferences: getMerchantPreferences(merchant_id),
    
    // Real-time Factors
    weather: getWeatherAlerts(destination),
    holidays: getHolidays(destination),
    courier_capacity: getCourierCapacity(all_couriers)
  };
  
  // ML Model scores each courier
  scores = ml_model.predict(factors);
  
  return {
    recommended: scores.sort()[0],
    alternatives: scores.slice(1, 4),
    reasoning: explainRecommendation(scores[0])
  };
}
```

**Tasks:**
- [ ] Collect training data (historical orders + outcomes)
- [ ] Build ML model (Python/TensorFlow)
- [ ] Create API endpoint for recommendations
- [ ] Add explanation system (why this courier?)
- [ ] A/B test recommendations vs manual selection

**Estimated Time:** 20 hours  
**Revenue Potential:** 🔥 **VERY HIGH** - Core differentiator

---

### **6. Customer Delivery Preferences** 👤

**Let customers save preferences:**
```javascript
customer_delivery_preferences: {
  customer_email: string,
  
  preferences: {
    preferred_couriers: [uuid],
    avoid_couriers: [uuid],
    
    delivery_instructions: string,
    safe_place: string,
    access_code: string,
    
    preferred_delivery_window: {
      days: ['monday', 'tuesday'],
      time: '18:00-20:00'
    },
    
    notification_preferences: {
      email: boolean,
      sms: boolean,
      push: boolean,
      frequency: 'all_updates' | 'key_updates' | 'delivery_only'
    }
  }
}
```

**Tasks:**
- [ ] Create customer_preferences table
- [ ] Build customer preference portal
- [ ] Integrate with checkout (show saved preferences)
- [ ] Add preference matching in courier selection

**Estimated Time:** 8 hours

---

### **7. Merchant Courier Marketplace** 💰

**Let couriers bid for merchant business:**
```javascript
courier_marketplace: {
  // Merchant posts shipping needs
  merchant_request: {
    merchant_id: uuid,
    monthly_volume: integer,
    destinations: [string],
    avg_weight: decimal,
    special_requirements: string
  },
  
  // Couriers submit proposals
  courier_proposals: [
    {
      courier_id: uuid,
      proposed_rates: pricing_structure,
      service_level: string,
      guaranteed_delivery_days: integer,
      minimum_commitment: string
    }
  ],
  
  // Merchant reviews and accepts
  selected_proposal: uuid,
  contract_terms: agreement_structure
}
```

**Tasks:**
- [ ] Build marketplace UI
- [ ] Create proposal system
- [ ] Add contract generation
- [ ] Build negotiation messaging

**Estimated Time:** 12 hours  
**Revenue Potential:** 🔥 **HIGH** - Commission on contracts

---

### **8. Carbon Footprint Tracking** 🌱

**Track environmental impact:**
```javascript
carbon_tracking: {
  order_id: uuid,
  
  carbon_data: {
    distance_km: decimal,
    vehicle_type: string,
    co2_emissions_kg: decimal,
    
    // Comparison
    alternative_methods: [
      { method: 'electric_vehicle', co2: decimal, savings: decimal },
      { method: 'bicycle', co2: decimal, savings: decimal }
    ],
    
    // Offset
    offset_cost: decimal,
    offset_purchased: boolean
  }
}
```

**Tasks:**
- [ ] Integrate carbon calculation API
- [ ] Add carbon data to orders
- [ ] Build merchant carbon dashboard
- [ ] Add carbon offset option at checkout

**Estimated Time:** 6 hours  
**Revenue Potential:** 🟢 **MEDIUM** - Growing demand for sustainability

---

## 📋 IMPLEMENTATION PRIORITY

### **Phase 1: Core Flow Completion (15 hours)**
1. ✅ Order creation (done)
2. ⚠️ Order updates & tracking number capture (4h)
3. ⚠️ Automatic tracking polling (6h)
4. ⚠️ Smart review timing (5h)

### **Phase 2: Merchant Intelligence (24 hours)**
1. Merchant settings tracking (8h)
2. Courier usage analytics (10h)
3. Parcel data capture (6h)

### **Phase 3: Cost Optimization (15 hours)** 🔥 HIGH ROI
1. Courier agreement tracking (15h)
2. Real-time cost comparison
3. Monthly optimization reports

### **Phase 4: Advanced Features (46 hours)**
1. Smart courier recommendations (20h)
2. Customer preferences (8h)
3. Courier marketplace (12h)
4. Carbon tracking (6h)

**Total Estimated Time:** 100 hours (12-15 working days)

---

## 💰 REVENUE IMPACT

### **Tier 1: Essential (Included in Base Plan)**
- Order tracking
- Basic analytics
- Review collection

### **Tier 2: Professional ($99-199/month)**
- Courier usage analytics
- Parcel data tracking
- Basic cost tracking

### **Tier 3: Enterprise ($299-499/month)**
- Cost optimization engine 🔥
- Smart courier recommendations 🤖
- Agreement management
- Monthly optimization reports

### **Tier 4: Marketplace (Commission-based)**
- Courier marketplace (5-10% commission)
- Negotiated contracts
- Volume discounts

**Potential Additional Revenue:** $50-200k/year from premium features

---

## 🎯 SUCCESS METRICS

**Track:**
- Average cost savings per merchant
- Courier recommendation acceptance rate
- Review response rate improvement
- Customer satisfaction scores
- Merchant retention rate
- Revenue per merchant

**Goals:**
- 20% average cost savings for merchants
- 80% recommendation acceptance rate
- 40% review response rate
- 4.5+ customer satisfaction
- 95% merchant retention
- $150+ average revenue per merchant

---

**Last Updated:** October 9, 2025, 08:38  
**Next Review:** After Phase 1 completion
