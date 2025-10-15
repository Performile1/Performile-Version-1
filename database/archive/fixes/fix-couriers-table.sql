-- ============================================================================
-- FIX COURIERS TABLE - Add Missing Columns
-- ============================================================================
-- This script adds missing columns to the existing couriers table
-- Safe to run multiple times
-- ============================================================================

-- Add courier_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'courier_code'
    ) THEN
        ALTER TABLE couriers ADD COLUMN courier_code VARCHAR(50) UNIQUE;
        RAISE NOTICE 'Added courier_code column';
    ELSE
        RAISE NOTICE 'courier_code column already exists';
    END IF;
END $$;

-- Add courier_description column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'courier_description'
    ) THEN
        ALTER TABLE couriers ADD COLUMN courier_description TEXT;
        RAISE NOTICE 'Added courier_description column';
    ELSE
        RAISE NOTICE 'courier_description column already exists';
    END IF;
END $$;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE couriers ADD COLUMN user_id UUID REFERENCES users(user_id) ON DELETE SET NULL;
        RAISE NOTICE 'Added user_id column';
    ELSE
        RAISE NOTICE 'user_id column already exists';
    END IF;
END $$;

-- Add contact_email column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'contact_email'
    ) THEN
        ALTER TABLE couriers ADD COLUMN contact_email VARCHAR(255);
        RAISE NOTICE 'Added contact_email column';
    ELSE
        RAISE NOTICE 'contact_email column already exists';
    END IF;
END $$;

-- Add contact_phone column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'contact_phone'
    ) THEN
        ALTER TABLE couriers ADD COLUMN contact_phone VARCHAR(20);
        RAISE NOTICE 'Added contact_phone column';
    ELSE
        RAISE NOTICE 'contact_phone column already exists';
    END IF;
END $$;

-- Add website_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'website_url'
    ) THEN
        ALTER TABLE couriers ADD COLUMN website_url VARCHAR(255);
        RAISE NOTICE 'Added website_url column';
    ELSE
        RAISE NOTICE 'website_url column already exists';
    END IF;
END $$;

-- Add service_types column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'service_types'
    ) THEN
        ALTER TABLE couriers ADD COLUMN service_types VARCHAR(255)[];
        RAISE NOTICE 'Added service_types column';
    ELSE
        RAISE NOTICE 'service_types column already exists';
    END IF;
END $$;

-- Add coverage_countries column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'coverage_countries'
    ) THEN
        ALTER TABLE couriers ADD COLUMN coverage_countries VARCHAR(100)[];
        RAISE NOTICE 'Added coverage_countries column';
    ELSE
        RAISE NOTICE 'coverage_countries column already exists';
    END IF;
END $$;

-- Add tracking_url_template column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'tracking_url_template'
    ) THEN
        ALTER TABLE couriers ADD COLUMN tracking_url_template TEXT;
        RAISE NOTICE 'Added tracking_url_template column';
    ELSE
        RAISE NOTICE 'tracking_url_template column already exists';
    END IF;
END $$;

-- Add api_endpoint column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'api_endpoint'
    ) THEN
        ALTER TABLE couriers ADD COLUMN api_endpoint TEXT;
        RAISE NOTICE 'Added api_endpoint column';
    ELSE
        RAISE NOTICE 'api_endpoint column already exists';
    END IF;
END $$;

-- Add api_key_encrypted column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'api_key_encrypted'
    ) THEN
        ALTER TABLE couriers ADD COLUMN api_key_encrypted TEXT;
        RAISE NOTICE 'Added api_key_encrypted column';
    ELSE
        RAISE NOTICE 'api_key_encrypted column already exists';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE couriers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;

-- Add logo_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE couriers ADD COLUMN logo_url TEXT;
        RAISE NOTICE 'Added logo_url column';
    ELSE
        RAISE NOTICE 'logo_url column already exists';
    END IF;
END $$;

-- Add average_delivery_time_days column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'average_delivery_time_days'
    ) THEN
        ALTER TABLE couriers ADD COLUMN average_delivery_time_days DECIMAL(5,2);
        RAISE NOTICE 'Added average_delivery_time_days column';
    ELSE
        RAISE NOTICE 'average_delivery_time_days column already exists';
    END IF;
END $$;

-- Add on_time_delivery_rate column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'on_time_delivery_rate'
    ) THEN
        ALTER TABLE couriers ADD COLUMN on_time_delivery_rate DECIMAL(5,2);
        RAISE NOTICE 'Added on_time_delivery_rate column';
    ELSE
        RAISE NOTICE 'on_time_delivery_rate column already exists';
    END IF;
END $$;

-- Add customer_rating column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'customer_rating'
    ) THEN
        ALTER TABLE couriers ADD COLUMN customer_rating DECIMAL(3,2);
        RAISE NOTICE 'Added customer_rating column';
    ELSE
        RAISE NOTICE 'customer_rating column already exists';
    END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE couriers ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column';
    ELSE
        RAISE NOTICE 'metadata column already exists';
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE couriers ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'couriers' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE couriers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_couriers_code ON couriers(courier_code);
CREATE INDEX IF NOT EXISTS idx_couriers_active ON couriers(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_couriers_user ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_name ON couriers(courier_name);

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_couriers_updated_at'
    ) THEN
        CREATE TRIGGER update_couriers_updated_at 
            BEFORE UPDATE ON couriers
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_couriers_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_couriers_updated_at trigger already exists';
    END IF;
END $$;

-- Display current couriers table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'couriers'
ORDER BY ordinal_position;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Couriers table update complete!';
    RAISE NOTICE '============================================';
END $$;
