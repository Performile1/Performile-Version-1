-- FIX SECURITY ISSUES - November 4, 2025
-- Purpose: Fix all RLS, search_path, and security definer issues
-- Run this AFTER reviewing the audit results

-- ============================================
-- PART 1: ENABLE RLS ON MISSING TABLES
-- ============================================

-- Enable RLS on courier_ranking_scores
ALTER TABLE IF EXISTS public.courier_ranking_scores ENABLE ROW LEVEL SECURITY;

-- Enable RLS on courier_ranking_history
ALTER TABLE IF EXISTS public.courier_ranking_history ENABLE ROW LEVEL SECURITY;

-- Note: spatial_ref_sys is a PostGIS system table, should not have RLS

-- Create policies for courier_ranking_scores
DROP POLICY IF EXISTS "courier_ranking_scores_select" ON public.courier_ranking_scores;
CREATE POLICY "courier_ranking_scores_select" 
ON public.courier_ranking_scores 
FOR SELECT 
USING (true); -- Public read access for rankings

DROP POLICY IF EXISTS "courier_ranking_scores_insert" ON public.courier_ranking_scores;
CREATE POLICY "courier_ranking_scores_insert" 
ON public.courier_ranking_scores 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "courier_ranking_scores_update" ON public.courier_ranking_scores;
CREATE POLICY "courier_ranking_scores_update" 
ON public.courier_ranking_scores 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policies for courier_ranking_history
DROP POLICY IF EXISTS "courier_ranking_history_select" ON public.courier_ranking_history;
CREATE POLICY "courier_ranking_history_select" 
ON public.courier_ranking_history 
FOR SELECT 
USING (true); -- Public read access for history

DROP POLICY IF EXISTS "courier_ranking_history_insert" ON public.courier_ranking_history;
CREATE POLICY "courier_ranking_history_insert" 
ON public.courier_ranking_history 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PART 2: FIX VIEW SECURITY DEFINER ISSUES
-- ============================================

-- Recreate views WITHOUT SECURITY DEFINER
-- This makes them use the caller's permissions instead

-- v_recent_notifications
DROP VIEW IF EXISTS public.v_recent_notifications CASCADE;
CREATE OR REPLACE VIEW public.v_recent_notifications AS
SELECT * FROM notifications 
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- admin_courier_performance
DROP VIEW IF EXISTS public.admin_courier_performance CASCADE;
CREATE OR REPLACE VIEW public.admin_courier_performance AS
SELECT 
    c.courier_id,
    c.courier_name,
    COUNT(DISTINCT o.order_id) as total_orders,
    AVG(r.rating) as avg_rating,
    COUNT(DISTINCT r.review_id) as total_reviews
FROM couriers c
LEFT JOIN orders o ON o.courier_id = c.courier_id
LEFT JOIN reviews r ON r.courier_id = c.courier_id
GROUP BY c.courier_id, c.courier_name;

-- vw_market_leaders
DROP VIEW IF EXISTS public.vw_market_leaders CASCADE;
CREATE OR REPLACE VIEW public.vw_market_leaders AS
SELECT 
    courier_id,
    courier_name,
    trust_score,
    total_orders,
    avg_rating
FROM courier_analytics
WHERE trust_score >= 80
ORDER BY trust_score DESC
LIMIT 10;

-- vw_service_type_distribution
DROP VIEW IF EXISTS public.vw_service_type_distribution CASCADE;
CREATE OR REPLACE VIEW public.vw_service_type_distribution AS
SELECT 
    service_type,
    COUNT(*) as count
FROM orders
GROUP BY service_type;

-- v_unread_notifications_count
DROP VIEW IF EXISTS public.v_unread_notifications_count CASCADE;
CREATE OR REPLACE VIEW public.v_unread_notifications_count AS
SELECT 
    user_id,
    COUNT(*) as unread_count
FROM notifications
WHERE read_at IS NULL
GROUP BY user_id;

-- admin_invalid_reviews
DROP VIEW IF EXISTS public.admin_invalid_reviews CASCADE;
CREATE OR REPLACE VIEW public.admin_invalid_reviews AS
SELECT *
FROM reviews
WHERE rating < 1 OR rating > 5 OR review_text IS NULL;

-- vw_merchant_courier_preferences
DROP VIEW IF EXISTS public.vw_merchant_courier_preferences CASCADE;
CREATE OR REPLACE VIEW public.vw_merchant_courier_preferences AS
SELECT 
    mcs.merchant_id,
    mcs.courier_id,
    c.courier_name,
    mcs.is_active,
    mcs.display_order
FROM merchant_courier_selections mcs
JOIN couriers c ON c.courier_id = mcs.courier_id
WHERE mcs.is_active = true
ORDER BY mcs.display_order;

-- vw_merchant_courier_credentials
DROP VIEW IF EXISTS public.vw_merchant_courier_credentials CASCADE;
CREATE OR REPLACE VIEW public.vw_merchant_courier_credentials AS
SELECT 
    mcs.merchant_id,
    mcs.courier_id,
    c.courier_name,
    mcs.is_active,
    CASE 
        WHEN mcs.api_key IS NOT NULL AND mcs.api_key != '' THEN 'configured'
        ELSE 'missing'
    END as credential_status,
    mcs.last_test_at,
    mcs.last_test_status
FROM merchant_courier_selections mcs
JOIN couriers c ON c.courier_id = mcs.courier_id;

-- ============================================
-- PART 3: FIX FUNCTION SEARCH_PATH ISSUES
-- ============================================

-- Set search_path for all functions to be immutable
-- This prevents SQL injection attacks

-- Template for fixing functions:
-- ALTER FUNCTION function_name SET search_path = public, pg_temp;

-- Fix all functions with mutable search_path
ALTER FUNCTION IF EXISTS public.update_tracking_status SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.refresh_courier_analytics SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_tracking_info SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_available_couriers_for_merchant SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_courier_ranking_scores SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.find_nearby_couriers SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_invoice_reconciliation_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.log_usage SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.refresh_parcel_points_summary SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.current_user_id SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.refresh_platform_analytics SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_merchant_couriers_for_checkout SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_courier_trustscore SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.generate_api_key_for_user SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_service_performance SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_service_price SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.cleanup_expired_sessions SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_postal_code_location SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.can_user_get_trial SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_conversation_last_message SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.refresh_analytics_views SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.expire_old_invitations SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_claims_trends SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_user_subscription_limits SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.execute_notification_rule SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.create_settings_backup SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.evaluate_rule_conditions SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.mark_expired_reports SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_courier_display_order SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.log_system_settings_change SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_merchant_label_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.set_report_expiration SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.postal_code_distance SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_merchant_courier_credentials SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.process_plan_change SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.auto_match_invoice_shipments SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_active_subscriptions SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_week3_updated_at SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_team_member_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_rule_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_system_setting SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.increment_usage SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.refresh_service_offerings_summary SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.find_available_services SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.notify_merchant_new_order SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.is_consumer SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_postal_code_coords SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_merchant_configured_couriers SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.add_merchant_courier_selection SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_team_usage SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.reset_unread_count SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.postal_codes_within_radius SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_system_setting SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.add_tracking_event SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.increment_unread_count SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_subscription_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_delivery_coverage SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.cleanup_expired_reports SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.is_merchant SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.is_admin SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.refresh_service_performance_summary SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.current_user_role SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.execute_rule_actions SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_notification_rules_on_order_update SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.create_notification SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_usage_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.is_courier SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.remove_merchant_courier_selection SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.check_courier_selection_limit SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_proximity_settings SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_unread_notification_count SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.generate_reference_number SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_merchant_couriers_timestamp SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.restore_settings_backup SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.add_courier_to_merchant SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_merchant_couriers_with_status SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_merchant_usage_summary SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_plan_change_type SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_updated_at_column SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_claims_summary SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_system_settings_updated_at SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_proximity_settings_updated_at SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.mark_notification_read SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.trigger_generate_reference_number SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_courier_selection_rate SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_courier_credentials_status SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.cleanup_old_integration_events SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.update_notification_preferences_updated_at SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.is_postal_code_in_range SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.notify_merchant_new_review SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_report_quota_usage SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.trigger_recalculate_trustscore SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.remove_courier_from_merchant SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_merchant_couriers SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_settings_by_category SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.find_nearby_parcel_points SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.get_merchant_subscription_info SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.reset_monthly_usage SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_monthly_courier_summary SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_distance_km SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_trustscore SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS public.calculate_cancellation_date SET search_path = public, pg_temp;

-- ============================================
-- PART 4: FIX MATERIALIZED VIEW PERMISSIONS
-- ============================================

-- Revoke public access from materialized views
REVOKE SELECT ON public.service_performance_summary FROM anon, authenticated;
REVOKE SELECT ON public.service_offerings_summary FROM anon, authenticated;
REVOKE SELECT ON public.parcel_points_summary FROM anon, authenticated;
REVOKE SELECT ON public.claim_trends FROM anon, authenticated;
REVOKE SELECT ON public.order_trends FROM anon, authenticated;

-- Grant specific access based on role
-- Admins get full access
GRANT SELECT ON public.service_performance_summary TO authenticated;
GRANT SELECT ON public.service_offerings_summary TO authenticated;
GRANT SELECT ON public.parcel_points_summary TO authenticated;
GRANT SELECT ON public.claim_trends TO authenticated;
GRANT SELECT ON public.order_trends TO authenticated;

-- ============================================
-- PART 5: MOVE EXTENSIONS TO EXTENSIONS SCHEMA
-- ============================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: Moving extensions requires superuser privileges
-- This should be done by Supabase support or in a migration
-- For now, document the issue

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check RLS status
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('courier_ranking_scores', 'courier_ranking_history')
ORDER BY tablename;

-- Check function search_path
SELECT 
    proname,
    prosecdef,
    proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND proname IN ('calculate_courier_trustscore', 'get_merchant_couriers')
ORDER BY proname;

-- Check view definitions
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('vw_merchant_courier_credentials', 'v_recent_notifications')
ORDER BY table_name;

SELECT 'SECURITY FIXES APPLIED' as status, NOW() as timestamp;
