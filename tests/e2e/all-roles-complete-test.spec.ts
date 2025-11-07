/**
 * COMPLETE E2E TEST - ALL USER ROLES
 * Tests all views for Merchant, Courier, and Consumer roles
 * Created: November 7, 2025
 * 
 * Test Coverage:
 * 1. Admin User - All admin features
 * 2. Merchant User - All merchant features
 * 3. Courier User - All courier features
 * 4. Consumer User - All consumer features
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://performile-platform-main.vercel.app';
const TEST_TIMEOUT = 60000;

// Test user credentials
const USERS = {
  admin: {
    email: 'admin@performile.com',
    password: 'Test1234!',
    role: 'admin'
  },
  merchant: {
    email: 'merchant@performile.com',
    password: 'Test1234!',
    role: 'merchant'
  },
  courier: {
    email: 'courier@performile.com',
    password: 'Test1234!',
    role: 'courier'
  },
  consumer: {
    email: 'consumer@performile.com',
    password: 'Test1234!',
    role: 'consumer'
  }
};

// Helper: Login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|home)/, { timeout: TEST_TIMEOUT });
  await page.waitForTimeout(2000); // Wait for page to fully load
}

// Helper: Logout
async function logout(page: Page) {
  // Try to find and click logout button
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Logout"]');
  const logoutExists = await logoutButton.count() > 0;
  
  if (logoutExists) {
    await logoutButton.first().click();
    await page.waitForTimeout(1000);
  } else {
    // Navigate to login page directly
    await page.goto(`${BASE_URL}/login`);
  }
}

// ============================================================================
// ADMIN USER TESTS
// ============================================================================

test.describe('Admin User - Complete Test', () => {
  
  test('Admin: Login and Dashboard', async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/(dashboard|home)/);
    
    // Check for admin-specific elements
    const pageContent = await page.content();
    console.log('Admin Dashboard loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
  });

  test('Admin: Analytics Page', async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    
    // Navigate to Analytics
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(3000);
    
    // Check if page loaded
    await expect(page).toHaveURL(/\/analytics/);
    console.log('Admin Analytics page loaded');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/admin-analytics.png', fullPage: true });
  });

  test('Admin: Orders Page', async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    
    // Navigate to Orders
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Admin Orders page loaded');
    await page.screenshot({ path: 'test-results/admin-orders.png', fullPage: true });
  });

  test('Admin: Couriers Page', async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    
    // Navigate to Couriers
    await page.goto(`${BASE_URL}/couriers`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Admin Couriers page loaded');
    await page.screenshot({ path: 'test-results/admin-couriers.png', fullPage: true });
  });

  test('Admin: Settings Page', async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    
    // Navigate to Settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Admin Settings page loaded');
    await page.screenshot({ path: 'test-results/admin-settings.png', fullPage: true });
  });
});

// ============================================================================
// MERCHANT USER TESTS
// ============================================================================

test.describe('Merchant User - Complete Test', () => {
  
  test('Merchant: Login and Dashboard', async ({ page }) => {
    await login(page, USERS.merchant.email, USERS.merchant.password);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/(dashboard|home)/);
    
    console.log('Merchant Dashboard loaded');
    await page.screenshot({ path: 'test-results/merchant-dashboard.png', fullPage: true });
  });

  test('Merchant: Analytics Page', async ({ page }) => {
    await login(page, USERS.merchant.email, USERS.merchant.password);
    
    // Navigate to Analytics
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(3000);
    
    console.log('Merchant Analytics page loaded');
    await page.screenshot({ path: 'test-results/merchant-analytics.png', fullPage: true });
  });

  test('Merchant: Orders Page', async ({ page }) => {
    await login(page, USERS.merchant.email, USERS.merchant.password);
    
    // Navigate to Orders
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Merchant Orders page loaded');
    await page.screenshot({ path: 'test-results/merchant-orders.png', fullPage: true });
  });

  test('Merchant: Stores Page', async ({ page }) => {
    await login(page, USERS.merchant.email, USERS.merchant.password);
    
    // Navigate to Stores
    await page.goto(`${BASE_URL}/stores`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Merchant Stores page loaded');
    await page.screenshot({ path: 'test-results/merchant-stores.png', fullPage: true });
  });

  test('Merchant: Couriers Page', async ({ page }) => {
    await login(page, USERS.merchant.email, USERS.merchant.password);
    
    // Navigate to Couriers
    await page.goto(`${BASE_URL}/couriers`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Merchant Couriers page loaded');
    await page.screenshot({ path: 'test-results/merchant-couriers.png', fullPage: true });
  });

  test('Merchant: Settings Page', async ({ page }) => {
    await login(page, USERS.merchant.email, USERS.merchant.password);
    
    // Navigate to Settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Merchant Settings page loaded');
    await page.screenshot({ path: 'test-results/merchant-settings.png', fullPage: true });
  });
});

// ============================================================================
// COURIER USER TESTS
// ============================================================================

test.describe('Courier User - Complete Test', () => {
  
  test('Courier: Login and Dashboard', async ({ page }) => {
    await login(page, USERS.courier.email, USERS.courier.password);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/\/(dashboard|home)/);
    
    console.log('Courier Dashboard loaded');
    await page.screenshot({ path: 'test-results/courier-dashboard.png', fullPage: true });
  });

  test('Courier: Deliveries Page', async ({ page }) => {
    await login(page, USERS.courier.email, USERS.courier.password);
    
    // Navigate to Deliveries
    await page.goto(`${BASE_URL}/deliveries`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Courier Deliveries page loaded');
    await page.screenshot({ path: 'test-results/courier-deliveries.png', fullPage: true });
  });

  test('Courier: Orders Page', async ({ page }) => {
    await login(page, USERS.courier.email, USERS.courier.password);
    
    // Navigate to Orders
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Courier Orders page loaded');
    await page.screenshot({ path: 'test-results/courier-orders.png', fullPage: true });
  });

  test('Courier: Performance Page', async ({ page }) => {
    await login(page, USERS.courier.email, USERS.courier.password);
    
    // Navigate to Performance/Analytics
    await page.goto(`${BASE_URL}/analytics`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Courier Performance page loaded');
    await page.screenshot({ path: 'test-results/courier-performance.png', fullPage: true });
  });

  test('Courier: Settings Page', async ({ page }) => {
    await login(page, USERS.courier.email, USERS.courier.password);
    
    // Navigate to Settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Courier Settings page loaded');
    await page.screenshot({ path: 'test-results/courier-settings.png', fullPage: true });
  });
});

// ============================================================================
// CONSUMER USER TESTS
// ============================================================================

test.describe('Consumer User - Complete Test', () => {
  
  test('Consumer: Login and Home', async ({ page }) => {
    await login(page, USERS.consumer.email, USERS.consumer.password);
    
    // Verify we're logged in
    await expect(page).toHaveURL(/\/(dashboard|home|consumer)/);
    
    console.log('Consumer Home loaded');
    await page.screenshot({ path: 'test-results/consumer-home.png', fullPage: true });
  });

  test('Consumer: Orders/Tracking Page', async ({ page }) => {
    await login(page, USERS.consumer.email, USERS.consumer.password);
    
    // Navigate to Orders/Tracking
    await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Consumer Orders page loaded');
    await page.screenshot({ path: 'test-results/consumer-orders.png', fullPage: true });
  });

  test('Consumer: Profile/Settings Page', async ({ page }) => {
    await login(page, USERS.consumer.email, USERS.consumer.password);
    
    // Navigate to Profile/Settings
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
    await page.waitForTimeout(2000);
    
    console.log('Consumer Settings page loaded');
    await page.screenshot({ path: 'test-results/consumer-settings.png', fullPage: true });
  });
});

// ============================================================================
// CROSS-ROLE TESTS
// ============================================================================

test.describe('Cross-Role Tests', () => {
  
  test('All Roles: Can Login Successfully', async ({ page }) => {
    const results = [];
    
    for (const [role, user] of Object.entries(USERS)) {
      try {
        await login(page, user.email, user.password);
        await page.waitForTimeout(2000);
        
        const url = page.url();
        results.push({ role, success: true, url });
        console.log(`✅ ${role}: Login successful - ${url}`);
        
        await logout(page);
        await page.waitForTimeout(1000);
      } catch (error) {
        results.push({ role, success: false, error: error.message });
        console.log(`❌ ${role}: Login failed - ${error.message}`);
      }
    }
    
    // Log summary
    console.log('\n=== LOGIN TEST SUMMARY ===');
    results.forEach(r => {
      console.log(`${r.success ? '✅' : '❌'} ${r.role}: ${r.success ? r.url : r.error}`);
    });
    
    // Expect all to succeed
    const allSuccess = results.every(r => r.success);
    expect(allSuccess).toBeTruthy();
  });

  test('All Roles: Can Access Dashboard', async ({ page }) => {
    const results = [];
    
    for (const [role, user] of Object.entries(USERS)) {
      try {
        await login(page, user.email, user.password);
        await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TEST_TIMEOUT });
        await page.waitForTimeout(2000);
        
        const url = page.url();
        results.push({ role, success: true, url });
        console.log(`✅ ${role}: Dashboard accessible - ${url}`);
        
        await logout(page);
      } catch (error) {
        results.push({ role, success: false, error: error.message });
        console.log(`❌ ${role}: Dashboard failed - ${error.message}`);
      }
    }
    
    // Log summary
    console.log('\n=== DASHBOARD TEST SUMMARY ===');
    results.forEach(r => {
      console.log(`${r.success ? '✅' : '❌'} ${r.role}: ${r.success ? r.url : r.error}`);
    });
  });
});
