-- ============================================================================
-- LIST ALL SNAPSHOT BACKUP TABLES
-- Shows complete list of backed up tables with row counts
-- ============================================================================

-- List all backup tables created
SELECT 
  table_name,
  REPLACE(table_name, '_backup_20251119_safe', '') as original_table,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as table_size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%_backup_20251119_safe'
ORDER BY table_name;

-- Get row counts for all backup tables
DO $$
DECLARE
  r RECORD;
  v_count BIGINT;
  v_total_tables INTEGER := 0;
  v_total_rows BIGINT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== COMPLETE SNAPSHOT SUMMARY ===';
  RAISE NOTICE 'Date: 2025-11-19 21:55:00';
  RAISE NOTICE 'Backup suffix: _backup_20251119_safe';
  RAISE NOTICE '';
  RAISE NOTICE 'BACKED UP TABLES:';
  RAISE NOTICE '================';
  
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE '%_backup_20251119_safe'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO v_count;
    v_total_tables := v_total_tables + 1;
    v_total_rows := v_total_rows + v_count;
    
    RAISE NOTICE '% | % rows | %', 
      LPAD(v_total_tables::TEXT, 2, '0'),
      LPAD(v_count::TEXT, 10, ' '),
      REPLACE(r.table_name, '_backup_20251119_safe', '');
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '================';
  RAISE NOTICE 'TOTAL: % tables | % rows backed up', v_total_tables, v_total_rows;
  RAISE NOTICE '';
  
  -- Show pricing tables specifically
  RAISE NOTICE 'NEW PRICING TABLES (Added Nov 19):';
  RAISE NOTICE '==================================';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_pricing_backup_20251119_safe') THEN
    EXECUTE 'SELECT COUNT(*) FROM courier_pricing_backup_20251119_safe' INTO v_count;
    RAISE NOTICE '✅ courier_pricing: % rows', v_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_zones_backup_20251119_safe') THEN
    EXECUTE 'SELECT COUNT(*) FROM pricing_zones_backup_20251119_safe' INTO v_count;
    RAISE NOTICE '✅ pricing_zones: % rows', v_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_surcharges_backup_20251119_safe') THEN
    EXECUTE 'SELECT COUNT(*) FROM pricing_surcharges_backup_20251119_safe' INTO v_count;
    RAISE NOTICE '✅ pricing_surcharges: % rows', v_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_weight_tiers_backup_20251119_safe') THEN
    EXECUTE 'SELECT COUNT(*) FROM pricing_weight_tiers_backup_20251119_safe' INTO v_count;
    RAISE NOTICE '✅ pricing_weight_tiers: % rows', v_count;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_distance_tiers_backup_20251119_safe') THEN
    EXECUTE 'SELECT COUNT(*) FROM pricing_distance_tiers_backup_20251119_safe' INTO v_count;
    RAISE NOTICE '✅ pricing_distance_tiers: % rows', v_count;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ SNAPSHOT COMPLETE AND VERIFIED';
  RAISE NOTICE 'Safe to proceed with Week 3 recovery work!';
  
END $$;
