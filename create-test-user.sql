-- Check if test user exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'test@example.com') THEN
    -- Create test user with hashed password 'testpassword'
    INSERT INTO users (
      email, 
      name, 
      password_hash, 
      password_salt, 
      role, 
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      'test@example.com',
      'Test User',
      'a7f5f35426b927411fc9231b56382173b9be845f90a75cba6bc11dfdee13a0b9', -- hash of 'testpassword' with salt below
      'a1b2c3d4e5f6g7h8',
      'admin',
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Test user created with email: test@example.com and password: testpassword';
  ELSE
    RAISE NOTICE 'Test user already exists';
  END IF;
END $$;
