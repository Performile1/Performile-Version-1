# 📅 Development Plan - Week of Oct 14-20, 2025

**Start Date:** October 14, 2025  
**End Date:** October 20, 2025  
**Focus:** Testing, Security, Bug Fixes

---

## 🎯 TODAY (Monday, Oct 14)

### Morning Session (2-3 hours)

#### 1. RLS Testing - Orders Table ⚡ **CRITICAL**
**Time:** 1.5 hours

**Tasks:**
- [ ] Create test user accounts (admin, merchant, courier, consumer)
- [ ] Run RLS test queries from DATA_LEAKAGE_PREVENTION.md
- [ ] Document actual vs expected results
- [ ] Fix any data leakage found

**Test Script:**
```sql
-- Get test user IDs first
SELECT user_id, email, user_role FROM users 
WHERE email IN (
  'admin@performile.com',
  'merchant@test.com', 
  'courier@test.com',
  'consumer@test.com'
);

-- Test 1: Admin sees all
SET app.user_id = '<admin-uuid>';
SET app.user_role = 'admin';
SELECT COUNT(*) as admin_count FROM orders;

-- Test 2: Merchant sees only own stores
SET app.user_id = '<merchant-uuid>';
SET app.user_role = 'merchant';
SELECT COUNT(*) as merchant_count FROM orders;

-- Test 3: Courier sees only assigned
SET app.user_id = '<courier-uuid>';
SET app.user_role = 'courier';
SELECT COUNT(*) as courier_count FROM orders;

-- Test 4: Consumer sees only own email
SET app.user_id = '<consumer-uuid>';
SET app.user_role = 'consumer';
SELECT COUNT(*) as consumer_count FROM orders;
```

**Success Criteria:**
- ✅ Each role sees only authorized data
- ✅ No SQL errors
- ✅ Results documented

---

#### 2. Verify Orders Page RLS ⚡ **CRITICAL**
**Time:** 1 hour

**Tasks:**
- [ ] Logout completely (clear localStorage)
- [ ] Login as merchant
- [ ] Check Orders page - should see only own store orders
- [ ] Login as courier
- [ ] Check Orders page - should see only assigned orders
- [ ] Login as admin
- [ ] Check Orders page - should see all orders

**Document Results:**
```markdown
## RLS Verification Results

### Merchant Test
- User: merchant@test.com
- Expected: Orders from own stores only
- Actual: [FILL IN]
- Status: [PASS/FAIL]

### Courier Test
- User: courier@test.com
- Expected: Orders assigned to courier only
- Actual: [FILL IN]
- Status: [PASS/FAIL]

### Admin Test
- User: admin@performile.com
- Expected: All orders
- Actual: [FILL IN]
- Status: [PASS/FAIL]
```

---

### Afternoon Session (2-3 hours)

#### 3. Setup Testing Infrastructure 🧪
**Time:** 2 hours

**Tasks:**
- [ ] Install testing dependencies
- [ ] Configure Jest
- [ ] Create test directory structure
- [ ] Write first test (authStore)
- [ ] Verify tests run

**Commands:**
```bash
# Install dependencies
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event

# Initialize Jest config
npx ts-jest config:init

# Create test directories
mkdir -p frontend/src/__tests__
mkdir -p frontend/src/store/__tests__
mkdir -p frontend/api/__tests__

# Run tests
npm test
```

**First Test:**
```typescript
// frontend/src/store/__tests__/authStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().clearAuth();
  });

  it('should set user on login', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setUser({
        user_id: '123',
        email: 'test@test.com',
        role: 'merchant'
      });
    });

    expect(result.current.user).toEqual({
      user_id: '123',
      email: 'test@test.com',
      role: 'merchant'
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should clear user on logout', () => {
    const { result } = renderHook(() => useAuthStore());
    
    // Set user first
    act(() => {
      result.current.setUser({
        user_id: '123',
        email: 'test@test.com',
        role: 'merchant'
      });
    });

    // Then logout
    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

---

#### 4. Document Today's Findings 📝
**Time:** 30 minutes

**Tasks:**
- [ ] Update TODAYS_ACCOMPLISHMENTS.md
- [ ] Document RLS test results
- [ ] Note any issues found
- [ ] List tomorrow's priorities

---

## 📅 TUESDAY (Oct 15)

### Focus: Fix Critical Bugs + More Testing

#### Morning (2-3 hours)
1. **Fix SessionExpiredModal** (2 hours)
   - Debug render error in Sentry
   - Simplify modal component
   - Test in isolation
   - Re-enable if working

2. **Fix 401 Errors** (1 hour)
   - Test `/api/tracking/summary`
   - Test `/api/claims`
   - Test `/api/admin/subscriptions`
   - Fix authentication middleware

#### Afternoon (2-3 hours)
3. **Write API Tests** (2 hours)
   - Orders API tests
   - Auth API tests
   - RLS helper tests

4. **Test Other Tables RLS** (1 hour)
   - Reviews table
   - Claims table
   - Users table

---

## 📅 WEDNESDAY (Oct 16)

### Focus: Code Quality + Testing

#### Morning (2-3 hours)
1. **Centralize DB Pool** (2 hours)
   - Create pool middleware
   - Update 10 high-traffic endpoints
   - Test for connection leaks

2. **Standardize Error Handling** (1 hour)
   - Create error utility
   - Update 5 endpoints
   - Test error responses

#### Afternoon (2-3 hours)
3. **Write More Tests** (2 hours)
   - Component tests
   - Integration tests
   - Target: 30% coverage

4. **Code Review** (1 hour)
   - Review changes
   - Update documentation
   - Commit progress

---

## 📅 THURSDAY (Oct 17)

### Focus: Subscription Limits + Features

#### Morning (2-3 hours)
1. **Implement Subscription Limits** (2.5 hours)
   - Add limit checks to order creation
   - Add limit checks to email sending
   - Test limit enforcement
   - Add upgrade prompts

#### Afternoon (2-3 hours)
2. **Usage Dashboard** (2 hours)
   - Create usage tracking component
   - Show current usage vs limits
   - Add progress bars
   - Test with different tiers

3. **Write Tests** (1 hour)
   - Subscription limit tests
   - Usage tracking tests

---

## 📅 FRIDAY (Oct 18)

### Focus: Missing Features + Testing

#### Morning (2-3 hours)
1. **Implement Missing Endpoints** (2 hours)
   - `/api/courier/checkout-analytics`
   - Test endpoint
   - Document API

2. **Notification System** (1 hour)
   - Plan notification architecture
   - Create database tables
   - Write migration

#### Afternoon (2-3 hours)
3. **Write More Tests** (2 hours)
   - E2E tests for critical flows
   - Target: 40% coverage

4. **Weekly Review** (1 hour)
   - Review week's progress
   - Update documentation
   - Plan next week

---

## 📅 WEEKEND (Optional)

### Saturday (2-3 hours)
- Review all documentation
- Test application manually
- Fix any bugs found
- Prepare for next week

### Sunday (Rest)
- No coding
- Review progress mentally
- Plan Monday priorities

---

## 📊 WEEK SUCCESS METRICS

### By End of Week (Oct 20):
- [ ] RLS policies tested on all tables
- [ ] Zero data leakage confirmed
- [ ] SessionExpiredModal fixed
- [ ] 401 errors resolved
- [ ] Test infrastructure setup complete
- [ ] 30-40% test coverage achieved
- [ ] Subscription limits enforced
- [ ] DB pool centralized (10+ files)
- [ ] Error handling standardized (5+ files)
- [ ] Missing endpoints implemented

---

## 🎯 DAILY CHECKLIST

### Every Morning:
- [ ] Review yesterday's progress
- [ ] Check Vercel logs for errors
- [ ] Check Sentry for new issues
- [ ] Plan today's tasks (2-3 priorities)

### Every Afternoon:
- [ ] Commit progress
- [ ] Update documentation
- [ ] Test changes manually
- [ ] Note blockers/issues

### Every Evening:
- [ ] Push to GitHub
- [ ] Update TODAYS_ACCOMPLISHMENTS.md
- [ ] Plan tomorrow's priorities
- [ ] Review Vercel deployment

---

## 🚨 BLOCKERS & ESCALATION

### If Blocked:
1. Document the blocker
2. Try alternative approach
3. Search documentation
4. Ask for help if stuck > 30 min

### Critical Issues:
- Data leakage found → Stop and fix immediately
- Production down → Rollback and investigate
- Security vulnerability → Patch and deploy ASAP

---

## 📝 PROGRESS TRACKING

### Daily Updates:
Update this section each day with actual progress

#### Monday Oct 14 ✅
- [ ] RLS testing completed
- [ ] Orders page verified
- [ ] Test infrastructure setup
- [ ] First tests written
- **Coverage:** __%

#### Tuesday Oct 15 ✅
- [x] SessionExpiredModal fixed
- [x] 401 errors resolved (created /api/claims and /api/admin/subscriptions)
- [x] API tests written (auth, orders, RLS policies)
- [x] Other tables RLS tested (reviews, claims, users)
- [x] Test infrastructure setup (Jest config, test docs)
- **Coverage:** TBD (run `npm run test:coverage`)

#### Wednesday Oct 16 ✅
- [x] DB pool centralized (created dbHelpers.ts with 300+ lines)
- [x] Error handling standardized (created errorHandler.ts with 400+ lines)
- [x] Pool monitoring middleware created
- [x] Refactoring guide and examples created
- [x] Server integration completed
- **Coverage:** TBD (utilities ready for testing)

#### Thursday Oct 17 ✅
- [x] Subscription limits implemented (backend utilities + middleware)
- [x] Usage tracking system created (API endpoints)
- [x] Usage dashboard created (frontend component)
- [x] Integrated into existing BillingPortal page
- **Coverage:** TBD (ready for testing)

#### Friday Oct 18
- [ ] Missing endpoints implemented
- [ ] Notification system planned
- [ ] E2E tests written
- [ ] Weekly review completed
- **Coverage:** __%

---

## 🎓 LEARNING GOALS

### This Week Learn:
- [ ] Jest testing framework
- [ ] React Testing Library
- [ ] RLS policy testing
- [ ] PostgreSQL session variables
- [ ] Subscription limit patterns

---

## 📚 RESOURCES

### Documentation:
- AUDIT_OCT_14_2025.md - Full audit
- TESTING_STRATEGY.md - Testing guide
- DATA_LEAKAGE_PREVENTION.md - Security testing
- PROJECT_CONSTITUTION.md - Standards

### Tools:
- Jest docs: https://jestjs.io/
- RTL docs: https://testing-library.com/react
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## 💡 TIPS FOR SUCCESS

1. **Start Small:** Don't try to do everything at once
2. **Test Often:** Test after every change
3. **Document Everything:** Future you will thank you
4. **Take Breaks:** 25 min work, 5 min break (Pomodoro)
5. **Ask for Help:** Don't stay stuck for hours
6. **Celebrate Wins:** Each test passing is progress!

---

## 🔧 PENDING CONFIGURATION

### Vercel Environment Variables (To Add Later):

**PostHog Analytics:**
```
VITE_ENABLE_ANALYTICS=true
VITE_POSTHOG_KEY=your_posthog_project_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

**Note:** PostHog is currently disabled by default to prevent console errors. You must explicitly enable it with `VITE_ENABLE_ANALYTICS=true` along with a valid PostHog key.

**Steps to Enable:**
1. Create PostHog account at https://posthog.com
2. Create a new project
3. Copy the project API key
4. Add to Vercel → Project Settings → Environment Variables:
   - `VITE_ENABLE_ANALYTICS=true`
   - `VITE_POSTHOG_KEY=your_key_here`
   - `VITE_POSTHOG_HOST=https://us.i.posthog.com`
5. Redeploy the application

---

**Status:** Ready to Start  
**Next Update:** End of Day Oct 14  
**Owner:** You  
**Priority:** HIGH 🔥
