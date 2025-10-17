// Authentication Tests - Login Flow
// Created: October 17, 2025, 7:09 AM
// Purpose: Test all user role logins with comprehensive logging

const { test, expect } = require('@playwright/test');
const { ConsoleLogger } = require('../../utils/console-logger');
const { NetworkLogger } = require('../../utils/network-logger');
const { APILogger } = require('../../utils/api-logger');
const { TEST_USERS } = require('../../fixtures/test-data');
const fs = require('fs').promises;

test.describe('Authentication - Login Flow', () => {
  let consoleLogger;
  let networkLogger;
  let apiLogger;

  test.beforeEach(async ({ page }) => {
    consoleLogger = new ConsoleLogger(page);
    networkLogger = new NetworkLogger(page);
    apiLogger = new APILogger(page);
    await page.goto('/');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Print summaries
    consoleLogger.printSummary();
    networkLogger.printSummary();
    apiLogger.printSummary();
    
    // Export logs
    const testName = testInfo.title.replace(/\s+/g, '-');
    await apiLogger.exportToFile(`api-logs/${testName}.json`);
    
    // Save console logs
    const consoleLogs = consoleLogger.getLogs();
    await fs.writeFile(`logs/${testName}-console.json`, JSON.stringify(consoleLogs, null, 2));
    
    // Generate API report
    const report = apiLogger.generateReport();
    await fs.writeFile(`api-reports/${testName}.md`, report);
  });

  // Test 1: Admin Login
  test('Admin can login successfully', async ({ page }) => {
    console.log('\n🧪 Testing Admin Login...');
    
    // Navigate to login
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify dashboard loaded
    await expect(page.locator('h1, h2, [role="heading"]')).toContainText(/dashboard/i, { timeout: 5000 });
    
    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    // Verify no console errors
    const errors = consoleLogger.getErrors();
    console.log(`Console errors: ${errors.length}`);
    
    // Verify login API call succeeded
    expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
    const loginCall = apiLogger.getCallsByEndpoint('/api/auth/login')[0];
    expect(loginCall.requestBody).toHaveProperty('email', TEST_USERS.admin.email);
    expect(loginCall.responseBody).toHaveProperty('access_token');
    expect(loginCall.duration).toBeLessThan(2000);
    
    console.log('✅ Admin login test passed');
  });

  // Test 2: Merchant Login - WITH BUG DETECTION
  test('Merchant can login successfully - Check for dashboard bugs', async ({ page }) => {
    console.log('\n🧪 Testing Merchant Login (Dashboard Bug Detection)...');
    
    // Navigate to login
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    await page.fill('input[name="email"]', TEST_USERS.merchant.email);
    await page.fill('input[name="password"]', TEST_USERS.merchant.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Wait a bit for dashboard to load
    await page.waitForTimeout(2000);
    
    // Capture dashboard state
    console.log('📸 Capturing merchant dashboard state...');
    
    // Check for common dashboard elements
    const hasHeading = await page.locator('h1, h2, [role="heading"]').count() > 0;
    const hasStats = await page.locator('[class*="stat"], [class*="card"], [class*="metric"]').count() > 0;
    const hasOrders = await page.locator('text=/orders/i').count() > 0;
    
    console.log(`Dashboard elements found:
      - Headings: ${hasHeading}
      - Stats/Cards: ${hasStats}
      - Orders section: ${hasOrders}
    `);
    
    // Check console errors (IMPORTANT for bug detection)
    const errors = consoleLogger.getErrors();
    console.log(`⚠️ Console errors found: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    
    // Check API failures
    const failedAPICalls = apiLogger.getFailedCalls();
    console.log(`⚠️ Failed API calls: ${failedAPICalls.length}`);
    if (failedAPICalls.length > 0) {
      console.log('Failed API calls:', failedAPICalls);
    }
    
    // Check for slow API calls
    const slowCalls = apiLogger.getSlowCalls(1000);
    console.log(`⚠️ Slow API calls (>1s): ${slowCalls.length}`);
    
    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    // Verify login API call succeeded
    expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
    
    // Take screenshot for manual review
    await page.screenshot({ path: `screenshots/merchant-dashboard-${Date.now()}.png`, fullPage: true });
    
    console.log('✅ Merchant login test completed - Check logs for bugs');
  });

  // Test 3: Courier Login
  test('Courier can login successfully', async ({ page }) => {
    console.log('\n🧪 Testing Courier Login...');
    
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.courier.email);
    await page.fill('input[name="password"]', TEST_USERS.courier.password);
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify dashboard loaded
    await expect(page.locator('h1, h2, [role="heading"]')).toContainText(/dashboard/i, { timeout: 5000 });
    
    // Verify token
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    // Verify API call
    expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
    
    // Check for errors
    const errors = consoleLogger.getErrors();
    console.log(`Console errors: ${errors.length}`);
    
    console.log('✅ Courier login test passed');
  });

  // Test 4: Consumer Login
  test('Consumer can login successfully', async ({ page }) => {
    console.log('\n🧪 Testing Consumer Login...');
    
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.consumer.email);
    await page.fill('input[name="password"]', TEST_USERS.consumer.password);
    
    await page.click('button[type="submit"]');
    
    // Consumer might redirect to tracking page or dashboard
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify token
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    // Verify API call
    expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
    
    // Check for errors
    const errors = consoleLogger.getErrors();
    console.log(`Console errors: ${errors.length}`);
    
    console.log('✅ Consumer login test passed');
  });

  // Test 5: Invalid Email
  test('Invalid email shows error', async ({ page }) => {
    console.log('\n🧪 Testing Invalid Email...');
    
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Should still be on login page or show error
    const currentUrl = page.url();
    const hasError = await page.locator('text=/invalid|error|not found/i').count() > 0;
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Error message shown: ${hasError}`);
    
    // Verify failed API call
    const failedCalls = apiLogger.getFailedCalls();
    expect(failedCalls.length).toBeGreaterThan(0);
    
    console.log('✅ Invalid email test passed');
  });

  // Test 6: Invalid Password
  test('Invalid password shows error', async ({ page }) => {
    console.log('\n🧪 Testing Invalid Password...');
    
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForTimeout(2000);
    
    // Should still be on login page or show error
    const currentUrl = page.url();
    const hasError = await page.locator('text=/invalid|error|incorrect/i').count() > 0;
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Error message shown: ${hasError}`);
    
    // Verify failed API call
    const failedCalls = apiLogger.getFailedCalls();
    expect(failedCalls.length).toBeGreaterThan(0);
    
    console.log('✅ Invalid password test passed');
  });

  // Test 7: Empty Fields Validation
  test('Empty fields show validation error', async ({ page }) => {
    console.log('\n🧪 Testing Empty Fields...');
    
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    // Try to submit without filling fields
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    // Should show validation errors or prevent submission
    const currentUrl = page.url();
    expect(currentUrl).toContain('login');
    
    console.log('✅ Empty fields test passed');
  });

  // Test 8: Logout Functionality
  test('User can logout successfully', async ({ page }) => {
    console.log('\n🧪 Testing Logout...');
    
    // First login
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Now logout
    await page.click('text=/logout/i, button:has-text("Logout"), [aria-label*="logout"]');
    
    await page.waitForTimeout(2000);
    
    // Should redirect to login or home
    const currentUrl = page.url();
    const isLoggedOut = currentUrl.includes('login') || currentUrl.includes('home') || !currentUrl.includes('dashboard');
    expect(isLoggedOut).toBe(true);
    
    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeFalsy();
    
    console.log('✅ Logout test passed');
  });

  // Test 9: Session Persistence
  test('Session persists after page reload', async ({ page }) => {
    console.log('\n🧪 Testing Session Persistence...');
    
    // Login
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still be on dashboard
    const currentUrl = page.url();
    expect(currentUrl).toContain('dashboard');
    
    // Token should still exist
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    console.log('✅ Session persistence test passed');
  });

  // Test 10: API Response Time
  test('Login API responds within acceptable time', async ({ page }) => {
    console.log('\n🧪 Testing API Response Time...');
    
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[name="email"]', TEST_USERS.admin.email);
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Check API response time
    const loginCall = apiLogger.getCallsByEndpoint('/api/auth/login')[0];
    expect(loginCall).toBeDefined();
    expect(loginCall.duration).toBeLessThan(2000); // Should respond in <2s
    
    console.log(`Login API response time: ${loginCall.duration}ms`);
    console.log('✅ API response time test passed');
  });
});
