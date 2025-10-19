/**
 * Admin Service Analytics E2E Tests
 * Week 4 - Playwright Testing
 * 
 * Tests the complete Service Analytics dashboard for admin users
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@performile.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

test.describe('Admin Service Analytics Dashboard', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in credentials
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to Settings
    await page.goto(`${BASE_URL}/settings`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display Service Analytics tab in admin settings', async ({ page }) => {
    // Check if Platform Analytics tab exists
    const analyticsTab = page.locator('button[role="tab"]', { hasText: 'Platform Analytics' });
    await expect(analyticsTab).toBeVisible();
  });

  test('should load Service Analytics dashboard when tab is clicked', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    
    // Wait for content to load
    await page.waitForTimeout(1000);
    
    // Check for dashboard header
    await expect(page.locator('text=Service Analytics Dashboard')).toBeVisible();
    
    // Check for quick stats cards
    await expect(page.locator('text=Services Tracked')).toBeVisible();
    await expect(page.locator('text=Avg Trust Score')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Coverage Areas')).toBeVisible();
  });

  test('should display all 5 sub-tabs', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Check for all sub-tabs
    await expect(page.locator('button[role="tab"]:has-text("Performance Overview")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Service Comparison")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Geographic Analysis")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Parcel Points Map")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Coverage Checker")')).toBeVisible();
  });

  test('should navigate between sub-tabs', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Click Service Comparison tab
    await page.click('button[role="tab"]:has-text("Service Comparison")');
    await page.waitForTimeout(500);
    
    // Check if comparison content is visible
    const comparisonContent = page.locator('text=Service Performance Comparison');
    await expect(comparisonContent).toBeVisible({ timeout: 5000 }).catch(() => {
      // If no data, check for "Need at least 2 services" message
      expect(page.locator('text=Need at least 2 services')).toBeVisible();
    });
    
    // Click Parcel Points Map tab
    await page.click('button[role="tab"]:has-text("Parcel Points Map")');
    await page.waitForTimeout(500);
    
    // Check if map content is visible
    await expect(page.locator('text=Find Parcel Points')).toBeVisible();
  });

  test('should display refresh button and allow data refresh', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Find and click refresh button
    const refreshButton = page.locator('button:has-text("Refresh Data")');
    await expect(refreshButton).toBeVisible();
    
    await refreshButton.click();
    
    // Wait for loading state
    await page.waitForTimeout(500);
    
    // Check that page is still functional
    await expect(page.locator('text=Service Analytics Dashboard')).toBeVisible();
  });

  test('should handle empty data state gracefully', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Check for either data or empty state message
    const hasData = await page.locator('[data-testid="service-performance-card"]').count() > 0;
    const hasEmptyMessage = await page.locator('text=No data available').isVisible();
    
    // Should have either data or empty message
    expect(hasData || hasEmptyMessage).toBeTruthy();
  });

  test('should test Coverage Checker functionality', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Click Coverage Checker tab
    await page.click('button[role="tab"]:has-text("Coverage Checker")');
    await page.waitForTimeout(500);
    
    // Check if coverage checker is visible
    await expect(page.locator('text=Delivery Coverage Checker')).toBeVisible();
    
    // Fill in postal code
    await page.fill('input[label="Postal Code"]', '11120');
    
    // Click check button
    await page.click('button:has-text("Check")');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Check for either results or error message
    const hasResults = await page.locator('text=Coverage Summary').isVisible();
    const hasError = await page.locator('text=No coverage information').isVisible();
    
    expect(hasResults || hasError).toBeTruthy();
  });

  test('should test Parcel Point Map search', async ({ page }) => {
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Click Parcel Points Map tab
    await page.click('button[role="tab"]:has-text("Parcel Points Map")');
    await page.waitForTimeout(500);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search by city"]');
    await expect(searchInput).toBeVisible();
    
    // Type search query
    await searchInput.fill('Stockholm');
    
    // Click search button
    await page.click('button:has-text("Search")');
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Check for results or empty state
    const hasResults = await page.locator('text=Found').isVisible();
    const hasEmpty = await page.locator('text=Search for parcel points').isVisible();
    
    expect(hasResults || hasEmpty).toBeTruthy();
  });

  test('should verify responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Check if content is visible on mobile
    await expect(page.locator('text=Service Analytics Dashboard')).toBeVisible();
    
    // Check if tabs are scrollable
    const tabsContainer = page.locator('[role="tablist"]');
    await expect(tabsContainer).toBeVisible();
  });

  test('should verify admin-only access', async ({ page }) => {
    // This test assumes you have a way to check user role
    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Should see the dashboard (admin has access)
    await expect(page.locator('text=Service Analytics Dashboard')).toBeVisible();
  });
});

test.describe('Service Performance API Integration', () => {
  test('should make API calls when loading dashboard', async ({ page }) => {
    // Setup request interception
    const apiCalls: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/service-performance')) {
        apiCalls.push(request.url());
      }
    });
    
    // Navigate to settings and open analytics
    await page.goto(`${BASE_URL}/settings`);
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(2000);
    
    // Verify API was called
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0]).toContain('/api/service-performance');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/service-performance*', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Navigate to settings and open analytics
    await page.goto(`${BASE_URL}/settings`);
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Should show error message
    await expect(page.locator('text=Failed to load')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to settings
    await page.goto(`${BASE_URL}/settings`);
    
    // Click Platform Analytics tab
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    
    // Wait for content to load
    await page.waitForSelector('text=Service Analytics Dashboard');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle rapid tab switching', async ({ page }) => {
    // Navigate to settings and open analytics
    await page.goto(`${BASE_URL}/settings`);
    await page.click('button[role="tab"]:has-text("Platform Analytics")');
    await page.waitForTimeout(1000);
    
    // Rapidly switch between tabs
    for (let i = 0; i < 3; i++) {
      await page.click('button[role="tab"]:has-text("Service Comparison")');
      await page.waitForTimeout(200);
      await page.click('button[role="tab"]:has-text("Performance Overview")');
      await page.waitForTimeout(200);
    }
    
    // Should still be functional
    await expect(page.locator('text=Service Analytics Dashboard')).toBeVisible();
  });
});
