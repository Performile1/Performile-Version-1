/**
 * IMPORT MAJOR SWEDISH CITIES POSTAL CODES
 * 
 * This script imports postal codes for Sweden's top 20 cities
 * Covers ~80% of population with minimal data
 * 
 * Usage:
 *   node scripts/import-major-cities.js
 */

const { Pool } = require('pg');

const MAJOR_CITIES = [
  'Stockholm',
  'Göteborg',
  'Malmö',
  'Uppsala',
  'Västerås',
  'Örebro',
  'Linköping',
  'Helsingborg',
  'Jönköping',
  'Norrköping',
  'Lund',
  'Umeå',
  'Gävle',
  'Borås',
  'Södertälje',
  'Eskilstuna',
  'Karlstad',
  'Täby',
  'Växjö',
  'Halmstad'
];

async function fetchCityPostalCodes(city) {
  const url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-postal-code&q=&facet=country_code&refine.country_code=SE&refine.place_name=${encodeURIComponent(city)}&rows=100`;
  
  console.log(`Fetching postal codes for ${city}...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    console.error(`  ❌ API error for ${city}: ${response.status}`);
    return [];
  }
  
  const data = await response.json();
  return data.records || [];
}

async function importMajorCities() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Importing postal codes for major Swedish cities...\n');

    let totalImported = 0;

    for (const city of MAJOR_CITIES) {
      const records = await fetchCityPostalCodes(city);
      
      if (records.length === 0) {
        console.log(`  ⚠️  No postal codes found for ${city}`);
        continue;
      }

      // Prepare batch insert
      const values = [];
      const placeholders = [];
      let paramCount = 0;

      for (const record of records) {
        const fields = record.fields;
        
        if (!fields.postal_code || !fields.latitude || !fields.longitude) {
          continue;
        }

        values.push(
          fields.postal_code,
          fields.place_name || city,
          fields.admin_name2 || null,
          fields.admin_name1 || null,
          'SE',
          fields.latitude,
          fields.longitude,
          'urban' // Major cities are urban
        );

        placeholders.push(
          `($${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount})`
        );
      }

      if (values.length === 0) {
        continue;
      }

      // Insert into database
      const query = `
        INSERT INTO postal_codes (
          postal_code, city, municipality, county, country, 
          latitude, longitude, area_type
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (postal_code) DO UPDATE SET
          city = EXCLUDED.city,
          municipality = EXCLUDED.municipality,
          county = EXCLUDED.county,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          updated_at = NOW()
      `;

      await pool.query(query, values);

      totalImported += records.length;
      console.log(`  ✅ ${city}: ${records.length} postal codes`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n========================================');
    console.log('✅ IMPORT COMPLETE!');
    console.log('========================================');
    console.log(`Total postal codes imported: ${totalImported}`);
    console.log(`Cities covered: ${MAJOR_CITIES.length}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importMajorCities();
