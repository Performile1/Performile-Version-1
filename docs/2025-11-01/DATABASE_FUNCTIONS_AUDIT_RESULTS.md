# DATABASE FUNCTIONS AUDIT RESULTS

**Date:** November 1, 2025, 8:10 PM  
**Purpose:** Audit existing functions before implementing dynamic ranking  
**Status:** ✅ AUDIT COMPLETE

---

## 🎯 CRITICAL FUNCTIONS STATUS

### **✅ RATING & REVIEW SYSTEM (CORE FUNCTIONS)**

#### **1. TrustScore Calculation** ✅ EXISTS
**File:** `database/functions/trustscore_functions.sql`

**Functions:**
- ✅ `calculate_courier_trustscore(courier_id)` - Calculate weighted TrustScore
- ✅ `update_courier_trustscore_cache(courier_id)` - Update cache table
- ✅ `refresh_all_trustscores()` - Refresh all couriers
- ✅ `trigger_trustscore_update()` - Auto-update on review/order changes

**Triggers:**
- ✅ `reviews_trustscore_update` - Fires on review INSERT/UPDATE/DELETE
- ✅ `orders_trustscore_update` - Fires on order status/delivery date changes

**Weighting:**
- Rating: 25%
- Completion Rate: 20%
- On-Time Rate: 20%
- Response Time: 10%
- Customer Satisfaction: 10%
- Issue Resolution: 5%
- Delivery Attempts: 5%
- Last Mile Performance: 5%

**Status:** ✅ PRODUCTION READY

---

#### **2. Merchant Courier Selection** ✅ EXISTS
**File:** `database/migrations/2025-10-31_merchant_courier_selections.sql`

**Functions:**
- ✅ `get_merchant_subscription_info(merchant_id)` - Returns subscription limits
- ✅ `get_available_couriers_for_merchant(merchant_id)` - Returns courier list with TrustScore
- ✅ `check_courier_selection_limit(merchant_id)` - Validates subscription limits

**Recent Fixes:**
- ✅ Fixed ambiguous column reference (Oct 31)
- ✅ Fixed RECORD type bug (Oct 31)
- ✅ Fixed type mismatch (Oct 31)

**Status:** ✅ PRODUCTION READY (Fixed yesterday!)

---

### **❌ MISSING FUNCTIONS (NEEDED FOR DYNAMIC RANKING)**

#### **1. Checkout Analytics Calculations** ❌ MISSING

**Needed:**
```sql
CREATE FUNCTION calculate_courier_selection_rate(
  courier_id UUID,
  postal_area VARCHAR DEFAULT NULL,
  days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_displays BIGINT,
  total_selections BIGINT,
  selection_rate NUMERIC,
  avg_position_shown NUMERIC,
  avg_position_selected NUMERIC
);
```

**Purpose:** Calculate how often courier is selected when shown in checkout

---

#### **2. Position Performance** ❌ MISSING

**Needed:**
```sql
CREATE FUNCTION calculate_position_performance(
  courier_id UUID,
  postal_area VARCHAR DEFAULT NULL
)
RETURNS NUMERIC;
```

**Purpose:** Calculate if courier performs better/worse than expected for their position

**Logic:**
- Position 1 expected: 40% selection
- Position 2 expected: 25% selection
- Position 3 expected: 15% selection
- Performance = Actual / Expected

---

#### **3. Dynamic Ranking Update** ❌ MISSING

**Needed:**
```sql
CREATE FUNCTION update_courier_ranking_scores(
  postal_area VARCHAR DEFAULT NULL
)
RETURNS INTEGER;
```

**Purpose:** Calculate and update all ranking scores for all couriers

**Uses:**
- Performance metrics from `courier_analytics`
- Conversion metrics from `checkout_courier_analytics`
- Calculates weighted final score
- Updates `courier_ranking_scores` table

---

### **✅ EXISTING ANALYTICS FUNCTIONS**

#### **From Week 4 Implementation:**

**Service Performance:**
- ✅ Functions for service-level analytics
- ✅ Geographic performance breakdown
- ✅ Materialized views for performance

**Parcel Points:**
- ✅ Location-based queries
- ✅ Coverage checking
- ✅ Distance calculations

---

## 📊 DATABASE TABLES STATUS

### **✅ EXISTING TABLES (RELEVANT)**

**Reviews & Ratings:**
- ✅ `reviews` - Customer reviews
- ✅ `courier_analytics` - Aggregated courier metrics
- ✅ `CourierTrustScores` - Cached TrustScore values

**Orders:**
- ✅ `orders` - Order data with delivery metrics
- ✅ Columns: `order_status`, `delivery_date`, `estimated_delivery`

**Checkout Analytics:**
- ✅ `checkout_courier_analytics` - Created today!
- ✅ Tracks: position_shown, was_selected, trust_score_at_time
- ✅ Captures: order_value, delivery_location, session data

---

### **❌ MISSING TABLES (NEEDED FOR DYNAMIC RANKING)**

#### **1. courier_ranking_scores** ❌ MISSING

**Purpose:** Store calculated ranking scores per courier per postal area

**Columns:**
- courier_id, postal_area
- Performance metrics (trust_score, on_time_rate, etc.)
- Conversion metrics (selection_rate, position_performance)
- Trend analysis (conversion_trend, performance_trend)
- Final ranking score

**Status:** SQL created (`CREATE_DYNAMIC_RANKING_TABLES.sql`) - ready to deploy

---

#### **2. courier_ranking_history** ❌ MISSING

**Purpose:** Historical snapshots for trend analysis

**Columns:**
- courier_id, postal_area, snapshot_date
- ranking_score, rank_position
- Performance snapshot

**Status:** SQL created - ready to deploy

---

## 🎯 WHAT NEEDS TO BE DONE

### **Phase 1: Deploy Tables** (5 min)
```bash
# Run in Supabase SQL Editor
database/CREATE_DYNAMIC_RANKING_TABLES.sql
```

**Creates:**
- ✅ `courier_ranking_scores` table
- ✅ `courier_ranking_history` table
- ✅ Indexes (6 total)
- ✅ RLS policies (6 total)

---

### **Phase 2: Create Functions** (30 min)

**Need to create:**
1. ✅ `calculate_courier_selection_rate()` - From checkout analytics
2. ✅ `calculate_position_performance()` - Performance vs expected
3. ✅ `update_courier_ranking_scores()` - Main ranking calculation

**Status:** Specifications complete in `DYNAMIC_COURIER_RANKING_SPEC.md`

---

### **Phase 3: Update API** (15 min)

**Modify:** `api/couriers/ratings-by-postal.ts`

**Change:**
```sql
-- OLD: Static ranking
ORDER BY trust_score DESC, total_reviews DESC

-- NEW: Dynamic ranking
LEFT JOIN courier_ranking_scores crs ON ...
ORDER BY crs.final_ranking_score DESC, trust_score DESC
```

---

### **Phase 4: Cron Job** (15 min)

**Create:** `api/cron/update-courier-rankings.ts`

**Schedule:** Daily at 2 AM

**Actions:**
1. Call `update_courier_ranking_scores()`
2. Save snapshot to `courier_ranking_history`
3. Log results

---

### **Phase 5: Analytics** (30 min)

**Add to merchant dashboard:**
- Ranking trend chart
- Position performance metrics
- Selection rate analytics
- Geographic performance

---

## ✅ SUMMARY

### **What We Have:**
- ✅ Complete TrustScore calculation system
- ✅ Merchant courier selection functions
- ✅ Checkout analytics tracking (created today)
- ✅ Review/rating system fully functional
- ✅ Order performance metrics

### **What We Need:**
- ❌ 2 database tables (SQL ready)
- ❌ 3 calculation functions (specs ready)
- ❌ API update (15 min)
- ❌ Cron job (15 min)
- ❌ Dashboard analytics (30 min)

### **Total Implementation Time:**
- Phase 1: 5 min (deploy tables)
- Phase 2: 30 min (create functions)
- Phase 3: 15 min (update API)
- Phase 4: 15 min (cron job)
- Phase 5: 30 min (analytics)

**Total: ~1.5 hours** (reduced from 3-4 hours because core functions exist!)

---

## 🚀 RECOMMENDATION

**Proceed with implementation NOW:**

1. ✅ Core review/rating system is solid
2. ✅ TrustScore calculation is production-ready
3. ✅ Checkout analytics table exists
4. ✅ All prerequisites in place
5. ✅ Only need ranking layer on top

**No blockers found!** ✅

---

## 📄 RELATED FILES

**Existing Functions:**
- `database/functions/trustscore_functions.sql`
- `database/migrations/2025-10-31_merchant_courier_selections.sql`
- `database/CREATE_CHECKOUT_ANALYTICS_TABLE.sql`

**New Files (Ready):**
- `database/CREATE_DYNAMIC_RANKING_TABLES.sql`
- `docs/2025-11-01/DYNAMIC_COURIER_RANKING_SPEC.md`

**To Create:**
- `database/CREATE_RANKING_FUNCTIONS.sql`
- `api/cron/update-courier-rankings.ts`

---

*Audit Complete: November 1, 2025, 8:10 PM*  
*Status: ✅ READY TO PROCEED*  
*Estimated Time: 1.5 hours (reduced from 3-4)*
