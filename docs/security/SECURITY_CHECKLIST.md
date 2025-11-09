# ✅ SECURITY CHECKLIST - Quick Reference

**Use this checklist for EVERY API endpoint and feature**

---

## 🔐 API ENDPOINT SECURITY

### **Before Deploying ANY Endpoint:**

```typescript
// 1. ✅ Require Authentication
const security = applySecurityMiddleware(req, res, {
  requireAuth: true,
  rateLimit: 'default'
});

// 2. ✅ Validate Role
const user = (req as any).user;
if (user.user_role !== 'expected_role') {
  return res.status(403).json({ error: 'Access denied' });
}

// 3. ✅ Filter Data by User
const query = await pool.query(
  'SELECT * FROM table WHERE user_id = $1',
  [user.user_id]  // NEVER use req.query.userId!
);

// 4. ✅ Return 404 (not 403) for unauthorized access
if (data.rows.length === 0) {
  return res.status(404).json({ error: 'Not found' });
}

// 5. ✅ Log Access
console.log(`[Endpoint] User ${user.user_id} accessed resource`);
```

---

## 🗄️ DATABASE SECURITY

### **RLS Policies:**

```sql
-- ✅ Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- ✅ Create Policy
CREATE POLICY "Users can view their own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 🎯 CONSUMER ENDPOINTS

**CRITICAL: Consumers must ONLY see their own data**

```sql
-- ✅ CORRECT
WHERE consumer_id = $1  -- $1 = user.user_id from JWT

-- ❌ WRONG
WHERE consumer_id = $1  -- $1 = req.query.userId (user can manipulate!)
```

---

## 🧪 SECURITY TESTING

- [ ] Test with different users
- [ ] Test with different roles
- [ ] Test without authentication
- [ ] Test with manipulated parameters
- [ ] Review audit logs

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] Authentication required
- [ ] Role validated
- [ ] Data filtered by user_id
- [ ] RLS policies enabled
- [ ] Access logged
- [ ] Security tested
- [ ] Code reviewed

---

**Last Updated:** November 9, 2025
