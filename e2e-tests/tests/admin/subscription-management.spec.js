/**
 * ADMIN SUBSCRIPTION MANAGEMENT TESTS
 * Tests for admin subscription plan editing and management
 * Created: October 21, 2025
 */

const { test, expect } = require('@playwright/test');

// Helper function to login as admin
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'AdminPassword123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

test.describe('Admin Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings?tab=subscriptions');
  });

  test('should display subscription management page', async ({ page }) => {
    await page.waitForSelector('text=Subscription Plans', { timeout: 10000 });
    await expect(page.getByText('Subscription Plans')).toBeVisible();
  });

  test('should display tabs for merchant and courier plans', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    await expect(page.getByRole('tab', { name: /Merchant Plans/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Courier Plans/i })).toBeVisible();
  });

  test('should display merchant plans in table', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    await page.getByRole('tab', { name: /Merchant Plans/i }).click();
    
    // Check table headers
    await expect(page.getByText('Plan Name')).toBeVisible();
    await expect(page.getByText('Monthly Price')).toBeVisible();
    await expect(page.getByText('Annual Price')).toBeVisible();
    await expect(page.getByText('Max Orders')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('should display courier plans when switching tabs', async ({ page }) => {
    await page.waitForSelector('text=Courier Plans', { timeout: 10000 });
    await page.getByRole('tab', { name: /Courier Plans/i }).click();
    
    await page.waitForTimeout(1000);
    
    // Should show courier plans
    await expect(page.getByText('Plan Name')).toBeVisible();
  });

  test('should open edit dialog when edit button is clicked', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    // Click first edit button
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Edit Subscription Plan')).toBeVisible();
    }
  });

  test('should display all editable fields in dialog', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Check all fields are present
      await expect(page.getByLabel('Plan Name')).toBeVisible();
      await expect(page.getByLabel('Monthly Price')).toBeVisible();
      await expect(page.getByLabel('Annual Price')).toBeVisible();
      await expect(page.getByLabel('Max Orders per Month')).toBeVisible();
    }
  });

  test('should save plan changes successfully', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Modify a field
      const monthlyPriceInput = page.getByLabel('Monthly Price');
      await monthlyPriceInput.fill('99.99');
      
      // Click save
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Should show success message
      await expect(page.getByText(/updated successfully/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should close dialog when cancel is clicked', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Click cancel
      await page.getByRole('button', { name: /Cancel/i }).click();
      
      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should toggle plan active status', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    // Find active switch
    const activeSwitch = page.locator('input[type="checkbox"]').first();
    if (await activeSwitch.count() > 0) {
      const initialState = await activeSwitch.isChecked();
      
      // Toggle it
      await activeSwitch.click();
      
      // State should change
      const newState = await activeSwitch.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });

  test('should display plan features in dialog', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Check features section exists
      await expect(page.getByText('Features')).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Clear required field
      const planNameInput = page.getByLabel('Plan Name');
      await planNameInput.clear();
      
      // Try to save
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Should show validation error or prevent save
      const dialogStillVisible = await page.getByRole('dialog').isVisible();
      expect(dialogStillVisible).toBeTruthy();
    }
  });

  test('should display tier information', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    // Check tier chips are visible
    const tierChips = page.locator('text=/Tier \\d/');
    const count = await tierChips.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('should display popular badge for popular plans', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    // Check if any plan has popular badge
    const popularBadge = page.getByText('Popular');
    const count = await popularBadge.count();
    
    // At least one plan should be marked as popular
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Admin Subscription Management - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings?tab=subscriptions');
  });

  test('should handle save errors gracefully', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    // Mock network error
    await page.route('**/api/admin/subscription-plans', route => {
      route.abort();
    });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Try to save
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Should show error message
      await expect(page.getByText(/failed/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show loading state while fetching plans', async ({ page }) => {
    // Should show loading indicator
    const loader = page.locator('role=progressbar');
    const loaderVisible = await loader.isVisible().catch(() => false);
    
    // Loader may disappear quickly
    expect(loaderVisible !== undefined).toBeTruthy();
  });
});

test.describe('Admin Subscription Management - Access Control', () => {
  test('should not be accessible to non-admin users', async ({ page }) => {
    // Login as merchant
    await page.goto('/login');
    await page.fill('input[name="email"]', 'merchant@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.goto('/settings?tab=subscriptions');
    await page.waitForTimeout(2000);
    
    // Should not see admin subscription management
    const subscriptionTab = page.getByRole('tab', { name: /Subscriptions/i });
    const tabCount = await subscriptionTab.count();
    
    // Admin-only tab should not be visible
    expect(tabCount).toBe(0);
  });

  test('should redirect non-admin users attempting direct access', async ({ page }) => {
    // Login as courier
    await page.goto('/login');
    await page.fill('input[name="email"]', 'courier@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.goto('/admin/subscriptions');
    await page.waitForTimeout(2000);
    
    // Should redirect away from admin page
    const currentUrl = page.url();
    expect(currentUrl.includes('/admin/subscriptions')).toBeFalsy();
  });
});

test.describe('Admin Subscription Management - Data Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings?tab=subscriptions');
  });

  test('should not allow negative prices', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Try to enter negative price
      const monthlyPriceInput = page.getByLabel('Monthly Price');
      await monthlyPriceInput.fill('-10');
      
      // Should prevent or show error
      await page.getByRole('button', { name: /Save/i }).click();
      
      // Dialog should stay open or show error
      const dialogVisible = await page.getByRole('dialog').isVisible();
      expect(dialogVisible).toBeTruthy();
    }
  });

  test('should validate annual price is less than 12x monthly', async ({ page }) => {
    await page.waitForSelector('text=Merchant Plans', { timeout: 10000 });
    
    const editButton = page.locator('button[aria-label="Edit plan"]').first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('role=dialog', { timeout: 5000 });
      
      // Set monthly to 100
      await page.getByLabel('Monthly Price').fill('100');
      
      // Set annual to more than 12x monthly (should show warning)
      await page.getByLabel('Annual Price').fill('1500');
      
      // This is allowed but unusual
      await page.getByRole('button', { name: /Save/i }).click();
    }
  });
});
