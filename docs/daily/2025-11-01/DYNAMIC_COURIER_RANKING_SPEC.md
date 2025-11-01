# DYNAMIC COURIER RANKING SYSTEM - SPECIFICATION

**Date:** November 1, 2025, 8:15 PM  
**Priority:** HIGH  
**Status:** 📋 SPECIFICATION - READY FOR IMPLEMENTATION  
**Estimated Time:** 3-4 hours

---

## 🎯 CORE CONCEPT

**"Checkout analytics should feed back into courier ranking to create a self-optimizing marketplace."**

### **The Feedback Loop:**

```
Checkout Display
    ↓
Track Position & Selection
    ↓
Analyze Performance Metrics
    ↓
Adjust Ranking Algorithm
    ↓
Update Courier Position
    ↓
Next Checkout Shows New Order
    ↓
(Loop continues)
```

---

## 📊 CURRENT STATE (What We Have)

### **✅ Already Implemented:**

**1. Checkout Analytics Tracking:**
- Table: `checkout_courier_analytics`
- Tracks: position_shown, was_selected, trust_score_at_time
- Captures: order_value, delivery_location, session data

**2. Courier Performance Metrics:**
- Table: `courier_analytics`
- Metrics: completion_rate, on_time_rate, avg_delivery_days
- Reviews: total_reviews, avg_rating, trust_score

**3. Static Ranking (Current):**
```sql
-- Current ranking in ratings-by-postal.ts
ORDER BY 
  trust_score DESC,           -- Primary: Trust score
  total_reviews DESC,          -- Secondary: Number of reviews
  on_time_percentage DESC      -- Tertiary: On-time percentage
```

---

## 🚀 WHAT NEEDS TO BE BUILT

### **1. Dynamic Ranking Algorithm** 🎯

**Replace static ranking with dynamic, data-driven ranking:**

#### **Ranking Factors (Weighted):**

```typescript
interface CourierRankingScore {
  // Performance Metrics (50% weight)
  trustScore: number;              // 20% - Customer satisfaction
  onTimeRate: number;              // 15% - Delivery reliability
  avgDeliveryDays: number;         // 10% - Speed (inverted)
  completionRate: number;          // 5%  - Order completion
  
  // Checkout Conversion (30% weight)
  selectionRate: number;           // 15% - How often selected
  positionBias: number;            // 10% - Performance vs position
  conversionTrend: number;         // 5%  - Improving or declining
  
  // Recency & Activity (20% weight)
  recentPerformance: number;       // 10% - Last 30 days performance
  activityLevel: number;           // 10% - Recent order volume
  
  // Final Score
  finalScore: number;              // Sum of weighted factors
}
```

#### **Calculation Example:**

```typescript
function calculateDynamicRanking(courier: Courier): number {
  // Performance Metrics (50%)
  const performanceScore = 
    (courier.trust_score / 5.0) * 0.20 +           // 20%
    (courier.on_time_rate / 100) * 0.15 +          // 15%
    (1 - courier.avg_delivery_days / 7) * 0.10 +   // 10% (inverted)
    (courier.completion_rate / 100) * 0.05;        // 5%
  
  // Checkout Conversion (30%)
  const conversionScore = 
    courier.selection_rate * 0.15 +                // 15%
    courier.position_performance * 0.10 +          // 10%
    courier.conversion_trend * 0.05;               // 5%
  
  // Recency & Activity (20%)
  const recencyScore = 
    courier.recent_performance * 0.10 +            // 10%
    courier.activity_level * 0.10;                 // 10%
  
  return performanceScore + conversionScore + recencyScore;
}
```

---

### **2. New Database Tables** 📊

#### **Table 1: `courier_ranking_scores`**

```sql
CREATE TABLE courier_ranking_scores (
  score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  postal_area VARCHAR(10), -- First 3 digits of postal code
  
  -- Performance Metrics
  trust_score NUMERIC(3,2),
  on_time_rate NUMERIC(5,2),
  avg_delivery_days NUMERIC(5,2),
  completion_rate NUMERIC(5,2),
  
  -- Conversion Metrics
  total_displays INTEGER DEFAULT 0,
  total_selections INTEGER DEFAULT 0,
  selection_rate NUMERIC(5,4), -- selections / displays
  avg_position_shown NUMERIC(5,2),
  avg_position_selected NUMERIC(5,2),
  position_performance NUMERIC(5,4), -- How well they perform at their position
  
  -- Trend Analysis
  conversion_trend NUMERIC(5,4), -- Positive = improving, negative = declining
  performance_trend NUMERIC(5,4),
  
  -- Recency
  recent_performance NUMERIC(5,4), -- Last 30 days
  activity_level NUMERIC(5,4), -- Recent order volume
  
  -- Final Score
  final_ranking_score NUMERIC(10,6),
  
  -- Metadata
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculation_period_start TIMESTAMP WITH TIME ZONE,
  calculation_period_end TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique per courier per area
  CONSTRAINT unique_courier_area UNIQUE (courier_id, postal_area)
);

CREATE INDEX idx_ranking_scores_courier ON courier_ranking_scores(courier_id);
CREATE INDEX idx_ranking_scores_postal ON courier_ranking_scores(postal_area);
CREATE INDEX idx_ranking_scores_final ON courier_ranking_scores(final_ranking_score DESC);
```

#### **Table 2: `courier_ranking_history`**

```sql
CREATE TABLE courier_ranking_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  postal_area VARCHAR(10),
  
  -- Historical ranking
  ranking_score NUMERIC(10,6),
  rank_position INTEGER, -- 1 = first, 2 = second, etc.
  
  -- Snapshot date
  snapshot_date DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique per courier per area per day
  CONSTRAINT unique_courier_area_date UNIQUE (courier_id, postal_area, snapshot_date)
);

CREATE INDEX idx_ranking_history_courier ON courier_ranking_history(courier_id, snapshot_date DESC);
CREATE INDEX idx_ranking_history_area ON courier_ranking_history(postal_area, snapshot_date DESC);
```

---

### **3. Calculation Functions** 🔧

#### **Function 1: Calculate Selection Rate**

```sql
CREATE OR REPLACE FUNCTION calculate_courier_selection_rate(
  p_courier_id UUID,
  p_postal_area VARCHAR DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_displays BIGINT,
  total_selections BIGINT,
  selection_rate NUMERIC,
  avg_position_shown NUMERIC,
  avg_position_selected NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_displays,
    COUNT(*) FILTER (WHERE was_selected = true) as total_selections,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as selection_rate,
    ROUND(AVG(position_shown)::NUMERIC, 2) as avg_position_shown,
    ROUND(AVG(position_shown) FILTER (WHERE was_selected = true)::NUMERIC, 2) as avg_position_selected
  FROM checkout_courier_analytics
  WHERE 
    courier_id = p_courier_id
    AND event_timestamp > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');
END;
$$ LANGUAGE plpgsql;
```

#### **Function 2: Calculate Position Performance**

```sql
CREATE OR REPLACE FUNCTION calculate_position_performance(
  p_courier_id UUID,
  p_postal_area VARCHAR DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_position NUMERIC;
  v_selection_rate NUMERIC;
  v_expected_rate NUMERIC;
  v_performance NUMERIC;
BEGIN
  -- Get average position and selection rate
  SELECT 
    AVG(position_shown),
    (COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100
  INTO v_avg_position, v_selection_rate
  FROM checkout_courier_analytics
  WHERE 
    courier_id = p_courier_id
    AND event_timestamp > NOW() - INTERVAL '30 days'
    AND (p_postal_area IS NULL OR delivery_postal_code LIKE p_postal_area || '%');
  
  -- Expected selection rate based on position (position 1 = 40%, position 2 = 25%, etc.)
  v_expected_rate := CASE 
    WHEN v_avg_position <= 1 THEN 40
    WHEN v_avg_position <= 2 THEN 25
    WHEN v_avg_position <= 3 THEN 15
    WHEN v_avg_position <= 4 THEN 10
    ELSE 5
  END;
  
  -- Performance = actual / expected
  v_performance := CASE 
    WHEN v_expected_rate > 0 
    THEN v_selection_rate / v_expected_rate
    ELSE 0
  END;
  
  RETURN ROUND(v_performance, 4);
END;
$$ LANGUAGE plpgsql;
```

#### **Function 3: Update All Ranking Scores**

```sql
CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
  p_postal_area VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_courier RECORD;
BEGIN
  FOR v_courier IN 
    SELECT DISTINCT c.courier_id
    FROM couriers c
    WHERE c.is_active = true
  LOOP
    -- Calculate and upsert ranking score
    INSERT INTO courier_ranking_scores (
      courier_id,
      postal_area,
      trust_score,
      on_time_rate,
      avg_delivery_days,
      completion_rate,
      total_displays,
      total_selections,
      selection_rate,
      position_performance,
      final_ranking_score,
      last_calculated
    )
    SELECT 
      v_courier.courier_id,
      p_postal_area,
      ca.trust_score,
      ca.on_time_rate,
      ca.avg_delivery_days,
      ca.completion_rate,
      sr.total_displays,
      sr.total_selections,
      sr.selection_rate,
      calculate_position_performance(v_courier.courier_id, p_postal_area),
      -- Final score calculation
      (
        (COALESCE(ca.trust_score, 0) / 5.0) * 0.20 +
        (COALESCE(ca.on_time_rate, 0) / 100) * 0.15 +
        (1 - COALESCE(ca.avg_delivery_days, 3) / 7) * 0.10 +
        (COALESCE(ca.completion_rate, 0) / 100) * 0.05 +
        (COALESCE(sr.selection_rate, 0) / 100) * 0.15 +
        COALESCE(calculate_position_performance(v_courier.courier_id, p_postal_area), 0) * 0.10
      ) as final_score,
      NOW()
    FROM courier_analytics ca
    CROSS JOIN LATERAL calculate_courier_selection_rate(v_courier.courier_id, p_postal_area, 30) sr
    WHERE ca.courier_id = v_courier.courier_id
    ON CONFLICT (courier_id, postal_area) 
    DO UPDATE SET
      trust_score = EXCLUDED.trust_score,
      on_time_rate = EXCLUDED.on_time_rate,
      avg_delivery_days = EXCLUDED.avg_delivery_days,
      completion_rate = EXCLUDED.completion_rate,
      total_displays = EXCLUDED.total_displays,
      total_selections = EXCLUDED.total_selections,
      selection_rate = EXCLUDED.selection_rate,
      position_performance = EXCLUDED.position_performance,
      final_ranking_score = EXCLUDED.final_ranking_score,
      last_calculated = NOW(),
      updated_at = NOW();
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;
```

---

### **4. Updated API Endpoint** 🔌

**Modify:** `api/couriers/ratings-by-postal.ts`

```typescript
// NEW: Use dynamic ranking instead of static
const query = `
  WITH courier_stats AS (
    -- Get courier performance metrics
    SELECT 
      c.courier_id,
      c.courier_name,
      c.company_name,
      c.logo_url,
      ca.trust_score,
      ca.total_reviews,
      ca.avg_delivery_days,
      ca.on_time_rate,
      
      -- Get dynamic ranking score
      COALESCE(crs.final_ranking_score, 0) as ranking_score,
      COALESCE(crs.selection_rate, 0) as selection_rate,
      COALESCE(crs.position_performance, 1.0) as position_performance
      
    FROM couriers c
    LEFT JOIN courier_analytics ca ON c.courier_id = ca.courier_id
    LEFT JOIN courier_ranking_scores crs 
      ON c.courier_id = crs.courier_id 
      AND crs.postal_area = $1
    
    WHERE 
      c.is_active = true
      AND ca.total_reviews >= 5
  )
  
  SELECT 
    courier_id,
    courier_name,
    company_name,
    logo_url,
    trust_score,
    total_reviews,
    avg_delivery_days,
    on_time_rate,
    ranking_score,
    selection_rate,
    position_performance
  FROM courier_stats
  
  -- NEW: Order by dynamic ranking score
  ORDER BY 
    ranking_score DESC,           -- Primary: Dynamic ranking
    trust_score DESC,              -- Fallback: Trust score
    total_reviews DESC             -- Fallback: Review count
    
  LIMIT $2;
`;
```

---

### **5. Scheduled Ranking Updates** ⏰

**Create:** Vercel Cron Job or Supabase Function

```typescript
// api/cron/update-courier-rankings.ts
import { getPool } from '../lib/db';

export default async function handler(req, res) {
  // Verify cron secret
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const pool = getPool();
  
  try {
    // Update rankings for all postal areas
    const result = await pool.query(`
      SELECT update_courier_ranking_scores(NULL) as updated_count
    `);
    
    // Save daily snapshot to history
    await pool.query(`
      INSERT INTO courier_ranking_history (
        courier_id,
        postal_area,
        ranking_score,
        rank_position,
        snapshot_date
      )
      SELECT 
        courier_id,
        postal_area,
        final_ranking_score,
        ROW_NUMBER() OVER (PARTITION BY postal_area ORDER BY final_ranking_score DESC),
        CURRENT_DATE
      FROM courier_ranking_scores
      ON CONFLICT (courier_id, postal_area, snapshot_date) DO NOTHING
    `);
    
    return res.status(200).json({
      success: true,
      updated: result.rows[0].updated_count,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating rankings:', error);
    return res.status(500).json({ error: 'Failed to update rankings' });
  }
}
```

**Configure in `vercel.json`:**

```json
{
  "crons": [{
    "path": "/api/cron/update-courier-rankings",
    "schedule": "0 2 * * *"
  }]
}
```

---

## 📊 ANALYTICS & INSIGHTS

### **Merchant Dashboard - New Metrics:**

**1. Courier Performance vs Position:**
```sql
-- Show how position affects selection
SELECT 
  position_shown,
  COUNT(*) as times_shown,
  COUNT(*) FILTER (WHERE was_selected = true) as times_selected,
  ROUND((COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / COUNT(*)) * 100, 2) as selection_rate
FROM checkout_courier_analytics
WHERE merchant_id = $1
  AND event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY position_shown
ORDER BY position_shown;
```

**2. Ranking Trend Over Time:**
```sql
-- Show how courier ranking changed over time
SELECT 
  snapshot_date,
  rank_position,
  ranking_score
FROM courier_ranking_history
WHERE courier_id = $1
  AND postal_area = $2
ORDER BY snapshot_date DESC
LIMIT 30;
```

**3. Selection Rate by TrustScore:**
```sql
-- Correlation between TrustScore and selection
SELECT 
  FLOOR(trust_score_at_time) as trust_score_bucket,
  COUNT(*) as times_shown,
  COUNT(*) FILTER (WHERE was_selected = true) as times_selected,
  ROUND((COUNT(*) FILTER (WHERE was_selected = true)::NUMERIC / COUNT(*)) * 100, 2) as selection_rate
FROM checkout_courier_analytics
WHERE event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY FLOOR(trust_score_at_time)
ORDER BY trust_score_bucket;
```

---

## 🎯 BENEFITS

### **For Customers:**
- ✅ Best couriers shown first (data-driven)
- ✅ More likely to get reliable delivery
- ✅ Better overall experience

### **For Couriers:**
- ✅ Performance rewarded with better positioning
- ✅ Incentive to improve service quality
- ✅ Fair, transparent ranking system

### **For Merchants:**
- ✅ Higher conversion rates (best couriers first)
- ✅ Fewer delivery issues
- ✅ Analytics on what drives selection

### **For Platform:**
- ✅ Self-optimizing marketplace
- ✅ Data-driven decision making
- ✅ Competitive advantage
- ✅ Better user satisfaction

---

## 📋 IMPLEMENTATION PLAN

### **Phase 1: Database (1 hour)**
1. Create `courier_ranking_scores` table
2. Create `courier_ranking_history` table
3. Create calculation functions
4. Test with sample data

### **Phase 2: Ranking Algorithm (1 hour)**
1. Implement `update_courier_ranking_scores()` function
2. Test with real checkout analytics data
3. Verify scores are reasonable
4. Adjust weights if needed

### **Phase 3: API Integration (30 min)**
1. Update `ratings-by-postal.ts` to use dynamic ranking
2. Test API returns correctly ordered couriers
3. Verify performance (query speed)

### **Phase 4: Cron Job (30 min)**
1. Create `/api/cron/update-courier-rankings`
2. Configure Vercel cron schedule
3. Test cron execution
4. Monitor for errors

### **Phase 5: Analytics Dashboard (1 hour)**
1. Create ranking analytics API
2. Add ranking trend charts to merchant dashboard
3. Show position performance metrics
4. Display selection rate analytics

---

## ⚠️ IMPORTANT CONSIDERATIONS

### **1. Cold Start Problem:**
- New couriers have no checkout data
- Solution: Use trust_score and reviews as primary until enough checkout data

### **2. Position Bias:**
- Position 1 naturally gets more selections
- Solution: `position_performance` metric accounts for this

### **3. Geographic Variation:**
- Couriers perform differently in different areas
- Solution: Separate ranking per postal_area

### **4. Recency:**
- Recent performance should matter more
- Solution: Weight last 30 days higher

### **5. Minimum Data Threshold:**
- Need enough data for statistical significance
- Solution: Require minimum 10 displays before using conversion data

---

## 🚀 NEXT STEPS

**Immediate:**
1. Review and approve this specification
2. Decide on ranking weight percentages
3. Create database tables

**Week 1:**
1. Implement Phase 1-3 (core functionality)
2. Test with real data
3. Monitor performance

**Week 2:**
1. Implement Phase 4-5 (automation + analytics)
2. Add merchant dashboard features
3. Document for users

---

## 📄 RELATED DOCUMENTS

- `SHOPIFY_COMPLETE_FIX_SUMMARY.md` - Checkout analytics implementation
- `database/CREATE_CHECKOUT_ANALYTICS_TABLE.sql` - Analytics table
- `api/public/checkout-analytics-track.ts` - Analytics tracking endpoint
- `api/couriers/ratings-by-postal.ts` - Current static ranking

---

*Created: November 1, 2025, 8:15 PM*  
*Priority: HIGH*  
*Estimated Time: 3-4 hours*  
*Status: Ready for approval and implementation*
