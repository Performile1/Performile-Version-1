-- =====================================================
-- ADD COUNTRY COLUMN TO USERS TABLE
-- =====================================================

-- Add country column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS country VARCHAR(2);

-- Add comment
COMMENT ON COLUMN users.country IS 'ISO 3166-1 alpha-2 country code (e.g., NO, SE, DK, FI, US, GB)';

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_country 
ON users(country) 
WHERE country IS NOT NULL;

-- Update existing users with default country (Norway)
UPDATE users 
SET country = 'NO' 
WHERE country IS NULL 
  AND user_role IN ('merchant', 'courier');

-- Verify the changes
SELECT 
    country,
    user_role,
    COUNT(*) as user_count
FROM users
WHERE user_role IN ('merchant', 'courier')
GROUP BY country, user_role
ORDER BY country, user_role;
