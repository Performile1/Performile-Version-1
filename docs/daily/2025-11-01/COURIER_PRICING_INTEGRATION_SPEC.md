# COURIER PRICING INTEGRATION - SPECIFICATION

**Date:** November 1, 2025  
**Priority:** HIGH  
**Category:** Feature Enhancement  
**Estimated Time:** 8-12 hours  
**Status:** 📋 SPECIFICATION

---

## 📋 OVERVIEW

**Problem:**
- Merchants can't see courier pricing in Performile dashboard
- No way to compare courier costs
- No cost visibility when selecting couriers
- Manual price tracking in external spreadsheets

**Solution:**
- Integrate courier pricing into platform
- CSV upload for price sheets
- API integration for real-time pricing
- Cost comparison in dashboard
- Price visibility in checkout

---

## 🎯 BUSINESS VALUE

### **For Merchants:**
- ✅ See all courier prices in one place
- ✅ Compare costs before selecting courier
- ✅ Track delivery costs over time
- ✅ Budget planning with accurate data
- ✅ Identify cost-saving opportunities

### **For Platform:**
- ✅ Increased merchant value
- ✅ Better courier selection decisions
- ✅ Revenue optimization insights
- ✅ Competitive advantage
- ✅ Data-driven recommendations

### **ROI:**
- Merchants save 10-15% on delivery costs
- Better courier selection (price + performance)
- Reduced manual work (no spreadsheets)
- Increased platform stickiness

---

## 🗄️ DATABASE SCHEMA

### **New Tables**

#### **1. courier_pricing_zones**
**Purpose:** Define pricing zones (postal code ranges, cities, regions)

```sql
CREATE TABLE courier_pricing_zones (
    zone_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(20) NOT NULL CHECK (zone_type IN ('postal_code', 'city', 'region', 'country')),
    
    -- Geographic definition
    postal_code_from VARCHAR(20),
    postal_code_to VARCHAR(20),
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(2),
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT unique_courier_zone UNIQUE (courier_id, zone_name)
);

CREATE INDEX idx_pricing_zones_courier ON courier_pricing_zones(courier_id);
CREATE INDEX idx_pricing_zones_postal ON courier_pricing_zones(postal_code_from, postal_code_to);
CREATE INDEX idx_pricing_zones_city ON courier_pricing_zones(city);
CREATE INDEX idx_pricing_zones_active ON courier_pricing_zones(is_active);
```

---

#### **2. courier_pricing_rules**
**Purpose:** Store pricing rules per courier, zone, and service type

```sql
CREATE TABLE courier_pricing_rules (
    pricing_rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    zone_id UUID REFERENCES courier_pricing_zones(zone_id) ON DELETE SET NULL,
    
    -- Service details
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('home_delivery', 'parcel_shop', 'parcel_locker', 'express', 'standard', 'economy')),
    package_type VARCHAR(50) CHECK (package_type IN ('small', 'medium', 'large', 'pallet', 'custom')),
    
    -- Weight ranges (in kg)
    weight_from DECIMAL(10,2) DEFAULT 0,
    weight_to DECIMAL(10,2),
    
    -- Dimension limits (in cm)
    max_length DECIMAL(10,2),
    max_width DECIMAL(10,2),
    max_height DECIMAL(10,2),
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) DEFAULT 0,
    price_per_km DECIMAL(10,2) DEFAULT 0,
    fuel_surcharge_percent DECIMAL(5,2) DEFAULT 0,
    
    -- Additional fees
    handling_fee DECIMAL(10,2) DEFAULT 0,
    insurance_fee DECIMAL(10,2) DEFAULT 0,
    cod_fee DECIMAL(10,2) DEFAULT 0, -- Cash on delivery
    
    -- Discounts
    volume_discount_threshold INTEGER, -- Orders per month
    volume_discount_percent DECIMAL(5,2),
    
    -- Validity
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    currency VARCHAR(3) DEFAULT 'SEK',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_weight_range CHECK (weight_to IS NULL OR weight_to > weight_from),
    CONSTRAINT valid_date_range CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE INDEX idx_pricing_rules_courier ON courier_pricing_rules(courier_id);
CREATE INDEX idx_pricing_rules_zone ON courier_pricing_rules(zone_id);
CREATE INDEX idx_pricing_rules_service ON courier_pricing_rules(service_type);
CREATE INDEX idx_pricing_rules_active ON courier_pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_validity ON courier_pricing_rules(valid_from, valid_to);
```

---

#### **3. courier_price_sheets**
**Purpose:** Track uploaded price sheets and their status

```sql
CREATE TABLE courier_price_sheets (
    price_sheet_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- Who uploaded
    
    -- File details
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_url TEXT, -- S3/storage URL
    
    -- Processing
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    rows_total INTEGER,
    rows_processed INTEGER,
    rows_failed INTEGER,
    error_log TEXT,
    
    -- Validity
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    
    -- Metadata
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    notes TEXT
);

CREATE INDEX idx_price_sheets_courier ON courier_price_sheets(courier_id);
CREATE INDEX idx_price_sheets_merchant ON courier_price_sheets(merchant_id);
CREATE INDEX idx_price_sheets_status ON courier_price_sheets(status);
CREATE INDEX idx_price_sheets_date ON courier_price_sheets(effective_date);
```

---

#### **4. order_pricing_history**
**Purpose:** Track actual prices charged for orders (for analytics)

```sql
CREATE TABLE order_pricing_history (
    pricing_history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    pricing_rule_id UUID REFERENCES courier_pricing_rules(pricing_rule_id),
    
    -- Calculated pricing
    base_price DECIMAL(10,2) NOT NULL,
    weight_charge DECIMAL(10,2) DEFAULT 0,
    distance_charge DECIMAL(10,2) DEFAULT 0,
    fuel_surcharge DECIMAL(10,2) DEFAULT 0,
    handling_fee DECIMAL(10,2) DEFAULT 0,
    insurance_fee DECIMAL(10,2) DEFAULT 0,
    cod_fee DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Order details at time of pricing
    package_weight DECIMAL(10,2),
    package_dimensions JSONB, -- {length, width, height}
    delivery_distance DECIMAL(10,2),
    service_type VARCHAR(50),
    
    -- Metadata
    currency VARCHAR(3) DEFAULT 'SEK',
    calculated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT positive_total CHECK (total_price >= 0)
);

CREATE INDEX idx_pricing_history_order ON order_pricing_history(order_id);
CREATE INDEX idx_pricing_history_courier ON order_pricing_history(courier_id);
CREATE INDEX idx_pricing_history_date ON order_pricing_history(calculated_at);
```

---

### **Enhanced Existing Tables**

#### **Add to orders table:**
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'SEK';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pricing_rule_id UUID REFERENCES courier_pricing_rules(pricing_rule_id);
```

---

## 🔌 API ENDPOINTS

### **1. Pricing Rules Management**

#### **GET /api/pricing/rules**
**Purpose:** Get pricing rules for a courier

**Query Parameters:**
- `courier_id` (required)
- `zone_id` (optional)
- `service_type` (optional)
- `is_active` (optional, default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "rules": [
      {
        "pricing_rule_id": "uuid",
        "courier_id": "uuid",
        "courier_name": "PostNord",
        "zone_name": "Stockholm",
        "service_type": "home_delivery",
        "package_type": "small",
        "weight_from": 0,
        "weight_to": 5,
        "base_price": 49.00,
        "price_per_kg": 5.00,
        "fuel_surcharge_percent": 3.5,
        "total_estimated": 54.72,
        "currency": "SEK",
        "valid_from": "2025-01-01",
        "valid_to": null
      }
    ],
    "total": 15
  }
}
```

---

#### **POST /api/pricing/rules**
**Purpose:** Create new pricing rule

**Request Body:**
```json
{
  "courier_id": "uuid",
  "zone_id": "uuid",
  "service_type": "home_delivery",
  "package_type": "small",
  "weight_from": 0,
  "weight_to": 5,
  "base_price": 49.00,
  "price_per_kg": 5.00,
  "fuel_surcharge_percent": 3.5,
  "valid_from": "2025-01-01"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pricing_rule_id": "uuid",
    "message": "Pricing rule created successfully"
  }
}
```

---

#### **PUT /api/pricing/rules/:rule_id**
**Purpose:** Update pricing rule

---

#### **DELETE /api/pricing/rules/:rule_id**
**Purpose:** Delete pricing rule (soft delete - set is_active = false)

---

### **2. Price Calculation**

#### **POST /api/pricing/calculate**
**Purpose:** Calculate price for a delivery

**Request Body:**
```json
{
  "courier_id": "uuid",
  "from_postal_code": "11122",
  "to_postal_code": "41301",
  "service_type": "home_delivery",
  "package_weight": 2.5,
  "package_dimensions": {
    "length": 30,
    "width": 20,
    "height": 15
  },
  "insurance_value": 1000,
  "cod_amount": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "courier_id": "uuid",
    "courier_name": "PostNord",
    "pricing_rule_id": "uuid",
    "breakdown": {
      "base_price": 49.00,
      "weight_charge": 12.50,
      "distance_charge": 0,
      "fuel_surcharge": 2.15,
      "handling_fee": 0,
      "insurance_fee": 10.00,
      "cod_fee": 15.00,
      "subtotal": 88.65,
      "discount": -8.87,
      "total": 79.78
    },
    "currency": "SEK",
    "estimated_delivery_days": 2
  }
}
```

---

#### **POST /api/pricing/compare**
**Purpose:** Compare prices across multiple couriers

**Request Body:**
```json
{
  "courier_ids": ["uuid1", "uuid2", "uuid3"],
  "from_postal_code": "11122",
  "to_postal_code": "41301",
  "service_type": "home_delivery",
  "package_weight": 2.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparisons": [
      {
        "courier_id": "uuid1",
        "courier_name": "PostNord",
        "total_price": 79.78,
        "trustscore": 85.5,
        "estimated_days": 2,
        "recommended": true
      },
      {
        "courier_id": "uuid2",
        "courier_name": "Bring",
        "total_price": 89.00,
        "trustscore": 82.0,
        "estimated_days": 3,
        "recommended": false
      }
    ],
    "cheapest": "uuid1",
    "fastest": "uuid1",
    "best_value": "uuid1"
  }
}
```

---

### **3. Price Sheet Upload**

#### **POST /api/pricing/upload**
**Purpose:** Upload CSV price sheet

**Request:** Multipart form-data
- `file`: CSV file
- `courier_id`: UUID
- `effective_date`: Date (optional)
- `expiry_date`: Date (optional)

**CSV Format:**
```csv
zone_name,service_type,package_type,weight_from,weight_to,base_price,price_per_kg,fuel_surcharge_percent
Stockholm,home_delivery,small,0,5,49.00,5.00,3.5
Stockholm,home_delivery,medium,5,10,69.00,7.00,3.5
Gothenburg,home_delivery,small,0,5,55.00,5.50,3.5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "price_sheet_id": "uuid",
    "status": "processing",
    "rows_total": 150,
    "message": "Price sheet uploaded successfully. Processing in background."
  }
}
```

---

#### **GET /api/pricing/upload/:sheet_id**
**Purpose:** Check upload status

**Response:**
```json
{
  "success": true,
  "data": {
    "price_sheet_id": "uuid",
    "status": "completed",
    "rows_total": 150,
    "rows_processed": 148,
    "rows_failed": 2,
    "error_log": "Row 45: Invalid weight range\nRow 87: Missing base_price",
    "processed_at": "2025-11-01T22:30:00Z"
  }
}
```

---

#### **GET /api/pricing/sheets**
**Purpose:** List all uploaded price sheets

**Query Parameters:**
- `courier_id` (optional)
- `status` (optional)
- `limit` (default: 20)
- `offset` (default: 0)

---

### **4. Pricing Analytics**

#### **GET /api/pricing/analytics/costs**
**Purpose:** Get cost analytics for merchant

**Query Parameters:**
- `merchant_id` (required)
- `start_date` (optional)
- `end_date` (optional)
- `courier_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_cost": 15750.50,
    "total_orders": 250,
    "average_cost_per_order": 63.00,
    "by_courier": [
      {
        "courier_id": "uuid",
        "courier_name": "PostNord",
        "total_cost": 8500.00,
        "order_count": 150,
        "average_cost": 56.67
      }
    ],
    "by_service_type": [
      {
        "service_type": "home_delivery",
        "total_cost": 12000.00,
        "order_count": 200,
        "average_cost": 60.00
      }
    ],
    "trends": [
      {
        "date": "2025-10-01",
        "total_cost": 1200.50,
        "order_count": 20
      }
    ]
  }
}
```

---

## 🎨 FRONTEND COMPONENTS

### **1. Pricing Dashboard (Merchant)**

**Location:** `apps/web/src/pages/merchant/PricingDashboard.tsx`

**Features:**
- Overview of delivery costs (total, average, trends)
- Cost breakdown by courier
- Cost breakdown by service type
- Monthly cost trends chart
- Top 5 most expensive routes
- Cost-saving recommendations

**Components:**
- `PricingOverviewCard` - Total costs, averages
- `CostByCourierChart` - Bar chart of costs per courier
- `CostTrendsChart` - Line chart of monthly costs
- `ExpensiveRoutesTable` - Table of high-cost routes
- `SavingsRecommendations` - AI-powered suggestions

---

### **2. Price Comparison Tool**

**Location:** `apps/web/src/components/pricing/PriceComparison.tsx`

**Features:**
- Input delivery details (from/to, weight, dimensions)
- Compare prices across all available couriers
- Show price breakdown (base + fees)
- Show TrustScore alongside price
- Highlight best value (price + performance)
- Quick select courier

**UI:**
```
┌─────────────────────────────────────────┐
│ Price Comparison Tool                   │
├─────────────────────────────────────────┤
│ From: [11122] To: [41301]              │
│ Weight: [2.5 kg] Service: [Home ▼]     │
│ [Compare Prices]                        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ PostNord          79.78 SEK    ⭐   │ │
│ │ TrustScore: 85.5  2 days            │ │
│ │ [View Breakdown] [Select]           │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ Bring             89.00 SEK         │ │
│ │ TrustScore: 82.0  3 days            │ │
│ │ [View Breakdown] [Select]           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### **3. Price Sheet Upload**

**Location:** `apps/web/src/pages/courier/PriceSheetUpload.tsx`

**Features:**
- Drag & drop CSV upload
- CSV template download
- Upload progress indicator
- Validation errors display
- Upload history table
- Bulk update confirmation

**UI:**
```
┌─────────────────────────────────────────┐
│ Upload Price Sheet                      │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  📄 Drag & drop CSV file here       │ │
│ │     or click to browse              │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Download CSV Template]                 │
│                                         │
│ Effective Date: [2025-11-01]           │
│ Expiry Date: [Optional]                │
│                                         │
│ [Upload Price Sheet]                    │
├─────────────────────────────────────────┤
│ Upload History                          │
│ ┌─────────────────────────────────────┐ │
│ │ 2025-11-01  prices_nov.csv  ✅      │ │
│ │ 2025-10-15  prices_oct.csv  ✅      │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

### **4. Pricing Rules Manager (Courier)**

**Location:** `apps/web/src/pages/courier/PricingRulesManager.tsx`

**Features:**
- List all pricing rules
- Filter by zone, service type
- Add/edit/delete rules
- Bulk import from CSV
- Rule validity dates
- Preview calculated prices

---

### **5. Cost Insights Widget (Dashboard)**

**Location:** `apps/web/src/components/dashboard/CostInsightsWidget.tsx`

**Features:**
- This month's delivery costs
- Comparison to last month
- Average cost per order
- Most expensive courier
- Quick link to full pricing dashboard

**UI:**
```
┌─────────────────────────────────────────┐
│ 💰 Delivery Costs This Month            │
├─────────────────────────────────────────┤
│ Total: 15,750 SEK  ↑ 12% vs last month │
│ Avg per order: 63 SEK                   │
│ Most expensive: PostNord (8,500 SEK)    │
│                                         │
│ [View Full Dashboard →]                 │
└─────────────────────────────────────────┘
```

---

## 🔐 SECURITY & PERMISSIONS

### **RLS Policies**

```sql
-- Merchants can view their own pricing history
CREATE POLICY merchant_view_own_pricing_history ON order_pricing_history
    FOR SELECT
    USING (
        order_id IN (
            SELECT order_id FROM orders 
            WHERE merchant_id = auth.uid()
        )
    );

-- Couriers can manage their own pricing rules
CREATE POLICY courier_manage_own_pricing_rules ON courier_pricing_rules
    FOR ALL
    USING (
        courier_id IN (
            SELECT courier_id FROM couriers 
            WHERE user_id = auth.uid()
        )
    );

-- Couriers can upload their own price sheets
CREATE POLICY courier_upload_own_price_sheets ON courier_price_sheets
    FOR INSERT
    WITH CHECK (
        courier_id IN (
            SELECT courier_id FROM couriers 
            WHERE user_id = auth.uid()
        )
    );

-- Admins can view all pricing data
CREATE POLICY admin_view_all_pricing ON courier_pricing_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
```

---

## 📊 ANALYTICS & REPORTING

### **Merchant Reports:**
1. **Monthly Cost Report**
   - Total delivery costs
   - Cost per courier
   - Cost per service type
   - Cost trends

2. **Cost Comparison Report**
   - Actual costs vs estimated
   - Courier price comparison
   - Cost-saving opportunities

3. **Route Analysis**
   - Most expensive routes
   - Cheapest routes
   - Average cost by distance

### **Courier Reports:**
1. **Pricing Coverage Report**
   - Zones with pricing
   - Zones without pricing
   - Price rule gaps

2. **Competitive Analysis**
   - Price comparison vs competitors
   - Market positioning

---

## 🧪 TESTING STRATEGY

### **Unit Tests:**
- Price calculation logic
- CSV parsing
- Rule matching algorithm
- Discount calculations

### **Integration Tests:**
- API endpoints
- Database queries
- File upload processing

### **E2E Tests:**
- Upload price sheet flow
- Calculate price flow
- Compare prices flow
- View cost analytics flow

---

## 📅 IMPLEMENTATION PLAN

### **Phase 1: Database & Backend (4-5 hours)**
1. Create database tables (1h)
2. Create pricing calculation function (1h)
3. Create API endpoints (2h)
4. Add RLS policies (30min)
5. Test APIs (30min)

### **Phase 2: CSV Upload (2-3 hours)**
1. Create upload endpoint (1h)
2. CSV parsing logic (1h)
3. Background processing (30min)
4. Error handling (30min)

### **Phase 3: Frontend (3-4 hours)**
1. Pricing dashboard (1.5h)
2. Price comparison tool (1h)
3. Price sheet upload UI (1h)
4. Cost insights widget (30min)

### **Phase 4: Testing & Documentation (1-2 hours)**
1. Write tests (1h)
2. Update documentation (30min)
3. Create user guides (30min)

**Total Estimated Time:** 10-14 hours

---

## 🎯 SUCCESS CRITERIA

### **Minimum (Must Have):**
- ✅ Merchants can view delivery costs in dashboard
- ✅ Couriers can upload price sheets via CSV
- ✅ Price calculation works for basic scenarios
- ✅ Cost analytics show total and average costs

### **Target (Should Have):**
- ✅ Price comparison across multiple couriers
- ✅ Cost breakdown (base + fees)
- ✅ Monthly cost trends
- ✅ Cost-saving recommendations

### **Stretch (Nice to Have):**
- ✅ Real-time API pricing integration
- ✅ Automated price updates
- ✅ Predictive cost modeling
- ✅ Budget alerts

---

## 📝 NOTES

### **CSV Template Format:**
```csv
zone_name,service_type,package_type,weight_from,weight_to,base_price,price_per_kg,fuel_surcharge_percent,handling_fee,valid_from,valid_to
Stockholm,home_delivery,small,0,5,49.00,5.00,3.5,0,2025-01-01,
Stockholm,home_delivery,medium,5,10,69.00,7.00,3.5,5.00,2025-01-01,
```

### **Pricing Calculation Logic:**
```
Total Price = Base Price 
            + (Weight × Price per KG)
            + (Distance × Price per KM)
            + (Base Price × Fuel Surcharge %)
            + Handling Fee
            + Insurance Fee
            + COD Fee
            - Discount Amount
```

### **Future Enhancements:**
- Real-time API integration with courier systems
- Dynamic pricing based on demand
- Bulk discount negotiations
- Contract management
- Invoice reconciliation

---

## ✅ APPROVAL CHECKLIST

**Before Implementation:**
- [ ] Review database schema
- [ ] Approve API endpoints
- [ ] Review UI mockups
- [ ] Confirm CSV format
- [ ] Approve implementation plan

**After Implementation:**
- [ ] Test price calculations
- [ ] Test CSV upload
- [ ] Test price comparison
- [ ] Review cost analytics
- [ ] User acceptance testing

---

**Ready to implement?** This feature will significantly increase platform value for merchants! 💰

---

*Generated: November 1, 2025, 10:25 PM*  
*Status: 📋 SPECIFICATION COMPLETE*  
*Next: Approval and implementation*
