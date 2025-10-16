-- =====================================================
-- ULTIMATE DATABASE CHECK
-- =====================================================
-- Combined script that checks everything safely
-- Uses SELECT * to avoid column name issues
-- =====================================================

-- =====================================================
-- 1. DATABASE OVERVIEW
-- =====================================================

SELECT '========================================' as "═══ DATABASE OVERVIEW ═══";

-- All tables with row counts and sizes
SELECT 
    t.table_name,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as size
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name AND s.schemaname = t.table_schema
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
ORDER BY COALESCE(s.n_live_tup, 0) DESC;

-- =====================================================
-- 2. ALL COLUMNS IN DATABASE
-- =====================================================

SELECT '========================================' as "═══ ALL COLUMNS ═══";

SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 3. USERS TABLE
-- =====================================================

SELECT '========================================' as "═══ USERS ═══";
SELECT * FROM users LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM users;

-- =====================================================
-- 4. COURIERS TABLE
-- =====================================================

SELECT '========================================' as "═══ COURIERS ═══";
SELECT * FROM couriers LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM couriers;

-- =====================================================
-- 5. STORES TABLE
-- =====================================================

SELECT '========================================' as "═══ STORES ═══";
SELECT * FROM stores LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM stores;

-- =====================================================
-- 6. ORDERS TABLE
-- =====================================================

SELECT '========================================' as "═══ ORDERS ═══";
SELECT * FROM orders ORDER BY order_date DESC LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM orders;

-- Orders by status
SELECT 'By Status:' as info, order_status, COUNT(*)::text as count 
FROM orders 
GROUP BY order_status 
ORDER BY count DESC;

-- =====================================================
-- 7. REVIEWS TABLE
-- =====================================================

SELECT '========================================' as "═══ REVIEWS ═══";
SELECT * FROM reviews ORDER BY created_at DESC LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM reviews;

-- Review statistics
SELECT 'Statistics:' as info, 
    ROUND(AVG(rating)::numeric, 2)::text as avg_rating,
    MIN(rating)::text as min_rating,
    MAX(rating)::text as max_rating
FROM reviews;

-- =====================================================
-- 8. SUBSCRIPTION_PLANS TABLE
-- =====================================================

SELECT '========================================' as "═══ SUBSCRIPTION PLANS ═══";
SELECT * FROM subscription_plans ORDER BY plan_name;
SELECT 'Total:' as info, COUNT(*)::text as count FROM subscription_plans;

-- =====================================================
-- 9. USER_SUBSCRIPTIONS TABLE
-- =====================================================

SELECT '========================================' as "═══ USER SUBSCRIPTIONS ═══";
SELECT * FROM user_subscriptions LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM user_subscriptions;

-- =====================================================
-- 10. MERCHANTSHOPS TABLE
-- =====================================================

SELECT '========================================' as "═══ MERCHANT SHOPS ═══";
SELECT * FROM merchantshops LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM merchantshops;

-- =====================================================
-- 11. MERCHANTCOURIERCHECKOUT TABLE
-- =====================================================

SELECT '========================================' as "═══ MERCHANT COURIER CHECKOUT ═══";
SELECT * FROM merchantcouriercheckout LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM merchantcouriercheckout;

-- =====================================================
-- 12. SERVICETYPES TABLE
-- =====================================================

SELECT '========================================' as "═══ SERVICE TYPES ═══";
SELECT * FROM servicetypes LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM servicetypes;

-- =====================================================
-- 13. ORDERSERVICETYPE TABLE
-- =====================================================

SELECT '========================================' as "═══ ORDER SERVICE TYPE ═══";
SELECT * FROM orderservicetype LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM orderservicetype;

-- =====================================================
-- 14. RATINGLINKS TABLE
-- =====================================================

SELECT '========================================' as "═══ RATING LINKS ═══";
SELECT * FROM ratinglinks LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM ratinglinks;

-- =====================================================
-- 15. TRUSTSCORECACHE TABLE
-- =====================================================

SELECT '========================================' as "═══ TRUST SCORE CACHE ═══";
SELECT * FROM trustscorecache ORDER BY trust_score DESC;
SELECT 'Total:' as info, COUNT(*)::text as count FROM trustscorecache;

-- =====================================================
-- 16. CONVERSATIONS TABLE
-- =====================================================

SELECT '========================================' as "═══ CONVERSATIONS ═══";
SELECT * FROM conversations LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM conversations;

-- =====================================================
-- 17. MESSAGES TABLE
-- =====================================================

SELECT '========================================' as "═══ MESSAGES ═══";
SELECT * FROM messages LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM messages;

-- =====================================================
-- 18. CONVERSATIONPARTICIPANTS TABLE
-- =====================================================

SELECT '========================================' as "═══ CONVERSATION PARTICIPANTS ═══";
SELECT * FROM conversationparticipants LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM conversationparticipants;

-- =====================================================
-- 19. MESSAGEREADRECEIPTS TABLE
-- =====================================================

SELECT '========================================' as "═══ MESSAGE READ RECEIPTS ═══";
SELECT * FROM messagereadreceipts LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM messagereadreceipts;

-- =====================================================
-- 20. MESSAGEREACTIONS TABLE
-- =====================================================

SELECT '========================================' as "═══ MESSAGE REACTIONS ═══";
SELECT * FROM messagereactions LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM messagereactions;

-- =====================================================
-- 21. ECOMMERCE_INTEGRATIONS TABLE
-- =====================================================

SELECT '========================================' as "═══ ECOMMERCE INTEGRATIONS ═══";
SELECT * FROM ecommerce_integrations LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM ecommerce_integrations;

-- =====================================================
-- 22. SHOPINTEGRATIONS TABLE
-- =====================================================

SELECT '========================================' as "═══ SHOP INTEGRATIONS ═══";
SELECT * FROM shopintegrations LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM shopintegrations;

-- =====================================================
-- 23. LEADSMARKETPLACE TABLE
-- =====================================================

SELECT '========================================' as "═══ LEADS MARKETPLACE ═══";
SELECT * FROM leadsmarketplace LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM leadsmarketplace;

-- =====================================================
-- 24. LEADDOWNLOADS TABLE
-- =====================================================

SELECT '========================================' as "═══ LEAD DOWNLOADS ═══";
SELECT * FROM leaddownloads LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM leaddownloads;

-- =====================================================
-- 25. PAYMENTHISTORY TABLE
-- =====================================================

SELECT '========================================' as "═══ PAYMENT HISTORY ═══";
SELECT * FROM paymenthistory LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM paymenthistory;

-- =====================================================
-- 26. SUBSCRIPTIONADDONS TABLE
-- =====================================================

SELECT '========================================' as "═══ SUBSCRIPTION ADDONS ═══";
SELECT * FROM subscriptionaddons LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM subscriptionaddons;

-- =====================================================
-- 27. USERADDONS TABLE
-- =====================================================

SELECT '========================================' as "═══ USER ADDONS ═══";
SELECT * FROM useraddons LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM useraddons;

-- =====================================================
-- 28. NOTIFICATIONPREFERENCES TABLE
-- =====================================================

SELECT '========================================' as "═══ NOTIFICATION PREFERENCES ═══";
SELECT * FROM notificationpreferences LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM notificationpreferences;

-- =====================================================
-- 29. REVIEWREQUESTS TABLE
-- =====================================================

SELECT '========================================' as "═══ REVIEW REQUESTS ═══";
SELECT * FROM reviewrequests LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM reviewrequests;

-- =====================================================
-- 30. REVIEWREQUESTRESPONSES TABLE
-- =====================================================

SELECT '========================================' as "═══ REVIEW REQUEST RESPONSES ═══";
SELECT * FROM reviewrequestresponses LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM reviewrequestresponses;

-- =====================================================
-- 31. REVIEWREQUESTSETTINGS TABLE
-- =====================================================

SELECT '========================================' as "═══ REVIEW REQUEST SETTINGS ═══";
SELECT * FROM reviewrequestsettings LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM reviewrequestsettings;

-- =====================================================
-- 32. REVIEW_REMINDERS TABLE
-- =====================================================

SELECT '========================================' as "═══ REVIEW REMINDERS ═══";
SELECT * FROM review_reminders LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM review_reminders;

-- =====================================================
-- 33. EMAIL_TEMPLATES TABLE
-- =====================================================

SELECT '========================================' as "═══ EMAIL TEMPLATES ═══";
SELECT * FROM email_templates LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM email_templates;

-- =====================================================
-- 34. COURIERDOCUMENTS TABLE
-- =====================================================

SELECT '========================================' as "═══ COURIER DOCUMENTS ═══";
SELECT * FROM courierdocuments LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM courierdocuments;

-- =====================================================
-- 35. DELIVERY_REQUESTS TABLE
-- =====================================================

SELECT '========================================' as "═══ DELIVERY REQUESTS ═══";
SELECT * FROM delivery_requests LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM delivery_requests;

-- =====================================================
-- 36. SHOPANALYTICSSNAPSHOTS TABLE
-- =====================================================

SELECT '========================================' as "═══ SHOP ANALYTICS SNAPSHOTS ═══";
SELECT * FROM shopanalyticssnapshots LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM shopanalyticssnapshots;

-- =====================================================
-- 37. MARKETSHARESNAPSHOTS TABLE
-- =====================================================

SELECT '========================================' as "═══ MARKET SHARE SNAPSHOTS ═══";
SELECT * FROM marketsharesnapshots LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM marketsharesnapshots;

-- =====================================================
-- 38. USAGE_LOGS TABLE
-- =====================================================

SELECT '========================================' as "═══ USAGE LOGS ═══";
SELECT * FROM usage_logs LIMIT 100;
SELECT 'Total:' as info, COUNT(*)::text as count FROM usage_logs;

-- =====================================================
-- RELATIONSHIPS
-- =====================================================

SELECT '========================================' as "═══ FOREIGN KEY RELATIONSHIPS ═══";

SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- =====================================================
-- INDEXES
-- =====================================================

SELECT '========================================' as "═══ DATABASE INDEXES ═══";

SELECT
    tablename as table_name,
    indexname as index_name,
    indexdef as definition
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================
-- TRIGGERS
-- =====================================================

SELECT '========================================' as "═══ DATABASE TRIGGERS ═══";

SELECT
    trigger_name,
    event_object_table as table_name,
    event_manipulation as event,
    action_timing as timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

SELECT '========================================' as "═══ ROW LEVEL SECURITY ═══";

SELECT
    tablename as table_name,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- DATABASE SUMMARY
-- =====================================================

SELECT '========================================' as "═══ DATABASE SUMMARY ═══";

SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value
UNION ALL
SELECT 
    'Total Tables',
    COUNT(*)::text
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 
    'Total Rows',
    COALESCE(SUM(n_live_tup), 0)::text
FROM pg_stat_user_tables
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'Total Indexes',
    COUNT(*)::text
FROM pg_indexes
WHERE schemaname = 'public';

-- =====================================================
-- COMPLETE
-- =====================================================

SELECT '========================================' as "═══ CHECK COMPLETE ═══";
