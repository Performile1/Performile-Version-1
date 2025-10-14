# 🔒 Data Leakage Prevention Plan

**Date:** October 14, 2025  
**Priority:** CRITICAL  
**Status:** Action Required

---

## RISK ASSESSMENT

### 🔴 Critical Risks

**1. RLS Policy Gaps**
- **Risk:** Users see data from other users/roles
- **Impact:** Privacy violation, compliance issues
- **Likelihood:** Medium
- **Severity:** Critical

**2. Subscription Limit Bypass**
- **Risk:** Free users get paid features
- **Impact:** Revenue loss
- **Likelihood:** Medium
- **Severity:** High

**3. API Authorization Gaps**
- **Risk:** Unauthorized access to endpoints
- **Impact:** Data exposure
- **Likelihood:** Low
- **Severity:** Critical

---

## TESTING CHECKLIST

### RLS Policy Tests

#### Orders Table
```sql
-- Test 1: Admin sees all
SET app.user_id = '<admin-uuid>';
SET app.user_role = 'admin';
SELECT COUNT(*) FROM orders; -- Expected: ALL orders

-- Test 2: Merchant sees only own stores
SET app.user_id = '<merchant-uuid>';
SET app.user_role = 'merchant';
SELECT COUNT(*) FROM orders 
WHERE store_id IN (
  SELECT store_id FROM stores WHERE owner_user_id = '<merchant-uuid>'
); -- Expected: Match actual query

-- Test 3: Courier sees only assigned
SET app.user_id = '<courier-uuid>';
SET app.user_role = 'courier';
SELECT COUNT(*) FROM orders
WHERE courier_id IN (
  SELECT courier_id FROM couriers WHERE user_id = '<courier-uuid>'
); -- Expected: Match actual query

-- Test 4: Consumer sees only own email
SET app.user_id = '<consumer-uuid>';
SET app.user_role = 'consumer';
SELECT COUNT(*) FROM orders
WHERE customer_email IN (
  SELECT email FROM users WHERE user_id = '<consumer-uuid>'
); -- Expected: Match actual query
```

#### Reviews Table
```sql
-- Test each role
-- Admin: All reviews
-- Merchant: Reviews for their stores
-- Courier: Reviews for their deliveries
-- Consumer: Their own reviews
```

#### Claims Table
```sql
-- Test each role
-- Admin: All claims
-- Merchant: Claims for their orders
-- Courier: Claims for their deliveries
-- Consumer: Their own claims
```

#### Users Table
```sql
-- Test each role
-- Admin: All users
-- Others: Own profile only
```

---

### Subscription Limit Tests

#### Test Order Creation Limits
```bash
# Free tier: 100 orders/month
# Test creating 101st order

curl -X POST /api/orders \
  -H "Authorization: Bearer <free-tier-token>" \
  -d '{"order_data": "..."}' \
  # Expected: 403 with limit message

# Enterprise: Unlimited
curl -X POST /api/orders \
  -H "Authorization: Bearer <enterprise-token>" \
  -d '{"order_data": "..."}' \
  # Expected: 201 success
```

#### Test Email Limits
```bash
# Starter: 1000 emails/month
# Test sending 1001st email

curl -X POST /api/notifications/email \
  -H "Authorization: Bearer <starter-token>" \
  -d '{"email_data": "..."}' \
  # Expected: 403 with limit message
```

---

### API Authorization Tests

#### Test Endpoint Access by Role
```bash
# Admin endpoints
curl /api/admin/users \
  -H "Authorization: Bearer <merchant-token>"
  # Expected: 403 Forbidden

# Merchant endpoints
curl /api/merchant/analytics \
  -H "Authorization: Bearer <courier-token>"
  # Expected: 403 Forbidden

# Courier endpoints
curl /api/courier/orders \
  -H "Authorization: Bearer <consumer-token>"
  # Expected: 403 Forbidden
```

---

## AUTOMATED TEST SUITE

### RLS Test Script
```typescript
// database/__tests__/rls-comprehensive.test.ts

describe('RLS Comprehensive Tests', () => {
  const roles = ['admin', 'merchant', 'courier', 'consumer']
  const tables = ['orders', 'reviews', 'claims', 'users']
  
  roles.forEach(role => {
    describe(`${role} role`, () => {
      tables.forEach(table => {
        it(`should see correct data in ${table}`, async () => {
          // Set RLS context
          await setRLSContext(role, getUserId(role))
          
          // Query table
          const result = await query(`SELECT * FROM ${table}`)
          
          // Verify results
          expect(result.rows).toMatchSnapshot()
          verifyDataAccess(role, table, result.rows)
        })
      })
    })
  })
})

function verifyDataAccess(role, table, rows) {
  switch(role) {
    case 'admin':
      // Admin should see all
      expect(rows.length).toBeGreaterThan(0)
      break
    case 'merchant':
      // Merchant should see only own data
      rows.forEach(row => {
        if (table === 'orders') {
          expect(row.store_id).toBeInMerchantStores()
        }
      })
      break
    case 'courier':
      // Courier should see only assigned
      rows.forEach(row => {
        if (table === 'orders') {
          expect(row.courier_id).toBe(getCourierId())
        }
      })
      break
    case 'consumer':
      // Consumer should see only own
      rows.forEach(row => {
        if (table === 'orders') {
          expect(row.customer_email).toBe(getUserEmail())
        }
      })
      break
  }
}
```

---

## MITIGATION STRATEGIES

### 1. Enable RLS on All Tables
```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;
```

### 2. Enforce Subscription Limits
```typescript
// Middleware for all protected endpoints
async function enforceSubscriptionLimits(req, res, next) {
  const user = req.user
  const action = req.path // e.g., '/api/orders'
  
  // Check limit
  const canProceed = await checkSubscriptionLimit(user.id, action)
  
  if (!canProceed) {
    const limits = await getUserLimits(user.id)
    return res.status(403).json({
      error: 'SUBSCRIPTION_LIMIT_REACHED',
      message: `You've reached your ${action} limit`,
      current: limits.current,
      max: limits.max,
      upgrade_required: true
    })
  }
  
  next()
}
```

### 3. Standardize Authorization
```typescript
// Middleware for role-based access
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: `This endpoint requires one of: ${allowedRoles.join(', ')}`
      })
    }
    
    next()
  }
}

// Usage
app.get('/api/admin/users', 
  authenticate,
  requireRole('admin'),
  handleGetUsers
)
```

---

## MONITORING & ALERTS

### 1. Log All Data Access
```typescript
// Log middleware
async function logDataAccess(req, res, next) {
  const user = req.user
  const resource = req.path
  const action = req.method
  
  await db.query(`
    INSERT INTO audit_log (user_id, user_role, resource, action, timestamp)
    VALUES ($1, $2, $3, $4, NOW())
  `, [user.id, user.role, resource, action])
  
  next()
}
```

### 2. Alert on Suspicious Activity
```typescript
// Check for anomalies
async function checkAnomalies(userId) {
  // Check if user is accessing unusual amount of data
  const recentAccess = await db.query(`
    SELECT COUNT(*) as count
    FROM audit_log
    WHERE user_id = $1
    AND timestamp > NOW() - INTERVAL '1 hour'
  `, [userId])
  
  if (recentAccess.rows[0].count > 1000) {
    await sendAlert({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      message: 'User accessing unusual amount of data'
    })
  }
}
```

---

## COMPLIANCE CHECKLIST

- [ ] GDPR: Users can only see their own data
- [ ] CCPA: Users can request data deletion
- [ ] SOC 2: Audit logs for all data access
- [ ] PCI DSS: No payment data in logs
- [ ] HIPAA: N/A (no health data)

---

## ACTION ITEMS

### Week 1
- [ ] Run RLS tests on all tables
- [ ] Document current vs expected behavior
- [ ] Fix any data leakage found
- [ ] Enable RLS on all tables

### Week 2
- [ ] Implement subscription limit checks
- [ ] Add authorization middleware
- [ ] Test all endpoints with all roles
- [ ] Add audit logging

### Week 3
- [ ] Set up monitoring
- [ ] Configure alerts
- [ ] Create compliance report
- [ ] Document security measures

### Week 4
- [ ] Final security audit
- [ ] Penetration testing
- [ ] Fix any issues found
- [ ] Sign off on security

---

**Status:** Action Required  
**Next Review:** Oct 21, 2025  
**Owner:** Development Team
