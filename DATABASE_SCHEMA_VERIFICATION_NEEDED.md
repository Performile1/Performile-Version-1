# Database Schema Verification - URGENT

## Issue
We keep having crashes due to mismatches between:
1. What the code expects from the database
2. What actually exists in the production database

## Current Problem
- **90+ SQL files** in `/database` folder
- **No clear indication** which one matches production
- **Multiple versions** of table definitions
- **Naming inconsistencies** (snake_case vs camelCase)

## What We Need

### 1. Export Production Schema
**Action:** Run this in Supabase SQL Editor:
```sql
-- Export complete schema
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Export all table names
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Export all enum types
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
```

### 2. Critical Tables to Verify

#### Users/Authentication
- [ ] Table name: `users` or `profiles` or `auth.users`?
- [ ] Columns: `user_id` vs `id`?
- [ ] Role column: `user_role` vs `role`?
- [ ] Email column name?
- [ ] Password hash column name?

#### Orders
- [ ] Table name: `orders` (confirmed)
- [ ] Foreign keys: `merchant_id`, `courier_id`, `consumer_id`
- [ ] Status enum values
- [ ] All required columns present

#### Couriers
- [ ] Table name: `couriers` or `courier_companies`?
- [ ] ID column: `courier_id` vs `id`?
- [ ] Relationship to users table

#### Stores/Merchants
- [ ] Table name: `stores` or `merchants` or `merchant_stores`?
- [ ] Owner relationship to users
- [ ] Multi-shop support columns

#### Subscriptions
- [ ] Table name: `subscription_plans` vs `SubscriptionPlans` (casing!)
- [ ] User subscriptions table
- [ ] Stripe integration columns

### 3. Common Mismatches We've Found

| Code Expects | Database Has | Status |
|--------------|--------------|--------|
| `userId` | `user_id` | ✅ Fixed in JWT |
| `role` | `user_role` | ✅ Fixed in JWT |
| `SubscriptionPlans` | `subscription_plans` | ⚠️ Check casing |
| `consumer_id` | `user_id` | ⚠️ Verify |
| `courier_companies` | `couriers` | ⚠️ Verify |

### 4. API Endpoints to Check

Each endpoint should be verified against actual database:

#### Authentication (`/api/auth.ts`)
```sql
-- What query does it run?
SELECT user_id, email, password_hash, user_role, first_name, last_name, 
       is_active, is_verified, created_at, updated_at 
FROM users 
WHERE email = $1
```
- [ ] Verify `users` table exists
- [ ] Verify all columns exist with exact names

#### Admin Subscriptions (`/api/admin/subscriptions.ts`)
```sql
SELECT * FROM SubscriptionPlans WHERE user_role = $1
```
- [ ] Verify table name casing
- [ ] Verify column names

#### Orders (`/api/orders/index.ts`)
```sql
SELECT * FROM orders WHERE merchant_id = $1
```
- [ ] Verify foreign key column names
- [ ] Verify role-based filter columns

### 5. Recommended Fix Process

**Step 1:** Export production schema (queries above)

**Step 2:** Create single source of truth
```
/database/PRODUCTION_SCHEMA.sql  ← Actual production state
```

**Step 3:** Create TypeScript types from schema
```typescript
// /frontend/src/types/database.ts
export interface User {
  user_id: string;
  email: string;
  user_role: 'admin' | 'merchant' | 'courier' | 'consumer';
  // ... exact match to database
}
```

**Step 4:** Add validation to all API responses
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  user_id: z.string().uuid(),
  email: z.string().email(),
  user_role: z.enum(['admin', 'merchant', 'courier', 'consumer']),
  // ... matches database exactly
});

// In API endpoint:
const user = UserSchema.parse(dbResult.rows[0]); // Throws if mismatch
```

**Step 5:** Create database sync checker
```javascript
// /scripts/check-database-sync.js
// Compares TypeScript types with actual database schema
// Runs before deployment
```

## Why This Matters

**Every schema mismatch causes:**
- ❌ 401/500 errors in production
- ❌ User frustration
- ❌ Lost time debugging
- ❌ Emergency fixes
- ❌ Deployment delays

**With proper validation:**
- ✅ Catch errors at compile time
- ✅ Fail fast with clear error messages
- ✅ Prevent production issues
- ✅ Faster development
- ✅ Confident deployments

## Next Session Priority

1. **Export production schema** (5 minutes)
2. **Create PRODUCTION_SCHEMA.sql** (10 minutes)
3. **Compare with all API endpoints** (30 minutes)
4. **Fix any mismatches** (varies)
5. **Add schema validation** (1 hour)

## Questions to Answer

1. What is the actual users table name in production?
2. Are we using Supabase `auth.users` or custom `users` table?
3. What are the exact foreign key column names?
4. Are table names case-sensitive in our database?
5. Which enum values actually exist?

---

**Created:** Oct 15, 2025 10:03 PM UTC+2  
**Priority:** CRITICAL  
**Estimated Time to Fix:** 2-3 hours  
**Impact:** Prevents future crashes
