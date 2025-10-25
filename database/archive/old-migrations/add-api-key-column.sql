-- =====================================================
-- Add API Key Column to Users Table
-- =====================================================
-- Allows merchants to authenticate plugin requests
-- =====================================================

-- Add api_key column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'api_key'
    ) THEN
        ALTER TABLE users ADD COLUMN api_key VARCHAR(255) UNIQUE;
        CREATE INDEX idx_users_api_key ON users(api_key) WHERE api_key IS NOT NULL;
    END IF;
END $$;

-- Function to generate API key for existing users
CREATE OR REPLACE FUNCTION generate_api_key_for_user(p_user_id UUID)
RETURNS VARCHAR(255) AS $$
DECLARE
  v_api_key VARCHAR(255);
BEGIN
  -- Generate a random API key
  v_api_key := 'pk_' || encode(gen_random_bytes(32), 'hex');
  
  -- Update user
  UPDATE users
  SET api_key = v_api_key
  WHERE user_id = p_user_id;
  
  RETURN v_api_key;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'API key column added successfully!' as status;
