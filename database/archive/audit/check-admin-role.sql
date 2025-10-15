-- Check what role the admin user actually has in the database
SELECT 
    user_id,
    email,
    user_role,
    first_name,
    last_name,
    is_active,
    is_verified,
    created_at
FROM Users
WHERE email = 'admin@performile.com';

-- If it shows consumer, update it to admin
UPDATE Users
SET user_role = 'admin'
WHERE email = 'admin@performile.com'
RETURNING user_id, email, user_role, first_name, last_name;
