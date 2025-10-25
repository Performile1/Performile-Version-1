/**
 * PLAYWRIGHT TEST USER SETUP
 * 
 * Purpose: Create test users via signup flow (tests auth system)
 * Date: October 23, 2025, 10:55 AM
 * 
 * This script:
 * 1. Creates test-merchant@performile.com
 * 2. Creates test-courier@performile.com
 * 3. Verifies they can login
 * 
 * Run: npx playwright test setup/create-test-users.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://frontend-two-swart-31.vercel.app';

// Test user credentials
const TEST_USERS = {
  merchant: {
    email: 'test-merchant@performile.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Merchant',
    phone: '+1234567800',
    role: 'merchant'
  },
  courier: {
    email: 'test-courier@performile.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Courier',
    phone: '+1234567801',
    role: 'courier'
  }
};

test.describe('Setup: Create Test Users', () => {
  
  test('should create merchant test user', async ({ page }) => {
    console.log('🏪 Creating merchant test user...');
    
    // Navigate to signup page
    await page.goto(`${BASE_URL}/signup`);
    
    // Fill signup form
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.merchant.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.merchant.password);
    await page.fill('input[name="firstName"], input[placeholder*="First"]', TEST_USERS.merchant.firstName);
    await page.fill('input[name="lastName"], input[placeholder*="Last"]', TEST_USERS.merchant.lastName);
    await page.fill('input[name="phone"], input[type="tel"]', TEST_USERS.merchant.phone);
    
    // Select merchant role (if role selector exists)
    const roleSelector = page.locator('select[name="role"], [data-testid="role-select"]');
    if (await roleSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleSelector.selectOption(TEST_USERS.merchant.role);
    }
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
    
    // Wait for success (redirect to dashboard or success message)
    await page.waitForURL(/dashboard|login|success/, { timeout: 10000 }).catch(async () => {
      // If no redirect, check for success message
      const successMessage = page.locator('text=/success|created|welcome/i');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });
    
    console.log('✅ Merchant user created successfully');
  });

  test('should create courier test user', async ({ page }) => {
    console.log('🚚 Creating courier test user...');
    
    // Navigate to signup page
    await page.goto(`${BASE_URL}/signup`);
    
    // Fill signup form
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.courier.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.courier.password);
    await page.fill('input[name="firstName"], input[placeholder*="First"]', TEST_USERS.courier.firstName);
    await page.fill('input[name="lastName"], input[placeholder*="Last"]', TEST_USERS.courier.lastName);
    await page.fill('input[name="phone"], input[type="tel"]', TEST_USERS.courier.phone);
    
    // Select courier role (if role selector exists)
    const roleSelector = page.locator('select[name="role"], [data-testid="role-select"]');
    if (await roleSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleSelector.selectOption(TEST_USERS.courier.role);
    }
    
    // Submit form
    await page.click('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
    
    // Wait for success
    await page.waitForURL(/dashboard|login|success/, { timeout: 10000 }).catch(async () => {
      const successMessage = page.locator('text=/success|created|welcome/i');
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });
    
    console.log('✅ Courier user created successfully');
  });

  test('should verify merchant can login', async ({ page }) => {
    console.log('🔐 Verifying merchant login...');
    
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.merchant.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.merchant.password);
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Verify we're logged in
    const dashboardElement = page.locator('[data-testid="dashboard"], h1:has-text("Dashboard"), text=/dashboard/i');
    await expect(dashboardElement.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Merchant login verified');
  });

  test('should verify courier can login', async ({ page }) => {
    console.log('🔐 Verifying courier login...');
    
    await page.goto(`${BASE_URL}/login`);
    
    // Fill login form
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.courier.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.courier.password);
    
    // Submit
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    
    // Wait for dashboard
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // Verify we're logged in
    const dashboardElement = page.locator('[data-testid="dashboard"], h1:has-text("Dashboard"), text=/dashboard/i');
    await expect(dashboardElement.first()).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Courier login verified');
  });

});

test.describe('Setup: Verify Test Users Exist', () => {
  
  test('should confirm merchant user exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.merchant.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.merchant.password);
    await page.click('button[type="submit"]');
    
    // Should successfully login (no error message)
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('dashboard');
    
    console.log('✅ Merchant user exists and can login');
  });

  test('should confirm courier user exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"], input[type="email"]', TEST_USERS.courier.email);
    await page.fill('input[name="password"], input[type="password"]', TEST_USERS.courier.password);
    await page.click('button[type="submit"]');
    
    // Should successfully login
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('dashboard');
    
    console.log('✅ Courier user exists and can login');
  });

});

// Export test users for use in other tests
export { TEST_USERS };
