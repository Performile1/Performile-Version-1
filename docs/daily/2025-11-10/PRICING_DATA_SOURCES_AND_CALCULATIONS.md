# 💰 COURIER PRICING: DATA SOURCES & CALCULATIONS

**Date:** November 10, 2025, 8:15 AM  
**Purpose:** Answer critical questions about pricing data and calculations  
**Status:** ARCHITECTURAL DECISIONS NEEDED

---

## ❓ YOUR CRITICAL QUESTIONS:

1. **"Do we have a PostNord price/quote API?"** - Need to check
2. **"Could we add function for uploading CSV file?"** - YES! Great idea
3. **"Need volumetric weight calculation?"** - YES! Essential
4. **"Need function for adding surcharges?"** - YES! Already planned

---

## 🔍 CURRENT STATUS

### **PostNord API Integration:**
- ❌ No PostNord API integration found
- ❌ No courier API integrations exist yet
- ❌ No live price quotes from couriers

**This means:** We need MANUAL pricing data for now!

---

### **Volumetric Weight:**
- ✅ Found reference in `WEEK4_PHASE3_service_registration.sql`
- ✅ Column exists: `volumetric_divisor`
- ❌ No calculation function exists yet

**This means:** We need to build volumetric weight calculation!

---

## 🎯 TWO APPROACHES FOR PRICING DATA

### **APPROACH 1: MANUAL PRICING (Start Here)** ⭐ RECOMMENDED

**Why Start Manual:**
- Faster to implement (today)
- No API dependencies
- Full control over pricing
- Can test system immediately
- Real courier APIs come later (Week 4)

**How It Works:**
1. Admin uploads CSV with courier prices
2. System stores in database
3. Calculate prices from stored data
4. Later: Replace with live API calls

**Advantages:**
- ✅ Can launch without courier partnerships
- ✅ Test pricing logic thoroughly
- ✅ No API rate limits
- ✅ Predictable costs
- ✅ Works offline

**Disadvantages:**
- ⚠️ Prices may become outdated
- ⚠️ Manual updates needed
- ⚠️ No real-time fuel surcharges

---

### **APPROACH 2: LIVE COURIER APIs (Week 4)** 🚀 FUTURE

**When to Use:**
- After core system works
- When we have courier partnerships
- When we need real-time quotes

**How It Works:**
1. Call PostNord API: "What's the price for 5kg to Oslo?"
2. PostNord returns: "89 NOK"
3. Add merchant markup: +15% = 102 NOK
4. Show customer: 105 NOK (rounded)

**Advantages:**
- ✅ Always accurate prices
- ✅ Real-time fuel surcharges
- ✅ Automatic updates
- ✅ No manual maintenance

**Disadvantages:**
- ⚠️ Requires API credentials
- ⚠️ API rate limits
- ⚠️ Dependent on courier uptime
- ⚠️ More complex error handling

---

## 📊 RECOMMENDED HYBRID APPROACH

### **Phase 1 (Today): Manual Pricing**
Build system with CSV upload for pricing data

### **Phase 2 (Week 4): Add Live APIs**
Add courier API integrations alongside manual pricing

### **Phase 3 (Week 5+): Fallback System**
- Try live API first
- If API fails, use cached/manual prices
- Best of both worlds!

---

## 🎯 TODAY'S REVISED ARCHITECTURE

### **1. PRICING TABLES (Enhanced)**

#### **courier_base_prices** (Enhanced)
```sql
CREATE TABLE courier_base_prices (
  price_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  service_type VARCHAR(50),
  base_price DECIMAL(10,2),
  currency VARCHAR(3),
  
  -- Data source tracking
  price_source VARCHAR(20), -- 'manual', 'csv_upload', 'api', 'cached_api'
  last_updated TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID REFERENCES users(user_id),
  
  -- Validity
  effective_from DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

#### **courier_volumetric_rules** (NEW!)
```sql
CREATE TABLE courier_volumetric_rules (
  rule_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  service_type VARCHAR(50),
  
  -- Volumetric calculation
  volumetric_divisor INTEGER, -- e.g., 5000 for (L×W×H)/5000
  measurement_unit VARCHAR(10), -- 'cm' or 'inches'
  
  -- When to apply
  applies_when VARCHAR(50), -- 'always', 'if_greater_than_actual', 'international_only'
  min_dimensions_cm DECIMAL(10,2), -- Minimum size to apply rule
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Common Volumetric Divisors:**
- PostNord: 5000 (L×W×H in cm / 5000)
- DHL: 5000
- FedEx: 5000
- UPS: 5000
- Bring: 5000

**Example:**
- Package: 40cm × 30cm × 20cm = 24,000 cm³
- Volumetric weight: 24,000 / 5000 = 4.8 kg
- Actual weight: 3 kg
- **Charged weight: 4.8 kg** (higher of the two)

---

#### **courier_surcharge_rules** (Enhanced)
```sql
CREATE TABLE courier_surcharge_rules (
  surcharge_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  
  -- Surcharge details
  surcharge_type VARCHAR(50), -- 'fuel', 'insurance', 'handling', 'remote_area', 'oversized', 'dangerous_goods'
  surcharge_name VARCHAR(100),
  
  -- Amount calculation
  amount DECIMAL(10,2),
  amount_type VARCHAR(20), -- 'fixed', 'percentage', 'per_kg', 'per_km'
  
  -- Conditions
  applies_to VARCHAR(50), -- 'all', 'express', 'standard', 'weight_over_X', 'remote_areas'
  min_weight DECIMAL(10,2), -- Apply if weight > X
  max_weight DECIMAL(10,2), -- Apply if weight < X
  postal_code_pattern VARCHAR(10), -- Apply to specific postal codes
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### **2. CSV UPLOAD SYSTEM (NEW!)**

#### **pricing_csv_uploads** (NEW!)
```sql
CREATE TABLE pricing_csv_uploads (
  upload_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),
  uploaded_by UUID REFERENCES users(user_id),
  
  -- File details
  filename VARCHAR(255),
  file_size INTEGER,
  row_count INTEGER,
  
  -- Processing
  status VARCHAR(20), -- 'pending', 'processing', 'completed', 'failed'
  rows_processed INTEGER,
  rows_failed INTEGER,
  error_log TEXT,
  
  -- Metadata
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);
```

#### **CSV Format Example:**
```csv
service_type,weight_from,weight_to,distance_from,distance_to,postal_zone,base_price,price_per_kg,price_per_km
express,0,5,0,50,01%,50.00,10.00,2.00
express,0,5,50,200,01%,50.00,10.00,1.50
express,5,10,0,50,01%,60.00,8.00,2.00
standard,0,5,0,50,01%,35.00,8.00,1.50
```

---

### **3. CALCULATION FUNCTIONS (Enhanced)**

#### **calculate_volumetric_weight()** (NEW!)
```sql
CREATE FUNCTION calculate_volumetric_weight(
  p_courier_id UUID,
  p_service_type VARCHAR,
  p_length_cm DECIMAL,
  p_width_cm DECIMAL,
  p_height_cm DECIMAL,
  p_actual_weight_kg DECIMAL
)
RETURNS TABLE (
  actual_weight DECIMAL,
  volumetric_weight DECIMAL,
  chargeable_weight DECIMAL,
  calculation_method VARCHAR
) AS $$
DECLARE
  v_divisor INTEGER;
  v_volume DECIMAL;
  v_volumetric_weight DECIMAL;
  v_applies_when VARCHAR;
BEGIN
  -- Get volumetric rule for this courier
  SELECT volumetric_divisor, applies_when
  INTO v_divisor, v_applies_when
  FROM courier_volumetric_rules
  WHERE courier_id = p_courier_id
    AND service_type = p_service_type
    AND is_active = true
  LIMIT 1;
  
  -- If no rule, use actual weight
  IF v_divisor IS NULL THEN
    RETURN QUERY SELECT 
      p_actual_weight_kg,
      p_actual_weight_kg,
      p_actual_weight_kg,
      'actual_weight'::VARCHAR;
    RETURN;
  END IF;
  
  -- Calculate volumetric weight
  v_volume := p_length_cm * p_width_cm * p_height_cm;
  v_volumetric_weight := v_volume / v_divisor;
  
  -- Determine chargeable weight based on rule
  IF v_applies_when = 'always' THEN
    -- Always use volumetric
    RETURN QUERY SELECT 
      p_actual_weight_kg,
      v_volumetric_weight,
      v_volumetric_weight,
      'volumetric_always'::VARCHAR;
  ELSIF v_applies_when = 'if_greater_than_actual' THEN
    -- Use higher of the two
    RETURN QUERY SELECT 
      p_actual_weight_kg,
      v_volumetric_weight,
      GREATEST(p_actual_weight_kg, v_volumetric_weight),
      CASE 
        WHEN v_volumetric_weight > p_actual_weight_kg THEN 'volumetric_greater'
        ELSE 'actual_weight'
      END::VARCHAR;
  ELSE
    -- Default to actual weight
    RETURN QUERY SELECT 
      p_actual_weight_kg,
      v_volumetric_weight,
      p_actual_weight_kg,
      'actual_weight'::VARCHAR;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

#### **calculate_surcharges()** (NEW!)
```sql
CREATE FUNCTION calculate_surcharges(
  p_courier_id UUID,
  p_service_type VARCHAR,
  p_weight DECIMAL,
  p_distance DECIMAL,
  p_postal_code VARCHAR,
  p_base_price DECIMAL
)
RETURNS TABLE (
  surcharge_type VARCHAR,
  surcharge_name VARCHAR,
  amount DECIMAL,
  calculation_method VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csr.surcharge_type,
    csr.surcharge_name,
    CASE 
      WHEN csr.amount_type = 'fixed' THEN csr.amount
      WHEN csr.amount_type = 'percentage' THEN p_base_price * (csr.amount / 100)
      WHEN csr.amount_type = 'per_kg' THEN p_weight * csr.amount
      WHEN csr.amount_type = 'per_km' THEN p_distance * csr.amount
      ELSE 0
    END as amount,
    csr.amount_type as calculation_method
  FROM courier_surcharge_rules csr
  WHERE csr.courier_id = p_courier_id
    AND csr.is_active = true
    AND (csr.effective_from IS NULL OR csr.effective_from <= CURRENT_DATE)
    AND (csr.effective_to IS NULL OR csr.effective_to >= CURRENT_DATE)
    AND (
      csr.applies_to = 'all' 
      OR csr.applies_to = p_service_type
      OR (csr.min_weight IS NOT NULL AND p_weight >= csr.min_weight)
      OR (csr.postal_code_pattern IS NOT NULL AND p_postal_code LIKE csr.postal_code_pattern)
    );
END;
$$ LANGUAGE plpgsql STABLE;
```

---

#### **calculate_courier_base_price()** (Enhanced)
```sql
CREATE FUNCTION calculate_courier_base_price(
  p_courier_id UUID,
  p_service_type VARCHAR,
  p_actual_weight DECIMAL,
  p_length_cm DECIMAL,
  p_width_cm DECIMAL,
  p_height_cm DECIMAL,
  p_distance DECIMAL,
  p_from_postal VARCHAR,
  p_to_postal VARCHAR
)
RETURNS TABLE (
  base_price DECIMAL,
  actual_weight DECIMAL,
  volumetric_weight DECIMAL,
  chargeable_weight DECIMAL,
  weight_cost DECIMAL,
  distance_cost DECIMAL,
  zone_multiplier DECIMAL,
  surcharges JSONB,
  total_surcharges DECIMAL,
  total_base_price DECIMAL,
  calculation_breakdown JSONB
) AS $$
DECLARE
  v_base_price DECIMAL;
  v_weight_cost DECIMAL;
  v_distance_cost DECIMAL;
  v_zone_mult DECIMAL := 1.0;
  v_chargeable_weight DECIMAL;
  v_volumetric_weight DECIMAL;
  v_surcharges JSONB;
  v_total_surcharges DECIMAL := 0;
BEGIN
  -- 1. Calculate volumetric weight
  SELECT cw.chargeable_weight, cw.volumetric_weight
  INTO v_chargeable_weight, v_volumetric_weight
  FROM calculate_volumetric_weight(
    p_courier_id, p_service_type,
    p_length_cm, p_width_cm, p_height_cm,
    p_actual_weight
  ) cw;
  
  -- 2. Get base price
  SELECT cbp.base_price
  INTO v_base_price
  FROM courier_base_prices cbp
  WHERE cbp.courier_id = p_courier_id
    AND cbp.service_type = p_service_type
    AND cbp.is_active = true
  LIMIT 1;
  
  -- 3. Calculate weight cost
  SELECT COALESCE(SUM(
    CASE 
      WHEN cwp.fixed_price IS NOT NULL THEN cwp.fixed_price
      ELSE v_chargeable_weight * cwp.price_per_kg
    END
  ), 0)
  INTO v_weight_cost
  FROM courier_weight_pricing cwp
  WHERE cwp.courier_id = p_courier_id
    AND cwp.service_type = p_service_type
    AND v_chargeable_weight >= cwp.min_weight
    AND v_chargeable_weight <= cwp.max_weight
    AND cwp.is_active = true;
  
  -- 4. Calculate distance cost
  SELECT COALESCE(SUM(
    CASE 
      WHEN cdp.fixed_price IS NOT NULL THEN cdp.fixed_price
      ELSE p_distance * cdp.price_per_km
    END
  ), 0)
  INTO v_distance_cost
  FROM courier_distance_pricing cdp
  WHERE cdp.courier_id = p_courier_id
    AND cdp.service_type = p_service_type
    AND p_distance >= cdp.min_distance
    AND p_distance <= cdp.max_distance
    AND cdp.is_active = true;
  
  -- 5. Get zone multiplier
  SELECT COALESCE(pcz.zone_multiplier, 1.0)
  INTO v_zone_mult
  FROM postal_code_zones pcz
  WHERE p_to_postal LIKE pcz.postal_code_pattern
    AND pcz.is_active = true
  LIMIT 1;
  
  -- 6. Calculate surcharges
  SELECT 
    jsonb_agg(jsonb_build_object(
      'type', cs.surcharge_type,
      'name', cs.surcharge_name,
      'amount', cs.amount
    )),
    COALESCE(SUM(cs.amount), 0)
  INTO v_surcharges, v_total_surcharges
  FROM calculate_surcharges(
    p_courier_id, p_service_type,
    v_chargeable_weight, p_distance,
    p_to_postal, v_base_price
  ) cs;
  
  -- 7. Return complete breakdown
  RETURN QUERY SELECT 
    COALESCE(v_base_price, 0),
    p_actual_weight,
    v_volumetric_weight,
    v_chargeable_weight,
    v_weight_cost,
    v_distance_cost,
    v_zone_mult,
    v_surcharges,
    v_total_surcharges,
    (COALESCE(v_base_price, 0) + v_weight_cost + v_distance_cost) * v_zone_mult + v_total_surcharges,
    jsonb_build_object(
      'base', COALESCE(v_base_price, 0),
      'weight_cost', v_weight_cost,
      'distance_cost', v_distance_cost,
      'subtotal', COALESCE(v_base_price, 0) + v_weight_cost + v_distance_cost,
      'zone_multiplier', v_zone_mult,
      'after_zone', (COALESCE(v_base_price, 0) + v_weight_cost + v_distance_cost) * v_zone_mult,
      'surcharges', v_total_surcharges,
      'total', (COALESCE(v_base_price, 0) + v_weight_cost + v_distance_cost) * v_zone_mult + v_total_surcharges
    );
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### **4. CSV UPLOAD API (NEW!)**

#### **/api/admin/upload-courier-pricing**
```typescript
POST /api/admin/upload-courier-pricing
Content-Type: multipart/form-data

{
  "courier_id": "uuid",
  "file": <CSV file>,
  "replace_existing": true/false
}

Response: {
  "upload_id": "uuid",
  "status": "processing",
  "rows_to_process": 150
}
```

#### **/api/admin/pricing-upload-status**
```typescript
GET /api/admin/pricing-upload-status?upload_id=uuid

Response: {
  "upload_id": "uuid",
  "status": "completed",
  "rows_processed": 150,
  "rows_failed": 2,
  "errors": [
    { "row": 45, "error": "Invalid weight range" },
    { "row": 78, "error": "Missing postal zone" }
  ]
}
```

---

## 🎯 TODAY'S REVISED WORK

### **Enhanced Tables (7 total):**
1. ✅ `courier_base_prices` (with CSV tracking)
2. ✅ `courier_weight_pricing`
3. ✅ `courier_distance_pricing`
4. ✅ `postal_code_zones`
5. ✅ `courier_surcharge_rules` (enhanced)
6. ✅ `courier_volumetric_rules` (NEW!)
7. ✅ `pricing_csv_uploads` (NEW!)

### **Enhanced Functions (4 total):**
1. ✅ `calculate_volumetric_weight()` (NEW!)
2. ✅ `calculate_surcharges()` (NEW!)
3. ✅ `calculate_courier_base_price()` (enhanced)
4. ✅ CSV import function (NEW!)

### **APIs (4 total):**
1. ✅ `/api/couriers/get-base-price`
2. ✅ `/api/couriers/calculate-price`
3. ✅ `/api/couriers/compare-prices`
4. ✅ `/api/admin/upload-courier-pricing` (NEW!)

---

## ✅ ANSWERS TO YOUR QUESTIONS

### **1. "Do we have PostNord price/quote API?"**
**Answer:** No, not yet. That's Week 4 work (courier API integrations).

**For today:** Build manual pricing system with CSV upload.

---

### **2. "Could we add function for uploading CSV file?"**
**Answer:** YES! Excellent idea!

**Added:**
- `pricing_csv_uploads` table
- CSV upload API
- CSV processing function
- Status tracking

---

### **3. "Need volumetric weight calculation?"**
**Answer:** YES! Essential for accurate pricing!

**Added:**
- `courier_volumetric_rules` table
- `calculate_volumetric_weight()` function
- Integrated into price calculation

---

### **4. "Need function for adding surcharges?"**
**Answer:** YES! Already planned, now enhanced!

**Added:**
- `courier_surcharge_rules` table (enhanced)
- `calculate_surcharges()` function
- Multiple surcharge types
- Conditional application

---

## 🎯 READY TO START?

**Today's work is now:**
- 7 tables (was 5)
- 4 functions (was 1)
- 4 APIs (was 3)

**Estimated time:** Still 8 hours (more features, same time)

**Priority order:**
1. Core pricing tables (2h)
2. Volumetric & surcharge tables (1h)
3. Calculation functions (2h)
4. APIs (2h)
5. CSV upload (1h)

**Ready to build?** 🚀
