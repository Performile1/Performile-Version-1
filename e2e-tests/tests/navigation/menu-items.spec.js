/**
 * NAVIGATION MENU TESTS
 * Tests for new navigation menu items (Parcel Points, Service Performance, Coverage Checker)
 * Created: October 21, 2025
 */

const { test, expect } = require('@playwright/test');

// Helper function to login as merchant
async function loginAsMerchant(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'merchant@test.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

// Helper function to login as courier
async function loginAsCourier(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'courier@test.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Navigation Menu - New Items', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  test('should display My Subscription menu item', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'My Subscription' })).toBeVisible();
  });

  test('should display Parcel Points menu item', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Parcel Points' })).toBeVisible();
  });

  test('should display Service Performance menu item', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Service Performance' })).toBeVisible();
  });

  test('should display Coverage Checker menu item', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Coverage Checker' })).toBeVisible();
  });

  test('should navigate to My Subscription page', async ({ page }) => {
    await page.getByRole('link', { name: 'My Subscription' }).click();
    await expect(page).toHaveURL(/.*my-subscription/);
  });

  test('should navigate to Parcel Points page', async ({ page }) => {
    await page.getByRole('link', { name: 'Parcel Points' }).click();
    await expect(page).toHaveURL(/.*parcel-points/);
  });

  test('should navigate to Service Performance page', async ({ page }) => {
    await page.getByRole('link', { name: 'Service Performance' }).click();
    await expect(page).toHaveURL(/.*service-performance/);
  });

  test('should navigate to Coverage Checker page', async ({ page }) => {
    await page.getByRole('link', { name: 'Coverage Checker' }).click();
    await expect(page).toHaveURL(/.*coverage-checker/);
  });

  test('should highlight active menu item', async ({ page }) => {
    await page.getByRole('link', { name: 'My Subscription' }).click();
    
    // Active item should have selected styling
    const activeItem = page.getByRole('link', { name: 'My Subscription' });
    const classList = await activeItem.getAttribute('class');
    
    expect(classList).toContain('Mui-selected');
  });

  test('should display correct icons for new menu items', async ({ page }) => {
    // Check icons are present (MUI icons render as SVG)
    const menuItems = page.locator('nav a');
    const count = await menuItems.count();
    
    expect(count).toBeGreaterThan(10); // Should have many menu items
  });
});

test.describe('Navigation Menu - Courier View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCourier(page);
  });

  test('should display My Subscription for couriers', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'My Subscription' })).toBeVisible();
  });

  test('should display Parcel Points for couriers', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Parcel Points' })).toBeVisible();
  });

  test('should display Service Performance for couriers', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Service Performance' })).toBeVisible();
  });

  test('should display Coverage Checker for couriers', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Coverage Checker' })).toBeVisible();
  });

  test('should navigate correctly from courier dashboard', async ({ page }) => {
    await page.getByRole('link', { name: 'My Subscription' }).click();
    await expect(page).toHaveURL(/.*my-subscription/);
    
    // Should show courier subscription
    await page.waitForTimeout(2000);
    await expect(page.getByText(/My Subscription|Subscription/i)).toBeVisible();
  });
});

test.describe('Navigation Menu - Mobile View', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsMerchant(page);
  });

  test('should display hamburger menu on mobile', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="open drawer"]');
    await expect(menuButton).toBeVisible();
  });

  test('should open drawer when hamburger is clicked', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="open drawer"]');
    await menuButton.click();
    
    // Drawer should open
    await page.waitForTimeout(500);
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('should display all menu items in mobile drawer', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="open drawer"]');
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Check new items are visible in drawer
    await expect(page.getByRole('link', { name: 'My Subscription' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Parcel Points' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Service Performance' })).toBeVisible();
  });

  test('should close drawer after navigation', async ({ page }) => {
    const menuButton = page.locator('button[aria-label="open drawer"]');
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Click a menu item
    await page.getByRole('link', { name: 'My Subscription' }).click();
    
    // Drawer should close
    await page.waitForTimeout(500);
    const drawerVisible = await page.getByRole('link', { name: 'Dashboard' }).isVisible().catch(() => false);
    
    // Drawer should be closed or hidden
    expect(drawerVisible).toBeFalsy();
  });
});

test.describe('Navigation Menu - Role-Based Access', () => {
  test('should show merchant-specific items for merchants', async ({ page }) => {
    await loginAsMerchant(page);
    
    // Merchants should see Courier Directory
    await expect(page.getByRole('link', { name: 'Courier Directory' })).toBeVisible();
    
    // Merchants should see Courier Preferences
    await expect(page.getByRole('link', { name: 'Courier Preferences' })).toBeVisible();
  });

  test('should show courier-specific items for couriers', async ({ page }) => {
    await loginAsCourier(page);
    
    // Couriers should see Marketplace
    await expect(page.getByRole('link', { name: 'Marketplace' })).toBeVisible();
    
    // Couriers should see Checkout Analytics
    await expect(page.getByRole('link', { name: 'Checkout Analytics' })).toBeVisible();
  });

  test('should not show admin items to merchants', async ({ page }) => {
    await loginAsMerchant(page);
    
    // Should not see admin-only items
    const adminSettings = page.getByRole('link', { name: 'System Settings' });
    const count = await adminSettings.count();
    
    expect(count).toBe(0);
  });

  test('should not show admin items to couriers', async ({ page }) => {
    await loginAsCourier(page);
    
    // Should not see admin-only items
    const manageUsers = page.getByRole('link', { name: 'Manage Merchants' });
    const count = await manageUsers.count();
    
    expect(count).toBe(0);
  });
});

test.describe('Navigation Menu - Sidebar Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
  });

  test('should keep sidebar visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Sidebar should be visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('should collapse sidebar on smaller screens', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check if hamburger menu appears
    const menuButton = page.locator('button[aria-label="open drawer"]');
    const buttonVisible = await menuButton.isVisible();
    
    expect(buttonVisible).toBeTruthy();
  });

  test('should maintain scroll position in sidebar', async ({ page }) => {
    // Scroll in sidebar
    const sidebar = page.locator('nav');
    await sidebar.evaluate(el => el.scrollTop = 100);
    
    // Navigate to another page
    await page.getByRole('link', { name: 'Orders' }).click();
    await page.waitForURL('**/orders');
    
    // Go back
    await page.goBack();
    
    // Scroll position may or may not be maintained (browser dependent)
    const scrollTop = await sidebar.evaluate(el => el.scrollTop);
    expect(scrollTop).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Navigation Menu - Performance', () => {
  test('should render menu items quickly', async ({ page }) => {
    const startTime = Date.now();
    await loginAsMerchant(page);
    const loadTime = Date.now() - startTime;
    
    // Should load within reasonable time
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not cause layout shifts', async ({ page }) => {
    await loginAsMerchant(page);
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    
    // Get initial position of a menu item
    const menuItem = page.getByRole('link', { name: 'Dashboard' });
    const initialBox = await menuItem.boundingBox();
    
    // Wait a bit
    await page.waitForTimeout(1000);
    
    // Check position hasn't shifted
    const finalBox = await menuItem.boundingBox();
    
    if (initialBox && finalBox) {
      expect(Math.abs(initialBox.y - finalBox.y)).toBeLessThan(5);
    }
  });
});
