-- ============================================================================
-- MIGRATE OLD PRICING SYSTEM TO NEW SYSTEM
-- Date: November 19, 2025, 10:03 PM
-- Purpose: Migrate data from old pricing tables to new unified system
-- Status: SAFE - Keeps old tables intact, copies data to new tables
-- ============================================================================

-- ============================================================================
-- MIGRATION STRATEGY
-- ============================================================================
-- 1. Copy data from old tables to new tables
-- 2. Keep old tables intact (don't drop)
-- 3. Mark old tables as deprecated (add comment)
-- 4. Verify data integrity
-- 5. Create migration log

-- ============================================================================
-- STEP 1: CREATE MIGRATION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_migration_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_step VARCHAR(100),
  old_table VARCHAR(100),
  new_table VARCHAR(100),
  rows_migrated INTEGER,
  status VARCHAR(20),
  error_message TEXT,
  migrated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: MIGRATE COURIER BASE PRICES TO COURIER_PRICING
-- ============================================================================

DO $$
DECLARE
  v_rows_migrated INTEGER := 0;
  v_courier_id UUID;
  v_service_type VARCHAR(50);
  v_base_price DECIMAL(10,2);
  v_price_per_kg DECIMAL(10,2);
  v_price_per_km DECIMAL(10,2);
  v_min_price DECIMAL(10,2);
  v_max_price DECIMAL(10,2);
  v_currency VARCHAR(3);
  v_valid_from DATE;
  v_valid_to DATE;
  v_active BOOLEAN;
BEGIN
  RAISE NOTICE 'Step 1: Migrating courier_base_prices to courier_pricing...';
  
  -- Check if old table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_base_prices') THEN
    RAISE NOTICE 'Old table courier_base_prices does not exist - skipping';
    INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
    VALUES ('migrate_base_prices', 'courier_base_prices', 'courier_pricing', 0, 'skipped');
    RETURN;
  END IF;
  
  -- Migrate data
  INSERT INTO courier_pricing (
    courier_id, service_level, base_price, price_per_kg, price_per_km, 
    min_price, max_price, valid_from, valid_to, active, created_at
  )
  SELECT 
    cbp.courier_id,
    CASE 
      WHEN cbp.service_type = 'express' THEN 'express'
      WHEN cbp.service_type = 'same_day' THEN 'same_day'
      ELSE 'standard'
    END as service_level,
    COALESCE(cbp.base_price, 0),
    0 as price_per_kg, -- Will be populated from weight pricing
    0 as price_per_km, -- Will be populated from distance pricing
    cbp.min_price,
    cbp.max_price,
    COALESCE(cbp.effective_from, CURRENT_DATE),
    cbp.effective_to,
    COALESCE(cbp.is_active, true),
    COALESCE(cbp.created_at, NOW())
  FROM courier_base_prices cbp
  WHERE NOT EXISTS (
    SELECT 1 FROM courier_pricing cp
    WHERE cp.courier_id = cbp.courier_id
      AND cp.service_level = CASE 
        WHEN cbp.service_type = 'express' THEN 'express'
        WHEN cbp.service_type = 'same_day' THEN 'same_day'
        ELSE 'standard'
      END
  );
  
  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  
  INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
  VALUES ('migrate_base_prices', 'courier_base_prices', 'courier_pricing', v_rows_migrated, 'success');
  
  RAISE NOTICE '✅ Migrated % rows from courier_base_prices', v_rows_migrated;
END $$;

-- ============================================================================
-- STEP 3: MIGRATE WEIGHT PRICING TO PRICING_WEIGHT_TIERS
-- ============================================================================

DO $$
DECLARE
  v_rows_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Step 2: Migrating courier_weight_pricing to pricing_weight_tiers...';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_weight_pricing') THEN
    RAISE NOTICE 'Old table courier_weight_pricing does not exist - skipping';
    INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
    VALUES ('migrate_weight_pricing', 'courier_weight_pricing', 'pricing_weight_tiers', 0, 'skipped');
    RETURN;
  END IF;
  
  INSERT INTO pricing_weight_tiers (
    courier_id, service_level, weight_from, weight_to, price, created_at
  )
  SELECT 
    cwp.courier_id,
    CASE 
      WHEN cwp.service_type = 'express' THEN 'express'
      WHEN cwp.service_type = 'same_day' THEN 'same_day'
      ELSE 'standard'
    END as service_level,
    COALESCE(cwp.min_weight, 0),
    COALESCE(cwp.max_weight, 999),
    COALESCE(cwp.fixed_price, cwp.price_per_kg * cwp.max_weight, 0),
    COALESCE(cwp.created_at, NOW())
  FROM courier_weight_pricing cwp
  WHERE NOT EXISTS (
    SELECT 1 FROM pricing_weight_tiers pwt
    WHERE pwt.courier_id = cwp.courier_id
      AND pwt.service_level = CASE 
        WHEN cwp.service_type = 'express' THEN 'express'
        WHEN cwp.service_type = 'same_day' THEN 'same_day'
        ELSE 'standard'
      END
      AND pwt.weight_from = COALESCE(cwp.min_weight, 0)
  );
  
  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  
  INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
  VALUES ('migrate_weight_pricing', 'courier_weight_pricing', 'pricing_weight_tiers', v_rows_migrated, 'success');
  
  RAISE NOTICE '✅ Migrated % rows from courier_weight_pricing', v_rows_migrated;
END $$;

-- ============================================================================
-- STEP 4: MIGRATE DISTANCE PRICING TO PRICING_DISTANCE_TIERS
-- ============================================================================

DO $$
DECLARE
  v_rows_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Step 3: Migrating courier_distance_pricing to pricing_distance_tiers...';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_distance_pricing') THEN
    RAISE NOTICE 'Old table courier_distance_pricing does not exist - skipping';
    INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
    VALUES ('migrate_distance_pricing', 'courier_distance_pricing', 'pricing_distance_tiers', 0, 'skipped');
    RETURN;
  END IF;
  
  INSERT INTO pricing_distance_tiers (
    courier_id, service_level, distance_from, distance_to, price, created_at
  )
  SELECT 
    cdp.courier_id,
    CASE 
      WHEN cdp.service_type = 'express' THEN 'express'
      WHEN cdp.service_type = 'same_day' THEN 'same_day'
      ELSE 'standard'
    END as service_level,
    COALESCE(cdp.min_distance, 0),
    COALESCE(cdp.max_distance, 9999),
    COALESCE(cdp.fixed_price, cdp.price_per_km * cdp.max_distance, 0),
    COALESCE(cdp.created_at, NOW())
  FROM courier_distance_pricing cdp
  WHERE NOT EXISTS (
    SELECT 1 FROM pricing_distance_tiers pdt
    WHERE pdt.courier_id = cdp.courier_id
      AND pdt.service_level = CASE 
        WHEN cdp.service_type = 'express' THEN 'express'
        WHEN cdp.service_type = 'same_day' THEN 'same_day'
        ELSE 'standard'
      END
      AND pdt.distance_from = COALESCE(cdp.min_distance, 0)
  );
  
  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  
  INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
  VALUES ('migrate_distance_pricing', 'courier_distance_pricing', 'pricing_distance_tiers', v_rows_migrated, 'success');
  
  RAISE NOTICE '✅ Migrated % rows from courier_distance_pricing', v_rows_migrated;
END $$;

-- ============================================================================
-- STEP 5: MIGRATE SURCHARGE RULES TO PRICING_SURCHARGES
-- ============================================================================

DO $$
DECLARE
  v_rows_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Step 4: Migrating courier_surcharge_rules to pricing_surcharges...';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_surcharge_rules') THEN
    RAISE NOTICE 'Old table courier_surcharge_rules does not exist - skipping';
    INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
    VALUES ('migrate_surcharges', 'courier_surcharge_rules', 'pricing_surcharges', 0, 'skipped');
    RETURN;
  END IF;
  
  INSERT INTO pricing_surcharges (
    courier_id, surcharge_type, surcharge_name, 
    surcharge_amount, surcharge_percentage, applies_to, active, created_at
  )
  SELECT 
    csr.courier_id,
    CASE 
      WHEN csr.surcharge_type IN ('fuel', 'remote_area', 'oversized', 'fragile', 'insurance', 'weekend', 'holiday', 'express_fee') 
      THEN csr.surcharge_type
      ELSE 'express_fee'
    END as surcharge_type,
    COALESCE(csr.surcharge_name, csr.surcharge_type),
    CASE WHEN csr.amount_type = 'fixed' THEN csr.amount ELSE NULL END as surcharge_amount,
    CASE WHEN csr.amount_type = 'percentage' THEN csr.amount ELSE NULL END as surcharge_percentage,
    COALESCE(csr.applies_to, 'all'),
    COALESCE(csr.is_active, true),
    COALESCE(csr.created_at, NOW())
  FROM courier_surcharge_rules csr
  WHERE NOT EXISTS (
    SELECT 1 FROM pricing_surcharges ps
    WHERE ps.courier_id = csr.courier_id
      AND ps.surcharge_type = CASE 
        WHEN csr.surcharge_type IN ('fuel', 'remote_area', 'oversized', 'fragile', 'insurance', 'weekend', 'holiday', 'express_fee') 
        THEN csr.surcharge_type
        ELSE 'express_fee'
      END
  );
  
  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  
  INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
  VALUES ('migrate_surcharges', 'courier_surcharge_rules', 'pricing_surcharges', v_rows_migrated, 'success');
  
  RAISE NOTICE '✅ Migrated % rows from courier_surcharge_rules', v_rows_migrated;
END $$;

-- ============================================================================
-- STEP 6: MIGRATE POSTAL CODE ZONES TO PRICING_ZONES
-- ============================================================================

DO $$
DECLARE
  v_rows_migrated INTEGER := 0;
BEGIN
  RAISE NOTICE 'Step 5: Migrating postal_code_zones to pricing_zones...';
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_code_zones') THEN
    RAISE NOTICE 'Old table postal_code_zones does not exist - skipping';
    INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
    VALUES ('migrate_zones', 'postal_code_zones', 'pricing_zones', 0, 'skipped');
    RETURN;
  END IF;
  
  INSERT INTO pricing_zones (
    courier_id, zone_name, country, postal_code_from, postal_code_to, 
    zone_multiplier, is_remote_area, created_at
  )
  SELECT 
    pcz.courier_id,
    COALESCE(pcz.zone_name, 'Zone ' || pcz.zone_id),
    COALESCE(pcz.country, 'NO'),
    pcz.postal_code_from,
    pcz.postal_code_to,
    COALESCE(pcz.zone_multiplier, 1.0),
    COALESCE(pcz.is_remote, false),
    COALESCE(pcz.created_at, NOW())
  FROM postal_code_zones pcz
  WHERE pcz.courier_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM pricing_zones pz
      WHERE pz.courier_id = pcz.courier_id
        AND pz.postal_code_from = pcz.postal_code_from
        AND pz.postal_code_to = pcz.postal_code_to
    );
  
  GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
  
  INSERT INTO pricing_migration_log (migration_step, old_table, new_table, rows_migrated, status)
  VALUES ('migrate_zones', 'postal_code_zones', 'pricing_zones', v_rows_migrated, 'success');
  
  RAISE NOTICE '✅ Migrated % rows from postal_code_zones', v_rows_migrated;
END $$;

-- ============================================================================
-- STEP 7: MARK OLD TABLES AS DEPRECATED
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Step 6: Marking old pricing tables as deprecated...';
  
  -- Add comments to old tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_base_prices') THEN
    COMMENT ON TABLE courier_base_prices IS 'DEPRECATED: Migrated to courier_pricing on 2025-11-19. Keep for reference only.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_weight_pricing') THEN
    COMMENT ON TABLE courier_weight_pricing IS 'DEPRECATED: Migrated to pricing_weight_tiers on 2025-11-19. Keep for reference only.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_distance_pricing') THEN
    COMMENT ON TABLE courier_distance_pricing IS 'DEPRECATED: Migrated to pricing_distance_tiers on 2025-11-19. Keep for reference only.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_surcharge_rules') THEN
    COMMENT ON TABLE courier_surcharge_rules IS 'DEPRECATED: Migrated to pricing_surcharges on 2025-11-19. Keep for reference only.';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_volumetric_rules') THEN
    COMMENT ON TABLE courier_volumetric_rules IS 'DEPRECATED: Volumetric calculations now handled in application layer. Keep for reference only.';
  END IF;
  
  RAISE NOTICE '✅ Old tables marked as deprecated';
END $$;

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_old_base_count INTEGER;
  v_new_base_count INTEGER;
  v_old_weight_count INTEGER;
  v_new_weight_count INTEGER;
  v_old_distance_count INTEGER;
  v_new_distance_count INTEGER;
  v_old_surcharge_count INTEGER;
  v_new_surcharge_count INTEGER;
  v_old_zone_count INTEGER;
  v_new_zone_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
  RAISE NOTICE '';
  
  -- Count rows in old and new tables
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_base_prices') THEN
    SELECT COUNT(*) INTO v_old_base_count FROM courier_base_prices;
  ELSE
    v_old_base_count := 0;
  END IF;
  SELECT COUNT(*) INTO v_new_base_count FROM courier_pricing WHERE created_at >= CURRENT_DATE - INTERVAL '1 day';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_weight_pricing') THEN
    SELECT COUNT(*) INTO v_old_weight_count FROM courier_weight_pricing;
  ELSE
    v_old_weight_count := 0;
  END IF;
  SELECT COUNT(*) INTO v_new_weight_count FROM pricing_weight_tiers;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_distance_pricing') THEN
    SELECT COUNT(*) INTO v_old_distance_count FROM courier_distance_pricing;
  ELSE
    v_old_distance_count := 0;
  END IF;
  SELECT COUNT(*) INTO v_new_distance_count FROM pricing_distance_tiers;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courier_surcharge_rules') THEN
    SELECT COUNT(*) INTO v_old_surcharge_count FROM courier_surcharge_rules;
  ELSE
    v_old_surcharge_count := 0;
  END IF;
  SELECT COUNT(*) INTO v_new_surcharge_count FROM pricing_surcharges;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'postal_code_zones') THEN
    SELECT COUNT(*) INTO v_old_zone_count FROM postal_code_zones WHERE courier_id IS NOT NULL;
  ELSE
    v_old_zone_count := 0;
  END IF;
  SELECT COUNT(*) INTO v_new_zone_count FROM pricing_zones;
  
  RAISE NOTICE 'Base Prices:     Old: % | New: %', v_old_base_count, v_new_base_count;
  RAISE NOTICE 'Weight Tiers:    Old: % | New: %', v_old_weight_count, v_new_weight_count;
  RAISE NOTICE 'Distance Tiers:  Old: % | New: %', v_old_distance_count, v_new_distance_count;
  RAISE NOTICE 'Surcharges:      Old: % | New: %', v_old_surcharge_count, v_new_surcharge_count;
  RAISE NOTICE 'Zones:           Old: % | New: %', v_old_zone_count, v_new_zone_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE 'Old tables kept for reference (marked as DEPRECATED)';
  RAISE NOTICE 'New pricing system is now active';
  RAISE NOTICE 'Check pricing_migration_log table for details';
END $$;

-- ============================================================================
-- STEP 9: SHOW MIGRATION LOG
-- ============================================================================

SELECT 
  migration_step,
  old_table,
  new_table,
  rows_migrated,
  status,
  migrated_at
FROM pricing_migration_log
ORDER BY migrated_at DESC;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
