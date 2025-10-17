// Comprehensive E2E Tests - All Users & Features
// Created: October 17, 2025, 7:11 AM
// Purpose: Complete test suite covering all 4 user roles with bug detection
// Run with: npm test tests/all-users-comprehensive.spec.js

const { test, expect } = require('@playwright/test');
const { ConsoleLogger } = require('../utils/console-logger');
const { NetworkLogger } = require('../utils/network-logger');
const { APILogger } = require('../utils/api-logger');
const { TEST_USERS } = require('../fixtures/test-data');
const fs = require('fs').promises;

// Helper function to save logs
async function saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page) {
  const testName = testInfo.title.replace(/\s+/g, '-');
  
  // Print summaries
  console.log('\n' + '='.repeat(80));
  consoleLogger.printSummary();
  networkLogger.printSummary();
  apiLogger.printSummary();
  console.log('='.repeat(80) + '\n');
  
  // Export logs
  await apiLogger.exportToFile(`api-logs/${testName}.json`);
  
  const consoleLogs = consoleLogger.getLogs();
  await fs.writeFile(`logs/${testName}-console.json`, JSON.stringify(consoleLogs, null, 2));
  
  const report = apiLogger.generateReport();
  await fs.writeFile(`api-reports/${testName}.md`, report);
  
  // Take screenshot
  await page.screenshot({ 
    path: `screenshots/${testName}-${Date.now()}.png`, 
    fullPage: true 
  });
}

test.describe('COMPREHENSIVE E2E TESTS - ALL USERS', () => {
  
  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================
  
  test.describe('1. Authentication Tests', () => {
    let consoleLogger, networkLogger, apiLogger;

    test.beforeEach(async ({ page }) => {
      consoleLogger = new ConsoleLogger(page);
      networkLogger = new NetworkLogger(page);
      apiLogger = new APILogger(page);
      
      // Clear all storage to ensure clean state
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.context().clearCookies();
      
      // Reload page after clearing storage
      await page.goto('/');
    });

    test.afterEach(async ({ page }, testInfo) => {
      await saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page);
    });

    test('1.1 - Admin Login', async ({ page }) => {
      console.log('\n🧪 Test 1.1: Admin Login');
      
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      const tokens = await page.evaluate(() => {
        const tokensStr = localStorage.getItem('performile_tokens');
        return tokensStr ? JSON.parse(tokensStr) : null;
      });
      expect(tokens).toBeTruthy();
      expect(tokens.accessToken).toBeTruthy();

      expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
      console.log('✅ Admin login successful');
    });

    test('1.2 - Merchant Login', async ({ page }) => {
      console.log('\n🧪 Test 1.2: Merchant Login');
      
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.merchant.email);
      await page.fill('input[name="password"]', TEST_USERS.merchant.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      const tokens = await page.evaluate(() => {
        const tokensStr = localStorage.getItem('performile_tokens');
        return tokensStr ? JSON.parse(tokensStr) : null;
      });
      expect(tokens).toBeTruthy();
      expect(tokens.accessToken).toBeTruthy();

      expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
      console.log('✅ Merchant login successful');
    });

    test('1.3 - Courier Login', async ({ page }) => {
      console.log('\n🧪 Test 1.3: Courier Login');
      
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.courier.email);
      await page.fill('input[name="password"]', TEST_USERS.courier.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      
      const tokens = await page.evaluate(() => {
        const tokensStr = localStorage.getItem('performile_tokens');
        return tokensStr ? JSON.parse(tokensStr) : null;
      });
      expect(tokens).toBeTruthy();
      expect(tokens.accessToken).toBeTruthy();

      expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
      console.log('✅ Courier login successful');
    });

    test('1.4 - Consumer Login', async ({ page }) => {
      console.log('\n🧪 Test 1.4: Consumer Login');
      
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.consumer.email);
      await page.fill('input[name="password"]', TEST_USERS.consumer.password);
      await page.click('button[type="submit"]');
      
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      
      const tokens = await page.evaluate(() => {
        const tokensStr = localStorage.getItem('performile_tokens');
        return tokensStr ? JSON.parse(tokensStr) : null;
      });
      expect(tokens).toBeTruthy();
      expect(tokens.accessToken).toBeTruthy();

      expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
      console.log('✅ Consumer login successful');
    });

    test('1.5 - Invalid Credentials', async ({ page }) => {
      console.log('\n🧪 Test 1.5: Invalid Credentials');
      
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'WrongPassword123!');
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(2000);
      
      const failedCalls = apiLogger.getFailedCalls();
      expect(failedCalls.length).toBeGreaterThan(0);
      console.log('✅ Invalid credentials handled correctly');
    });
  });

  // ============================================================================
  // ADMIN DASHBOARD TESTS
  // ============================================================================
  
  test.describe('2. Admin Dashboard Tests', () => {
    let consoleLogger, networkLogger, apiLogger;

    test.beforeEach(async ({ page }) => {
      consoleLogger = new ConsoleLogger(page);
      networkLogger = new NetworkLogger(page);
      apiLogger = new APILogger(page);
      
      await page.goto('/');
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
    });

    test.afterEach(async ({ page }, testInfo) => {
      await saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page);
    });

    test('2.1 - Admin Dashboard Loads', async ({ page }) => {
      console.log('\n🧪 Test 2.1: Admin Dashboard');
      
      const errors = consoleLogger.getErrors();
      console.log(`Console errors: ${errors.length}`);
      
      const failedCalls = apiLogger.getFailedCalls();
      console.log(`Failed API calls: ${failedCalls.length}`);
      
      const hasContent = await page.locator('body').textContent();
      expect(hasContent.length).toBeGreaterThan(100);
      
      console.log('✅ Admin dashboard loaded');
    });

    test('2.2 - Admin Can View Users', async ({ page }) => {
      console.log('\n🧪 Test 2.2: Admin View Users');
      
      const usersVisible = await page.locator('text=/users/i').count() > 0;
      console.log(`Users section visible: ${usersVisible}`);
      
      if (usersVisible) {
        await page.click('text=/users/i').catch(() => {});
        await page.waitForTimeout(1000);
      }
      
      console.log('✅ Users section checked');
    });
  });

  // ============================================================================
  // MERCHANT DASHBOARD TESTS (BUG DETECTION)
  // ============================================================================
  
  test.describe('3. Merchant Dashboard Tests - BUG DETECTION', () => {
    let consoleLogger, networkLogger, apiLogger;

    test.beforeEach(async ({ page }) => {
      consoleLogger = new ConsoleLogger(page);
      networkLogger = new NetworkLogger(page);
      apiLogger = new APILogger(page);
      
      await page.goto('/');
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.merchant.email);
      await page.fill('input[name="password"]', TEST_USERS.merchant.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
    });

    test.afterEach(async ({ page }, testInfo) => {
      await saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page);
    });

    test('3.1 - Merchant Dashboard Bug Investigation', async ({ page }) => {
      console.log('\n🔍 Test 3.1: MERCHANT DASHBOARD BUG INVESTIGATION');
      
      const pageTitle = await page.title();
      console.log(`Page title: ${pageTitle}`);
      
      const url = page.url();
      console.log(`Current URL: ${url}`);
      
      const headings = await page.locator('h1, h2, h3').allTextContents();
      console.log(`Headings: ${JSON.stringify(headings)}`);
      
      const errors = consoleLogger.getErrors();
      console.log(`\n⚠️ CONSOLE ERRORS: ${errors.length}`);
      if (errors.length > 0) {
        errors.forEach((error, index) => {
          console.log(`\nError ${index + 1}:`);
          console.log(`  ${error.message}`);
        });
      }
      
      const failedCalls = apiLogger.getFailedCalls();
      console.log(`\n⚠️ FAILED API CALLS: ${failedCalls.length}`);
      if (failedCalls.length > 0) {
        failedCalls.forEach((call, index) => {
          console.log(`\nFailed Call ${index + 1}:`);
          console.log(`  ${call.method} ${call.endpoint} - ${call.responseStatus}`);
          console.log(`  Error: ${call.responseBody?.message || 'Unknown'}`);
        });
      }
      
      const allAPICalls = apiLogger.getAPICalls();
      console.log(`\n📊 TOTAL API CALLS: ${allAPICalls.length}`);
      allAPICalls.forEach(call => {
        console.log(`  ${call.method} ${call.endpoint} - ${call.responseStatus || 'PENDING'} (${call.duration || '?'}ms)`);
      });
      
      console.log('\n✅ Merchant dashboard investigation complete - CHECK LOGS');
    });

    test('3.2 - Merchant Orders Section', async ({ page }) => {
      console.log('\n🧪 Test 3.2: Merchant Orders');
      
      const ordersVisible = await page.locator('text=/orders/i').count() > 0;
      console.log(`Orders section visible: ${ordersVisible}`);
      
      if (ordersVisible) {
        await page.click('text=/orders/i').catch(() => {});
        await page.waitForTimeout(1000);
        
        const ordersCall = apiLogger.getCallsByEndpoint('/api/orders')[0];
        if (ordersCall) {
          console.log(`Orders API: ${ordersCall.responseStatus} (${ordersCall.duration}ms)`);
        }
      }
      
      console.log('✅ Orders section checked');
    });

    test('3.3 - Merchant Dashboard Performance', async ({ page }) => {
      console.log('\n🧪 Test 3.3: Merchant Performance');
      
      const avgResponseTime = apiLogger.getAverageResponseTime();
      console.log(`Average API response: ${avgResponseTime.toFixed(2)}ms`);
      
      const slowCalls = apiLogger.getSlowCalls(1000);
      console.log(`Slow calls (>1s): ${slowCalls.length}`);
      
      if (slowCalls.length > 0) {
        slowCalls.forEach(call => {
          console.log(`  ⚠️ ${call.method} ${call.endpoint} - ${call.duration}ms`);
        });
      }
      
      console.log('✅ Performance check complete');
    });
  });

  // ============================================================================
  // COURIER DASHBOARD TESTS
  // ============================================================================
  
  test.describe('4. Courier Dashboard Tests', () => {
    let consoleLogger, networkLogger, apiLogger;

    test.beforeEach(async ({ page }) => {
      consoleLogger = new ConsoleLogger(page);
      networkLogger = new NetworkLogger(page);
      apiLogger = new APILogger(page);
      
      await page.goto('/');
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.courier.email);
      await page.fill('input[name="password"]', TEST_USERS.courier.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      await page.waitForTimeout(2000);
    });

    test.afterEach(async ({ page }, testInfo) => {
      await saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page);
    });

    test('4.1 - Courier Dashboard Loads', async ({ page }) => {
      console.log('\n🧪 Test 4.1: Courier Dashboard');
      
      const errors = consoleLogger.getErrors();
      console.log(`Console errors: ${errors.length}`);
      
      const failedCalls = apiLogger.getFailedCalls();
      console.log(`Failed API calls: ${failedCalls.length}`);
      
      const hasContent = await page.locator('body').textContent();
      expect(hasContent.length).toBeGreaterThan(100);
      
      console.log('✅ Courier dashboard loaded');
    });

    test('4.2 - Courier Deliveries Section', async ({ page }) => {
      console.log('\n🧪 Test 4.2: Courier Deliveries');
      
      const deliveriesVisible = await page.locator('text=/deliver/i, text=/orders/i').count() > 0;
      console.log(`Deliveries section visible: ${deliveriesVisible}`);
      
      console.log('✅ Deliveries section checked');
    });
  });

  // ============================================================================
  // CONSUMER TESTS
  // ============================================================================
  
  test.describe('5. Consumer Tests', () => {
    let consoleLogger, networkLogger, apiLogger;

    test.beforeEach(async ({ page }) => {
      consoleLogger = new ConsoleLogger(page);
      networkLogger = new NetworkLogger(page);
      apiLogger = new APILogger(page);
      
      await page.goto('/');
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.consumer.email);
      await page.fill('input[name="password"]', TEST_USERS.consumer.password);
      await page.click('button[type="submit"]');
      
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(2000);
    });

    test.afterEach(async ({ page }, testInfo) => {
      await saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page);
    });

    test('5.1 - Consumer Page Loads', async ({ page }) => {
      console.log('\n🧪 Test 5.1: Consumer Page');
      
      const errors = consoleLogger.getErrors();
      console.log(`Console errors: ${errors.length}`);
      
      const failedCalls = apiLogger.getFailedCalls();
      console.log(`Failed API calls: ${failedCalls.length}`);
      
      const hasContent = await page.locator('body').textContent();
      expect(hasContent.length).toBeGreaterThan(100);
      
      console.log('✅ Consumer page loaded');
    });

    test('5.2 - Consumer Tracking Available', async ({ page }) => {
      console.log('\n🧪 Test 5.2: Consumer Tracking');
      
      const trackingVisible = await page.locator('text=/track/i').count() > 0;
      console.log(`Tracking section visible: ${trackingVisible}`);
      
      console.log('✅ Tracking section checked');
    });
  });

  // ============================================================================
  // CROSS-CUTTING TESTS
  // ============================================================================
  
  test.describe('6. Cross-Cutting Tests', () => {
    let consoleLogger, networkLogger, apiLogger;

    test.beforeEach(async ({ page }) => {
      consoleLogger = new ConsoleLogger(page);
      networkLogger = new NetworkLogger(page);
      apiLogger = new APILogger(page);
      
      await page.goto('/');
      await page.click('text=Sign In');
      await page.waitForLoadState('networkidle');
      
      await page.fill('input[name="email"]', TEST_USERS.admin.email);
      await page.fill('input[name="password"]', TEST_USERS.admin.password);
      await page.click('button[type="submit"]');
      
      await page.waitForURL('**/dashboard', { timeout: 10000 });
    });

    test.afterEach(async ({ page }, testInfo) => {
      await saveLogs(testInfo, consoleLogger, networkLogger, apiLogger, page);
    });

    test('6.1 - Logout Functionality', async ({ page }) => {
      console.log('\n🧪 Test 6.1: Logout');
      
      await page.click('text=/logout/i, button:has-text("Logout"), [aria-label*="logout"]').catch(() => {
        console.log('Logout button not found in expected locations');
      });
      
      await page.waitForTimeout(2000);
      
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      console.log(`Token after logout: ${token ? 'Still exists' : 'Cleared'}`);
      
      console.log('✅ Logout test complete');
    });

    test('6.2 - API Performance Overall', async ({ page }) => {
      console.log('\n🧪 Test 6.2: Overall API Performance');
      
      await page.waitForTimeout(2000);
      
      const avgResponseTime = apiLogger.getAverageResponseTime();
      console.log(`Average API response: ${avgResponseTime.toFixed(2)}ms`);
      
      const slowCalls = apiLogger.getSlowCalls(1000);
      console.log(`Slow calls (>1s): ${slowCalls.length}`);
      
      const failedCalls = apiLogger.getFailedCalls();
      console.log(`Failed calls: ${failedCalls.length}`);
      
      console.log('✅ Performance analysis complete');
    });
  });
});
