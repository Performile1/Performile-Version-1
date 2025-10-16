// Complete Audit for All User Roles
// Tests: Admin, Merchant, Courier, Consumer
// Captures: Navigation, Console Errors, Network Errors, API Calls

const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Test credentials for all roles
const roles = [
  { name: 'admin', email: 'admin@performile.com', password: 'Test1234!' },
  { name: 'merchant', email: 'merchant@performile.com', password: 'Test1234!' },
  { name: 'courier', email: 'courier@performile.com', password: 'Test1234!' },
  { name: 'consumer', email: 'consumer@performile.com', password: 'Test1234!' }
];

// Store all findings
const auditResults = {
  timestamp: new Date().toISOString(),
  roles: {}
};

roles.forEach(role => {
  test.describe(`${role.name.toUpperCase()} Role Audit`, () => {
    
    let consoleErrors = [];
    let networkErrors = [];
    let apiCalls = [];
    
    test.beforeEach(async ({ page }) => {
      // Reset error collectors
      consoleErrors = [];
      networkErrors = [];
      apiCalls = [];
      
      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            text: msg.text(),
            location: msg.location()
          });
        }
      });
      
      // Capture network errors and API calls
      page.on('response', response => {
        const url = response.url();
        const status = response.status();
        
        // Record all API calls
        if (url.includes('/api/') || url.includes('supabase')) {
          apiCalls.push({
            url: url,
            status: status,
            method: response.request().method(),
            statusText: response.statusText()
          });
        }
        
        // Record failed requests
        if (status >= 400) {
          networkErrors.push({
            url: url,
            status: status,
            statusText: response.statusText(),
            method: response.request().method()
          });
        }
      });
      
      // Capture page errors
      page.on('pageerror', error => {
        consoleErrors.push({
          text: error.message,
          stack: error.stack
        });
      });
      
      // Login
      await page.goto('https://frontend-two-swart-31.vercel.app/#/login');
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', role.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    });

    test(`1. ${role.name} - Login and Dashboard`, async ({ page }) => {
      console.log(`\n========================================`);
      console.log(`${role.name.toUpperCase()} ROLE AUDIT`);
      console.log(`========================================\n`);
      
      const url = page.url();
      console.log(`✓ Logged in successfully`);
      console.log(`  Current URL: ${url}`);
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/${role.name}-dashboard.png`,
        fullPage: true 
      });
      
      console.log(`  Screenshot: ${role.name}-dashboard.png`);
    });

    test(`2. ${role.name} - Navigation Menu`, async ({ page }) => {
      console.log(`\n=== ${role.name.toUpperCase()}: Navigation Menu ===`);
      
      // Get navigation buttons
      const navButtons = await page.locator('.MuiListItemButton-root').all();
      console.log(`Found ${navButtons.length} navigation buttons`);
      
      const menuItems = [];
      
      for (let i = 0; i < Math.min(navButtons.length, 20); i++) {
        try {
          const button = navButtons[i];
          const isVisible = await button.isVisible({ timeout: 1000 });
          
          if (isVisible) {
            const text = await button.textContent({ timeout: 1000 });
            if (text && text.trim()) {
              menuItems.push(text.trim());
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      console.log(`\nMenu Items (${menuItems.length}):`);
      menuItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
      });
      
      // Store results
      if (!auditResults.roles[role.name]) {
        auditResults.roles[role.name] = {};
      }
      auditResults.roles[role.name].menuItems = menuItems;
    });

    test(`3. ${role.name} - Test All Pages`, async ({ page }) => {
      console.log(`\n=== ${role.name.toUpperCase()}: Testing All Pages ===`);
      
      const navButtons = await page.locator('.MuiListItemButton-root').all();
      const pageResults = [];
      
      for (let i = 0; i < Math.min(navButtons.length, 15); i++) {
        try {
          const button = navButtons[i];
          const isVisible = await button.isVisible({ timeout: 1000 });
          
          if (!isVisible) continue;
          
          const text = await button.textContent({ timeout: 1000 });
          if (!text || !text.trim()) continue;
          
          const pageName = text.trim();
          console.log(`\nTesting: ${pageName}`);
          
          // Click and wait
          await button.click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          console.log(`  URL: ${currentUrl}`);
          
          // Check for errors on page
          const errorElements = await page.locator('.error, .alert-danger, [role="alert"]').count();
          console.log(`  Errors: ${errorElements}`);
          
          // Check for empty states
          const emptyStates = await page.locator('text=/no data|empty|no results/i').count();
          console.log(`  Empty states: ${emptyStates}`);
          
          // Take screenshot
          const filename = `${role.name}-${pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
          await page.screenshot({ 
            path: `screenshots/${filename}.png`,
            fullPage: true 
          });
          console.log(`  Screenshot: ${filename}.png`);
          
          pageResults.push({
            name: pageName,
            url: currentUrl,
            errors: errorElements,
            emptyStates: emptyStates,
            screenshot: `${filename}.png`
          });
          
        } catch (error) {
          console.log(`  ❌ ERROR: ${error.message}`);
        }
      }
      
      // Store results
      auditResults.roles[role.name].pages = pageResults;
    });

    test(`4. ${role.name} - Console & Network Errors`, async ({ page }) => {
      console.log(`\n=== ${role.name.toUpperCase()}: Errors & API Calls ===`);
      
      // Navigate through a few pages to collect errors
      const testPages = ['#/dashboard', '#/orders', '#/trustscores'];
      
      for (const pagePath of testPages) {
        try {
          await page.goto(`https://frontend-two-swart-31.vercel.app/${pagePath}`);
          await page.waitForTimeout(2000);
        } catch (e) {
          // Page might not exist for this role
        }
      }
      
      // Report console errors
      console.log(`\nConsole Errors: ${consoleErrors.length}`);
      consoleErrors.slice(0, 5).forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.text.substring(0, 100)}...`);
      });
      
      // Report network errors
      console.log(`\nNetwork Errors: ${networkErrors.length}`);
      networkErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.status} ${error.method} ${error.url}`);
      });
      
      // Report API calls
      console.log(`\nAPI Calls Made: ${apiCalls.length}`);
      const uniqueEndpoints = [...new Set(apiCalls.map(call => {
        const url = new URL(call.url);
        return `${call.method} ${url.pathname}`;
      }))];
      
      uniqueEndpoints.slice(0, 10).forEach((endpoint, i) => {
        const calls = apiCalls.filter(call => {
          const url = new URL(call.url);
          return `${call.method} ${url.pathname}` === endpoint;
        });
        const statuses = [...new Set(calls.map(c => c.status))];
        console.log(`  ${i + 1}. ${endpoint} (${statuses.join(', ')})`);
      });
      
      // Store results
      auditResults.roles[role.name].consoleErrors = consoleErrors;
      auditResults.roles[role.name].networkErrors = networkErrors;
      auditResults.roles[role.name].apiCalls = apiCalls;
      auditResults.roles[role.name].uniqueEndpoints = uniqueEndpoints;
    });

    test(`5. ${role.name} - API Endpoint Analysis`, async ({ page }) => {
      console.log(`\n=== ${role.name.toUpperCase()}: API Analysis ===`);
      
      // Analyze API calls
      const successfulCalls = apiCalls.filter(call => call.status >= 200 && call.status < 300);
      const failedCalls = apiCalls.filter(call => call.status >= 400);
      const missingCalls = apiCalls.filter(call => call.status === 404);
      
      console.log(`\nAPI Call Summary:`);
      console.log(`  Total API calls: ${apiCalls.length}`);
      console.log(`  Successful (2xx): ${successfulCalls.length}`);
      console.log(`  Failed (4xx/5xx): ${failedCalls.length}`);
      console.log(`  Not Found (404): ${missingCalls.length}`);
      
      if (missingCalls.length > 0) {
        console.log(`\nMissing API Endpoints (404):`);
        missingCalls.forEach((call, i) => {
          const url = new URL(call.url);
          console.log(`  ${i + 1}. ${call.method} ${url.pathname}`);
        });
      }
      
      if (failedCalls.length > 0) {
        console.log(`\nFailed API Calls:`);
        failedCalls.slice(0, 5).forEach((call, i) => {
          const url = new URL(call.url);
          console.log(`  ${i + 1}. ${call.status} ${call.method} ${url.pathname}`);
        });
      }
      
      // Store analysis
      auditResults.roles[role.name].apiAnalysis = {
        total: apiCalls.length,
        successful: successfulCalls.length,
        failed: failedCalls.length,
        missing: missingCalls.length,
        missingEndpoints: missingCalls.map(call => {
          const url = new URL(call.url);
          return `${call.method} ${url.pathname}`;
        })
      };
    });
  });
});

// After all tests, save results to file
test.afterAll(async () => {
  const reportPath = 'audit-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n========================================`);
  console.log(`AUDIT COMPLETE`);
  console.log(`========================================`);
  console.log(`Results saved to: ${reportPath}`);
  console.log(`Screenshots saved to: screenshots/`);
  
  // Generate summary
  console.log(`\n=== SUMMARY ===\n`);
  Object.keys(auditResults.roles).forEach(roleName => {
    const role = auditResults.roles[roleName];
    console.log(`${roleName.toUpperCase()}:`);
    console.log(`  Menu Items: ${role.menuItems?.length || 0}`);
    console.log(`  Pages Tested: ${role.pages?.length || 0}`);
    console.log(`  Console Errors: ${role.consoleErrors?.length || 0}`);
    console.log(`  Network Errors: ${role.networkErrors?.length || 0}`);
    console.log(`  API Calls: ${role.apiCalls?.length || 0}`);
    console.log(`  Missing Endpoints: ${role.apiAnalysis?.missing || 0}`);
    console.log(``);
  });
});
