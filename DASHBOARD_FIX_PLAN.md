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

## 🔧 Solution Plan (REVISED - Unified Approach)

### **💡 New Strategy: Reuse Admin Dashboard with Role Filtering**

Instead of creating separate endpoints, we'll:
1. ✅ Use existing `/api/trustscore/dashboard` (admin endpoint)
2. ✅ Add role-based filtering to return only user's data
3. ✅ Apply subscription limits to what data is visible
4. ✅ Keep same data structure for consistency

**Benefits:**
- Less code duplication
- Consistent data structure across roles
- Easier to maintain
- Subscription limits enforced in one place

---

### **Phase 1: Database Setup (30 min)**

#### **1.1 Create Missing Tables**
Run in Supabase SQL Editor:

```sql
-- Already created, just verify:
✅ merchant_courier_selections
✅ stores  
✅ orders
✅ couriers
```

**Action Items:**
- [ ] Run `setup-and-seed-complete.sql` on production Supabase
- [ ] Verify all tables exist with `quick-check-merchant.sql`
- [ ] Check data was seeded correctly

---

### **Phase 2: Unified Dashboard API (2 hours)**

#### **2.1 Modify Existing Dashboard Endpoint**
**File:** `backend/src/routes/trustscore.ts` (existing admin dashboard)

**Current Endpoint:** `GET /api/trustscore/dashboard`

**Strategy:** Add role-based filtering to the existing endpoint instead of creating new ones.

#### **2.2 Role-Based Data Filtering**

**Admin (existing - no changes):**
```sql
-- Shows ALL couriers, ALL orders, ALL stats
SELECT * FROM couriers;
SELECT * FROM orders;
```

**Merchant:**
```sql
-- Shows only THEIR stores, THEIR orders, THEIR linked couriers
SELECT c.* FROM couriers c
JOIN merchant_courier_selections mcs ON c.courier_id = mcs.courier_id
WHERE mcs.merchant_id = $userId AND mcs.is_active = TRUE;

SELECT o.* FROM orders o
JOIN stores s ON o.store_id = s.store_id
WHERE s.owner_user_id = $userId;
```

**Courier:**
```sql
-- Shows only THEIR data
SELECT * FROM couriers WHERE courier_id = (
  SELECT courier_id FROM couriers WHERE user_id = $userId
);

SELECT * FROM orders WHERE courier_id = (
  SELECT courier_id FROM couriers WHERE user_id = $userId
);
```

**Consumer:**
```sql
-- Shows only THEIR orders and claims
SELECT * FROM orders WHERE consumer_id = $userId;
SELECT * FROM claims WHERE claimant_id = $userId;
```

#### **2.3 Implementation Plan**

**File:** `backend/src/routes/trustscore.ts`

**Add role detection:**
```typescript
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.userRole;
  
  // Build queries based on role
  let courierQuery, orderQuery;
  
  switch(userRole) {
    case 'admin':
      // Existing queries (no filter)
      courierQuery = 'SELECT * FROM couriers';
      orderQuery = 'SELECT * FROM orders';
      break;
      
    case 'merchant':
      // Filter to merchant's couriers and orders
      courierQuery = `
        SELECT c.* FROM couriers c
        JOIN merchant_courier_selections mcs ON c.courier_id = mcs.courier_id
        WHERE mcs.merchant_id = $1 AND mcs.is_active = TRUE
      `;
      orderQuery = `
        SELECT o.* FROM orders o
        JOIN stores s ON o.store_id = s.store_id
        WHERE s.owner_user_id = $1
      `;
      break;
      
    case 'courier':
      // Filter to courier's own data
      courierQuery = `
        SELECT * FROM couriers 
        WHERE user_id = $1
      `;
      orderQuery = `
        SELECT o.* FROM orders o
        WHERE o.courier_id = (
          SELECT courier_id FROM couriers WHERE user_id = $1
        )
      `;
      break;
      
    case 'consumer':
      // Filter to consumer's orders
      courierQuery = null; // Consumers don't see courier details
      orderQuery = `
        SELECT * FROM orders 
        WHERE consumer_id = $1
      `;
      break;
  }
  
  // Execute queries with userId as parameter
  // Return same data structure for all roles
});
```

#### **2.4 Expected Response (Same for All Roles)**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "total_couriers": 11,        // Filtered by role
      "avg_trust_score": 85.2,     // Calculated from filtered data
      "avg_on_time_rate": 70.5,    // Calculated from filtered data
      "avg_completion_rate": 72.7, // Calculated from filtered data
      "total_orders": 11,           // Filtered by role
      "total_reviews": 45           // Filtered by role
    },
    "couriers": [...],              // Filtered by role
    "recent_orders": [...],         // Filtered by role
    "subscription": {               // NEW: Add subscription info
      "tier": 1,
      "plan_name": "Starter",
      "limits": {
        "max_couriers": 5,
        "max_orders": 100,
        "has_analytics": false
      }
    }
  }
}
```

**Action Items:**
- [ ] Modify `backend/src/routes/trustscore.ts` to add role detection
- [ ] Add role-based WHERE clauses to all queries
- [ ] Add subscription info to response
- [ ] Test with all 4 roles
- [ ] Remove separate merchant-dashboard.ts (no longer needed)

---

### **Phase 3: Frontend Dashboard Update (1 hour)**

#### **3.1 Change Dashboard Endpoint Call**
**File:** `frontend/src/pages/Dashboard.tsx` (Lines 82-96)

**Current Code:**
```typescript
const getDashboardEndpoint = () => {
  switch (user?.user_role) {
    case 'merchant':
      return '/merchant/dashboard';  // ❌ Remove this
    case 'courier':
      return '/courier/dashboard';   // ❌ Remove this
    case 'consumer':
      return '/consumer/dashboard';  // ❌ Remove this
    case 'admin':
      return '/admin/dashboard';     // ❌ Remove this
    default:
      return '/trustscore/dashboard';
  }
};
```

**New Code (UNIFIED):**
```typescript
// ✅ ALL roles use the same endpoint!
const getDashboardEndpoint = () => {
  return '/trustscore/dashboard';  // Backend filters by role automatically
};
```

#### **3.2 Update Display Logic**

**Keep existing role-based display, just change data source:**

**Courier Section - Remove Hardcoded Values:**
```typescript
case 'courier':
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="My Trust Score"
          value={stats?.avg_trust_score || '0'}  // ✅ From filtered data
          icon={<Star />}
          color="warning.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Orders This Month"
          value={stats?.total_orders_processed?.toLocaleString() || '0'}  // ✅ From filtered data
          icon={<LocalShipping />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="On-Time Rate"
          value={stats?.avg_on_time_rate ? `${stats.avg_on_time_rate}%` : '0%'}  // ✅ From filtered data
          icon={<Schedule />}
          color="success.main"
        />
      </Grid>
    </Grid>
  );
```

**Merchant Section - Already Correct:**
```typescript
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
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Completion Rate"
          value={stats?.avg_completion_rate ? `${Number(stats.avg_completion_rate).toFixed(1)}%` : '0%'}
          icon={<CheckCircle />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <StatCard
          title="Available Couriers"
          value={stats?.total_couriers || 0}
          icon={<LocalShipping />}
          color="info.main"
        />
      </Grid>
    </Grid>
  );
```

**Consumer Section - Add Stats:**
```typescript
case 'consumer':
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="My Orders"
          value={stats?.total_orders_processed || 0}
          icon={<LocalShipping />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Average Rating"
          value={stats?.avg_trust_score || '0'}
          icon={<Star />}
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
- [ ] Change `getDashboardEndpoint()` to return `/trustscore/dashboard` for all roles
- [ ] Remove hardcoded courier values (85.2, 1,247, 92.1%)
- [ ] Update consumer dashboard layout
- [ ] Test all 4 role dashboards

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

## 📁 Files to Create/Modify (REVISED)

### **New Files:**
```
None! Using existing infrastructure
```

### **Modified Files:**
```
backend/src/routes/trustscore.ts (add role-based filtering)
frontend/src/pages/Dashboard.tsx (simplify endpoint, remove hardcoded values)
database/setup-and-seed-complete.sql (run on production)
```

### **Files to Remove:**
```
backend/src/routes/merchant-dashboard.ts (no longer needed - unified approach)
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

## 🚀 Execution Order (Tomorrow) - REVISED

### **Single Session (2 hours total!):**

**Phase 1: Database (10 min)**
1. ✅ Run `setup-and-seed-complete.sql` on production Supabase

**Phase 2: Backend (1 hour)**
2. ✅ Modify `backend/src/routes/trustscore.ts`:
   - Add role detection (`req.user.userRole`)
   - Add role-based WHERE clauses to queries
   - Add subscription info to response
3. ✅ Remove `backend/src/routes/merchant-dashboard.ts` (no longer needed)
4. ✅ Remove merchant route from `server.ts`

**Phase 3: Frontend (30 min)**
5. ✅ Modify `frontend/src/pages/Dashboard.tsx`:
   - Change `getDashboardEndpoint()` to always return `/trustscore/dashboard`
   - Remove hardcoded courier values (lines 213-245)
   - Update consumer section with stats
6. ✅ Test locally

**Phase 4: Deploy & Test (20 min)**
7. ✅ Commit and push to trigger Vercel deployment
8. ✅ Test all 4 roles on production
9. ✅ Verify Vercel logs
10. ✅ Done! 🎉

**Total Time: ~2 hours (vs 4 hours with separate endpoints!)**

---

## 📊 Current Progress (REVISED)

```
Overall: 30% Complete

✅ Database scripts created and ready
✅ Unified approach designed
✅ SQL queries documented
⏳ Backend role filtering (not started)
⏳ Frontend simplification (not started)
⏳ Production deployment (not started)
```

**Complexity Reduced:**
- ❌ 3 separate API endpoints → ✅ 1 unified endpoint
- ❌ 4 hours of work → ✅ 2 hours of work
- ❌ Duplicate code → ✅ DRY principle
- ❌ Hard to maintain → ✅ Easy to maintain

---

## 🔗 Related Files

**Database Scripts:**
- `database/setup-and-seed-complete.sql` - Creates tables and seeds data
- `database/quick-check-merchant.sql` - Verifies merchant data
- `database/verify-merchant-data.sql` - Detailed debugging

**Backend Routes:**
- `backend/src/routes/trustscore.ts` - ⏳ Add role filtering
- `backend/src/routes/merchant-dashboard.ts` - ❌ Delete (no longer needed)

**Frontend:**
- `frontend/src/pages/Dashboard.tsx` - ⏳ Simplify endpoint + remove hardcoded values

---

## 💡 Quick Wins for Tomorrow (REVISED)

1. **Run SQL script** (10 min) - Creates tables and seeds data
2. **Add role filtering to trustscore.ts** (1 hour) - One endpoint for all roles
3. **Simplify frontend** (30 min) - Remove hardcoded values, use unified endpoint
4. **Deploy and test** (20 min) - Verify all 4 roles work

**Total Time: ~2 hours for COMPLETE solution!**

**Benefits of Unified Approach:**
- ✅ Less code to write and maintain
- ✅ Consistent data structure across all roles
- ✅ Subscription limits enforced in one place
- ✅ Easier to add new roles in future
- ✅ Same admin dashboard logic, just filtered

---

## 📝 Notes

- ✅ All SQL scripts are ready to run
- ✅ Unified approach is simpler and more maintainable
- ✅ Same data structure for all roles (just filtered)
- ✅ No breaking changes required
- ✅ Can deploy all at once (2 hours total!)
- ✅ Subscription limits can be added to same endpoint
- ✅ Reuses existing admin dashboard infrastructure

---

## 🎉 Summary

**Old Plan:** 3-4 hours, 3 new endpoints, lots of duplicate code  
**New Plan:** 2 hours, 1 unified endpoint, DRY principle ✅

**Key Insight:** Admin dashboard already has all the data and logic we need.  
We just need to add WHERE clauses based on user role!

---

**Ready to execute tomorrow! 🚀**
