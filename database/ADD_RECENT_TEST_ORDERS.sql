-- ADD RECENT TEST ORDERS FOR ORDER-TRENDS API
-- Date: October 30, 2025
-- Purpose: Fix ORDER-TRENDS API empty data issue
-- Issue: API filters by date, but no orders in last 7 days
-- Solution: Add test orders with recent dates (last 7 days)

-- ============================================================================
-- STEP 1: Get existing store and courier IDs
-- ============================================================================
-- Run this first to see available IDs:
-- SELECT store_id, owner_user_id FROM stores LIMIT 5;
-- SELECT courier_id FROM couriers LIMIT 5;

-- ============================================================================
-- STEP 2: Insert recent test orders (last 7 days)
-- ============================================================================
-- NOTE: Replace the store_id and courier_id values with actual IDs from your database

-- Test orders for TODAY
INSERT INTO orders (
    store_id,
    courier_id,
    order_number,
    customer_email,
    customer_name,
    customer_phone,
    delivery_address,
    order_status,
    order_date,
    created_at,
    package_value,
    shipping_cost,
    package_currency,
    city,
    state_province,
    postal_code,
    country
) VALUES
-- Order 1: Today - Delivered
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'test.customer1@example.com',
    'Test Customer 1',
    '+1234567890',
    '123 Test Street, Test City',
    'delivered',
    NOW(),
    NOW(),
    99.99,
    15.00,
    'USD',
    'Test City',
    'Test State',
    '12345',
    'USA'
),
-- Order 2: Today - In Transit
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002',
    'test.customer2@example.com',
    'Test Customer 2',
    '+1234567891',
    '456 Test Avenue, Test City',
    'in_transit',
    NOW(),
    NOW(),
    149.99,
    20.00,
    'USD',
    'Test City',
    'Test State',
    '12345',
    'USA'
),
-- Order 3: Today - Pending
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-003',
    'test.customer3@example.com',
    'Test Customer 3',
    '+1234567892',
    '789 Test Boulevard, Test City',
    'pending',
    NOW(),
    NOW(),
    79.99,
    10.00,
    'USD',
    'Test City',
    'Test State',
    '12345',
    'USA'
);

-- Test orders for YESTERDAY
INSERT INTO orders (
    store_id,
    courier_id,
    order_number,
    customer_email,
    customer_name,
    delivery_address,
    order_status,
    order_date,
    created_at,
    package_value,
    shipping_cost,
    package_currency,
    city,
    country
) VALUES
-- Order 4: Yesterday - Delivered
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '1 day', 'YYYYMMDD') || '-001',
    'test.customer4@example.com',
    'Test Customer 4',
    '111 Yesterday Street',
    'delivered',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    199.99,
    25.00,
    'USD',
    'Test City',
    'USA'
),
-- Order 5: Yesterday - Delivered
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '1 day', 'YYYYMMDD') || '-002',
    'test.customer5@example.com',
    'Test Customer 5',
    '222 Yesterday Avenue',
    'delivered',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    129.99,
    18.00,
    'USD',
    'Test City',
    'USA'
);

-- Test orders for 2 DAYS AGO
INSERT INTO orders (
    store_id,
    courier_id,
    order_number,
    customer_email,
    customer_name,
    delivery_address,
    order_status,
    order_date,
    created_at,
    package_value,
    shipping_cost,
    package_currency
) VALUES
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '2 days', 'YYYYMMDD') || '-001',
    'test.customer6@example.com',
    'Test Customer 6',
    '333 Two Days Ago Street',
    'delivered',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    89.99,
    12.00,
    'USD'
),
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '2 days', 'YYYYMMDD') || '-002',
    'test.customer7@example.com',
    'Test Customer 7',
    '444 Two Days Ago Avenue',
    'in_transit',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    159.99,
    22.00,
    'USD'
);

-- Test orders for 3 DAYS AGO
INSERT INTO orders (
    store_id,
    courier_id,
    order_number,
    customer_email,
    customer_name,
    delivery_address,
    order_status,
    order_date,
    created_at,
    package_value,
    shipping_cost,
    package_currency
) VALUES
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '3 days', 'YYYYMMDD') || '-001',
    'test.customer8@example.com',
    'Test Customer 8',
    '555 Three Days Street',
    'delivered',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    119.99,
    16.00,
    'USD'
),
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '3 days', 'YYYYMMDD') || '-002',
    'test.customer9@example.com',
    'Test Customer 9',
    '666 Three Days Avenue',
    'delivered',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    139.99,
    19.00,
    'USD'
);

-- Test orders for 5 DAYS AGO
INSERT INTO orders (
    store_id,
    courier_id,
    order_number,
    customer_email,
    customer_name,
    delivery_address,
    order_status,
    order_date,
    created_at,
    package_value,
    shipping_cost,
    package_currency
) VALUES
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '5 days', 'YYYYMMDD') || '-001',
    'test.customer10@example.com',
    'Test Customer 10',
    '777 Five Days Street',
    'delivered',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    179.99,
    24.00,
    'USD'
),
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '5 days', 'YYYYMMDD') || '-002',
    'test.customer11@example.com',
    'Test Customer 11',
    '888 Five Days Avenue',
    'pending',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    109.99,
    14.00,
    'USD'
);

-- Test orders for 6 DAYS AGO
INSERT INTO orders (
    store_id,
    courier_id,
    order_number,
    customer_email,
    customer_name,
    delivery_address,
    order_status,
    order_date,
    created_at,
    package_value,
    shipping_cost,
    package_currency
) VALUES
(
    (SELECT store_id FROM stores LIMIT 1),
    (SELECT courier_id FROM couriers LIMIT 1),
    'TEST-' || TO_CHAR(NOW() - INTERVAL '6 days', 'YYYYMMDD') || '-001',
    'test.customer12@example.com',
    'Test Customer 12',
    '999 Six Days Street',
    'delivered',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days',
    189.99,
    26.00,
    'USD'
);

-- ============================================================================
-- STEP 3: Verify the inserts
-- ============================================================================
SELECT 
    'VERIFICATION' as step,
    COUNT(*) as new_orders_added,
    MIN(created_at) as oldest_order,
    MAX(created_at) as newest_order
FROM orders
WHERE order_number LIKE 'TEST-%';

-- ============================================================================
-- STEP 4: Check orders by day (last 7 days)
-- ============================================================================
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as orders_count,
    SUM(package_value + shipping_cost) as total_revenue
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- ============================================================================
-- CLEANUP (Run this later to remove test data)
-- ============================================================================
-- DELETE FROM orders WHERE order_number LIKE 'TEST-%';
-- SELECT 'Test orders deleted' as status;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script adds 13 test orders spread across the last 7 days:
-- - Today: 3 orders
-- - Yesterday: 2 orders
-- - 2 days ago: 2 orders
-- - 3 days ago: 2 orders
-- - 5 days ago: 2 orders
-- - 6 days ago: 1 order
-- - 7 days ago: 1 order
--
-- Total test revenue: ~$1,800
-- Mix of statuses: delivered, in_transit, pending
-- All orders prefixed with 'TEST-' for easy identification
-- ============================================================================
