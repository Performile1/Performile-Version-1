import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { getPostalCodeCoordinates, validateSwedishPostalCode } from '../lib/postal-code-service';

const pool = getPool();

/**
 * GET /api/postal-codes/search?postal_code=11122&country=SE
 * 
 * Search for postal code and get coordinates
 * Returns cached data or fetches from Nominatim API
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
    const { postal_code, country = 'SE' } = req.query;

    // Validate input
    if (!postal_code || typeof postal_code !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Postal code is required'
      });
    }

    // Validate format (Swedish postal codes)
    if (country === 'SE' && !validateSwedishPostalCode(postal_code)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Swedish postal code format. Expected: 5 digits (e.g., 11122 or 111 22)'
      });
    }

    // Clean postal code (remove spaces)
    const cleanedPostalCode = postal_code.replace(/\s/g, '');

    // Get coordinates
    const result = await getPostalCodeCoordinates(pool, cleanedPostalCode, country as string);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Postal code not found',
        postal_code: cleanedPostalCode
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Postal code search API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
