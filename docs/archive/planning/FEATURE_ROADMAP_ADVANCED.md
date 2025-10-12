# 🚀 ADVANCED FEATURES ROADMAP

## Overview
This document outlines advanced features for Performile to enhance merchant value, market insights, and competitive positioning.

---

# 📦 1. E-COMMERCE INTEGRATION ENHANCEMENT

## Current Status
- ✅ Basic order data (tracking number, status, dates)
- ✅ WooCommerce webhook integration
- ✅ Shopify integration structure

## Missing Data Points for Lead Generation & Analytics

### 1.1 Enhanced Order Data Collection
**Priority:** HIGH
**Estimated Time:** 12-16 hours

#### New Data Fields to Capture:

**Parcel Details:**
- `parcel_weight` (kg)
- `parcel_length` (cm)
- `parcel_width` (cm)
- `parcel_height` (cm)
- `parcel_volume` (calculated: L×W×H)
- `parcel_volumetric_weight` (calculated)
- `number_of_items` (quantity in order)
- `is_fragile` (boolean)
- `requires_signature` (boolean)

**Financial Data:**
- `order_value` (total sales price)
- `product_value` (excluding shipping)
- `shipping_cost_charged` (what customer paid)
- `actual_shipping_cost` (what merchant paid courier)
- `shipping_margin` (calculated)
- `currency` (SEK, EUR, etc.)

**Location Data:**
- `sender_address` (warehouse/store location)
- `sender_postal_code`
- `sender_city`
- `sender_country`
- `destination_address` (customer)
- `destination_postal_code`
- `destination_city`
- `destination_country`
- `delivery_distance` (calculated km)
- `is_international` (boolean)

**Service Level:**
- `service_type` (home_delivery, parcel_shop, parcel_locker, business_delivery)
- `delivery_speed` (same_day, next_day, standard, economy)
- `delivery_time_slot` (morning, afternoon, evening)

#### Database Schema Changes:

```sql
-- Add columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_weight DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_length DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_width DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_height DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_volume DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS number_of_items INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_fragile BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_value DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_value DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost_charged DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_shipping_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'SEK';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_postal_code VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sender_country VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_distance DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT false;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_speed VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(50);

-- Add indexes for analytics
CREATE INDEX idx_orders_parcel_weight ON orders(parcel_weight);
CREATE INDEX idx_orders_order_value ON orders(order_value);
CREATE INDEX idx_orders_service_type ON orders(service_type);
CREATE INDEX idx_orders_destination_country ON orders(destination_country);
CREATE INDEX idx_orders_is_international ON orders(is_international);
```

#### API Endpoints to Update:

**1. Enhanced Order Creation:**
```typescript
POST /api/orders
{
  // Existing fields...
  "parcel_details": {
    "weight": 2.5,
    "length": 30,
    "width": 20,
    "height": 15,
    "items_count": 3,
    "is_fragile": false,
    "requires_signature": true
  },
  "financial_data": {
    "order_value": 599.00,
    "product_value": 549.00,
    "shipping_cost_charged": 50.00,
    "actual_shipping_cost": 35.00,
    "currency": "SEK"
  },
  "sender_location": {
    "address": "Warehouse A, Street 123",
    "postal_code": "11122",
    "city": "Stockholm",
    "country": "Sweden"
  },
  "service_details": {
    "type": "home_delivery",
    "speed": "next_day",
    "time_slot": "morning"
  }
}
```

**2. Lead Data Export:**
```typescript
GET /api/analytics/lead-data
// Returns enriched order data for sales/marketing
```

#### E-commerce Plugin Updates:

**WooCommerce Plugin Enhancement:**
```php
// Capture additional data from WooCommerce order
function performile_capture_order_details($order_id) {
    $order = wc_get_order($order_id);
    
    // Get parcel dimensions from products
    $total_weight = 0;
    $max_length = 0;
    $max_width = 0;
    $max_height = 0;
    $item_count = 0;
    
    foreach ($order->get_items() as $item) {
        $product = $item->get_product();
        $total_weight += $product->get_weight() * $item->get_quantity();
        $max_length = max($max_length, $product->get_length());
        $max_width = max($max_width, $product->get_width());
        $max_height = max($max_height, $product->get_height());
        $item_count += $item->get_quantity();
    }
    
    // Get financial data
    $order_total = $order->get_total();
    $shipping_total = $order->get_shipping_total();
    $product_total = $order_total - $shipping_total;
    
    // Get addresses
    $shipping_address = $order->get_shipping_address_1();
    $shipping_postcode = $order->get_shipping_postcode();
    $shipping_city = $order->get_shipping_city();
    $shipping_country = $order->get_shipping_country();
    
    // Send to Performile
    performile_send_enhanced_order_data([
        'parcel_details' => [
            'weight' => $total_weight,
            'length' => $max_length,
            'width' => $max_width,
            'height' => $max_height,
            'items_count' => $item_count
        ],
        'financial_data' => [
            'order_value' => $order_total,
            'product_value' => $product_total,
            'shipping_cost_charged' => $shipping_total
        ],
        // ... etc
    ]);
}
```

---

# 📊 2. MARKET INSIGHTS ENHANCEMENTS

## Current Status
- ✅ Basic courier comparison
- ✅ Trust Score rankings
- ✅ Performance metrics

## New Market Insight Features

### 2.1 Shipping Cost Benchmarking
**Priority:** HIGH
**Estimated Time:** 8-10 hours

**Features:**
- Compare shipping costs across couriers by:
  - Weight ranges
  - Destination zones
  - Service types
  - Delivery speeds
- Industry average pricing
- Cost trends over time
- Seasonal pricing patterns

**API Endpoint:**
```typescript
GET /api/market-insights/cost-benchmarking
Query params:
  - weight_range: "0-2kg", "2-5kg", etc.
  - destination: "domestic", "nordic", "eu", "international"
  - service_type: "home_delivery", "parcel_shop", etc.
  - time_period: "last_month", "last_quarter", "last_year"

Response:
{
  "average_cost": 45.50,
  "median_cost": 42.00,
  "cost_range": {
    "min": 35.00,
    "max": 65.00
  },
  "courier_comparison": [
    {
      "courier_name": "DHL Express",
      "average_cost": 48.00,
      "vs_market_average": "+5.5%"
    }
  ],
  "trends": {
    "monthly_change": "+2.3%",
    "quarterly_change": "+5.1%"
  }
}
```

### 2.2 Delivery Performance Analytics
**Priority:** HIGH
**Estimated Time:** 6-8 hours

**Features:**
- On-time delivery rates by:
  - Courier
  - Destination zone
  - Service type
  - Season/month
- Average delivery time
- Delay patterns (day of week, time of year)
- Success rate by delivery type

**Dashboard Widgets:**
- Heat map of delivery performance by postal code
- Courier reliability scorecard
- Seasonal performance trends
- Service level comparison

### 2.3 Customer Satisfaction Insights
**Priority:** MEDIUM
**Estimated Time:** 6-8 hours

**Features:**
- Average ratings by courier
- Common complaint categories
- Review sentiment analysis
- NPS (Net Promoter Score) by courier
- Customer preferences by demographics

### 2.4 Market Share & Volume Analysis
**Priority:** MEDIUM
**Estimated Time:** 8-10 hours

**Features:**
- Courier market share by:
  - Volume (number of shipments)
  - Value (total shipping revenue)
  - Region
  - Industry vertical
- Growth trends
- New courier adoption rates
- Merchant switching patterns

**API Endpoint:**
```typescript
GET /api/market-insights/market-share

Response:
{
  "total_shipments": 125000,
  "total_value": 5625000,
  "period": "last_month",
  "couriers": [
    {
      "courier_name": "PostNord",
      "shipment_count": 45000,
      "market_share_volume": "36%",
      "total_revenue": 1980000,
      "market_share_value": "35.2%",
      "growth_vs_last_period": "+8.5%"
    }
  ],
  "trends": {
    "fastest_growing": "Budbee",
    "declining": "Traditional Post"
  }
}
```

### 2.5 Route & Zone Analytics
**Priority:** MEDIUM
**Estimated Time:** 10-12 hours

**Features:**
- Most common shipping routes
- Average delivery time by route
- Cost per km analysis
- Zone profitability
- Underserved areas identification

### 2.6 Predictive Analytics
**Priority:** LOW (Future)
**Estimated Time:** 20-30 hours

**Features:**
- Demand forecasting
- Seasonal volume predictions
- Price trend predictions
- Courier capacity alerts
- Risk assessment (delays, failures)

---

# 💰 3. SHIPPING AGREEMENT CALCULATOR

## Feature: Cost Comparison & Savings Analysis
**Priority:** HIGH
**Estimated Time:** 12-16 hours

### 3.1 Agreement Management

**Database Schema:**
```sql
CREATE TABLE shipping_agreements (
  agreement_id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES users(user_id),
  courier_id INTEGER REFERENCES couriers(courier_id),
  agreement_name VARCHAR(255),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agreement_pricing (
  pricing_id SERIAL PRIMARY KEY,
  agreement_id INTEGER REFERENCES shipping_agreements(agreement_id),
  
  -- Weight-based pricing
  weight_from DECIMAL(10,2),
  weight_to DECIMAL(10,2),
  
  -- Zone-based pricing
  zone VARCHAR(50), -- domestic, nordic, eu, international
  
  -- Service type
  service_type VARCHAR(50), -- home_delivery, parcel_shop, etc.
  delivery_speed VARCHAR(50), -- same_day, next_day, standard
  
  -- Pricing
  base_price DECIMAL(10,2),
  price_per_kg DECIMAL(10,2),
  fuel_surcharge_percent DECIMAL(5,2),
  
  -- Volume discounts
  volume_tier_from INTEGER,
  volume_tier_to INTEGER,
  discount_percent DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agreement_calculations (
  calculation_id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES users(user_id),
  calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  period_start DATE,
  period_end DATE,
  
  -- Agreements compared
  current_agreement_id INTEGER REFERENCES shipping_agreements(agreement_id),
  comparison_agreement_id INTEGER REFERENCES shipping_agreements(agreement_id),
  
  -- Results
  current_total_cost DECIMAL(10,2),
  comparison_total_cost DECIMAL(10,2),
  potential_savings DECIMAL(10,2),
  savings_percent DECIMAL(5,2),
  
  shipment_count INTEGER,
  
  calculation_data JSONB -- Detailed breakdown
);
```

### 3.2 API Endpoints

**1. Add Shipping Agreement:**
```typescript
POST /api/shipping-agreements

{
  "courier_id": 5,
  "agreement_name": "DHL 2025 Contract",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "pricing_tiers": [
    {
      "weight_from": 0,
      "weight_to": 2,
      "zone": "domestic",
      "service_type": "home_delivery",
      "delivery_speed": "next_day",
      "base_price": 45.00,
      "price_per_kg": 5.00,
      "fuel_surcharge_percent": 8.5
    },
    {
      "weight_from": 2,
      "weight_to": 5,
      "zone": "domestic",
      "service_type": "home_delivery",
      "delivery_speed": "next_day",
      "base_price": 55.00,
      "price_per_kg": 4.50,
      "fuel_surcharge_percent": 8.5
    }
  ],
  "volume_discounts": [
    {
      "volume_from": 100,
      "volume_to": 500,
      "discount_percent": 5
    },
    {
      "volume_from": 500,
      "volume_to": 1000,
      "discount_percent": 10
    }
  ]
}
```

**2. Calculate Savings:**
```typescript
POST /api/shipping-agreements/calculate-savings

{
  "current_agreement_id": 12,
  "comparison_agreement_id": 15,
  "period_start": "2025-01-01",
  "period_end": "2025-03-31"
}

Response:
{
  "calculation_id": 456,
  "period": {
    "start": "2025-01-01",
    "end": "2025-03-31",
    "days": 90
  },
  "current_agreement": {
    "name": "PostNord 2024",
    "courier": "PostNord",
    "total_cost": 125000.00,
    "average_cost_per_shipment": 50.00,
    "shipment_count": 2500
  },
  "comparison_agreement": {
    "name": "DHL 2025 Contract",
    "courier": "DHL Express",
    "total_cost": 112500.00,
    "average_cost_per_shipment": 45.00,
    "shipment_count": 2500
  },
  "savings": {
    "total_amount": 12500.00,
    "percent": 10.0,
    "per_shipment": 5.00,
    "projected_annual": 50000.00
  },
  "breakdown_by_category": [
    {
      "category": "0-2kg domestic",
      "current_cost": 45000.00,
      "comparison_cost": 40500.00,
      "savings": 4500.00,
      "shipment_count": 900
    },
    {
      "category": "2-5kg domestic",
      "current_cost": 80000.00,
      "comparison_cost": 72000.00,
      "savings": 8000.00,
      "shipment_count": 1600
    }
  ],
  "recommendations": [
    "Switch to DHL for 0-2kg domestic shipments (10% savings)",
    "Negotiate volume discount with PostNord for 2-5kg range",
    "Consider hybrid approach: DHL for express, PostNord for standard"
  ]
}
```

**3. Historical Comparison:**
```typescript
GET /api/shipping-agreements/historical-analysis
Query params:
  - merchant_id
  - months: 12

Response:
{
  "monthly_costs": [
    {
      "month": "2024-01",
      "courier": "PostNord",
      "total_cost": 42000.00,
      "shipment_count": 850
    }
  ],
  "total_spent_12_months": 504000.00,
  "potential_savings_if_switched": 50400.00,
  "best_performing_month": "2024-06",
  "worst_performing_month": "2024-12"
}
```

### 3.3 UI Components

**Agreement Comparison Dashboard:**
- Side-by-side agreement comparison
- Visual cost breakdown charts
- Savings calculator widget
- "What-if" scenario builder
- Export comparison report (PDF)

**Features:**
- Upload competitor quotes (PDF/CSV parsing)
- Automatic price matching suggestions
- Contract renewal reminders
- Negotiation talking points generator

---

# 📋 4. RFQ (REQUEST FOR QUOTE) ENHANCEMENT

## Feature: Price List Management & CSV Export
**Priority:** HIGH
**Estimated Time:** 10-14 hours

### 4.1 RFQ Price List Upload

**Database Schema:**
```sql
CREATE TABLE rfq_requests (
  rfq_id SERIAL PRIMARY KEY,
  merchant_id INTEGER REFERENCES users(user_id),
  rfq_name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft', -- draft, sent, received_quotes, accepted, declined
  deadline DATE
);

CREATE TABLE rfq_couriers (
  rfq_courier_id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfq_requests(rfq_id),
  courier_id INTEGER REFERENCES couriers(courier_id),
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  quote_received BOOLEAN DEFAULT false,
  quote_received_at TIMESTAMP
);

CREATE TABLE rfq_shipment_profiles (
  profile_id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfq_requests(rfq_id),
  
  -- Parcel details
  weight DECIMAL(10,2),
  length DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  
  -- Service requirements
  service_type VARCHAR(50), -- home_delivery, parcel_shop, parcel_locker
  delivery_speed VARCHAR(50),
  requires_signature BOOLEAN,
  
  -- Destination
  destination_country VARCHAR(100),
  destination_postal_code VARCHAR(20),
  destination_city VARCHAR(100),
  
  -- Volume
  estimated_monthly_volume INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rfq_quotes (
  quote_id SERIAL PRIMARY KEY,
  rfq_id INTEGER REFERENCES rfq_requests(rfq_id),
  courier_id INTEGER REFERENCES couriers(courier_id),
  
  -- Pricing
  price_list JSONB, -- Full pricing structure
  
  -- Terms
  contract_length_months INTEGER,
  payment_terms VARCHAR(100),
  notes TEXT,
  
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_accepted BOOLEAN DEFAULT false
);
```

### 4.2 API Endpoints

**1. Create RFQ with Shipment Profiles:**
```typescript
POST /api/rfq/create

{
  "rfq_name": "Q1 2025 Shipping RFQ",
  "description": "Looking for competitive rates for domestic shipments",
  "deadline": "2025-01-15",
  "courier_ids": [1, 3, 5, 7], // Invite specific couriers
  "shipment_profiles": [
    {
      "weight": 1.5,
      "length": 30,
      "width": 20,
      "height": 10,
      "service_type": "home_delivery",
      "delivery_speed": "next_day",
      "destination_country": "Sweden",
      "destination_postal_code": "11122",
      "destination_city": "Stockholm",
      "estimated_monthly_volume": 500
    },
    {
      "weight": 3.0,
      "length": 40,
      "width": 30,
      "height": 15,
      "service_type": "parcel_shop",
      "delivery_speed": "standard",
      "destination_country": "Sweden",
      "destination_postal_code": "41122",
      "destination_city": "Gothenburg",
      "estimated_monthly_volume": 300
    }
  ]
}
```

**2. Generate CSV for Courier:**
```typescript
GET /api/rfq/{rfq_id}/export-csv

Response: CSV file download
```

**CSV Format:**
```csv
Profile ID,Weight (kg),Length (cm),Width (cm),Height (cm),Service Type,Delivery Speed,Destination Country,Postal Code,City,Monthly Volume,Your Quote (SEK)
1,1.5,30,20,10,Home Delivery,Next Day,Sweden,11122,Stockholm,500,
2,3.0,40,30,15,Parcel Shop,Standard,Sweden,41122,Gothenburg,300,
3,2.0,35,25,12,Parcel Locker,Next Day,Sweden,21122,Malmö,200,
```

**3. Upload Courier Quote (CSV):**
```typescript
POST /api/rfq/{rfq_id}/upload-quote
Content-Type: multipart/form-data

{
  "courier_id": 5,
  "quote_file": <CSV file>,
  "contract_length_months": 12,
  "payment_terms": "Net 30",
  "notes": "Prices include fuel surcharge"
}
```

**4. Compare Quotes:**
```typescript
GET /api/rfq/{rfq_id}/compare-quotes

Response:
{
  "rfq_name": "Q1 2025 Shipping RFQ",
  "quotes_received": 3,
  "profiles": [
    {
      "profile_id": 1,
      "description": "1.5kg, Home Delivery, Next Day, Stockholm",
      "monthly_volume": 500,
      "quotes": [
        {
          "courier_name": "DHL Express",
          "price_per_shipment": 45.00,
          "monthly_cost": 22500.00,
          "annual_cost": 270000.00
        },
        {
          "courier_name": "PostNord",
          "price_per_shipment": 42.00,
          "monthly_cost": 21000.00,
          "annual_cost": 252000.00
        },
        {
          "courier_name": "Budbee",
          "price_per_shipment": 48.00,
          "monthly_cost": 24000.00,
          "annual_cost": 288000.00
        }
      ],
      "best_quote": {
        "courier_name": "PostNord",
        "savings_vs_current": 3000.00
      }
    }
  ],
  "total_comparison": {
    "current_annual_cost": 600000.00,
    "best_combined_annual_cost": 540000.00,
    "potential_annual_savings": 60000.00,
    "recommended_strategy": "Use PostNord for standard, DHL for express"
  }
}
```

### 4.3 UI Features

**RFQ Creation Wizard:**
1. **Step 1:** Define shipment profiles
   - Add multiple profiles (different weights, destinations, services)
   - Import from historical data
   - Bulk upload via CSV

2. **Step 2:** Select couriers to invite
   - Browse courier directory
   - Filter by service area, capabilities
   - See courier ratings/reviews

3. **Step 3:** Set deadline and terms
   - Contract length
   - Payment terms
   - Special requirements

4. **Step 4:** Generate & send
   - Auto-generate CSV for each courier
   - Send via email with RFQ details
   - Track who has responded

**Quote Management Dashboard:**
- View all RFQs (active, completed, expired)
- Track quote responses
- Side-by-side comparison table
- Accept/decline quotes
- Negotiate with couriers (messaging)

**CSV Export Features:**
- Pre-filled with shipment profiles
- Empty "Your Quote" column for courier to fill
- Instructions included
- Branded template

**CSV Import Features:**
- Parse courier responses
- Validate pricing data
- Auto-calculate totals
- Flag missing/invalid data

---

# 🎯 IMPLEMENTATION PRIORITY

## Phase 1: Foundation (2-3 weeks)
1. ✅ Enhanced order data collection (e-commerce integration)
2. ✅ Database schema updates
3. ✅ API endpoints for new data

## Phase 2: Market Insights (2-3 weeks)
1. ✅ Cost benchmarking
2. ✅ Delivery performance analytics
3. ✅ Market share analysis
4. ✅ Dashboard widgets

## Phase 3: Merchant Tools (3-4 weeks)
1. ✅ Shipping agreement management
2. ✅ Cost calculator & comparison
3. ✅ Historical analysis
4. ✅ Savings projections

## Phase 4: RFQ System (2-3 weeks)
1. ✅ RFQ creation & management
2. ✅ CSV export/import
3. ✅ Quote comparison
4. ✅ Courier communication

## Phase 5: Advanced Analytics (4-6 weeks)
1. ✅ Predictive analytics
2. ✅ Route optimization
3. ✅ AI-powered recommendations
4. ✅ Custom reporting

---

# 📊 EXPECTED BUSINESS IMPACT

## For Merchants:
- **Cost Savings:** 10-20% reduction in shipping costs through better negotiation
- **Time Savings:** 80% reduction in RFQ process time
- **Better Decisions:** Data-driven courier selection
- **Transparency:** Clear cost breakdowns and comparisons

## For Performile:
- **Differentiation:** Unique features competitors don't have
- **Stickiness:** Merchants rely on platform for critical decisions
- **Revenue:** Premium features, transaction fees on RFQs
- **Data Moat:** Accumulate valuable market data

## For Couriers:
- **Lead Generation:** Access to qualified merchant RFQs
- **Market Intelligence:** Understand competitive positioning
- **Efficiency:** Standardized quote process

---

# 🔧 TECHNICAL REQUIREMENTS

## Backend:
- PostgreSQL for data storage
- Node.js/TypeScript APIs
- CSV parsing libraries (Papa Parse, csv-parser)
- PDF generation (PDFKit, Puppeteer)
- Email service (SendGrid, Resend)

## Frontend:
- React components for RFQ wizard
- Data visualization (Chart.js, Recharts)
- CSV upload/download
- Comparison tables
- Export functionality

## Infrastructure:
- File storage (S3, Vercel Blob)
- Background jobs (for calculations)
- Caching (Redis) for analytics
- Rate limiting for API calls

---

*Document created: October 10, 2025*
*Status: Planning Phase*
*Next Review: After Phase 1 completion*
