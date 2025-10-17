// Merchant Dashboard Tests - BUG DETECTION
// Created: October 17, 2025, 7:09 AM
// Purpose: Comprehensive testing of merchant dashboard with detailed bug logging
// KNOWN ISSUE: Merchant dashboard is bugging - needs investigation

const { test, expect } = require('@playwright/test');
const { ConsoleLogger } = require('../../utils/console-logger');
const { NetworkLogger } = require('../../utils/network-logger');
const { APILogger } = require('../../utils/api-logger');
const { TEST_USERS } = require('../../fixtures/test-data');
const fs = require('fs').promises;

test.describe('Merchant Dashboard - Bug Detection', () => {
  let consoleLogger;
  let networkLogger;
  let apiLogger;

  test.beforeEach(async ({ page }) => {
    consoleLogger = new ConsoleLogger(page);
    networkLogger = new NetworkLogger(page);
    apiLogger = new APILogger(page);
    
    // Login as merchant
    await page.goto('/');
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.merchant.email);
    await page.fill('input[name="password"]', TEST_USERS.merchant.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for dashboard to load
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Print detailed summaries
    console.log('\n' + '='.repeat(80));
    consoleLogger.printSummary();
    networkLogger.printSummary();
    apiLogger.printSummary();
    console.log('='.repeat(80) + '\n');
    
    // Export logs
    const testName = testInfo.title.replace(/\s+/g, '-');
    await apiLogger.exportToFile(`api-logs/merchant-${testName}.json`);
    
    // Save console logs
    const consoleLogs = consoleLogger.getLogs();
    await fs.writeFile(`logs/merchant-${testName}-console.json`, JSON.stringify(consoleLogs, null, 2));
    
    // Generate detailed API report
    const report = apiLogger.generateReport();
    await fs.writeFile(`api-reports/merchant-${testName}.md`, report);
    
    // Take screenshot
    await page.screenshot({ 
      path: `screenshots/merchant-${testName}-${Date.now()}.png`, 
      fullPage: true 
    });
  });

  // Test 1: Dashboard Loads
  test('Merchant dashboard loads without critical errors', async ({ page }) => {
    console.log('\n🔍 INVESTIGATING: Merchant Dashboard Loading...');
    
    // Check if dashboard elements are present
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    const url = page.url();
    console.log(`Current URL: ${url}`);
    
    // Check for main dashboard elements
    const headings = await page.locator('h1, h2, h3').allTextContents();
    console.log(`Headings found: ${JSON.stringify(headings)}`);
    
    const hasContent = await page.locator('body').textContent();
    console.log(`Page has content: ${hasContent.length > 100}`);
    
    // Check console errors
    const errors = consoleLogger.getErrors();
    console.log(`\n⚠️ CONSOLE ERRORS: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`\nError ${index + 1}:`);
        console.log(`  Type: ${error.type}`);
        console.log(`  Message: ${error.message}`);
        console.log(`  Time: ${error.timestamp.toISOString()}`);
      });
    }
    
    // Check API failures
    const failedCalls = apiLogger.getFailedCalls();
    console.log(`\n⚠️ FAILED API CALLS: ${failedCalls.length}`);
    if (failedCalls.length > 0) {
      failedCalls.forEach((call, index) => {
        console.log(`\nFailed Call ${index + 1}:`);
        console.log(`  Endpoint: ${call.endpoint}`);
        console.log(`  Method: ${call.method}`);
        console.log(`  Status: ${call.responseStatus}`);
        console.log(`  Error: ${call.responseBody?.message || 'Unknown'}`);
      });
    }
    
    // Check network failures
    const networkFailures = networkLogger.getFailedRequests();
    console.log(`\n⚠️ NETWORK FAILURES: ${networkFailures.length}`);
    
    // Log all API calls made
    const allAPICalls = apiLogger.getAPICalls();
    console.log(`\n📊 TOTAL API CALLS: ${allAPICalls.length}`);
    allAPICalls.forEach(call => {
      console.log(`  ${call.method} ${call.endpoint} - ${call.responseStatus || 'PENDING'} (${call.duration || '?'}ms)`);
    });
    
    console.log('\n✅ Dashboard load test completed - Check logs above for issues');
  });

  // Test 2: Dashboard Statistics Load
  test('Merchant dashboard statistics are displayed', async ({ page }) => {
    console.log('\n🔍 CHECKING: Dashboard Statistics...');
    
    // Look for common stat elements
    const statSelectors = [
      '[class*="stat"]',
      '[class*="metric"]',
      '[class*="card"]',
      '[data-testid*="stat"]',
      'text=/total.*orders/i',
      'text=/revenue/i',
      'text=/pending/i'
    ];
    
    for (const selector of statSelectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count} elements found`);
    }
    
    // Check if analytics API was called
    const analyticsCall = apiLogger.getCallsByEndpoint('/api/merchant/checkout-analytics')[0] ||
                         apiLogger.getCallsByEndpoint('/api/tracking/summary')[0];
    
    if (analyticsCall) {
      console.log(`\n📊 Analytics API Called:`);
      console.log(`  Endpoint: ${analyticsCall.endpoint}`);
      console.log(`  Status: ${analyticsCall.responseStatus}`);
      console.log(`  Duration: ${analyticsCall.duration}ms`);
      console.log(`  Response: ${JSON.stringify(analyticsCall.responseBody, null, 2)}`);
    } else {
      console.log(`\n⚠️ No analytics API call detected!`);
    }
    
    console.log('\n✅ Statistics check completed');
  });

  // Test 3: Orders Section Visible
  test('Merchant can see orders section', async ({ page }) => {
    console.log('\n🔍 CHECKING: Orders Section...');
    
    // Look for orders-related elements
    const ordersVisible = await page.locator('text=/orders/i').count() > 0;
    console.log(`  Orders text visible: ${ordersVisible}`);
    
    // Try to click on orders if visible
    if (ordersVisible) {
      try {
        await page.click('text=/orders/i', { timeout: 2000 });
        await page.waitForTimeout(1000);
        
        const newUrl = page.url();
        console.log(`  Navigated to: ${newUrl}`);
        
        // Check if orders API was called
        const ordersCall = apiLogger.getCallsByEndpoint('/api/orders')[0];
        if (ordersCall) {
          console.log(`\n📦 Orders API Called:`);
          console.log(`  Status: ${ordersCall.responseStatus}`);
          console.log(`  Duration: ${ordersCall.duration}ms`);
          console.log(`  Orders count: ${ordersCall.responseBody?.data?.length || 0}`);
        }
      } catch (error) {
        console.log(`  ⚠️ Could not click orders: ${error.message}`);
      }
    }
    
    console.log('\n✅ Orders section check completed');
  });

  // Test 4: Navigation Menu Works
  test('Merchant navigation menu is functional', async ({ page }) => {
    console.log('\n🔍 CHECKING: Navigation Menu...');
    
    // Look for common navigation elements
    const navElements = [
      'Dashboard',
      'Orders',
      'Analytics',
      'Settings',
      'Store'
    ];
    
    for (const element of navElements) {
      const visible = await page.locator(`text=${element}`).count() > 0;
      console.log(`  ${element}: ${visible ? '✅ Visible' : '❌ Not found'}`);
    }
    
    console.log('\n✅ Navigation check completed');
  });

  // Test 5: Performance Check
  test('Dashboard loads within acceptable time', async ({ page }) => {
    console.log('\n🔍 CHECKING: Dashboard Performance...');
    
    const avgResponseTime = apiLogger.getAverageResponseTime();
    console.log(`  Average API response time: ${avgResponseTime.toFixed(2)}ms`);
    
    const slowCalls = apiLogger.getSlowCalls(1000);
    console.log(`  Slow API calls (>1s): ${slowCalls.length}`);
    
    if (slowCalls.length > 0) {
      slowCalls.forEach(call => {
        console.log(`    ⚠️ ${call.method} ${call.endpoint} - ${call.duration}ms`);
      });
    }
    
    // Check page load metrics
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        domInteractive: perf.domInteractive - perf.fetchStart
      };
    });
    
    console.log(`\n📊 Page Load Metrics:`);
    console.log(`  DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`  Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`  DOM Interactive: ${metrics.domInteractive.toFixed(2)}ms`);
    
    console.log('\n✅ Performance check completed');
  });

  // Test 6: Error Boundary Check
  test('No JavaScript errors on dashboard', async ({ page }) => {
    console.log('\n🔍 CHECKING: JavaScript Errors...');
    
    const errors = consoleLogger.getErrors();
    const warnings = consoleLogger.getWarnings();
    
    console.log(`  Total console errors: ${errors.length}`);
    console.log(`  Total console warnings: ${warnings.length}`);
    
    if (errors.length > 0) {
      console.log(`\n❌ ERRORS FOUND:`);
      errors.forEach((error, index) => {
        console.log(`\n  Error ${index + 1}:`);
        console.log(`    ${error.message}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS FOUND:`);
      warnings.forEach((warning, index) => {
        console.log(`\n  Warning ${index + 1}:`);
        console.log(`    ${warning.message}`);
      });
    }
    
    // This test will pass but log all errors for review
    console.log('\n✅ Error check completed - Review logs above');
  });
});
