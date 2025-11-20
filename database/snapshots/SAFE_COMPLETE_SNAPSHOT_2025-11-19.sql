-- ============================================================================
-- SAFE COMPLETE DATABASE SNAPSHOT - NOVEMBER 19, 2025, 9:54 PM
-- Status: Full database backup - only existing tables
-- Purpose: Complete safety checkpoint before Week 3 recovery continues
-- ============================================================================

-- ============================================================================
-- SNAPSHOT METADATA
-- ============================================================================

-- Date: 2025-11-19 21:54:00 UTC+1
-- Type: COMPLETE SNAPSHOT (only existing tables)
-- Milestone: Pricing system deployed and tested
-- Purpose: Safety checkpoint before continuing Week 3 work
-- Backup suffix: _backup_20251119_safe

-- ============================================================================
-- BACKUP EXISTING TABLES ONLY
-- ============================================================================

-- This script uses DO blocks to check if tables exist before backing them up

DO $$
BEGIN
  -- Users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS users_backup_20251119_safe AS SELECT * FROM users';
    RAISE NOTICE 'Backed up: users';
  END IF;

  -- Couriers
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'couriers') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS couriers_backup_20251119_safe AS SELECT * FROM couriers';
    RAISE NOTICE 'Backed up: couriers';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_analytics') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_analytics_backup_20251119_safe AS SELECT * FROM courier_analytics';
    RAISE NOTICE 'Backed up: courier_analytics';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_api_credentials') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_api_credentials_backup_20251119_safe AS SELECT * FROM courier_api_credentials';
    RAISE NOTICE 'Backed up: courier_api_credentials';
  END IF;

  -- Stores
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS stores_backup_20251119_safe AS SELECT * FROM stores';
    RAISE NOTICE 'Backed up: stores';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchantshops') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS merchantshops_backup_20251119_safe AS SELECT * FROM merchantshops';
    RAISE NOTICE 'Backed up: merchantshops';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'merchant_courier_selections') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS merchant_courier_selections_backup_20251119_safe AS SELECT * FROM merchant_courier_selections';
    RAISE NOTICE 'Backed up: merchant_courier_selections';
  END IF;

  -- Orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS orders_backup_20251119_safe AS SELECT * FROM orders';
    RAISE NOTICE 'Backed up: orders';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS order_items_backup_20251119_safe AS SELECT * FROM order_items';
    RAISE NOTICE 'Backed up: order_items';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliveries') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS deliveries_backup_20251119_safe AS SELECT * FROM deliveries';
    RAISE NOTICE 'Backed up: deliveries';
  END IF;

  -- Reviews
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS reviews_backup_20251119_safe AS SELECT * FROM reviews';
    RAISE NOTICE 'Backed up: reviews';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_reviews') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_reviews_backup_20251119_safe AS SELECT * FROM courier_reviews';
    RAISE NOTICE 'Backed up: courier_reviews';
  END IF;

  -- Tracking
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_events') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS tracking_events_backup_20251119_safe AS SELECT * FROM tracking_events';
    RAISE NOTICE 'Backed up: tracking_events';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_tracking_cache') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_tracking_cache_backup_20251119_safe AS SELECT * FROM courier_tracking_cache';
    RAISE NOTICE 'Backed up: courier_tracking_cache';
  END IF;

  -- Analytics
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_analytics') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS platform_analytics_backup_20251119_safe AS SELECT * FROM platform_analytics';
    RAISE NOTICE 'Backed up: platform_analytics';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shopanalyticssnapshots') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS shopanalyticssnapshots_backup_20251119_safe AS SELECT * FROM shopanalyticssnapshots';
    RAISE NOTICE 'Backed up: shopanalyticssnapshots';
  END IF;

  -- Subscriptions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS subscription_plans_backup_20251119_safe AS SELECT * FROM subscription_plans';
    RAISE NOTICE 'Backed up: subscription_plans';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS user_subscriptions_backup_20251119_safe AS SELECT * FROM user_subscriptions';
    RAISE NOTICE 'Backed up: user_subscriptions';
  END IF;

  -- Postal Codes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_codes') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS postal_codes_backup_20251119_safe AS SELECT * FROM postal_codes';
    RAISE NOTICE 'Backed up: postal_codes';
  END IF;

  -- Pricing Tables (NEW - Added Nov 19)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_pricing') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_pricing_backup_20251119_safe AS SELECT * FROM courier_pricing';
    RAISE NOTICE 'Backed up: courier_pricing';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_zones') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS pricing_zones_backup_20251119_safe AS SELECT * FROM pricing_zones';
    RAISE NOTICE 'Backed up: pricing_zones';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_surcharges') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS pricing_surcharges_backup_20251119_safe AS SELECT * FROM pricing_surcharges';
    RAISE NOTICE 'Backed up: pricing_surcharges';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_weight_tiers') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS pricing_weight_tiers_backup_20251119_safe AS SELECT * FROM pricing_weight_tiers';
    RAISE NOTICE 'Backed up: pricing_weight_tiers';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_distance_tiers') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS pricing_distance_tiers_backup_20251119_safe AS SELECT * FROM pricing_distance_tiers';
    RAISE NOTICE 'Backed up: pricing_distance_tiers';
  END IF;

  -- Ranking Tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_ranking_scores') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_ranking_scores_backup_20251119_safe AS SELECT * FROM courier_ranking_scores';
    RAISE NOTICE 'Backed up: courier_ranking_scores';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_ranking_history') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS courier_ranking_history_backup_20251119_safe AS SELECT * FROM courier_ranking_history';
    RAISE NOTICE 'Backed up: courier_ranking_history';
  END IF;

  -- Week 3 Integration Tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'week3_webhooks') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS week3_webhooks_backup_20251119_safe AS SELECT * FROM week3_webhooks';
    RAISE NOTICE 'Backed up: week3_webhooks';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'week3_api_keys') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS week3_api_keys_backup_20251119_safe AS SELECT * FROM week3_api_keys';
    RAISE NOTICE 'Backed up: week3_api_keys';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'week3_integration_events') THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS week3_integration_events_backup_20251119_safe AS SELECT * FROM week3_integration_events';
    RAISE NOTICE 'Backed up: week3_integration_events';
  END IF;

END $$;

-- ============================================================================
-- VERIFICATION AND SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_backup_count INTEGER;
  v_total_rows BIGINT := 0;
  r RECORD;
BEGIN
  -- Count backup tables
  SELECT COUNT(*) INTO v_backup_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE '%_backup_20251119_safe';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE SNAPSHOT VERIFICATION ===';
  RAISE NOTICE 'Total backup tables created: %', v_backup_count;
  RAISE NOTICE '';
  
  -- Show row counts for each backup table
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE '%_backup_20251119_safe'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO v_total_rows;
    RAISE NOTICE '- %: % rows', REPLACE(r.table_name, '_backup_20251119_safe', ''), v_total_rows;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ COMPLETE SNAPSHOT SUCCESSFUL!';
  RAISE NOTICE 'Backup suffix: _backup_20251119_safe';
  RAISE NOTICE 'Safe to proceed with Week 3 recovery work.';
END $$;

-- ============================================================================
-- CLEANUP SCRIPT (Run after Week 3 completion)
-- ============================================================================

/*
TO REMOVE ALL BACKUP TABLES:

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE '%_backup_20251119_safe'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || r.table_name || ' CASCADE';
    RAISE NOTICE 'Dropped: %', r.table_name;
  END LOOP;
  RAISE NOTICE 'All backup tables removed.';
END $$;
*/

-- ============================================================================
-- END OF SAFE COMPLETE SNAPSHOT
-- ============================================================================
