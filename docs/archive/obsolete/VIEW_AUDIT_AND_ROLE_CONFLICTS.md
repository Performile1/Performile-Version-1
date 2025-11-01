# View Audit & Role Conflicts Report

## 🚨 Critical Issues Found

This document identifies role conflicts and data visibility issues across all views in the Performile platform.

**Audit Date:** October 12, 2025  
**Status:** 🔴 **CRITICAL - Immediate Action Required**

---

## Executive Summary

### Issues Identified

1. **❌ Admin-level data shown to all users** - Dashboard and Analytics showing platform-wide data
2. **❌ No role-based filtering** - Same data queries for all user types
3. **❌ Subscription limits not enforced** - Views don't check subscription tiers
4. **❌ Cross-role data leakage** - Merchants can potentially see other merchants' data
5. **❌ Missing role guards** - Many pages lack proper role validation

### Impact

- **Security Risk:** HIGH - Users can see data they shouldn't access
- **Privacy Risk:** HIGH - Cross-user data exposure
- **Business Risk:** MEDIUM - Subscription limits not enforced
- **User Experience:** MEDIUM - Confusing admin-level views for regular users

---

## 📊 Complete View Inventory

### Public Pages (No Authentication Required)

| Page | File | Current Access | Should Access | Status |
|------|------|----------------|---------------|--------|
| Login | `AuthPage.tsx` | ✅ Public | ✅ Public | ✅ OK |
| Reset Password | `ResetPassword.tsx` | ✅ Public | ✅ Public | ✅ OK |
| Public Review | `PublicReview.tsx` | ✅ Public | ✅ Public | ✅ OK |
| Tracking Page | `TrackingPage.tsx` | ✅ Public | ✅ Public | ✅ OK |
| Pricing | `Pricing.tsx` | ✅ Public | ✅ Public | ✅ OK |

### Shared Pages (All Authenticated Users)

| Page | File | Current Data | Issue | Fix Required |
|------|------|--------------|-------|--------------|
| **Dashboard** | `Dashboard.tsx` | 🔴 Platform-wide stats | Shows ALL couriers, ALL orders | Filter by user role |
| **Analytics** | `Analytics.tsx` | 🔴 Admin analytics | Uses `/admin/analytics` for all | Role-specific endpoints |
| **Orders** | `Orders.tsx` | 🟡 Mixed | Needs role filtering | Filter by ownership |
| **TrustScores** | `TrustScores.tsx` | 🟢 Public data | OK (public ratings) | ✅ OK |

### Merchant-Only Pages

| Page | File | Current Access | Data Scope | Issue | Fix |
|------|------|----------------|------------|-------|-----|
| **Merchant Settings** | `MerchantSettings.tsx` | ✅ Merchant only | Own data | None | ✅ OK |
| **Shops Settings** | `ShopsSettings.tsx` | ✅ Merchant only | Own shops | None | ✅ OK |
| **Courier Selection** | `MerchantCourierSettings.tsx` | ✅ Merchant only | Selected couriers | None | ✅ OK |
| **Tracking Settings** | `TrackingPageSettings.tsx` | ✅ Merchant only | Own settings | None | ✅ OK |
| **Courier Preferences** | `CourierPreferences.tsx` | ⚠️ Merchant only | All couriers | Should show selected only | Filter |
| **E-commerce Integrations** | `EcommerceIntegrations.tsx` | ✅ Merchant only | Own integrations | None | ✅ OK |
| **Team Management** | `TeamManagement.tsx` | ⚠️ Merchant only | All teams? | Needs filtering | Filter by merchant |
| **Billing Portal** | `BillingPortal.tsx` | ✅ Merchant only | Own billing | None | ✅ OK |
| **Claims Page** | `ClaimsPage.tsx` | ⚠️ Merchant only | All claims? | Needs filtering | Filter by merchant |

### Courier-Only Pages

| Page | File | Current Access | Data Scope | Issue | Fix |
|------|------|----------------|------------|-------|-----|
| **Courier Settings** | `CourierSettings.tsx` | ✅ Courier only | Own data | None | ✅ OK |
| **Courier Directory** | `CourierDirectory.tsx` | ⚠️ Courier only | All couriers? | Should show own only | Filter |

### Consumer-Only Pages

| Page | File | Current Access | Data Scope | Issue | Fix |
|------|------|----------------|------------|-------|-----|
| **Consumer Settings** | `ConsumerSettings.tsx` | ✅ Consumer only | Own data | None | ✅ OK |

### Admin-Only Pages

| Page | File | Current Access | Data Scope | Issue | Fix |
|------|------|----------------|------------|-------|-----|
| **Admin Settings** | `AdminSettings.tsx` | ✅ Admin only | All data | None | ✅ OK |
| **Manage Merchants** | `ManageMerchants.tsx` | ✅ Admin only | All merchants | None | ✅ OK |
| **Manage Couriers** | `ManageCouriers.tsx` | ✅ Admin only | All couriers | None | ✅ OK |
| **Manage Stores** | `ManageStores.tsx` | ✅ Admin only | All stores | None | ✅ OK |
| **Manage Carriers** | `ManageCarriers.tsx` | ✅ Admin only | All carriers | None | ✅ OK |
| **Subscription Management** | `SubscriptionManagement.tsx` | ✅ Admin only | All subscriptions | None | ✅ OK |
| **Review Builder** | `ReviewBuilder.tsx` | ✅ Admin only | Platform-wide | None | ✅ OK |

---

## 🔴 Critical Issues Detailed

### Issue #1: Dashboard Shows Platform-Wide Data to All Users

**File:** `Dashboard.tsx`  
**Line:** 82-89

```typescript
// CURRENT (WRONG):
const { data: dashboardData } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const response = await apiClient.get('/trustscore/dashboard');
    return response.data.data;
  },
});
```

**Problem:**
- All users see the same dashboard with platform-wide statistics
- Shows total_couriers, total_orders_processed, total_reviews for ENTIRE platform
- Merchants see data from other merchants
- Couriers see data from other couriers

**Should Be:**
```typescript
// CORRECT:
const { data: dashboardData } = useQuery({
  queryKey: ['dashboard-stats', user?.user_role, user?.user_id],
  queryFn: async () => {
    switch (user?.user_role) {
      case 'merchant':
        return apiClient.get('/merchant/dashboard');
      case 'courier':
        return apiClient.get('/courier/dashboard');
      case 'consumer':
        return apiClient.get('/consumer/dashboard');
      case 'admin':
        return apiClient.get('/admin/dashboard');
      default:
        throw new Error('Invalid role');
    }
  },
});
```

---

### Issue #2: Analytics Uses Admin Endpoint for All Users

**File:** `Analytics.tsx`  
**Line:** 76-88

```typescript
// CURRENT (WRONG):
if (user?.user_role === 'admin') {
  const response = await apiClient.get('/admin/analytics', {
    params: { compare: 'true', ... }
  });
  return response.data;
}
// Other roles would use different endpoints
return null; // ❌ Returns null for non-admins!
```

**Problem:**
- Only admins get analytics data
- Other roles get null/empty data
- No merchant-specific or courier-specific analytics

**Should Be:**
```typescript
// CORRECT:
switch (user?.user_role) {
  case 'merchant':
    return apiClient.get('/merchant/analytics', { params: filters });
  case 'courier':
    return apiClient.get('/courier/analytics', { params: filters });
  case 'admin':
    return apiClient.get('/admin/analytics', { params: filters });
  default:
    throw new Error('Analytics not available for this role');
}
```

---

### Issue #3: Orders Page Shows All Orders

**File:** `Orders.tsx`  
**Assumption:** Likely shows all orders without filtering

**Problem:**
- Merchants might see orders from other merchants
- Couriers might see deliveries from other couriers
- No role-based filtering

**Should Be:**
- Merchants: Only orders from their shops
- Couriers: Only their assigned deliveries
- Consumers: Only their own orders
- Admin: All orders (with filters)

---

### Issue #4: Team Management Not Filtered

**File:** `TeamManagement.tsx`  
**Problem:**
- Might show teams from all merchants/couriers
- No merchant_id or courier_id filtering

**Should Be:**
- Filter by current user's merchant_id or courier_id
- Only show team members belonging to current user

---

### Issue #5: Claims Page Not Filtered

**File:** `ClaimsPage.tsx`  
**Problem:**
- Might show claims from all users
- No ownership filtering

**Should Be:**
- Merchants: Claims related to their orders
- Couriers: Claims related to their deliveries
- Consumers: Their own claims
- Admin: All claims

---

## 📋 Data Visibility Matrix (What Each Role Should See)

### Dashboard

| Data Point | Merchant | Courier | Consumer | Admin |
|------------|----------|---------|----------|-------|
| Total Orders | Own shops only | Own deliveries | Own orders | All orders |
| Revenue | Own revenue | Own earnings | N/A | Platform revenue |
| Couriers | Selected couriers | Own company | All (browse) | All couriers |
| Performance | Own shops | Own TrustScore | N/A | Platform-wide |
| Recent Activity | Own orders | Own deliveries | Own orders | All activity |

### Analytics

| Metric | Merchant | Courier | Consumer | Admin |
|--------|----------|---------|----------|-------|
| Order Volume | Own shops | Own deliveries | Own orders | Platform-wide |
| Revenue Trends | Own revenue | Own earnings | N/A | Platform revenue |
| Courier Performance | Selected couriers | Own performance | N/A | All couriers |
| Geographic Data | Own delivery areas | Own service areas | N/A | All regions |
| Time Trends | Own data | Own data | N/A | Platform-wide |

### Orders

| View | Merchant | Courier | Consumer | Admin |
|------|----------|---------|----------|-------|
| Order List | Own shops' orders | Assigned deliveries | Own orders | All orders |
| Order Details | Own orders | Assigned deliveries | Own orders | All orders |
| Order Status | Can update own | Can update assigned | View only | Can update all |
| Filters | Own data only | Own data only | Own data only | All data |

### Team Management

| Feature | Merchant | Courier | Consumer | Admin |
|---------|----------|---------|----------|-------|
| Team List | Own team | Own team | N/A | All teams |
| Add Member | Own team | Own team | N/A | Any team |
| Remove Member | Own team | Own team | N/A | Any team |
| Permissions | Own team | Own team | N/A | Any team |

---

## 🔧 Implementation Fixes Required

### Priority 1: Critical (Immediate)

1. **Dashboard Role-Based Data**
   - Create separate dashboard endpoints per role
   - Filter all queries by user_id/merchant_id/courier_id
   - Remove platform-wide statistics for non-admins

2. **Analytics Role-Based Filtering**
   - Create merchant analytics endpoint
   - Create courier analytics endpoint
   - Remove admin endpoint access for non-admins

3. **Orders Filtering**
   - Add WHERE clause filtering by ownership
   - Merchant: `WHERE store_id IN (SELECT store_id FROM stores WHERE owner_user_id = $1)`
   - Courier: `WHERE courier_id = $1`
   - Consumer: `WHERE consumer_id = $1`

### Priority 2: High (This Week)

4. **Team Management Filtering**
   - Filter teams by merchant_id or courier_id
   - Add ownership validation on all CRUD operations

5. **Claims Filtering**
   - Filter by order ownership
   - Validate user can access claim

6. **Courier Directory**
   - Couriers should only manage own profile
   - Not see other couriers' internal data

### Priority 3: Medium (Next Week)

7. **Subscription Enforcement**
   - Add subscription checks to all data queries
   - Limit results based on subscription tier
   - Show upgrade prompts when limits reached

8. **API Endpoint Separation**
   - Create role-specific API endpoints
   - Remove shared endpoints that return different data

---

## 🛡️ Security Checklist

### Backend (API) Security

- [ ] All endpoints validate user role
- [ ] All queries filter by user ownership
- [ ] Database Row Level Security (RLS) enabled
- [ ] No cross-user data leakage
- [ ] Subscription limits enforced at database level
- [ ] Audit logging for all data access

### Frontend Security

- [ ] Role-based component rendering
- [ ] Hide UI elements for unauthorized features
- [ ] Client-side role validation (UX only)
- [ ] Graceful error handling for 403 errors
- [ ] No sensitive data in client state
- [ ] Proper loading states

### Database Security

- [ ] RLS policies per table
- [ ] User can only SELECT own data
- [ ] User can only UPDATE own data
- [ ] User can only DELETE own data
- [ ] Admin bypass policies in place
- [ ] Audit triggers on sensitive tables

---

## 📝 Implementation Plan

### Week 1: Critical Fixes

**Day 1-2: Dashboard**
- [ ] Create `/api/merchant/dashboard` endpoint
- [ ] Create `/api/courier/dashboard` endpoint
- [ ] Create `/api/consumer/dashboard` endpoint
- [ ] Update Dashboard.tsx to use role-specific endpoints
- [ ] Test with each role

**Day 3-4: Analytics**
- [ ] Create `/api/merchant/analytics` endpoint
- [ ] Create `/api/courier/analytics` endpoint
- [ ] Update Analytics.tsx to use role-specific endpoints
- [ ] Add subscription-based feature gating
- [ ] Test with each role

**Day 5: Orders**
- [ ] Add role-based filtering to Orders API
- [ ] Update Orders.tsx to show only owned orders
- [ ] Test with each role

### Week 2: High Priority Fixes

**Day 1-2: Team Management**
- [ ] Add merchant_id/courier_id filtering
- [ ] Update TeamManagement.tsx
- [ ] Test team isolation

**Day 3-4: Claims**
- [ ] Add ownership filtering to Claims API
- [ ] Update ClaimsPage.tsx
- [ ] Test claim access control

**Day 5: Testing**
- [ ] End-to-end testing with all roles
- [ ] Security audit
- [ ] Performance testing

### Week 3: Subscription Enforcement

- [ ] Add subscription checks to all endpoints
- [ ] Implement usage tracking
- [ ] Add upgrade prompts
- [ ] Test subscription limits

---

## 🧪 Testing Scenarios

### Test Case 1: Merchant Data Isolation

```
Given: Two merchants (Merchant A and Merchant B)
When: Merchant A logs in and views Dashboard
Then: Should only see Merchant A's shops, orders, and analytics
And: Should NOT see any data from Merchant B
```

### Test Case 2: Courier Data Isolation

```
Given: Two couriers (Courier A and Courier B)
When: Courier A logs in and views Dashboard
Then: Should only see Courier A's deliveries and performance
And: Should NOT see any data from Courier B
```

### Test Case 3: Consumer Data Isolation

```
Given: Two consumers (Consumer A and Consumer B)
When: Consumer A logs in and views Orders
Then: Should only see Consumer A's orders
And: Should NOT see any orders from Consumer B
```

### Test Case 4: Admin Full Access

```
Given: Admin user
When: Admin logs in and views Dashboard
Then: Should see platform-wide statistics
And: Should see all merchants, couriers, and consumers
And: Should have access to all data
```

### Test Case 5: Subscription Limits

```
Given: Merchant with Free tier (2 couriers max)
When: Merchant tries to add 3rd courier
Then: Should show error message
And: Should prompt to upgrade subscription
And: Should NOT allow adding 3rd courier
```

---

## 📊 Current vs. Desired State

### Current State (WRONG)

```
┌─────────────┐
│   Dashboard │ ──────┐
└─────────────┘       │
                      ├──> /api/trustscore/dashboard
┌─────────────┐       │    (Returns ALL platform data)
│  Analytics  │ ──────┤
└─────────────┘       │
                      │
┌─────────────┐       │
│   Orders    │ ──────┘
└─────────────┘

❌ Same endpoint for all roles
❌ No filtering by user
❌ Platform-wide data exposed
```

### Desired State (CORRECT)

```
┌─────────────┐
│  Merchant   │ ──> /api/merchant/dashboard ──> Own shops data
└─────────────┘

┌─────────────┐
│   Courier   │ ──> /api/courier/dashboard ──> Own deliveries
└─────────────┘

┌─────────────┐
│  Consumer   │ ──> /api/consumer/dashboard ──> Own orders
└─────────────┘

┌─────────────┐
│    Admin    │ ──> /api/admin/dashboard ──> Platform-wide
└─────────────┘

✅ Role-specific endpoints
✅ Filtered by ownership
✅ Proper data isolation
```

---

## 🚀 Quick Wins (Can Implement Today)

### 1. Add Role Check to Dashboard

```typescript
// In Dashboard.tsx
const getDashboardEndpoint = () => {
  switch (user?.user_role) {
    case 'merchant': return '/merchant/dashboard';
    case 'courier': return '/courier/dashboard';
    case 'consumer': return '/consumer/dashboard';
    case 'admin': return '/admin/dashboard';
    default: throw new Error('Invalid role');
  }
};
```

### 2. Add Ownership Filter to Orders

```typescript
// In Orders API
const getOrders = async (userId: string, userRole: string) => {
  let query = 'SELECT * FROM orders';
  
  switch (userRole) {
    case 'merchant':
      query += ' WHERE store_id IN (SELECT store_id FROM stores WHERE owner_user_id = $1)';
      break;
    case 'courier':
      query += ' WHERE courier_id = $1';
      break;
    case 'consumer':
      query += ' WHERE consumer_id = $1';
      break;
    case 'admin':
      // No filter for admin
      break;
  }
  
  return db.query(query, [userId]);
};
```

### 3. Hide Admin Features from Non-Admins

```typescript
// In any component
{user?.user_role === 'admin' && (
  <AdminOnlyFeature />
)}
```

---

## 📞 Support & Questions

**Priority:** 🔴 CRITICAL  
**Estimated Fix Time:** 2-3 weeks  
**Risk if Not Fixed:** HIGH - Security breach, data leakage

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Next Review:** After fixes implemented
