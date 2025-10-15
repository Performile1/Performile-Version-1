-- ============================================================================
-- IMPORT SWEDISH POSTAL CODES FROM GEONAMES
-- ============================================================================
-- Dataset: http://download.geonames.org/export/zip/SE.zip
-- Format: country code, postal code, place name, admin name1, admin code1, 
--         admin name2, admin code2, admin name3, admin code3, latitude, 
--         longitude, accuracy
-- ============================================================================

-- ============================================================================
-- STEP 1: Download the dataset
-- ============================================================================
-- Manual steps:
-- 1. Download: wget http://download.geonames.org/export/zip/SE.zip
-- 2. Unzip: unzip SE.zip
-- 3. You'll get SE.txt file
-- 4. Upload to Supabase or accessible location

-- ============================================================================
-- STEP 2: Create temporary import table
-- ============================================================================

CREATE TEMP TABLE IF NOT EXISTS postal_codes_import (
    country_code VARCHAR(2),
    postal_code VARCHAR(10),
    place_name VARCHAR(255),
    admin_name1 VARCHAR(255),  -- County
    admin_code1 VARCHAR(20),
    admin_name2 VARCHAR(255),  -- Municipality
    admin_code2 VARCHAR(20),
    admin_name3 VARCHAR(255),
    admin_code3 VARCHAR(20),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    accuracy INTEGER
);

-- ============================================================================
-- STEP 3: Import data from CSV
-- ============================================================================
-- NOTE: Update the file path to where you uploaded SE.txt
-- For Supabase: Use the SQL Editor and paste the CSV data directly

-- Example import command (adjust path):
-- COPY postal_codes_import FROM '/path/to/SE.txt' 
-- DELIMITER E'\t' 
-- CSV HEADER;

-- ============================================================================
-- STEP 4: Clean and insert into postal_codes table
-- ============================================================================

-- For now, let's add more sample data for testing
-- This represents major Swedish cities and their postal codes

INSERT INTO postal_codes (postal_code, city, municipality, county, latitude, longitude, area_type)
VALUES 
    -- Stockholm (Central)
    ('11120', 'Stockholm', 'Stockholm', 'Stockholm', 59.3293, 18.0686, 'urban'),
    ('11121', 'Stockholm', 'Stockholm', 'Stockholm', 59.3295, 18.0690, 'urban'),
    ('11122', 'Stockholm', 'Stockholm', 'Stockholm', 59.3293, 18.0686, 'urban'),
    ('11123', 'Stockholm', 'Stockholm', 'Stockholm', 59.3300, 18.0700, 'urban'),
    ('11124', 'Stockholm', 'Stockholm', 'Stockholm', 59.3310, 18.0720, 'urban'),
    ('11125', 'Stockholm', 'Stockholm', 'Stockholm', 59.3320, 18.0740, 'urban'),
    ('11126', 'Stockholm', 'Stockholm', 'Stockholm', 59.3330, 18.0760, 'urban'),
    ('11127', 'Stockholm', 'Stockholm', 'Stockholm', 59.3340, 18.0780, 'urban'),
    ('11128', 'Stockholm', 'Stockholm', 'Stockholm', 59.3350, 18.0800, 'urban'),
    ('11129', 'Stockholm', 'Stockholm', 'Stockholm', 59.3360, 18.0820, 'urban'),
    
    -- Stockholm (Södermalm)
    ('11830', 'Stockholm', 'Stockholm', 'Stockholm', 59.3140, 18.0750, 'urban'),
    ('11831', 'Stockholm', 'Stockholm', 'Stockholm', 59.3150, 18.0760, 'urban'),
    ('11832', 'Stockholm', 'Stockholm', 'Stockholm', 59.3160, 18.0770, 'urban'),
    
    -- Stockholm (Östermalm)
    ('11420', 'Stockholm', 'Stockholm', 'Stockholm', 59.3400, 18.0800, 'urban'),
    ('11421', 'Stockholm', 'Stockholm', 'Stockholm', 59.3410, 18.0810, 'urban'),
    
    -- Gothenburg
    ('41101', 'Göteborg', 'Göteborg', 'Västra Götaland', 57.7089, 11.9746, 'urban'),
    ('41102', 'Göteborg', 'Göteborg', 'Västra Götaland', 57.7100, 11.9750, 'urban'),
    ('41103', 'Göteborg', 'Göteborg', 'Västra Götaland', 57.7110, 11.9760, 'urban'),
    
    -- Malmö
    ('21101', 'Malmö', 'Malmö', 'Skåne', 55.6050, 13.0038, 'urban'),
    ('21102', 'Malmö', 'Malmö', 'Skåne', 55.6060, 13.0040, 'urban'),
    ('21103', 'Malmö', 'Malmö', 'Skåne', 55.6070, 13.0050, 'urban'),
    
    -- Uppsala
    ('75101', 'Uppsala', 'Uppsala', 'Uppsala', 59.8586, 17.6389, 'urban'),
    ('75102', 'Uppsala', 'Uppsala', 'Uppsala', 59.8590, 17.6400, 'urban'),
    
    -- Linköping
    ('58101', 'Linköping', 'Linköping', 'Östergötland', 58.4108, 15.6214, 'urban'),
    ('58102', 'Linköping', 'Linköping', 'Östergötland', 58.4120, 15.6220, 'urban'),
    
    -- Örebro
    ('70101', 'Örebro', 'Örebro', 'Örebro', 59.2753, 15.2134, 'urban'),
    ('70102', 'Örebro', 'Örebro', 'Örebro', 59.2760, 15.2140, 'urban'),
    
    -- Västerås
    ('72101', 'Västerås', 'Västerås', 'Västmanland', 59.6099, 16.5448, 'urban'),
    ('72102', 'Västerås', 'Västerås', 'Västmanland', 59.6110, 16.5450, 'urban'),
    
    -- Norrköping
    ('60101', 'Norrköping', 'Norrköping', 'Östergötland', 58.5877, 16.1924, 'urban'),
    ('60102', 'Norrköping', 'Norrköping', 'Östergötland', 58.5880, 16.1930, 'urban'),
    
    -- Helsingborg
    ('25101', 'Helsingborg', 'Helsingborg', 'Skåne', 56.0465, 12.6945, 'urban'),
    ('25102', 'Helsingborg', 'Helsingborg', 'Skåne', 56.0470, 12.6950, 'urban'),
    
    -- Jönköping
    ('55101', 'Jönköping', 'Jönköping', 'Jönköping', 57.7826, 14.1618, 'urban'),
    ('55102', 'Jönköping', 'Jönköping', 'Jönköping', 57.7830, 14.1620, 'urban'),
    
    -- Umeå
    ('90101', 'Umeå', 'Umeå', 'Västerbotten', 63.8258, 20.2630, 'urban'),
    ('90102', 'Umeå', 'Umeå', 'Västerbotten', 63.8260, 20.2640, 'urban'),
    
    -- Lund
    ('22101', 'Lund', 'Lund', 'Skåne', 55.7047, 13.1910, 'urban'),
    ('22102', 'Lund', 'Lund', 'Skåne', 55.7050, 13.1920, 'urban'),
    
    -- Borås
    ('50101', 'Borås', 'Borås', 'Västra Götaland', 57.7210, 12.9401, 'urban'),
    ('50102', 'Borås', 'Borås', 'Västra Götaland', 57.7220, 12.9410, 'urban'),
    
    -- Sundsvall
    ('85101', 'Sundsvall', 'Sundsvall', 'Västernorrland', 62.3908, 17.3069, 'urban'),
    ('85102', 'Sundsvall', 'Sundsvall', 'Västernorrland', 62.3910, 17.3070, 'urban'),
    
    -- Gävle
    ('80101', 'Gävle', 'Gävle', 'Gävleborg', 60.6749, 17.1413, 'urban'),
    ('80102', 'Gävle', 'Gävle', 'Gävleborg', 60.6750, 17.1420, 'urban')
    
ON CONFLICT (postal_code) DO UPDATE SET
    city = EXCLUDED.city,
    municipality = EXCLUDED.municipality,
    county = EXCLUDED.county,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    area_type = EXCLUDED.area_type,
    updated_at = NOW();

-- ============================================================================
-- STEP 5: Verify import
-- ============================================================================

DO $$
DECLARE
    total_count INTEGER;
    cities_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM postal_codes;
    SELECT COUNT(DISTINCT city) INTO cities_count FROM postal_codes;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POSTAL CODE IMPORT COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total postal codes: %', total_count;
    RAISE NOTICE 'Unique cities: %', cities_count;
    RAISE NOTICE '========================================';
END $$;

-- Show sample data by city
SELECT 
    city,
    COUNT(*) as postal_code_count,
    MIN(postal_code) as first_postal_code,
    MAX(postal_code) as last_postal_code
FROM postal_codes
GROUP BY city
ORDER BY postal_code_count DESC;

-- ============================================================================
-- STEP 6: Test radius search
-- ============================================================================

-- Find postal codes within 10km of Stockholm center (11122)
SELECT * FROM postal_codes_within_radius('11122', 10);

-- Calculate distance between Stockholm and Gothenburg
SELECT postal_code_distance('11122', '41101') as stockholm_to_gothenburg_km;

-- ============================================================================
-- NOTES FOR FULL DATASET IMPORT
-- ============================================================================
/*
To import the full Geonames dataset:

1. Download SE.txt from http://download.geonames.org/export/zip/SE.zip

2. Use this SQL to import:

COPY postal_codes_import FROM '/path/to/SE.txt' 
DELIMITER E'\t' 
NULL AS '';

3. Then insert into postal_codes:

INSERT INTO postal_codes (
    postal_code, 
    city, 
    municipality, 
    county, 
    latitude, 
    longitude,
    area_type
)
SELECT 
    postal_code,
    place_name as city,
    admin_name2 as municipality,
    admin_name1 as county,
    latitude,
    longitude,
    CASE 
        WHEN admin_name3 IS NOT NULL THEN 'urban'
        WHEN admin_name2 IS NOT NULL THEN 'suburban'
        ELSE 'rural'
    END as area_type
FROM postal_codes_import
WHERE country_code = 'SE'
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
ON CONFLICT (postal_code) DO UPDATE SET
    city = EXCLUDED.city,
    municipality = EXCLUDED.municipality,
    county = EXCLUDED.county,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    updated_at = NOW();

4. Clean up:
DROP TABLE postal_codes_import;

This will import ~16,000 Swedish postal codes.
*/

-- ============================================================================
-- SUCCESS
-- ============================================================================

RAISE NOTICE '✅ Sample postal codes imported successfully!';
RAISE NOTICE 'Ready to test radius-based courier matching.';
