# 🔄 PRICING SYSTEM MIGRATION GUIDE

**Date:** November 19, 2025, 10:03 PM  
**Status:** Ready to Execute  
**Purpose:** Migrate from old pricing tables to new unified system

---

## 📊 MIGRATION OVERVIEW

### **Old System (5 tables):**
- `courier_base_prices`
- `courier_weight_pricing`
- `courier_distance_pricing`
- `courier_surcharge_rules`
- `postal_code_zones` (partial - courier-specific zones)

### **New System (5 tables):**
- `courier_pricing` ← Unified base pricing
- `pricing_weight_tiers` ← Weight-based pricing
- `pricing_distance_tiers` ← Distance-based pricing
- `pricing_surcharges` ← All surcharges
- `pricing_zones` ← Geographic zones

---

## 🎯 MIGRATION STRATEGY

### **Safe Migration:**
1. ✅ Copy data from old tables to new tables
2. ✅ Keep old tables intact (don't drop)
3. ✅ Mark old tables as DEPRECATED
4. ✅ Verify data integrity
5. ✅ Create migration log for tracking

### **No Data Loss:**
- Old tables remain in database
- Can rollback if needed
- All data preserved

---

## 🚀 HOW TO RUN MIGRATION

### **Step 1: Run Migration Script**

**File:** `database/migrations/MIGRATE_OLD_PRICING_TO_NEW.sql`

1. Open the migration file
2. Copy ALL content
3. Paste into Supabase SQL Editor
4. Click "Run"

### **Step 2: Review Migration Log**

After migration completes, check the log:

```sql
SELECT * FROM pricing_migration_log ORDER BY migrated_at DESC;
```

**Expected Output:**
```
| migration_step          | old_table                  | new_table              | rows_migrated | status  |
|------------------------|----------------------------|------------------------|---------------|---------|
| migrate_base_prices    | courier_base_prices        | courier_pricing        | X             | success |
| migrate_weight_pricing | courier_weight_pricing     | pricing_weight_tiers   | X             | success |
| migrate_distance_pricing| courier_distance_pricing  | pricing_distance_tiers | X             | success |
| migrate_surcharges     | courier_surcharge_rules    | pricing_surcharges     | X             | success |
| migrate_zones          | postal_code_zones          | pricing_zones          | X             | success |
```

### **Step 3: Verify Migration**

The script automatically verifies:
- Row counts match
- No data loss
- All migrations successful

---

## 📋 WHAT GETS MIGRATED

### **1. Base Prices → courier_pricing**

**Mapping:**
```
courier_base_prices.service_type → courier_pricing.service_level
courier_base_prices.base_price → courier_pricing.base_price
courier_base_prices.min_price → courier_pricing.min_price
courier_base_prices.max_price → courier_pricing.max_price
courier_base_prices.effective_from → courier_pricing.valid_from
courier_base_prices.effective_to → courier_pricing.valid_to
courier_base_prices.is_active → courier_pricing.active
```

### **2. Weight Pricing → pricing_weight_tiers**

**Mapping:**
```
courier_weight_pricing.min_weight → pricing_weight_tiers.weight_from
courier_weight_pricing.max_weight → pricing_weight_tiers.weight_to
courier_weight_pricing.fixed_price → pricing_weight_tiers.price
courier_weight_pricing.service_type → pricing_weight_tiers.service_level
```

### **3. Distance Pricing → pricing_distance_tiers**

**Mapping:**
```
courier_distance_pricing.min_distance → pricing_distance_tiers.distance_from
courier_distance_pricing.max_distance → pricing_distance_tiers.distance_to
courier_distance_pricing.fixed_price → pricing_distance_tiers.price
courier_distance_pricing.service_type → pricing_distance_tiers.service_level
```

### **4. Surcharges → pricing_surcharges**

**Mapping:**
```
courier_surcharge_rules.surcharge_type → pricing_surcharges.surcharge_type
courier_surcharge_rules.surcharge_name → pricing_surcharges.surcharge_name
courier_surcharge_rules.amount (if fixed) → pricing_surcharges.surcharge_amount
courier_surcharge_rules.amount (if %) → pricing_surcharges.surcharge_percentage
courier_surcharge_rules.applies_to → pricing_surcharges.applies_to
courier_surcharge_rules.is_active → pricing_surcharges.active
```

### **5. Zones → pricing_zones**

**Mapping:**
```
postal_code_zones.zone_name → pricing_zones.zone_name
postal_code_zones.postal_code_from → pricing_zones.postal_code_from
postal_code_zones.postal_code_to → pricing_zones.postal_code_to
postal_code_zones.zone_multiplier → pricing_zones.zone_multiplier
postal_code_zones.is_remote → pricing_zones.is_remote_area
postal_code_zones.country → pricing_zones.country
```

---

## ⚠️ IMPORTANT NOTES

### **Duplicate Prevention:**
- Migration script checks for existing data
- Won't create duplicates
- Safe to run multiple times

### **Old Tables:**
- Marked as DEPRECATED (table comments added)
- Kept for reference and rollback
- Can be dropped later (after verification)

### **Service Level Mapping:**
```
Old: 'express' → New: 'express'
Old: 'same_day' → New: 'same_day'
Old: 'standard' → New: 'standard'
Old: anything else → New: 'standard'
```

---

## 🔄 ROLLBACK PLAN

If migration fails or issues arise:

### **Option 1: Use Old Tables**
Old tables are still intact - just update APIs to use old tables temporarily

### **Option 2: Restore from Backup**
```sql
-- Drop new tables
DROP TABLE pricing_distance_tiers CASCADE;
DROP TABLE pricing_weight_tiers CASCADE;
DROP TABLE pricing_surcharges CASCADE;
DROP TABLE pricing_zones CASCADE;
DROP TABLE courier_pricing CASCADE;

-- Restore from backup
CREATE TABLE courier_pricing AS SELECT * FROM courier_pricing_backup_20251119_safe;
-- (etc for other tables)
```

### **Option 3: Delete Migrated Data**
```sql
-- Remove only migrated data (keeps PostNord sample data)
DELETE FROM courier_pricing WHERE created_at >= '2025-11-19 22:00:00';
DELETE FROM pricing_weight_tiers WHERE created_at >= '2025-11-19 22:00:00';
DELETE FROM pricing_distance_tiers WHERE created_at >= '2025-11-19 22:00:00';
DELETE FROM pricing_surcharges WHERE created_at >= '2025-11-19 22:00:00';
DELETE FROM pricing_zones WHERE created_at >= '2025-11-19 22:00:00';
```

---

## ✅ POST-MIGRATION TASKS

### **1. Update APIs (If Needed)**
Most APIs already use the new system, but check:
- `api/couriers/calculate-price.ts` - Update if using old tables
- Any custom pricing endpoints

### **2. Update Documentation**
- Mark old pricing docs as deprecated
- Update API documentation with new table names

### **3. Monitor Performance**
- Test pricing calculations
- Verify accuracy
- Check API response times

### **4. Clean Up (Later)**
After 1-2 weeks of successful operation:
```sql
-- Drop old tables (ONLY after verification!)
DROP TABLE courier_base_prices CASCADE;
DROP TABLE courier_weight_pricing CASCADE;
DROP TABLE courier_distance_pricing CASCADE;
DROP TABLE courier_surcharge_rules CASCADE;
-- Keep postal_code_zones (used for other purposes)
```

---

## 📊 EXPECTED RESULTS

### **Before Migration:**
- Old tables: ~X rows each
- New tables: 27 rows (PostNord sample data)

### **After Migration:**
- Old tables: ~X rows (unchanged)
- New tables: 27 + X rows (sample + migrated)
- Migration log: 5 entries

### **Verification Queries:**

```sql
-- Check row counts
SELECT 'courier_pricing' as table_name, COUNT(*) FROM courier_pricing
UNION ALL
SELECT 'pricing_weight_tiers', COUNT(*) FROM pricing_weight_tiers
UNION ALL
SELECT 'pricing_distance_tiers', COUNT(*) FROM pricing_distance_tiers
UNION ALL
SELECT 'pricing_surcharges', COUNT(*) FROM pricing_surcharges
UNION ALL
SELECT 'pricing_zones', COUNT(*) FROM pricing_zones;

-- Check for duplicates
SELECT courier_id, service_level, COUNT(*) 
FROM courier_pricing 
GROUP BY courier_id, service_level 
HAVING COUNT(*) > 1;

-- Test pricing function
SELECT calculate_shipping_price(
  (SELECT courier_id FROM couriers LIMIT 1),
  'standard',
  5.0,
  100,
  '0150',
  '5003',
  ARRAY['fuel']
);
```

---

## 🎯 SUCCESS CRITERIA

Migration is successful if:
- ✅ All 5 migration steps complete
- ✅ No errors in migration log
- ✅ Row counts match expectations
- ✅ No duplicate data
- ✅ Pricing function works correctly
- ✅ Old tables marked as deprecated
- ✅ APIs continue to function

---

## 📞 SUPPORT

**If migration fails:**
1. Check `pricing_migration_log` for errors
2. Review error messages
3. Rollback if necessary
4. Fix issues and re-run

**Common Issues:**
- Missing old tables → Script handles this (skips)
- Duplicate data → Script prevents this
- Data type mismatches → Script handles conversions

---

**Status:** 📋 **READY TO EXECUTE**  
**Risk Level:** 🟢 **LOW** (Safe migration, no data loss)  
**Estimated Time:** 2-5 minutes

**Run the migration script now!** 🚀
