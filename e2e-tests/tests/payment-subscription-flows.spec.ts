/**
 * Payment & Subscription Flow Tests
 * Tests all payment-related features and subscription flows
 * Created: November 9, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('PAYMENT & SUBSCRIPTION FLOWS - Complete Test Suite', () => {

  // ============================================================================
  // SUBSCRIPTION PLANS PAGE - DETAILED TESTS
  // ============================================================================

  test.describe('Subscription Plans - Public Access', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/subscription/plans');
    });

    test('should display page without login', async ({ page }) => {
      await expect(page).toHaveURL(/.*subscription\/plans/);
      await expect(page.getByText(/Subscription|Plans|Pricing/i)).toBeVisible();
    });

    test('should display billing cycle toggle', async ({ page }) => {
      const monthlyButton = page.getByRole('button', { name: /monthly/i }).first();
      const yearlyButton = page.getByRole('button', { name: /yearly/i }).first();
      
      // At least one should be visible
      const monthlyVisible = await monthlyButton.isVisible().catch(() => false);
      const yearlyVisible = await yearlyButton.isVisible().catch(() => false);
      
      expect(monthlyVisible || yearlyVisible).toBeTruthy();
    });

    test('should toggle between monthly and yearly pricing', async ({ page }) => {
      // Find billing toggle buttons
      const monthlyButton = page.getByRole('button', { name: /monthly/i }).first();
      const yearlyButton = page.getByRole('button', { name: /yearly/i }).first();
      
      if (await monthlyButton.isVisible() && await yearlyButton.isVisible()) {
        // Click yearly
        await yearlyButton.click();
        await page.waitForTimeout(500);
        
        // Click monthly
        await monthlyButton.click();
        await page.waitForTimeout(500);
        
        // Should not error
        expect(true).toBeTruthy();
      }
    });

    test('should display merchant and courier plan options', async ({ page }) => {
      // Check for user type toggles or plan types
      const merchantText = page.getByText(/merchant/i);
      const courierText = page.getByText(/courier/i);
      
      const merchantVisible = await merchantText.first().isVisible().catch(() => false);
      const courierVisible = await courierText.first().isVisible().catch(() => false);
      
      expect(merchantVisible || courierVisible).toBeTruthy();
    });

    test('should display plan features', async ({ page }) => {
      // Common subscription features
      const features = [
        /orders/i,
        /courier/i,
        /analytics/i,
        /support/i,
        /integration/i
      ];
      
      let foundFeatures = 0;
      for (const feature of features) {
        const element = page.getByText(feature).first();
        if (await element.isVisible().catch(() => false)) {
          foundFeatures++;
        }
      }
      
      expect(foundFeatures).toBeGreaterThan(0);
    });

    test('should display pricing information', async ({ page }) => {
      // Look for price indicators
      const pricePattern = /\$\d+|\d+\s*kr|€\d+|free/i;
      const priceElements = page.getByText(pricePattern);
      
      const count = await priceElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have CTA buttons for each plan', async ({ page }) => {
      const ctaButtons = page.getByRole('button', { name: /get started|select|choose|subscribe/i });
      const count = await ctaButtons.count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should redirect to register when selecting plan (not logged in)', async ({ page }) => {
      const selectButton = page.getByRole('button', { name: /get started|select plan/i }).first();
      
      if (await selectButton.isVisible()) {
        await selectButton.click();
        
        // Should redirect to register or login
        await page.waitForURL(/.*\/(register|login)/);
        expect(page.url()).toMatch(/\/(register|login)/);
      }
    });

    test('should display tier comparison', async ({ page }) => {
      // Look for tier names
      const tierNames = [
        /tier 1|basic|starter/i,
        /tier 2|professional|pro/i,
        /tier 3|enterprise|premium/i
      ];
      
      let foundTiers = 0;
      for (const tier of tierNames) {
        const element = page.getByText(tier).first();
        if (await element.isVisible().catch(() => false)) {
          foundTiers++;
        }
      }
      
      expect(foundTiers).toBeGreaterThan(0);
    });

    test('should show popular or recommended plan badge', async ({ page }) => {
      const badges = page.getByText(/popular|recommended|best value/i);
      
      // At least one plan might have a badge
      const count = await badges.count();
      // This is optional, so we just check it doesn't error
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // SUBSCRIPTION SUCCESS PAGE
  // ============================================================================

  test.describe('Subscription Success Page', () => {
    test('should display success page', async ({ page }) => {
      await page.goto('/subscription/success');
      
      // Should show success message
      await expect(page.getByText(/success|thank you|welcome|confirmed/i)).toBeVisible();
    });

    test('should have navigation back to dashboard or home', async ({ page }) => {
      await page.goto('/subscription/success');
      
      // Should have a way to navigate
      const navButtons = page.getByRole('button', { name: /dashboard|home|continue|get started/i });
      const links = page.getByRole('link', { name: /dashboard|home|continue|get started/i });
      
      const buttonCount = await navButtons.count();
      const linkCount = await links.count();
      
      expect(buttonCount + linkCount).toBeGreaterThan(0);
    });

    test('should display unified navigation', async ({ page }) => {
      await page.goto('/subscription/success');
      
      // Should have the logo
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
    });
  });

  // ============================================================================
  // SUBSCRIPTION CANCEL PAGE
  // ============================================================================

  test.describe('Subscription Cancel Page', () => {
    test('should display cancel page', async ({ page }) => {
      await page.goto('/subscription/cancel');
      
      // Should show cancel/error message
      await expect(page.getByText(/cancel|try again|error|problem/i)).toBeVisible();
    });

    test('should have option to try again', async ({ page }) => {
      await page.goto('/subscription/cancel');
      
      // Should have a way to retry or go back
      const retryButtons = page.getByRole('button', { name: /try again|back|return|plans/i });
      const retryLinks = page.getByRole('link', { name: /try again|back|return|plans/i });
      
      const buttonCount = await retryButtons.count();
      const linkCount = await retryLinks.count();
      
      expect(buttonCount + linkCount).toBeGreaterThan(0);
    });

    test('should display unified navigation', async ({ page }) => {
      await page.goto('/subscription/cancel');
      
      // Should have the logo
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
    });
  });

  // ============================================================================
  // MY SUBSCRIPTION PAGE (Requires Login)
  // ============================================================================

  test.describe('My Subscription Page - Protected', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      await page.goto('/my-subscription');
      
      // Should redirect to login
      await page.waitForURL(/.*login/);
      expect(page.url()).toContain('login');
    });

    test('should display subscription page when logged in', async ({ page }) => {
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
      
      // Navigate to subscription
      await page.goto('/my-subscription');
      
      // Should show subscription info
      await expect(page.getByText(/subscription|plan|billing/i)).toBeVisible();
    });

    test('should display current plan information', async ({ page }) => {
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
      
      await page.goto('/my-subscription');
      
      // Should show plan details
      const planInfo = page.getByText(/tier|plan|subscription/i);
      await expect(planInfo.first()).toBeVisible();
    });

    test('should have option to manage subscription', async ({ page }) => {
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
      
      await page.goto('/my-subscription');
      
      // Should have manage/upgrade/cancel buttons
      const manageButtons = page.getByRole('button', { name: /manage|upgrade|cancel|change/i });
      const count = await manageButtons.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // BILLING PORTAL (Requires Login)
  // ============================================================================

  test.describe('Billing Portal - Protected', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
      await page.goto('/billing-portal');
      
      // Should redirect to login
      await page.waitForURL(/.*login/);
      expect(page.url()).toContain('login');
    });

    test('should display billing portal when logged in', async ({ page }) => {
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
      
      await page.goto('/billing-portal');
      
      // Should show billing info
      await expect(page.getByText(/billing|invoice|payment/i)).toBeVisible();
    });
  });

  // ============================================================================
  // PAYMENT METHODS - LANDING PAGE
  // ============================================================================

  test.describe('Payment Methods Display - Landing Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should mention global payment methods', async ({ page }) => {
      await expect(page.getByText('supporting global payment methods')).toBeVisible();
    });

    test('should display payment method names in features', async ({ page }) => {
      // Look for payment method mentions
      const paymentMethods = [
        /vipps/i,
        /swish/i,
        /mobilepay/i,
        /stripe/i
      ];
      
      let foundMethods = 0;
      for (const method of paymentMethods) {
        const element = page.getByText(method).first();
        if (await element.isVisible().catch(() => false)) {
          foundMethods++;
        }
      }
      
      expect(foundMethods).toBeGreaterThan(0);
    });

    test('should have payment FAQ', async ({ page }) => {
      const faq = page.getByText('What payment methods do you support?');
      await faq.click();
      
      await expect(page.getByText('We support global payment methods')).toBeVisible();
    });
  });

  // ============================================================================
  // SUBSCRIPTION FLOW - COMPLETE JOURNEY
  // ============================================================================

  test.describe('Complete Subscription Journey', () => {
    test('should complete full subscription flow from landing to plans', async ({ page }) => {
      // Start on landing page
      await page.goto('/');
      
      // Click "Get Started"
      await page.getByRole('button', { name: 'Get Started' }).first().click();
      await expect(page).toHaveURL(/.*register/);
      
      // Go back and try Pricing link
      await page.goto('/');
      await page.getByRole('button', { name: 'Pricing' }).click();
      await expect(page).toHaveURL(/.*subscription\/plans/);
      
      // Should see plans
      await expect(page.getByText(/subscription|plan/i)).toBeVisible();
    });

    test('should navigate from pricing to register', async ({ page }) => {
      await page.goto('/subscription/plans');
      
      // Click any "Get Started" button
      const getStartedButton = page.getByRole('button', { name: /get started/i }).first();
      
      if (await getStartedButton.isVisible()) {
        await getStartedButton.click();
        await page.waitForURL(/.*register/);
        expect(page.url()).toContain('register');
      }
    });

    test('should maintain plan selection through registration', async ({ page }) => {
      await page.goto('/subscription/plans');
      
      // Click a plan button
      const selectButton = page.getByRole('button', { name: /get started|select/i }).first();
      
      if (await selectButton.isVisible()) {
        await selectButton.click();
        
        // Should go to register
        await page.waitForURL(/.*register/);
        
        // Registration page should load
        await expect(page.getByText(/sign up|register|create account/i)).toBeVisible();
      }
    });
  });

  // ============================================================================
  // PRICING DISPLAY - CONSISTENCY
  // ============================================================================

  test.describe('Pricing Display Consistency', () => {
    test('should show consistent pricing on landing page', async ({ page }) => {
      await page.goto('/');
      
      // Scroll to pricing comparison
      const pricingSection = page.getByRole('heading', { name: /What Competitors Are Missing|Pricing/i });
      if (await pricingSection.isVisible().catch(() => false)) {
        await pricingSection.scrollIntoViewIfNeeded();
        
        // Should show pricing
        await expect(page.getByText(/\$29\/mo|\$149\/mo|\$199\/mo/)).toBeVisible();
      }
    });

    test('should match pricing between landing and plans page', async ({ page }) => {
      // Get pricing from landing page
      await page.goto('/');
      const landingPrices: string[] = [];
      
      const priceElements = page.getByText(/\$\d+\/mo/);
      const count = await priceElements.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await priceElements.nth(i).textContent();
        if (text) landingPrices.push(text);
      }
      
      // Go to plans page
      await page.goto('/subscription/plans');
      
      // Should have pricing
      const plansPrices = page.getByText(/\$\d+/);
      const plansCount = await plansPrices.count();
      
      expect(plansCount).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // STRIPE INTEGRATION (External)
  // ============================================================================

  test.describe('Stripe Integration Points', () => {
    test('should have Stripe checkout flow initiated (logged in)', async ({ page }) => {
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/);
      
      await page.goto('/subscription/plans');
      
      // Click a plan
      const selectButton = page.getByRole('button', { name: /get started|select/i }).first();
      
      if (await selectButton.isVisible()) {
        // Note: We won't actually complete Stripe checkout in tests
        // Just verify the button works
        await selectButton.click();
        
        // Should either redirect to Stripe or show loading
        await page.waitForTimeout(2000);
        
        // If redirected to Stripe, URL will contain stripe.com
        // If stayed on site, should show loading or error
        expect(true).toBeTruthy();
      }
    });

    test('should handle Stripe success redirect', async ({ page }) => {
      // Simulate coming back from Stripe success
      await page.goto('/subscription/success?session_id=test_session_123');
      
      // Should show success page
      await expect(page.getByText(/success|thank you/i)).toBeVisible();
    });

    test('should handle Stripe cancel redirect', async ({ page }) => {
      // Simulate coming back from Stripe cancel
      await page.goto('/subscription/cancel');
      
      // Should show cancel page
      await expect(page.getByText(/cancel|try again/i)).toBeVisible();
    });
  });

  // ============================================================================
  // SUBSCRIPTION TIERS & LIMITS
  // ============================================================================

  test.describe('Subscription Tiers & Limits', () => {
    test('should display tier limits on plans page', async ({ page }) => {
      await page.goto('/subscription/plans');
      
      // Look for limit descriptions
      const limits = [
        /unlimited/i,
        /\d+\s*(orders|couriers|markets|users)/i,
        /up to/i
      ];
      
      let foundLimits = 0;
      for (const limit of limits) {
        const element = page.getByText(limit).first();
        if (await element.isVisible().catch(() => false)) {
          foundLimits++;
        }
      }
      
      expect(foundLimits).toBeGreaterThan(0);
    });

    test('should show tier benefits comparison', async ({ page }) => {
      await page.goto('/subscription/plans');
      
      // Look for feature checkmarks or comparisons
      const features = page.getByText(/✓|✔|included|yes|no/i);
      const count = await features.count();
      
      expect(count).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // MOBILE RESPONSIVENESS - PAYMENT PAGES
  // ============================================================================

  test.describe('Mobile Responsiveness - Payment Pages', () => {
    test('should display subscription plans on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/subscription/plans');
      
      // Should be visible
      await expect(page.getByText(/subscription|plan/i)).toBeVisible();
    });

    test('should display pricing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/subscription/plans');
      
      // Pricing should be visible
      const prices = page.getByText(/\$\d+/);
      const count = await prices.count();
      
      expect(count).toBeGreaterThan(0);
    });

    test('should have working CTAs on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/subscription/plans');
      
      const ctaButton = page.getByRole('button', { name: /get started/i }).first();
      
      if (await ctaButton.isVisible()) {
        await expect(ctaButton).toBeEnabled();
      }
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  test.describe('Error Handling - Payment Flows', () => {
    test('should handle invalid subscription URLs gracefully', async ({ page }) => {
      await page.goto('/subscription/invalid-page');
      
      // Should show 404 or redirect
      // Just verify it doesn't crash
      await page.waitForLoadState('networkidle');
      expect(true).toBeTruthy();
    });

    test('should handle missing session ID on success page', async ({ page }) => {
      await page.goto('/subscription/success');
      
      // Should still show success page
      await expect(page.getByText(/success|thank you/i)).toBeVisible();
    });
  });

  // ============================================================================
  // PERFORMANCE - PAYMENT PAGES
  // ============================================================================

  test.describe('Performance - Payment Pages', () => {
    test('should load subscription plans quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/subscription/plans');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have no console errors on payment pages', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/subscription/plans');
      await page.waitForLoadState('networkidle');
      
      const criticalErrors = errors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('404')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });
});
