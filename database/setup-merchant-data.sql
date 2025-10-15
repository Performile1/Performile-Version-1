-- ============================================================================
-- SETUP MERCHANT DATA
-- ============================================================================
-- Creates store and initial data for merchant@performile.com
-- ============================================================================

-- Create store for merchant
INSERT INTO Stores (
    store_name,
    owner_user_id,
    website_url,
    description,
    is_active
)
SELECT 
    'Demo Electronics Store',
    user_id,
    'https://demo-electronics.com',
    'A demo electronics store for testing Performile features',
    TRUE
FROM Users
WHERE email = 'merchant@performile.com'
ON CONFLICT DO NOTHING;

-- Create courier profile for courier user
INSERT INTO Couriers (
    courier_name,
    user_id,
    description,
    contact_email,
    contact_phone,
    is_active
)
SELECT 
    'Demo Courier Service',
    user_id,
    'Fast and reliable delivery service',
    'courier@performile.com',
    '+1234567892',
    TRUE
FROM Users
WHERE email = 'courier@performile.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify
SELECT 
    s.store_name,
    u.email as owner_email,
    s.is_active
FROM Stores s
JOIN Users u ON s.owner_user_id = u.user_id
WHERE u.email = 'merchant@performile.com';

SELECT 
    c.courier_name,
    u.email as courier_email,
    c.is_active
FROM Couriers c
JOIN Users u ON c.user_id = u.user_id
WHERE u.email = 'courier@performile.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Merchant store and courier profile created!';
    RAISE NOTICE '';
    RAISE NOTICE '🏪 Store: Demo Electronics Store';
    RAISE NOTICE '🚚 Courier: Demo Courier Service';
    RAISE NOTICE '';
    RAISE NOTICE '📧 You can now log in as:';
    RAISE NOTICE '   - merchant@performile.com (has a store)';
    RAISE NOTICE '   - courier@performile.com (has a courier profile)';
END $$;
