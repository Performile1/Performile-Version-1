/**
 * HOMEPAGE TESTS
 * Tests for the enhanced homepage with navigation, features, and social proof
 * Created: October 21, 2025
 */

const { test, expect } = require('@playwright/test');

test.describe('Homepage - Public View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display top navigation bar with logo and buttons', async ({ page }) => {
    // Check logo is visible
    await expect(page.locator('img[alt="Performile Logo"]').first()).toBeVisible();
    
    // Check navigation links
    await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contact' })).toBeVisible();
    
    // Check Login and Get Started buttons
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
  });

  test('should navigate to login page when Login button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /Login/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should navigate to register page when Get Started is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /Get Started/i }).first().click();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should display hero section with title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Performile' })).toBeVisible();
    await expect(page.getByText('The Last Mile Performance Index')).toBeVisible();
    await expect(page.getByText(/Transparent delivery performance ratings/i)).toBeVisible();
  });

  test('should display feature showcase section', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Powerful Features' })).toBeVisible();
    
    // Check Analytics Dashboard feature
    await expect(page.getByRole('heading', { name: 'Analytics Dashboard' })).toBeVisible();
    await expect(page.getByText(/real-time insights/i)).toBeVisible();
    
    // Check Parcel Points Map feature
    await expect(page.getByRole('heading', { name: 'Parcel Points Map' })).toBeVisible();
    await expect(page.getByText(/Find nearby parcel points/i)).toBeVisible();
    
    // Check Service Performance feature
    await expect(page.getByRole('heading', { name: 'Service Performance' })).toBeVisible();
    await expect(page.getByText(/Track and compare courier performance/i)).toBeVisible();
  });

  test('should display feature grid with 6 cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Why Choose Performile?' })).toBeVisible();
    
    // Check all 6 feature cards
    await expect(page.getByText('TrustScore System')).toBeVisible();
    await expect(page.getByText('Real-Time Tracking')).toBeVisible();
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();
    await expect(page.getByText('Secure Platform')).toBeVisible();
    await expect(page.getByText('Courier Network')).toBeVisible();
    await expect(page.getByText('Merchant Tools')).toBeVisible();
  });

  test('should display enhanced stats section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Trusted by Thousands' })).toBeVisible();
    
    // Check all 4 statistics
    await expect(page.getByText('10K+')).toBeVisible();
    await expect(page.getByText('Deliveries Tracked')).toBeVisible();
    
    await expect(page.getByText('1,000+')).toBeVisible();
    await expect(page.getByText('Active Merchants')).toBeVisible();
    
    await expect(page.getByText('5,000+')).toBeVisible();
    await expect(page.getByText('Registered Couriers')).toBeVisible();
    
    await expect(page.getByText('50K+')).toBeVisible();
    await expect(page.getByText('Customer Reviews')).toBeVisible();
  });

  test('should display customer testimonial with 5 stars', async ({ page }) => {
    await expect(page.getByText(/Best delivery tracking platform/i)).toBeVisible();
    await expect(page.getByText(/Sarah Johnson/i)).toBeVisible();
    
    // Check for 5 star icons (they should be visible)
    const stars = page.locator('[data-testid="StarIcon"]');
    await expect(stars).toHaveCount(5);
  });

  test('should display CTA section with pricing and contact buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ready to Get Started?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Pricing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Contact Us' })).toBeVisible();
  });

  test('should display footer with links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    await expect(page.getByText('Quick Links')).toBeVisible();
    await expect(page.getByText('Legal')).toBeVisible();
    await expect(page.getByText(/© 2025 Performile/i)).toBeVisible();
  });

  test('should navigate to pricing page from CTA', async ({ page }) => {
    await page.getByRole('button', { name: 'View Pricing' }).click();
    await expect(page).toHaveURL(/.*subscription\/plans/);
  });

  test('should navigate to contact page from CTA', async ({ page }) => {
    await page.getByRole('button', { name: 'Contact Us' }).click();
    await expect(page).toHaveURL(/.*contact/);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that main elements are still visible
    await expect(page.getByRole('heading', { name: 'Performile' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Started/i }).first()).toBeVisible();
  });

  test('should have sticky navigation that stays on scroll', async ({ page }) => {
    // Get initial position of nav
    const nav = page.locator('img[alt="Performile Logo"]').first();
    await expect(nav).toBeVisible();
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Nav should still be visible (sticky)
    await expect(nav).toBeVisible();
  });
});

test.describe('Homepage - Authenticated User', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('performile-auth', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: {
            user_id: 'test-user-id',
            email: 'test@example.com',
            user_role: 'merchant'
          }
        }
      }));
    });
    await page.reload();
  });

  test('should show Dashboard button instead of Login/Register', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Login/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Get Started/i })).not.toBeVisible();
  });

  test('should navigate to dashboard when Dashboard button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });
});

test.describe('Homepage - Performance', () => {
  test('should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
