-- =====================================================
-- Show All Tables with Row Counts
-- =====================================================
-- Simple and reliable way to see everything
-- =====================================================

-- Step 1: List all tables
SELECT 
    tablename as "Table Name"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 2: Get row counts for each table
-- Copy and paste this into SQL editor

SELECT 'conversationparticipants' as table_name, COUNT(*) as rows FROM conversationparticipants
UNION ALL SELECT 'conversations', COUNT(*) FROM conversations
UNION ALL SELECT 'courierdocuments', COUNT(*) FROM courierdocuments
UNION ALL SELECT 'couriers', COUNT(*) FROM couriers
UNION ALL SELECT 'delivery_requests', COUNT(*) FROM delivery_requests
UNION ALL SELECT 'ecommerce_integrations', COUNT(*) FROM ecommerce_integrations
UNION ALL SELECT 'email_templates', COUNT(*) FROM email_templates
UNION ALL SELECT 'leaddownloads', COUNT(*) FROM leaddownloads
UNION ALL SELECT 'leadsmarketplace', COUNT(*) FROM leadsmarketplace
UNION ALL SELECT 'marketsharesnapshots', COUNT(*) FROM marketsharesnapshots
UNION ALL SELECT 'merchantcouriercheckout', COUNT(*) FROM merchantcouriercheckout
UNION ALL SELECT 'merchantshops', COUNT(*) FROM merchantshops
UNION ALL SELECT 'messagereadreceipts', COUNT(*) FROM messagereadreceipts
UNION ALL SELECT 'messagereactions', COUNT(*) FROM messagereactions
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'notificationpreferences', COUNT(*) FROM notificationpreferences
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'orderservicetype', COUNT(*) FROM orderservicetype
UNION ALL SELECT 'paymenthistory', COUNT(*) FROM paymenthistory
UNION ALL SELECT 'ratinglinks', COUNT(*) FROM ratinglinks
UNION ALL SELECT 'review_reminders', COUNT(*) FROM review_reminders
UNION ALL SELECT 'reviewrequestresponses', COUNT(*) FROM reviewrequestresponses
UNION ALL SELECT 'reviewrequests', COUNT(*) FROM reviewrequests
UNION ALL SELECT 'reviewrequestsettings', COUNT(*) FROM reviewrequestsettings
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'servicetypes', COUNT(*) FROM servicetypes
UNION ALL SELECT 'shopanalyticssnapshots', COUNT(*) FROM shopanalyticssnapshots
UNION ALL SELECT 'shopintegrations', COUNT(*) FROM shopintegrations
UNION ALL SELECT 'stores', COUNT(*) FROM stores
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'subscriptionaddons', COUNT(*) FROM subscriptionaddons
UNION ALL SELECT 'subscriptionplans', COUNT(*) FROM subscriptionplans
UNION ALL SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL SELECT 'trustscorecache', COUNT(*) FROM trustscorecache
UNION ALL SELECT 'usage_logs', COUNT(*) FROM usage_logs
UNION ALL SELECT 'useraddons', COUNT(*) FROM useraddons
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
ORDER BY table_name;

-- Step 3: Check for duplicate subscription tables
SELECT 
    '=====================================================' as "SUBSCRIPTION TABLES CHECK";

SELECT 
    tablename as "Subscription-Related Tables",
    CASE 
        WHEN tablename = 'subscriptionplans' THEN '⚠️ OLD (lowercase, no underscore)'
        WHEN tablename = 'subscription_plans' THEN '✅ NEW (with underscore)'
        WHEN tablename = 'subscriptions' THEN '⚠️ OLD (generic name)'
        WHEN tablename = 'user_subscriptions' THEN '✅ NEW (specific name)'
        ELSE 'Other'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%subscription%'
ORDER BY tablename;

-- Step 4: Show data from OLD subscriptionplans (if exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptionplans') THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'OLD subscriptionplans TABLE DATA:';
        RAISE NOTICE '=====================================================';
        
        FOR r IN 
            SELECT * 
            FROM subscriptionplans 
            ORDER BY plan_id 
        LOOP
            RAISE NOTICE 'Plan: %', r;
        END LOOP;
    ELSE
        RAISE NOTICE '✅ No old subscriptionplans table found';
    END IF;
END $$;

-- Step 5: Show data from NEW subscription_plans (if exists)
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        RAISE NOTICE '=====================================================';
        RAISE NOTICE 'NEW subscription_plans TABLE DATA:';
        RAISE NOTICE '=====================================================';
        
        FOR r IN 
            SELECT * 
            FROM subscription_plans 
            ORDER BY plan_id 
        LOOP
            RAISE NOTICE 'Plan: %', r;
        END LOOP;
    ELSE
        RAISE NOTICE '⚠️ No new subscription_plans table found';
    END IF;
END $$;

-- Step 6: Recommendation
SELECT 
    '=====================================================' as divider
UNION ALL
SELECT 'RECOMMENDATION:'
UNION ALL
SELECT 'If you have BOTH subscriptionplans AND subscription_plans:'
UNION ALL
SELECT '1. The OLD table (subscriptionplans) has 6 rows from earlier'
UNION ALL
SELECT '2. The NEW table (subscription_plans) is what we just created'
UNION ALL
SELECT '3. You should DROP the old table and use the new one'
UNION ALL
SELECT '4. Run: DROP TABLE subscriptionplans CASCADE;'
UNION ALL
SELECT '5. Then run: database/create-subscription-system.sql'
UNION ALL
SELECT '=====================================================';
