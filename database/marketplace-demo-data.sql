-- ============================================================================
-- MARKETPLACE DEMO DATA - Leads, Downloads, and Competitor Insights
-- ============================================================================
-- Populates LeadsMarketplace and LeadDownloads with realistic demo data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE DEMO LEADS (Merchants posting delivery opportunities)
-- ============================================================================

DO $$
DECLARE
    v_merchant_id UUID;
    v_store_id UUID;
    v_lead_id UUID;
    v_courier_ids UUID[];
    v_random_courier UUID;
    i INTEGER;
BEGIN
    -- Get merchant user
    SELECT user_id INTO v_merchant_id FROM Users WHERE email = 'merchant@performile.com' LIMIT 1;
    
    IF v_merchant_id IS NULL THEN
        RAISE NOTICE 'Merchant user not found. Run create-test-users.sql first.';
        RETURN;
    END IF;

    -- Get merchant's store
    SELECT store_id INTO v_store_id FROM Stores WHERE owner_user_id = v_merchant_id LIMIT 1;
    
    IF v_store_id IS NULL THEN
        RAISE NOTICE 'Merchant store not found. Creating demo store...';
        INSERT INTO Stores (store_name, owner_user_id, website_url, description, is_active)
        VALUES ('Demo Store', v_merchant_id, 'https://demo-store.com', 'Demo store for testing', TRUE)
        RETURNING store_id INTO v_store_id;
    END IF;

    -- Get all courier user IDs for random downloads
    SELECT ARRAY_AGG(user_id) INTO v_courier_ids
    FROM Users WHERE user_role = 'courier';

    -- Delete existing demo leads
    DELETE FROM LeadDownloads WHERE lead_id IN (
        SELECT lead_id FROM LeadsMarketplace WHERE merchant_id = v_merchant_id
    );
    DELETE FROM LeadsMarketplace WHERE merchant_id = v_merchant_id;

    -- Create 15 demo leads
    FOR i IN 1..15 LOOP
        INSERT INTO LeadsMarketplace (
            merchant_id,
            store_id,
            title,
            description,
            delivery_volume,
            postal_codes,
            cities,
            countries,
            budget_min,
            budget_max,
            requirements_json,
            status,
            price,
            download_count,
            expires_at,
            created_at
        ) VALUES (
            v_merchant_id,
            v_store_id,
            CASE 
                WHEN i % 5 = 0 THEN 'High Volume E-commerce Deliveries'
                WHEN i % 5 = 1 THEN 'Same-Day Delivery Service Needed'
                WHEN i % 5 = 2 THEN 'Weekly Grocery Delivery Route'
                WHEN i % 5 = 3 THEN 'Express Document Courier Service'
                ELSE 'Regular Parcel Delivery - Stockholm Area'
            END,
            CASE 
                WHEN i % 5 = 0 THEN 'Looking for reliable courier for daily e-commerce deliveries. Must handle 50-100 packages per day.'
                WHEN i % 5 = 1 THEN 'Need same-day delivery service for urgent orders. Flexible schedule required.'
                WHEN i % 5 = 2 THEN 'Weekly grocery delivery route covering northern Stockholm suburbs.'
                WHEN i % 5 = 3 THEN 'Express courier needed for time-sensitive business documents.'
                ELSE 'Standard parcel delivery service for online retail store. Consistent volume.'
            END,
            CASE 
                WHEN i % 5 = 0 THEN 2000 + (random() * 1000)::INT
                WHEN i % 5 = 1 THEN 500 + (random() * 500)::INT
                WHEN i % 5 = 2 THEN 300 + (random() * 200)::INT
                WHEN i % 5 = 3 THEN 100 + (random() * 100)::INT
                ELSE 800 + (random() * 400)::INT
            END,
            CASE 
                WHEN i % 3 = 0 THEN ARRAY['11122', '11123', '11124', '11125']
                WHEN i % 3 = 1 THEN ARRAY['17177', '17178', '17179']
                ELSE ARRAY['10405', '10406', '10407', '10408']
            END,
            CASE 
                WHEN i % 3 = 0 THEN ARRAY['Stockholm', 'Solna']
                WHEN i % 3 = 1 THEN ARRAY['Oslo', 'Bergen']
                ELSE ARRAY['Copenhagen', 'Aarhus']
            END,
            CASE 
                WHEN i % 3 = 0 THEN ARRAY['Sweden']
                WHEN i % 3 = 1 THEN ARRAY['Norway']
                ELSE ARRAY['Denmark']
            END,
            CASE 
                WHEN i % 5 = 0 THEN 15000.00
                WHEN i % 5 = 1 THEN 8000.00
                WHEN i % 5 = 2 THEN 5000.00
                WHEN i % 5 = 3 THEN 3000.00
                ELSE 10000.00
            END,
            CASE 
                WHEN i % 5 = 0 THEN 25000.00
                WHEN i % 5 = 1 THEN 15000.00
                WHEN i % 5 = 2 THEN 8000.00
                WHEN i % 5 = 3 THEN 6000.00
                ELSE 18000.00
            END,
            jsonb_build_object(
                'vehicle_type', CASE WHEN random() < 0.5 THEN 'van' ELSE 'car' END,
                'insurance_required', TRUE,
                'background_check', random() > 0.3,
                'min_experience_years', CASE WHEN random() < 0.3 THEN 2 ELSE 1 END
            ),
            CASE WHEN random() < 0.8 THEN 'active' ELSE 'filled' END,
            CASE 
                WHEN i % 5 = 0 THEN 49.00
                WHEN i % 5 = 1 THEN 29.00
                WHEN i % 5 = 2 THEN 19.00
                WHEN i % 5 = 3 THEN 15.00
                ELSE 25.00
            END,
            0, -- Will be updated by downloads
            NOW() + INTERVAL '30 days' + (random() * 30 || ' days')::INTERVAL,
            NOW() - (random() * 14 || ' days')::INTERVAL
        ) RETURNING lead_id INTO v_lead_id;

        -- Randomly add downloads from couriers (0-5 downloads per lead)
        FOR j IN 1..(random() * 5)::INT LOOP
            IF v_courier_ids IS NOT NULL AND array_length(v_courier_ids, 1) > 0 THEN
                v_random_courier := v_courier_ids[1 + floor(random() * array_length(v_courier_ids, 1))::INT];
                
                -- Insert download if not already exists
                INSERT INTO LeadDownloads (lead_id, courier_id, downloaded_at, status)
                VALUES (
                    v_lead_id,
                    v_random_courier,
                    NOW() - (random() * 10 || ' days')::INTERVAL,
                    CASE 
                        WHEN random() < 0.2 THEN 'won'
                        WHEN random() < 0.4 THEN 'contacted'
                        WHEN random() < 0.6 THEN 'lost'
                        ELSE 'downloaded'
                    END
                )
                ON CONFLICT (lead_id, courier_id) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;

    -- Update download counts
    UPDATE LeadsMarketplace l
    SET download_count = (
        SELECT COUNT(*) FROM LeadDownloads WHERE lead_id = l.lead_id
    );

    RAISE NOTICE '✅ Created 15 demo leads with random downloads';
END $$;

-- ============================================================================
-- 2. VERIFICATION QUERIES
-- ============================================================================

-- Show all leads with download counts
SELECT 
    l.title,
    l.delivery_volume,
    l.price,
    l.download_count,
    l.status,
    l.cities,
    l.countries,
    s.store_name,
    u.email as merchant_email
FROM LeadsMarketplace l
JOIN Stores s ON l.store_id = s.store_id
JOIN Users u ON l.merchant_id = u.user_id
ORDER BY l.created_at DESC;

-- Show lead downloads
SELECT 
    l.title,
    u.email as courier_email,
    ld.downloaded_at,
    ld.status
FROM LeadDownloads ld
JOIN LeadsMarketplace l ON ld.lead_id = l.lead_id
JOIN Users u ON ld.courier_id = u.user_id
ORDER BY ld.downloaded_at DESC
LIMIT 20;

-- Show leads by status
SELECT 
    status,
    COUNT(*) as count,
    SUM(download_count) as total_downloads,
    AVG(price) as avg_price
FROM LeadsMarketplace
GROUP BY status;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
DECLARE
    v_lead_count INTEGER;
    v_download_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_lead_count FROM LeadsMarketplace;
    SELECT COUNT(*) INTO v_download_count FROM LeadDownloads;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MARKETPLACE DEMO DATA CREATED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '- Total Leads: %', v_lead_count;
    RAISE NOTICE '- Total Downloads: %', v_download_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Lead Categories:';
    RAISE NOTICE '- High Volume E-commerce';
    RAISE NOTICE '- Same-Day Delivery';
    RAISE NOTICE '- Weekly Grocery Routes';
    RAISE NOTICE '- Express Documents';
    RAISE NOTICE '- Regular Parcels';
    RAISE NOTICE '';
    RAISE NOTICE 'Price Range: $15 - $49 per lead';
    RAISE NOTICE 'Locations: Sweden, Norway, Denmark';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Marketplace is ready for testing!';
END $$;
