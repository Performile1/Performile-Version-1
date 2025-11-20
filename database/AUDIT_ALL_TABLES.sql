-- ============================================================================
-- COMPLETE TABLE AUDIT - ALL 139 TABLES
-- Purpose: List all tables and compare against expected schema
-- Date: November 19, 2025
-- ============================================================================

-- ============================================================================
-- PART 1: LIST ALL TABLES WITH DETAILS
-- ============================================================================

SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
  (SELECT COUNT(*) 
   FROM information_schema.columns 
   WHERE table_name = t.table_name 
     AND table_schema = 'public') as column_count,
  CASE 
    WHEN table_name LIKE '%backup%' THEN '📦 Backup'
    WHEN table_name LIKE 'pricing%' THEN '💰 Pricing (NEW)'
    WHEN table_name LIKE 'courier%' THEN '🚚 Courier'
    WHEN table_name LIKE 'merchant%' OR table_name LIKE 'store%' THEN '🏪 Merchant/Store'
    WHEN table_name LIKE 'order%' OR table_name LIKE 'delivery%' THEN '📦 Orders'
    WHEN table_name LIKE 'user%' OR table_name LIKE 'auth%' THEN '👤 Users/Auth'
    WHEN table_name LIKE 'subscription%' OR table_name LIKE 'payment%' THEN '💳 Subscriptions'
    WHEN table_name LIKE 'review%' OR table_name LIKE 'rating%' THEN '⭐ Reviews'
    WHEN table_name LIKE 'tracking%' THEN '📍 Tracking'
    WHEN table_name LIKE 'analytics%' OR table_name LIKE 'metric%' THEN '📊 Analytics'
    WHEN table_name LIKE 'postal%' OR table_name LIKE 'address%' THEN '📮 Postal/Address'
    WHEN table_name LIKE 'webhook%' OR table_name LIKE 'integration%' THEN '🔗 Integrations'
    WHEN table_name LIKE 'week3%' THEN '🆕 Week 3'
    ELSE '📋 Other'
  END as category
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN table_name LIKE '%backup%' THEN 9
    WHEN table_name LIKE 'pricing%' THEN 1
    WHEN table_name LIKE 'courier%' THEN 2
    WHEN table_name LIKE 'order%' THEN 3
    WHEN table_name LIKE 'user%' THEN 4
    ELSE 5
  END,
  table_name;

-- ============================================================================
-- PART 2: SUMMARY BY CATEGORY
-- ============================================================================

DO $$
DECLARE
  v_total INTEGER;
  v_backup INTEGER;
  v_pricing INTEGER;
  v_courier INTEGER;
  v_merchant INTEGER;
  v_order INTEGER;
  v_user INTEGER;
  v_subscription INTEGER;
  v_review INTEGER;
  v_tracking INTEGER;
  v_analytics INTEGER;
  v_postal INTEGER;
  v_integration INTEGER;
  v_week3 INTEGER;
  v_other INTEGER;
BEGIN
  -- Count total tables
  SELECT COUNT(*) INTO v_total
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count by category
  SELECT COUNT(*) INTO v_backup FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%backup%';
  SELECT COUNT(*) INTO v_pricing FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'pricing%' AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_courier FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'courier%' AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_merchant FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'merchant%' OR table_name LIKE 'store%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_order FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'order%' OR table_name LIKE 'delivery%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_user FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'user%' OR table_name LIKE 'auth%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_subscription FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'subscription%' OR table_name LIKE 'payment%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_review FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'review%' OR table_name LIKE 'rating%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_tracking FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'tracking%' AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_analytics FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'analytics%' OR table_name LIKE 'metric%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_postal FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'postal%' OR table_name LIKE 'address%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_integration FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE 'webhook%' OR table_name LIKE 'integration%') AND table_name NOT LIKE '%backup%';
  SELECT COUNT(*) INTO v_week3 FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'week3%' AND table_name NOT LIKE '%backup%';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== DATABASE TABLE AUDIT ===';
  RAISE NOTICE 'Date: 2025-11-19 21:58:00';
  RAISE NOTICE '';
  RAISE NOTICE 'TOTAL TABLES: %', v_total;
  RAISE NOTICE '';
  RAISE NOTICE 'BY CATEGORY:';
  RAISE NOTICE '============';
  RAISE NOTICE '💰 Pricing (NEW):        % tables', v_pricing;
  RAISE NOTICE '🚚 Courier:              % tables', v_courier;
  RAISE NOTICE '🏪 Merchant/Store:       % tables', v_merchant;
  RAISE NOTICE '📦 Orders/Delivery:      % tables', v_order;
  RAISE NOTICE '👤 Users/Auth:           % tables', v_user;
  RAISE NOTICE '💳 Subscriptions:        % tables', v_subscription;
  RAISE NOTICE '⭐ Reviews/Ratings:      % tables', v_review;
  RAISE NOTICE '📍 Tracking:             % tables', v_tracking;
  RAISE NOTICE '📊 Analytics:            % tables', v_analytics;
  RAISE NOTICE '📮 Postal/Address:       % tables', v_postal;
  RAISE NOTICE '🔗 Integrations:         % tables', v_integration;
  RAISE NOTICE '🆕 Week 3:               % tables', v_week3;
  RAISE NOTICE '📦 Backup Tables:        % tables', v_backup;
  RAISE NOTICE '';
  
  -- Show new pricing tables specifically
  RAISE NOTICE 'NEW PRICING TABLES (Added Nov 19, 2025):';
  RAISE NOTICE '========================================';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_pricing') THEN
    RAISE NOTICE '✅ courier_pricing';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_zones') THEN
    RAISE NOTICE '✅ pricing_zones';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_surcharges') THEN
    RAISE NOTICE '✅ pricing_surcharges';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_weight_tiers') THEN
    RAISE NOTICE '✅ pricing_weight_tiers';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_distance_tiers') THEN
    RAISE NOTICE '✅ pricing_distance_tiers';
  END IF;
  RAISE NOTICE '';
  
END $$;

-- ============================================================================
-- PART 3: EXPECTED VS ACTUAL TABLES
-- ============================================================================

DO $$
DECLARE
  v_expected TEXT[] := ARRAY[
    -- Core Platform (Expected from docs)
    'users', 'couriers', 'stores', 'merchantshops', 'orders', 'deliveries',
    'reviews', 'courier_reviews', 'tracking_events', 'postal_codes',
    'courier_analytics', 'platform_analytics', 'shopanalyticssnapshots',
    'subscription_plans', 'user_subscriptions', 'courier_api_credentials',
    'merchant_courier_selections', 'courier_tracking_cache',
    
    -- Pricing System (NEW - Nov 19)
    'courier_pricing', 'pricing_zones', 'pricing_surcharges', 
    'pricing_weight_tiers', 'pricing_distance_tiers',
    
    -- Ranking System (Expected)
    'courier_ranking_scores', 'courier_ranking_history',
    
    -- Week 3 Integrations (Expected)
    'week3_webhooks', 'week3_api_keys', 'week3_integration_events'
  ];
  v_table TEXT;
  v_exists BOOLEAN;
  v_missing INTEGER := 0;
  v_found INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== EXPECTED TABLES CHECK ===';
  RAISE NOTICE '';
  RAISE NOTICE 'CORE PLATFORM TABLES:';
  RAISE NOTICE '=====================';
  
  FOREACH v_table IN ARRAY v_expected
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = v_table
    ) INTO v_exists;
    
    IF v_exists THEN
      RAISE NOTICE '✅ %', v_table;
      v_found := v_found + 1;
    ELSE
      RAISE NOTICE '❌ % (MISSING)', v_table;
      v_missing := v_missing + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'SUMMARY:';
  RAISE NOTICE '========';
  RAISE NOTICE 'Expected tables: %', array_length(v_expected, 1);
  RAISE NOTICE 'Found: %', v_found;
  RAISE NOTICE 'Missing: %', v_missing;
  RAISE NOTICE '';
  
  IF v_missing = 0 THEN
    RAISE NOTICE '✅ All expected tables exist!';
  ELSE
    RAISE NOTICE '⚠️  Some expected tables are missing';
  END IF;
  
END $$;

-- ============================================================================
-- PART 4: EXPORT TABLE LIST TO CSV FORMAT
-- ============================================================================

-- Uncomment to get CSV format for documentation:
/*
COPY (
  SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as columns
  FROM information_schema.tables t
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '%backup%'
  ORDER BY table_name
) TO '/tmp/all_tables.csv' WITH CSV HEADER;
*/
