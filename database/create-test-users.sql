-- ============================================================================
-- CREATE TEST USERS FOR PERFORMILE
-- ============================================================================
-- Run this in Supabase SQL Editor to create test users
-- Password for all users: Test1234!
-- ============================================================================

-- Insert test users with bcrypt hashed passwords
-- Password: Test1234! (hashed with bcrypt, cost 10)
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
    -- Admin User
    (
        'admin@performile.com',
        '$2b$10$YourHashedPasswordHere', -- You'll need to generate this
        'admin',
        'Admin',
        'User',
        '+1234567890',
        TRUE,
        TRUE
    ),
    -- Merchant User
    (
        'merchant@performile.com',
        '$2b$10$YourHashedPasswordHere', -- You'll need to generate this
        'merchant',
        'Merchant',
        'User',
        '+1234567891',
        TRUE,
        TRUE
    ),
    -- Courier User
    (
        'courier@performile.com',
        '$2b$10$YourHashedPasswordHere', -- You'll need to generate this
        'courier',
        'Courier',
        'User',
        '+1234567892',
        TRUE,
        TRUE
    )
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- ALTERNATIVE: Use pgcrypto extension to hash passwords in SQL
-- ============================================================================
-- This is a better approach - hashes the password directly in SQL

-- First, ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Delete existing test users if they exist
DELETE FROM Users WHERE email IN (
    'admin@performile.com',
    'merchant@performile.com',
    'courier@performile.com'
);

-- Insert test users with passwords hashed using pgcrypto
-- Password for all users: Test1234!
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
    -- Admin User
    (
        'admin@performile.com',
        crypt('Test1234!', gen_salt('bf', 10)),
        'admin',
        'Admin',
        'User',
        '+1234567890',
        TRUE,
        TRUE
    ),
    -- Merchant User
    (
        'merchant@performile.com',
        crypt('Test1234!', gen_salt('bf', 10)),
        'merchant',
        'Merchant',
        'Demo',
        '+1234567891',
        TRUE,
        TRUE
    ),
    -- Courier User
    (
        'courier@performile.com',
        crypt('Test1234!', gen_salt('bf', 10)),
        'courier',
        'Courier',
        'Demo',
        '+1234567892',
        TRUE,
        TRUE
    );

-- ============================================================================
-- CREATE DEMO DATA FOR TEST USERS
-- ============================================================================

-- Create a demo store for the merchant
INSERT INTO Stores (
    store_name,
    owner_user_id,
    website_url,
    description,
    is_active
)
SELECT 
    'Demo Store',
    user_id,
    'https://demo-store.com',
    'A demo store for testing Performile features',
    TRUE
FROM Users
WHERE email = 'merchant@performile.com'
ON CONFLICT DO NOTHING;

-- Create a demo courier profile
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
    'A demo courier service for testing Performile features',
    'courier@performile.com',
    '+1234567892',
    TRUE
FROM Users
WHERE email = 'courier@performile.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that users were created successfully
SELECT 
    email,
    user_role,
    first_name,
    last_name,
    is_verified,
    is_active,
    created_at
FROM Users
WHERE email IN (
    'admin@performile.com',
    'merchant@performile.com',
    'courier@performile.com'
)
ORDER BY user_role;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Test users created successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Login credentials:';
    RAISE NOTICE '   Email: admin@performile.com';
    RAISE NOTICE '   Email: merchant@performile.com';
    RAISE NOTICE '   Email: courier@performile.com';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 Password for all users: Test1234!';
    RAISE NOTICE '';
    RAISE NOTICE '👤 Roles:';
    RAISE NOTICE '   - Admin: Full system access';
    RAISE NOTICE '   - Merchant: Store management and analytics';
    RAISE NOTICE '   - Courier: Performance tracking and leads';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 You can now log in with these credentials!';
END $$;
