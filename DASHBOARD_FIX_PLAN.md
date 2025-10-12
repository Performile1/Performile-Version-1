# 🎯 Dashboard Fix Plan - All User Roles

**Created:** October 12, 2025, 10:12 PM  
**Status:** Ready to Execute Tomorrow  
**Estimated Time:** 3-4 hours

---

## 📋 Current Issues

### **Merchant Dashboard** ❌
- Shows 0% On-Time Rate
- Shows 0% Completion Rate  
- Shows 0 Available Couriers
- **Root Cause:** Missing `/api/merchant/dashboard` endpoint (CREATED, needs table)

### **Courier Dashboard** ⚠️
- Hardcoded data (85.2 trust score, 1,247 orders, 92.1% on-time)
- **Root Cause:** No `/api/courier/dashboard` endpoint

### **Consumer Dashboard** ⚠️
- Unknown status (needs verification)
- **Root Cause:** No `/api/consumer/dashboard` endpoint

### **Admin Dashboard** ✅
- Works (uses `/api/trustscore/dashboard`)
- Shows real data from couriers table

---

## 🔧 Solution Plan

### **Phase 1: Database Setup (30 min)**

#### **1.1 Create Missing Tables**
Run in Supabase SQL Editor:

```sql
-- Already created, just verify:
✅ merchant_courier_selections
✅ stores  
✅ orders
✅ couriers

-- Need to verify these exist:
⏳ courier_performance (for courier stats)
⏳ consumer_orders (for consumer tracking)
```

**Action Items:**
- [ ] Run `setup-and-seed-complete.sql` on production Supabase
- [ ] Verify all tables exist with `quick-check-merchant.sql`
- [ ] Check data was seeded correctly

---

### **Phase 2: Merchant Dashboard API (45 min)**

#### **2.1 Fix Current Issues**
**File:** `backend/src/routes/merchant-dashboard.ts`

**Current Status:**
- ✅ Route created
- ✅ Error handling added
- ⏳ Needs `merchant_courier_selections` table on production
- ⏳ Needs testing with real data

**Action Items:**
- [ ] Verify Vercel deployment completed
- [ ] Check Vercel logs for errors
- [ ] Test endpoint: `GET /api/merchant/dashboard`
- [ ] Verify returns:
  - `total_couriers` (from merchant_courier_selections)
  - `avg_on_time_rate` (from orders)
  - `avg_completion_rate` (from orders)
  - `total_orders`, `delivered_orders`, `pending_orders`, `in_transit_orders`

#### **2.2 Expected Response**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_couriers": 11,
      "avg_on_time_rate": 70.5,
      "avg_completion_rate": 72.7,
      "total_orders": 11,
      "delivered_orders": 8,
      "pending_orders": 2,
      "in_transit_orders": 1
    },
    "couriers": [...]
  }
}
```

---

### **Phase 3: Courier Dashboard API (1 hour)**

#### **3.1 Create Courier Dashboard Endpoint**
**File:** `backend/src/routes/courier-dashboard.ts` (NEW)

**Endpoint:** `GET /api/courier/dashboard`

**Data to Return:**
```typescript
{
  statistics: {
    trust_score: number,           // From couriers.trust_score
    orders_this_month: number,     // From orders WHERE courier_id
    on_time_rate: number,          // % delivered on time
    completion_rate: number,       // % completed
    total_earnings: number,        // From orders (if tracking)
    active_deliveries: number      // Orders in_transit
  },
  recent_orders: Order[],          // Last 10 orders
  performance_trend: {             // Last 6 months
    month: string,
    orders: number,
    on_time_rate: number
  }[]
}
```

**SQL Queries Needed:**
```sql
-- Get courier's trust score
SELECT trust_score FROM couriers WHERE courier_id = $1;

-- Get orders this month
SELECT COUNT(*) FROM orders 
WHERE courier_id = $1 
AND created_at >= DATE_TRUNC('month', NOW());

-- Get on-time rate
SELECT 
  COUNT(CASE WHEN delivery_date <= expected_delivery_date THEN 1 END)::NUMERIC /
  NULLIF(COUNT(*), 0) * 100 as on_time_rate
FROM orders
WHERE courier_id = $1 
AND order_status = 'delivered'
AND created_at >= NOW() - INTERVAL '30 days';

-- Get completion rate
SELECT 
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END)::NUMERIC /
  NULLIF(COUNT(*), 0) * 100 as completion_rate
FROM orders
WHERE courier_id = $1
AND created_at >= NOW() - INTERVAL '30 days';
```

**Action Items:**
- [ ] Create `backend/src/routes/courier-dashboard.ts`
- [ ] Add queries for courier stats
- [ ] Register route in `server.ts`: `app.use('/api/courier', courierDashboardRoutes)`
- [ ] Test with courier account
- [ ] Update frontend to use real data (remove hardcoded values)

---

### **Phase 4: Consumer Dashboard API (1 hour)**

#### **4.1 Create Consumer Dashboard Endpoint**
**File:** `backend/src/routes/consumer-dashboard.ts` (NEW)

**Endpoint:** `GET /api/consumer/dashboard`

**Data to Return:**
```typescript
{
  statistics: {
    total_orders: number,          // All orders by consumer
    active_shipments: number,      // Orders in_transit
    delivered_orders: number,      // Orders delivered
    pending_claims: number         // Open claims
  },
  recent_orders: Order[],          // Last 10 orders with tracking
  active_claims: Claim[]           // Open claims
}
```

**SQL Queries Needed:**
```sql
-- Get consumer's orders
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN order_status = 'in_transit' THEN 1 END) as active_shipments,
  COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as delivered_orders
FROM orders
WHERE consumer_id = $1;  -- Need to add consumer_id to orders table!

-- Get pending claims
SELECT COUNT(*) FROM claims
WHERE claimant_id = $1 
AND status IN ('pending', 'under_review');
```

**⚠️ Schema Changes Needed:**
```sql
-- Add consumer_id to orders table
ALTER TABLE orders ADD COLUMN consumer_id UUID REFERENCES users(user_id);
```

**Action Items:**
- [ ] Add `consumer_id` column to orders table
- [ ] Create `backend/src/routes/consumer-dashboard.ts`
- [ ] Add queries for consumer stats
- [ ] Register route in `server.ts`: `app.use('/api/consumer', consumerDashboardRoutes)`
- [ ] Test with consumer account
- [ ] Update frontend Dashboard.tsx for consumer role

---

### **Phase 5: Frontend Integration (45 min)**

#### **5.1 Update Dashboard.tsx**
**File:** `frontend/src/pages/Dashboard.tsx`

**Changes Needed:**

**Merchant Section (Lines 180-211):**
```typescript
// Currently shows stats?.total_couriers
// ✅ Already correct, just needs backend to work

case 'merchant':
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="On-Time Rate"
          value={stats?.avg_on_time_rate ? `${Number(stats.avg_on_time_rate).toFixed(1)}%` : '0%'}
          icon={<Schedule />}
          color="success.main"
        />
      </Grid>
      // ... rest is correct
    </Grid>
  );
```

**Courier Section (Lines 213-245):**
```typescript
// Currently HARDCODED - needs to use real data
case 'courier':
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="My Trust Score"
          value={stats?.trust_score || '0'}  // ❌ Change from "85.2"
          icon={<Star />}
          color="warning.main"
          subtitle="Industry average: 78.4"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Orders This Month"
          value={stats?.orders_this_month?.toLocaleString() || '0'}  // ❌ Change from "1,247"
          icon={<LocalShipping />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="On-Time Rate"
          value={stats?.on_time_rate ? `${stats.on_time_rate}%` : '0%'}  // ❌ Change from "92.1%"
          icon={<Schedule />}
          color="success.main"
        />
      </Grid>
    </Grid>
  );
```

**Consumer Section (Lines 247+):**
```typescript
// Currently shows generic tracking widget
// Need to add consumer-specific stats

case 'consumer':
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Active Shipments"
          value={stats?.active_shipments || 0}
          icon={<LocalShipping />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Orders"
          value={stats?.total_orders || 0}
          icon={<Assessment />}
          color="info.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Delivered"
          value={stats?.delivered_orders || 0}
          icon={<CheckCircle />}
          color="success.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Pending Claims"
          value={stats?.pending_claims || 0}
          icon={<Warning />}
          color="warning.main"
        />
      </Grid>
      <Grid item xs={12}>
        <TrackingWidget />
      </Grid>
    </Grid>
  );
```

**Action Items:**
- [ ] Remove hardcoded courier values
- [ ] Add consumer dashboard layout
- [ ] Test all 4 role dashboards
- [ ] Verify data updates in real-time

---

### **Phase 6: Testing & Verification (30 min)**

#### **6.1 Test Each Role**

**Merchant Test:**
- [ ] Login as merchant (rickard@wigrund.se)
- [ ] Verify shows: 11 couriers, 11 orders, 72.7% completion
- [ ] Check Vercel logs for errors
- [ ] Test with merchant who has no stores (should show zeros)

**Courier Test:**
- [ ] Login as courier
- [ ] Verify shows: real trust score, real order count, real on-time rate
- [ ] Check performance trends chart
- [ ] Verify no hardcoded data

**Consumer Test:**
- [ ] Login as consumer
- [ ] Verify shows: active shipments, total orders, claims
- [ ] Test tracking widget
- [ ] Verify can file claims

**Admin Test:**
- [ ] Login as admin
- [ ] Verify shows: all couriers, avg trust score, total orders
- [ ] Check still works as before

---

## 📁 Files to Create/Modify

### **New Files:**
```
backend/src/routes/courier-dashboard.ts
backend/src/routes/consumer-dashboard.ts
database/add-consumer-id-to-orders.sql
```

### **Modified Files:**
```
backend/src/routes/merchant-dashboard.ts (✅ Done, needs testing)
backend/src/server.ts (add new routes)
frontend/src/pages/Dashboard.tsx (update courier/consumer sections)
database/setup-and-seed-complete.sql (run on production)
```

---

## 🎯 Success Criteria

### **Merchant Dashboard:**
- ✅ Shows real courier count (11)
- ✅ Shows real completion rate (72.7%)
- ✅ Shows real on-time rate (~70%)
- ✅ Shows real order counts

### **Courier Dashboard:**
- ✅ Shows real trust score (from database)
- ✅ Shows real orders this month
- ✅ Shows real on-time rate
- ✅ No hardcoded values

### **Consumer Dashboard:**
- ✅ Shows active shipments
- ✅ Shows total orders
- ✅ Shows delivered count
- ✅ Shows pending claims

### **Admin Dashboard:**
- ✅ Still works as before
- ✅ Shows all system stats

---

## ⚠️ Known Issues to Address

### **1. Missing Tables on Production**
**Issue:** `merchant_courier_selections` table doesn't exist on production Supabase  
**Solution:** Run `setup-and-seed-complete.sql` in production

### **2. Missing consumer_id Column**
**Issue:** Orders table doesn't link to consumers  
**Solution:** Add `consumer_id` column to orders table

### **3. Hardcoded Courier Data**
**Issue:** Courier dashboard shows fake data  
**Solution:** Create `/api/courier/dashboard` endpoint

### **4. No Consumer Dashboard**
**Issue:** Consumer dashboard is generic  
**Solution:** Create `/api/consumer/dashboard` endpoint

---

## 🚀 Execution Order (Tomorrow)

### **Morning Session (2 hours):**
1. ✅ Run `setup-and-seed-complete.sql` on production (10 min)
2. ✅ Verify merchant dashboard works (10 min)
3. ✅ Create courier dashboard API (45 min)
4. ✅ Test courier dashboard (15 min)
5. ☕ **Break**

### **Afternoon Session (2 hours):**
6. ✅ Add `consumer_id` to orders table (10 min)
7. ✅ Create consumer dashboard API (45 min)
8. ✅ Update frontend Dashboard.tsx (30 min)
9. ✅ Test all 4 roles (20 min)
10. ✅ Deploy and verify (15 min)

---

## 📊 Current Progress

```
Overall: 25% Complete

✅ Merchant API Created (needs production table)
⏳ Courier API (not started)
⏳ Consumer API (not started)
⏳ Frontend Updates (not started)
⏳ Production Database Setup (not started)
```

---

## 🔗 Related Files

**Database Scripts:**
- `database/setup-and-seed-complete.sql` - Creates tables and seeds data
- `database/quick-check-merchant.sql` - Verifies merchant data
- `database/verify-merchant-data.sql` - Detailed debugging

**Backend Routes:**
- `backend/src/routes/merchant-dashboard.ts` - ✅ Created
- `backend/src/routes/courier-dashboard.ts` - ⏳ To create
- `backend/src/routes/consumer-dashboard.ts` - ⏳ To create

**Frontend:**
- `frontend/src/pages/Dashboard.tsx` - Needs updates for courier/consumer

---

## 💡 Quick Wins for Tomorrow

1. **Run SQL script** (10 min) - Fixes merchant dashboard immediately
2. **Check Vercel logs** (5 min) - See actual errors
3. **Create courier API** (45 min) - Removes hardcoded data
4. **Update frontend** (30 min) - Shows real data everywhere

**Total Time: ~90 minutes for major improvements!**

---

## 📝 Notes

- All SQL scripts are ready to run
- Backend structure is in place
- Frontend just needs data source changes
- No breaking changes required
- Can deploy incrementally (merchant → courier → consumer)

---

**Ready to execute tomorrow! 🚀**
