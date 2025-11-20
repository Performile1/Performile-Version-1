-- ============================================================================
-- DEPRECATE NEW PRICING TABLES
-- Date: November 19, 2025, 10:07 PM
-- Decision: Keep old comprehensive system, deprecate new simple tables
-- ============================================================================

-- Mark new tables as deprecated
COMMENT ON TABLE courier_pricing IS 'DEPRECATED 2025-11-19: Use courier_base_prices instead. Old system is more comprehensive with volumetric rules, CSV uploads, and service-specific pricing.';

COMMENT ON TABLE pricing_zones IS 'DEPRECATED 2025-11-19: Use postal_code_zones instead. Global zone table is more flexible.';

COMMENT ON TABLE pricing_surcharges IS 'DEPRECATED 2025-11-19: Use courier_surcharge_rules instead. Old system has more flexible surcharge rules.';

COMMENT ON TABLE pricing_weight_tiers IS 'DEPRECATED 2025-11-19: Use courier_weight_pricing instead. Old system supports both fixed and per-kg pricing.';

COMMENT ON TABLE pricing_distance_tiers IS 'DEPRECATED 2025-11-19: Use courier_distance_pricing instead. Old system supports both fixed and per-km pricing.';

-- Log the decision
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== PRICING SYSTEM DECISION ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ DECISION: Keep old comprehensive pricing system';
  RAISE NOTICE '';
  RAISE NOTICE 'OLD SYSTEM (KEEPING):';
  RAISE NOTICE '- courier_base_prices';
  RAISE NOTICE '- courier_weight_pricing';
  RAISE NOTICE '- courier_distance_pricing';
  RAISE NOTICE '- courier_surcharge_rules';
  RAISE NOTICE '- courier_volumetric_rules';
  RAISE NOTICE '- courier_service_pricing';
  RAISE NOTICE '- postal_code_zones';
  RAISE NOTICE '- pricing_csv_uploads';
  RAISE NOTICE '';
  RAISE NOTICE 'NEW SYSTEM (DEPRECATED):';
  RAISE NOTICE '- courier_pricing (use courier_base_prices)';
  RAISE NOTICE '- pricing_zones (use postal_code_zones)';
  RAISE NOTICE '- pricing_surcharges (use courier_surcharge_rules)';
  RAISE NOTICE '- pricing_weight_tiers (use courier_weight_pricing)';
  RAISE NOTICE '- pricing_distance_tiers (use courier_distance_pricing)';
  RAISE NOTICE '';
  RAISE NOTICE 'REASON: Old system is more comprehensive and production-ready';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Keep new tables for now (safe rollback)';
  RAISE NOTICE '2. Use old tables going forward';
  RAISE NOTICE '3. Can drop new tables later after verification';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables marked as deprecated';
END $$;
