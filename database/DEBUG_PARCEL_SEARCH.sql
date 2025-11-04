-- ============================================================================
-- DEBUG PARCEL LOCATION SEARCH
-- ============================================================================
-- Run these queries to debug why search returns no results

-- Step 1: Check if data exists
SELECT 
    location_id,
    name,
    latitude,
    longitude,
    is_active,
    cache_expires_at,
    cache_expires_at > NOW() as is_not_expired
FROM parcel_location_cache;

-- Step 2: Check if PostGIS extensions are working
SELECT 
    extname,
    extversion
FROM pg_extension
WHERE extname IN ('cube', 'earthdistance');

-- Step 3: Test earth_distance function directly
SELECT 
    name,
    latitude,
    longitude,
    earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(59.9139, 10.7522)
    ) as distance_meters
FROM parcel_location_cache;

-- Step 4: Test earth_box function
SELECT 
    name,
    earth_box(ll_to_earth(59.9139, 10.7522), 5000) @> ll_to_earth(latitude, longitude) as within_box
FROM parcel_location_cache;

-- Step 5: Test the WHERE conditions separately
SELECT 
    name,
    is_active,
    cache_expires_at,
    cache_expires_at > NOW() as not_expired,
    earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(59.9139, 10.7522)
    ) as distance
FROM parcel_location_cache
WHERE is_active = true;

-- Step 6: Test without cache expiration check
SELECT 
    name,
    location_type,
    carrier,
    ROUND(earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(59.9139, 10.7522)
    ))::INTEGER as distance_meters
FROM parcel_location_cache
WHERE is_active = true
ORDER BY distance_meters;

-- Step 7: Check cache_expires_at values
SELECT 
    name,
    cache_expires_at,
    NOW() as current_time,
    cache_expires_at > NOW() as is_valid,
    cache_expires_at - NOW() as time_until_expiry
FROM parcel_location_cache;
