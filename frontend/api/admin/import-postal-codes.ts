import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';

const pool = getPool();

const MAJOR_CITIES = [
  'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
  'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
  'Lund', 'Umeå', 'Gävle', 'Borås', 'Södertälje',
  'Eskilstuna', 'Karlstad', 'Täby', 'Växjö', 'Halmstad'
];

/**
 * POST /api/admin/import-postal-codes?city=Stockholm
 * 
 * Admin endpoint to import postal codes from OpenDataSoft API
 * Can import all major cities or specific city
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Add admin authentication check
  // const user = verifyToken(req.headers.authorization);
  // if (!user || user.role !== 'admin') {
  //   return res.status(403).json({ error: 'Admin only' });
  // }

  try {
    const { city, all } = req.query;
    
    const citiesToImport = all === 'true' 
      ? MAJOR_CITIES 
      : city 
        ? [city as string]
        : ['Stockholm']; // Default to Stockholm

    const results = {
      cities: [] as any[],
      totalImported: 0,
      errors: [] as any[]
    };

    for (const cityName of citiesToImport) {
      try {
        console.log(`[Import] Fetching postal codes for ${cityName}...`);
        
        // Fetch from OpenDataSoft API
        const response = await fetch(
          `https://public.opendatasoft.com/api/records/1.0/search/?` +
          `dataset=geonames-postal-code&` +
          `q=&` +
          `facet=country_code&` +
          `refine.country_code=SE&` +
          `refine.place_name=${encodeURIComponent(cityName)}&` +
          `rows=100`
        );

        if (!response.ok) {
          results.errors.push({
            city: cityName,
            error: `API error: ${response.status}`
          });
          continue;
        }

        const data = await response.json();
        const records = data.records || [];

        if (records.length === 0) {
          results.errors.push({
            city: cityName,
            error: 'No postal codes found'
          });
          continue;
        }

        // Insert into database
        const client = await pool.connect();
        
        try {
          let imported = 0;

          for (const record of records) {
            const fields = record.fields;
            
            if (!fields.postal_code || !fields.latitude || !fields.longitude) {
              continue;
            }

            await client.query(
              `INSERT INTO postal_codes (
                postal_code, city, municipality, county, country, 
                latitude, longitude, area_type
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (postal_code) DO UPDATE SET
                city = EXCLUDED.city,
                municipality = EXCLUDED.municipality,
                county = EXCLUDED.county,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                updated_at = NOW()`,
              [
                fields.postal_code,
                fields.place_name || cityName,
                fields.admin_name2 || null,
                fields.admin_name1 || null,
                'SE',
                fields.latitude,
                fields.longitude,
                'urban'
              ]
            );

            imported++;
          }

          results.cities.push({
            city: cityName,
            imported: imported
          });
          
          results.totalImported += imported;

        } finally {
          client.release();
        }

        // Rate limiting (be nice to the API)
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        results.errors.push({
          city: cityName,
          error: error.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Imported postal codes for ${results.cities.length} cities`,
      data: results
    });

  } catch (error: any) {
    console.error('Import postal codes error:', error);
    return res.status(500).json({
      success: false,
      error: 'Import failed',
      message: error.message
    });
  }
}
