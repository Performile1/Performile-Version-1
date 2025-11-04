-- ============================================================================
-- VERIFY ORDERS TABLE SCHEMA
-- ============================================================================
-- Run this to check what columns exist in your orders table

-- Check if orders table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'orders'
        ) THEN '✅ orders table EXISTS'
        ELSE '❌ orders table DOES NOT EXIST'
    END as table_status;

-- List all columns in orders table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- Check specifically for postal_code column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = 'orders' 
              AND column_name = 'postal_code'
        ) THEN '✅ postal_code column EXISTS in orders table'
        ELSE '❌ postal_code column DOES NOT EXIST in orders table'
    END as postal_code_status;

-- Check for delivery address related columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'orders'
  AND column_name IN ('postal_code', 'delivery_postal_code', 'delivery_address', 'delivery_city', 'delivery_country')
ORDER BY column_name;
