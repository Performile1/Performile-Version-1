-- =====================================================
-- ADD COUNTRY COLUMN TO USERS TABLE
-- Store user's country for localization and analytics
-- =====================================================
-- Date: November 5, 2025
-- Purpose: Add country field for better user segmentation
-- Benefits: Performance analytics, localization, compliance
-- =====================================================

-- Step 1: Add country column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(2);

-- Step 2: Add comment to explain the column
COMMENT ON COLUMN users.country IS 'ISO 3166-1 alpha-2 country code (e.g., NO, SE, DK, FI, US, GB)';

-- Step 3: Create index for country-based queries
CREATE INDEX IF NOT EXISTS idx_users_country 
ON users(country) 
WHERE country IS NOT NULL;

-- Step 4: Update existing users with default country (Norway - our primary market)
-- Only update users who don't have a country set
UPDATE users 
SET country = 'NO' 
WHERE country IS NULL 
  AND user_role IN ('merchant', 'courier');

-- Step 5: Verify the changes
SELECT 
    country,
    user_role,
    COUNT(*) as user_count
FROM users
WHERE user_role IN ('merchant', 'courier')
GROUP BY country, user_role
ORDER BY country, user_role;

-- =====================================================
-- BENEFITS OF COUNTRY COLUMN
-- =====================================================

-- 1. PERFORMANCE ANALYTICS
--    - Merchants can see data for their own country first
--    - Better default experience
--    - Relevant data prioritization

-- 2. LOCALIZATION
--    - Show prices in local currency
--    - Display local couriers first
--    - Language preferences

-- 3. COMPLIANCE
--    - GDPR (EU countries)
--    - Data residency requirements
--    - Tax calculations

-- 4. BUSINESS INTELLIGENCE
--    - Market penetration by country
--    - Revenue by geography
--    - Growth opportunities

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Example 1: Get users by country
-- SELECT email, user_role, country, created_at
-- FROM users
-- WHERE country = 'NO'
-- ORDER BY created_at DESC;

-- Example 2: Count users per country
-- SELECT 
--     country,
--     COUNT(*) as total_users,
--     COUNT(CASE WHEN user_role = 'merchant' THEN 1 END) as merchants,
--     COUNT(CASE WHEN user_role = 'courier' THEN 1 END) as couriers
-- FROM users
-- WHERE country IS NOT NULL
-- GROUP BY country
-- ORDER BY total_users DESC;

-- Example 3: Performance analytics with user's country
-- SELECT * FROM check_performance_view_access(
--     'user-uuid'::UUID,
--     (SELECT country FROM users WHERE user_id = 'user-uuid'::UUID),
--     30
-- );

-- =====================================================
-- UPDATE REGISTRATION PROCESS
-- =====================================================

-- After adding this column, update registration to capture country:
-- 
-- Frontend (EnhancedRegisterFormV2.tsx):
-- - Add country selector dropdown
-- - Use ISO 3166-1 alpha-2 codes
-- - Default to user's detected country (IP-based)
-- 
-- Backend (api/auth/register.ts):
-- - Accept country in registration payload
-- - Validate country code
-- - Store in users table

-- =====================================================
-- COUNTRY CODES REFERENCE (Nordic + Common)
-- =====================================================

-- Nordic Countries:
-- NO - Norway
-- SE - Sweden
-- DK - Denmark
-- FI - Finland
-- IS - Iceland

-- Other European:
-- GB - United Kingdom
-- DE - Germany
-- FR - France
-- NL - Netherlands
-- BE - Belgium

-- Global:
-- US - United States
-- CA - Canada
-- AU - Australia
-- NZ - New Zealand

-- =====================================================
-- VALIDATION FUNCTION (Optional)
-- =====================================================

CREATE OR REPLACE FUNCTION validate_country_code(p_country_code VARCHAR(2))
RETURNS BOOLEAN AS $$
BEGIN
    -- List of valid ISO 3166-1 alpha-2 country codes
    -- This is a simplified list - add more as needed
    RETURN p_country_code IN (
        'NO', 'SE', 'DK', 'FI', 'IS',  -- Nordic
        'GB', 'DE', 'FR', 'NL', 'BE',  -- Europe
        'US', 'CA', 'AU', 'NZ',        -- English-speaking
        'PL', 'ES', 'IT', 'PT', 'AT',  -- More Europe
        'CH', 'IE', 'LU', 'EE', 'LV',  -- More Europe
        'LT', 'CZ', 'SK', 'HU', 'RO',  -- Eastern Europe
        'BG', 'HR', 'SI', 'GR', 'CY'   -- Southern Europe
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint (optional - can be too restrictive)
-- ALTER TABLE users 
-- ADD CONSTRAINT users_country_valid 
-- CHECK (country IS NULL OR validate_country_code(country));

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================

-- To remove the country column:
-- ALTER TABLE users DROP COLUMN IF EXISTS country;
-- DROP INDEX IF EXISTS idx_users_country;
-- DROP FUNCTION IF EXISTS validate_country_code(VARCHAR);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check column was added
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'country';

-- Check index was created
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'users' 
  AND indexname = 'idx_users_country';

-- Check data distribution
SELECT 
    country,
    COUNT(*) as count,
    ROUND(COUNT(*)::NUMERIC / SUM(COUNT(*)) OVER () * 100, 2) as percentage
FROM users
WHERE country IS NOT NULL
GROUP BY country
ORDER BY count DESC;

-- =====================================================
-- SUCCESS CRITERIA
-- =====================================================
-- ✅ Column added to users table
-- ✅ Index created for performance
-- ✅ Existing users updated with default country
-- ✅ Validation function created
-- ✅ Ready for use in performance analytics
-- =====================================================
