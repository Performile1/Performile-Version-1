# MIGRATION GUIDE - COMPLETE BILLING SYSTEM

**Date:** November 3, 2025, 8:35 PM  
**Purpose:** Step-by-step guide to deploy complete billing system  
**Status:** ✅ **READY TO RUN**

---

## 🎯 WHAT YOU'RE DEPLOYING

### **System Components:**
1. ✅ Per-merchant courier credentials
2. ✅ Courier invoicing & reconciliation (4 tables)
3. ✅ Performile billing system (2 tables)
4. ✅ Subscription limits
5. ✅ PostNord courier setup

**Total:** 8 tables, 5 helper functions, 15+ RLS policies

---

## 📋 MIGRATION ORDER (IMPORTANT!)

**Run in this exact order:**

### **Step 1: Fix Existing Issues**
```sql
\i database/FIX_MIGRATION_ERRORS.sql
```
**What it does:**
- Drops duplicate RLS policies
- Recreates policies (idempotent)
- Checks if PostNord exists
- Verifies setup

**Expected output:**
```
NOTICE:  PostNord courier already exists with ID: xxx
-- OR --
NOTICE:  PostNord courier does NOT exist
```

---

### **Step 2: Per-Merchant Credentials**
```sql
\i database/MIGRATE_COURIER_CREDENTIALS_PER_MERCHANT.sql
```
**What it does:**
- Adds `merchant_id`, `store_id`, `customer_number` to `courier_api_credentials`
- Removes UNIQUE constraint on `courier_name`
- Adds composite unique index
- Updates RLS policies
- Adds helper function

**Expected output:**
```
ALTER TABLE
ALTER TABLE
CREATE INDEX
CREATE POLICY
CREATE FUNCTION
```

---

### **Step 3: Courier Invoicing System**
```sql
\i database/CREATE_COURIER_INVOICING_TABLES.sql
```
**What it does:**
- Creates `courier_shipment_costs` (31 columns)
- Creates `merchant_courier_invoices` (31 columns)
- Creates `invoice_shipment_mapping` (13 columns)
- Creates `courier_billing_summary` (24 columns)
- Adds 2 helper functions
- Adds RLS policies

**Expected output:**
```
CREATE TABLE (x4)
CREATE INDEX (x20+)
CREATE POLICY (x8)
CREATE FUNCTION (x2)
```

---

### **Step 4: Performile Billing System**
```sql
\i database/ADD_PERFORMILE_BILLING_SYSTEM.sql
```
**What it does:**
- Updates `subscription_plans` with limits
- Creates `performile_label_charges` table
- Creates `merchant_usage_summary` table
- Adds 3 helper functions
- Adds RLS policies

**Expected output:**
```
ALTER TABLE
UPDATE (4 rows)
CREATE TABLE (x2)
CREATE INDEX (x10+)
CREATE POLICY (x2)
CREATE FUNCTION (x3)
```

---

### **Step 5: Add PostNord Courier (Optional)**
```sql
\i database/ADD_POSTNORD_FIXED.sql
```
**What it does:**
- Checks if PostNord exists
- Creates PostNord courier if needed
- Adds/updates API credentials
- Handles unique constraint on `user_id`

**Expected output:**
```
NOTICE:  PostNord courier already exists with ID: xxx
NOTICE:  Updated PostNord API credentials
-- OR --
NOTICE:  Created PostNord courier with ID: xxx
NOTICE:  Created PostNord API credentials
```

---

## ⚠️ COMMON ERRORS & SOLUTIONS

### **Error 1: Duplicate Policy**
```
ERROR: policy "xxx" already exists
```
**Solution:** Run `FIX_MIGRATION_ERRORS.sql` first

---

### **Error 2: Unique Constraint on user_id**
```
ERROR: duplicate key value violates unique constraint "couriers_user_id_key"
```
**Cause:** The `couriers` table has UNIQUE constraint on `user_id`

**Solutions:**

**Option A: Remove Unique Constraint (Recommended)**
```sql
ALTER TABLE couriers DROP CONSTRAINT IF EXISTS couriers_user_id_key;
```
This allows multiple couriers per user (needed for platform couriers).

**Option B: Create Dedicated User**
```sql
-- Create a system user for platform couriers
INSERT INTO users (user_id, email, user_role, first_name)
VALUES (
  gen_random_uuid(),
  'system@performile.com',
  'admin',
  'System'
);
```

---

### **Error 3: PostNord Already Exists**
```
NOTICE: PostNord courier already exists
```
**Solution:** This is not an error! The script detects existing courier and updates credentials.

---

## ✅ VERIFICATION QUERIES

### **1. Check All Tables Created**
```sql
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN (
  'courier_api_credentials',
  'courier_shipment_costs',
  'merchant_courier_invoices',
  'invoice_shipment_mapping',
  'courier_billing_summary',
  'performile_label_charges',
  'merchant_usage_summary'
)
ORDER BY table_name;
```

**Expected:**
| table_name | column_count |
|------------|--------------|
| courier_api_credentials | 25+ |
| courier_billing_summary | 24 |
| courier_shipment_costs | 31 |
| invoice_shipment_mapping | 13 |
| merchant_courier_invoices | 31 |
| merchant_usage_summary | 22 |
| performile_label_charges | 20 |

---

### **2. Check Subscription Plans Updated**
```sql
SELECT 
  plan_name,
  monthly_price,
  included_labels_per_month,
  cost_per_additional_label,
  invoice_rows_limit,
  invoice_reconciliation_enabled
FROM subscription_plans
WHERE plan_name IN ('Free', 'Starter', 'Professional', 'Enterprise');
```

**Expected:**
| plan_name | monthly_price | included_labels | cost_per_label | invoice_rows | reconciliation |
|-----------|---------------|-----------------|----------------|--------------|----------------|
| Free | 0 | 10 | 2.00 | 10 | false |
| Starter | 29 | 50 | 1.50 | 100 | true |
| Professional | 99 | 200 | 1.00 | 500 | true |
| Enterprise | 299 | 1000 | 0.50 | 999999 | true |

---

### **3. Check Helper Functions**
```sql
SELECT 
  proname as function_name,
  pronargs as arg_count
FROM pg_proc
WHERE proname LIKE '%merchant%' 
   OR proname LIKE '%courier%'
   OR proname LIKE '%invoice%'
ORDER BY proname;
```

**Expected functions:**
- `auto_match_invoice_shipments`
- `calculate_merchant_usage_summary`
- `calculate_monthly_courier_summary`
- `check_invoice_reconciliation_limit`
- `check_merchant_label_limit`
- `get_merchant_courier_credentials`

---

### **4. Check RLS Policies**
```sql
SELECT 
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN (
  'courier_shipment_costs',
  'merchant_courier_invoices',
  'performile_label_charges',
  'merchant_usage_summary'
)
ORDER BY tablename, policyname;
```

**Expected:** 10+ policies

---

### **5. Check PostNord Courier**
```sql
SELECT 
  c.courier_id,
  c.courier_name,
  c.courier_code,
  c.is_active,
  u.email as user_email,
  cac.base_url as api_url
FROM couriers c
LEFT JOIN users u ON c.user_id = u.user_id
LEFT JOIN courier_api_credentials cac ON c.courier_id = cac.courier_id
WHERE c.courier_code = 'POSTNORD';
```

**Expected:**
- 1 row with PostNord data
- `api_url`: https://api2.postnord.com

---

## 🎯 TEST THE SYSTEM

### **Test 1: Check Label Limit**
```sql
SELECT * FROM check_merchant_label_limit(
  'merchant-uuid-here'::UUID
);
```

**Expected output:**
```
can_create_label | labels_used | labels_limit | labels_remaining | will_be_charged | charge_amount
true            | 0           | 50           | 50               | false           | 0.00
```

---

### **Test 2: Check Invoice Limit**
```sql
SELECT * FROM check_invoice_reconciliation_limit(
  'merchant-uuid-here'::UUID
);
```

**Expected output:**
```
can_add_invoice | rows_used | rows_limit | rows_remaining | feature_enabled
true           | 0         | 100        | 100            | true
```

---

### **Test 3: Get Merchant Credentials**
```sql
SELECT * FROM get_merchant_courier_credentials(
  'merchant-uuid-here'::UUID,
  'postnord-courier-uuid'::UUID
);
```

**Expected output:**
- Returns merchant's PostNord credentials if they exist
- Returns NULL if not configured

---

## 📊 ROLLBACK (IF NEEDED)

**If something goes wrong, rollback in reverse order:**

```sql
-- Drop new tables
DROP TABLE IF EXISTS merchant_usage_summary CASCADE;
DROP TABLE IF EXISTS performile_label_charges CASCADE;
DROP TABLE IF EXISTS courier_billing_summary CASCADE;
DROP TABLE IF EXISTS invoice_shipment_mapping CASCADE;
DROP TABLE IF EXISTS merchant_courier_invoices CASCADE;
DROP TABLE IF EXISTS courier_shipment_costs CASCADE;

-- Revert subscription_plans
ALTER TABLE subscription_plans 
DROP COLUMN IF EXISTS included_labels_per_month,
DROP COLUMN IF EXISTS cost_per_additional_label,
DROP COLUMN IF EXISTS invoice_rows_limit,
DROP COLUMN IF EXISTS invoice_reconciliation_enabled;

-- Revert courier_api_credentials
ALTER TABLE courier_api_credentials
DROP COLUMN IF EXISTS merchant_id,
DROP COLUMN IF EXISTS store_id,
DROP COLUMN IF EXISTS customer_number,
DROP COLUMN IF EXISTS account_name;

-- Drop functions
DROP FUNCTION IF EXISTS check_merchant_label_limit;
DROP FUNCTION IF EXISTS check_invoice_reconciliation_limit;
DROP FUNCTION IF EXISTS calculate_merchant_usage_summary;
DROP FUNCTION IF EXISTS calculate_monthly_courier_summary;
DROP FUNCTION IF EXISTS auto_match_invoice_shipments;
DROP FUNCTION IF EXISTS get_merchant_courier_credentials;
```

---

## 🚀 POST-MIGRATION TASKS

### **1. Update Booking API**
- Fetch cost from courier API
- Check label limit
- Create label charge
- Track shipment cost

### **2. Build Billing UI**
- Usage dashboard
- Billing summary
- Invoice upload
- Reconciliation view

### **3. Test Complete Flow**
- Book shipment
- Check costs tracked
- Upload invoice
- Verify reconciliation

---

## ✅ SUCCESS CRITERIA

**Migration is successful when:**
- ✅ All 7 tables exist
- ✅ All 5+ helper functions work
- ✅ All RLS policies active
- ✅ Subscription plans updated
- ✅ PostNord courier configured
- ✅ No errors in verification queries

---

## 📝 NEXT STEPS AFTER MIGRATION

1. **Test with real merchant:**
   - Add PostNord credentials
   - Book test shipment
   - Verify costs tracked

2. **Build APIs:**
   - Label limit check endpoint
   - Courier cost fetch endpoint
   - Usage summary endpoint

3. **Build UI:**
   - Billing dashboard
   - Invoice upload form
   - Reconciliation view

---

**Status:** ✅ **READY TO RUN**  
**Time Estimate:** 10-15 minutes  
**Risk Level:** **LOW** (can rollback)

---

*Created: November 3, 2025, 8:35 PM*  
*Last Updated: November 3, 2025, 8:35 PM*
