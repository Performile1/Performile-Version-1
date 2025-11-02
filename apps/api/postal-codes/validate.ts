import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Postal code format patterns by country
const POSTAL_CODE_PATTERNS = {
  SE: /^\d{5}$/,           // Sweden: 5 digits
  NO: /^\d{4}$/,           // Norway: 4 digits
  DK: /^\d{4}$/,           // Denmark: 4 digits
  FI: /^\d{5}$/            // Finland: 5 digits
};

// OpenDataSoft API endpoints by country
const API_ENDPOINTS = {
  SE: 'https://public.opendatasoft.com/api/records/1.0/search/?dataset=georef-sweden-postalcode',
  NO: 'https://public.opendatasoft.com/api/records/1.0/search/?dataset=georef-norway-postalcode',
  DK: 'https://public.opendatasoft.com/api/records/1.0/search/?dataset=georef-denmark-postalcode',
  FI: 'https://public.opendatasoft.com/api/records/1.0/search/?dataset=georef-finland-postalcode'
};

/**
 * Sanitize postal code input
 */
function sanitizePostalCode(postalCode: string): string {
  return postalCode.replace(/[^0-9]/g, '');
}

/**
 * Sanitize country code
 */
function sanitizeCountry(country: string): string {
  const validCountries = ['SE', 'NO', 'DK', 'FI'];
  const upperCountry = country.toUpperCase();
  return validCountries.includes(upperCountry) ? upperCountry : 'SE';
}

/**
 * Validate postal code format
 */
function validateFormat(postalCode: string, country: string): boolean {
  const pattern = POSTAL_CODE_PATTERNS[country as keyof typeof POSTAL_CODE_PATTERNS];
  return pattern ? pattern.test(postalCode) : false;
}

/**
 * Lookup postal code in database cache
 */
async function lookupInDatabase(postalCode: string, country: string) {
  try {
    const { data, error } = await supabase
      .from('postal_codes')
      .select('*')
      .eq('postal_code', postalCode)
      .eq('country', country)
      .single();

    if (error) {
      console.log('Database lookup error:', error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Database lookup failed:', error);
    return null;
  }
}

/**
 * Fetch postal code from OpenDataSoft API
 */
async function fetchFromAPI(postalCode: string, country: string) {
  try {
    const endpoint = API_ENDPOINTS[country as keyof typeof API_ENDPOINTS];
    if (!endpoint) {
      return null;
    }

    const url = `${endpoint}&q=${postalCode}&rows=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('API request failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.records || data.records.length === 0) {
      return null;
    }

    const record = data.records[0].fields;

    // Extract data based on country-specific field names
    let city, region, latitude, longitude;

    if (country === 'SE') {
      city = record.city_name || record.postort;
      region = record.region_name || record.lan;
      latitude = record.geo_point_2d?.[0];
      longitude = record.geo_point_2d?.[1];
    } else if (country === 'NO') {
      city = record.city_name || record.poststed;
      region = record.region_name || record.fylke;
      latitude = record.geo_point_2d?.[0];
      longitude = record.geo_point_2d?.[1];
    } else if (country === 'DK') {
      city = record.city_name || record.by;
      region = record.region_name || record.region;
      latitude = record.geo_point_2d?.[0];
      longitude = record.geo_point_2d?.[1];
    } else if (country === 'FI') {
      city = record.city_name || record.kaupunki;
      region = record.region_name || record.maakunta;
      latitude = record.geo_point_2d?.[0];
      longitude = record.geo_point_2d?.[1];
    }

    if (!city) {
      return null;
    }

    // Cache in database for future lookups
    try {
      await supabase.from('postal_codes').insert({
        postal_code: postalCode,
        city: city,
        region: region || null,
        country: country,
        latitude: latitude || null,
        longitude: longitude || null
      });
    } catch (cacheError) {
      console.error('Failed to cache postal code:', cacheError);
      // Continue even if caching fails
    }

    return {
      postal_code: postalCode,
      city: city,
      region: region,
      country: country,
      latitude: latitude,
      longitude: longitude
    };
  } catch (error) {
    console.error('API fetch failed:', error);
    return null;
  }
}

/**
 * Check delivery availability for postal code
 */
async function checkDeliveryAvailability(postalCode: string, country: string) {
  try {
    // Check if any couriers cover this postal code
    // For now, we'll check if the postal code exists in our system
    // In the future, this should check courier_coverage table
    
    const { data: couriers, error } = await supabase
      .from('couriers')
      .select('courier_id, courier_name, service_types, coverage_countries')
      .contains('coverage_countries', [country])
      .eq('is_active', true);

    if (error) {
      console.error('Delivery availability check failed:', error);
      return {
        deliveryAvailable: false,
        courierCount: 0,
        couriers: []
      };
    }

    // Filter couriers that actually cover this postal code
    // For MVP, we assume all active couriers in the country can deliver
    const availableCouriers = couriers || [];

    return {
      deliveryAvailable: availableCouriers.length > 0,
      courierCount: availableCouriers.length,
      couriers: availableCouriers.slice(0, 5) // Return max 5 couriers
    };
  } catch (error) {
    console.error('Delivery availability check error:', error);
    return {
      deliveryAvailable: false,
      courierCount: 0,
      couriers: []
    };
  }
}

/**
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for Shopify
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postalCode: rawPostalCode, country: rawCountry } = req.body;

    // Validate input
    if (!rawPostalCode) {
      return res.status(400).json({
        valid: false,
        error: 'Postal code is required'
      });
    }

    // Sanitize input
    const postalCode = sanitizePostalCode(rawPostalCode);
    const country = sanitizeCountry(rawCountry || 'SE');

    // Validate format
    if (!validateFormat(postalCode, country)) {
      return res.status(200).json({
        valid: false,
        postalCode: postalCode,
        country: country,
        error: `Invalid postal code format for ${country}`,
        deliveryAvailable: false
      });
    }

    // Step 1: Check database cache
    let postalData = await lookupInDatabase(postalCode, country);
    let source = 'cache';

    // Step 2: If not in cache, fetch from API
    if (!postalData) {
      postalData = await fetchFromAPI(postalCode, country);
      source = 'api';
    }

    // Step 3: If still not found, return invalid
    if (!postalData) {
      return res.status(200).json({
        valid: false,
        postalCode: postalCode,
        country: country,
        error: 'Postal code not found',
        deliveryAvailable: false
      });
    }

    // Step 4: Check delivery availability
    const deliveryInfo = await checkDeliveryAvailability(postalCode, country);

    // Return success response
    return res.status(200).json({
      valid: true,
      postalCode: postalCode,
      city: postalData.city,
      region: postalData.region,
      country: country,
      latitude: postalData.latitude,
      longitude: postalData.longitude,
      deliveryAvailable: deliveryInfo.deliveryAvailable,
      courierCount: deliveryInfo.courierCount,
      couriers: deliveryInfo.couriers,
      source: source
    });

  } catch (error) {
    console.error('Postal code validation error:', error);
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    });
  }
}
