// Comprehensive Feature Audit - Based on Database Schema
// Tests all roles against expected features from DATABASE_CODE_AUDIT.md

const { test, expect } = require('@playwright/test');
const fs = require('fs');

// Test credentials
const roles = [
  { name: 'admin', email: 'admin@performile.com', password: 'Test1234!' },
  { name: 'merchant', email: 'merchant@performile.com', password: 'Test1234!' },
  { name: 'courier', email: 'courier@performile.com', password: 'Test1234!' },
  { name: 'consumer', email: 'consumer@performile.com', password: 'Test1234!' }
];

// Expected features per role (from DATABASE_CODE_AUDIT.md)
const expectedFeatures = {
  admin: {
    navigation: [
      'Dashboard',
      'Trust Scores',
      'Orders',
      'Track Shipment',
      'Claims',
      'Users',
      'Manage Merchants',
      'Manage Couriers',
      'Review Builder',
      'Subscriptions',
      'Team',
      'Analytics',
      'E-commerce',
      'Email Templates',
      'Settings'
    ],
    apiEndpoints: [
      '/api/users',
      '/api/couriers',
      '/api/stores',
      '/api/orders',
      '/api/reviews',
      '/api/admin/analytics',
      '/api/admin/subscriptions',
      '/api/trustscore/dashboard'
    ],
    missingFeatures: [
      'Lead Marketplace',
      'Messaging System',
      'Review Request Automation',
      'Market Share Analytics',
      'Platform Metrics Dashboard'
    ]
  },
  merchant: {
    navigation: [
      'Dashboard',
      'Trust Scores',
      'Orders',
      'Track Shipment',
      'Claims',
      'Team',
      'Analytics',
      'E-commerce',
      'Email Templates',
      'Courier Preferences',
      'My Subscription',
      'Courier Directory',
      'Checkout Analytics',
      'Settings'
    ],
    apiEndpoints: [
      '/api/orders',
      '/api/couriers',
      '/api/trustscore/dashboard',
      '/api/merchant/analytics',
      '/api/merchant/checkout-analytics'
    ],
    missingFeatures: [
      'Review Request Interface',
      'Automated Review Sending',
      'Shop Analytics Snapshots',
      'E-commerce Webhooks',
      'Bulk Order Import',
      'Courier Selection at Checkout'
    ]
  },
  courier: {
    navigation: [
      'Dashboard',
      'Orders',
      'Track Shipment',
      'Team',
      'Analytics',
      'Checkout Analytics',
      'Settings'
    ],
    apiEndpoints: [
      '/api/orders',
      '/api/courier/analytics',
      '/api/courier/checkout-analytics',
      '/api/trustscore/dashboard'
    ],
    missingFeatures: [
      'Lead Marketplace',
      'Document Upload Interface',
      'Service Type Configuration',
      'API Credentials Management',
      'Delivery Proof Upload'
    ]
  },
  consumer: {
    navigation: [
      'Dashboard',
      'Trust Scores',
      'Orders',
      'Track Shipment',
      'My Reviews',
      'Settings'
    ],
    apiEndpoints: [
      '/api/orders',
      '/api/trustscore',
      '/api/trustscore/dashboard'
    ],
    missingFeatures: [
      'Message Composer',
      'Conversation List',
      'Review Submission Form'
    ]
  }
};

// Store comprehensive results
const comprehensiveResults = {
  timestamp: new Date().toISOString(),
  roles: {}
};

roles.forEach(role => {
  test.describe(`${role.name.toUpperCase()} - Comprehensive Feature Audit`, () => {
    
    let roleResults = {
      navigation: { found: [], missing: [], extra: [] },
      apiEndpoints: { called: [], notCalled: [], errors: [] },
      missingFeatures: [],
      pages: [],
      consoleErrors: [],
      networkErrors: []
    };
    
    test.beforeEach(async ({ page }) => {
      // Capture errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          roleResults.consoleErrors.push(msg.text());
        }
      });
      
      page.on('response', response => {
        const url = response.url();
        const status = response.status();
        
        // Track API calls
        if (url.includes('/api/')) {
          const endpoint = new URL(url).pathname;
          
          if (status >= 200 && status < 300) {
            if (!roleResults.apiEndpoints.called.includes(endpoint)) {
              roleResults.apiEndpoints.called.push(endpoint);
            }
          } else if (status >= 400) {
            roleResults.apiEndpoints.errors.push({
              endpoint,
              status,
              statusText: response.statusText()
            });
          }
        }
        
        // Track network errors
        if (status >= 400) {
          roleResults.networkErrors.push({
            url: url,
            status: status,
            method: response.request().method()
          });
        }
      });
      
      // Login
      await page.goto('https://frontend-two-swart-31.vercel.app/#/login');
      await page.fill('input[type="email"]', role.email);
      await page.fill('input[type="password"]', role.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    });

    test(`1. ${role.name} - Navigation Menu Audit`, async ({ page }) => {
      console.log(`\n========================================`);
      console.log(`${role.name.toUpperCase()} - FEATURE AUDIT`);
      console.log(`========================================\n`);
      
      // Get actual navigation items
      const navButtons = await page.locator('.MuiListItemButton-root').all();
      const actualNav = [];
      
      for (let i = 0; i < Math.min(navButtons.length, 20); i++) {
        try {
          const button = navButtons[i];
          const isVisible = await button.isVisible({ timeout: 1000 });
          
          if (isVisible) {
            const text = await button.textContent({ timeout: 1000 });
            if (text && text.trim()) {
              actualNav.push(text.trim());
            }
          }
        } catch (e) {
          continue;
        }
      }
      
      roleResults.navigation.found = actualNav;
      
      // Compare with expected
      const expected = expectedFeatures[role.name].navigation;
      
      // Find missing features
      roleResults.navigation.missing = expected.filter(item => 
        !actualNav.some(nav => nav.toLowerCase().includes(item.toLowerCase()))
      );
      
      // Find extra features (not in expected list)
      roleResults.navigation.extra = actualNav.filter(item =>
        !expected.some(exp => item.toLowerCase().includes(exp.toLowerCase()))
      );
      
      console.log(`\n=== NAVIGATION AUDIT ===`);
      console.log(`Expected: ${expected.length} items`);
      console.log(`Found: ${actualNav.length} items`);
      console.log(`Missing: ${roleResults.navigation.missing.length} items`);
      
      if (roleResults.navigation.missing.length > 0) {
        console.log(`\nMissing Features:`);
        roleResults.navigation.missing.forEach(item => {
          console.log(`  ❌ ${item}`);
        });
      }
      
      if (roleResults.navigation.extra.length > 0) {
        console.log(`\nExtra Features (not in spec):`);
        roleResults.navigation.extra.forEach(item => {
          console.log(`  ➕ ${item}`);
        });
      }
      
      console.log(`\nFound Features:`);
      actualNav.forEach(item => {
        console.log(`  ✅ ${item}`);
      });
    });

    test(`2. ${role.name} - API Endpoint Coverage`, async ({ page }) => {
      console.log(`\n=== API ENDPOINT AUDIT ===`);
      
      // Navigate through pages to trigger API calls
      const testPages = ['#/dashboard', '#/orders', '#/trustscores'];
      
      for (const pagePath of testPages) {
        try {
          await page.goto(`https://frontend-two-swart-31.vercel.app/${pagePath}`);
          await page.waitForTimeout(2000);
        } catch (e) {
          // Page might not exist for this role
        }
      }
      
      // Wait a bit for all API calls to complete
      await page.waitForTimeout(2000);
      
      const expected = expectedFeatures[role.name].apiEndpoints;
      
      // Find which expected endpoints were NOT called
      roleResults.apiEndpoints.notCalled = expected.filter(endpoint =>
        !roleResults.apiEndpoints.called.some(called => called.includes(endpoint))
      );
      
      console.log(`\nExpected API Endpoints: ${expected.length}`);
      console.log(`Actually Called: ${roleResults.apiEndpoints.called.length}`);
      console.log(`Not Called: ${roleResults.apiEndpoints.notCalled.length}`);
      
      if (roleResults.apiEndpoints.called.length > 0) {
        console.log(`\nAPI Endpoints Called:`);
        roleResults.apiEndpoints.called.forEach(endpoint => {
          console.log(`  ✅ ${endpoint}`);
        });
      }
      
      if (roleResults.apiEndpoints.notCalled.length > 0) {
        console.log(`\nExpected but NOT Called:`);
        roleResults.apiEndpoints.notCalled.forEach(endpoint => {
          console.log(`  ❌ ${endpoint}`);
        });
      }
      
      if (roleResults.apiEndpoints.errors.length > 0) {
        console.log(`\nAPI Errors:`);
        roleResults.apiEndpoints.errors.forEach(error => {
          console.log(`  🐛 ${error.status} ${error.endpoint}`);
        });
      }
    });

    test(`3. ${role.name} - Missing Features Report`, async ({ page }) => {
      console.log(`\n=== MISSING FEATURES (From Database Schema) ===`);
      
      roleResults.missingFeatures = expectedFeatures[role.name].missingFeatures;
      
      console.log(`\nFeatures in Database but NOT in Frontend:`);
      roleResults.missingFeatures.forEach((feature, index) => {
        console.log(`  ${index + 1}. ❌ ${feature}`);
      });
      
      console.log(`\nTotal Missing Features: ${roleResults.missingFeatures.length}`);
    });

    test(`4. ${role.name} - Error Summary`, async ({ page }) => {
      console.log(`\n=== ERROR SUMMARY ===`);
      
      console.log(`\nConsole Errors: ${roleResults.consoleErrors.length}`);
      if (roleResults.consoleErrors.length > 0) {
        roleResults.consoleErrors.slice(0, 3).forEach((error, i) => {
          console.log(`  ${i + 1}. ${error.substring(0, 100)}...`);
        });
      }
      
      console.log(`\nNetwork Errors: ${roleResults.networkErrors.length}`);
      if (roleResults.networkErrors.length > 0) {
        roleResults.networkErrors.slice(0, 5).forEach((error, i) => {
          console.log(`  ${i + 1}. ${error.status} ${error.method} ${error.url}`);
        });
      }
    });

    test(`5. ${role.name} - Completion Score`, async ({ page }) => {
      console.log(`\n=== COMPLETION SCORE ===`);
      
      const expectedNav = expectedFeatures[role.name].navigation.length;
      const foundNav = roleResults.navigation.found.length;
      const navScore = Math.round((foundNav / expectedNav) * 100);
      
      const expectedAPI = expectedFeatures[role.name].apiEndpoints.length;
      const calledAPI = roleResults.apiEndpoints.called.length;
      const apiScore = Math.round((calledAPI / expectedAPI) * 100);
      
      const totalMissing = roleResults.missingFeatures.length;
      
      console.log(`\nNavigation: ${foundNav}/${expectedNav} (${navScore}%)`);
      console.log(`API Coverage: ${calledAPI}/${expectedAPI} (${apiScore}%)`);
      console.log(`Missing Features: ${totalMissing}`);
      console.log(`Console Errors: ${roleResults.consoleErrors.length}`);
      console.log(`Network Errors: ${roleResults.networkErrors.length}`);
      
      const overallScore = Math.round((navScore + apiScore) / 2);
      console.log(`\n📊 Overall Completion: ${overallScore}%`);
      
      // Store results
      comprehensiveResults.roles[role.name] = {
        ...roleResults,
        scores: {
          navigation: navScore,
          api: apiScore,
          overall: overallScore
        }
      };
    });
  });
});

// After all tests, save comprehensive results
test.afterAll(async () => {
  const reportPath = 'comprehensive-audit-results.json';
  fs.writeFileSync(reportPath, JSON.stringify(comprehensiveResults, null, 2));
  
  console.log(`\n========================================`);
  console.log(`COMPREHENSIVE AUDIT COMPLETE`);
  console.log(`========================================`);
  console.log(`Results saved to: ${reportPath}`);
  
  // Generate summary
  console.log(`\n=== PLATFORM SUMMARY ===\n`);
  
  Object.keys(comprehensiveResults.roles).forEach(roleName => {
    const role = comprehensiveResults.roles[roleName];
    console.log(`${roleName.toUpperCase()}:`);
    console.log(`  Navigation: ${role.scores.navigation}%`);
    console.log(`  API Coverage: ${role.scores.api}%`);
    console.log(`  Overall: ${role.scores.overall}%`);
    console.log(`  Missing Features: ${role.missingFeatures.length}`);
    console.log(`  Errors: ${role.consoleErrors.length + role.networkErrors.length}`);
    console.log(``);
  });
  
  // Calculate platform average
  const roles = Object.values(comprehensiveResults.roles);
  const avgScore = Math.round(
    roles.reduce((sum, role) => sum + role.scores.overall, 0) / roles.length
  );
  
  console.log(`📊 PLATFORM AVERAGE: ${avgScore}%`);
});
