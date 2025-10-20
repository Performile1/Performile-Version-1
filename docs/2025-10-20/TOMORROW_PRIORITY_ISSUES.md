# 🚨 PRIORITY ISSUES FOR TOMORROW - October 21, 2025

**Created:** October 20, 2025, 11:05 PM  
**Status:** To Be Fixed Tomorrow  
**Priority:** HIGH

---

## 🐛 CRITICAL ISSUES FOUND

### **Issue 1: Subscription Views Confusion** 🔴 HIGH PRIORITY

**Problem:**
- Admin can see subscriptions (working ✅)
- Both public AND logged-in views exist (redundant)
- Need to simplify the views

**Current State:**
```
📊 ADMIN VIEW
├── ✅ Can see all subscriptions
├── ✅ Has merchant/courier tabs
└── ❌ Can't save plan changes

🌐 PUBLIC VIEW (/#/subscription/plans)
├── ✅ Shows plans for non-logged-in users
├── ✅ Has merchant/courier toggle
└── ✅ "Get Started" redirects to register

👤 LOGGED-IN VIEW (for merchants/couriers)
├── ❌ Gets 404 error
├── ❌ Can't see their subscription
└── ❌ View doesn't exist or broken route
```

**Solution Needed:**
1. **For Public Users (not logged in):**
   - ✅ KEEP: Public pricing page (`/#/subscription/plans`)
   - ✅ KEEP: "Get Started" → Register flow
   - ❌ DELETE: Redundant logged-in view

2. **For Merchants/Couriers (logged in):**
   - ❌ DELETE: Public pricing page access
   - ✅ KEEP: Dashboard subscription component
   - ✅ CREATE: "My Subscription" page showing:
     - Current plan
     - Usage stats
     - Upgrade/downgrade options
     - Billing history

3. **For Admin:**
   - ✅ KEEP: Admin subscriptions page
   - ✅ FIX: Save functionality

---

### **Issue 2: 404 Error on Merchant/Courier Subscription View** 🔴 HIGH PRIORITY

**Problem:**
- Merchants and couriers get 404 when trying to view subscriptions
- Route doesn't exist or API endpoint missing

**Error Details:**
```
GET /api/subscriptions/[something] → 404 Not Found
```

**Possible Causes:**
1. Route not defined in router
2. API endpoint missing
3. Wrong URL being called
4. RLS policy blocking access

**To Investigate:**
- [ ] Check what URL is being called
- [ ] Check if route exists in router
- [ ] Check if API endpoint exists
- [ ] Check RLS policies for user_subscriptions table
- [ ] Check authentication token

**Expected Behavior:**
- Merchant logs in → Can see their subscription
- Courier logs in → Can see their subscription
- Shows: Plan name, price, usage, limits

---

### **Issue 3: Admin Can't Save Plan Changes** 🔴 HIGH PRIORITY

**Problem:**
- Admin can view subscription plans
- Admin can edit plan details
- Admin CANNOT save changes (button doesn't work or API fails)

**Possible Causes:**
1. Save button not connected to API
2. API endpoint missing (PUT/PATCH)
3. Validation errors
4. RLS policy blocking updates
5. Missing admin permissions

**To Investigate:**
- [ ] Check if save button has onClick handler
- [ ] Check what API endpoint is called
- [ ] Check if endpoint exists
- [ ] Check RLS policies for subscription_plans table
- [ ] Check admin role verification
- [ ] Check console for errors

**Expected Behavior:**
- Admin edits plan (name, price, features, etc.)
- Admin clicks "Save"
- Changes are saved to database
- Success message shown
- Plan list updates

---

## 🎯 TOMORROW'S ACTION PLAN

### **Priority 1: Fix Admin Save Functionality** ⚡ CRITICAL
**Time Estimate:** 30 minutes

**Steps:**
1. Check admin subscriptions page code
2. Find save button handler
3. Check API endpoint being called
4. Create/fix PUT endpoint if missing
5. Test saving plan changes
6. Verify RLS policies allow admin updates

**Files to Check:**
- `apps/web/src/pages/admin/AdminSubscriptions.tsx`
- `api/admin/subscriptions.ts` (or similar)
- Database RLS policies for `subscription_plans`

---

### **Priority 2: Fix Merchant/Courier 404 Error** ⚡ CRITICAL
**Time Estimate:** 45 minutes

**Steps:**
1. Identify what URL merchants/couriers are trying to access
2. Check if route exists in router
3. Create missing route/component if needed
4. Create API endpoint for user subscriptions
5. Add RLS policy for users to view their own subscription
6. Test with merchant and courier accounts

**Files to Create/Check:**
- `apps/web/src/pages/MySubscription.tsx` (new)
- `api/subscriptions/my-subscription.ts` (new)
- Router configuration
- RLS policies for `user_subscriptions`

---

### **Priority 3: Simplify Subscription Views** 📋 HIGH
**Time Estimate:** 1 hour

**Steps:**
1. **Keep for Public (not logged in):**
   - Public pricing page (`/#/subscription/plans`)
   - Shows all plans
   - "Get Started" → Register

2. **Create for Logged-in Users:**
   - "My Subscription" page
   - Shows current plan
   - Usage statistics
   - Upgrade/downgrade buttons

3. **Keep for Admin:**
   - Admin subscriptions management
   - Can edit all plans
   - Can activate/deactivate plans

**Files to Modify:**
- `apps/web/src/pages/SubscriptionPlans.tsx` (public only)
- `apps/web/src/pages/MySubscription.tsx` (create new)
- `apps/web/src/components/dashboard/SubscriptionCard.tsx` (update)
- Router configuration

---

## 📊 CURRENT STATE SUMMARY

### **What's Working ✅**
- Public pricing page loads
- Admin can view subscriptions
- Merchant/Courier toggle works
- Plans display correctly
- "Get Started" redirects to register
- Register page shows selected plan

### **What's Broken ❌**
- Admin can't save plan changes
- Merchants/Couriers get 404 on subscription view
- Redundant views causing confusion
- No "My Subscription" page for logged-in users

---

## 🔍 INVESTIGATION NEEDED

### **Question 1: What URL causes the 404?**
Need to check browser console/network tab to see:
- What URL is being called?
- What HTTP method? (GET, POST, PUT?)
- What's the full error response?

### **Question 2: What happens when admin clicks Save?**
Need to check:
- Does button have onClick handler?
- What API endpoint is called?
- What's the error message?
- Check browser console

### **Question 3: Where should logged-in users see subscriptions?**
Options:
- A. Dashboard widget (current plan summary)
- B. Dedicated "My Subscription" page
- C. Settings page section
- **Recommendation: B + A (page + widget)**

---

## 🛠️ TECHNICAL DETAILS

### **Database Tables Involved**

**subscription_plans:**
```sql
- subscription_plan_id (PK)
- plan_name
- plan_slug
- user_type (merchant/courier)
- tier (1-4)
- monthly_price
- annual_price
- features (JSONB)
- is_active
- is_popular
```

**user_subscriptions:**
```sql
- subscription_id (PK)
- user_id (FK)
- subscription_plan_id (FK)
- status (active/cancelled/expired)
- current_period_start
- current_period_end
- stripe_subscription_id
- orders_used_this_month
- cancel_at_period_end
```

### **RLS Policies Needed**

**For subscription_plans:**
```sql
-- Public can read active plans
CREATE POLICY "Public can view active plans"
ON subscription_plans FOR SELECT
TO public
USING (is_active = true);

-- Admin can update plans
CREATE POLICY "Admin can update plans"
ON subscription_plans FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'user_role' = 'admin');
```

**For user_subscriptions:**
```sql
-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON user_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin can view all subscriptions
CREATE POLICY "Admin can view all subscriptions"
ON user_subscriptions FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'user_role' = 'admin');
```

---

## 📋 TOMORROW'S CHECKLIST

### **Morning (First Thing)**
- [ ] Check Vercel deployment status (should be recovered)
- [ ] Test current deployment
- [ ] Reproduce all 3 issues
- [ ] Document exact error messages

### **Fix 1: Admin Save (30 min)**
- [ ] Find save button code
- [ ] Check API endpoint
- [ ] Create/fix endpoint
- [ ] Test saving
- [ ] Verify RLS policies

### **Fix 2: Merchant/Courier 404 (45 min)**
- [ ] Identify URL causing 404
- [ ] Create missing route
- [ ] Create API endpoint
- [ ] Add RLS policies
- [ ] Test with both roles

### **Fix 3: Simplify Views (1 hour)**
- [ ] Create "My Subscription" page
- [ ] Update router
- [ ] Add navigation links
- [ ] Test all user flows
- [ ] Update documentation

### **Testing (30 min)**
- [ ] Test as public user
- [ ] Test as merchant
- [ ] Test as courier
- [ ] Test as admin
- [ ] Verify all flows work

### **Documentation (15 min)**
- [ ] Update PERFORMILE_MASTER
- [ ] Update END_OF_DAY_SUMMARY
- [ ] Commit all changes
- [ ] Push to GitHub

---

## 🎯 SUCCESS CRITERIA

**Tomorrow's work is complete when:**
- ✅ Admin can save plan changes
- ✅ Merchants can view their subscription (no 404)
- ✅ Couriers can view their subscription (no 404)
- ✅ Clear separation between public and logged-in views
- ✅ All user flows tested and working
- ✅ Documentation updated

---

## 💡 NOTES

**Why This Happened:**
- Focused on public pricing page today
- Didn't implement logged-in user views yet
- Admin save functionality not connected
- Normal for MVP development - build iteratively

**What We Learned:**
- Need separate views for public vs logged-in
- Admin functionality needs testing
- User subscription management is critical
- RLS policies need careful planning

**What's Good:**
- Public pricing page works great
- Register flow works
- Plan selection works
- Foundation is solid

---

## 📞 QUESTIONS TO ANSWER TOMORROW

1. **What should "My Subscription" page show?**
   - Current plan details?
   - Usage statistics?
   - Billing history?
   - Upgrade/downgrade options?
   - Payment method?

2. **Where should subscription link be in navigation?**
   - Dashboard sidebar?
   - User menu dropdown?
   - Settings page?

3. **Should merchants/couriers see public pricing page?**
   - Yes (to compare plans)?
   - No (only see their own)?
   - Redirect to "My Subscription"?

---

## 🚀 ESTIMATED TIME

**Total Time for Tomorrow:** 3-4 hours
- Fix admin save: 30 min
- Fix 404 errors: 45 min
- Create "My Subscription": 1 hour
- Testing: 30 min
- Documentation: 15 min
- Buffer: 30-60 min

---

**Status:** Ready for tomorrow  
**Priority:** HIGH  
**Owner:** Development Team  
**Next Session:** October 21, 2025

---

**END OF PRIORITY ISSUES DOCUMENT**

*Get some rest! We'll tackle these tomorrow! 😊*
