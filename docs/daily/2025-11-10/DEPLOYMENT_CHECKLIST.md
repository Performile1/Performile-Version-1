# CHECKOUT ANALYTICS - DEPLOYMENT CHECKLIST

**Date:** November 10, 2025  
**Feature:** Dynamic Courier Ranking with Checkout Analytics  
**Status:** Ready for Deployment

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### **1. Code Review**
- [x] Database migration reviewed
- [x] API endpoints reviewed
- [x] Cron job reviewed
- [x] Error handling verified
- [x] Security measures checked
- [x] Documentation complete

### **2. Files Created**
- [x] `database/migrations/2025-11-10_fix_ranking_function.sql`
- [x] `api/checkout/log-courier-display.ts`
- [x] `api/checkout/log-courier-selection.ts`
- [x] `api/cron/update-rankings.ts`
- [x] `vercel.json` (updated with crons)
- [x] Documentation (3 files)

### **3. Testing Prepared**
- [x] Test scripts documented
- [x] Sample data prepared
- [x] Verification queries ready
- [x] Monitoring plan defined

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Database Migration (5 minutes)**

```sql
-- 1. Open Supabase SQL Editor
-- 2. Copy contents of: database/migrations/2025-11-10_fix_ranking_function.sql
-- 3. Paste and RUN
-- 4. Verify success (should see "Success. No rows returned")
```

**Verification:**
```sql
-- Check function exists with new signature
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'update_courier_ranking_scores';

-- Should show p_courier_id parameter
```

**Status:** [ ] Complete

---

### **Step 2: Git Commit & Push (2 minutes)**

```bash
# 1. Stage all files
git add .

# 2. Commit with descriptive message
git commit -m "feat: Add checkout analytics and dynamic ranking cron job

- Add checkout_session_id parameter to ranking function
- Create log-courier-display API endpoint
- Create log-courier-selection API endpoint  
- Create daily ranking update cron job
- Configure Vercel cron schedule
- Add comprehensive documentation"

# 3. Push to GitHub
git push origin main
```

**Status:** [ ] Complete

---

### **Step 3: Vercel Environment Variables (3 minutes)**

```bash
# 1. Go to Vercel Dashboard
# 2. Select your project
# 3. Go to Settings → Environment Variables
# 4. Add new variable:

Name: CRON_SECRET
Value: [Generate secure random string]
Environment: Production, Preview, Development

# Generate secure secret:
# Option 1: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Option 2: openssl rand -hex 32
# Option 3: Use password generator (32+ chars)
```

**Example:**
```
CRON_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Status:** [ ] Complete

---

### **Step 4: Verify Vercel Deployment (5 minutes)**

```bash
# 1. Wait for Vercel deployment to complete (2-3 minutes)
# 2. Check deployment logs for errors
# 3. Verify cron job is scheduled
```

**Verification Steps:**

1. **Check Deployment:**
   - Go to Vercel Dashboard → Deployments
   - Latest deployment should be "Ready"
   - No build errors

2. **Check Cron Jobs:**
   - Go to Vercel Dashboard → Cron Jobs
   - Should see: `/api/cron/update-rankings`
   - Schedule: `0 0 * * *` (daily at midnight)
   - Status: Active

3. **Check Functions:**
   - Go to Vercel Dashboard → Functions
   - Should see:
     - `/api/checkout/log-courier-display`
     - `/api/checkout/log-courier-selection`
     - `/api/cron/update-rankings`

**Status:** [ ] Complete

---

### **Step 5: Test APIs (10 minutes)**

#### **Test 1: Log Courier Display**

```bash
curl -X POST https://your-domain.vercel.app/api/checkout/log-courier-display \
  -H "Content-Type: application/json" \
  -d '{
    "checkout_session_id": "checkout_1699612345_test001",
    "merchant_id": "your-merchant-uuid",
    "couriers": [
      {
        "courier_id": "courier1-uuid",
        "position_shown": 1,
        "trust_score": 4.5,
        "price": 89.00,
        "delivery_time_hours": 24
      },
      {
        "courier_id": "courier2-uuid",
        "position_shown": 2,
        "trust_score": 4.2,
        "price": 79.00,
        "delivery_time_hours": 48
      }
    ],
    "order_context": {
      "order_value": 1250.00,
      "items_count": 3,
      "package_weight_kg": 5.0
    },
    "delivery_location": {
      "postal_code": "0150",
      "city": "Oslo",
      "country": "NO"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Courier displays logged successfully",
  "checkout_session_id": "checkout_1699612345_test001",
  "couriers_logged": 2,
  "analytics_ids": ["uuid1", "uuid2"]
}
```

**Status:** [ ] Complete

---

#### **Test 2: Log Courier Selection**

```bash
curl -X POST https://your-domain.vercel.app/api/checkout/log-courier-selection \
  -H "Content-Type: application/json" \
  -d '{
    "checkout_session_id": "checkout_1699612345_test001",
    "selected_courier_id": "courier2-uuid"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Courier selection logged successfully",
  "checkout_session_id": "checkout_1699612345_test001",
  "selected_courier_id": "courier2-uuid",
  "selection_details": {
    "position": 2,
    "total_couriers": 2
  }
}
```

**Status:** [ ] Complete

---

#### **Test 3: Trigger Cron Job Manually**

```bash
curl -X GET https://your-domain.vercel.app/api/cron/update-rankings \
  -H "Authorization: Bearer your-cron-secret"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Courier rankings updated successfully",
  "execution_time_ms": 1234,
  "results": {
    "rankings_updated": 150,
    "snapshots_saved": 150,
    "top_couriers": [...]
  }
}
```

**Status:** [ ] Complete

---

### **Step 6: Verify Database (5 minutes)**

```sql
-- 1. Check analytics data
SELECT 
  checkout_session_id,
  courier_id,
  position_shown,
  was_selected,
  created_at
FROM checkout_courier_analytics 
WHERE checkout_session_id LIKE 'checkout_%test%'
ORDER BY created_at DESC;

-- Expected: 2 rows, one with was_selected = true

-- 2. Check ranking scores
SELECT 
  courier_id,
  postal_area,
  final_ranking_score,
  last_calculated
FROM courier_ranking_scores 
ORDER BY final_ranking_score DESC 
LIMIT 10;

-- Expected: Scores updated recently

-- 3. Check ranking history
SELECT 
  courier_id,
  postal_area,
  snapshot_date,
  ranking_score
FROM courier_ranking_history 
WHERE snapshot_date = CURRENT_DATE
LIMIT 10;

-- Expected: Today's snapshots exist
```

**Status:** [ ] Complete

---

## 📊 POST-DEPLOYMENT MONITORING

### **Day 1: Monitor Closely**

1. **Check Cron Execution:**
   - Vercel Dashboard → Cron Jobs → Logs
   - Should run at midnight UTC
   - Check for errors

2. **Monitor API Usage:**
   - Vercel Dashboard → Analytics
   - Check request counts
   - Check error rates
   - Check response times

3. **Database Monitoring:**
   ```sql
   -- Check analytics growth
   SELECT 
     DATE(created_at) as date,
     COUNT(*) as displays,
     SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) as selections
   FROM checkout_courier_analytics
   GROUP BY DATE(created_at)
   ORDER BY date DESC
   LIMIT 7;
   ```

### **Week 1: Verify Behavior**

1. **Ranking Updates:**
   - Check daily snapshots are created
   - Verify scores are changing
   - Monitor top performers

2. **Selection Rates:**
   ```sql
   SELECT 
     courier_id,
     COUNT(*) as displays,
     SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) as selections,
     ROUND(100.0 * SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) / COUNT(*), 2) as rate
   FROM checkout_courier_analytics
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY courier_id
   ORDER BY rate DESC;
   ```

3. **Performance:**
   - API response times < 200ms
   - Cron job execution < 5 seconds
   - No timeout errors

---

## 🚨 ROLLBACK PLAN

### **If Issues Occur:**

1. **Disable Cron Job:**
   ```bash
   # Remove crons section from vercel.json
   # Commit and push
   git add vercel.json
   git commit -m "fix: Disable ranking cron temporarily"
   git push
   ```

2. **Revert Database Function:**
   ```sql
   -- Restore old function signature
   CREATE OR REPLACE FUNCTION update_courier_ranking_scores(
     p_postal_area VARCHAR DEFAULT NULL
   )
   RETURNS INTEGER AS $$
   -- ... old implementation
   $$ LANGUAGE plpgsql;
   ```

3. **Monitor Errors:**
   - Check Vercel logs
   - Check Supabase logs
   - Identify root cause

---

## ✅ SUCCESS CRITERIA

### **Immediate (Day 1):**
- [x] All files deployed successfully
- [ ] No build errors
- [ ] APIs respond correctly
- [ ] Cron job scheduled
- [ ] Test data in database

### **Short-term (Week 1):**
- [ ] Cron job runs daily without errors
- [ ] Analytics data accumulating
- [ ] Rankings updating correctly
- [ ] No performance issues
- [ ] No security issues

### **Long-term (Month 1):**
- [ ] 1000+ checkout sessions logged
- [ ] Rankings stabilized
- [ ] Selection rates improving
- [ ] Top couriers identified
- [ ] Business value demonstrated

---

## 📋 FINAL CHECKLIST

- [ ] Database migration complete
- [ ] Code pushed to GitHub
- [ ] Vercel deployment successful
- [ ] CRON_SECRET configured
- [ ] Cron job scheduled
- [ ] APIs tested and working
- [ ] Database verified
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Documentation shared

---

## 🎉 DEPLOYMENT COMPLETE!

Once all checkboxes are marked, the feature is live and ready for production use.

**Next Steps:**
1. Integrate into frontend checkout
2. Monitor for 1 week
3. Analyze initial results
4. Optimize ranking algorithm if needed

---

**Deployed By:** _________________  
**Deployment Date:** _________________  
**Verification Date:** _________________  
**Status:** [ ] Complete [ ] Issues Found [ ] Rolled Back

---

**Questions or Issues?**
- Check: `CHECKOUT_ANALYTICS_IMPLEMENTATION.md`
- Check: `CHECKOUT_INTEGRATION_GUIDE.md`
- Contact: Platform team
