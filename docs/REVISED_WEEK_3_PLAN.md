# 📅 REVISED WEEK 3 PLAN - NOVEMBER 10-14, 2025

**Updated:** Sunday, November 9, 2025, 9:56 PM  
**Change:** Prioritize Courier Pricing on Monday  
**Reason:** Critical for platform functionality

---

## 🔄 WHAT CHANGED

### **ORIGINAL PLAN:**
- **Monday:** Dynamic Ranking + Shipment Booking
- **Tuesday:** Label Generation + Real-Time Tracking
- **Wednesday:** Courier Pricing

### **REVISED PLAN:**
- **Monday:** Courier Pricing (PRIORITY)
- **Tuesday:** Dynamic Ranking + Shipment Booking
- **Wednesday:** Label Generation + Real-Time Tracking

**Why:** Pricing is critical for the entire platform to function. Without accurate pricing, we can't:
- Show costs to customers
- Calculate margins
- Process payments
- Book shipments

---

## 📋 DAY-BY-DAY BREAKDOWN

### **MONDAY, NOVEMBER 10 - COURIER PRICING** 🎯
**Time:** 9:00 AM - 5:00 PM (8 hours)  
**Priority:** CRITICAL  
**Status:** ⏳ NOT STARTED

#### **9:00 AM - 11:00 AM: Database Schema (2h)**

**Create Pricing Tables:**
```sql
-- Courier base pricing
CREATE TABLE courier_pricing (
  pricing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  service_level VARCHAR(50), -- 'standard', 'express', 'same_day'
  base_price DECIMAL(10,2),
  price_per_kg DECIMAL(10,2),
  price_per_km DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  valid_from DATE,
  valid_to DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing zones (postal code ranges)
CREATE TABLE pricing_zones (
  zone_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  zone_name VARCHAR(100),
  postal_code_from VARCHAR(10),
  postal_code_to VARCHAR(10),
  zone_multiplier DECIMAL(5,2) DEFAULT 1.0, -- 1.0 = normal, 1.5 = 50% more expensive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Surcharges
CREATE TABLE pricing_surcharges (
  surcharge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  surcharge_type VARCHAR(50), -- 'fuel', 'remote_area', 'oversized', 'fragile', 'insurance'
  surcharge_name VARCHAR(100),
  surcharge_amount DECIMAL(10,2),
  surcharge_percentage DECIMAL(5,2), -- NULL if fixed amount
  applies_to VARCHAR(50), -- 'all', 'express', 'standard'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight tiers
CREATE TABLE pricing_weight_tiers (
  tier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  service_level VARCHAR(50),
  weight_from DECIMAL(10,2), -- kg
  weight_to DECIMAL(10,2), -- kg
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Distance tiers
CREATE TABLE pricing_distance_tiers (
  tier_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  service_level VARCHAR(50),
  distance_from INTEGER, -- km
  distance_to INTEGER, -- km
  price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pricing_courier ON courier_pricing(courier_id);
CREATE INDEX idx_pricing_service ON courier_pricing(service_level);
CREATE INDEX idx_zones_courier ON pricing_zones(courier_id);
CREATE INDEX idx_zones_postal ON pricing_zones(postal_code_from, postal_code_to);
CREATE INDEX idx_surcharges_courier ON pricing_surcharges(courier_id);
CREATE INDEX idx_weight_tiers_courier ON pricing_weight_tiers(courier_id);
CREATE INDEX idx_distance_tiers_courier ON pricing_distance_tiers(courier_id);
```

**Files to Create:**
- `database/migrations/create_courier_pricing_tables.sql`

**Tasks:**
- [ ] Create all 5 pricing tables
- [ ] Add indexes for performance
- [ ] Test table creation
- [ ] Add sample data for testing

---

#### **11:00 AM - 12:00 PM: Pricing Calculation Function (1h)**

**Create Calculation Function:**
```sql
CREATE OR REPLACE FUNCTION calculate_shipping_price(
  p_courier_id UUID,
  p_service_level VARCHAR(50),
  p_weight DECIMAL(10,2), -- kg
  p_distance INTEGER, -- km
  p_from_postal VARCHAR(10),
  p_to_postal VARCHAR(10),
  p_surcharges TEXT[] DEFAULT NULL -- array of surcharge types
) RETURNS JSONB AS $$
DECLARE
  v_base_price DECIMAL(10,2);
  v_weight_cost DECIMAL(10,2);
  v_distance_cost DECIMAL(10,2);
  v_zone_multiplier DECIMAL(5,2) DEFAULT 1.0;
  v_surcharge_total DECIMAL(10,2) DEFAULT 0;
  v_final_price DECIMAL(10,2);
  v_breakdown JSONB;
BEGIN
  -- 1. Get base price
  SELECT base_price INTO v_base_price
  FROM courier_pricing
  WHERE courier_id = p_courier_id
    AND service_level = p_service_level
    AND active = true
    AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
    AND (valid_to IS NULL OR valid_to >= CURRENT_DATE)
  LIMIT 1;

  -- 2. Calculate weight cost (tiered)
  SELECT price INTO v_weight_cost
  FROM pricing_weight_tiers
  WHERE courier_id = p_courier_id
    AND service_level = p_service_level
    AND p_weight >= weight_from
    AND p_weight < weight_to
  LIMIT 1;

  -- 3. Calculate distance cost (tiered)
  SELECT price INTO v_distance_cost
  FROM pricing_distance_tiers
  WHERE courier_id = p_courier_id
    AND service_level = p_service_level
    AND p_distance >= distance_from
    AND p_distance < distance_to
  LIMIT 1;

  -- 4. Get zone multiplier
  SELECT zone_multiplier INTO v_zone_multiplier
  FROM pricing_zones
  WHERE courier_id = p_courier_id
    AND p_to_postal >= postal_code_from
    AND p_to_postal <= postal_code_to
  LIMIT 1;

  -- 5. Calculate surcharges
  IF p_surcharges IS NOT NULL THEN
    SELECT COALESCE(SUM(surcharge_amount), 0) INTO v_surcharge_total
    FROM pricing_surcharges
    WHERE courier_id = p_courier_id
      AND surcharge_type = ANY(p_surcharges)
      AND active = true;
  END IF;

  -- 6. Calculate final price
  v_final_price := (v_base_price + v_weight_cost + v_distance_cost) * v_zone_multiplier + v_surcharge_total;

  -- 7. Build breakdown
  v_breakdown := jsonb_build_object(
    'base_price', v_base_price,
    'weight_cost', v_weight_cost,
    'distance_cost', v_distance_cost,
    'zone_multiplier', v_zone_multiplier,
    'surcharge_total', v_surcharge_total,
    'final_price', v_final_price
  );

  RETURN v_breakdown;
END;
$$ LANGUAGE plpgsql;
```

**Files to Create:**
- `database/functions/calculate_shipping_price.sql`

**Tasks:**
- [ ] Create calculation function
- [ ] Test with sample data
- [ ] Verify accuracy
- [ ] Handle edge cases

---

#### **LUNCH BREAK (12:00 PM - 1:00 PM)**

---

#### **1:00 PM - 3:30 PM: Pricing API Endpoint (2.5h)**

**Create API Endpoint:**
```typescript
// apps/api/couriers/calculate-price.ts
import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PriceRequest {
  courier_id: string;
  service_level: 'standard' | 'express' | 'same_day';
  weight: number; // kg
  distance: number; // km
  from_postal: string;
  to_postal: string;
  surcharges?: string[]; // ['fuel', 'remote_area', 'insurance']
}

interface PriceResponse {
  courier_id: string;
  service_level: string;
  base_price: number;
  weight_cost: number;
  distance_cost: number;
  zone_multiplier: number;
  surcharge_total: number;
  final_price: number;
  currency: string;
  valid_until: string;
}

export default async function handler(req: Request, res: Response) {
  try {
    // Validate request
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      courier_id,
      service_level,
      weight,
      distance,
      from_postal,
      to_postal,
      surcharges
    }: PriceRequest = req.body;

    // Validate inputs
    if (!courier_id || !service_level || !weight || !distance || !from_postal || !to_postal) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (weight <= 0 || weight > 1000) {
      return res.status(400).json({ error: 'Invalid weight (must be 0-1000 kg)' });
    }

    if (distance <= 0 || distance > 10000) {
      return res.status(400).json({ error: 'Invalid distance (must be 0-10000 km)' });
    }

    // Call pricing function
    const { data, error } = await supabase.rpc('calculate_shipping_price', {
      p_courier_id: courier_id,
      p_service_level: service_level,
      p_weight: weight,
      p_distance: distance,
      p_from_postal: from_postal,
      p_to_postal: to_postal,
      p_surcharges: surcharges || null
    });

    if (error) {
      console.error('Pricing calculation error:', error);
      return res.status(500).json({ error: 'Failed to calculate price' });
    }

    if (!data) {
      return res.status(404).json({ error: 'No pricing found for this courier/service' });
    }

    // Format response
    const response: PriceResponse = {
      courier_id,
      service_level,
      base_price: parseFloat(data.base_price),
      weight_cost: parseFloat(data.weight_cost),
      distance_cost: parseFloat(data.distance_cost),
      zone_multiplier: parseFloat(data.zone_multiplier),
      surcharge_total: parseFloat(data.surcharge_total),
      final_price: parseFloat(data.final_price),
      currency: 'NOK', // TODO: Make dynamic based on region
      valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Pricing API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Files to Create:**
- `apps/api/couriers/calculate-price.ts`

**Tasks:**
- [ ] Create API endpoint
- [ ] Add input validation
- [ ] Add error handling
- [ ] Test with Postman/curl
- [ ] Add rate limiting

---

#### **3:30 PM - 4:30 PM: Bulk Pricing Endpoint (1h)**

**Create Bulk Comparison Endpoint:**
```typescript
// apps/api/couriers/compare-prices.ts
// POST /api/couriers/compare-prices
// Returns prices from ALL couriers for comparison

interface BulkPriceRequest {
  service_level: 'standard' | 'express' | 'same_day';
  weight: number;
  distance: number;
  from_postal: string;
  to_postal: string;
  surcharges?: string[];
}

interface CourierPrice {
  courier_id: string;
  courier_name: string;
  service_level: string;
  final_price: number;
  estimated_delivery_days: number;
  trust_score: number;
}

export default async function handler(req: Request, res: Response) {
  // Get all active couriers
  // Calculate price for each
  // Sort by price or trust score
  // Return comparison
}
```

**Files to Create:**
- `apps/api/couriers/compare-prices.ts`

**Tasks:**
- [ ] Create bulk pricing endpoint
- [ ] Query all active couriers
- [ ] Calculate prices in parallel
- [ ] Sort by price/score
- [ ] Return comparison

---

#### **4:30 PM - 5:00 PM: Testing & Documentation (30min)**

**Test Scenarios:**
1. Calculate price for standard service
2. Calculate price for express service
3. Calculate with surcharges
4. Calculate for remote area (zone multiplier)
5. Compare prices across couriers
6. Test edge cases (0 weight, huge distance)
7. Test invalid inputs

**Documentation:**
- [ ] API documentation
- [ ] Pricing logic explanation
- [ ] Sample requests/responses
- [ ] Integration guide

**Files to Create:**
- `docs/COURIER_PRICING_API.md`
- `docs/PRICING_CALCULATION_LOGIC.md`

---

## 📊 MONDAY SUCCESS CRITERIA

### **Must Complete:**
- [ ] All 5 pricing tables created
- [ ] Pricing calculation function working
- [ ] `/api/couriers/calculate-price` endpoint working
- [ ] `/api/couriers/compare-prices` endpoint working
- [ ] All tests passing
- [ ] Documentation complete

### **Quality Targets:**
- API response time: < 300ms
- Calculation accuracy: 100%
- Error handling: Complete
- Documentation: Clear

---

## 📅 REST OF WEEK 3

### **TUESDAY, NOVEMBER 11 - CHECKOUT VALIDATION + RANKING/BOOKING**
**Time:** 8 hours  
**Status:** ▶︎ IN PROGRESS

**9 AM - 11:30 AM: Checkout + Feature Flag Verification (2.5h)**
- Validate `CourierSelector` against `/api/couriers/rankings` on shared Vercel project.
- Confirm fallback to `/api/couriers/ratings-by-postal` when feature flag disabled.
- Smoke test Shopify checkout extension (postal validation + courier list) using live merchant context.
- Capture QA notes + screenshots for PLAN_VS_REALITY_AUDIT.

**11:30 AM - 12:30 PM: Plugin/App Data Capture Review (1h)**
- Audit Shopify + WooCommerce integrations for address, postal code, and parcel dimension payloads.
- Verify postal validation endpoint reuse (`/api/postal-codes/validate`) to avoid duplicate customer inputs.
- Identify gaps in parcel size capture for accurate pricing.

**1 PM - 3 PM: Shipment Booking API Alignment (2h)**
- Revisit booking schema draft; confirm it leverages pricing + dynamic ranking outputs.
- Outline end-to-end booking flow (checkout → booking entry → courier API).
- Document outstanding tasks to connect Shopify/WooCommerce events to booking pipeline.

**3 PM - 4:30 PM: Dynamic Ranking Hardening (1.5h)**
- Add telemetry/logging notes from live checkout tests.
- Plan cron/job trigger for `update_courier_ranking_scores` (defer coding to W3D3).
- Record merchant override requirements for `merchant_ranking_settings` table.

**4:30 PM - 5 PM: Documentation & Deployment (0.5h)**
- Update PLAN_VS_REALITY_AUDIT and daily briefing with results.
- Ensure commits pushed + Vercel deployment confirmed.
- Note investor highlights if checkout demo succeeds.

---

### **WEDNESDAY, NOVEMBER 12 - LABEL GENERATION + TRACKING**
**Time:** 8 hours  
**Status:** ⏳ NOT STARTED

**9 AM - 12 PM: Label Generation (3h)**
- PDF generation setup
- Label templates
- API endpoint

**1 PM - 5 PM: Real-Time Tracking (4h)**
- WebSocket setup
- GPS data processing
- Live updates

---

### **THURSDAY, NOVEMBER 13 - RULES + PARCEL SHOPS**
**Time:** 8 hours  
**Status:** ⏳ NOT STARTED

**9 AM - 1 PM: Merchant Rules Engine (4h)**
- Rules schema
- Rule execution engine
- Testing

**2 PM - 5 PM: Parcel Shops (3h)**
- Parcel shop schema
- Search API
- Integration

---

### **FRIDAY, NOVEMBER 14 - NOTIFICATIONS + TESTING**
**Time:** 8 hours  
**Status:** ⏳ NOT STARTED

**9 AM - 12 PM: Customer Notifications (3h)**
- Email templates
- SMS integration
- Notification system

**1 PM - 5 PM: Integration Testing (4h)**
- End-to-end tests
- Bug fixes
- Documentation

---

## 📊 WEEK 3 SUMMARY

### **Total Time:** 40 hours (5 days × 8 hours)

### **Deliverables:**
1. ✅ Courier Pricing (Monday)
2. ✅ Dynamic Ranking (Tuesday)
3. ✅ Shipment Booking (Tuesday)
4. ✅ Label Generation (Wednesday)
5. ✅ Real-Time Tracking (Wednesday)
6. ✅ Merchant Rules (Thursday)
7. ✅ Parcel Shops (Thursday)
8. ✅ Notifications (Friday)
9. ✅ Complete Testing (Friday)

### **Result:**
**MVP READY by Friday, November 14** 🚀

---

## 🎯 WHY PRICING FIRST?

### **Pricing is Critical Because:**

1. **Checkout Flow Depends on It**
   - Can't show prices without pricing system
   - Can't complete orders without knowing costs
   - Can't process payments without final price

2. **Courier Selection Depends on It**
   - Users choose couriers based on price
   - Need to compare prices across couriers
   - Dynamic ranking uses price as factor

3. **Revenue Depends on It**
   - Can't calculate margins without pricing
   - Can't track profitability
   - Can't optimize courier selection

4. **Everything Else Depends on It**
   - Booking needs price
   - Labels need price
   - Tracking needs price
   - Notifications need price

**Without pricing, the platform doesn't work!**

---

**Status:** 🎯 **REVISED & READY**  
**Monday Focus:** ⚡ **COURIER PRICING (CRITICAL)**  
**Tuesday:** 🚀 **RANKING + BOOKING**  
**MVP Ready:** 📅 **FRIDAY, NOV 14**

**Let's build the pricing system Monday and unlock everything else!** 💪
