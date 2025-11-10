-- ============================================================================
-- Parcel point capability helpers (QR vs printed label support)
-- Date: 2025-11-10
-- Note: Creates capability-aware helper functions without altering existing
--       signatures, so downstream integrations remain unaffected.
-- ============================================================================

-- Helper: search by coordinates with explicit capability flags
CREATE OR REPLACE FUNCTION search_parcel_locations_capabilities(
    p_latitude NUMERIC,
    p_longitude NUMERIC,
    p_radius_meters INTEGER DEFAULT 5000,
    p_limit INTEGER DEFAULT 20,
    p_location_type VARCHAR DEFAULT NULL,
    p_courier_id UUID DEFAULT NULL
)
RETURNS TABLE (
    location_id VARCHAR,
    courier_id UUID,
    name VARCHAR,
    location_type VARCHAR,
    carrier VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    full_address TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    distance_meters INTEGER,
    opening_hours JSONB,
    services TEXT[],
    has_parking BOOLEAN,
    wheelchair_accessible BOOLEAN,
    available_24_7 BOOLEAN,
    capacity_status VARCHAR,
    supports_qr BOOLEAN,
    supports_printed_label BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        plc.location_id,
        plc.courier_id,
        plc.name,
        plc.location_type,
        plc.carrier,
        plc.latitude,
        plc.longitude,
        plc.full_address,
        plc.postal_code,
        plc.city,
        ROUND(earth_distance(
            ll_to_earth(plc.latitude, plc.longitude),
            ll_to_earth(p_latitude, p_longitude)
        ))::INTEGER AS distance_meters,
        plc.opening_hours,
        plc.services,
        plc.has_parking,
        plc.wheelchair_accessible,
        plc.available_24_7,
        plc.capacity_status,
        (
            plc.location_type = 'parcel_locker'
            OR 'qr_dropoff' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'qr_pickup' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'qr_code' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'digital_token' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
        ) AS supports_qr,
        (
            plc.location_type IN ('parcel_shop', 'service_point', 'pickup_point')
            OR 'label_printing' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'printing_service' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'staff_assistance' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'counter_service' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
        ) AS supports_printed_label
    FROM parcel_location_cache plc
    WHERE plc.is_active = true
      AND plc.cache_expires_at > NOW()
      AND earth_box(ll_to_earth(p_latitude, p_longitude), p_radius_meters) @> 
          ll_to_earth(plc.latitude, plc.longitude)
      AND (p_location_type IS NULL OR plc.location_type = p_location_type)
      AND (p_courier_id IS NULL OR plc.courier_id = p_courier_id)
    ORDER BY earth_distance(
        ll_to_earth(plc.latitude, plc.longitude),
        ll_to_earth(p_latitude, p_longitude)
    )
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper: search by postal code with explicit capability flags
CREATE OR REPLACE FUNCTION search_parcel_locations_by_postal_capabilities(
    p_postal_code VARCHAR,
    p_limit INTEGER DEFAULT 20,
    p_location_type VARCHAR DEFAULT NULL,
    p_courier_id UUID DEFAULT NULL
)
RETURNS TABLE (
    location_id VARCHAR,
    courier_id UUID,
    name VARCHAR,
    location_type VARCHAR,
    carrier VARCHAR,
    latitude NUMERIC,
    longitude NUMERIC,
    full_address TEXT,
    postal_code VARCHAR,
    city VARCHAR,
    opening_hours JSONB,
    services TEXT[],
    has_parking BOOLEAN,
    wheelchair_accessible BOOLEAN,
    available_24_7 BOOLEAN,
    capacity_status VARCHAR,
    supports_qr BOOLEAN,
    supports_printed_label BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        plc.location_id,
        plc.courier_id,
        plc.name,
        plc.location_type,
        plc.carrier,
        plc.latitude,
        plc.longitude,
        plc.full_address,
        plc.postal_code,
        plc.city,
        plc.opening_hours,
        plc.services,
        plc.has_parking,
        plc.wheelchair_accessible,
        plc.available_24_7,
        plc.capacity_status,
        (
            plc.location_type = 'parcel_locker'
            OR 'qr_dropoff' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'qr_pickup' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'qr_code' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'digital_token' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
        ) AS supports_qr,
        (
            plc.location_type IN ('parcel_shop', 'service_point', 'pickup_point')
            OR 'label_printing' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'printing_service' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'staff_assistance' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
            OR 'counter_service' = ANY(COALESCE(plc.services, ARRAY[]::TEXT[]))
        ) AS supports_printed_label
    FROM parcel_location_cache plc
    WHERE plc.is_active = true
      AND plc.cache_expires_at > NOW()
      AND plc.postal_code = p_postal_code
      AND (p_location_type IS NULL OR plc.location_type = p_location_type)
      AND (p_courier_id IS NULL OR plc.courier_id = p_courier_id)
    ORDER BY plc.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
