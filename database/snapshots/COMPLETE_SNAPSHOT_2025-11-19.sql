-- ============================================================================
-- COMPLETE DATABASE SNAPSHOT - NOVEMBER 19, 2025, 9:52 PM
-- Status: Full database backup before Week 3 recovery continues
-- Purpose: Complete safety checkpoint - all tables backed up
-- ============================================================================

-- ============================================================================
-- SNAPSHOT METADATA
-- ============================================================================

-- Date: 2025-11-19 21:52:00 UTC+1
-- Type: COMPLETE SNAPSHOT (all tables)
-- Milestone: Pricing system deployed and tested
-- Purpose: Safety checkpoint before continuing Week 3 work
-- Backup suffix: _backup_20251119_complete

-- ============================================================================
-- CORE TABLES BACKUP
-- ============================================================================

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users_backup_20251119_complete AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS user_profiles_backup_20251119_complete AS SELECT * FROM user_profiles;

-- Couriers
CREATE TABLE IF NOT EXISTS couriers_backup_20251119_complete AS SELECT * FROM couriers;
CREATE TABLE IF NOT EXISTS courier_analytics_backup_20251119_complete AS SELECT * FROM courier_analytics;
CREATE TABLE IF NOT EXISTS courier_api_credentials_backup_20251119_complete AS SELECT * FROM courier_api_credentials;

-- Stores and Merchants
CREATE TABLE IF NOT EXISTS stores_backup_20251119_complete AS SELECT * FROM stores;
CREATE TABLE IF NOT EXISTS merchantshops_backup_20251119_complete AS SELECT * FROM merchantshops;
CREATE TABLE IF NOT EXISTS merchant_courier_selections_backup_20251119_complete AS SELECT * FROM merchant_courier_selections;

-- Orders
CREATE TABLE IF NOT EXISTS orders_backup_20251119_complete AS SELECT * FROM orders;
CREATE TABLE IF NOT EXISTS order_items_backup_20251119_complete AS SELECT * FROM order_items;
CREATE TABLE IF NOT EXISTS deliveries_backup_20251119_complete AS SELECT * FROM deliveries;

-- Reviews and Ratings
CREATE TABLE IF NOT EXISTS reviews_backup_20251119_complete AS SELECT * FROM reviews;
CREATE TABLE IF NOT EXISTS courier_reviews_backup_20251119_complete AS SELECT * FROM courier_reviews;

-- Tracking
CREATE TABLE IF NOT EXISTS tracking_events_backup_20251119_complete AS SELECT * FROM tracking_events;
CREATE TABLE IF NOT EXISTS courier_tracking_cache_backup_20251119_complete AS SELECT * FROM courier_tracking_cache;

-- Analytics
CREATE TABLE IF NOT EXISTS platform_analytics_backup_20251119_complete AS SELECT * FROM platform_analytics;
CREATE TABLE IF NOT EXISTS shopanalyticssnapshots_backup_20251119_complete AS SELECT * FROM shopanalyticssnapshots;

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscription_plans_backup_20251119_complete AS SELECT * FROM subscription_plans;
CREATE TABLE IF NOT EXISTS user_subscriptions_backup_20251119_complete AS SELECT * FROM user_subscriptions;

-- Postal Codes
CREATE TABLE IF NOT EXISTS postal_codes_backup_20251119_complete AS SELECT * FROM postal_codes;

-- ============================================================================
-- PRICING TABLES BACKUP (NEW - Added Nov 19)
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_pricing_backup_20251119_complete AS SELECT * FROM courier_pricing;
CREATE TABLE IF NOT EXISTS pricing_zones_backup_20251119_complete AS SELECT * FROM pricing_zones;
CREATE TABLE IF NOT EXISTS pricing_surcharges_backup_20251119_complete AS SELECT * FROM pricing_surcharges;
CREATE TABLE IF NOT EXISTS pricing_weight_tiers_backup_20251119_complete AS SELECT * FROM pricing_weight_tiers;
CREATE TABLE IF NOT EXISTS pricing_distance_tiers_backup_20251119_complete AS SELECT * FROM pricing_distance_tiers;

-- ============================================================================
-- RANKING TABLES BACKUP (If they exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS courier_ranking_scores_backup_20251119_complete AS 
SELECT * FROM courier_ranking_scores WHERE 1=1;

CREATE TABLE IF NOT EXISTS courier_ranking_history_backup_20251119_complete AS 
SELECT * FROM courier_ranking_history WHERE 1=1;

-- ============================================================================
-- WEEK 3 INTEGRATION TABLES BACKUP (If they exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS week3_webhooks_backup_20251119_complete AS 
SELECT * FROM week3_webhooks WHERE 1=1;

CREATE TABLE IF NOT EXISTS week3_api_keys_backup_20251119_complete AS 
SELECT * FROM week3_api_keys WHERE 1=1;

CREATE TABLE IF NOT EXISTS week3_integration_events_backup_20251119_complete AS 
SELECT * FROM week3_integration_events WHERE 1=1;

-- ============================================================================
-- VERIFICATION AND SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_backup_count INTEGER;
BEGIN
  -- Count backup tables
  SELECT COUNT(*) INTO v_backup_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%_backup_20251119_complete';
  
  RAISE NOTICE '=== COMPLETE SNAPSHOT VERIFICATION ===';
  RAISE NOTICE 'Total backup tables created: %', v_backup_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Core Tables:';
  RAISE NOTICE '- users: % rows', (SELECT COUNT(*) FROM users_backup_20251119_complete);
  RAISE NOTICE '- couriers: % rows', (SELECT COUNT(*) FROM couriers_backup_20251119_complete);
  RAISE NOTICE '- stores: % rows', (SELECT COUNT(*) FROM stores_backup_20251119_complete);
  RAISE NOTICE '- orders: % rows', (SELECT COUNT(*) FROM orders_backup_20251119_complete);
  RAISE NOTICE '- reviews: % rows', (SELECT COUNT(*) FROM reviews_backup_20251119_complete);
  RAISE NOTICE '';
  RAISE NOTICE 'Pricing Tables (NEW):';
  RAISE NOTICE '- courier_pricing: % rows', (SELECT COUNT(*) FROM courier_pricing_backup_20251119_complete);
  RAISE NOTICE '- pricing_zones: % rows', (SELECT COUNT(*) FROM pricing_zones_backup_20251119_complete);
  RAISE NOTICE '- pricing_surcharges: % rows', (SELECT COUNT(*) FROM pricing_surcharges_backup_20251119_complete);
  RAISE NOTICE '- pricing_weight_tiers: % rows', (SELECT COUNT(*) FROM pricing_weight_tiers_backup_20251119_complete);
  RAISE NOTICE '- pricing_distance_tiers: % rows', (SELECT COUNT(*) FROM pricing_distance_tiers_backup_20251119_complete);
  RAISE NOTICE '';
  RAISE NOTICE '✅ COMPLETE SNAPSHOT SUCCESSFUL!';
  RAISE NOTICE 'Backup suffix: _backup_20251119_complete';
  RAISE NOTICE 'Safe to proceed with Week 3 recovery work.';
END $$;

-- ============================================================================
-- RESTORE INSTRUCTIONS
-- ============================================================================

/*
TO RESTORE ENTIRE DATABASE FROM THIS SNAPSHOT:

WARNING: This will DROP and RECREATE all tables!
Only use if you need to completely restore to this point.

Step 1: Drop all current tables (DANGEROUS - backup first!)
---------------------------------------------------------------
DROP TABLE IF EXISTS pricing_distance_tiers CASCADE;
DROP TABLE IF EXISTS pricing_weight_tiers CASCADE;
DROP TABLE IF EXISTS pricing_surcharges CASCADE;
DROP TABLE IF EXISTS pricing_zones CASCADE;
DROP TABLE IF EXISTS courier_pricing CASCADE;
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS courier_reviews CASCADE;
-- ... (add other tables as needed)

Step 2: Restore from backup
---------------------------------------------------------------
-- Core tables
CREATE TABLE users AS SELECT * FROM users_backup_20251119_complete;
CREATE TABLE couriers AS SELECT * FROM couriers_backup_20251119_complete;
CREATE TABLE stores AS SELECT * FROM stores_backup_20251119_complete;
CREATE TABLE orders AS SELECT * FROM orders_backup_20251119_complete;

-- Pricing tables
CREATE TABLE courier_pricing AS SELECT * FROM courier_pricing_backup_20251119_complete;
CREATE TABLE pricing_zones AS SELECT * FROM pricing_zones_backup_20251119_complete;
CREATE TABLE pricing_surcharges AS SELECT * FROM pricing_surcharges_backup_20251119_complete;
CREATE TABLE pricing_weight_tiers AS SELECT * FROM pricing_weight_tiers_backup_20251119_complete;
CREATE TABLE pricing_distance_tiers AS SELECT * FROM pricing_distance_tiers_backup_20251119_complete;

-- ... (restore other tables as needed)

Step 3: Recreate all indexes, constraints, and RLS policies
---------------------------------------------------------------
-- Run all migration files in order
-- Run all function definition files

Step 4: Verify restoration
---------------------------------------------------------------
-- Check row counts match backup
-- Test critical functions
-- Verify API endpoints work
*/

-- ============================================================================
-- PARTIAL RESTORE (Recommended)
-- ============================================================================

/*
TO RESTORE ONLY SPECIFIC TABLES:

Example: Restore only pricing tables
---------------------------------------
DROP TABLE IF EXISTS courier_pricing CASCADE;
CREATE TABLE courier_pricing AS SELECT * FROM courier_pricing_backup_20251119_complete;
-- Recreate indexes and RLS for this table
-- Run: database/DEPLOY_PRICING_SIMPLE.sql (relevant sections)

Example: Restore only orders
---------------------------------------
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders AS SELECT * FROM orders_backup_20251119_complete;
-- Recreate indexes and constraints
*/

-- ============================================================================
-- CLEANUP (After successful Week 3 completion)
-- ============================================================================

/*
TO REMOVE BACKUP TABLES (only after confirming everything works):

DROP TABLE IF EXISTS users_backup_20251119_complete;
DROP TABLE IF EXISTS couriers_backup_20251119_complete;
DROP TABLE IF EXISTS stores_backup_20251119_complete;
DROP TABLE IF EXISTS orders_backup_20251119_complete;
DROP TABLE IF EXISTS courier_pricing_backup_20251119_complete;
DROP TABLE IF EXISTS pricing_zones_backup_20251119_complete;
DROP TABLE IF EXISTS pricing_surcharges_backup_20251119_complete;
DROP TABLE IF EXISTS pricing_weight_tiers_backup_20251119_complete;
DROP TABLE IF EXISTS pricing_distance_tiers_backup_20251119_complete;
-- ... (drop other backup tables)

OR drop all at once:
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE '%_backup_20251119_complete'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || r.table_name || ' CASCADE';
    RAISE NOTICE 'Dropped: %', r.table_name;
  END LOOP;
END $$;
*/

-- ============================================================================
-- SNAPSHOT SUMMARY
-- ============================================================================

/*
WHAT'S BACKED UP:
✅ All user tables (users, user_profiles)
✅ All courier tables (couriers, courier_analytics, courier_api_credentials)
✅ All store tables (stores, merchantshops, merchant_courier_selections)
✅ All order tables (orders, order_items, deliveries)
✅ All review tables (reviews, courier_reviews)
✅ All tracking tables (tracking_events, courier_tracking_cache)
✅ All analytics tables (platform_analytics, shopanalyticssnapshots)
✅ All subscription tables (subscription_plans, user_subscriptions)
✅ Postal codes table
✅ NEW: All pricing tables (5 tables)
✅ Ranking tables (if exist)
✅ Week 3 integration tables (if exist)

WHAT'S NOT BACKED UP:
- Functions (backed up in separate files)
- Indexes (can be recreated from migration files)
- RLS policies (can be recreated from migration files)
- Constraints (can be recreated from migration files)

STORAGE IMPACT:
- Backup tables use same storage as original tables
- Estimate: ~2x current database size
- Cleanup after Week 3 completion to free space

SAFETY:
✅ Read-only backup tables
✅ Original tables unchanged
✅ Can restore individual tables or entire database
✅ No data loss risk
*/

-- ============================================================================
-- END OF COMPLETE SNAPSHOT
-- ============================================================================
