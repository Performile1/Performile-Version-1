-- ============================================================================
-- FIX ORDERS TABLE - Add Missing Columns
-- ============================================================================
-- This script adds missing columns to the existing orders table
-- Safe to run multiple times
-- ============================================================================

-- Add customer_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_id UUID REFERENCES users(user_id) ON DELETE SET NULL;
        RAISE NOTICE 'Added customer_id column';
    ELSE
        RAISE NOTICE 'customer_id column already exists';
    END IF;
END $$;

-- Add consumer_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'consumer_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN consumer_id UUID;
        RAISE NOTICE 'Added consumer_id column';
    ELSE
        RAISE NOTICE 'consumer_id column already exists';
    END IF;
END $$;

-- Add order_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(255);
        RAISE NOTICE 'Added order_number column';
    ELSE
        RAISE NOTICE 'order_number column already exists';
    END IF;
END $$;

-- Add order_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_status VARCHAR(50) DEFAULT 'pending';
        RAISE NOTICE 'Added order_status column';
    ELSE
        RAISE NOTICE 'order_status column already exists';
    END IF;
END $$;

-- Add ship_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'ship_date'
    ) THEN
        ALTER TABLE orders ADD COLUMN ship_date DATE;
        RAISE NOTICE 'Added ship_date column';
    ELSE
        RAISE NOTICE 'ship_date column already exists';
    END IF;
END $$;

-- Add delivery_address column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_address'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        RAISE NOTICE 'Added delivery_address column';
    ELSE
        RAISE NOTICE 'delivery_address column already exists';
    END IF;
END $$;

-- Add state_province column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'state_province'
    ) THEN
        ALTER TABLE orders ADD COLUMN state_province VARCHAR(100);
        RAISE NOTICE 'Added state_province column';
    ELSE
        RAISE NOTICE 'state_province column already exists';
    END IF;
END $$;

-- Add country column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE orders ADD COLUMN country VARCHAR(100);
        RAISE NOTICE 'Added country column';
    ELSE
        RAISE NOTICE 'country column already exists';
    END IF;
END $$;

-- Add city column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE orders ADD COLUMN city VARCHAR(100);
        RAISE NOTICE 'Added city column';
    ELSE
        RAISE NOTICE 'city column already exists';
    END IF;
END $$;

-- Add postal_code column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN postal_code VARCHAR(20);
        RAISE NOTICE 'Added postal_code column';
    ELSE
        RAISE NOTICE 'postal_code column already exists';
    END IF;
END $$;

-- Add estimated_delivery column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'estimated_delivery'
    ) THEN
        ALTER TABLE orders ADD COLUMN estimated_delivery DATE;
        RAISE NOTICE 'Added estimated_delivery column';
    ELSE
        RAISE NOTICE 'estimated_delivery column already exists';
    END IF;
END $$;

-- Add level_of_service column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'level_of_service'
    ) THEN
        ALTER TABLE orders ADD COLUMN level_of_service VARCHAR(100);
        RAISE NOTICE 'Added level_of_service column';
    ELSE
        RAISE NOTICE 'level_of_service column already exists';
    END IF;
END $$;

-- Add type_of_delivery column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'type_of_delivery'
    ) THEN
        ALTER TABLE orders ADD COLUMN type_of_delivery VARCHAR(100);
        RAISE NOTICE 'Added type_of_delivery column';
    ELSE
        RAISE NOTICE 'type_of_delivery column already exists';
    END IF;
END $$;

-- Add package_weight column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'package_weight'
    ) THEN
        ALTER TABLE orders ADD COLUMN package_weight DECIMAL(10,2);
        RAISE NOTICE 'Added package_weight column';
    ELSE
        RAISE NOTICE 'package_weight column already exists';
    END IF;
END $$;

-- Add package_dimensions column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'package_dimensions'
    ) THEN
        ALTER TABLE orders ADD COLUMN package_dimensions VARCHAR(50);
        RAISE NOTICE 'Added package_dimensions column';
    ELSE
        RAISE NOTICE 'package_dimensions column already exists';
    END IF;
END $$;

-- Add package_value column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'package_value'
    ) THEN
        ALTER TABLE orders ADD COLUMN package_value DECIMAL(10,2);
        RAISE NOTICE 'Added package_value column';
    ELSE
        RAISE NOTICE 'package_value column already exists';
    END IF;
END $$;

-- Add package_currency column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'package_currency'
    ) THEN
        ALTER TABLE orders ADD COLUMN package_currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added package_currency column';
    ELSE
        RAISE NOTICE 'package_currency column already exists';
    END IF;
END $$;

-- Add current_location column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'current_location'
    ) THEN
        ALTER TABLE orders ADD COLUMN current_location VARCHAR(255);
        RAISE NOTICE 'Added current_location column';
    ELSE
        RAISE NOTICE 'current_location column already exists';
    END IF;
END $$;

-- Add last_scan_time column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'last_scan_time'
    ) THEN
        ALTER TABLE orders ADD COLUMN last_scan_time TIMESTAMPTZ;
        RAISE NOTICE 'Added last_scan_time column';
    ELSE
        RAISE NOTICE 'last_scan_time column already exists';
    END IF;
END $$;

-- Add delivery_signature column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_signature'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_signature TEXT;
        RAISE NOTICE 'Added delivery_signature column';
    ELSE
        RAISE NOTICE 'delivery_signature column already exists';
    END IF;
END $$;

-- Add delivery_photo_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_photo_url'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_photo_url TEXT;
        RAISE NOTICE 'Added delivery_photo_url column';
    ELSE
        RAISE NOTICE 'delivery_photo_url column already exists';
    END IF;
END $$;

-- Add special_instructions column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'special_instructions'
    ) THEN
        ALTER TABLE orders ADD COLUMN special_instructions TEXT;
        RAISE NOTICE 'Added special_instructions column';
    ELSE
        RAISE NOTICE 'special_instructions column already exists';
    END IF;
END $$;

-- Add reference_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'reference_number'
    ) THEN
        ALTER TABLE orders ADD COLUMN reference_number VARCHAR(255);
        RAISE NOTICE 'Added reference_number column';
    ELSE
        RAISE NOTICE 'reference_number column already exists';
    END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE orders ADD COLUMN metadata JSONB;
        RAISE NOTICE 'Added metadata column';
    ELSE
        RAISE NOTICE 'metadata column already exists';
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_country ON orders(country);
CREATE INDEX IF NOT EXISTS idx_orders_postal_code ON orders(postal_code);

-- Add trigger for updated_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_orders_updated_at'
    ) THEN
        CREATE TRIGGER update_orders_updated_at 
            BEFORE UPDATE ON orders
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_orders_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_orders_updated_at trigger already exists';
    END IF;
END $$;

-- Display current orders table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Orders table update complete!';
    RAISE NOTICE '============================================';
END $$;
