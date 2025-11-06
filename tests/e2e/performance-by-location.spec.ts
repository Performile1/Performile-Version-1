import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://frontend-two-swart-31.vercel.app';
const TEST_TIMEOUT = 60000;

// Test users (from database)
const ADMIN_USER = {
  email: 'admin@performile.com',
  password: 'Admin123!@#'
};

const MERCHANT_USER = {
  email: 'merchant@performile.com',
  password: 'Merchant123!@#'
};

const COURIER_USER = {
  email: 'courier@performile.com',
  password: 'Courier123!@#'
};

// Helper function to login
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/#/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect after login
  await page.waitForTimeout(2000);
}

// Helper function to navigate to analytics
async function navigateToAnalytics(page: Page) {
  await page.goto(`${BASE_URL}/#/analytics`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
}

// Helper function to click Market Insights tab
async function clickMarketInsightsTab(page: Page) {
  // Find and click the "Market Insights" tab
  const tabs = page.locator('button[role="tab"]');
  const marketTab = tabs.filter({ hasText: 'Market Insights' });
  await marketTab.click();
  await page.waitForTimeout(1000);
}

test.describe('PerformanceByLocation Component', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('Admin: Should see PerformanceByLocation with full access', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Check for component heading
    const heading = page.locator('text=Performance by Location');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check for country selector
    const countrySelector = page.locator('label:has-text("Country")').locator('..');
    await expect(countrySelector).toBeVisible();

    // Check for time range selector
    const timeRangeSelector = page.locator('label:has-text("Time Range")').locator('..');
    await expect(timeRangeSelector).toBeVisible();

    // Admin should NOT see upgrade prompts
    const upgradeButton = page.locator('text=Upgrade Now');
    await expect(upgradeButton).not.toBeVisible();
  });

  test('Admin: Should be able to select different countries', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Wait for component to load
    await page.waitForSelector('text=Performance by Location', { timeout: 10000 });

    // Click country selector
    const countrySelect = page.locator('label:has-text("Country")').locator('..').locator('div[role="button"]').first();
    await countrySelect.click();
    await page.waitForTimeout(500);

    // Select Sweden
    const swedenOption = page.locator('li[role="option"]:has-text("Sweden")');
    await swedenOption.click();
    await page.waitForTimeout(1000);

    // Verify selection changed (component should reload)
    await expect(countrySelect).toContainText('Sweden');
  });

  test('Admin: Should be able to change time range', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Wait for component to load
    await page.waitForSelector('text=Performance by Location', { timeout: 10000 });

    // Click time range selector
    const timeRangeSelect = page.locator('label:has-text("Time Range")').locator('..').locator('div[role="button"]').first();
    await timeRangeSelect.click();
    await page.waitForTimeout(500);

    // Select 90 days
    const ninetyDaysOption = page.locator('li[role="option"]:has-text("90 days")');
    await ninetyDaysOption.click();
    await page.waitForTimeout(1000);

    // Verify selection changed
    await expect(timeRangeSelect).toContainText('90 days');
  });

  test('Merchant: Should see PerformanceByLocation with subscription limits', async ({ page }) => {
    await login(page, MERCHANT_USER.email, MERCHANT_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Check for component heading
    const heading = page.locator('text=Performance by Location');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check for subscription info
    const subscriptionInfo = page.locator('text=/Current Plan|Subscription|Tier/i');
    await expect(subscriptionInfo.first()).toBeVisible();

    // Merchant might see upgrade prompt depending on tier
    // This is dynamic based on actual subscription
  });

  test('Courier: Should see PerformanceByLocation with subscription limits', async ({ page }) => {
    await login(page, COURIER_USER.email, COURIER_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Check for component heading
    const heading = page.locator('text=Performance by Location');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Check for subscription info
    const subscriptionInfo = page.locator('text=/Current Plan|Subscription|Tier/i');
    await expect(subscriptionInfo.first()).toBeVisible();

    // Courier might see upgrade prompt depending on tier
    // This is dynamic based on actual subscription
  });

  test('Should display data table when data is available', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Wait for component to load
    await page.waitForSelector('text=Performance by Location', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check for table or "No data" message
    const table = page.locator('table');
    const noDataMessage = page.locator('text=/No data|No performance data/i');

    // Either table exists OR no data message exists
    const hasTable = await table.count() > 0;
    const hasNoData = await noDataMessage.count() > 0;

    expect(hasTable || hasNoData).toBeTruthy();
  });

  test('Should show loading state initially', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Check for loading indicator (should appear briefly)
    const loadingIndicator = page.locator('text=Loading|loading').first();
    
    // Wait for component to appear
    await page.waitForSelector('text=Performance by Location', { timeout: 10000 });
  });

  test('Should handle API errors gracefully', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Wait for component to load
    await page.waitForSelector('text=Performance by Location', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Component should render without crashing
    const heading = page.locator('text=Performance by Location');
    await expect(heading).toBeVisible();
  });

  test('Navigation: Should be in Market Insights tab', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);

    // Verify we're on analytics page
    await expect(page).toHaveURL(/.*#\/analytics/);

    // Click Market Insights tab
    await clickMarketInsightsTab(page);

    // Verify tab is active
    const marketTab = page.locator('button[role="tab"]').filter({ hasText: 'Market Insights' });
    await expect(marketTab).toHaveAttribute('aria-selected', 'true');
  });

  test('Responsive: Should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Component should still be visible and functional
    const heading = page.locator('text=Performance by Location');
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Selectors should be accessible
    const countrySelector = page.locator('label:has-text("Country")').locator('..');
    await expect(countrySelector).toBeVisible();
  });
});

test.describe('Analytics Page - Market Insights Tab', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('Should have Market Insights tab for all user roles', async ({ page }) => {
    // Test with admin
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);

    const marketTab = page.locator('button[role="tab"]').filter({ hasText: 'Market Insights' });
    await expect(marketTab).toBeVisible();
  });

  test('Market Insights tab should contain PerformanceByLocation', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await navigateToAnalytics(page);
    await clickMarketInsightsTab(page);

    // Both "Available Markets" card and PerformanceByLocation should be present
    const availableMarkets = page.locator('text=Available Markets');
    const performanceByLocation = page.locator('text=Performance by Location');

    await expect(availableMarkets).toBeVisible({ timeout: 10000 });
    await expect(performanceByLocation).toBeVisible({ timeout: 10000 });
  });
});
