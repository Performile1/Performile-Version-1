-- ============================================================================
-- CREATE SAMPLE ORDERS (SIMPLE VERSION)
-- ============================================================================
-- Creates sample orders using only existing columns
-- ============================================================================

DO $$
DECLARE
    v_merchant_user_id UUID;
    v_consumer_user_id UUID;
    v_store_id UUID;
    v_courier_id UUID;
    v_order_id UUID;
    i INTEGER;
BEGIN
    -- Get merchant user
    SELECT user_id INTO v_merchant_user_id FROM users WHERE email = 'merchant@performile.com';
    
    -- Get consumer user
    SELECT user_id INTO v_consumer_user_id FROM users WHERE email = 'consumer@performile.com';
    
    -- Get store
    SELECT store_id INTO v_store_id FROM stores WHERE owner_user_id = v_merchant_user_id LIMIT 1;
    
    -- Get a courier (Budbee)
    SELECT courier_id INTO v_courier_id FROM couriers WHERE courier_name = 'Budbee' LIMIT 1;
    
    IF v_merchant_user_id IS NULL OR v_consumer_user_id IS NULL OR v_store_id IS NULL OR v_courier_id IS NULL THEN
        RAISE EXCEPTION 'Required data not found.';
    END IF;
    
    RAISE NOTICE 'Creating sample orders...';
    
    -- Create 20 sample orders with only existing columns
    FOR i IN 1..20 LOOP
        INSERT INTO orders (
            store_id,
            courier_id,
            consumer_id,
            order_number,
            tracking_number,
            order_status,
            order_date,
            delivery_date,
            delivery_address,
            city,
            postal_code,
            country,
            customer_email
        ) VALUES (
            v_store_id,
            v_courier_id,
            v_consumer_user_id,
            'ORD-2025-' || LPAD(i::TEXT, 5, '0'),
            'TRK-' || LPAD(i::TEXT, 10, '0'),
            CASE 
                WHEN i <= 5 THEN 'delivered'::order_status
                WHEN i <= 10 THEN 'in_transit'::order_status
                WHEN i <= 15 THEN 'pending'::order_status
                ELSE 'pending'::order_status
            END,
            NOW() - (i || ' days')::INTERVAL,
            CASE 
                WHEN i <= 5 THEN NOW() - ((i - 2) || ' days')::INTERVAL
                WHEN i <= 10 THEN NOW() + '2 days'::INTERVAL
                ELSE NULL
            END,
            'Customer ' || i || ', ' || (100 + i) || ' Main St, Stockholm, Sweden',
            'Stockholm',
            '11' || LPAD(i::TEXT, 3, '0'),
            'Sweden',
            'customer' || i || '@example.com'
        )
        RETURNING order_id INTO v_order_id;
        
        -- Add tracking data for delivered and in-transit orders
        IF i <= 10 THEN
            INSERT INTO tracking_data (
                order_id,
                tracking_number,
                status,
                description,
                last_updated
            ) VALUES (
                v_order_id,
                'TRK-' || LPAD(i::TEXT, 10, '0'),
                CASE WHEN i <= 5 THEN 'delivered' ELSE 'in_transit' END,
                CASE WHEN i <= 5 THEN 'Package delivered successfully to Customer ' || i || ', Stockholm' ELSE 'Package in transit via Distribution Center, Stockholm' END,
                NOW() - ((i - 1) || ' days')::INTERVAL
            );
        END IF;
        
        -- Add reviews for delivered orders
        IF i <= 5 THEN
            INSERT INTO reviews (
                order_id,
                courier_id,
                rating,
                review_text
            ) VALUES (
                v_order_id,
                v_courier_id,
                4 + (i % 2),
                'Great service! Order ' || i || ' delivered on time.'
            );
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Created 20 sample orders';
    RAISE NOTICE '   - 5 delivered (with tracking & reviews)';
    RAISE NOTICE '   - 5 in transit (with tracking)';
    RAISE NOTICE '   - 5 processing';
    RAISE NOTICE '   - 5 pending';
END $$;

-- Verify orders were created
SELECT 
    order_status,
    COUNT(*) as count
FROM orders
GROUP BY order_status
ORDER BY order_status;

-- Show sample orders
SELECT 
    o.order_number,
    o.tracking_number,
    o.order_status,
    o.order_date,
    s.store_name,
    c.courier_name
FROM orders o
JOIN stores s ON o.store_id = s.store_id
JOIN couriers c ON o.courier_id = c.courier_id
ORDER BY o.created_at DESC
LIMIT 10;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Sample orders created successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 You now have:';
    RAISE NOTICE '   - 20 orders';
    RAISE NOTICE '   - 10 tracking records';
    RAISE NOTICE '   - 5 reviews';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Refresh your dashboard to see the data!';
    RAISE NOTICE '';
END $$;
