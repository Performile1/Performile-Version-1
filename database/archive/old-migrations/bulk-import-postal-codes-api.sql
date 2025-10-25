-- ============================================================================
-- BULK IMPORT SWEDISH POSTAL CODES FROM OPENDATASOFT API
-- ============================================================================
-- API: https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-postal-code
-- This script provides SQL to import data fetched from the API
-- ============================================================================

-- ============================================================================
-- OPTION 1: Use the API endpoint we built
-- ============================================================================
/*
Instead of manually importing, you can use our API endpoint:

GET /api/postal-codes/search?postal_code=11122&country=SE

This will:
1. Check database cache
2. Fetch from OpenDataSoft if not cached
3. Automatically cache the result

The system will build the database organically as postal codes are used!
*/

-- ============================================================================
-- OPTION 2: Bulk fetch via API and import
-- ============================================================================
/*
You can fetch all Swedish postal codes from OpenDataSoft:

API URL:
https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-postal-code&q=&facet=country_code&refine.country_code=SE&rows=10000

This returns JSON with all Swedish postal codes.

Example response structure:
{
  "records": [
    {
      "fields": {
        "postal_code": "11122",
        "place_name": "Stockholm",
        "admin_name1": "Stockholm",
        "admin_name2": "Stockholm",
        "latitude": 59.3293,
        "longitude": 18.0686,
        "country_code": "SE"
      }
    }
  ]
}

To import:
1. Fetch the JSON from the API
2. Parse and insert into database
3. Or use a script to automate this
*/

-- ============================================================================
-- OPTION 3: Manual INSERT for specific postal codes
-- ============================================================================

-- Example: Import specific postal codes you know you'll need
-- These will be fetched automatically via API on first use, but you can pre-populate

INSERT INTO postal_codes (postal_code, city, municipality, county, country, latitude, longitude, area_type)
VALUES 
    -- Add your most common postal codes here
    ('11122', 'Stockholm', 'Stockholm', 'Stockholm', 'SE', 59.3293, 18.0686, 'urban'),
    ('41101', 'Göteborg', 'Göteborg', 'Västra Götaland', 'SE', 57.7089, 11.9746, 'urban'),
    ('21101', 'Malmö', 'Malmö', 'Skåne', 'SE', 55.6050, 13.0038, 'urban')
ON CONFLICT (postal_code) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check what's in the database
SELECT 
    country,
    COUNT(*) as total_postal_codes,
    COUNT(DISTINCT city) as unique_cities,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
FROM postal_codes
GROUP BY country;

-- ============================================================================
-- RECOMMENDED APPROACH
-- ============================================================================
/*
BEST PRACTICE: Lazy Loading with Cache

1. Start with empty postal_codes table (or just sample data)
2. As users enter postal codes in checkout/forms, the API will:
   - Check database first
   - Fetch from OpenDataSoft if not found
   - Cache the result automatically
3. Over time, your database will contain all postal codes your users actually use
4. No need to import 16,000+ postal codes upfront!

Benefits:
- Faster initial setup
- Only store data you actually use
- Always up-to-date (fetches latest from API)
- No storage waste
- Self-healing (if data is wrong, just delete and it'll re-fetch)

This is the approach we've implemented in:
- frontend/api/lib/postal-code-service.ts
- frontend/api/postal-codes/search.ts
*/

-- ============================================================================
-- MONITORING QUERY
-- ============================================================================

-- See which postal codes are being used most
SELECT 
    postal_code,
    city,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at > created_at THEN 'Updated from API'
        ELSE 'Initial data'
    END as source
FROM postal_codes
ORDER BY updated_at DESC
LIMIT 20;

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POSTAL CODE SYSTEM READY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Strategy: Lazy loading with API cache';
    RAISE NOTICE 'API: OpenDataSoft (public.opendatasoft.com)';
    RAISE NOTICE 'Endpoints:';
    RAISE NOTICE '  - GET /api/postal-codes/search';
    RAISE NOTICE '  - GET /api/postal-codes/radius';
    RAISE NOTICE '';
    RAISE NOTICE 'The system will automatically:';
    RAISE NOTICE '  1. Check database cache';
    RAISE NOTICE '  2. Fetch from API if not found';
    RAISE NOTICE '  3. Cache for future use';
    RAISE NOTICE '========================================';
END $$;
