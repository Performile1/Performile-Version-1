-- ============================================================================
-- CREATE PLAYWRIGHT TEST USERS - FIXED VERSION
-- ============================================================================
-- Purpose: Create test users for automated Playwright E2E tests
-- Date: October 23, 2025, 11:36 AM (FIXED)
-- Framework: SPEC_DRIVEN_FRAMEWORK v1.21
-- ============================================================================
-- 
-- Test Credentials:
-- - test-merchant@performile.com / TestPassword123!
-- - test-courier@performile.com / TestPassword123!
-- 
-- ⚠️  IMPORTANT: Run this in your Supabase SQL Editor
-- ============================================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- STEP 1: Clean up existing test users (if any)
-- ============================================================================

DELETE FROM Users WHERE email IN (
    'test-merchant@performile.com',
    'test-courier@performile.com'
);

-- ============================================================================
-- STEP 2: Create Playwright test users
-- ============================================================================

INSERT INTO Users (
    email,
    password_hash,
    user_role,
    first_name,
    last_name,
    phone,
    is_verified,
    is_active
) VALUES 
    -- Test Merchant User
    (
        'test-merchant@performile.com',
        crypt('TestPassword123!', gen_salt('bf')),
        'merchant',
        'Test',
        'Merchant',
        '+1234567800',
        TRUE,
        TRUE
    ),
    -- Test Courier User
    (
        'test-courier@performile.com',
        crypt('TestPassword123!', gen_salt('bf')),
        'courier',
        'Test',
        'Courier',
        '+1234567801',
        TRUE,
        TRUE
    );

-- ============================================================================
-- STEP 3: Create demo store for test merchant
-- ============================================================================

INSERT INTO Stores (
    store_name,
    owner_user_id,
    website_url,
    description,
    is_active
)
SELECT 
    'Test Merchant Store',
    user_id,
    'https://test-store.performile.com',
    'Test store for Playwright E2E testing',
    TRUE
FROM Users
WHERE email = 'test-merchant@performile.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Create demo courier profile for test courier
-- ============================================================================

INSERT INTO Couriers (
    courier_name,
    user_id,
    description,
    contact_email,
    contact_phone,
    is_active
)
SELECT 
    'Test Courier Service',
    user_id,
    'Test courier service for Playwright E2E testing',
    'test-courier@performile.com',
    '+1234567801',
    TRUE
FROM Users
WHERE email = 'test-courier@performile.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Create sample orders for testing (FIXED VERSION)
-- ============================================================================

DO $$
DECLARE
    v_merchant_id UUID;
    v_courier_id UUID;
    v_store_id UUID;
    v_courier_company_id UUID;
    v_order_id UUID;
BEGIN
    -- Get IDs
    SELECT user_id INTO v_merchant_id FROM Users WHERE email = 'test-merchant@performile.com';
    SELECT user_id INTO v_courier_id FROM Users WHERE email = 'test-courier@performile.com';
    SELECT store_id INTO v_store_id FROM Stores WHERE owner_user_id = v_merchant_id;
    SELECT courier_id INTO v_courier_company_id FROM Couriers WHERE user_id = v_courier_id;

    -- Create 3 sample orders with CORRECT column names
    FOR i IN 1..3 LOOP
        INSERT INTO Orders (
            store_id,
            courier_id,
            tracking_number,
            order_number,
            customer_email,
            customer_name,
            customer_phone,
            delivery_address,
            postal_code,
            country,
            order_status,
            order_date,
            created_at
        ) VALUES (
            v_store_id,
            v_courier_company_id,
            'TRACK-' || LPAD(i::TEXT, 8, '0'),
            'TEST-ORDER-' || LPAD(i::TEXT, 5, '0'),
            'customer' || i || '@test.com',
            'Test Customer ' || i,
            '+123456780' || i,
            i || ' Test Street, Test City',
            '12345',
            'SWE',
            (CASE 
                WHEN i = 1 THEN 'delivered'
                WHEN i = 2 THEN 'in_transit'
                ELSE 'pending'
            END)::order_status,
            NOW() - (i || ' days')::INTERVAL,
            NOW() - (i || ' days')::INTERVAL
        ) RETURNING order_id INTO v_order_id;

        -- Create review for delivered order
        IF i = 1 THEN
            INSERT INTO Reviews (
                order_id,
                store_id,
                courier_id,
                rating,
                review_text
            ) VALUES (
                v_order_id,
                v_store_id,
                v_courier_company_id,
                5.00,
                'Excellent service! Fast and reliable delivery.'
            );
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Created 3 sample orders for testing';
END $$;

-- ============================================================================
-- STEP 6: Create sample analytics data (optional - will skip if table doesn't exist)
-- ============================================================================

DO $$
BEGIN
    -- Try to insert TrustScore data if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trustscores') THEN
        INSERT INTO TrustScores (
            entity_type,
            entity_id,
            trust_score,
            total_deliveries,
            successful_deliveries,
            failed_deliveries,
            average_rating,
            total_reviews,
            last_calculated_at
        )
        SELECT 
            'courier',
            courier_id,
            95.5,
            100,
            98,
            2,
            4.8,
            50,
            NOW()
        FROM Couriers
        WHERE user_id = (SELECT user_id FROM Users WHERE email = 'test-courier@performile.com')
        ON CONFLICT (entity_type, entity_id) DO UPDATE
        SET 
            trust_score = EXCLUDED.trust_score,
            total_deliveries = EXCLUDED.total_deliveries,
            successful_deliveries = EXCLUDED.successful_deliveries,
            failed_deliveries = EXCLUDED.failed_deliveries,
            average_rating = EXCLUDED.average_rating,
            total_reviews = EXCLUDED.total_reviews,
            last_calculated_at = EXCLUDED.last_calculated_at;
        
        RAISE NOTICE '✅ TrustScore data created';
    ELSE
        RAISE NOTICE '⏭️  TrustScores table not found, skipping...';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Verification
-- ============================================================================

SELECT 
    '👤 TEST USERS' as section,
    email,
    user_role,
    first_name,
    last_name,
    is_verified,
    is_active,
    created_at
FROM Users
WHERE email IN (
    'test-merchant@performile.com',
    'test-courier@performile.com'
)
ORDER BY user_role;

SELECT 
    '🏪 TEST STORES' as section,
    s.store_name,
    u.email as owner_email,
    s.is_active,
    s.created_at
FROM Stores s
JOIN Users u ON s.owner_user_id = u.user_id
WHERE u.email = 'test-merchant@performile.com';

SELECT 
    '🚚 TEST COURIERS' as section,
    c.courier_name,
    u.email as user_email,
    c.is_active,
    c.created_at
FROM Couriers c
JOIN Users u ON c.user_id = u.user_id
WHERE u.email = 'test-courier@performile.com';

SELECT 
    '📦 TEST ORDERS' as section,
    o.tracking_number,
    o.order_number,
    o.delivery_address,
    o.postal_code,
    o.order_status,
    o.created_at
FROM Orders o
JOIN Stores s ON o.store_id = s.store_id
JOIN Users u ON s.owner_user_id = u.user_id
WHERE u.email = 'test-merchant@performile.com'
ORDER BY o.created_at DESC;

SELECT 
    '⭐ TEST REVIEWS' as section,
    r.rating,
    r.review_text,
    r.created_at
FROM Reviews r
JOIN Couriers c ON r.courier_id = c.courier_id
JOIN Users u ON c.user_id = u.user_id
WHERE u.email = 'test-courier@performile.com';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ✅ PLAYWRIGHT TEST USERS CREATED SUCCESSFULLY!                ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '📧 TEST CREDENTIALS:';
    RAISE NOTICE '   ┌─────────────────────────────────────────────────────────┐';
    RAISE NOTICE '   │ Merchant:                                               │';
    RAISE NOTICE '   │   Email: test-merchant@performile.com                   │';
    RAISE NOTICE '   │   Password: TestPassword123!                            │';
    RAISE NOTICE '   │   Role: merchant                                        │';
    RAISE NOTICE '   └─────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    RAISE NOTICE '   ┌─────────────────────────────────────────────────────────┐';
    RAISE NOTICE '   │ Courier:                                                │';
    RAISE NOTICE '   │   Email: test-courier@performile.com                    │';
    RAISE NOTICE '   │   Password: TestPassword123!                            │';
    RAISE NOTICE '   │   Role: courier                                         │';
    RAISE NOTICE '   └─────────────────────────────────────────────────────────┘';
    RAISE NOTICE '';
    RAISE NOTICE '📊 TEST DATA CREATED:';
    RAISE NOTICE '   ✅ 2 test users (merchant + courier)';
    RAISE NOTICE '   ✅ 1 test store';
    RAISE NOTICE '   ✅ 1 test courier profile';
    RAISE NOTICE '   ✅ 3 sample orders (delivered, in_transit, pending)';
    RAISE NOTICE '   ✅ 1 sample review';
    RAISE NOTICE '   ✅ TrustScore data';
    RAISE NOTICE '';
    RAISE NOTICE '📦 ORDERS CREATED:';
    RAISE NOTICE '   ✅ TRACK-00000001 (delivered) - has review';
    RAISE NOTICE '   ✅ TRACK-00000002 (in_transit)';
    RAISE NOTICE '   ✅ TRACK-00000003 (pending)';
    RAISE NOTICE '';
    RAISE NOTICE '🎭 NEXT STEPS:';
    RAISE NOTICE '   1. Run Playwright tests: npm run test:e2e';
    RAISE NOTICE '   2. Or run in UI mode: npm run test:e2e:ui';
    RAISE NOTICE '   3. View test report: npm run test:e2e:report';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Expected: ~50-100 more tests should pass now!';
    RAISE NOTICE '';
END $$;
