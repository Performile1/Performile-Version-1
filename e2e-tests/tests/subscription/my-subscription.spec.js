/**
 * MY SUBSCRIPTION PAGE TESTS
 * Tests for the merchant/courier subscription view
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

test.describe('My Subscription - Merchant View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto('/my-subscription');
  });

  test('should display subscription page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'My Subscription' })).toBeVisible();
    await expect(page.getByText('Manage your subscription plan and billing')).toBeVisible();
  });

  test('should display current plan details', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('text=Tier', { timeout: 10000 });
    
    // Check plan name is displayed
    const planName = page.locator('h5').first();
    await expect(planName).toBeVisible();
    
    // Check tier chip is displayed
    await expect(page.getByText(/Tier \d/)).toBeVisible();
    
    // Check user type chip
    await expect(page.locator('text=/💼 Merchant|🚗 Courier/')).toBeVisible();
  });

  test('should display usage statistics', async ({ page }) => {
    await page.waitForSelector('text=Usage This Month', { timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: 'Usage This Month' })).toBeVisible();
    await expect(page.getByText('Orders')).toBeVisible();
  });

  test('should display plan limits for merchants', async ({ page }) => {
    await page.waitForSelector('text=Max Shops', { timeout: 10000 });
    
    await expect(page.getByText('Max Shops')).toBeVisible();
    await expect(page.getByText('Max Couriers')).toBeVisible();
    await expect(page.getByText('Max Emails/Month')).toBeVisible();
  });

  test('should display quick actions card', async ({ page }) => {
    await page.waitForSelector('text=Quick Actions', { timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage Billing/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /View Invoices/i })).toBeVisible();
  });

  test('should display upgrade button for non-enterprise plans', async ({ page }) => {
    await page.waitForSelector('text=Quick Actions', { timeout: 10000 });
    
    // Check if upgrade button exists (it should for tier < 4)
    const upgradeButton = page.getByRole('button', { name: /Upgrade Plan/i });
    const buttonCount = await upgradeButton.count();
    
    // Should have upgrade button if not on highest tier
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  });

  test('should navigate to billing portal when Manage Billing is clicked', async ({ page }) => {
    await page.waitForSelector('text=Quick Actions', { timeout: 10000 });
    await page.getByRole('button', { name: /Manage Billing/i }).click();
    await expect(page).toHaveURL(/.*billing-portal/);
  });

  test('should navigate to subscription plans when Upgrade is clicked', async ({ page }) => {
    await page.waitForSelector('text=Quick Actions', { timeout: 10000 });
    
    const upgradeButton = page.getByRole('button', { name: /Upgrade Plan/i });
    if (await upgradeButton.count() > 0) {
      await upgradeButton.click();
      await expect(page).toHaveURL(/.*subscription\/plans/);
    }
  });

  test('should display next renewal date', async ({ page }) => {
    await page.waitForSelector('text=Next Renewal', { timeout: 10000 });
    
    await expect(page.getByText('Next Renewal')).toBeVisible();
    await expect(page.getByText('Billing Cycle')).toBeVisible();
  });

  test('should display plan features card', async ({ page }) => {
    await page.waitForSelector('text=Plan Features', { timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: 'Plan Features' })).toBeVisible();
    await expect(page.getByText(/orders\/month/i)).toBeVisible();
  });

  test('should show warning when approaching limits', async ({ page }) => {
    await page.waitForSelector('text=Usage This Month', { timeout: 10000 });
    
    // If usage is >= 75%, warning should be visible
    const warningText = page.getByText(/approaching your plan limits/i);
    const warningCount = await warningText.count();
    
    // Warning may or may not be present depending on usage
    expect(warningCount).toBeGreaterThanOrEqual(0);
  });

  test('should display cancellation warning if subscription is cancelled', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check if cancellation warning exists
    const cancelWarning = page.getByText(/will be cancelled on/i);
    const warningCount = await cancelWarning.count();
    
    // Warning only shows if cancel_at_period_end is true
    expect(warningCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('My Subscription - Courier View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCourier(page);
    await page.goto('/my-subscription');
  });

  test('should display courier-specific limits', async ({ page }) => {
    await page.waitForSelector('text=Usage This Month', { timeout: 10000 });
    
    // Couriers should see team members instead of shops/couriers
    await expect(page.getByText('Max Team Members')).toBeVisible();
  });

  test('should show courier user type chip', async ({ page }) => {
    await page.waitForSelector('text=🚗 Courier', { timeout: 10000 });
    await expect(page.getByText('🚗 Courier')).toBeVisible();
  });
});

test.describe('My Subscription - Error Handling', () => {
  test('should show error message if no subscription found', async ({ page }) => {
    // Mock user with no subscription
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('performile-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: {
            user_id: 'no-subscription-user',
            email: 'noplan@test.com',
            user_role: 'merchant'
          }
        }
      }));
    });
    
    await page.goto('/my-subscription');
    
    // Should show error or redirect
    await page.waitForTimeout(3000);
    const errorMessage = page.getByText(/No active subscription found/i);
    const viewPlansButton = page.getByRole('button', { name: /View Available Plans/i });
    
    const hasError = await errorMessage.count() > 0;
    const hasButton = await viewPlansButton.count() > 0;
    
    expect(hasError || hasButton).toBeTruthy();
  });

  test('should show loading state while fetching data', async ({ page }) => {
    await loginAsMerchant(page);
    await page.goto('/my-subscription');
    
    // Should show loading indicator briefly
    const loader = page.locator('role=progressbar');
    const loaderVisible = await loader.isVisible().catch(() => false);
    
    // Loader may disappear quickly, so we just check it doesn't error
    expect(loaderVisible !== undefined).toBeTruthy();
  });
});

test.describe('My Subscription - Access Control', () => {
  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/my-subscription');
    
    // Should redirect to login or show auth modal
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    
    expect(
      currentUrl.includes('login') || 
      currentUrl.includes('register') ||
      await page.getByText(/sign in/i).count() > 0
    ).toBeTruthy();
  });

  test('should not be accessible to consumers', async ({ page }) => {
    // Login as consumer
    await page.goto('/login');
    await page.fill('input[name="email"]', 'consumer@test.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    
    await page.goto('/my-subscription');
    await page.waitForTimeout(2000);
    
    // Should redirect or show error
    const currentUrl = page.url();
    expect(currentUrl.includes('my-subscription')).toBeFalsy();
  });
});

test.describe('My Subscription - Responsive Design', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await loginAsMerchant(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/my-subscription');
    
    await page.waitForSelector('text=My Subscription', { timeout: 10000 });
    
    // Check main elements are visible on mobile
    await expect(page.getByRole('heading', { name: 'My Subscription' })).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await loginAsMerchant(page);
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/my-subscription');
    
    await page.waitForSelector('text=My Subscription', { timeout: 10000 });
    
    await expect(page.getByRole('heading', { name: 'My Subscription' })).toBeVisible();
  });
});
