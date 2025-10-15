/**
 * BULK IMPORT SWEDISH POSTAL CODES FROM OPENDATASOFT API
 * 
 * This script fetches all Swedish postal codes from OpenDataSoft API
 * and imports them into the database.
 * 
 * Usage:
 *   node scripts/bulk-import-postal-codes.js
 * 
 * Environment variables needed:
 *   DATABASE_URL - PostgreSQL connection string
 */

const { Pool } = require('pg');

const API_BASE = 'https://public.opendatasoft.com/api/records/1.0/search/';
const DATASET = 'geonames-postal-code';
const COUNTRY = 'SE';
const BATCH_SIZE = 100; // API allows up to 100 rows per request

async function fetchPostalCodes(offset = 0) {
  const url = `${API_BASE}?dataset=${DATASET}&q=&facet=country_code&refine.country_code=${COUNTRY}&rows=${BATCH_SIZE}&start=${offset}`;
  
  console.log(`Fetching postal codes: offset ${offset}...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
}

async function importPostalCodes() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🚀 Starting bulk import of Swedish postal codes...\n');

    let offset = 0;
    let totalImported = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch from API
      const data = await fetchPostalCodes(offset);
      
      if (!data.records || data.records.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📦 Processing ${data.records.length} postal codes...`);

      // Prepare batch insert
      const values = [];
      const placeholders = [];
      let paramCount = 0;

      for (const record of data.records) {
        const fields = record.fields;
        
        // Skip if missing required fields
        if (!fields.postal_code || !fields.latitude || !fields.longitude) {
          continue;
        }

        // Determine area type based on population or admin level
        let areaType = 'rural';
        if (fields.admin_name3) {
          areaType = 'urban'; // Has detailed admin level = city
        } else if (fields.admin_name2) {
          areaType = 'suburban'; // Has municipality = suburb
        }

        values.push(
          fields.postal_code,
          fields.place_name || fields.admin_name2 || 'Unknown',
          fields.admin_name2 || null, // municipality
          fields.admin_name1 || null, // county
          COUNTRY,
          fields.latitude,
          fields.longitude,
          areaType
        );

        placeholders.push(
          `($${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount}, $${++paramCount})`
        );
      }

      if (values.length === 0) {
        console.log('⚠️  No valid postal codes in this batch, skipping...');
        offset += BATCH_SIZE;
        continue;
      }

      // Insert batch into database
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
          area_type = EXCLUDED.area_type,
          updated_at = NOW()
      `;

      await pool.query(query, values);

      totalImported += data.records.length;
      console.log(`✅ Imported batch. Total so far: ${totalImported}\n`);

      // Check if there are more records
      if (data.nhits && offset + BATCH_SIZE >= data.nhits) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }

      // Rate limiting (be nice to the API)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Get final statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_postal_codes,
        COUNT(DISTINCT city) as unique_cities,
        COUNT(DISTINCT municipality) as unique_municipalities,
        COUNT(DISTINCT county) as unique_counties,
        COUNT(CASE WHEN area_type = 'urban' THEN 1 END) as urban_count,
        COUNT(CASE WHEN area_type = 'suburban' THEN 1 END) as suburban_count,
        COUNT(CASE WHEN area_type = 'rural' THEN 1 END) as rural_count
      FROM postal_codes
      WHERE country = 'SE'
    `);

    console.log('\n========================================');
    console.log('✅ IMPORT COMPLETE!');
    console.log('========================================');
    console.log(`Total postal codes: ${stats.rows[0].total_postal_codes}`);
    console.log(`Unique cities: ${stats.rows[0].unique_cities}`);
    console.log(`Unique municipalities: ${stats.rows[0].unique_municipalities}`);
    console.log(`Unique counties: ${stats.rows[0].unique_counties}`);
    console.log('\nArea distribution:');
    console.log(`  Urban: ${stats.rows[0].urban_count}`);
    console.log(`  Suburban: ${stats.rows[0].suburban_count}`);
    console.log(`  Rural: ${stats.rows[0].rural_count}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importPostalCodes();
