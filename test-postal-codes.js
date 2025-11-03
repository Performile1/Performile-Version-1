/**
 * POSTAL CODE API TEST SCRIPT
 * Tests all postal code validation endpoints
 */

const API_BASE = process.env.API_BASE || 'https://performile-platform-main.vercel.app';

// Test cases
const testCases = [
  // Valid postal codes
  { postalCode: '11122', country: 'SE', expected: 'valid', description: 'Stockholm, Sweden' },
  { postalCode: '0010', country: 'NO', expected: 'valid', description: 'Oslo, Norway' },
  { postalCode: '1000', country: 'DK', expected: 'valid', description: 'Copenhagen, Denmark' },
  { postalCode: '00100', country: 'FI', expected: 'valid', description: 'Helsinki, Finland' },
  
  // Invalid postal codes
  { postalCode: '99999', country: 'SE', expected: 'invalid', description: 'Invalid Swedish code' },
  { postalCode: 'ABC12', country: 'SE', expected: 'format_error', description: 'Invalid format' },
  { postalCode: '123', country: 'SE', expected: 'format_error', description: 'Too short' },
];

/**
 * Test validation endpoint
 */
async function testValidation() {
  console.log('\n🧪 TESTING VALIDATION ENDPOINT\n');
  console.log('POST /api/postal-codes/validate\n');
  
  for (const test of testCases) {
    try {
      const response = await fetch(`${API_BASE}/api/postal-codes/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: test.postalCode,
          country: test.country
        })
      });
      
      const data = await response.json();
      
      const status = data.valid ? '✅' : '❌';
      console.log(`${status} ${test.description}`);
      console.log(`   Code: ${test.postalCode} (${test.country})`);
      console.log(`   Valid: ${data.valid}`);
      if (data.city) console.log(`   City: ${data.city}`);
      if (data.source) console.log(`   Source: ${data.source}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ ERROR: ${test.description}`);
      console.error(`   ${error.message}\n`);
    }
  }
}

/**
 * Test search endpoint
 */
async function testSearch() {
  console.log('\n🔍 TESTING SEARCH ENDPOINT\n');
  console.log('GET /api/postal-codes/search\n');
  
  const searchTests = [
    { query: '1112', country: 'SE', description: 'Search Stockholm area' },
    { query: '001', country: 'NO', description: 'Search Oslo area' },
  ];
  
  for (const test of searchTests) {
    try {
      const url = `${API_BASE}/api/postal-codes/search?q=${test.query}&country=${test.country}&limit=5`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`✅ ${test.description}`);
      console.log(`   Query: ${test.query} (${test.country})`);
      console.log(`   Results: ${data.results?.length || 0}`);
      if (data.results && data.results.length > 0) {
        data.results.slice(0, 3).forEach(r => {
          console.log(`   - ${r.postalCode}: ${r.city}`);
        });
      }
      console.log('');
      
    } catch (error) {
      console.error(`❌ ERROR: ${test.description}`);
      console.error(`   ${error.message}\n`);
    }
  }
}

/**
 * Test details endpoint
 */
async function testDetails() {
  console.log('\n📋 TESTING DETAILS ENDPOINT\n');
  console.log('GET /api/postal-codes/:postalCode\n');
  
  const detailTests = [
    { postalCode: '11122', country: 'SE', description: 'Stockholm details' },
  ];
  
  for (const test of detailTests) {
    try {
      const url = `${API_BASE}/api/postal-codes/${test.postalCode}?country=${test.country}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`✅ ${test.description}`);
      console.log(`   Code: ${test.postalCode} (${test.country})`);
      console.log(`   City: ${data.city || 'N/A'}`);
      console.log(`   Region: ${data.region || 'N/A'}`);
      console.log(`   Delivery: ${data.deliveryAvailable ? 'Available' : 'Not available'}`);
      console.log(`   Couriers: ${data.couriers?.length || 0}`);
      console.log('');
      
    } catch (error) {
      console.error(`❌ ERROR: ${test.description}`);
      console.error(`   ${error.message}\n`);
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  POSTAL CODE API TEST SUITE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  API Base: ${API_BASE}`);
  console.log(`  Time: ${new Date().toLocaleString()}`);
  console.log('═══════════════════════════════════════════════════════');
  
  await testValidation();
  await testSearch();
  await testDetails();
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('  TESTS COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(console.error);
