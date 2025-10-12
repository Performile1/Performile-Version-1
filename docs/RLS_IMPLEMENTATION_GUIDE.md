# Row Level Security (RLS) Implementation Guide

## Overview

Row Level Security (RLS) provides **database-level data isolation** as a second layer of protection. Even if API code has bugs, the database will enforce proper data filtering.

**Created:** October 12, 2025  
**Status:** Ready for implementation

---

## 🎯 What RLS Does

### Without RLS (Current State)
```
API Code → SQL Query → Database → Returns ALL matching rows
```
**Risk:** If API filtering has bugs, users can see other users' data

### With RLS (Secure State)
```
API Code → SQL Query → Database (checks RLS policies) → Returns ONLY authorized rows
```
**Protection:** Database enforces access control automatically

---

## 📋 Implementation Steps

### Step 1: Run the RLS SQL Script

```bash
# Connect to your database
psql -U your_user -d performile_db -f database/row-level-security.sql
```

**What this does:**
- ✅ Creates helper functions (`current_user_id()`, `current_user_role()`, etc.)
- ✅ Enables RLS on critical tables (shops, orders, claims, etc.)
- ✅ Creates role-based policies for each table
- ✅ Grants necessary permissions

---

### Step 2: Update API Database Connection

You need to set session variables **before each query** to tell the database who the current user is.

#### Option A: Set Variables Per Query (Recommended)

**File:** `api/lib/db.ts` or wherever you make database calls

```typescript
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

// Helper function to execute query with RLS context
export async function queryWithRLS(
  pool: Pool,
  user: { userId: string; role: string },
  queryText: string,
  params: any[]
) {
  const client = await pool.connect();
  
  try {
    // Set session variables for RLS
    await client.query('SET app.user_id = $1', [user.userId]);
    await client.query('SET app.user_role = $1', [user.role]);
    
    // Execute the actual query
    const result = await client.query(queryText, params);
    
    // Reset session variables
    await client.query('RESET app.user_id');
    await client.query('RESET app.user_role');
    
    return result;
  } finally {
    client.release();
  }
}
```

**Usage in API endpoints:**

```typescript
// Before (without RLS)
const result = await pool.query('SELECT * FROM shops', []);

// After (with RLS)
const result = await queryWithRLS(
  pool,
  { userId: user.userId, role: user.role },
  'SELECT * FROM shops',
  []
);
```

#### Option B: Middleware Approach

**File:** `api/middleware/rls.ts`

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export function withRLS(handler: Function) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const user = (req as any).user; // Assuming auth middleware sets this
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get database client
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Set RLS context
      await client.query('SET app.user_id = $1', [user.userId]);
      await client.query('SET app.user_role = $1', [user.role]);
      
      // Attach client to request for handler to use
      (req as any).dbClient = client;
      
      // Call the actual handler
      const result = await handler(req, res);
      
      // Reset context
      await client.query('RESET app.user_id');
      await client.query('RESET app.user_role');
      
      return result;
    } finally {
      client.release();
    }
  };
}
```

**Usage:**

```typescript
// Wrap your handler with RLS middleware
export default withRLS(async function handler(req: VercelRequest, res: VercelResponse) {
  const client = (req as any).dbClient;
  
  // All queries will automatically be filtered by RLS
  const result = await client.query('SELECT * FROM shops');
  
  return res.json({ shops: result.rows });
});
```

---

### Step 3: Update Existing API Endpoints

You need to update your API endpoints to use the RLS-aware query function.

#### Example: Shops API

**Before:**
```typescript
const result = await pool.query(
  'SELECT * FROM shops WHERE owner_user_id = $1',
  [userId]
);
```

**After (with RLS):**
```typescript
// The WHERE clause is now optional - RLS handles it!
const result = await queryWithRLS(
  pool,
  { userId: user.userId, role: user.role },
  'SELECT * FROM shops', // No WHERE clause needed
  []
);
```

#### Example: Orders API

**Before:**
```typescript
let query = 'SELECT * FROM orders WHERE 1=1';
if (user.role === 'merchant') {
  query += ' AND shop_id IN (SELECT shop_id FROM shops WHERE owner_user_id = $1)';
  params.push(userId);
}
```

**After (with RLS):**
```typescript
// RLS automatically filters based on role
const result = await queryWithRLS(
  pool,
  { userId: user.userId, role: user.role },
  'SELECT * FROM orders', // RLS handles filtering
  []
);
```

---

## 🧪 Testing RLS Policies

### Manual Testing in psql

```sql
-- Test as merchant
SET app.user_id = '123e4567-e89b-12d3-a456-426614174000';
SET app.user_role = 'merchant';

-- Should only show this merchant's shops
SELECT * FROM shops;

-- Should only show orders from this merchant's shops
SELECT * FROM orders;

-- Reset
RESET app.user_id;
RESET app.user_role;
```

### Automated Testing

**File:** `tests/rls.test.ts`

```typescript
import { Pool } from 'pg';

describe('RLS Policies', () => {
  let pool: Pool;
  
  beforeAll(() => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  });
  
  it('should filter shops by merchant', async () => {
    const client = await pool.connect();
    
    try {
      // Set context as merchant A
      await client.query('SET app.user_id = $1', [merchantAId]);
      await client.query('SET app.user_role = $1', ['merchant']);
      
      // Query shops
      const result = await client.query('SELECT * FROM shops');
      
      // Should only see merchant A's shops
      expect(result.rows.every(shop => shop.owner_user_id === merchantAId)).toBe(true);
    } finally {
      await client.query('RESET app.user_id');
      await client.query('RESET app.user_role');
      client.release();
    }
  });
  
  it('should prevent merchant from seeing other merchant orders', async () => {
    const client = await pool.connect();
    
    try {
      // Set context as merchant A
      await client.query('SET app.user_id = $1', [merchantAId]);
      await client.query('SET app.user_role = $1', ['merchant']);
      
      // Try to query specific order from merchant B
      const result = await client.query(
        'SELECT * FROM orders WHERE order_id = $1',
        [merchantBOrderId]
      );
      
      // Should return empty (no access)
      expect(result.rows.length).toBe(0);
    } finally {
      await client.query('RESET app.user_id');
      await client.query('RESET app.user_role');
      client.release();
    }
  });
  
  it('should allow admin to see all data', async () => {
    const client = await pool.connect();
    
    try {
      // Set context as admin
      await client.query('SET app.user_id = $1', [adminId]);
      await client.query('SET app.user_role = $1', ['admin']);
      
      // Query all shops
      const result = await client.query('SELECT * FROM shops');
      
      // Should see all shops
      expect(result.rows.length).toBeGreaterThan(1);
    } finally {
      await client.query('RESET app.user_id');
      await client.query('RESET app.user_role');
      client.release();
    }
  });
});
```

---

## 📊 RLS Policy Summary

### Shops Table

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Merchant | Own shops | Own shops | Own shops | Own shops |
| Courier | ❌ | ❌ | ❌ | ❌ |
| Consumer | ❌ | ❌ | ❌ | ❌ |
| Admin | All shops | All shops | All shops | All shops |

### Orders Table

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Merchant | Own shop orders | Own shop orders | Own shop orders | ❌ |
| Courier | Assigned deliveries | ❌ | Assigned deliveries | ❌ |
| Consumer | Own orders | ❌ | ❌ | ❌ |
| Admin | All orders | All orders | All orders | All orders |

### Claims Table

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| Merchant | Related to own orders | ❌ | Related to own orders | ❌ |
| Courier | Related to deliveries | ❌ | Related to deliveries | ❌ |
| Consumer | Own claims | Own claims | Own claims | ❌ |
| Admin | All claims | All claims | All claims | All claims |

---

## ⚠️ Important Notes

### 1. Session Variables Must Be Set

RLS policies rely on session variables. If you don't set them, queries will return empty results (except for admins).

```typescript
// ❌ WRONG - Will return empty
const result = await pool.query('SELECT * FROM shops');

// ✅ CORRECT - Sets context first
await client.query('SET app.user_id = $1', [userId]);
await client.query('SET app.user_role = $1', [role]);
const result = await client.query('SELECT * FROM shops');
```

### 2. Connection Pooling Considerations

Session variables are per-connection. With connection pooling:
- Set variables at the start of each request
- Reset variables at the end of each request
- Don't rely on variables persisting across requests

### 3. Performance Impact

RLS policies add overhead to queries:
- Minimal impact for simple policies
- Can be significant for complex subqueries
- Test performance with realistic data volumes

### 4. Debugging

If queries return unexpected results:

```sql
-- Check current session variables
SHOW app.user_id;
SHOW app.user_role;

-- Disable RLS temporarily for testing (as superuser)
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
```

---

## 🚀 Deployment Checklist

- [ ] Run `row-level-security.sql` on database
- [ ] Verify helper functions created
- [ ] Verify RLS enabled on all tables
- [ ] Update API to set session variables
- [ ] Test with each role (merchant, courier, consumer, admin)
- [ ] Verify data isolation working
- [ ] Test performance under load
- [ ] Monitor for RLS-related errors
- [ ] Document any custom policies added

---

## 📈 Benefits

✅ **Defense in Depth** - Two layers of security (API + Database)  
✅ **Automatic Enforcement** - Database always filters data  
✅ **Bug Protection** - Even if API has bugs, data is protected  
✅ **Audit Trail** - Database logs show who accessed what  
✅ **Compliance** - Helps meet data privacy regulations  

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Status:** Ready for implementation
