-- ============================================================================
-- CREATE CONSUMER USER
-- ============================================================================
-- Creates a consumer user for testing orders
-- ============================================================================

-- Create consumer user if doesn't exist
INSERT INTO Users (
    email,
    password_hash,
    user_role,
    first_name,
    last_name,
    phone,
    is_verified,
    is_active
)
SELECT
    'consumer@performile.com',
    crypt('Test1234!', gen_salt('bf')),
    'consumer',
    'John',
    'Customer',
    '+46701234569',
    TRUE,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM Users WHERE email = 'consumer@performile.com'
);

-- Verify
SELECT email, user_role, first_name, last_name, is_active
FROM Users
WHERE email = 'consumer@performile.com';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Consumer user created!';
    RAISE NOTICE 'Email: consumer@performile.com';
    RAISE NOTICE 'Password: Test1234!';
END $$;
