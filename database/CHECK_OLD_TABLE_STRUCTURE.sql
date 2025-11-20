-- ============================================================================
-- CHECK OLD TABLE STRUCTURES
-- Purpose: Discover actual column names in old pricing tables
-- ============================================================================

-- Check courier_base_prices structure
SELECT 
  'courier_base_prices' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_base_prices'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check courier_weight_pricing structure
SELECT 
  'courier_weight_pricing' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_weight_pricing'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check courier_distance_pricing structure
SELECT 
  'courier_distance_pricing' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_distance_pricing'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check courier_surcharge_rules structure
SELECT 
  'courier_surcharge_rules' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'courier_surcharge_rules'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check postal_code_zones structure
SELECT 
  'postal_code_zones' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'postal_code_zones'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample data from each table
DO $$
BEGIN
  RAISE NOTICE '=== SAMPLE DATA FROM OLD TABLES ===';
  RAISE NOTICE '';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_base_prices') THEN
    RAISE NOTICE 'courier_base_prices: % rows', (SELECT COUNT(*) FROM courier_base_prices);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_weight_pricing') THEN
    RAISE NOTICE 'courier_weight_pricing: % rows', (SELECT COUNT(*) FROM courier_weight_pricing);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_distance_pricing') THEN
    RAISE NOTICE 'courier_distance_pricing: % rows', (SELECT COUNT(*) FROM courier_distance_pricing);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_surcharge_rules') THEN
    RAISE NOTICE 'courier_surcharge_rules: % rows', (SELECT COUNT(*) FROM courier_surcharge_rules);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_code_zones') THEN
    RAISE NOTICE 'postal_code_zones: % rows', (SELECT COUNT(*) FROM postal_code_zones);
  END IF;
END $$;
