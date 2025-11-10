# 🔍 DYNAMIC RANKING SYSTEM - AUDIT & STATUS

**Date:** November 10, 2025  
**Purpose:** Audit existing dynamic ranking system before building checkout integration  
**Status:** EXISTING SYSTEM - DO NOT DESTROY

---

## ✅ WHAT EXISTS (ALREADY BUILT)

### **1. Database Tables** ✅

#### **Table: `checkout_courier_analytics`**
**Purpose:** Track courier displays and selections in checkout  
**Status:** ✅ COMPLETE

**Columns:**
- `analytics_id` - UUID primary key
- `merchant_id` - Which merchant's checkout
- `courier_id` - Which courier was shown
- `checkout_session_id` - Unique session ID
- `position_shown` - Position in list (1, 2, 3...)
- `total_couriers_shown` - How many total shown
- `was_selected` - Did customer select this courier?
- `trust_score_at_time` - TrustScore when shown
- `price_at_time` - Price when shown
- `delivery_time_estimate_hours` - Estimated delivery
- `distance_km` - Distance from customer
- `order_value` - Cart value
- `items_count` - Number of items
- `package_weight_kg` - Package weight
- `delivery_postal_code` - Destination postal
- `delivery_city` - Destination city
- `delivery_country` - Destination country
- `event_timestamp` - When displayed

**Indexes:**
- ✅ `idx_checkout_analytics_merchant` - Query by merchant
- ✅ `idx_checkout_analytics_courier` - Query by courier
- ✅ `idx_checkout_analytics_session` - Query by session
- ✅ `idx_checkout_analytics_selected` - Query selections only
- ✅ `idx_checkout_analytics_postal` - Geographic analysis

**RLS Policies:**
- ✅ Merchants view own analytics
- ✅ Couriers view own analytics
- ✅ Admins view all
- ✅ Public insert (for checkout)

---

#### **Table: `courier_ranking_scores`**
**Purpose:** Store calculated ranking scores per courier per area  
**Status:** ✅ COMPLETE

**Columns:**
- `score_id` - UUID primary key
- `courier_id` - Which courier
- `postal_area` - First 3 digits of postal (e.g., "012" for Oslo)
- **Performance Metrics:**
  - `trust_score` - From TrustScore system
  - `on_time_rate` - Percentage on-time
  - `avg_delivery_days` - Average delivery time
  - `completion_rate` - Completion percentage
- **Conversion Metrics:**
  - `total_displays` - Times shown in checkout
  - `total_selections` - Times selected
  - `selection_rate` - selections / displays
  - `avg_position_shown` - Average position
  - `avg_position_selected` - Average when selected
  - `position_performance` - Actual vs expected rate
- **Trend Analysis:**
  - `conversion_trend` - 30-day vs 60-day
  - `performance_trend` - Improving or declining
- **Recency:**
  - `recent_performance` - Last 30 days
  - `activity_level` - Order volume
- **Final Score:**
  - `final_ranking_score` - Weighted sum (0-1 scale)

**Indexes:**
- ✅ `idx_ranking_scores_courier` - Query by courier
- ✅ `idx_ranking_scores_postal` - Query by postal
- ✅ `idx_ranking_scores_final` - Sort by score
- ✅ `idx_ranking_scores_area_score` - Area + score

---

#### **Table: `courier_ranking_history`**
**Purpose:** Historical snapshots for trend analysis  
**Status:** ✅ COMPLETE

**Columns:**
- `history_id` - UUID primary key
- `courier_id` - Which courier
- `postal_area` - Which area
- `ranking_score` - Score at time
- `rank_position` - Position (1st, 2nd, 3rd...)
- `trust_score` - TrustScore snapshot
- `selection_rate` - Selection rate snapshot
- `total_displays` - Displays snapshot
- `total_selections` - Selections snapshot
- `snapshot_date` - Date of snapshot

---

### **2. Calculation Functions** ✅

#### **Function: `calculate_courier_selection_rate()`**
**Purpose:** Calculate selection metrics from checkout analytics  
**Status:** ✅ COMPLETE

**Parameters:**
- `p_courier_id` - Courier to analyze
- `p_postal_area` - Optional area filter
- `p_days_back` - Days to look back (default 30)

**Returns:**
- `total_displays` - Times shown
- `total_selections` - Times selected
- `selection_rate` - Percentage selected
- `avg_position_shown` - Average position
- `avg_position_selected` - Average when selected

---

#### **Function: `calculate_position_performance()`**
**Purpose:** Calculate if courier performs better/worse than expected for their position  
**Status:** ✅ COMPLETE

**Logic:**
- Position 1: Expected 40% selection rate
- Position 2: Expected 25% selection rate
- Position 3: Expected 15% selection rate
- Position 4: Expected 10% selection rate
- Position 5+: Expected 5% selection rate

**Returns:**
- Performance score (1.0 = meets expectations)
- > 1.0 = Better than expected
- < 1.0 = Worse than expected

---

#### **Function: `update_courier_ranking_scores()`**
**Purpose:** Recalculate all ranking scores  
**Status:** ✅ COMPLETE

**Parameters:**
- `p_postal_area` - Optional area filter
- `p_courier_id` - Optional courier filter (ADDED - needs update)

**Calculation:**
```
Final Score = 
  Performance Metrics (50%):
    - TrustScore (20%)
    - On-time rate (15%)
    - Delivery speed (10%)
    - Completion rate (5%)
  
  Checkout Conversion (30%):
    - Selection rate (15%)
    - Position performance (10%)
    - Conversion trend (5%)
  
  Recency & Activity (20%):
    - Recent data (10%)
    - Activity level (10%)
```

**Returns:** Count of updated couriers

---

#### **Function: `save_ranking_snapshot()`**
**Purpose:** Save daily snapshot to history  
**Status:** ✅ COMPLETE

**Returns:** Count of saved snapshots

---

### **3. API Endpoint** ✅

#### **Endpoint: `/api/couriers/update-rankings`**
**Method:** POST  
**Status:** ✅ COMPLETE

**Query Params:**
- `postal_area` - Optional area filter
- `courier_id` - Optional courier filter

**Response:**
```json
{
  "success": true,
  "message": "Courier rankings updated successfully",
  "updated_count": 5,
  "summary": {
    "total_couriers": 5,
    "total_areas": 3,
    "avg_score": "0.7234",
    "max_score": "0.8912",
    "min_score": "0.5123",
    "last_update": "2025-11-10T09:00:00Z"
  },
  "filters": {
    "postal_area": "all",
    "courier_id": "all"
  }
}
```

---

## 🎯 HOW IT WORKS (CURRENT SYSTEM)

### **Step 1: Checkout Displays Couriers**
```
Customer enters checkout
↓
System queries available couriers
↓
Couriers sorted by final_ranking_score
↓
Top 3-5 couriers shown to customer
↓
Each display logged to checkout_courier_analytics
```

### **Step 2: Customer Selects Courier**
```
Customer clicks on a courier
↓
was_selected = true for that courier
↓
was_selected = false for others
↓
Analytics recorded
```

### **Step 3: Ranking Scores Updated (Daily)**
```
Cron job runs daily
↓
Calls update_courier_ranking_scores()
↓
Analyzes last 30 days of checkout data
↓
Calculates selection rates
↓
Combines with TrustScore
↓
Updates final_ranking_score
↓
Saves snapshot to history
```

### **Step 4: Next Checkout Uses New Rankings**
```
New customer enters checkout
↓
Couriers sorted by updated final_ranking_score
↓
Better performing couriers shown first
↓
Self-optimizing marketplace!
```

---

## ⚠️ WHAT'S MISSING (NEEDS TO BE BUILT)

### **1. Checkout Integration** ❌

**Missing:**
- API endpoint to log courier displays
- API endpoint to log courier selection
- Frontend integration in checkout
- Session tracking

**Needed:**
```
POST /api/checkout/log-courier-display
POST /api/checkout/log-courier-selection
```

---

### **2. Function Parameter Update** ⚠️

**Issue:** `update_courier_ranking_scores()` function signature doesn't match API usage

**Current Function:**
```sql
CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_area VARCHAR DEFAULT NULL
)
```

**API Calls It With:**
```typescript
SELECT update_courier_ranking_scores(
  $1::VARCHAR,  -- postal_area
  $2::UUID      -- courier_id (NOT IN FUNCTION!)
)
```

**FIX NEEDED:** Add `p_courier_id` parameter to function

---

### **3. Cron Job for Daily Updates** ❌

**Missing:**
- Scheduled job to run `update_courier_ranking_scores()` daily
- Scheduled job to run `save_ranking_snapshot()` daily

**Needed:**
- Vercel Cron or external scheduler
- Run at midnight daily

---

### **4. Checkout UI Integration** ❌

**Missing:**
- Display couriers sorted by ranking
- Track which position each courier is shown
- Track which courier customer selects
- Send analytics to backend

---

## 🔧 CHANGES NEEDED

### **Change 1: Fix Function Signature** ⚠️

**File:** `database/CREATE_RANKING_FUNCTIONS.sql`

**Current:**
```sql
CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_area VARCHAR DEFAULT NULL
)
```

**Change To:**
```sql
CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_area VARCHAR DEFAULT NULL,
  p_courier_id UUID DEFAULT NULL
)
```

**Then Update Loop:**
```sql
FOR v_courier IN 
  SELECT DISTINCT c.courier_id
  FROM couriers c
  WHERE c.is_active = true
    AND (p_courier_id IS NULL OR c.courier_id = p_courier_id)  -- ADD THIS
LOOP
```

---

### **Change 2: Create Checkout Analytics APIs** 🆕

**New Files Needed:**
1. `api/checkout/log-courier-display.ts`
2. `api/checkout/log-courier-selection.ts`

---

### **Change 3: Create Cron Job** 🆕

**New File:**
`api/cron/update-rankings.ts`

---

## 🚫 WHAT NOT TO TOUCH

### **DO NOT MODIFY:**
- ✅ `courier_trust_scores` table (TrustScore system)
- ✅ `courier_analytics` table (Performance tracking)
- ✅ TrustScore calculation functions
- ✅ Existing RLS policies

### **REASON:**
- TrustScore is a separate system
- Dynamic ranking USES TrustScore (doesn't replace it)
- TrustScore = Reliability rating (0-5 stars)
- Ranking = Checkout position (0-1 score)

---

## 📊 RELATIONSHIP: TRUSTSCORE vs RANKING

### **TrustScore (Existing):**
- **Purpose:** Show customers reliability rating
- **Display:** 0-5 stars in UI
- **Based On:** Delivery performance, reviews, completion rate
- **Used For:** Customer trust signal
- **Table:** `courier_trust_scores`

### **Ranking Score (Existing):**
- **Purpose:** Determine checkout display order
- **Display:** Not shown to customers (internal)
- **Based On:** TrustScore (20%) + Conversion (30%) + Activity (20%) + Performance (30%)
- **Used For:** Self-optimizing marketplace
- **Table:** `courier_ranking_scores`

### **How They Work Together:**
```
TrustScore (5.0 stars)
    ↓
Contributes 20% to Ranking Score
    ↓
Ranking Score (0.89)
    ↓
Courier shown in Position 1
    ↓
Customer sees TrustScore (5.0 stars)
    ↓
Customer selects courier
    ↓
Selection logged
    ↓
Ranking Score updated (0.91)
    ↓
Next customer sees courier in Position 1 again
```

---

## 🎯 TODAY'S TASKS

### **Task 1: Fix Function Signature** ✅
- Add `p_courier_id` parameter
- Update loop to filter by courier_id
- Test function

### **Task 2: Create Checkout Analytics APIs** 🆕
- `POST /api/checkout/log-courier-display`
- `POST /api/checkout/log-courier-selection`
- Input validation
- Error handling

### **Task 3: Create Cron Job** 🆕
- `api/cron/update-rankings.ts`
- Runs daily at midnight
- Calls `update_courier_ranking_scores()`
- Calls `save_ranking_snapshot()`

### **Task 4: Documentation** 📝
- How to integrate in checkout
- API documentation
- Testing guide

---

## ✅ SUMMARY

**EXISTING SYSTEM (DO NOT DESTROY):**
- ✅ 3 database tables
- ✅ 4 calculation functions
- ✅ 1 API endpoint
- ✅ Complete RLS policies
- ✅ All indexes

**NEEDS TO BE BUILT:**
- ❌ Checkout analytics logging APIs (2 endpoints)
- ❌ Cron job for daily updates
- ❌ Checkout UI integration
- ⚠️ Function signature fix (minor)

**RELATIONSHIP WITH TRUSTSCORE:**
- ✅ TrustScore = Customer-facing reliability rating
- ✅ Ranking = Internal checkout ordering
- ✅ Ranking USES TrustScore (20% weight)
- ✅ Both systems work together
- ✅ DO NOT MODIFY TrustScore system

---

**READY TO BUILD CHECKOUT INTEGRATION!** 🚀
