# RLS API Integration Status

**Last Updated:** October 12, 2025, 5:10 PM  
**Status:** In Progress (33% Complete)

---

## 📊 Progress Overview

| Component | Status | Notes |
|-----------|--------|-------|
| **RLS Helper Module** | ✅ Complete | `api/lib/rls.ts` created |
| **Merchant Dashboard** | ✅ Complete | Using `withRLS()` |
| **Merchant Analytics** | 🟡 In Progress | Partially updated |
| **Courier Dashboard** | ⏳ Pending | Needs update |
| **Courier Analytics** | ⏳ Pending | Needs update |
| **Consumer Dashboard** | ⏳ Pending | Needs update |
| **Admin Dashboard** | ⏳ Pending | Needs update |
| **Admin Analytics** | ⏳ Pending | Needs update |
| **Orders API** | ⏳ Pending | Needs update |
| **Claims API** | ⏳ Pending | Needs update |

---

## ✅ Completed Work

### 1. RLS Helper Module (`api/lib/rls.ts`)

**Created:** Complete utility module with:
- ✅ `withRLS()` - Execute queries with RLS context
- ✅ `queryWithRLS()` - Simple query wrapper
- ✅ `transactionWithRLS()` - Transaction support
- ✅ `verifyRLSSetup()` - Verify database setup
- ✅ `getRLSContext()` - Debug helper

**Usage Example:**
```typescript
import { withRLS } from '../lib/rls';

const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
  // All queries here are automatically filtered by RLS
  return await client.query('SELECT * FROM Stores');
});
```

### 2. Merchant Dashboard (`api/merchant/dashboard.ts`)

**Status:** ✅ Complete

**Changes Made:**
- ✅ Imported `withRLS` helper
- ✅ Wrapped all queries in `withRLS()` context
- ✅ Removed explicit `WHERE owner_user_id = $1` clauses (RLS handles this)
- ✅ Simplified query parameters

**Before:**
```typescript
const client = await pool.connect();
const result = await client.query(
  'SELECT * FROM shops WHERE owner_user_id = $1',
  [merchantId]
);
client.release();
```

**After:**
```typescript
const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
  return await client.query('SELECT * FROM shops');
});
```

### 3. Merchant Analytics (`api/merchant/analytics.ts`)

**Status:** 🟡 Partially Complete

**Changes Made:**
- ✅ Imported `withRLS` helper
- ✅ Wrapped queries in `withRLS()` context
- 🟡 Some queries still need WHERE clause removal

**Remaining Work:**
- Remove `WHERE s.owner_user_id = $1` from remaining queries
- Update all query parameter arrays

---

## ⏳ Pending Work

### Quick Reference: How to Update Each Endpoint

#### Pattern to Follow:

**Step 1:** Add import
```typescript
import { withRLS } from '../lib/rls';
```

**Step 2:** Wrap database operations
```typescript
// OLD
const client = await pool.connect();
try {
  const result = await client.query('SELECT ...', [userId]);
  // more queries...
  return res.json({ data: result.rows });
} finally {
  client.release();
}

// NEW
const result = await withRLS(pool, { userId: user.userId, role: user.role }, async (client) => {
  const data = await client.query('SELECT ...');
  // more queries...
  return data.rows;
});
return res.json({ data: result });
```

**Step 3:** Remove role-based WHERE clauses
```typescript
// OLD - Manual filtering
WHERE owner_user_id = $1
WHERE merchant_id = $1
WHERE courier_id = $1
WHERE consumer_id = $1

// NEW - RLS handles it
WHERE 1=1  // or just remove the WHERE clause if it was the only condition
```

---

## 📋 Endpoint Update Checklist

### Courier Endpoints

#### `api/courier/dashboard.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Remove `WHERE courier_id = $1` or `WHERE user_id = $1`
- [ ] Test with courier account

#### `api/courier/analytics.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Remove courier-specific WHERE clauses
- [ ] Test with courier account

### Consumer Endpoints

#### `api/consumer/dashboard.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Remove `WHERE consumer_id = $1` or `WHERE customer_id = $1`
- [ ] Test with consumer account

### Admin Endpoints

#### `api/admin/dashboard.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Keep queries as-is (admins see all data)
- [ ] Test with admin account

#### `api/admin/analytics.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Keep queries as-is (admins see all data)
- [ ] Test with admin account

### Shared Endpoints

#### `api/orders/index.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Remove role-based filtering logic (RLS handles it)
- [ ] Test with all roles

#### `api/claims/index.ts`
- [ ] Import `withRLS`
- [ ] Wrap queries in `withRLS()`
- [ ] Remove ownership checks (RLS handles it)
- [ ] Test with all roles

---

## 🧪 Testing Checklist

After updating each endpoint:

### Manual Testing
- [ ] Test as **merchant** - should only see own data
- [ ] Test as **courier** - should only see own deliveries
- [ ] Test as **consumer** - should only see own orders
- [ ] Test as **admin** - should see all data

### Verify RLS is Active
```sql
-- In database console
SET app.user_id = 'test-merchant-uuid';
SET app.user_role = 'merchant';
SELECT * FROM Stores;  -- Should only show merchant's stores

RESET app.user_id;
RESET app.user_role;
```

### API Testing
```bash
# Test merchant endpoint
curl -H "Authorization: Bearer <merchant-token>" \
  http://localhost:3000/api/merchant/dashboard

# Test courier endpoint
curl -H "Authorization: Bearer <courier-token>" \
  http://localhost:3000/api/courier/dashboard

# Verify no cross-role data leakage
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find name 'client'"
**Cause:** Forgot to close the `withRLS()` callback properly  
**Solution:** Ensure all queries are inside the callback and return the result

```typescript
// WRONG
const result = await withRLS(pool, user, async (client) => {
  const data = await client.query('SELECT ...');
});
return res.json({ data }); // ❌ data is undefined

// CORRECT
const result = await withRLS(pool, user, async (client) => {
  const data = await client.query('SELECT ...');
  return data.rows; // ✅ return inside callback
});
return res.json({ data: result });
```

### Issue 2: Empty results returned
**Cause:** RLS session variables not set  
**Solution:** Verify `withRLS()` is being used, check database logs

### Issue 3: "relation does not exist"
**Cause:** Table name case mismatch  
**Solution:** Check actual table names in database (Stores vs shops, Orders vs orders)

---

## 📈 Estimated Time Remaining

| Task | Time |
|------|------|
| Complete Merchant Analytics | 15 min |
| Update Courier Endpoints (2) | 30 min |
| Update Consumer Endpoint (1) | 15 min |
| Update Admin Endpoints (2) | 20 min |
| Update Shared Endpoints (2) | 30 min |
| Testing All Endpoints | 45 min |
| **TOTAL** | **~2.5 hours** |

---

## 🎯 Next Steps

1. **Complete merchant analytics** - Remove remaining WHERE clauses
2. **Update courier endpoints** - Dashboard and analytics
3. **Update consumer endpoint** - Dashboard
4. **Update admin endpoints** - Dashboard and analytics
5. **Update shared endpoints** - Orders and claims
6. **Comprehensive testing** - All roles, all endpoints
7. **Performance testing** - Verify RLS doesn't slow queries
8. **Documentation** - Update API docs with RLS info

---

## 📚 Reference Links

- **RLS SQL Script:** `database/row-level-security-safe.sql`
- **RLS Implementation Guide:** `docs/RLS_IMPLEMENTATION_GUIDE.md`
- **RLS Helper Module:** `api/lib/rls.ts`
- **Database Schema:** `database/schema.sql`

---

**Version:** 1.0  
**Author:** Development Team  
**Status:** Active Development
