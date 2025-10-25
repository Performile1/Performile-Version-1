/**
 * PLAYWRIGHT GLOBAL SETUP - AUTHENTICATION
 * 
 * Purpose: Create authenticated sessions for test users
 * Date: October 23, 2025, 10:55 AM
 * 
 * This creates reusable auth states so tests don't need to login every time
 * 
 * Usage in tests:
 * test.use({ storageState: 'tests/e2e/.auth/merchant.json' });
 */

import { test as setup, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'https://frontend-two-swart-31.vercel.app';

const merchantAuthFile = path.join(__dirname, '../.auth/merchant.json');
const courierAuthFile = path.join(__dirname, '../.auth/courier.json');

// Test credentials
const MERCHANT = {
  email: 'test-merchant@performile.com',
  password: 'TestPassword123!'
};

const COURIER = {
  email: 'test-courier@performile.com',
  password: 'TestPassword123!'
};

setup('authenticate as merchant', async ({ page }) => {
  console.log('🔐 Creating merchant auth session...');
  
  // Go to login page
  await page.goto(`${BASE_URL}/login`);
  
  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', MERCHANT.email);
  await page.fill('input[name="password"], input[type="password"]', MERCHANT.password);
  
  // Click login button
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
  
  // Wait for successful login (redirect to dashboard)
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  
  // Verify we're logged in
  const url = page.url();
  expect(url).toContain('dashboard');
  
  // Save authentication state
  await page.context().storageState({ path: merchantAuthFile });
  
  console.log('✅ Merchant auth session saved');
});

setup('authenticate as courier', async ({ page }) => {
  console.log('🔐 Creating courier auth session...');
  
  // Go to login page
  await page.goto(`${BASE_URL}/login`);
  
  // Fill login form
  await page.fill('input[name="email"], input[type="email"]', COURIER.email);
  await page.fill('input[name="password"], input[type="password"]', COURIER.password);
  
  // Click login button
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
  
  // Wait for successful login
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  
  // Verify we're logged in
  const url = page.url();
  expect(url).toContain('dashboard');
  
  // Save authentication state
  await page.context().storageState({ path: courierAuthFile });
  
  console.log('✅ Courier auth session saved');
});
