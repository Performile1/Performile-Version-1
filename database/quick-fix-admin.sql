-- Quick fix for admin user role
UPDATE Users SET user_role = 'admin' WHERE email = 'admin@performile.com';

-- Verify
SELECT email, user_role, first_name, last_name FROM Users WHERE email = 'admin@performile.com';
