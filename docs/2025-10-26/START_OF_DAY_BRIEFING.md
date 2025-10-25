# ☀️ Start of Day Briefing - October 26, 2025

**Time:** Morning  
**Day:** Bug Fix Sprint - Day 2  
**Goal:** Complete Critical Fixes & Implement Role-Based Menu  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.21  
**Status:** Ready to Execute

---

## 🎯 TODAY'S MISSION

**Complete All Critical Fixes from Oct 25 Testing**

**Current Status:** 50% Fixed (3/6 tasks) → **Target:** 100% Fixed  
**Time Estimate:** 1-2 hours  
**Confidence:** HIGH

---

## 📋 YESTERDAY'S RECAP (Oct 25)

### Achievements:
✅ Fixed claims analytics (proper JOIN query)  
✅ Fixed courier count mismatch (real-time query)  
✅ Added 3-tier cache fallback (100% reliability)  
✅ Fixed subscription API (column name issue)  
✅ Created ComingSoon component  
✅ Added missing routes (parcel-points, coverage-checker, marketplace)  
✅ Created comprehensive documentation (13 docs)

### Issues Found During Testing:
🚨 **20 issues discovered** across all user roles (admin, merchant, courier)

### Phase 1 Completed (Oct 25, 10:40 PM):
✅ Subscription API fixed  
✅ ComingSoon component created  
✅ Missing routes added (3 routes)  
✅ Committed and deployed

### Phase 2 Remaining (Today):
⏳ Role-based menu filtering  
⏳ Remove test data  
⏳ Fix remaining issues

---

## 🚨 CRITICAL: FIX FIRST (3 hours)

### **1. RLS NOT ENABLED - SECURITY VULNERABILITY** 🔴🔴🔴

**Problem:** 33 tables have NO Row Level Security enabled!

**Risk:**
- ❌ Any user can read/write ANY data in these tables
- ❌ Merchants can see other merchants' data
- ❌ Payment data exposed (`paymenthistory`)
- ❌ API credentials exposed (`courier_api_credentials`)
- ❌ GDPR violation
- ❌ PCI-DSS violation

**Critical Tables:**
- `paymenthistory` - **PAYMENT DATA EXPOSED**
- `courier_api_credentials` - **API KEYS EXPOSED**
- `ecommerce_integrations` - **CREDENTIALS EXPOSED**
- `user_subscriptions` - User data exposed
- `tracking_data` - Tracking info exposed
- ... and 28 more tables!

**Fix:**
1. Enable RLS on all 33 tables (30 min)
2. Create RLS policies for each table (2.5 hours)
3. Test data isolation (30 min)

**Time:** 3 hours  
**Priority:** P0 - **CRITICAL SECURITY** (do this FIRST!)

**See:** `docs/2025-10-26/CRITICAL_SECURITY_RLS_ISSUES.md`

---

### **2. Environment Variables Missing in Vercel** 🔴

**Problem:** Multiple APIs failing with `supabaseUrl is required` error

**Affected APIs:**
- `/api/subscriptions/my-subscription` - 500 error
- `/api/subscriptions/public` - 500 error  
- `/api/analytics/claims-trends` - 500 error
- `/api/analytics/order-trends` - 500 error

**Fix:**
1. Go to Vercel → Project Settings → Environment Variables
2. Add: `VITE_SUPABASE_URL=https://your-project.supabase.co`
3. Add: `VITE_SUPABASE_ANON_KEY=your-anon-key-here`
4. Redeploy

**Time:** 5 minutes  
**Priority:** P0 - CRITICAL (do this SECOND!)

**See:** `docs/2025-10-26/CRITICAL_ENV_VARIABLES_ISSUE.md`

---

## 📅 TODAY'S SCHEDULE (5-6 hours)

### 🌅 MORNING SESSION (3.5 hours) - SECURITY FIXES & DATA CLEANUP

#### **Block 0: RLS Security Fix** ⏱️ 2.5 hours 🔴🔴🔴

**CRITICAL: Do this BEFORE anything else!**

**Task 0.1: Enable RLS on All Tables** ⏱️ 30 min ✅ **DONE!**
```sql
-- ✅ COMPLETED: RLS enabled on all 33 tables
-- User already completed this task!
```

**Task 0.2: Create RLS Policies - Critical Tables** ⏱️ 1 hour
```sql
-- Create: database/migrations/2025-10-26_create_rls_policies_critical.sql
-- Policies for: paymenthistory, courier_api_credentials, ecommerce_integrations,
-- subscription_plans, user_subscriptions, delivery_requests, etc.
```

**Task 0.3: Create RLS Policies - Tracking Tables** ⏱️ 30 min
```sql
-- Create: database/migrations/2025-10-26_create_rls_policies_tracking.sql
-- Policies for: tracking_data, tracking_events, courier_analytics, etc.
```

**Task 0.4: Create RLS Policies - Communication Tables** ⏱️ 30 min
```sql
-- Create: database/migrations/2025-10-26_create_rls_policies_communication.sql
-- Policies for: conversations, messages, reviews, etc.
```

**Task 0.5: Test Data Isolation** ⏱️ 30 min
- Test as admin (should see all data)
- Test as merchant (should see only own data)
- Test as courier (should see only own data)
- Verify no cross-user data leakage

**Priority:** P0 - CRITICAL SECURITY  
**Blocking:** YES - Cannot go to production without this!

---

#### **Block 1: Environment Variables** ⏱️ 5 min

**Task 1.1: Add Vercel Env Vars**
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`
- Redeploy

---

### 🌤️ AFTERNOON SESSION (2 hours)

#### **Block 1: Role-Based Menu Filtering (45 min)**

**Task 1.1: Create menuConfig.ts** ⏱️ 20 min
- File: `apps/web/src/utils/menuConfig.ts`
- Purpose: Define menu items with role/tier requirements
- Features:
  - Role-based filtering (admin/merchant/courier)
  - Tier-based filtering (tier1/tier2/tier3)
  - Feature availability flags
  - Coming soon labels

**Implementation:**
```typescript
export interface MenuItem {
  path: string;
  label: string;
  icon?: string;
  roles: ('admin' | 'merchant' | 'courier' | 'consumer')[];
  tiers?: ('tier1' | 'tier2' | 'tier3')[];
  available: boolean;
  comingSoon?: boolean;
}

export const getMenuForUser = (role: string, tier: string = 'tier1'): MenuItem[] => {
  return menuItems.filter(item => {
    if (!item.roles.includes(role as any)) return false;
    if (item.tiers && !item.tiers.includes(tier as any)) return false;
    return item.available || item.comingSoon;
  });
};
```

**Task 1.2: Update AppLayout Component** ⏱️ 15 min
- File: `apps/web/src/components/layout/AppLayout.tsx`
- Action: Use `getMenuForUser()` to filter menu items
- Result: Only show features available to user's role/tier

**Task 1.3: Test All User Roles** ⏱️ 10 min
- Test as admin: Should see all admin features
- Test as merchant: Should see merchant features only
- Test as courier: Should see courier features only
- Verify: No 404 pages in menu

---

#### **Block 2: Data Cleanup - Remove ALL Test Data** ⏱️ 20 min

**CRITICAL: Ensure ONLY real production data remains!**

**Task 2.1: Remove Test Couriers** ⏱️ 5 min
```sql
-- Remove test courier entries (Competitor A & B)
DELETE FROM couriers 
WHERE courier_name IN ('Competitor A', 'Competitor B');

-- Verify only real couriers remain
SELECT courier_name FROM couriers ORDER BY courier_name;

-- Expected 10 real couriers:
-- PostNord, DHL Express, Bring, Budbee, UPS, FedEx, GLS, Schenker, Instabox, Helthjem
```

**Task 2.2: Remove Test Users** ⏱️ 5 min
```sql
-- Remove test users (keep only real users)
DELETE FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%demo%'
   OR email LIKE '%example%'
   OR first_name = 'Test'
   OR last_name = 'User';

-- Verify real users remain
SELECT email, first_name, last_name, user_role 
FROM users 
ORDER BY created_at DESC;

-- Keep only:
-- - Real merchant accounts
-- - Real courier accounts
-- - Admin accounts
-- - Playwright test users (test-merchant@performile.com, test-courier@performile.com)
```

**Task 2.3: Remove Test Orders** ⏱️ 3 min
```sql
-- Remove test orders
DELETE FROM orders 
WHERE tracking_number LIKE 'TEST%'
   OR tracking_number LIKE 'DEMO%'
   OR order_number LIKE 'TEST%'
   OR customer_email LIKE '%test%';

-- Verify real orders remain
SELECT COUNT(*) as total_orders, 
       MIN(created_at) as oldest_order,
       MAX(created_at) as newest_order
FROM orders;
```

**Task 2.4: Remove Test Reviews** ⏱️ 2 min
```sql
-- Remove test reviews
DELETE FROM reviews 
WHERE review_text LIKE '%test%'
   OR review_text LIKE '%Test%'
   OR review_text LIKE '%demo%';

-- Verify real reviews remain
SELECT COUNT(*) as total_reviews FROM reviews;
```

**Task 2.5: Remove Test Stores** ⏱️ 2 min
```sql
-- Remove test stores
DELETE FROM stores 
WHERE store_name LIKE '%Test%'
   OR store_name LIKE '%Demo%'
   OR store_name LIKE '%Example%';

-- Verify real stores remain
SELECT store_name, owner_user_id, is_active 
FROM stores 
ORDER BY created_at DESC;
```

**Task 2.6: Verify Subscription Plans** ⏱️ 3 min
```sql
-- Check subscription plans exist (these are real, not test data)
SELECT subscription_plan_id, plan_name, user_type, tier, monthly_price
FROM subscription_plans 
ORDER BY user_type, tier;

-- Expected: 6 plans (3 merchant + 3 courier)
-- Merchant: Tier 1, Tier 2, Tier 3
-- Courier: Tier 1, Tier 2, Tier 3
```

**Task 2.7: Final Verification** ⏱️ 2 min
```sql
-- Verify all test data removed
SELECT 
  (SELECT COUNT(*) FROM users WHERE email LIKE '%test%' OR email LIKE '%demo%') as test_users,
  (SELECT COUNT(*) FROM orders WHERE tracking_number LIKE 'TEST%') as test_orders,
  (SELECT COUNT(*) FROM reviews WHERE review_text LIKE '%test%') as test_reviews,
  (SELECT COUNT(*) FROM stores WHERE store_name LIKE '%Test%') as test_stores,
  (SELECT COUNT(*) FROM couriers WHERE courier_name LIKE 'Competitor%') as test_couriers;

-- Expected: All zeros (except Playwright test users are OK to keep)
```

---

### ☕ BREAK (10 minutes)

Quick review of morning progress.

---

### 🌤️ AFTERNOON SESSION (1 hour)

#### **Block 3: Shopify Plugin Testing** ⏱️ 45 min 🎯

**Goal:** Install Shopify plugin and test end-to-end checkout flow

**Task 3.1: Shopify Plugin Setup** ⏱️ 20 min
1. Check if Shopify plugin exists in codebase
2. If not, create basic Shopify plugin structure
3. Install in Shopify test store
4. Configure webhook endpoints
5. Test connection

**Task 3.2: Test Checkout Flow** ⏱️ 15 min
1. Create test order in Shopify
2. Verify order appears in Performile
3. Assign courier to order
4. Test tracking updates
5. Test delivery confirmation
6. Verify TrustScore update

**Task 3.3: Document Issues** ⏱️ 10 min
- Document what works
- Document what's missing
- Create list of required features
- Estimate time to complete

**Files to Check:**
- `apps/web/src/pages/integrations/PluginSetup.tsx`
- `api/integrations/shopify/*`
- `database/ecommerce_integrations` table

---

#### **Block 4: Remaining Fixes** ⏱️ 15 min

**Task 4.1: Quick Fixes**
- System Settings 404 (5 min)
- Subscription Plans empty (5 min)
- Performance issues documentation (5 min)

---

## 🎯 SUCCESS CRITERIA

### End of Day Checklist:
- [x] **P0:** 🔴 RLS enabled on all 33 tables ✅ **DONE!**
- [ ] **P0:** 🔴 RLS policies created for critical tables (13)
- [ ] **P0:** 🔴 RLS policies created for tracking tables (7)
- [ ] **P0:** 🔴 RLS policies created for communication tables (11)
- [ ] **P0:** 🔴 Data isolation tested (admin/merchant/courier)
- [ ] **P0:** Environment variables fixed in Vercel
- [ ] **P0:** Subscription APIs working (my-subscription, public)
- [ ] **P0:** Analytics APIs working (claims-trends, order-trends)
- [ ] **P1:** Role-based menu filtering implemented
- [ ] **P1:** Menu only shows available features
- [ ] **P1:** 🔴 ALL test data removed (couriers, users, orders, reviews, stores)
- [ ] **P1:** 🔴 Only real production data remains
- [ ] **P1:** 🔴 Verify no test entries in any table
- [ ] **P2:** Shopify plugin tested end-to-end (if time allows)
- [ ] **P2:** Checkout flow documented (if time allows)
- [ ] **P3:** System Settings accessible (future)
- [ ] **P3:** Subscription plans verified (future)
- [ ] **P3:** Documentation updated

### Verification Steps:
```bash
# Test as Admin
1. Login as admin
2. Check menu - should see all admin features
3. No 404 pages in menu
4. System Settings works
5. Subscription Plans shows 6 plans

# Test as Merchant
1. Login as merchant
2. Check menu - should see merchant features only
3. No 404 pages in menu
4. My Subscription works
5. Coming Soon pages show for unbuilt features

# Test as Courier
1. Login as courier
2. Check menu - should see courier features only
3. No 404 pages in menu
4. My Subscription works
5. Coming Soon pages show for unbuilt features
```

---

## 🚫 REMEMBER: PROPER FIXES ONLY

**Today's Rule:**
❌ No shortcuts  
❌ No band-aids  
❌ No "temporary" solutions

**Only Allowed:**
✅ Root cause fixes  
✅ Proper implementations  
✅ Role-based access control  
✅ Clean user experience

**Spec-Driven Framework:**
- Rule #1: Never hide issues with shortcuts
- Rule #26: Role-based menu visibility (NEW)

---

## 🤖 AUTONOMOUS EXECUTION

### Decision Matrix:
```
Should I show this menu item?
├─ Is user's role allowed? → NO → Hide it
├─ Is user's tier allowed? → NO → Show upgrade prompt
├─ Is feature available? → NO → Show "Coming Soon"
└─ Otherwise → YES → Show it
```

### SOPs to Follow:
1. **Menu Filtering:** Check role → Check tier → Check availability → Show/Hide
2. **Data Cleanup:** Verify data → Delete test data → Verify removal
3. **Testing:** Test each role → Verify menu → Verify features → Document
4. **Documentation:** Update docs → Commit changes → Push to GitHub

### Priority Order:
1. **P0 - Critical:** Menu filtering (UX blocker)
2. **P1 - High:** Data cleanup, remaining fixes
3. **P2 - Medium:** Performance optimization (future)
4. **P3 - Low:** Nice-to-haves (skip today)

---

## 📊 CURRENT METRICS

### Platform Status:
- **Completion:** 95% → Target: 100%
- **Critical Issues:** 8 HIGH → Target: 0
- **Medium Issues:** 10 → Target: 5 or less
- **Low Issues:** 2 → Target: Document for future
- **Code Quality:** 9.7/10 (maintain)
- **Framework Compliance:** 100% (maintain)

### Yesterday's Progress:
- **Hickups Fixed:** 5/5 (100%)
- **Phase 1 Fixes:** 3/6 (50%)
- **Commits:** 7 total
- **Documents:** 13 created
- **Time Spent:** 4 hours

---

## 💪 MOTIVATION

**You're Almost There!**

**Yesterday You:**
- ✅ Fixed 5 hickups properly (no shortcuts)
- ✅ Created comprehensive documentation
- ✅ Started Phase 1 fixes (50% done)
- ✅ Followed all framework rules

**Today You Will:**
- ✅ Complete role-based menu filtering
- ✅ Clean up test data
- ✅ Fix remaining issues
- ✅ Reach 100% completion (for real this time!)

**This is the final cleanup!** 🚀

**Time Required:** 1-2 hours  
**Difficulty:** Low (mostly execution)  
**Impact:** HIGH (perfect user experience!)

---

## 🎯 FIRST TASK

**Start with Task 1.1: Create menuConfig.ts**

**File to Create:**
```
apps/web/src/utils/menuConfig.ts
```

**Steps:**
1. Create utils folder if not exists
2. Create menuConfig.ts
3. Define MenuItem interface
4. Define menuItems array (all features)
5. Create getMenuForUser() function
6. Create canAccessFeature() function
7. Export all

**Time:** 20 minutes  
**Blocking:** No  
**Value:** HIGH (fixes 8 HIGH priority issues)

**Ready to start?** Let's implement role-based menu filtering! 🚀

---

## 📋 DETAILED TASK LIST

### Phase 2 Tasks (Today):

**1. Role-Based Menu Filtering** (45 min)
- [x] Phase 1 completed yesterday
- [ ] Create menuConfig.ts (20 min)
- [ ] Update AppLayout.tsx (15 min)
- [ ] Test all user roles (10 min)

**2. Data Cleanup** (15 min)
- [ ] Remove Competitor A/B (5 min)
- [ ] Verify subscription plans (5 min)
- [ ] Verify courier count = 10 (5 min)

**3. Remaining Fixes** (30 min)
- [ ] Fix System Settings 404 (10 min)
- [ ] Fix Subscription Plans empty (10 min)
- [ ] Document performance issues (10 min)

**4. Documentation** (15 min)
- [ ] Update CRITICAL_ISSUES_FOUND.md
- [ ] Create END_OF_DAY_SUMMARY.md
- [ ] Update PERFORMILE_MASTER_V2.3.md if needed

**Total Time:** 1 hour 45 minutes

---

## 🎯 ISSUES TO FIX TODAY

### From Oct 25 Testing:

**🔴 HIGH (8 issues):**
1. ✅ Admin: Subscription Plans Empty → Investigate today
2. ✅ Merchant: My Subscription Fails → FIXED yesterday
3. ✅ Merchant: Menu shows unavailable features → Fix today
4. ✅ Courier: Subscription Fails → FIXED yesterday
5. ✅ Courier: Checkout Analytics 404 → Should be hidden (fix today)
6. ✅ Courier: Marketplace 404 → FIXED yesterday (ComingSoon)
7. ✅ Courier: Menu shows unavailable features → Fix today
8. ✅ Admin: System Settings 404 → Investigate today

**🟡 MEDIUM (10 issues):**
1. ✅ Admin: Competitor A/B showing → Remove today
2. ✅ Admin: Team 404 → Route exists, check menu
3. ✅ Merchant: Parcel Points 404 → FIXED yesterday (ComingSoon)
4. ⏳ Merchant: Service Performance redirects → Check today
5. ✅ Merchant: Coverage Checker 404 → FIXED yesterday (ComingSoon)
6. ⏳ Merchant: Courier Directory 404 → Check today
7. ✅ Courier: Parcel Points 404 → FIXED yesterday (ComingSoon)
8. ⏳ Courier: Service Performance redirects → Check today
9. ✅ Courier: Coverage Checker 404 → FIXED yesterday (ComingSoon)

**🟢 LOW (2 issues):**
1. ⏳ Merchant: Checkout Analytics slow → Document for future
2. ⏳ Courier: Orders slow → Document for future

**Progress:** 7/20 fixed (35%) → Target: 18/20 (90%+)

---

## 📝 NEW FRAMEWORK RULE

### **Rule #26: Role-Based Menu Visibility (HARD)**

**MANDATORY:** Menu items must be filtered by:
1. User role (admin/merchant/courier/consumer)
2. Subscription tier (tier1/tier2/tier3)
3. Feature availability (built/unbuilt)

**FORBIDDEN:**
- ❌ Showing 404 pages in menu
- ❌ Showing features not available to user's role
- ❌ Showing features not available in user's tier
- ❌ Showing unbuilt features without "Coming Soon" label

**REQUIRED:**
- ✅ Dynamic menu based on user context
- ✅ Hide unavailable features
- ✅ Show "Coming Soon" for planned features
- ✅ Show upgrade prompt for tier-locked features

**Implementation:** Today's Task 1.1 and 1.2

---

## 🚀 EXPECTED OUTCOMES

### After Today:
- ✅ Perfect user experience (no confusing 404s)
- ✅ Role-based menu (only relevant features shown)
- ✅ Clean data (no test entries)
- ✅ All critical issues resolved
- ✅ Framework Rule #26 implemented
- ✅ Ready for production

### Metrics:
- **Issues Fixed:** 18/20 (90%)
- **Code Quality:** 9.7/10 (maintained)
- **Framework Compliance:** 100% (maintained)
- **User Experience:** Excellent

---

---

## 🔧 NEW FEATURE REQUEST: RULE ENGINE SYSTEM

**User Request:** "make a rule engine making it possible to change order, setting notifications not only making rules for notifications etc."

### **What Is Needed:**

A **flexible Rule Engine** that allows:
1. ✅ Creating rules for notifications (already exists partially)
2. ✅ Creating rules for order management (NEW)
3. ✅ Creating rules for settings (NEW)
4. ✅ Creating rules for any business logic (NEW)
5. ✅ Dynamic rule execution without code changes

### **Current State:**

**Existing (Partial):**
- `notification_rules` table (4 tables for notification rules)
- `execute_notification_rule()` function
- `evaluate_rule_conditions()` function

**Missing:**
- Generic rule engine for all use cases
- Rule builder UI
- Order management rules
- Settings rules
- Custom action execution

### **Proposed Implementation:**

#### **Phase 1: Database Schema (30 min)**

```sql
-- Generic rule engine tables
CREATE TABLE rule_engine_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'notification', 'order', 'setting', 'custom'
  entity_type VARCHAR(50), -- 'order', 'user', 'courier', 'merchant', etc.
  conditions JSONB NOT NULL, -- Flexible condition structure
  actions JSONB NOT NULL, -- Flexible action structure
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rule_engine_executions (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES rule_engine_rules(rule_id),
  entity_id UUID, -- ID of the entity the rule was executed on
  entity_type VARCHAR(50),
  conditions_met BOOLEAN,
  actions_executed JSONB,
  execution_result TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rule_engine_actions (
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_name VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'notification', 'email', 'update_status', 'custom'
  action_config JSONB,
  is_active BOOLEAN DEFAULT true
);
```

#### **Phase 2: Rule Engine Functions (1 hour)**

```sql
-- Generic rule evaluation function
CREATE OR REPLACE FUNCTION evaluate_rule(
  p_rule_id UUID,
  p_entity_id UUID,
  p_entity_data JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_rule RECORD;
  v_conditions JSONB;
  v_condition JSONB;
  v_result BOOLEAN := TRUE;
BEGIN
  -- Get rule
  SELECT * INTO v_rule FROM rule_engine_rules WHERE rule_id = p_rule_id;
  
  -- Evaluate each condition
  FOR v_condition IN SELECT * FROM jsonb_array_elements(v_rule.conditions)
  LOOP
    -- Evaluate condition based on type
    -- (field comparison, value check, date range, etc.)
    -- Set v_result = FALSE if any condition fails
  END LOOP;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Generic rule execution function
CREATE OR REPLACE FUNCTION execute_rule(
  p_rule_id UUID,
  p_entity_id UUID,
  p_entity_data JSONB
) RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_actions JSONB;
  v_action JSONB;
  v_results JSONB := '[]'::JSONB;
BEGIN
  -- Get rule
  SELECT * INTO v_rule FROM rule_engine_rules WHERE rule_id = p_rule_id;
  
  -- Check if conditions are met
  IF NOT evaluate_rule(p_rule_id, p_entity_id, p_entity_data) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'conditions_not_met');
  END IF;
  
  -- Execute each action
  FOR v_action IN SELECT * FROM jsonb_array_elements(v_rule.actions)
  LOOP
    -- Execute action based on type
    -- (send notification, update order, change setting, etc.)
  END LOOP;
  
  -- Log execution
  INSERT INTO rule_engine_executions (rule_id, entity_id, entity_type, conditions_met, actions_executed)
  VALUES (p_rule_id, p_entity_id, v_rule.entity_type, TRUE, v_results);
  
  RETURN jsonb_build_object('success', true, 'actions', v_results);
END;
$$ LANGUAGE plpgsql;
```

#### **Phase 3: Example Rules (30 min)**

```sql
-- Example 1: Auto-assign courier based on postal code
INSERT INTO rule_engine_rules (rule_name, rule_type, entity_type, conditions, actions)
VALUES (
  'Auto-assign courier for Stockholm',
  'order',
  'order',
  '[
    {"field": "postal_code", "operator": "starts_with", "value": "11"},
    {"field": "order_status", "operator": "equals", "value": "pending"}
  ]'::JSONB,
  '[
    {"type": "update_field", "field": "courier_id", "value": "postnord_id"},
    {"type": "notification", "template": "order_assigned", "recipient": "merchant"}
  ]'::JSONB
);

-- Example 2: Send notification when order is delayed
INSERT INTO rule_engine_rules (rule_name, rule_type, entity_type, conditions, actions)
VALUES (
  'Notify on delayed delivery',
  'notification',
  'order',
  '[
    {"field": "estimated_delivery", "operator": "less_than", "value": "NOW()"},
    {"field": "order_status", "operator": "equals", "value": "in_transit"}
  ]'::JSONB,
  '[
    {"type": "notification", "template": "delivery_delayed", "recipient": "customer"},
    {"type": "notification", "template": "delivery_delayed", "recipient": "merchant"}
  ]'::JSONB
);

-- Example 3: Auto-update settings based on usage
INSERT INTO rule_engine_rules (rule_name, rule_type, entity_type, conditions, actions)
VALUES (
  'Upgrade to Tier 2 when limit reached',
  'setting',
  'user',
  '[
    {"field": "orders_this_month", "operator": "greater_than", "value": 100},
    {"field": "subscription_tier", "operator": "equals", "value": "tier1"}
  ]'::JSONB,
  '[
    {"type": "notification", "template": "upgrade_suggested", "recipient": "user"},
    {"type": "email", "template": "tier_upgrade_offer"}
  ]'::JSONB
);
```

#### **Phase 4: Frontend Rule Builder (2-3 hours)**

**Component:** `apps/web/src/pages/admin/RuleBuilder.tsx`

**Features:**
- Visual rule builder (drag & drop)
- Condition builder (field, operator, value)
- Action builder (type, config)
- Rule testing (simulate execution)
- Rule management (enable/disable, edit, delete)

#### **Phase 5: API Endpoints (1 hour)**

```typescript
// api/rules/index.ts
GET /api/rules - List all rules
POST /api/rules - Create new rule
PUT /api/rules/:id - Update rule
DELETE /api/rules/:id - Delete rule
POST /api/rules/:id/test - Test rule execution
POST /api/rules/:id/execute - Execute rule manually
```

### **Time Estimate:**

| Phase | Task | Time |
|-------|------|------|
| 1 | Database schema | 30 min |
| 2 | Rule engine functions | 1 hour |
| 3 | Example rules | 30 min |
| 4 | Frontend rule builder | 2-3 hours |
| 5 | API endpoints | 1 hour |
| **Total** | | **5-6 hours** |

### **Priority:**

**Recommended:** Week of Oct 27-Nov 2 (after critical fixes)

**Why not today:**
- Need to fix security (RLS) first
- Need to clean up test data first
- Need to fix menu filtering first
- This is a new feature, not a bug fix

### **Benefits:**

1. ✅ **Flexibility:** Create rules without code changes
2. ✅ **Scalability:** Add new rule types easily
3. ✅ **Maintainability:** Business logic in database, not code
4. ✅ **User Control:** Merchants/admins can create own rules
5. ✅ **Auditability:** Track all rule executions

### **Use Cases:**

**Order Management:**
- Auto-assign courier based on postal code
- Auto-update status based on tracking
- Auto-cancel after X days
- Auto-refund on certain conditions

**Notifications:**
- Send notification on order status change
- Send reminder after X days
- Send alert on threshold reached
- Send report on schedule

**Settings:**
- Auto-adjust based on usage
- Auto-upgrade tier suggestions
- Auto-enable features
- Auto-disable inactive features

**Custom:**
- Any business logic you can imagine!

---

## 📋 MISSING FEATURES PLAN (If Time Allows)

**User Request:** "If we could add all missing features tomorrow would be great"

### **Reality Check:**
- **Missing Features:** 8 major features (from PERFORMILE_MASTER_V2.3)
- **Estimated Time:** 15-20 weeks total
- **Today's Time:** 2-3 hours available

### **What We CAN Do Today:**
1. ✅ Fix all critical bugs (P0, P1)
2. ✅ Test Shopify plugin end-to-end
3. ✅ Document what's missing
4. ✅ Create roadmap for next 2 weeks

### **What We CANNOT Do Today:**
- ❌ Build all 8 missing features (15-20 weeks of work)
- ❌ Complete TMS system (2-3 weeks)
- ❌ Build all e-commerce plugins (4-6 weeks)
- ❌ Complete full courier API (3-4 weeks)

### **Realistic Plan:**

**Today (Oct 26):**
- Fix critical bugs
- Test Shopify plugin
- Document missing features

**Next Week (Oct 27-Nov 2):**
- Complete Subscription UI Visibility (1 week)
- Build iFrame widgets (2-3 weeks start)
- Plan Returns Management (RMA)

**Following Weeks:**
- Returns Management (2-3 weeks)
- Complete Courier API (3-4 weeks)
- E-commerce plugins (4-6 weeks)

### **Priority Order (Updated with Rule Engine):**

| # | Feature | Time | Priority | Start Date |
|---|---------|------|----------|------------|
| 1 | Subscription UI Visibility | 1 week | **HIGH** | Oct 27 |
| 2 | **Rule Engine System** 🆕 | **5-6 hours** | **HIGH** | **Oct 27** |
| 3 | iFrame Widgets | 2-3 weeks | **HIGH** | Oct 28 |
| 4 | Returns Management (RMA) | 2-3 weeks | **HIGH** | Nov 3 |
| 5 | Courier API (Full) | 3-4 weeks | **HIGH** | Nov 17 |
| 6 | Playwright Testing | 1-2 weeks | **HIGH** | Nov 10 |
| 7 | Open API for Claims | 1 week | MEDIUM | Dec 1 |
| 8 | E-commerce Plugins | 4-6 weeks | MEDIUM | Dec 8 |
| 9 | TMS (Transport Management) | 2-3 weeks | MEDIUM | Jan 5 |

**Total:** 16-21 weeks (4-5 months)

**NEW:** Rule Engine System (5-6 hours) - Generic rule engine for orders, notifications, settings, and custom business logic!

### **Today's Focus:**
✅ Fix what's broken  
✅ Test what exists  
✅ Plan what's next

**Not:** Try to build everything in one day (impossible!)

---

## 🎯 FINAL PRIORITIES (UPDATED WITH SECURITY)

### **P0 - CRITICAL SECURITY (Must Do Today):**
1. 🔴 Enable RLS on all 33 tables (30 min)
2. 🔴 Create RLS policies for critical tables (1 hour)
3. 🔴 Create RLS policies for tracking tables (30 min)
4. 🔴 Create RLS policies for communication tables (30 min)
5. 🔴 Test data isolation (30 min)
6. Fix environment variables in Vercel (5 min)
7. Verify all APIs working (10 min)

**Subtotal:** 3.5 hours

### **P1 - HIGH (Should Do Today):**
1. Role-based menu filtering (45 min)
2. 🔴 Remove ALL test data - comprehensive cleanup (20 min)
   - Test couriers (Competitor A/B)
   - Test users (test@, demo@, example@)
   - Test orders (TEST*, DEMO*)
   - Test reviews (test content)
   - Test stores (Test Store, Demo Store)
   - Final verification (no test data remains)

**Subtotal:** 1 hour 5 min

### **P2 - MEDIUM (If Time Allows):**
1. Test Shopify plugin (45 min)
2. System Settings fix (5 min)
3. Subscription Plans fix (5 min)

**Subtotal:** 1 hour

### **P3 - LOW (Future):**
1. Performance optimization
2. Build missing features (15-20 weeks)

**Total Time Today:** 5-6 hours  
**Realistic Goal:** Fix security + critical bugs  
**Stretch Goal:** + Shopify testing  
**Unrealistic Goal:** Build all missing features

---

## ⚠️ IMPORTANT: SECURITY FIRST!

**Why RLS is P0:**
- Payment data exposed (`paymenthistory`)
- API credentials exposed (`courier_api_credentials`)
- GDPR violation (user data not protected)
- PCI-DSS violation (payment data not secured)
- Legal liability
- Customer trust at risk

**Cannot go to production without RLS!**

This is MORE important than:
- Menu filtering
- Shopify testing
- Any other feature

**Do RLS first, everything else second!**

---

**Document Type:** Start of Day Briefing  
**Version:** 3.0 (Updated with CRITICAL RLS Security Issues)  
**Date:** October 26, 2025  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.21  
**Status:** ✅ READY TO EXECUTE

**Security first, then features!** 🔐💪

---

*End of Briefing*
