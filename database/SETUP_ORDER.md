# Database Setup Order

Run these SQL scripts in Supabase in this exact order:

## 1. Core Tables & RLS (If not already done)
```sql
-- Run: setup-everything.sql
-- This creates all core tables (users, orders, stores, etc.)
```

## 2. Claims System
```sql
-- Step 1: Create claims tables
-- Run: create-claims-system.sql
-- Creates: claims, claim_timeline, claim_communications tables

-- Step 2: Fix claims schema (if needed)
-- Run: fix-claims-add-claimant-id.sql
-- Adds claimant_id column if missing

-- Step 3: Add claims RLS policies
-- Run: add-claims-rls-policies.sql
-- Secures claims for merchants, consumers, couriers, admin
```

## 3. Subscription System
```sql
-- Step 1: Create subscription functions
-- Run: create-subscription-limits-function.sql
-- Creates all limit checking and usage tracking functions

-- Step 2: Assign test subscriptions
-- Run: assign-test-subscriptions.sql
-- Assigns Tier 1 plans to all merchants and couriers
```

## Quick Setup (Run All)

If starting fresh, run in this order:

1. `setup-everything.sql` (if not done)
2. `create-claims-system.sql`
3. `fix-claims-add-claimant-id.sql`
4. `add-claims-rls-policies.sql`
5. `create-subscription-limits-function.sql`
6. `assign-test-subscriptions.sql`

## Verification Queries

After setup, verify everything works:

```sql
-- Check claims table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'claims'
ORDER BY ordinal_position;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('claims', 'claim_timeline', 'claim_communications');

-- Check subscription functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%subscription%' OR routine_name LIKE '%claim%';

-- Check subscription plans
SELECT plan_name, user_type, tier, monthly_price 
FROM subscription_plans 
ORDER BY user_type, tier;

-- Check user subscriptions
SELECT u.email, u.user_role, sp.plan_name, us.status
FROM user_subscriptions us
JOIN users u ON us.user_id = u.user_id
JOIN subscription_plans sp ON us.plan_id = sp.plan_id
WHERE us.status = 'active';
```

## Common Errors & Solutions

### Error: "column claimant_id does not exist"
**Solution:** Run `fix-claims-add-claimant-id.sql`

### Error: "relation claim_timeline does not exist"
**Solution:** Run `create-claims-system.sql` first

### Error: "function get_user_subscription_limits does not exist"
**Solution:** Run `create-subscription-limits-function.sql`

### Error: "table subscription_plans does not exist"
**Solution:** Run `create-subscription-system.sql` (should be in setup-everything.sql)
