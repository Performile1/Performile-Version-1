# 🔄 Stripe Auto-Sync System

**Database-driven Stripe synchronization**  
Change your database → Automatically syncs to Stripe

---

## 🎯 HOW IT WORKS

```
┌─────────────────────────────────────────────────────────────┐
│  YOU UPDATE DATABASE                                        │
│  ↓                                                           │
│  Trigger detects change                                     │
│  ↓                                                           │
│  Plan marked as "needs_stripe_sync"                         │
│  ↓                                                           │
│  Sync script/API runs                                       │
│  ↓                                                           │
│  Stripe updated automatically                               │
│  ↓                                                           │
│  Database marked as synced                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 SETUP

### **Step 1: Run Database Migration**

```sql
-- In Supabase SQL Editor:
-- Copy/paste from: database/migrations/2025-10-21_auto_sync_stripe.sql
```

**This creates:**
- ✅ Sync tracking columns on `subscription_plans`
- ✅ `stripe_sync_log` table (audit trail)
- ✅ Automatic trigger on plan changes
- ✅ Helper functions
- ✅ Sync status view

### **Step 2: Initial Sync**

Run the sync script to create all products in Stripe:

```bash
npm install stripe pg

STRIPE_SECRET_KEY=sk_test_xxx \
DATABASE_URL=postgres://... \
node scripts/sync-stripe-products.js
```

---

## 🚀 USAGE

### **Method 1: Automatic via Database Trigger**

Just update your database - it auto-marks for sync:

```sql
-- Change a price
UPDATE subscription_plans 
SET monthly_price = 39 
WHERE plan_slug = 'merchant-starter';

-- Check if marked for sync
SELECT plan_name, needs_stripe_sync 
FROM subscription_plans 
WHERE plan_slug = 'merchant-starter';
-- Result: needs_stripe_sync = true ✅
```

### **Method 2: Manual Sync via Script**

```bash
# Sync all plans that need it
node scripts/sync-stripe-products.js
```

### **Method 3: API Endpoint (Admin)**

```bash
# Trigger sync via API
curl -X POST https://your-domain.com/api/admin/sync-stripe \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 MONITORING

### **Check Sync Status**

```sql
-- View all plans and their sync status
SELECT * FROM stripe_sync_status;
```

**Output:**
```
plan_name          | needs_stripe_sync | last_synced_at | has_stripe_product
-------------------|-------------------|----------------|-------------------
Merchant Starter   | false             | 2025-10-21...  | true
Merchant Growth    | true              | NULL           | false
```

### **View Sync History**

```sql
-- See all sync attempts
SELECT 
    sl.synced_at,
    sp.plan_name,
    sl.action,
    sl.success,
    sl.error_message
FROM stripe_sync_log sl
JOIN subscription_plans sp ON sp.subscription_plan_id = sl.subscription_plan_id
ORDER BY sl.synced_at DESC
LIMIT 20;
```

### **Get Plans Needing Sync**

```sql
SELECT * FROM get_plans_needing_sync();
```

---

## 🔄 WHAT TRIGGERS AUTO-SYNC

Changes to these fields mark plan for sync:
- ✅ `plan_name` - Product name in Stripe
- ✅ `plan_description` - Product description
- ✅ `monthly_price` - Creates new monthly price
- ✅ `annual_price` - Creates new yearly price
- ✅ `features` - Updates metadata
- ✅ `is_active` - Activates/deactivates product

**Example:**
```sql
-- This will trigger sync
UPDATE subscription_plans 
SET 
    plan_name = 'Merchant Starter Pro',
    monthly_price = 35,
    annual_price = 350
WHERE plan_slug = 'merchant-starter';

-- Plan is now marked: needs_stripe_sync = true
```

---

## 💰 PRICE CHANGES

### **How Price Updates Work:**

1. You change price in database
2. Sync detects price change
3. **Old price is archived** (not deleted)
4. **New price is created**
5. Existing subscriptions keep old price
6. New subscriptions use new price

**Example:**
```sql
-- Change price from $29 to $35
UPDATE subscription_plans 
SET monthly_price = 35 
WHERE plan_slug = 'merchant-starter';

-- Run sync
-- Result in Stripe:
-- - price_1ABC123 (old: $29) → archived
-- - price_2DEF456 (new: $35) → active
```

### **Why Archive Instead of Delete?**

- ✅ Existing subscriptions continue at old price
- ✅ Billing history preserved
- ✅ No disruption to customers
- ✅ Audit trail maintained

---

## 🎯 COMMON SCENARIOS

### **Scenario 1: Add New Plan**

```sql
-- Insert new plan
INSERT INTO subscription_plans (
    plan_name, plan_slug, user_type, tier,
    monthly_price, annual_price, plan_description
) VALUES (
    'Merchant Pro', 'merchant-pro', 'merchant', 4,
    149, 1490, 'Professional plan for power users'
);

-- Automatically marked: needs_stripe_sync = true
-- Run sync to create in Stripe
```

### **Scenario 2: Update Pricing**

```sql
-- Increase price
UPDATE subscription_plans 
SET 
    monthly_price = 89,
    annual_price = 890
WHERE plan_slug = 'merchant-growth';

-- Run sync
-- New prices created in Stripe
-- Old prices archived
```

### **Scenario 3: Rename Plan**

```sql
-- Rename plan
UPDATE subscription_plans 
SET plan_name = 'Merchant Growth Plus'
WHERE plan_slug = 'merchant-growth';

-- Run sync
-- Product name updated in Stripe
```

### **Scenario 4: Deactivate Plan**

```sql
-- Deactivate plan (hide from new signups)
UPDATE subscription_plans 
SET is_active = false
WHERE plan_slug = 'merchant-starter';

-- Run sync
-- Product marked inactive in Stripe
-- Existing subscriptions unaffected
```

---

## 🔧 MANUAL SYNC CONTROL

### **Force Sync a Specific Plan**

```sql
-- Mark specific plan for sync
UPDATE subscription_plans 
SET needs_stripe_sync = true
WHERE plan_slug = 'merchant-starter';

-- Then run sync script
```

### **Mark Plan as Synced (if sync done externally)**

```sql
SELECT mark_plan_synced(
    1, -- plan_id
    'prod_ABC123', -- product_id
    'price_1ABC123', -- monthly_price_id
    'price_2ABC123', -- yearly_price_id
    true, -- success
    NULL -- error
);
```

---

## 🚨 ERROR HANDLING

### **View Failed Syncs**

```sql
SELECT 
    plan_name,
    sync_error,
    last_synced_at
FROM subscription_plans
WHERE sync_error IS NOT NULL;
```

### **Retry Failed Sync**

```sql
-- Clear error and retry
UPDATE subscription_plans 
SET 
    needs_stripe_sync = true,
    sync_error = NULL
WHERE plan_slug = 'merchant-starter';

-- Run sync again
```

---

## 📋 SYNC SCRIPT OUTPUT

```bash
$ node scripts/sync-stripe-products.js

🔄 Starting Stripe sync from database...

📊 Found 7 plans in database

📦 Syncing: Merchant Starter...
   Found existing product: prod_ABC123
   ✓ Product unchanged
   💰 Monthly price changed: $29 → $35
   📦 Old monthly price archived
   ✅ New monthly price created: price_2DEF456
   ✓ Yearly price unchanged ($290)
   ✅ Database updated

📦 Syncing: Merchant Growth...
   Found existing product: prod_XYZ789
   ✓ Product unchanged
   ✓ Monthly price unchanged ($79)
   ✓ Yearly price unchanged ($790)

[... continues for all plans ...]

================================================================================
✅ SYNC COMPLETE!
================================================================================

📊 SUMMARY:
   Created: 0 products
   Updated: 1 products
   Total: 7 successful

🔗 View in Stripe: https://dashboard.stripe.com/test/products
```

---

## 🔐 SECURITY

### **Admin-Only Access**

The sync API endpoint should be admin-only:

```typescript
// In api/admin/sync-stripe.ts
const user = await verifyAdmin(req);
if (!user || user.role !== 'admin') {
  return res.status(403).json({ error: 'Unauthorized' });
}
```

### **Audit Trail**

All syncs are logged:

```sql
SELECT 
    synced_at,
    plan_name,
    action,
    success,
    old_values->>'monthly_price' as old_price,
    new_values->>'monthly_price' as new_price
FROM stripe_sync_log sl
JOIN subscription_plans sp ON sp.subscription_plan_id = sl.subscription_plan_id
ORDER BY synced_at DESC;
```

---

## 🎯 BEST PRACTICES

### **1. Test in Test Mode First**

```bash
# Always use test keys first
STRIPE_SECRET_KEY=sk_test_xxx node scripts/sync-stripe-products.js
```

### **2. Sync Regularly**

Set up a cron job or scheduled task:

```bash
# Every hour
0 * * * * cd /path/to/project && node scripts/sync-stripe-products.js
```

### **3. Monitor Sync Status**

```sql
-- Check daily
SELECT 
    COUNT(*) FILTER (WHERE needs_stripe_sync = true) as pending,
    COUNT(*) FILTER (WHERE sync_error IS NOT NULL) as errors,
    COUNT(*) as total
FROM subscription_plans;
```

### **4. Review Price Changes**

Before syncing major price changes:

```sql
-- Review what will change
SELECT 
    plan_name,
    monthly_price,
    annual_price,
    needs_stripe_sync
FROM subscription_plans
WHERE needs_stripe_sync = true;
```

---

## 🔄 AUTOMATED SYNC OPTIONS

### **Option 1: Cron Job**

```bash
# crontab -e
0 * * * * cd /app && STRIPE_SECRET_KEY=$STRIPE_KEY DATABASE_URL=$DB_URL node scripts/sync-stripe-products.js >> /var/log/stripe-sync.log 2>&1
```

### **Option 2: GitHub Actions**

```yaml
# .github/workflows/sync-stripe.yml
name: Sync Stripe
on:
  schedule:
    - cron: '0 * * * *' # Every hour
  workflow_dispatch: # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install stripe pg
      - run: node scripts/sync-stripe-products.js
        env:
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### **Option 3: Vercel Cron**

```json
// vercel.json
{
  "crons": [{
    "path": "/api/admin/sync-stripe",
    "schedule": "0 * * * *"
  }]
}
```

---

## ✅ VERIFICATION

After setup, verify everything works:

```bash
# 1. Update a price
psql $DATABASE_URL -c "UPDATE subscription_plans SET monthly_price = 39 WHERE plan_slug = 'merchant-starter'"

# 2. Check it's marked for sync
psql $DATABASE_URL -c "SELECT plan_name, needs_stripe_sync FROM subscription_plans WHERE plan_slug = 'merchant-starter'"

# 3. Run sync
node scripts/sync-stripe-products.js

# 4. Verify in Stripe Dashboard
# Go to: https://dashboard.stripe.com/test/products

# 5. Check database updated
psql $DATABASE_URL -c "SELECT plan_name, needs_stripe_sync, last_synced_at FROM subscription_plans WHERE plan_slug = 'merchant-starter'"
```

---

## 📞 TROUBLESHOOTING

### **Issue: Sync not triggering**

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_stripe_sync';

-- Manually mark for sync
UPDATE subscription_plans SET needs_stripe_sync = true WHERE plan_slug = 'merchant-starter';
```

### **Issue: Prices not updating**

Prices are immutable in Stripe. The sync creates new prices and archives old ones. This is correct behavior.

### **Issue: Sync script fails**

```bash
# Check environment variables
echo $STRIPE_SECRET_KEY
echo $DATABASE_URL

# Check Stripe API key is valid
curl https://api.stripe.com/v1/products -u $STRIPE_SECRET_KEY:
```

---

**Your database is now the source of truth for Stripe!** 🎉

**Update database → Stripe syncs automatically** ✅
