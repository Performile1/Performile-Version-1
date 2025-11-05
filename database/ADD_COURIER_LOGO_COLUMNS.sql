-- =====================================================
-- ADD COURIER LOGO COLUMNS
-- =====================================================
-- Date: November 5, 2025
-- Purpose: Add additional logo columns for dark mode and branding
-- =====================================================

-- Add logo columns if they don't exist
DO $$
BEGIN
    -- Add logo_dark_url for dark mode
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'couriers' AND column_name = 'logo_dark_url'
    ) THEN
        ALTER TABLE couriers ADD COLUMN logo_dark_url TEXT;
        RAISE NOTICE 'Added logo_dark_url column';
    END IF;

    -- Add logo_square_url for square version
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'couriers' AND column_name = 'logo_square_url'
    ) THEN
        ALTER TABLE couriers ADD COLUMN logo_square_url TEXT;
        RAISE NOTICE 'Added logo_square_url column';
    END IF;

    -- Add brand_color for courier branding
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'couriers' AND column_name = 'brand_color'
    ) THEN
        ALTER TABLE couriers ADD COLUMN brand_color VARCHAR(7);
        RAISE NOTICE 'Added brand_color column';
    END IF;
END $$;

-- Update major couriers with brand colors
UPDATE couriers SET brand_color = '#FFCC00' WHERE courier_name ILIKE '%DHL%';
UPDATE couriers SET brand_color = '#003087' WHERE courier_name ILIKE '%PostNord%';
UPDATE couriers SET brand_color = '#00B140' WHERE courier_name ILIKE '%Bring%';
UPDATE couriers SET brand_color = '#351C15' WHERE courier_name ILIKE '%UPS%';
UPDATE couriers SET brand_color = '#4D148C' WHERE courier_name ILIKE '%FedEx%';
UPDATE couriers SET brand_color = '#FF6B00' WHERE courier_name ILIKE '%Instabox%';
UPDATE couriers SET brand_color = '#FF5A5F' WHERE courier_name ILIKE '%Budbee%';
UPDATE couriers SET brand_color = '#00A3E0' WHERE courier_name ILIKE '%Porterbuddy%';
UPDATE couriers SET brand_color = '#E30613' WHERE courier_name ILIKE '%Schenker%';

-- Verify
SELECT 
    courier_name,
    logo_url,
    logo_dark_url,
    logo_square_url,
    brand_color
FROM couriers
WHERE is_active = TRUE
ORDER BY courier_name;

/*
COURIER BRAND COLORS:
- DHL: #FFCC00 (Yellow)
- PostNord: #003087 (Blue)
- Bring: #00B140 (Green)
- UPS: #351C15 (Brown)
- FedEx: #4D148C (Purple)
- Instabox: #FF6B00 (Orange)
- Budbee: #FF5A5F (Pink/Red)
- Porterbuddy: #00A3E0 (Light Blue)
- Schenker: #E30613 (Red)
*/
