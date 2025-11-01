# 🔧 FRONTEND RECOVERY PLAN
**Date:** October 14, 2025  
**Issue:** Supabase URL changed mid-development causing frontend breakage

---

## 📊 CURRENT STATUS

### ✅ What's Working
- **Orders API** - All tables fixed and functional (105 orders in database)
  - `users`, `stores`, `couriers`, `orders` tables complete
  - All required columns added (customer_id, country, postal_code, etc.)
- **Authentication System** - Should be functional
- **Database Connection** - New Supabase URL configured

### ❌ What's Broken
1. **TrustScore System** - Missing `courier_analytics` table
2. **Dashboard Analytics** - Depends on courier_analytics
3. **Analytics Page** - Multiple role-based endpoints failing
4. **Courier Performance Metrics** - No cached data

---

## 🎯 PRIORITY 1: CRITICAL DATABASE TABLES (Morning - 2 hours)

### Task 1.1: Create Analytics Tables
**File:** `database/create-analytics-cache.sql` (already exists)

**Tables to Create:**
- ✅ `courier_analytics` - Pre-calculated courier metrics
- ✅ `platform_analytics` - Platform-wide statistics
- ✅ `courier_checkout_positions` - Checkout tracking (optional)
- ✅ `courier_position_history` - Historical position data (optional)

**Action Steps:**
1. Run `database/create-analytics-cache.sql` in Supabase SQL Editor
2. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('courier_analytics', 'platform_analytics');
   ```
3. Populate initial data:
   ```sql
   SELECT refresh_courier_analytics();
   SELECT refresh_platform_analytics();
   ```

**Expected Result:**
- `courier_analytics` table with metrics for all couriers
- Dashboard and TrustScore pages will load

---

## 🎯 PRIORITY 2: MISSING SUPPORT TABLES (Morning - 1 hour)

### Task 2.1: Reviews System
**Check if exists:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'reviews';
```

**If missing, create:**
```sql
CREATE TABLE IF NOT EXISTS reviews (
    review_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    courier_id UUID REFERENCES couriers(courier_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_type VARCHAR(50) DEFAULT 'courier', -- courier, merchant, platform
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_courier ON reviews(courier_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

### Task 2.2: Order Status History
**Already defined in:** `create-orders-related-tables.sql`

**Verify exists:**
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'order_status_history';
```

**If missing, run the table creation from the SQL file**

---

## 🎯 PRIORITY 3: API ENDPOINT VERIFICATION (Afternoon - 2 hours)

### Task 3.1: Test Critical API Endpoints

**Create test script:** `frontend/test-endpoints.http` or use Postman

```http
### 1. TrustScore Dashboard
GET {{baseUrl}}/api/trustscore/dashboard
Authorization: Bearer {{token}}

### 2. TrustScore List
GET {{baseUrl}}/api/trustscore
Authorization: Bearer {{token}}

### 3. Orders List
GET {{baseUrl}}/api/orders?page=1&limit=10
Authorization: Bearer {{token}}

### 4. Merchant Analytics
GET {{baseUrl}}/api/merchant/analytics?timeRange=month
Authorization: Bearer {{token}}

### 5. Courier Analytics
GET {{baseUrl}}/api/courier/analytics?timeRange=month
Authorization: Bearer {{token}}

### 6. Admin Dashboard
GET {{baseUrl}}/api/admin/dashboard
Authorization: Bearer {{token}}
```

**Expected Issues:**
- 404 errors → API routes not deployed
- 500 errors → Database table missing
- 403 errors → RLS policy issues

### Task 3.2: Fix Broken Endpoints

**Files to check:**
- `frontend/api/trustscore/dashboard.ts` - Line 115 references `courier_analytics`
- `frontend/api/admin/dashboard.ts` - Line 178 references `courier_analytics`
- `frontend/api/dashboard/trends.ts` - Line 46 references `courier_analytics`
- `frontend/api/couriers.ts` - Line 30 references `courier_analytics`

**All these will work once `courier_analytics` table is created**

---

## 🎯 PRIORITY 4: FRONTEND COMPONENT FIXES (Afternoon - 2 hours)

### Task 4.1: Dashboard Page
**File:** `frontend/src/pages/Dashboard.tsx`

**Current Issue:** Calls `/trustscore/dashboard` which needs `courier_analytics`

**Test:**
1. Login as merchant/courier/admin
2. Navigate to dashboard
3. Check browser console for errors
4. Verify stats cards display correctly

**If broken:**
- Check API response in Network tab
- Verify backend endpoint exists
- Check RLS policies allow user access

### Task 4.2: TrustScores Page
**File:** `frontend/src/pages/TrustScores.tsx`

**Current Issue:** Calls `/trustscore` endpoint

**Test:**
1. Navigate to TrustScores page
2. Verify courier list loads
3. Check search functionality
4. Test detail modal

**Expected fields:**
- `overall_score` (from courier_analytics.trust_score)
- `avg_rating` (from courier_analytics.avg_rating)
- `completion_rate` (from courier_analytics.completion_rate)
- `on_time_rate` (from courier_analytics.on_time_rate)

### Task 4.3: Analytics Page
**File:** `frontend/src/pages/Analytics.tsx`

**Current Issue:** Multiple role-based endpoints

**Test each role:**
- Merchant: `/merchant/analytics`
- Courier: `/courier/analytics`
- Admin: `/admin/analytics`

**Check for:**
- Chart data rendering
- Filter functionality
- Date range selection
- Export features

---

## 🎯 PRIORITY 5: DATA INTEGRITY (Evening - 1 hour)

### Task 5.1: Verify Existing Data

**Run verification queries:**

```sql
-- Check orders have required fields
SELECT 
    COUNT(*) as total_orders,
    COUNT(customer_id) as orders_with_customer,
    COUNT(courier_id) as orders_with_courier,
    COUNT(store_id) as orders_with_store,
    COUNT(country) as orders_with_country
FROM orders;

-- Check couriers are active
SELECT 
    COUNT(*) as total_couriers,
    COUNT(CASE WHEN is_active THEN 1 END) as active_couriers,
    COUNT(courier_code) as couriers_with_code
FROM couriers;

-- Check stores exist
SELECT 
    COUNT(*) as total_stores,
    COUNT(CASE WHEN is_active THEN 1 END) as active_stores
FROM stores;

-- Check users and roles
SELECT 
    user_role,
    COUNT(*) as count
FROM users
GROUP BY user_role;
```

### Task 5.2: Populate Missing Data

**If orders missing customer_id:**
```sql
-- Create anonymous customer for orphaned orders
INSERT INTO users (email, first_name, last_name, user_role)
VALUES ('anonymous@performile.com', 'Anonymous', 'Customer', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Link orphaned orders
UPDATE orders 
SET customer_id = (SELECT user_id FROM users WHERE email = 'anonymous@performile.com')
WHERE customer_id IS NULL;
```

**If orders missing country:**
```sql
-- Set default country for orders without one
UPDATE orders 
SET country = 'Unknown'
WHERE country IS NULL OR country = '';
```

---

## 🎯 PRIORITY 6: RLS POLICIES (If needed - 1 hour)

### Task 6.1: Check RLS Status

```sql
-- Check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('orders', 'couriers', 'courier_analytics', 'stores', 'reviews');
```

### Task 6.2: Add Missing Policies

**If courier_analytics needs RLS:**
```sql
ALTER TABLE courier_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY "Admins can view all courier analytics"
ON courier_analytics FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid() 
        AND user_role = 'admin'
    )
);

-- Couriers can see their own
CREATE POLICY "Couriers can view own analytics"
ON courier_analytics FOR SELECT
TO authenticated
USING (
    courier_id IN (
        SELECT courier_id FROM couriers 
        WHERE user_id = auth.uid()
    )
);

-- Merchants can see all (for selection)
CREATE POLICY "Merchants can view all courier analytics"
ON courier_analytics FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid() 
        AND user_role = 'merchant'
    )
);
```

---

## 📋 TESTING CHECKLIST

### Database Layer
- [ ] `courier_analytics` table exists and populated
- [ ] `platform_analytics` table exists and populated
- [ ] `reviews` table exists
- [ ] `order_status_history` table exists
- [ ] All orders have `customer_id`, `country`, `postal_code`
- [ ] All couriers have `courier_code`
- [ ] Analytics refresh functions work

### API Layer
- [ ] `/api/trustscore` returns courier list
- [ ] `/api/trustscore/dashboard` returns stats
- [ ] `/api/orders` returns paginated orders
- [ ] `/api/merchant/analytics` works for merchants
- [ ] `/api/courier/analytics` works for couriers
- [ ] `/api/admin/dashboard` works for admins

### Frontend Layer
- [ ] Dashboard loads without errors
- [ ] TrustScores page displays courier list
- [ ] Analytics page shows charts
- [ ] Orders page displays order list
- [ ] Search and filters work
- [ ] No console errors on any page

### User Roles
- [ ] Admin can access all features
- [ ] Merchant sees own stores/orders only
- [ ] Courier sees own deliveries only
- [ ] Customer sees own orders only

---

## 🚀 EXECUTION ORDER (Tomorrow)

### Morning Session (9:00 AM - 12:00 PM)
1. **09:00-09:30** - Run `create-analytics-cache.sql`
2. **09:30-10:00** - Verify tables and populate data
3. **10:00-10:30** - Create reviews table if missing
4. **10:30-11:00** - Test TrustScore and Dashboard pages
5. **11:00-12:00** - Fix any immediate errors found

### Afternoon Session (1:00 PM - 5:00 PM)
1. **13:00-14:00** - Test all API endpoints systematically
2. **14:00-15:00** - Fix broken Analytics endpoints
3. **15:00-16:00** - Test frontend components per role
4. **16:00-17:00** - Data integrity checks and cleanup

### Evening Session (If needed)
1. **17:00-18:00** - RLS policy fixes
2. **18:00-19:00** - Final testing and documentation

---

## 📝 QUICK REFERENCE

### Key Files
- **Database:** `database/create-analytics-cache.sql`
- **API Endpoints:** `frontend/api/trustscore/`, `frontend/api/admin/`, `frontend/api/merchant/`
- **Frontend Pages:** `frontend/src/pages/Dashboard.tsx`, `TrustScores.tsx`, `Analytics.tsx`

### Key Tables
- `courier_analytics` - **CRITICAL** for dashboard/trustscore
- `platform_analytics` - For admin dashboard
- `reviews` - For ratings and trust scores
- `orders` - Already fixed ✅
- `couriers` - Already fixed ✅
- `stores` - Should exist
- `users` - Should exist

### Common Errors
- **"column courier_analytics does not exist"** → Run create-analytics-cache.sql
- **"relation reviews does not exist"** → Create reviews table
- **"permission denied for table"** → Check RLS policies
- **"user_id is missing"** → Check JWT token and auth

---

## 🎯 SUCCESS CRITERIA

By end of tomorrow, you should have:
1. ✅ All database tables created and populated
2. ✅ Dashboard showing stats for all user roles
3. ✅ TrustScore page displaying courier rankings
4. ✅ Analytics page with working charts
5. ✅ Orders page with full CRUD operations
6. ✅ No console errors on any page
7. ✅ All API endpoints returning 200 status

---

## 📞 TROUBLESHOOTING CONTACTS

If stuck on:
- **Database issues** → Check Supabase logs
- **API errors** → Check Vercel function logs
- **Frontend errors** → Check browser console
- **Auth issues** → Verify JWT token in localStorage

---

## 🐛 CURRENT ERRORS (From Browser Console)

### Critical Errors (Must Fix)

#### 1. **500 Error: `/api/trustscore/dashboard`** ❌ CRITICAL
**Status:** 500 Internal Server Error  
**Impact:** Dashboard cannot load stats  
**Cause:** Likely missing table or query error in backend  
**Fix Priority:** HIGH

**Action:**
```bash
# Check Vercel function logs for exact error
# Likely needs: reviews table or RLS policy fix
```

**Test:**
```http
GET /api/trustscore/dashboard
Authorization: Bearer {token}
```

#### 2. **401 Error: `/api/tracking/summary`** ❌ CRITICAL
**Status:** 401 Unauthorized  
**Impact:** Tracking widget fails to load  
**Cause:** Authentication/JWT token issue or missing RLS policy  
**Fix Priority:** HIGH

**Possible Causes:**
- JWT token expired or invalid
- RLS policy blocking access
- Endpoint requires different auth

**Action:**
```sql
-- Check if tracking_events table has RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tracking_events';

-- Add policy if needed
CREATE POLICY "Users can view own tracking"
ON tracking_events FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT order_id FROM orders 
        WHERE customer_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM users 
        WHERE user_id = auth.uid() 
        AND user_role IN ('admin', 'courier', 'merchant')
    )
);
```

#### 3. **401 Error: `/api/claims`** ❌ CRITICAL
**Status:** 401 Unauthorized (multiple attempts)  
**Impact:** Claims page cannot load  
**Cause:** RLS policy or auth issue  
**Fix Priority:** MEDIUM

**Action:**
```sql
-- Check claims table RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'claims';

-- Verify claims table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'claims';
```

### Warning Errors (Can Fix Later)

#### 4. **404 Error: PostHog Config** ⚠️ NON-CRITICAL
**Status:** 404 Not Found  
**URL:** `us-assets.i.posthog.com/array/phc_Cyr5JV07x2QkqQlKKfKOzxWQMnce73C2hoF86Tq41iL/config.js`  
**Impact:** Analytics tracking may not work  
**Cause:** Invalid PostHog API key or project ID  
**Fix Priority:** LOW

**Action:**
- Check `.env` file for `VITE_POSTHOG_KEY`
- Verify PostHog project is active
- Can disable PostHog temporarily if not needed

#### 5. **404 Error: Favicon** ⚠️ NON-CRITICAL
**Status:** 404 Not Found  
**URL:** `/favicon.ico`  
**Impact:** Browser tab icon missing  
**Cause:** Missing favicon file  
**Fix Priority:** LOW

**Action:**
```bash
# Add favicon to public folder
# frontend/public/favicon.ico
```

### Auth State Issues

**Observation:** Multiple `[ApiClient] Auth state: Object` logs  
**Possible Issue:** Auth state changing frequently or re-rendering  
**Impact:** Performance issue, possible infinite loop  
**Fix Priority:** MEDIUM

**Action:**
- Check if auth token is being refreshed too frequently
- Look for unnecessary re-renders in auth components
- Verify JWT expiration time is reasonable

---

## 🔧 TOMORROW'S UPDATED PRIORITIES

### **PRIORITY 1A: Fix `/api/trustscore/dashboard` (30 min)**

**Steps:**
1. Check Vercel function logs for exact error
2. Verify `courier_analytics` table is accessible
3. Check if `reviews` table exists and has data
4. Test RLS policies for courier_analytics
5. Add error logging to endpoint

**Expected Fix:**
```typescript
// In frontend/api/trustscore/dashboard.ts
// Add try-catch with detailed logging
try {
  const result = await client.query(`...`);
  console.log('Query result:', result.rows);
} catch (error) {
  console.error('Dashboard query error:', error);
  // Return graceful fallback
}
```

### **PRIORITY 1B: Fix `/api/tracking/summary` (30 min)**

**Steps:**
1. Check if `tracking_events` table exists
2. Verify RLS policies allow user access
3. Check JWT token is being sent correctly
4. Add RLS policy for tracking access

**Create tracking_events table if missing:**
```sql
CREATE TABLE IF NOT EXISTS tracking_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_status VARCHAR(50),
    event_description TEXT,
    event_location VARCHAR(255),
    event_timestamp TIMESTAMPTZ DEFAULT NOW(),
    courier_code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracking_events_order ON tracking_events(order_id);
CREATE INDEX idx_tracking_events_timestamp ON tracking_events(event_timestamp DESC);
```

### **PRIORITY 1C: Fix `/api/claims` (20 min)**

**Steps:**
1. Verify `claims` table exists (should from earlier SQL)
2. Check RLS policies
3. Test endpoint with valid auth token

**If claims table missing:**
```sql
-- Run: database/create-claims-system.sql
-- OR: database/create-missing-tables.sql
```

---

## 📋 UPDATED TESTING CHECKLIST

### Before Starting Tomorrow
- [ ] Check Vercel function logs for all 500 errors
- [ ] Verify all tables exist: `courier_analytics`, `reviews`, `tracking_events`, `claims`
- [ ] Test JWT token is valid and not expired
- [ ] Check RLS is not blocking legitimate access

### Critical Fixes (Must Complete)
- [ ] `/api/trustscore/dashboard` returns 200
- [ ] `/api/tracking/summary` returns 200 or 404 (if no data)
- [ ] `/api/claims` returns 200 or empty array
- [ ] Dashboard loads without 500 errors
- [ ] No 401 errors for authenticated users

### Nice to Have
- [ ] PostHog analytics working
- [ ] Favicon added
- [ ] Auth state logging reduced
- [ ] Performance optimizations

---

## 🚨 ERROR LOG (Oct 14, 2025 - 11:13 PM)

```
CRITICAL ERRORS:
1. ❌ /api/trustscore/dashboard → 500 (Backend error)
2. ❌ /api/tracking/summary → 401 (Auth/RLS issue)
3. ❌ /api/claims → 401 (Auth/RLS issue)

WARNING ERRORS:
4. ⚠️ PostHog config → 404 (Invalid API key)
5. ⚠️ /favicon.ico → 404 (Missing file)

INFO:
- Dashboard v3.0 initialized ✅
- Sentry initialized ✅
- PostHog initialized ✅ (but config fails)
- Pusher connecting ✅
- Auth state detected ✅
- /api/dashboard/recent-activity → 200 ✅
- /api/notifications → 200 ✅
```

---

## 🎯 SUCCESS METRICS FOR TOMORROW

**Minimum Viable:**
- [ ] Dashboard loads without 500 errors
- [ ] At least 1 stat card shows data
- [ ] No 401 errors for logged-in users

**Ideal State:**
- [ ] All dashboard widgets working
- [ ] TrustScore page displays couriers
- [ ] Tracking widget shows data
- [ ] Claims page accessible
- [ ] Analytics page loads

---

**Good luck! 🚀 You've got this!**
