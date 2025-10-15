import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { 
  findPostalCodesWithinRadius, 
  getSuggestedRadius,
  validateSwedishPostalCode 
} from '../lib/postal-code-service';

const pool = getPool();

/**
 * GET /api/postal-codes/radius?postal_code=11122&radius=10
 * 
 * Find all postal codes within a radius (in km)
 * Used for courier coverage area matching
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postal_code, radius, auto_radius } = req.query;

    // Validate input
    if (!postal_code || typeof postal_code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Postal code is required'
      });
    }

    // Validate format
    if (!validateSwedishPostalCode(postal_code)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Swedish postal code format'
      });
    }

    // Clean postal code
    const cleanedPostalCode = postal_code.replace(/\s/g, '');

    // Determine radius
    let radiusKm: number;
    
    if (auto_radius === 'true') {
      // Use suggested radius based on area type
      radiusKm = await getSuggestedRadius(pool, cleanedPostalCode);
    } else if (radius) {
      radiusKm = parseFloat(radius as string);
      
      // Validate radius
      if (isNaN(radiusKm) || radiusKm <= 0 || radiusKm > 200) {
        return res.status(400).json({
          success: false,
          error: 'Radius must be between 0 and 200 km'
        });
      }
    } else {
      // Default radius
      radiusKm = 10;
    }

    // Find postal codes within radius
    const results = await findPostalCodesWithinRadius(pool, cleanedPostalCode, radiusKm);

    return res.status(200).json({
      success: true,
      data: {
        center_postal_code: cleanedPostalCode,
        radius_km: radiusKm,
        count: results.length,
        postal_codes: results
      }
    });

  } catch (error: any) {
    console.error('Postal code radius API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
