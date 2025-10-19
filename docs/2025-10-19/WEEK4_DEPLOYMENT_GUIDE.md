# 🚀 WEEK 4 DEPLOYMENT GUIDE

**Date:** October 19, 2025  
**Version:** 1.0  
**Status:** Ready for Deployment

---

## 📋 PREREQUISITES

- [x] Supabase project active
- [x] Vercel project connected to GitHub
- [x] Database migrations ready
- [x] API files committed

---

## 🗄️ DATABASE DEPLOYMENT

### **Step 1: Deploy Phase 1 (Service Performance)**

1. Go to Supabase SQL Editor
2. Open `database/WEEK4_PHASE1_service_performance.sql`
3. Copy entire file
4. Paste into SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. Wait for success message

**Expected Result:**
```
✅ Week 4 Phase 1: Service Performance Tables Created Successfully!
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('service_performance', 'service_performance_geographic', 'service_reviews');
```

---

### **Step 2: Deploy Phase 2 (Parcel Points)**

1. Open `database/WEEK4_PHASE2_parcel_points.sql`
2. Copy entire file
3. Paste into SQL Editor
4. Click **Run**
5. Wait for success message

**Expected Result:**
```
✅ Week 4 Phase 2: Parcel Points & Coverage Tables Created Successfully!
✅ Extensions enabled: cube, earthdistance
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('parcel_points', 'parcel_point_hours', 'delivery_coverage');

SELECT extname FROM pg_extension WHERE extname IN ('cube', 'earthdistance');
```

---

### **Step 3: Deploy Phase 3 (Service Registration)**

1. Open `database/WEEK4_PHASE3_service_registration.sql`
2. Copy entire file
3. Paste into SQL Editor
4. Click **Run**
5. Wait for success message

**Expected Result:**
```
✅ Week 4 Phase 3: Service Registration Tables Created Successfully!
```

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('courier_service_offerings', 'courier_service_pricing', 'service_certifications');
```

---

## 🔧 API DEPLOYMENT

### **Automatic Deployment (Vercel)**

APIs are automatically deployed when you push to GitHub:

```bash
git push origin main
```

Vercel will:
1. Detect new files in `/api` folder
2. Build and deploy automatically
3. Create serverless functions
4. Update production URLs

**Monitor Deployment:**
1. Go to Vercel Dashboard
2. Click on your project
3. Check "Deployments" tab
4. Wait for "Ready" status

---

### **Manual Verification**

After deployment, test each endpoint:

```bash
# Replace YOUR_DOMAIN with your Vercel domain

# Test Service Performance API
curl https://YOUR_DOMAIN.vercel.app/api/service-performance?period_type=monthly&limit=5

# Test Parcel Points API
curl https://YOUR_DOMAIN.vercel.app/api/parcel-points?city=Stockholm&limit=10
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

### **Database:**
- [ ] All tables created (13 total)
- [ ] All functions created (8 total)
- [ ] All materialized views created (3 total)
- [ ] Extensions enabled (cube, earthdistance)
- [ ] RLS policies active
- [ ] Initial data calculated

### **APIs:**
- [ ] Service Performance API responding
- [ ] Parcel Points API responding
- [ ] CORS headers working
- [ ] Error handling working
- [ ] No 500 errors in logs

### **Verification Queries:**

```sql
-- Check all tables exist
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'service_%' 
  OR table_name LIKE 'parcel_%' 
  OR table_name LIKE 'courier_service_%' 
  OR table_name = 'delivery_coverage'
  OR table_name = 'coverage_zones';
-- Expected: 13

-- Check all functions exist
SELECT COUNT(*) as function_count 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND (routine_name LIKE '%service%' OR routine_name LIKE '%parcel%');
-- Expected: 8

-- Check materialized views
SELECT COUNT(*) as view_count 
FROM pg_matviews 
WHERE schemaname = 'public';
-- Expected: 3 (or more if you had existing views)

-- Check data was calculated
SELECT COUNT(*) as performance_records FROM service_performance;
-- Expected: > 0 (depends on your couriers and service types)
```

---

## 🧪 TESTING GUIDE

### **Test 1: Service Performance API**

```bash
# Get performance metrics
curl -X GET "https://YOUR_DOMAIN.vercel.app/api/service-performance?period_type=monthly&limit=5"

# Expected: JSON response with performance data
# Status: 200 OK
```

### **Test 2: Service Comparison**

```bash
# Compare services (replace UUIDs with actual courier IDs)
curl -X GET "https://YOUR_DOMAIN.vercel.app/api/service-performance?action=compare&courier_ids=UUID1,UUID2"

# Expected: JSON with comparison data and rankings
# Status: 200 OK
```

### **Test 3: Parcel Point Search**

```bash
# Search by city
curl -X GET "https://YOUR_DOMAIN.vercel.app/api/parcel-points?city=Stockholm&limit=10"

# Expected: JSON with parcel points (may be empty if no data)
# Status: 200 OK
```

### **Test 4: Nearby Search**

```bash
# Find nearby (Stockholm Central Station)
curl -X GET "https://YOUR_DOMAIN.vercel.app/api/parcel-points?action=nearby&latitude=59.3293&longitude=18.0686&radius_km=5"

# Expected: JSON with nearby points sorted by distance
# Status: 200 OK
```

### **Test 5: Coverage Check**

```bash
# Check coverage for postal code
curl -X GET "https://YOUR_DOMAIN.vercel.app/api/parcel-points?action=coverage&postal_code=11120"

# Expected: JSON with coverage info and summary
# Status: 200 OK
```

---

## 🐛 TROUBLESHOOTING

### **Issue: Tables Not Created**

**Symptoms:**
- SQL execution fails
- "Table already exists" error
- "Column does not exist" error

**Solutions:**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Drop and recreate if needed
DROP TABLE IF EXISTS service_performance CASCADE;
DROP TABLE IF EXISTS service_performance_geographic CASCADE;
-- ... etc

-- Then run migration again
```

---

### **Issue: Extensions Not Available**

**Symptoms:**
- "function ll_to_earth does not exist"
- "extension cube not found"

**Solutions:**
```sql
-- Enable extensions manually
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Verify
SELECT extname FROM pg_extension WHERE extname IN ('cube', 'earthdistance');
```

---

### **Issue: API Returns 500 Error**

**Symptoms:**
- API calls return Internal Server Error
- Vercel logs show database connection errors

**Solutions:**
1. Check environment variables in Vercel
2. Verify `DATABASE_URL` is set correctly
3. Check Supabase connection string
4. Review Vercel function logs

**Check Vercel Environment Variables:**
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

---

### **Issue: CORS Errors**

**Symptoms:**
- Browser console shows CORS errors
- API works in curl but not in browser

**Solutions:**
- CORS headers are already in the API code
- Check if Vercel deployed the latest version
- Clear browser cache
- Try in incognito mode

---

### **Issue: No Data Returned**

**Symptoms:**
- API returns empty arrays
- Count is 0

**Explanation:**
- This is expected for a new system
- Data will populate as orders are created
- Performance metrics calculate from existing orders

**Add Test Data:**
```sql
-- Check if you have orders
SELECT COUNT(*) FROM orders;

-- Check if orders have service types
SELECT COUNT(*) FROM orderservicetype;

-- If no data, the system is working correctly, just empty
```

---

## 📊 MONITORING

### **Database Performance:**

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
  AND (tablename LIKE 'service_%' OR tablename LIKE 'parcel_%')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check materialized view refresh times
SELECT 
    schemaname,
    matviewname,
    last_refresh
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND relname IN (
    'service_performance_summary',
    'parcel_points_summary',
    'service_offerings_summary'
  );
```

### **API Performance:**

Monitor in Vercel Dashboard:
- Function execution time
- Error rates
- Request counts
- Memory usage

---

## 🔄 MAINTENANCE

### **Daily:**
- [ ] Check API error logs
- [ ] Monitor response times
- [ ] Review database performance

### **Weekly:**
- [ ] Refresh materialized views
- [ ] Review slow queries
- [ ] Check disk space

### **Monthly:**
- [ ] Analyze performance trends
- [ ] Optimize slow queries
- [ ] Archive old data (if needed)

**Refresh Materialized Views:**
```sql
-- Refresh all views
SELECT refresh_service_performance_summary();
SELECT refresh_parcel_points_summary();
SELECT refresh_service_offerings_summary();

-- Or refresh concurrently (doesn't lock table)
REFRESH MATERIALIZED VIEW CONCURRENTLY service_performance_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY parcel_points_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY service_offerings_summary;
```

---

## 📝 ROLLBACK PROCEDURE

If something goes wrong:

### **Database Rollback:**

```sql
-- Drop all Week 4 tables
DROP TABLE IF EXISTS service_reviews CASCADE;
DROP TABLE IF EXISTS service_performance_geographic CASCADE;
DROP TABLE IF EXISTS service_performance CASCADE;
DROP TABLE IF EXISTS parcel_point_facilities CASCADE;
DROP TABLE IF EXISTS parcel_point_hours CASCADE;
DROP TABLE IF EXISTS parcel_points CASCADE;
DROP TABLE IF EXISTS delivery_coverage CASCADE;
DROP TABLE IF EXISTS coverage_zones CASCADE;
DROP TABLE IF EXISTS service_availability_calendar CASCADE;
DROP TABLE IF EXISTS service_certifications CASCADE;
DROP TABLE IF EXISTS courier_service_zones CASCADE;
DROP TABLE IF EXISTS courier_service_pricing CASCADE;
DROP TABLE IF EXISTS courier_service_offerings CASCADE;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS service_performance_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS parcel_points_summary CASCADE;
DROP MATERIALIZED VIEW IF EXISTS service_offerings_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_service_performance CASCADE;
DROP FUNCTION IF EXISTS refresh_service_performance_summary CASCADE;
DROP FUNCTION IF EXISTS find_nearby_parcel_points CASCADE;
DROP FUNCTION IF EXISTS check_delivery_coverage CASCADE;
DROP FUNCTION IF EXISTS refresh_parcel_points_summary CASCADE;
DROP FUNCTION IF EXISTS calculate_service_price CASCADE;
DROP FUNCTION IF EXISTS find_available_services CASCADE;
DROP FUNCTION IF EXISTS refresh_service_offerings_summary CASCADE;
```

### **API Rollback:**

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or delete API files
git rm api/service-performance.ts
git rm api/parcel-points.ts
git commit -m "Rollback Week 4 APIs"
git push origin main
```

---

## ✅ SUCCESS CRITERIA

Deployment is successful when:

- [x] All 13 tables created
- [x] All 8 functions working
- [x] All 3 materialized views created
- [x] Extensions enabled (cube, earthdistance)
- [x] RLS policies active
- [x] APIs responding with 200 status
- [x] No 500 errors in logs
- [x] CORS working
- [x] Data structure correct (even if empty)

---

## 🎉 DEPLOYMENT COMPLETE!

Once all checks pass:

1. ✅ Database is ready
2. ✅ APIs are live
3. ✅ System is operational
4. ✅ Ready for frontend integration

**Next Steps:**
- Build frontend components (Phase 6-7)
- Add test data
- User testing
- Documentation for end users

---

**Created By:** Cascade AI  
**Date:** October 19, 2025  
**Version:** 1.0  
**Status:** Ready for Production

---

*"Deployment is not the end, it's the beginning."*

**Happy Deploying! 🚀**
