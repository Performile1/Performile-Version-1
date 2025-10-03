-- ============================================================================
-- PERFORMILE - DEMO DATA SEED SCRIPT
-- ============================================================================
-- Creates realistic demo data for Nordic logistics operations
-- Includes: Couriers, Stores, Consumers, Orders, and Reviews
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CLEANUP - Delete existing demo data in correct order (respecting foreign keys)
-- ============================================================================

-- Delete reviews first (references orders, couriers, stores)
DELETE FROM Reviews WHERE courier_id IN (
    SELECT courier_id FROM Couriers WHERE courier_name IN (
        'DHL Express', 'DHL Freight', 'DHL eCommerce', 'Bring', 'PostNord',
        'Airmee', 'Earlybird', 'Budbee', 'Instabox', 'Schenker'
    )
);

-- Delete orders (references couriers and stores)
DELETE FROM Orders WHERE courier_id IN (
    SELECT courier_id FROM Couriers WHERE courier_name IN (
        'DHL Express', 'DHL Freight', 'DHL eCommerce', 'Bring', 'PostNord',
        'Airmee', 'Earlybird', 'Budbee', 'Instabox', 'Schenker'
    )
);

-- Delete trust score cache (references couriers)
DELETE FROM TrustScoreCache WHERE courier_id IN (
    SELECT courier_id FROM Couriers WHERE courier_name IN (
        'DHL Express', 'DHL Freight', 'DHL eCommerce', 'Bring', 'PostNord',
        'Airmee', 'Earlybird', 'Budbee', 'Instabox', 'Schenker'
    )
);

-- Now safe to delete couriers
DELETE FROM Couriers WHERE courier_name IN (
    'DHL Express', 'DHL Freight', 'DHL eCommerce', 'Bring', 'PostNord',
    'Airmee', 'Earlybird', 'Budbee', 'Instabox', 'Schenker'
);

-- ============================================================================
-- 1. CREATE COURIER COMPANIES
-- ============================================================================

-- Create courier user accounts
INSERT INTO Users (email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active)
VALUES
    ('dhl.express@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'DHL', 'Express', '+46 771 345 345', TRUE, TRUE),
    ('dhl.freight@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'DHL', 'Freight', '+46 771 345 346', TRUE, TRUE),
    ('dhl.ecommerce@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'DHL', 'eCommerce', '+46 771 345 347', TRUE, TRUE),
    ('bring@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'Bring', 'Logistics', '+47 23 96 20 00', TRUE, TRUE),
    ('postnord@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'PostNord', 'Service', '+46 10 436 00 00', TRUE, TRUE),
    ('airmee@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'Airmee', 'Delivery', '+46 8 446 83 00', TRUE, TRUE),
    ('earlybird@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'Earlybird', 'Logistics', '+46 8 121 470 00', TRUE, TRUE),
    ('budbee@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'Budbee', 'Delivery', '+46 10 410 00 00', TRUE, TRUE),
    ('instabox@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'Instabox', 'Service', '+46 10 888 35 00', TRUE, TRUE),
    ('schenker@performile.com', crypt('Courier1234!', gen_salt('bf')), 'courier', 'Schenker', 'Logistics', '+46 10 448 50 00', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Create courier companies with their respective user accounts
INSERT INTO Couriers (courier_name, description, contact_email, contact_phone, is_active, user_id)
VALUES
    ('DHL Express', 'International express delivery service', 'express@dhl.com', '+46 771 345 345', TRUE, (SELECT user_id FROM Users WHERE email = 'dhl.express@performile.com')),
    ('DHL Freight', 'Freight and logistics solutions', 'freight@dhl.com', '+46 771 345 346', TRUE, (SELECT user_id FROM Users WHERE email = 'dhl.freight@performile.com')),
    ('DHL eCommerce', 'E-commerce delivery specialist', 'ecommerce@dhl.com', '+46 771 345 347', TRUE, (SELECT user_id FROM Users WHERE email = 'dhl.ecommerce@performile.com')),
    ('Bring', 'Nordic postal and logistics', 'info@bring.com', '+47 23 96 20 00', TRUE, (SELECT user_id FROM Users WHERE email = 'bring@performile.com')),
    ('PostNord', 'Leading Nordic postal service', 'info@postnord.com', '+46 10 436 00 00', TRUE, (SELECT user_id FROM Users WHERE email = 'postnord@performile.com')),
    ('Airmee', 'Same-day delivery service', 'hello@airmee.com', '+46 8 446 83 00', TRUE, (SELECT user_id FROM Users WHERE email = 'airmee@performile.com')),
    ('Earlybird', 'Sustainable urban delivery', 'info@earlybird.se', '+46 8 121 470 00', TRUE, (SELECT user_id FROM Users WHERE email = 'earlybird@performile.com')),
    ('Budbee', 'Flexible home delivery', 'hello@budbee.com', '+46 10 410 00 00', TRUE, (SELECT user_id FROM Users WHERE email = 'budbee@performile.com')),
    ('Instabox', 'Parcel locker network', 'info@instabox.se', '+46 10 888 35 00', TRUE, (SELECT user_id FROM Users WHERE email = 'instabox@performile.com')),
    ('Schenker', 'Global logistics provider', 'info@dbschenker.com', '+46 10 448 50 00', TRUE, (SELECT user_id FROM Users WHERE email = 'schenker@performile.com'));

-- ============================================================================
-- 2. CREATE STORES
-- ============================================================================

-- Delete orders and reviews for demo stores first
DELETE FROM Orders WHERE store_id IN (
    SELECT store_id FROM Stores WHERE store_name IN (
        'Nordic Fashion AB', 'TechHub Stockholm', 'HomeDesign Oslo', 'GreenLife Copenhagen',
        'SportMax Sweden', 'BeautyBox Nordic', 'BookWorld Scandinavia', 'PetParadise AB',
        'KidsCorner Denmark', 'ToolPro Norway'
    )
);

-- Now safe to delete stores
DELETE FROM Stores WHERE store_name IN (
    'Nordic Fashion AB', 'TechHub Stockholm', 'HomeDesign Oslo', 'GreenLife Copenhagen',
    'SportMax Sweden', 'BeautyBox Nordic', 'BookWorld Scandinavia', 'PetParadise AB',
    'KidsCorner Denmark', 'ToolPro Norway'
);

INSERT INTO Stores (store_name, owner_user_id, website_url, description, is_active)
SELECT 
    store_name,
    (SELECT user_id FROM Users WHERE email = 'merchant@performile.com' LIMIT 1),
    website_url,
    description,
    TRUE
FROM (VALUES
    ('Nordic Fashion AB', 'https://nordicfashion.se', 'Premium Scandinavian clothing and accessories'),
    ('TechHub Stockholm', 'https://techhub.se', 'Electronics and gadgets retailer'),
    ('HomeDesign Oslo', 'https://homedesign.no', 'Modern furniture and home decor'),
    ('GreenLife Copenhagen', 'https://greenlife.dk', 'Organic food and wellness products'),
    ('SportMax Sweden', 'https://sportmax.se', 'Sports equipment and activewear'),
    ('BeautyBox Nordic', 'https://beautybox.no', 'Cosmetics and skincare products'),
    ('BookWorld Scandinavia', 'https://bookworld.se', 'Books and educational materials'),
    ('PetParadise AB', 'https://petparadise.se', 'Pet supplies and accessories'),
    ('KidsCorner Denmark', 'https://kidscorner.dk', 'Children toys and clothing'),
    ('ToolPro Norway', 'https://toolpro.no', 'Professional tools and equipment')
) AS store_data(store_name, website_url, description);

-- ============================================================================
-- 3. CREATE CONSUMER USERS
-- ============================================================================

INSERT INTO Users (email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active)
VALUES
    ('anna.andersson@email.se', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Anna', 'Andersson', '+46 70 123 4501', TRUE, TRUE),
    ('erik.eriksson@email.se', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Erik', 'Eriksson', '+46 70 123 4502', TRUE, TRUE),
    ('maria.larsson@email.se', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Maria', 'Larsson', '+46 70 123 4503', TRUE, TRUE),
    ('lars.hansen@email.no', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Lars', 'Hansen', '+47 98 765 4321', TRUE, TRUE),
    ('ingrid.olsen@email.no', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Ingrid', 'Olsen', '+47 98 765 4322', TRUE, TRUE),
    ('peter.nielsen@email.dk', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Peter', 'Nielsen', '+45 20 12 34 56', TRUE, TRUE),
    ('sofie.jensen@email.dk', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Sofie', 'Jensen', '+45 20 12 34 57', TRUE, TRUE),
    ('johan.svensson@email.se', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Johan', 'Svensson', '+46 70 123 4504', TRUE, TRUE),
    ('karin.berg@email.no', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Karin', 'Berg', '+47 98 765 4323', TRUE, TRUE),
    ('mikkel.christensen@email.dk', crypt('Demo1234!', gen_salt('bf')), 'consumer', 'Mikkel', 'Christensen', '+45 20 12 34 58', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 4. CREATE ORDERS WITH NORDIC POSTAL CODES
-- ============================================================================

-- Swedish postal codes: Stockholm (111 XX), Gothenburg (411 XX), Malmö (211 XX)
-- Norwegian postal codes: Oslo (01XX), Bergen (50XX), Trondheim (70XX)
-- Danish postal codes: Copenhagen (1XXX), Aarhus (80XX), Odense (50XX)

DO $$
DECLARE
    v_store_id UUID;
    v_courier_id UUID;
    v_order_id UUID;
    v_consumer_email TEXT;
    v_postal_codes TEXT[] := ARRAY[
        '11122', '11134', '11156', '41101', '41115', '21120', '21134', -- Sweden
        '0150', '0160', '0170', '5003', '5015', '7020', '7030',        -- Norway
        '1050', '1100', '1150', '8000', '8200', '5000', '5200'         -- Denmark
    ];
    v_consumer_emails TEXT[] := ARRAY[
        'anna.andersson@email.se', 'erik.eriksson@email.se', 'maria.larsson@email.se',
        'lars.hansen@email.no', 'ingrid.olsen@email.no', 'peter.nielsen@email.dk',
        'sofie.jensen@email.dk', 'johan.svensson@email.se', 'karin.berg@email.no',
        'mikkel.christensen@email.dk'
    ];
    v_statuses TEXT[] := ARRAY['delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'delivered', 'in_transit', 'pending', 'cancelled'];
    i INT;
    j INT;
    v_order_counter INT := 0;
BEGIN
    -- Create 10 orders for each courier (100 orders total)
    FOR v_courier_id IN (SELECT courier_id FROM Couriers ORDER BY courier_name LIMIT 10)
    LOOP
        FOR i IN 1..10
        LOOP
            v_order_counter := v_order_counter + 1;
            
            -- Select random store
            SELECT store_id INTO v_store_id FROM Stores ORDER BY RANDOM() LIMIT 1;
            
            -- Select random consumer
            v_consumer_email := v_consumer_emails[1 + floor(random() * 10)::int];
            
            -- Create order with unique order number
            INSERT INTO Orders (
                store_id,
                courier_id,
                order_number,
                customer_name,
                customer_email,
                customer_phone,
                delivery_address,
                order_status,
                order_date,
                delivery_date,
                tracking_number
            ) VALUES (
                v_store_id,
                v_courier_id,
                'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_order_counter::TEXT, 5, '0'),
                (SELECT first_name || ' ' || last_name FROM Users WHERE email = v_consumer_email),
                v_consumer_email,
                (SELECT phone FROM Users WHERE email = v_consumer_email),
                'Delivery Street ' || i || ', ' || v_postal_codes[1 + floor(random() * array_length(v_postal_codes, 1))::int] || ' ' ||
                CASE 
                    WHEN random() < 0.3 THEN 'Stockholm'
                    WHEN random() < 0.5 THEN 'Oslo'
                    WHEN random() < 0.7 THEN 'Copenhagen'
                    WHEN random() < 0.85 THEN 'Gothenburg'
                    ELSE 'Bergen'
                END || ', ' ||
                CASE 
                    WHEN random() < 0.4 THEN 'Sweden'
                    WHEN random() < 0.7 THEN 'Norway'
                    ELSE 'Denmark'
                END,
                v_statuses[1 + floor(random() * array_length(v_statuses, 1))::int]::order_status,
                NOW() - (random() * 30 || ' days')::INTERVAL,
                CASE 
                    WHEN random() < 0.7 THEN 
                        -- Delivered: order_date + realistic delivery time (12-72 hours for standard, 4-24 for express)
                        (NOW() - (random() * 30 || ' days')::INTERVAL) + 
                        (CASE 
                            WHEN random() < 0.3 THEN (4 + random() * 20)::INT || ' hours'  -- Express: 4-24 hours
                            WHEN random() < 0.6 THEN (12 + random() * 36)::INT || ' hours' -- Standard: 12-48 hours
                            ELSE (24 + random() * 48)::INT || ' hours'                     -- Economy: 24-72 hours
                        END)::INTERVAL
                    ELSE NULL
                END,
                'TRK-' || LPAD(floor(random() * 1000000)::TEXT, 10, '0')
            ) RETURNING order_id INTO v_order_id;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 5. CREATE REVIEWS (10 per courier, some with no response)
-- ============================================================================

DO $$
DECLARE
    v_courier_id UUID;
    v_order_id UUID;
    v_store_id UUID;
    v_rating INT;
    v_has_response BOOLEAN;
    i INT;
BEGIN
    FOR v_courier_id IN (SELECT courier_id FROM Couriers ORDER BY courier_name LIMIT 10)
    LOOP
        FOR i IN 1..10
        LOOP
            -- Get a random delivered order for this courier
            SELECT o.order_id, o.store_id INTO v_order_id, v_store_id
            FROM Orders o
            WHERE o.courier_id = v_courier_id 
            AND o.order_status = 'delivered'
            ORDER BY RANDOM()
            LIMIT 1;
            
            -- Skip if no order found
            CONTINUE WHEN v_order_id IS NULL;
            
            -- Random rating (weighted towards positive)
            v_rating := CASE 
                WHEN random() < 0.5 THEN 5
                WHEN random() < 0.75 THEN 4
                WHEN random() < 0.9 THEN 3
                WHEN random() < 0.95 THEN 2
                ELSE 1
            END;
            
            -- 30% chance of no response
            v_has_response := random() > 0.3;
            
            -- Create review
            INSERT INTO Reviews (
                order_id,
                courier_id,
                store_id,
                rating,
                delivery_speed_rating,
                package_condition_rating,
                communication_rating,
                comment,
                is_verified,
                is_public,
                created_at
            ) VALUES (
                v_order_id,
                v_courier_id,
                v_store_id,
                v_rating,
                CASE 
                    WHEN random() < 0.5 THEN 5
                    WHEN random() < 0.75 THEN 4
                    WHEN random() < 0.9 THEN 3
                    ELSE 2
                END,
                CASE 
                    WHEN random() < 0.6 THEN 5
                    WHEN random() < 0.85 THEN 4
                    ELSE 3
                END,
                CASE 
                    WHEN random() < 0.5 THEN 5
                    WHEN random() < 0.75 THEN 4
                    WHEN random() < 0.9 THEN 3
                    ELSE 2
                END,
                CASE v_rating
                    WHEN 5 THEN 'Excellent service! Very professional and on time. Highly recommended!'
                    WHEN 4 THEN 'Good delivery service, minor delay but package arrived safely. Overall satisfied.'
                    WHEN 3 THEN 'Average service, package arrived but communication could be better.'
                    WHEN 2 THEN 'Delayed delivery and poor communication. Not very satisfied.'
                    ELSE 'Very disappointed with the service quality. Package arrived late and damaged.'
                END,
                random() > 0.5, -- 50% verified
                TRUE,
                NOW() - (random() * 25 || ' days')::INTERVAL
            );
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- 6. UPDATE TRUSTSCORE CACHE
-- ============================================================================

-- Calculate and cache trust scores for all couriers
INSERT INTO TrustScoreCache (
    courier_id,
    overall_score,
    total_reviews,
    avg_delivery_speed,
    avg_package_condition,
    avg_communication,
    last_updated
)
SELECT 
    c.courier_id,
    -- Overall score calculation (0.00-5.00)
    COALESCE(ROUND(AVG(r.rating), 2), 0.00),
    COALESCE(COUNT(r.review_id), 0),
    COALESCE(ROUND(AVG(r.delivery_speed_rating), 2), 0.00),
    COALESCE(ROUND(AVG(r.package_condition_rating), 2), 0.00),
    COALESCE(ROUND(AVG(r.communication_rating), 2), 0.00),
    NOW()
FROM Couriers c
LEFT JOIN Reviews r ON c.courier_id = r.courier_id
GROUP BY c.courier_id
ON CONFLICT (courier_id) DO UPDATE SET
    overall_score = EXCLUDED.overall_score,
    total_reviews = EXCLUDED.total_reviews,
    avg_delivery_speed = EXCLUDED.avg_delivery_speed,
    avg_package_condition = EXCLUDED.avg_package_condition,
    avg_communication = EXCLUDED.avg_communication,
    last_updated = EXCLUDED.last_updated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DEMO DATA SEED COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Couriers: %', (SELECT COUNT(*) FROM Couriers);
    RAISE NOTICE '- Stores: %', (SELECT COUNT(*) FROM Stores);
    RAISE NOTICE '- Consumer Users: %', (SELECT COUNT(*) FROM Users WHERE user_role = 'consumer');
    RAISE NOTICE '- Orders: %', (SELECT COUNT(*) FROM Orders);
    RAISE NOTICE '- Reviews: %', (SELECT COUNT(*) FROM Reviews);
    RAISE NOTICE '- Verified Reviews: %', (SELECT COUNT(*) FROM Reviews WHERE is_verified = TRUE);
    RAISE NOTICE '- Public Reviews: %', (SELECT COUNT(*) FROM Reviews WHERE is_public = TRUE);
    RAISE NOTICE '';
    RAISE NOTICE 'Top Rated Couriers:';
END $$;

-- Show top couriers
SELECT 
    c.courier_name,
    t.overall_score,
    t.total_reviews,
    t.avg_delivery_speed,
    t.avg_package_condition,
    t.avg_communication
FROM Couriers c
JOIN TrustScoreCache t ON c.courier_id = t.courier_id
ORDER BY t.overall_score DESC
LIMIT 5;

-- Show review distribution
SELECT 
    c.courier_name,
    COUNT(*) as total_reviews,
    SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) as five_star,
    SUM(CASE WHEN r.rating = 4 THEN 1 ELSE 0 END) as four_star,
    SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as three_star,
    SUM(CASE WHEN r.rating = 2 THEN 1 ELSE 0 END) as two_star,
    SUM(CASE WHEN r.rating = 1 THEN 1 ELSE 0 END) as one_star
FROM Couriers c
LEFT JOIN Reviews r ON c.courier_id = r.courier_id
GROUP BY c.courier_name
ORDER BY c.courier_name;
