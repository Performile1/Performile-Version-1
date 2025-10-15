-- ============================================================================
-- FIX ADMIN USER ROLE
-- ============================================================================
-- Updates the admin@performile.com user to have admin role
-- ============================================================================

-- Check current admin user
SELECT 
    user_id,
    email,
    user_role,
    first_name,
    last_name,
    is_active
FROM Users
WHERE email = 'admin@performile.com';

-- Update admin user to have admin role
UPDATE Users
SET 
    user_role = 'admin',
    first_name = 'Admin',
    last_name = 'User',
    is_verified = TRUE,
    is_active = TRUE
WHERE email = 'admin@performile.com';

-- If admin user doesn't exist, create it
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
    'admin@performile.com',
    crypt('Test1234!', gen_salt('bf')),
    'admin',
    'Admin',
    'User',
    '+1234567890',
    TRUE,
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM Users WHERE email = 'admin@performile.com'
);

-- Verify the fix
SELECT 
    user_id,
    email,
    user_role,
    first_name,
    last_name,
    is_active,
    is_verified
FROM Users
WHERE email = 'admin@performile.com';

-- Show success message
DO $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT user_role INTO v_role FROM Users WHERE email = 'admin@performile.com';
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'ADMIN USER VERIFICATION';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Email: admin@performile.com';
    RAISE NOTICE 'Role: %', v_role;
    RAISE NOTICE 'Password: Test1234!';
    RAISE NOTICE '';
    
    IF v_role = 'admin' THEN
        RAISE NOTICE '✅ Admin user has correct role!';
    ELSE
        RAISE NOTICE '❌ WARNING: Admin user role is %, expected admin', v_role;
    END IF;
END $$;
