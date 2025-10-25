# 🗄️ SQL CLEANUP PLAN

**Date:** October 22, 2025, 8:01 PM  
**Purpose:** Organize and clean up 46+ SQL files  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.20  
**Status:** READY FOR EXECUTION

---

## 📊 CURRENT STATE

### Total SQL Files: 46+

**Location 1: database/** (37 files)
**Location 2: supabase/migrations/** (9 files)

---

## 🎯 CLEANUP STRATEGY

### Phase 1: Categorize All Files

#### Category A: ACTIVE MIGRATIONS (Keep in root)
Files that create/modify production tables and should remain active:

1. `WEEK4_PHASE1_service_performance.sql` ✅ KEEP
2. `WEEK4_PHASE2_parcel_points.sql` ✅ KEEP
3. `WEEK4_PHASE3_service_registration.sql` ✅ KEEP
4. `add-admin-features.sql` ✅ KEEP
5. `add-claims-rls-policies.sql` ✅ KEEP
6. `add-new-features-final.sql` ✅ KEEP
7. `add-review-tracking.sql` ✅ KEEP
8. `add-stripe-fields.sql` ✅ KEEP
9. `create-tracking-system.sql` ✅ KEEP
10. `supabase/migrations/20251018_add_merchant_logo_column.sql` ✅ KEEP
11. `supabase/migrations/20251018_create_claims_system.sql` ✅ KEEP

**Total Active: ~11 files**

#### Category B: CHECK/VERIFY SCRIPTS (Archive to checks/)
Files that validate database state but don't modify it:

1. `CHECK_AND_CREATE_MISSING_TABLES.sql` → `archive/checks/`
2. `CHECK_AND_ENABLE_RLS.sql` → `archive/checks/`
3. `CHECK_COMPLETE_DATABASE_CONTENT.sql` → `archive/checks/`
4. `CHECK_CURRENT_SUBSCRIPTION_PLANS.sql` → `archive/checks/`
5. `CHECK_DATABASE_SAFE.sql` → `archive/checks/`
6. `CHECK_DATABASE_SIMPLE.sql` → `archive/checks/`
7. `CHECK_DATABASE_ULTIMATE.sql` → `archive/checks/`
8. `CHECK_ORDERS_SCHEMA.sql` → `archive/checks/`
9. `VERIFY_DATABASE_SETUP.sql` → `archive/checks/`
10. `RLS_COMPREHENSIVE_TEST.sql` → `archive/checks/`
11. `RLS_TEST_SIMPLE.sql` → `archive/checks/`
12. `supabase/migrations/CHECK_ORDERS_SCHEMA.sql` → `archive/checks/`
13. `supabase/migrations/CHECK_STORES_SCHEMA.sql` → `archive/checks/`

**Total Check Scripts: ~13 files**

#### Category C: QUICK FIXES (Archive to fixes/)
Temporary fixes that should be reviewed and potentially removed:

1. `FIX_TIER_CONSTRAINT.sql` → `archive/fixes/`
2. `supabase/migrations/FIX_MATERIALIZED_VIEWS.sql` → `archive/fixes/`
3. `supabase/migrations/QUICK_FIX_order_trends.sql` → `archive/fixes/`
4. `supabase/migrations/QUICK_FIX_order_trends_v2.sql` → `archive/fixes/`

**Total Quick Fixes: ~4 files**

#### Category D: UTILITY SCRIPTS (Archive to utilities/)
Scripts for maintenance, export, deployment:

1. `CLEANUP_SUBSCRIPTION_PLANS.sql` → `archive/utilities/`
2. `DEPLOY_TO_SUPABASE.sql` → `archive/utilities/`
3. `EXPORT_DATABASE_REPORT.sql` → `archive/utilities/`
4. `FIND_MISSING_TABLE.sql` → `archive/utilities/`
5. `GENERATE_DATABASE_SNAPSHOT.sql` → `archive/utilities/`
6. `RESET_TEST_PASSWORD.sql` → `archive/utilities/`

**Total Utilities: ~6 files**

#### Category E: DATA SCRIPTS (Archive to data/)
Scripts that insert/update data:

1. `INSERT_SUBSCRIPTION_PLANS.sql` → `archive/data/`
2. `FINAL_SETUP_SUBSCRIPTION_PLANS.sql` → `archive/data/`

**Total Data Scripts: ~2 files**

#### Category F: DUPLICATES (Review & Delete)
Files that duplicate existing functionality:

1. `supabase/migrations/20251022_courier_integration_system.sql` ⚠️ REVIEW & DELETE
2. `supabase/migrations/CLAIMS_ONLY.sql` ⚠️ REVIEW (may duplicate 20251018_create_claims_system.sql)

**Total Duplicates: ~2 files**

#### Category G: OLD MIGRATIONS (Archive to archive/migrations/)
Old migration files that have been superseded:

1. `add-api-key-column.sql` → `archive/migrations/`
2. `add-review-text.sql` → `archive/migrations/`
3. `add-review-tracking-columns.sql` → `archive/migrations/`
4. `add-team-member-limits.sql` → `archive/migrations/`
5. `add-tracking-description.sql` → `archive/migrations/`
6. Plus any others in `database/archive/` folder

**Total Old Migrations: ~5+ files**

---

## 📁 NEW FOLDER STRUCTURE

```
database/
  ├── active/                           # Active migrations only
  │   ├── WEEK4_PHASE1_service_performance.sql
  │   ├── WEEK4_PHASE2_parcel_points.sql
  │   ├── WEEK4_PHASE3_service_registration.sql
  │   ├── add-admin-features.sql
  │   ├── add-claims-rls-policies.sql
  │   ├── add-new-features-final.sql
  │   ├── add-review-tracking.sql
  │   ├── add-stripe-fields.sql
  │   ├── create-tracking-system.sql
  │   └── CONSOLIDATED_MIGRATION_2025_10_22.sql  # NEW
  │
  ├── archive/
  │   ├── checks/                       # Validation scripts
  │   │   ├── CHECK_AND_CREATE_MISSING_TABLES.sql
  │   │   ├── CHECK_AND_ENABLE_RLS.sql
  │   │   ├── CHECK_COMPLETE_DATABASE_CONTENT.sql
  │   │   ├── CHECK_CURRENT_SUBSCRIPTION_PLANS.sql
  │   │   ├── CHECK_DATABASE_SAFE.sql
  │   │   ├── CHECK_DATABASE_SIMPLE.sql
  │   │   ├── CHECK_DATABASE_ULTIMATE.sql
  │   │   ├── CHECK_ORDERS_SCHEMA.sql
  │   │   ├── VERIFY_DATABASE_SETUP.sql
  │   │   ├── RLS_COMPREHENSIVE_TEST.sql
  │   │   └── RLS_TEST_SIMPLE.sql
  │   │
  │   ├── fixes/                        # Quick fixes
  │   │   ├── FIX_TIER_CONSTRAINT.sql
  │   │   ├── FIX_MATERIALIZED_VIEWS.sql
  │   │   ├── QUICK_FIX_order_trends.sql
  │   │   └── QUICK_FIX_order_trends_v2.sql
  │   │
  │   ├── utilities/                    # Maintenance scripts
  │   │   ├── CLEANUP_SUBSCRIPTION_PLANS.sql
  │   │   ├── DEPLOY_TO_SUPABASE.sql
  │   │   ├── EXPORT_DATABASE_REPORT.sql
  │   │   ├── FIND_MISSING_TABLE.sql
  │   │   ├── GENERATE_DATABASE_SNAPSHOT.sql
  │   │   └── RESET_TEST_PASSWORD.sql
  │   │
  │   ├── data/                         # Data insertion scripts
  │   │   ├── INSERT_SUBSCRIPTION_PLANS.sql
  │   │   └── FINAL_SETUP_SUBSCRIPTION_PLANS.sql
  │   │
  │   ├── migrations/                   # Old migrations
  │   │   ├── add-api-key-column.sql
  │   │   ├── add-review-text.sql
  │   │   ├── add-review-tracking-columns.sql
  │   │   ├── add-team-member-limits.sql
  │   │   └── add-tracking-description.sql
  │   │
  │   └── audit/                        # Existing audit folder
  │       └── [existing audit files]
  │
  ├── COMPREHENSIVE_DATABASE_VALIDATION.sql  # Keep in root
  └── README.md                              # Documentation

supabase/migrations/
  ├── 20251018_add_merchant_logo_column.sql  # Keep
  ├── 20251018_create_claims_system.sql      # Keep
  └── 20251022_notification_rules.sql        # NEW - genuinely new features only
```

---

## 🚀 EXECUTION PLAN

### Step 1: Create Archive Folders
```bash
cd database
mkdir -p archive/checks
mkdir -p archive/fixes
mkdir -p archive/utilities
mkdir -p archive/data
mkdir -p archive/migrations
mkdir -p active
```

### Step 2: Move Check Scripts
```bash
# Move all CHECK_* and VERIFY_* files
mv CHECK_*.sql archive/checks/
mv VERIFY_*.sql archive/checks/
mv RLS_*_TEST*.sql archive/checks/
```

### Step 3: Move Quick Fixes
```bash
mv FIX_*.sql archive/fixes/
mv *QUICK_FIX*.sql archive/fixes/
```

### Step 4: Move Utilities
```bash
mv CLEANUP_*.sql archive/utilities/
mv DEPLOY_*.sql archive/utilities/
mv EXPORT_*.sql archive/utilities/
mv FIND_*.sql archive/utilities/
mv GENERATE_*.sql archive/utilities/
mv RESET_*.sql archive/utilities/
```

### Step 5: Move Data Scripts
```bash
mv INSERT_*.sql archive/data/
mv FINAL_SETUP_*.sql archive/data/
```

### Step 6: Move Old Migrations
```bash
mv add-api-key-column.sql archive/migrations/
mv add-review-text.sql archive/migrations/
mv add-review-tracking-columns.sql archive/migrations/
mv add-team-member-limits.sql archive/migrations/
mv add-tracking-description.sql archive/migrations/
```

### Step 7: Move Active Migrations
```bash
mv WEEK4_*.sql active/
mv add-admin-features.sql active/
mv add-claims-rls-policies.sql active/
mv add-new-features-final.sql active/
mv add-review-tracking.sql active/
mv add-stripe-fields.sql active/
mv create-tracking-system.sql active/
```

### Step 8: Review Duplicates
```bash
# Review these files before deleting:
# - supabase/migrations/20251022_courier_integration_system.sql
# - supabase/migrations/CLAIMS_ONLY.sql
# 
# Check if they contain any unique functionality
# If not, delete them
```

### Step 9: Create Consolidated Migration
```bash
# Create new file: database/active/CONSOLIDATED_MIGRATION_2025_10_22.sql
# Include ONLY genuinely new features:
# - notification_rules table
# - rule_executions table
# - notification_queue table
# - Related functions and RLS policies
```

### Step 10: Update Documentation
```bash
# Create database/README.md explaining new structure
# Update SPEC_DRIVEN_FRAMEWORK.md with new organization
```

---

## 📝 CONSOLIDATED MIGRATION CONTENT

### What to Include (Genuinely New)

```sql
-- CONSOLIDATED_MIGRATION_2025_10_22.sql
-- Only genuinely new features, reusing existing tables

-- 1. Notification Rules System
CREATE TABLE IF NOT EXISTS notification_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50), -- 'order_status', 'delivery_delay', 'custom'
  conditions JSONB, -- IF conditions
  actions JSONB, -- THEN actions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rule Executions (tracking)
CREATE TABLE IF NOT EXISTS rule_executions (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES notification_rules(rule_id),
  order_id UUID REFERENCES orders(order_id),
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN,
  error_message TEXT
);

-- 3. Notification Queue
CREATE TABLE IF NOT EXISTS notification_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  notification_type VARCHAR(50),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 4. RLS Policies
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- User can only see their own rules
CREATE POLICY user_notification_rules ON notification_rules
  FOR ALL USING (auth.uid() = user_id);

-- User can only see their own executions
CREATE POLICY user_rule_executions ON rule_executions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM notification_rules 
      WHERE notification_rules.rule_id = rule_executions.rule_id 
      AND notification_rules.user_id = auth.uid()
    )
  );

-- User can only see their own notifications
CREATE POLICY user_notifications ON notification_queue
  FOR ALL USING (auth.uid() = user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_notification_rules_user 
  ON notification_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule 
  ON rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user 
  ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status 
  ON notification_queue(status);

-- 6. Functions
CREATE OR REPLACE FUNCTION check_notification_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if any rules match this order update
  -- Execute matching rules
  -- Add to notification queue
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers
CREATE TRIGGER order_notification_check
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_notification_rules();
```

### What NOT to Include (Already Exists)

```sql
-- ❌ DON'T CREATE - Already exists as courier_api_credentials
-- CREATE TABLE courier_integrations ...

-- ❌ DON'T CREATE - Already exists as tracking_events
-- CREATE TABLE shipment_events ...

-- ✅ INSTEAD - Use existing tables:
-- - courier_api_credentials (18 columns)
-- - tracking_events (event history)
-- - tracking_data (18 columns)
-- - ecommerce_integrations (platform connections)
-- - tracking_api_logs (API logging)
```

---

## ⚠️ FILES TO DELETE

### Duplicate Tables/APIs

1. **Database:**
   - `supabase/migrations/20251022_courier_integration_system.sql`
     - Contains duplicate `courier_integrations` table
     - Contains duplicate `shipment_events` table
     - Should be replaced with consolidated migration

2. **APIs:**
   - `api/courier-integrations.ts` - Use `/api/tracking/` instead
   - Review and potentially remove

3. **Services:**
   - `apps/web/src/services/courierIntegrationsService.ts` - May overlap
   - `apps/web/src/services/shipmentTrackingService.ts` - May overlap
   - Review and consolidate with existing TrackingService

---

## ✅ VERIFICATION CHECKLIST

After cleanup:

- [ ] All active migrations in `database/active/`
- [ ] All check scripts in `database/archive/checks/`
- [ ] All quick fixes in `database/archive/fixes/`
- [ ] All utilities in `database/archive/utilities/`
- [ ] All data scripts in `database/archive/data/`
- [ ] All old migrations in `database/archive/migrations/`
- [ ] Consolidated migration created
- [ ] Duplicate files reviewed and deleted
- [ ] README.md created explaining structure
- [ ] SPEC_DRIVEN_FRAMEWORK.md updated
- [ ] Database validation run
- [ ] All tests passing

---

## 📊 EXPECTED RESULTS

### Before Cleanup
- **Total Files:** 46+
- **Organization:** Poor (all in root)
- **Duplicates:** Yes (multiple)
- **Clarity:** Low

### After Cleanup
- **Active Migrations:** ~12 files (in active/)
- **Archived Files:** ~34 files (organized by type)
- **Duplicates:** 0 (removed)
- **Clarity:** High
- **Maintainability:** Excellent

---

## 🎯 SUCCESS CRITERIA

1. ✅ All SQL files organized by category
2. ✅ No duplicates remaining
3. ✅ Clear folder structure
4. ✅ Consolidated migration created
5. ✅ Documentation updated
6. ✅ Database validation passing
7. ✅ All tests passing
8. ✅ Server issues resolved

---

## 📝 NEXT STEPS

1. **Run Database Validation** - Use `COMPREHENSIVE_DATABASE_VALIDATION.sql`
2. **Review Results** - Identify what exists vs. what's missing
3. **Execute Cleanup** - Follow steps 1-10 above
4. **Create Consolidated Migration** - Only genuinely new features
5. **Test Migration** - On copy database first
6. **Deploy** - To production after verification
7. **Update Documentation** - Reflect new structure

---

**Framework:** SPEC_DRIVEN_FRAMEWORK v1.20  
**Status:** READY FOR EXECUTION  
**Estimated Time:** 1-2 hours  
**Risk Level:** Low (with proper testing)

---

*Generated: October 22, 2025, 8:01 PM*  
*Following: SPEC_DRIVEN_FRAMEWORK v1.20*  
*Purpose: Clean, organized, maintainable SQL structure*
