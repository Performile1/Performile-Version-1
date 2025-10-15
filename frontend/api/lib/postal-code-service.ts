/**
 * POSTAL CODE SERVICE
 * Handles postal code lookups, geocoding, and radius searches
 * Uses database cache + Nominatim API fallback
 */

import { Pool } from 'pg';

interface PostalCodeCoordinates {
  postal_code: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface PostalCodeWithDistance extends PostalCodeCoordinates {
  distance_km: number;
}

/**
 * Get coordinates for a postal code
 * Checks database first, falls back to Nominatim API if not found
 */
export async function getPostalCodeCoordinates(
  pool: Pool,
  postalCode: string,
  country: string = 'SE'
): Promise<PostalCodeCoordinates | null> {
  const client = await pool.connect();
  
  try {
    // 1. Check database cache first
    const cached = await client.query(
      `SELECT postal_code, city, latitude, longitude 
       FROM postal_codes 
       WHERE postal_code = $1 AND country = $2 AND is_active = TRUE`,
      [postalCode, country]
    );
    
    if (cached.rows[0]) {
      return cached.rows[0];
    }
    
    // 2. Not in cache - fetch from OpenDataSoft API
    console.log(`[PostalCodeService] Fetching ${postalCode} from OpenDataSoft API`);
    
    const response = await fetch(
      `https://public.opendatasoft.com/api/records/1.0/search/?` +
      `dataset=geonames-postal-code&` +
      `q=&` +
      `refine.country_code=${country}&` +
      `refine.postal_code=${encodeURIComponent(postalCode)}&` +
      `rows=1`
    );
    
    if (!response.ok) {
      console.error(`[PostalCodeService] OpenDataSoft API error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.records || data.records.length === 0) {
      console.log(`[PostalCodeService] Postal code ${postalCode} not found`);
      return null;
    }
    
    const record = data.records[0].fields;
    const coords: PostalCodeCoordinates = {
      postal_code: postalCode,
      city: record.place_name || record.admin_name2 || 'Unknown',
      latitude: record.latitude,
      longitude: record.longitude
    };
    
    // 3. Cache for future use
    await client.query(
      `INSERT INTO postal_codes (postal_code, city, country, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (postal_code) DO UPDATE SET
         city = EXCLUDED.city,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         updated_at = NOW()`,
      [coords.postal_code, coords.city, country, coords.latitude, coords.longitude]
    );
    
    console.log(`[PostalCodeService] Cached ${postalCode}: ${coords.city}`);
    
    return coords;
    
  } catch (error) {
    console.error('[PostalCodeService] Error fetching postal code:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Find postal codes within a radius (in km)
 */
export async function findPostalCodesWithinRadius(
  pool: Pool,
  centerPostalCode: string,
  radiusKm: number = 10
): Promise<PostalCodeWithDistance[]> {
  const client = await pool.connect();
  
  try {
    // Use the database function for efficient radius search
    const result = await client.query(
      `SELECT postal_code, city, distance_km
       FROM postal_codes_within_radius($1, $2)`,
      [centerPostalCode, radiusKm]
    );
    
    return result.rows;
    
  } catch (error) {
    console.error('[PostalCodeService] Error finding postal codes within radius:', error);
    return [];
  } finally {
    client.release();
  }
}

/**
 * Calculate distance between two postal codes (in km)
 */
export async function calculateDistance(
  pool: Pool,
  postalCode1: string,
  postalCode2: string
): Promise<number | null> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT postal_code_distance($1, $2) as distance_km`,
      [postalCode1, postalCode2]
    );
    
    return result.rows[0]?.distance_km || null;
    
  } catch (error) {
    console.error('[PostalCodeService] Error calculating distance:', error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Validate postal code format (Swedish)
 */
export function validateSwedishPostalCode(postalCode: string): boolean {
  // Swedish postal codes: 5 digits, optionally with space after 3rd digit
  const cleaned = postalCode.replace(/\s/g, '');
  return /^\d{5}$/.test(cleaned);
}

/**
 * Format postal code (Swedish standard: XXX XX)
 */
export function formatSwedishPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\s/g, '');
  if (cleaned.length === 5) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  return postalCode;
}

/**
 * Batch fetch coordinates for multiple postal codes
 */
export async function batchGetPostalCodeCoordinates(
  pool: Pool,
  postalCodes: string[],
  country: string = 'SE'
): Promise<Map<string, PostalCodeCoordinates>> {
  const client = await pool.connect();
  const results = new Map<string, PostalCodeCoordinates>();
  
  try {
    // Fetch all from database first
    const cached = await client.query(
      `SELECT postal_code, city, latitude, longitude 
       FROM postal_codes 
       WHERE postal_code = ANY($1) AND country = $2 AND is_active = TRUE`,
      [postalCodes, country]
    );
    
    cached.rows.forEach(row => {
      results.set(row.postal_code, row);
    });
    
    // Find missing postal codes
    const missing = postalCodes.filter(pc => !results.has(pc));
    
    // Fetch missing ones from API (with rate limiting)
    for (const postalCode of missing) {
      const coords = await getPostalCodeCoordinates(pool, postalCode, country);
      if (coords) {
        results.set(postalCode, coords);
      }
      
      // Rate limit: 1 request per second for Nominatim
      if (missing.indexOf(postalCode) < missing.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('[PostalCodeService] Error in batch fetch:', error);
    return results;
  } finally {
    client.release();
  }
}

/**
 * Get suggested radius based on area type
 */
export async function getSuggestedRadius(
  pool: Pool,
  postalCode: string
): Promise<number> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT area_type FROM postal_codes WHERE postal_code = $1`,
      [postalCode]
    );
    
    const areaType = result.rows[0]?.area_type;
    
    // Default radii based on area type
    switch (areaType) {
      case 'urban':
        return 10; // 10km for cities
      case 'suburban':
        return 20; // 20km for suburbs
      case 'rural':
        return 50; // 50km for rural areas
      default:
        return 15; // Default fallback
    }
    
  } catch (error) {
    console.error('[PostalCodeService] Error getting suggested radius:', error);
    return 15; // Default fallback
  } finally {
    client.release();
  }
}
