-- =====================================================
-- RESET TEST USER PASSWORD
-- =====================================================
-- Sets password to 'Test123!' for testing

-- For anna.andersson@email.se
-- Password will be: Test123!
-- Bcrypt hash with 10 rounds

UPDATE users 
SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'anna.andersson@email.se';

-- Verify update
SELECT 
  email,
  user_role,
  'Password reset to: Test123!' as new_password
FROM users 
WHERE email = 'anna.andersson@email.se';

SELECT '
========================================
✅ PASSWORD RESET
========================================

User: anna.andersson@email.se
New Password: Test123!

You can now login with:
- Email: anna.andersson@email.se
- Password: Test123!

Expected Result:
- Should see 7 orders only
- Not all 105 orders

========================================
' as info;
