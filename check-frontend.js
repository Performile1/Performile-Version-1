const https = require('https');

const urls = [
  'https://performile-platform-yhep.vercel.app/#/login',
  'https://performile-platform-yhep.vercel.app/',
  'https://performile-platform-yhep-unzhnh4ew-rickard-wigrunds-projects.vercel.app/',
  'https://performile-platform-yhep-unzhnh4ew-rickard-wigrunds-projects.vercel.app/#/login'
];

function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\nTesting: ${url}`);
    
    const req = https.get(url, { timeout: 10000 }, (res) => {
      let data = [];
      
      console.log(`Status: ${res.statusCode}`);
      console.log('Content-Type:', res.headers['content-type']);
      
      res.on('data', (chunk) => data.push(chunk));
      
      res.on('end', () => {
        const content = Buffer.concat(data).toString();
        console.log('Content Length:', content.length, 'bytes');
        
        // Check for common issues
        if (content.includes('404') || content.includes('NOT_FOUND')) {
          console.log('⚠️  Page not found (404)');
        } else if (content.length < 1000) {
          console.log('⚠️  Content seems too small, might be an error page');
          console.log('Preview:', content.substring(0, 200) + '...');
        } else {
          console.log('✅ Page loaded successfully');
          
          // Check for React app mount point
          if (content.includes('id="root"') || content.includes('id="app"') || content.includes('id="__next"')) {
            console.log('✅ React app container found');
          } else {
            console.log('⚠️  React app container not found');
          }
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('Error:', error.message);
      resolve();
    });
    
    req.on('timeout', () => {
      console.error('Request timed out');
      req.destroy();
      resolve();
    });
  });
}

async function runTests() {
  for (const url of urls) {
    await testUrl(url);
  }
  console.log('\nTests completed');
}

runTests().catch(console.error);
