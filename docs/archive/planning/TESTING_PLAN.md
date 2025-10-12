# Performile Platform - Comprehensive Testing Plan

**Created:** October 8, 2025, 21:52  
**Status:** Post-Crash Recovery Testing  
**Priority:** Verify all pages work with real data

---

## 🎯 TESTING OBJECTIVES

1. Verify all pages load without errors
2. Confirm data displays correctly from database
3. Identify missing data or broken queries
4. Map which pages use which tables/APIs
5. Test user flows end-to-end

---

## 📊 DATABASE TABLE → PAGE MAPPING

### **Core Tables**

#### 1. `users` (Authentication & Profiles)
**Used By:**
- ✅ Login page (`/login`)
- ✅ Registration page (`/register`)
- ⚠️ Profile page (`/profile`) - NEEDS TESTING
- ⚠️ Team members list (`/team`) - NEEDS TESTING
- ✅ Orders API (customer names via JOIN)

**Test Cases:**
- [ ] Login with admin@performile.com
- [ ] View user profile
- [ ] Update user information
- [ ] Check user role permissions

---

#### 2. `couriers` (Courier Management)
**Used By:**
- ✅ TrustScores page (`/trustscores`) - WORKING
- ⚠️ Couriers management (`/admin/couriers`) - 500 ERROR
- ⚠️ Courier selection dropdowns - NEEDS TESTING
- ✅ Dashboard (top performers)
- ✅ Orders (courier names via JOIN)

**APIs:**
- ⚠️ `/api/couriers` - 500 ERROR (logo_url column issue)
- ✅ `/api/trustscore` - WORKING
- ✅ `/api/trustscore/dashboard` - WORKING

**Test Cases:**
- [x] View TrustScores page - WORKING
- [ ] View couriers management page - BROKEN (500)
- [ ] Filter couriers by rating
- [ ] View individual courier details
- [ ] Check courier analytics data

**Known Issues:**
- ⚠️ `/api/couriers` tries to select `logo_url` column that doesn't exist

---

#### 3. `stores` (Merchant Stores)
**Used By:**
- ⚠️ Stores management (`/admin/stores`) - 500 ERROR
- ⚠️ Store selection dropdowns - NEEDS TESTING
- ✅ Orders (store names via JOIN)

**APIs:**
- ⚠️ `/api/stores` - 500 ERROR (column mismatch)

**Test Cases:**
- [ ] View stores management page - BROKEN (500)
- [ ] Add new store
- [ ] Edit store details
- [ ] View store orders

**Known Issues:**
- ⚠️ `/api/stores` has column mismatch with actual table

---

#### 4. `orders` (Order Management)
**Used By:**
- ✅ Orders page (`/admin/orders`) - WORKING (just fixed)
- ✅ Dashboard (order counts)
- ⚠️ Order details modal - NEEDS TESTING
- ⚠️ Tracking page (`/track/:trackingNumber`) - NEEDS TESTING

**APIs:**
- ✅ `/api/orders` - WORKING (fixed customer_name JOIN)
- ⚠️ `/api/tracking/:trackingNumber` - NEEDS TESTING

**Test Cases:**
- [x] View orders list - WORKING
- [ ] Filter orders by status
- [ ] View order details
- [ ] Track order by tracking number
- [ ] Check order-courier-store relationships

---

#### 5. `reviews` (Customer Reviews)
**Used By:**
- ✅ TrustScores page (review counts)
- ✅ Dashboard (review stats)
- ⚠️ Reviews management page - NEEDS TESTING
- ⚠️ Public review submission - NEEDS TESTING

**APIs:**
- ✅ `/api/reviews` - ASSUMED WORKING
- ⚠️ `/api/reviews/submit` - NEEDS TESTING

**Test Cases:**
- [ ] View reviews list
- [ ] Submit new review
- [ ] Moderate reviews
- [ ] Check review-order relationships

---

### **Analytics Tables**

#### 6. `courier_analytics` (Cached Courier Metrics)
**Used By:**
- ✅ TrustScores page - WORKING
- ✅ Dashboard (top performers) - WORKING
- ⚠️ Analytics page - 500 ERROR

**Populated By:**
- ✅ `refresh_courier_analytics()` function

**Test Cases:**
- [x] View TrustScores - WORKING
- [x] View dashboard top performers - WORKING
- [ ] View analytics page - BROKEN (500)
- [ ] Verify metrics match raw data

**Data Status:**
- ✅ 11 couriers with TrustScores (76.67 - 88.33)
- ✅ All fields populated (trust_score, total_orders, completion_rate, etc.)

---

#### 7. `platform_analytics` (Platform-wide Metrics)
**Used By:**
- ✅ Dashboard (summary stats) - WORKING
- ⚠️ Analytics page - 500 ERROR

**Populated By:**
- ✅ `refresh_platform_analytics()` function

**Test Cases:**
- [x] View dashboard stats - WORKING
- [ ] View analytics page - BROKEN (500)
- [ ] Check historical trends

**Data Status:**
- ✅ 1 row with current metrics (11 couriers, 520 orders, 312 reviews, 80.38 avg TrustScore)

---

#### 8. `analytics_marketplace` (Market Analytics)
**Used By:**
- ⚠️ Marketplace page - NEEDS TESTING
- ⚠️ Market insights - NEEDS TESTING

**Test Cases:**
- [ ] View marketplace analytics
- [ ] Check market share data
- [ ] Verify competitor analysis

---

### **Integration Tables**

#### 9. `storeintegrations` (E-commerce Connections)
**Used By:**
- ⚠️ Store settings page - NEEDS TESTING
- ⚠️ Integration setup wizard - NEEDS TESTING

**Test Cases:**
- [ ] View connected integrations
- [ ] Add new integration
- [ ] Test webhook endpoints
- [ ] Verify order sync

---

#### 10. `webhook_endpoints` & `webhook_logs`
**Used By:**
- ⚠️ Webhooks management page - NEEDS TESTING
- ⚠️ Integration logs - NEEDS TESTING

**Test Cases:**
- [ ] View webhook endpoints
- [ ] View webhook logs
- [ ] Test webhook delivery
- [ ] Check error handling

---

#### 11. `notifications`
**Used By:**
- ⚠️ Notifications panel - NEEDS TESTING
- ⚠️ Notification center - NEEDS TESTING

**APIs:**
- ⚠️ `/api/notifications` - NEEDS TESTING

**Test Cases:**
- [ ] View notifications list
- [ ] Mark as read
- [ ] Real-time notifications (Pusher)

---

### **Subscription & Payment Tables**

#### 12. `subscriptionplans`
**Used By:**
- ⚠️ Subscription management (`/admin/subscriptions`) - 401 ERROR
- ⚠️ Plan selection during registration - NEEDS TESTING

**Test Cases:**
- [ ] View subscription plans
- [ ] Create/edit plans
- [ ] Assign plans to users

---

#### 13. `usersubscriptions`
**Used By:**
- ⚠️ User subscription status - NEEDS TESTING
- ⚠️ Billing page - NEEDS TESTING

**Test Cases:**
- [ ] View active subscriptions
- [ ] Upgrade/downgrade plan
- [ ] Cancel subscription
- [ ] View billing history

---

### **Team Management Tables**

#### 14. `team_members` (MISSING TABLE)
**Used By:**
- ⚠️ Team management page (`/team`) - 500 ERROR

**APIs:**
- ⚠️ `/api/team/my-entities` - 500 ERROR

**Test Cases:**
- [ ] View team members - BROKEN (missing table)
- [ ] Invite team member
- [ ] Remove team member
- [ ] Assign roles

**Action Required:**
- 🔴 Create `team_members` table
- 🔴 Create `team_invitations` table

---

### **Claims Tables (ALL MISSING)**

#### 15. Claims System (5 tables)
**Missing Tables:**
- `claims`
- `claim_documents`
- `claim_messages`
- `claim_templates`
- `claim_status_history`

**Used By:**
- ⚠️ Claims management page (`/claims`) - 401 ERROR (no data)

**Test Cases:**
- [ ] View claims list - NO DATA
- [ ] Create new claim
- [ ] Upload documents
- [ ] Send messages
- [ ] Track claim status

**Action Required:**
- 🔴 Create all 5 claims tables
- 🔴 Seed sample claims data

---

## 🧪 PAGE-BY-PAGE TESTING CHECKLIST

### **✅ WORKING PAGES**

#### 1. Login Page (`/login`)
- [x] Page loads
- [x] Login form works
- [x] Authentication successful
- [x] Redirects to dashboard
- **Status:** ✅ FULLY WORKING

#### 2. Dashboard (`/dashboard`)
- [x] Page loads
- [x] Summary stats display (11 couriers, 80.4 TrustScore, 520 orders, 312 reviews)
- [x] Top performers list shows
- [ ] Recent activity feed - NEEDS TESTING
- [ ] Charts render - NEEDS TESTING
- **Status:** ✅ MOSTLY WORKING

#### 3. TrustScores Page (`/trustscores`)
- [x] Page loads
- [x] All 11 couriers display
- [x] TrustScores show correctly (76.67 - 88.33)
- [x] Ratings display
- [x] Completion rates show
- [x] On-time rates show
- [ ] Filter/search functionality - NEEDS TESTING
- [ ] Courier detail modal - NEEDS TESTING
- **Status:** ✅ FULLY WORKING

#### 4. Orders Page (`/admin/orders`)
- [x] Page loads
- [x] Orders list displays
- [x] Customer names show (via users JOIN)
- [x] Courier names show
- [x] Store names show
- [ ] Pagination works - NEEDS TESTING
- [ ] Filters work - NEEDS TESTING
- [ ] Order details modal - NEEDS TESTING
- **Status:** ✅ MOSTLY WORKING

---

### **⚠️ BROKEN PAGES (500 Errors)**

#### 5. Couriers Management (`/admin/couriers`)
- [ ] Page loads - **500 ERROR**
- **API:** `/api/couriers` - tries to select `logo_url` column
- **Fix Required:** Remove logo_url from query
- **Estimated Fix Time:** 15 minutes

#### 6. Stores Management (`/admin/stores`)
- [ ] Page loads - **500 ERROR**
- **API:** `/api/stores` - column mismatch
- **Fix Required:** Match actual stores table schema
- **Estimated Fix Time:** 15 minutes

#### 7. Analytics Page (`/analytics`)
- [ ] Page loads - **500 ERROR**
- **API:** `/api/admin/analytics` - query needs fixing
- **Fix Required:** Update query for analytics tables
- **Estimated Fix Time:** 30 minutes

#### 8. Team Page (`/team`)
- [ ] Page loads - **500 ERROR**
- **API:** `/api/team/my-entities` - missing tables
- **Fix Required:** Create team_members and team_invitations tables
- **Estimated Fix Time:** 1 hour

---

### **⚠️ UNTESTED PAGES**

#### 9. Tracking Page (`/track/:trackingNumber`)
- [ ] Page loads
- [ ] Tracking info displays
- [ ] Status updates show
- [ ] Map/timeline renders
- **Status:** NEEDS TESTING

#### 10. Claims Page (`/claims`)
- [ ] Page loads - **401 ERROR** (no data)
- [ ] Claims list displays
- [ ] Create claim form works
- **Status:** NEEDS TABLES + DATA

#### 11. Subscriptions Page (`/admin/subscriptions`)
- [ ] Page loads - **401 ERROR**
- [ ] Plans list displays
- [ ] Create/edit plan works
- **Status:** NEEDS TESTING

#### 12. Profile Page (`/profile`)
- [ ] Page loads
- [ ] User info displays
- [ ] Edit profile works
- [ ] Password change works
- **Status:** NEEDS TESTING

#### 13. Marketplace Page (`/marketplace`)
- [ ] Page loads
- [ ] Courier listings show
- [ ] Search/filter works
- [ ] Booking flow works
- **Status:** NEEDS TESTING

#### 14. Reviews Management (`/admin/reviews`)
- [ ] Page loads
- [ ] Reviews list displays
- [ ] Moderation tools work
- [ ] Bulk actions work
- **Status:** NEEDS TESTING

#### 15. Notifications Panel
- [ ] Panel opens
- [ ] Notifications list displays
- [ ] Mark as read works
- [ ] Real-time updates work (Pusher)
- **Status:** NEEDS TESTING

---

## 🔄 DATA FLOW TESTING

### **Order Creation Flow**
```
E-commerce Platform → Webhook → /api/webhooks/ecommerce
  ↓
Create order in `orders` table
  ↓
Create delivery_request in `delivery_requests` table
  ↓
Send notification to `notifications` table
  ↓
Trigger review request (after delivery)
  ↓
Create review in `reviews` table
  ↓
Update `courier_analytics` cache
  ↓
Update `platform_analytics` cache
```

**Test Cases:**
- [ ] Webhook receives order
- [ ] Order created in database
- [ ] Notification sent
- [ ] Review request triggered
- [ ] Analytics updated

---

### **TrustScore Calculation Flow**
```
Reviews in `reviews` table
  ↓
Orders in `orders` table
  ↓
Run refresh_courier_analytics()
  ↓
Calculate TrustScore (0-100)
  ↓
Store in `courier_analytics` table
  ↓
Display on TrustScores page
```

**Test Cases:**
- [x] Reviews exist (312 reviews)
- [x] Orders exist (520 orders)
- [x] Analytics cache populated
- [x] TrustScores calculated (76.67 - 88.33)
- [x] Display on page - WORKING

---

### **Dashboard Metrics Flow**
```
`platform_analytics` table (cached)
  ↓
/api/trustscore/dashboard
  ↓
Dashboard component
  ↓
Display summary cards
```

**Test Cases:**
- [x] Cache populated (1 row)
- [x] API returns data
- [x] Dashboard displays metrics
- [ ] Metrics update on refresh

---

## 📋 TOMORROW'S TESTING PLAN

### **Phase 1: Fix Broken APIs (2 hours)**
1. ✅ Fix `/api/orders` - COMPLETED
2. ⚠️ Fix `/api/couriers` - Remove logo_url
3. ⚠️ Fix `/api/stores` - Match schema
4. ⚠️ Fix `/api/admin/analytics` - Update query
5. ⚠️ Fix `/api/team/my-entities` - Create tables

### **Phase 2: Create Missing Tables (2 hours)**
1. Create `team_members` table
2. Create `team_invitations` table
3. Create 5 claims tables
4. Create subscription tracking tables
5. Seed sample data for each

### **Phase 3: Page-by-Page Testing (3 hours)**
1. Test all admin pages
2. Test user-facing pages
3. Test integration pages
4. Test mobile responsiveness
5. Document any issues

### **Phase 4: Data Flow Testing (2 hours)**
1. Test order creation flow
2. Test review submission flow
3. Test webhook integrations
4. Test analytics refresh
5. Test notifications

### **Phase 5: User Journey Testing (2 hours)**
1. Merchant onboarding flow
2. Courier registration flow
3. Consumer tracking flow
4. Admin management flow
5. Team collaboration flow

---

## 🎯 SUCCESS CRITERIA

### **Minimum for Beta Launch:**
- ✅ Login works
- ✅ Dashboard shows data
- ✅ TrustScores display
- ✅ Orders management works
- ⚠️ Couriers management works
- ⚠️ Stores management works
- ⚠️ Analytics page works
- ⚠️ Profile management works
- ⚠️ Basic notifications work

### **Nice to Have:**
- Claims system functional
- Team management working
- Marketplace operational
- All webhooks tested
- Mobile app ready

---

## 📊 CURRENT STATUS SUMMARY

**Working (40%):**
- ✅ Login & Authentication
- ✅ Dashboard
- ✅ TrustScores
- ✅ Orders (just fixed)

**Broken - Quick Fixes (20%):**
- ⚠️ Couriers page (15 min)
- ⚠️ Stores page (15 min)
- ⚠️ Analytics page (30 min)
- ⚠️ Team page (1 hour)

**Untested (30%):**
- ⚠️ Profile
- ⚠️ Tracking
- ⚠️ Reviews
- ⚠️ Notifications
- ⚠️ Marketplace
- ⚠️ Subscriptions

**Missing Features (10%):**
- ❌ Claims system (needs tables)
- ❌ Some team features (needs tables)

---

## 🚀 NEXT STEPS

**Tomorrow Morning:**
1. Fix 4 broken APIs (2 hours)
2. Create 8 missing tables (2 hours)
3. Test all pages systematically (3 hours)
4. Document findings (1 hour)
5. Create bug fix list (1 hour)

**Total Estimated Time:** 9 hours to 100% tested and documented

---

**Last Updated:** October 8, 2025, 21:52  
**Next Review:** October 9, 2025 (Tomorrow)
