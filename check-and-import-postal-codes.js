/**
 * CHECK AND IMPORT POSTAL CODES
 * Checks if postal codes exist in database and imports major cities if needed
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ukeikwsmpofydmelrslq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZWlrd3NtcG9meWRtZWxyc2xxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyNTMzMCwiZXhwIjoyMDc0ODAxMzMwfQ.lGG_-8VQWgNyPjCTAB3Mhgs-BGbQcsTprUed5WLiGjY'
);

async function checkPostalCodes() {
  console.log('\n🔍 CHECKING POSTAL CODES IN DATABASE\n');
  
  try {
    const { data, error, count } = await supabase
      .from('postal_codes')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Error checking postal codes:', error.message);
      return 0;
    }
    
    console.log(`✅ Found ${count || 0} postal codes in database\n`);
    return count || 0;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return 0;
  }
}

async function importMajorCities() {
  console.log('📥 IMPORTING MAJOR CITIES\n');
  
  const majorCities = [
    'Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Västerås',
    'Örebro', 'Linköping', 'Helsingborg', 'Jönköping', 'Norrköping',
    'Lund', 'Umeå', 'Gävle', 'Borås', 'Södertälje',
    'Eskilstuna', 'Karlstad', 'Täby', 'Växjö', 'Halmstad'
  ];
  
  let totalImported = 0;
  
  for (const city of majorCities) {
    try {
      console.log(`  Fetching ${city}...`);
      
      // Fetch from OpenDataSoft API
      const response = await fetch(
        `https://public.opendatasoft.com/api/records/1.0/search/?` +
        `dataset=georef-sweden-postalcode&` +
        `q=&` +
        `facet=country_code&` +
        `refine.country_code=SE&` +
        `refine.place_name=${encodeURIComponent(city)}&` +
        `rows=100`
      );
      
      if (!response.ok) {
        console.log(`  ⚠️  API error for ${city}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      const records = data.records || [];
      
      if (records.length === 0) {
        console.log(`  ⚠️  No postal codes found for ${city}`);
        continue;
      }
      
      // Insert into database
      let imported = 0;
      for (const record of records) {
        const fields = record.fields;
        
        if (!fields.postal_code || !fields.geo_point_2d) {
          continue;
        }
        
        const { error } = await supabase
          .from('postal_codes')
          .upsert({
            postal_code: fields.postal_code,
            city: fields.place_name || city,
            municipality: fields.admin_name2 || null,
            region: fields.admin_name1 || null,
            country: 'SE',
            latitude: fields.geo_point_2d[0],
            longitude: fields.geo_point_2d[1],
            area_type: 'urban'
          }, {
            onConflict: 'postal_code,country'
          });
        
        if (!error) {
          imported++;
        }
      }
      
      console.log(`  ✅ ${city}: ${imported} postal codes imported`);
      totalImported += imported;
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`  ❌ Error importing ${city}:`, error.message);
    }
  }
  
  console.log(`\n✅ IMPORT COMPLETE: ${totalImported} postal codes imported\n`);
  return totalImported;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  POSTAL CODE DATABASE CHECK & IMPORT');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const count = await checkPostalCodes();
  
  if (count === 0) {
    console.log('⚠️  No postal codes found. Importing major cities...\n');
    await importMajorCities();
  } else if (count < 100) {
    console.log('⚠️  Low postal code count. Importing major cities...\n');
    await importMajorCities();
  } else {
    console.log('✅ Postal codes already populated. No import needed.\n');
  }
  
  // Check final count
  const finalCount = await checkPostalCodes();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  FINAL COUNT: ${finalCount} postal codes`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
