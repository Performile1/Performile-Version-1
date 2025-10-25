# 🔧 Claims Analytics - Proper Solutions

## 🎯 **Problem Statement**

**Current Issue:** Claims analytics API returns empty data because claims table doesn't have direct `courier_id` or `merchant_id` columns.

**Current "Fix" (WRONG):**
```typescript
// Skip materialized view - claims table doesn't have courier_id/merchant_id
// Would need complex join with orders table, so return empty for now
return res.status(200).json({ success: true, data: [] });
```

**Root Cause:** Claims table links to orders via `order_id`, and orders table has `courier_id` and `store_id` (which links to merchant via `owner_user_id`).

---

## 📊 **Current Database Schema**

```sql
-- Claims table
CREATE TABLE claims (
  claim_id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(order_id),  -- ✅ Link to orders
  tracking_number VARCHAR(255),
  courier VARCHAR(100),
  claim_type VARCHAR(50),
  claim_status VARCHAR(50),
  claimed_amount DECIMAL(10, 2),
  approved_amount DECIMAL(10, 2),
  created_at TIMESTAMP,
  ...
);

-- Orders table
CREATE TABLE orders (
  order_id UUID PRIMARY KEY,
  courier_id UUID REFERENCES couriers(courier_id),  -- ✅ Has courier
  store_id UUID REFERENCES stores(store_id),        -- ✅ Has store
  order_status VARCHAR(50),
  created_at TIMESTAMP,
  ...
);

-- Stores table
CREATE TABLE stores (
  store_id UUID PRIMARY KEY,
  owner_user_id UUID REFERENCES users(user_id),  -- ✅ Has merchant
  store_name VARCHAR(255),
  ...
);
```

**Relationship Chain:**
```
claims.order_id → orders.order_id
                  ├─ orders.courier_id → courier_id ✅
                  └─ orders.store_id → stores.store_id → stores.owner_user_id (merchant_id) ✅
```

---

## 💡 **Solution Options**

### **Option 1: JOIN Query (Recommended)**

**Approach:** Query claims with JOINs to get courier_id and merchant_id from related tables.

#### **Pros:**
- ✅ No database schema changes needed
- ✅ Works with existing data
- ✅ Flexible - can add more fields easily
- ✅ Maintains normalized database structure
- ✅ Quick to implement (30 minutes)

#### **Cons:**
- ⚠️ Slightly slower than denormalized data (but negligible for analytics)
- ⚠️ More complex query (but well-optimized with indexes)

#### **Performance:**
- With proper indexes: ~50-200ms for 1000s of claims
- Acceptable for analytics dashboard

#### **Implementation:**

**SQL Query:**
```sql
-- Get claims trends with courier_id and merchant_id
SELECT 
  DATE(c.created_at) as trend_date,
  o.courier_id,
  s.owner_user_id as merchant_id,
  COUNT(*) as total_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'draft') as draft_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'submitted') as submitted_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'under_review') as under_review_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'approved') as approved_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'rejected') as rejected_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'paid') as paid_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'closed') as closed_claims,
  SUM(c.claimed_amount) as total_claimed_amount,
  SUM(c.approved_amount) as total_approved_amount,
  AVG(
    CASE 
      WHEN c.resolution_date IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (c.resolution_date - c.created_at)) / 86400 
      ELSE NULL 
    END
  ) as avg_resolution_days
FROM claims c
LEFT JOIN orders o ON c.order_id = o.order_id
LEFT JOIN stores s ON o.store_id = s.store_id
WHERE c.created_at >= $1  -- Start date
  AND (
    ($2 = 'courier' AND o.courier_id = $3) OR
    ($2 = 'merchant' AND s.owner_user_id = $3)
  )
GROUP BY DATE(c.created_at), o.courier_id, s.owner_user_id
ORDER BY trend_date DESC;
```

**TypeScript Implementation:**
```typescript
// api/analytics/claims-trends.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { entity_type, entity_id, period = '30d' } = req.query;
    
    // ... validation and tier limits ...
    
    const startDateStr = calculateStartDate(period);
    
    // Query claims with JOINs
    const { data, error } = await supabase.rpc('get_claims_trends', {
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_start_date: startDateStr
    });
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      data: data.map(row => ({
        date: row.trend_date,
        total_claims: row.total_claims || 0,
        draft_claims: row.draft_claims || 0,
        submitted_claims: row.submitted_claims || 0,
        under_review_claims: row.under_review_claims || 0,
        approved_claims: row.approved_claims || 0,
        rejected_claims: row.rejected_claims || 0,
        paid_claims: row.paid_claims || 0,
        closed_claims: row.closed_claims || 0,
        total_claimed_amount: parseFloat(row.total_claimed_amount || 0),
        total_approved_amount: parseFloat(row.total_approved_amount || 0),
        avg_resolution_days: parseFloat(row.avg_resolution_days || 0)
      })),
      meta: {
        entity_type,
        entity_id,
        period,
        days_returned: data.length,
        source: 'join_query'
      }
    });
  } catch (error) {
    console.error('Claims trends error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch claims trends'
    });
  }
}
```

**Database Function (for better performance):**
```sql
-- Create a PostgreSQL function for reusability
CREATE OR REPLACE FUNCTION get_claims_trends(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_start_date DATE
)
RETURNS TABLE (
  trend_date DATE,
  total_claims BIGINT,
  draft_claims BIGINT,
  submitted_claims BIGINT,
  under_review_claims BIGINT,
  approved_claims BIGINT,
  rejected_claims BIGINT,
  paid_claims BIGINT,
  closed_claims BIGINT,
  total_claimed_amount NUMERIC,
  total_approved_amount NUMERIC,
  avg_resolution_days NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(c.created_at) as trend_date,
    COUNT(*) as total_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'draft') as draft_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'submitted') as submitted_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'under_review') as under_review_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'approved') as approved_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'rejected') as rejected_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'paid') as paid_claims,
    COUNT(*) FILTER (WHERE c.claim_status = 'closed') as closed_claims,
    SUM(c.claimed_amount) as total_claimed_amount,
    SUM(c.approved_amount) as total_approved_amount,
    AVG(
      CASE 
        WHEN c.resolution_date IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (c.resolution_date - c.created_at)) / 86400 
        ELSE NULL 
      END
    ) as avg_resolution_days
  FROM claims c
  LEFT JOIN orders o ON c.order_id = o.order_id
  LEFT JOIN stores s ON o.store_id = s.store_id
  WHERE c.created_at >= p_start_date
    AND (
      (p_entity_type = 'courier' AND o.courier_id = p_entity_id) OR
      (p_entity_type = 'merchant' AND s.owner_user_id = p_entity_id)
    )
  GROUP BY DATE(c.created_at)
  ORDER BY trend_date DESC;
END;
$$ LANGUAGE plpgsql;
```

**Indexes Needed:**
```sql
-- Ensure these indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_claims_created_at ON claims(created_at);
CREATE INDEX IF NOT EXISTS idx_claims_order_id ON claims(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON stores(owner_user_id);
```

**Time to Implement:** 30-45 minutes

---

### **Option 2: Denormalize - Add Columns to Claims Table**

**Approach:** Add `courier_id` and `merchant_id` columns directly to claims table.

#### **Pros:**
- ✅ Faster queries (no JOINs needed)
- ✅ Simpler query logic
- ✅ Better for very high-volume analytics

#### **Cons:**
- ❌ Data duplication (denormalization)
- ❌ Need to backfill existing claims
- ❌ Need to update claims creation logic
- ❌ Risk of data inconsistency if not maintained properly
- ❌ More complex to maintain

#### **Performance:**
- Faster than Option 1 by ~20-30ms
- Only matters at very high scale (100k+ claims)

#### **Implementation:**

**Database Migration:**
```sql
-- Add columns to claims table
ALTER TABLE claims 
ADD COLUMN courier_id UUID REFERENCES couriers(courier_id),
ADD COLUMN merchant_id UUID REFERENCES users(user_id);

-- Create indexes
CREATE INDEX idx_claims_courier_id ON claims(courier_id);
CREATE INDEX idx_claims_merchant_id ON claims(merchant_id);

-- Backfill existing data
UPDATE claims c
SET 
  courier_id = o.courier_id,
  merchant_id = s.owner_user_id
FROM orders o
LEFT JOIN stores s ON o.store_id = s.store_id
WHERE c.order_id = o.order_id;

-- Add NOT NULL constraints after backfill
ALTER TABLE claims 
ALTER COLUMN courier_id SET NOT NULL,
ALTER COLUMN merchant_id SET NOT NULL;
```

**Update Claims Creation:**
```typescript
// api/claims/index.ts - createClaim function
const claimResult = await client.query(
  `INSERT INTO claims (
    order_id, tracking_number, courier, claim_type, claim_status,
    courier_id, merchant_id,  -- ✅ Add these
    claimant_id, claimant_name, claimant_email, claimant_phone,
    incident_date, incident_description, incident_location,
    claimed_amount, declared_value, photos, documents, created_by
  ) VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
  RETURNING *`,
  [
    order_id, tracking_number, courier, claim_type,
    courierIdFromOrder, merchantIdFromOrder,  -- ✅ Get from order
    user.user_id, user.first_name + ' ' + user.last_name, user.email, user.phone,
    incident_date, incident_description, incident_location,
    claimed_amount, declared_value, photos, documents, user.user_id
  ]
);
```

**Analytics Query (Simpler):**
```sql
SELECT 
  DATE(created_at) as trend_date,
  COUNT(*) as total_claims,
  COUNT(*) FILTER (WHERE claim_status = 'approved') as approved_claims,
  -- ... other aggregations
FROM claims
WHERE created_at >= $1
  AND (
    ($2 = 'courier' AND courier_id = $3) OR
    ($2 = 'merchant' AND merchant_id = $3)
  )
GROUP BY DATE(created_at)
ORDER BY trend_date DESC;
```

**Time to Implement:** 1-2 hours (including backfill and testing)

---

### **Option 3: Materialized View (Best for Read-Heavy)**

**Approach:** Create a materialized view that pre-aggregates claims data.

#### **Pros:**
- ✅ Extremely fast queries (pre-computed)
- ✅ No JOIN overhead at query time
- ✅ Good for dashboards with many users
- ✅ Can refresh periodically or on-demand

#### **Cons:**
- ❌ Data is not real-time (refresh lag)
- ❌ Requires refresh mechanism
- ❌ Takes up more storage
- ❌ More complex to maintain

#### **Performance:**
- Fastest option (~10-20ms)
- Best for high-traffic dashboards

#### **Implementation:**

**Create Materialized View:**
```sql
-- Create materialized view for claims trends
CREATE MATERIALIZED VIEW claims_trends_mv AS
SELECT 
  DATE(c.created_at) as trend_date,
  o.courier_id,
  s.owner_user_id as merchant_id,
  COUNT(*) as total_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'draft') as draft_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'submitted') as submitted_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'approved') as approved_claims,
  COUNT(*) FILTER (WHERE c.claim_status = 'rejected') as rejected_claims,
  SUM(c.claimed_amount) as total_claimed_amount,
  SUM(c.approved_amount) as total_approved_amount,
  AVG(
    CASE 
      WHEN c.resolution_date IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (c.resolution_date - c.created_at)) / 86400 
      ELSE NULL 
    END
  ) as avg_resolution_days
FROM claims c
LEFT JOIN orders o ON c.order_id = o.order_id
LEFT JOIN stores s ON o.store_id = s.store_id
GROUP BY DATE(c.created_at), o.courier_id, s.owner_user_id;

-- Create indexes on materialized view
CREATE INDEX idx_claims_trends_mv_date ON claims_trends_mv(trend_date);
CREATE INDEX idx_claims_trends_mv_courier ON claims_trends_mv(courier_id);
CREATE INDEX idx_claims_trends_mv_merchant ON claims_trends_mv(merchant_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_claims_trends()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY claims_trends_mv;
END;
$$ LANGUAGE plpgsql;
```

**Auto-Refresh with Trigger:**
```sql
-- Refresh materialized view when claims change
CREATE OR REPLACE FUNCTION trigger_refresh_claims_trends()
RETURNS trigger AS $$
BEGIN
  PERFORM refresh_claims_trends();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER claims_changed
AFTER INSERT OR UPDATE OR DELETE ON claims
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_claims_trends();
```

**Or Scheduled Refresh (Better for Performance):**
```sql
-- Using pg_cron extension (if available)
SELECT cron.schedule('refresh-claims-trends', '*/15 * * * *', 'SELECT refresh_claims_trends()');
-- Refreshes every 15 minutes
```

**Query (Very Simple):**
```sql
SELECT *
FROM claims_trends_mv
WHERE trend_date >= $1
  AND (
    ($2 = 'courier' AND courier_id = $3) OR
    ($2 = 'merchant' AND merchant_id = $3)
  )
ORDER BY trend_date DESC;
```

**Time to Implement:** 1-2 hours (including refresh mechanism)

---

## 📊 **Comparison Table**

| Feature | Option 1: JOIN | Option 2: Denormalize | Option 3: Materialized View |
|---------|----------------|----------------------|----------------------------|
| **Query Speed** | 50-200ms | 30-100ms | 10-20ms |
| **Data Freshness** | Real-time | Real-time | Delayed (refresh interval) |
| **Storage** | No extra | +2 columns | +1 table |
| **Complexity** | Medium | Low | High |
| **Maintenance** | Low | Medium | High |
| **Schema Changes** | None | Add 2 columns | Add view + refresh |
| **Backfill Needed** | No | Yes | No |
| **Best For** | Most cases | Simple analytics | High-traffic dashboards |
| **Time to Implement** | 30-45 min | 1-2 hours | 1-2 hours |

---

## 🎯 **Recommendation**

**For Performile Platform: Option 1 (JOIN Query)**

**Why:**
1. ✅ No schema changes needed
2. ✅ Works with existing data immediately
3. ✅ Real-time data
4. ✅ Easy to maintain
5. ✅ Performance is acceptable for analytics
6. ✅ Quick to implement (30 minutes)

**When to Consider Option 2:**
- If you have 100k+ claims and need faster queries
- If you're okay with denormalization

**When to Consider Option 3:**
- If you have very high traffic (1000s of concurrent users)
- If 15-minute data delay is acceptable
- If you need sub-20ms query times

---

## 🚀 **Implementation Plan (Option 1)**

### **Step 1: Create Database Function (5 min)**
```sql
-- Run in Supabase SQL Editor
-- (See full SQL above)
```

### **Step 2: Add Indexes (2 min)**
```sql
-- Run in Supabase SQL Editor
-- (See indexes above)
```

### **Step 3: Update API Code (15 min)**
```typescript
// Update api/analytics/claims-trends.ts
// (See TypeScript code above)
```

### **Step 4: Test (10 min)**
- Test with merchant account
- Test with courier account
- Verify data accuracy
- Check performance

**Total Time: 30-45 minutes**

---

## ❓ **Your Decision**

**Which option do you prefer?**

**A.** Option 1: JOIN Query (Recommended) - 30 min  
**B.** Option 2: Denormalize - 1-2 hours  
**C.** Option 3: Materialized View - 1-2 hours  
**D.** Hybrid: Start with Option 1, upgrade to Option 3 later if needed  

**Let me know and I'll implement it properly!** 🎯
