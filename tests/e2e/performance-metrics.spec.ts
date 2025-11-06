import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://frontend-two-swart-31.vercel.app';
const TEST_TIMEOUT = 60000;

// Test users
const ADMIN_USER = {
  email: 'admin@performile.com',
  password: 'Admin123!@#'
};

// Helper function to login
async function login(page: any, email: string, password: string) {
  await page.goto(`${BASE_URL}/#/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
}

test.describe('Performance Metrics', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('Analytics page should load within acceptable time', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);

    // Measure navigation time
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Analytics page load time: ${loadTime}ms`);
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Tab switching should be responsive', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Measure tab switch time
    const marketTab = page.locator('button[role="tab"]').filter({ hasText: 'Market Insights' });
    
    const startTime = Date.now();
    await marketTab.click();
    await page.waitForTimeout(500);
    const switchTime = Date.now() - startTime;

    console.log(`Tab switch time: ${switchTime}ms`);
    
    // Should switch within 500ms
    expect(switchTime).toBeLessThan(500);
  });

  test('Component interactions should be fast', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Click Market Insights tab
    const marketTab = page.locator('button[role="tab"]').filter({ hasText: 'Market Insights' });
    await marketTab.click();
    await page.waitForTimeout(1000);

    // Measure country selector interaction
    const countrySelect = page.locator('label:has-text("Country")').locator('..').locator('div[role="button"]').first();
    
    const startTime = Date.now();
    await countrySelect.click();
    await page.waitForSelector('li[role="option"]', { timeout: 2000 });
    const interactionTime = Date.now() - startTime;

    console.log(`Country selector interaction time: ${interactionTime}ms`);
    
    // Should open within 200ms
    expect(interactionTime).toBeLessThan(200);
  });

  test('Navigation menu should be responsive', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/dashboard`);
    await page.waitForLoadState('networkidle');

    // Measure navigation click time
    const analyticsLink = page.locator('text=Analytics').first();
    
    const startTime = Date.now();
    await analyticsLink.click();
    await page.waitForURL(/.*#\/analytics/);
    const navTime = Date.now() - startTime;

    console.log(`Navigation time: ${navTime}ms`);
    
    // Should navigate within 1 second
    expect(navTime).toBeLessThan(1000);
  });

  test('Page should have good Core Web Vitals', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    
    // Navigate to analytics
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    });

    console.log('Performance metrics:', performanceMetrics);

    // DOM should be interactive quickly
    expect(performanceMetrics.domInteractive).toBeLessThan(2000);
  });

  test('Large data tables should render efficiently', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Click Market Insights tab
    const marketTab = page.locator('button[role="tab"]').filter({ hasText: 'Market Insights' });
    await marketTab.click();
    await page.waitForTimeout(1000);

    // Wait for PerformanceByLocation component
    await page.waitForSelector('text=Performance by Location', { timeout: 10000 });

    // Measure table render time (if data exists)
    const startTime = Date.now();
    const table = page.locator('table').first();
    const hasTable = await table.count() > 0;
    
    if (hasTable) {
      await table.waitFor({ state: 'visible', timeout: 5000 });
      const renderTime = Date.now() - startTime;
      
      console.log(`Table render time: ${renderTime}ms`);
      
      // Should render within 1 second
      expect(renderTime).toBeLessThan(1000);
    } else {
      console.log('No data table to measure');
    }
  });

  test('Mobile viewport should be performant', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page, ADMIN_USER.email, ADMIN_USER.password);

    // Measure mobile navigation time
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Mobile load time: ${loadTime}ms`);
    
    // Mobile should load within 4 seconds (slightly slower is acceptable)
    expect(loadTime).toBeLessThan(4000);
  });

  test('Memory usage should be reasonable', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Get memory metrics
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (metrics) {
      console.log('Memory usage:', {
        used: `${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(metrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });

      // Used memory should be under 100MB
      expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024);
    }
  });
});

test.describe('Interaction Timing', () => {
  test.setTimeout(TEST_TIMEOUT);

  test('Click interactions should have minimal delay', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Measure multiple click interactions
    const tabs = page.locator('button[role="tab"]');
    const tabCount = await tabs.count();

    const clickTimes: number[] = [];

    for (let i = 0; i < Math.min(tabCount, 3); i++) {
      const startTime = Date.now();
      await tabs.nth(i).click();
      await page.waitForTimeout(300);
      const clickTime = Date.now() - startTime;
      clickTimes.push(clickTime);
    }

    const avgClickTime = clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length;
    console.log(`Average click time: ${avgClickTime.toFixed(2)}ms`);
    console.log(`Click times:`, clickTimes);

    // Average click time should be under 400ms
    expect(avgClickTime).toBeLessThan(400);
  });

  test('Input fields should respond quickly', async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await page.goto(`${BASE_URL}/#/analytics`);
    await page.waitForLoadState('networkidle');

    // Click Market Insights tab
    const marketTab = page.locator('button[role="tab"]').filter({ hasText: 'Market Insights' });
    await marketTab.click();
    await page.waitForTimeout(1000);

    // Find country selector
    const countrySelect = page.locator('label:has-text("Country")').locator('..').locator('div[role="button"]').first();

    // Measure input response time
    const startTime = Date.now();
    await countrySelect.click();
    await page.waitForSelector('li[role="option"]', { timeout: 2000 });
    await page.locator('li[role="option"]').first().click();
    const responseTime = Date.now() - startTime;

    console.log(`Input response time: ${responseTime}ms`);

    // Should respond within 500ms
    expect(responseTime).toBeLessThan(500);
  });
});
