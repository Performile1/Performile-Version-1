-- ============================================================================
-- DATABASE SNAPSHOT - NOVEMBER 19, 2025, 9:49 PM
-- Status: Pricing system deployed and tested
-- Purpose: Backup before continuing Week 3 recovery work
-- ============================================================================

-- ============================================================================
-- SNAPSHOT METADATA
-- ============================================================================

-- Date: 2025-11-19 21:49:00 UTC+1
-- Milestone: Pricing system deployed
-- Tables added: 5 (courier_pricing, pricing_zones, pricing_surcharges, pricing_weight_tiers, pricing_distance_tiers)
-- Functions added: 1 (calculate_shipping_price)
-- Sample data: PostNord pricing (Norway)
-- Status: TESTED AND WORKING

-- ============================================================================
-- TABLE COUNTS (Before Snapshot)
-- ============================================================================

-- Run this to verify current state:
/*
SELECT 'courier_pricing' as table_name, COUNT(*) as row_count FROM courier_pricing
UNION ALL
SELECT 'pricing_zones', COUNT(*) FROM pricing_zones
UNION ALL
SELECT 'pricing_surcharges', COUNT(*) FROM pricing_surcharges
UNION ALL
SELECT 'pricing_weight_tiers', COUNT(*) FROM pricing_weight_tiers
UNION ALL
SELECT 'pricing_distance_tiers', COUNT(*) FROM pricing_distance_tiers
UNION ALL
SELECT 'couriers', COUNT(*) FROM couriers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'users', COUNT(*) FROM users;
*/

-- ============================================================================
-- BACKUP: COURIER_PRICING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_pricing_backup_20251119 AS
SELECT * FROM courier_pricing;

-- ============================================================================
-- BACKUP: PRICING_ZONES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_zones_backup_20251119 AS
SELECT * FROM pricing_zones;

-- ============================================================================
-- BACKUP: PRICING_SURCHARGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_surcharges_backup_20251119 AS
SELECT * FROM pricing_surcharges;

-- ============================================================================
-- BACKUP: PRICING_WEIGHT_TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_weight_tiers_backup_20251119 AS
SELECT * FROM pricing_weight_tiers;

-- ============================================================================
-- BACKUP: PRICING_DISTANCE_TIERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_distance_tiers_backup_20251119 AS
SELECT * FROM pricing_distance_tiers;

-- ============================================================================
-- BACKUP: CALCULATE_SHIPPING_PRICE FUNCTION
-- ============================================================================

-- Function definition backed up in: database/functions/calculate_shipping_price.sql
-- To restore: Run the file again

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '=== SNAPSHOT VERIFICATION ===';
  RAISE NOTICE 'Backup tables created:';
  RAISE NOTICE '- courier_pricing_backup_20251119: % rows', (SELECT COUNT(*) FROM courier_pricing_backup_20251119);
  RAISE NOTICE '- pricing_zones_backup_20251119: % rows', (SELECT COUNT(*) FROM pricing_zones_backup_20251119);
  RAISE NOTICE '- pricing_surcharges_backup_20251119: % rows', (SELECT COUNT(*) FROM pricing_surcharges_backup_20251119);
  RAISE NOTICE '- pricing_weight_tiers_backup_20251119: % rows', (SELECT COUNT(*) FROM pricing_weight_tiers_backup_20251119);
  RAISE NOTICE '- pricing_distance_tiers_backup_20251119: % rows', (SELECT COUNT(*) FROM pricing_distance_tiers_backup_20251119);
  RAISE NOTICE 'Snapshot complete!';
END $$;

-- ============================================================================
-- RESTORE INSTRUCTIONS
-- ============================================================================

/*
To restore from this snapshot:

1. Drop current tables:
   DROP TABLE IF EXISTS pricing_distance_tiers CASCADE;
   DROP TABLE IF EXISTS pricing_weight_tiers CASCADE;
   DROP TABLE IF EXISTS pricing_surcharges CASCADE;
   DROP TABLE IF EXISTS pricing_zones CASCADE;
   DROP TABLE IF EXISTS courier_pricing CASCADE;

2. Restore from backup:
   CREATE TABLE courier_pricing AS SELECT * FROM courier_pricing_backup_20251119;
   CREATE TABLE pricing_zones AS SELECT * FROM pricing_zones_backup_20251119;
   CREATE TABLE pricing_surcharges AS SELECT * FROM pricing_surcharges_backup_20251119;
   CREATE TABLE pricing_weight_tiers AS SELECT * FROM pricing_weight_tiers_backup_20251119;
   CREATE TABLE pricing_distance_tiers AS SELECT * FROM pricing_distance_tiers_backup_20251119;

3. Recreate indexes and RLS policies:
   Run: database/DEPLOY_PRICING_SIMPLE.sql (only the CREATE INDEX and ALTER TABLE sections)

4. Restore function:
   Run: database/DEPLOY_PRICING_FUNCTION.sql
*/

-- ============================================================================
-- SNAPSHOT SUMMARY
-- ============================================================================

/*
WHAT'S INCLUDED IN THIS SNAPSHOT:
✅ All pricing tables (5 tables)
✅ PostNord sample data (2 pricing levels, 7 zones, 3 surcharges, 9 weight tiers, 6 distance tiers)
✅ Function definition (backed up in separate file)
✅ Verification queries

WHAT'S NOT INCLUDED:
- Core tables (couriers, orders, users, etc.) - unchanged
- Other functions - unchanged
- API endpoints - not in database

NEXT STEPS AFTER SNAPSHOT:
1. Continue with dynamic ranking system
2. Implement shipment booking
3. Add label generation
4. Complete Week 3 recovery

RESTORE POINT:
If anything goes wrong, run the restore instructions above to return to this state.
*/

-- ============================================================================
-- END OF SNAPSHOT
-- ============================================================================
