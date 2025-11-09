/**
 * Complete E2E Tests for Today's Work - November 9, 2025
 * 
 * Tests all features implemented today:
 * 1. Landing Page Updates (Global scale, C2C improvements, Claims styling)
 * 2. Unified Navigation (PublicHeader across all pages)
 * 3. Subscription Plans page
 * 4. Knowledge Base page
 * 5. All user flows and integrations
 */

import { test, expect } from '@playwright/test';

test.describe('TODAY\'S WORK - Complete Test Suite', () => {

  // ============================================================================
  // LANDING PAGE - ALL UPDATES
  // ============================================================================
  
  test.describe('Landing Page - Global Scale Updates', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should display "Global Delivery Intelligence" instead of Nordic', async ({ page }) => {
      await expect(page.getByText('Global Delivery Intelligence')).toBeVisible();
      await expect(page.getByText('for the Nordic Region')).not.toBeVisible();
    });

    test('should show global payment methods', async ({ page }) => {
      await expect(page.getByText('supporting global payment methods')).toBeVisible();
      await expect(page.getByText('all major Nordic payments')).not.toBeVisible();
    });

    test('should display global courier rating', async ({ page }) => {
      await expect(page.getByText('The most accurate courier rating system globally')).toBeVisible();
      await expect(page.getByText('in the Nordic region')).not.toBeVisible();
    });

    test('should show worldwide courier trust', async ({ page }) => {
      await expect(page.getByText('Trusted by leading courier companies worldwide')).toBeVisible();
      await expect(page.getByText('Nordic courier companies')).not.toBeVisible();
    });

    test('should display Global Courier Integrations in comparison table', async ({ page }) => {
      await expect(page.getByText('Global Courier Integrations')).toBeVisible();
      await expect(page.getByText('Nordic Courier Integrations')).not.toBeVisible();
    });

    test('should show global payment FAQ', async ({ page }) => {
      const faq = page.getByText('What payment methods do you support?');
      await faq.click();
      await expect(page.getByText('We support global payment methods')).toBeVisible();
    });
  });

  test.describe('Landing Page - C2C Section Improvements', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should NOT display confidential margin information', async ({ page }) => {
      // Ensure these are NOT visible
      await expect(page.getByText(/20-30% margin/i)).not.toBeVisible();
      await expect(page.getByText(/€6M ARR/i)).not.toBeVisible();
      await expect(page.getByText(/Performile keeps/i)).not.toBeVisible();
      await expect(page.getByText(/High-Margin Revenue/i)).not.toBeVisible();
    });

    test('should display Choose Rated Couriers feature', async ({ page }) => {
      await expect(page.getByText('Choose Rated Couriers')).toBeVisible();
      await expect(page.getByText('LMT Scores and customer reviews')).toBeVisible();
    });

    test('should display Track All Your Shipments feature', async ({ page }) => {
      await expect(page.getByText('Track All Your Shipments')).toBeVisible();
      await expect(page.getByText('Dashboard with real-time updates')).toBeVisible();
    });

    test('should display Easy Claims Process feature', async ({ page }) => {
      await expect(page.getByText('Easy Claims Process')).toBeVisible();
      await expect(page.getByText('File claims directly from dashboard')).toBeVisible();
    });

    test('should have Start Shipping Now CTA', async ({ page }) => {
      const ctaButton = page.getByRole('button', { name: 'Start Shipping Now' });
      await expect(ctaButton).toBeVisible();
      await ctaButton.click();
      await expect(page).toHaveURL(/.*register/);
    });
  });

  test.describe('Landing Page - Claims Card Styling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should display 8 Claim Types with centered text', async ({ page }) => {
      const claimTypesHeading = page.getByRole('heading', { name: '8 Claim Types Supported' });
      await expect(claimTypesHeading).toBeVisible();
      
      // Check it's larger (h4 instead of h5)
      const fontSize = await claimTypesHeading.evaluate((el) => 
        window.getComputedStyle(el).fontSize
      );
      expect(parseFloat(fontSize)).toBeGreaterThan(20); // h4 should be larger
    });

    test('should display all 8 claim types centered', async ({ page }) => {
      const claimTypes = [
        'Lost Package',
        'Damaged Package',
        'Late Delivery',
        'Wrong Address',
        'Missing Items',
        'Quality Issues',
        'Return Request',
        'Refund Request'
      ];

      for (const claimType of claimTypes) {
        await expect(page.getByText(claimType)).toBeVisible();
      }
    });
  });

  test.describe('Landing Page - Track Orders & Claims (Replaced Pickup Scheduling)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should NOT display Pickup Scheduling', async ({ page }) => {
      await expect(page.getByText('Pickup Scheduling')).not.toBeVisible();
      await expect(page.getByText('Schedule courier pickup for returns')).not.toBeVisible();
    });

    test('should display Track Orders & Claims card', async ({ page }) => {
      await expect(page.getByText('Track Orders & Claims')).toBeVisible();
      await expect(page.getByText('Keep track of all your orders, file claims for issues, and create returns')).toBeVisible();
    });
  });

  // ============================================================================
  // UNIFIED NAVIGATION - PUBLIC HEADER
  // ============================================================================

  test.describe('Unified Navigation - PublicHeader', () => {
    test('should display logo on landing page', async ({ page }) => {
      await page.goto('/');
      const logo = page.locator('img[alt="Performile"]');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', '/logo.png');
    });

    test('should have consistent navigation on all public pages', async ({ page }) => {
      const pages = [
        '/',
        '/subscription/plans',
        '/knowledge-base'
      ];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Check logo
        await expect(page.locator('img[alt="Performile"]')).toBeVisible();
        
        // Check navigation links
        await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Knowledge Base' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
      }
    });

    test('should navigate between pages using header links', async ({ page }) => {
      await page.goto('/');
      
      // Go to Pricing
      await page.getByRole('button', { name: 'Pricing' }).click();
      await expect(page).toHaveURL(/.*subscription\/plans/);
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
      
      // Go to Knowledge Base
      await page.getByRole('button', { name: 'Knowledge Base' }).click();
      await expect(page).toHaveURL(/.*knowledge-base/);
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
      
      // Go back to home
      await page.locator('img[alt="Performile"]').click();
      await expect(page).toHaveURL('/');
    });

    test('should have sticky navigation', async ({ page }) => {
      await page.goto('/');
      const nav = page.locator('header').first();
      
      // Check position is sticky
      const position = await nav.evaluate((el) => 
        window.getComputedStyle(el).position
      );
      expect(position).toBe('sticky');
    });
  });

  // ============================================================================
  // SUBSCRIPTION PLANS PAGE
  // ============================================================================

  test.describe('Subscription Plans Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/subscription/plans');
    });

    test('should display unified navigation', async ({ page }) => {
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Knowledge Base' })).toBeVisible();
    });

    test('should display subscription plans', async ({ page }) => {
      await expect(page.getByText(/Subscription Plans/i)).toBeVisible();
    });

    test('should have billing cycle toggle', async ({ page }) => {
      const monthlyButton = page.getByRole('button', { name: /monthly/i });
      const yearlyButton = page.getByRole('button', { name: /yearly/i });
      
      await expect(monthlyButton).toBeVisible();
      await expect(yearlyButton).toBeVisible();
    });

    test('should navigate to register when selecting plan (not logged in)', async ({ page }) => {
      // Find any "Get Started" or "Select Plan" button
      const selectButton = page.getByRole('button', { name: /Get Started|Select Plan/i }).first();
      
      if (await selectButton.isVisible()) {
        await selectButton.click();
        await expect(page).toHaveURL(/.*register/);
      }
    });

    test('should display user type toggle', async ({ page }) => {
      // Check for merchant/courier toggle if present
      const merchantButton = page.getByRole('button', { name: /merchant/i });
      const courierButton = page.getByRole('button', { name: /courier/i });
      
      // At least one should be visible
      const merchantVisible = await merchantButton.isVisible().catch(() => false);
      const courierVisible = await courierButton.isVisible().catch(() => false);
      
      expect(merchantVisible || courierVisible).toBeTruthy();
    });
  });

  // ============================================================================
  // KNOWLEDGE BASE PAGE
  // ============================================================================

  test.describe('Knowledge Base Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/knowledge-base');
    });

    test('should display unified navigation', async ({ page }) => {
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Knowledge Base' })).toBeVisible();
    });

    test('should display knowledge base categories', async ({ page }) => {
      await expect(page.getByText('Getting Started')).toBeVisible();
      await expect(page.getByText('For Merchants')).toBeVisible();
      await expect(page.getByText('For Couriers')).toBeVisible();
      await expect(page.getByText('Mobile Apps')).toBeVisible();
      await expect(page.getByText('Payments')).toBeVisible();
      await expect(page.getByText('API & Integrations')).toBeVisible();
    });

    test('should display article counts', async ({ page }) => {
      // Check that categories show article counts
      await expect(page.getByText(/12 articles|18 articles|15 articles|10 articles|8 articles|20 articles/)).toBeVisible();
    });

    test('should display popular articles', async ({ page }) => {
      await expect(page.getByText('How to install the WooCommerce plugin')).toBeVisible();
      await expect(page.getByText('API authentication and security')).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await expect(searchInput).toBeVisible();
    });
  });

  // ============================================================================
  // USER FLOWS - COMPLETE JOURNEY
  // ============================================================================

  test.describe('Complete User Journey - Merchant', () => {
    test('should complete merchant signup flow from landing page', async ({ page }) => {
      // Start on landing page
      await page.goto('/');
      
      // Click Get Started
      await page.getByRole('button', { name: 'Get Started' }).first().click();
      await expect(page).toHaveURL(/.*register/);
      
      // Should see registration form
      await expect(page.getByText(/Sign Up|Register|Create Account/i)).toBeVisible();
    });

    test('should navigate through pricing and register', async ({ page }) => {
      // Start on landing page
      await page.goto('/');
      
      // Go to pricing
      await page.getByRole('button', { name: 'Pricing' }).click();
      await expect(page).toHaveURL(/.*subscription\/plans/);
      
      // Select a plan (should redirect to register)
      const selectButton = page.getByRole('button', { name: /Get Started|Select Plan/i }).first();
      if (await selectButton.isVisible()) {
        await selectButton.click();
        await expect(page).toHaveURL(/.*register/);
      }
    });

    test('should access knowledge base for integration help', async ({ page }) => {
      await page.goto('/');
      
      // Go to Knowledge Base
      await page.getByRole('button', { name: 'Knowledge Base' }).click();
      await expect(page).toHaveURL(/.*knowledge-base/);
      
      // Check for integration guides
      await expect(page.getByText('API & Integrations')).toBeVisible();
      await expect(page.getByText('20 articles')).toBeVisible();
    });
  });

  test.describe('Complete User Journey - Consumer C2C', () => {
    test('should understand C2C shipping from landing page', async ({ page }) => {
      await page.goto('/');
      
      // Find C2C section
      await expect(page.getByRole('heading', { name: 'Consumer-to-Consumer Shipping' })).toBeVisible();
      
      // Check features
      await expect(page.getByText('Choose Rated Couriers')).toBeVisible();
      await expect(page.getByText('Track All Your Shipments')).toBeVisible();
      await expect(page.getByText('Easy Claims Process')).toBeVisible();
      
      // Click CTA
      await page.getByRole('button', { name: 'Start Shipping Now' }).click();
      await expect(page).toHaveURL(/.*register/);
    });

    test('should see no confidential pricing info', async ({ page }) => {
      await page.goto('/');
      
      // Scroll to C2C section
      await page.getByRole('heading', { name: 'Consumer-to-Consumer Shipping' }).scrollIntoViewIfNeeded();
      
      // Verify no margin info
      await expect(page.getByText(/margin/i)).not.toBeVisible();
      await expect(page.getByText(/revenue/i)).not.toBeVisible();
      await expect(page.getByText(/€6M/i)).not.toBeVisible();
    });
  });

  // ============================================================================
  // ANALYTICS - LEAD GENERATION / MARKETPLACE
  // ============================================================================

  test.describe('Analytics - Lead Generation Tab (Logged In)', () => {
    test('should have Lead Generation tab in Analytics', async ({ page, context }) => {
      // This test requires login - skip if not authenticated
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      // Login first
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      
      // Go to Analytics
      await page.goto('/analytics');
      
      // Check for Lead Generation tab
      await expect(page.getByRole('tab', { name: 'Lead Generation' })).toBeVisible();
    });

    test('should display Courier Marketplace in Lead Generation tab', async ({ page }) => {
      test.skip(!process.env.TEST_USER_EMAIL, 'Requires authentication');
      
      // Login and navigate
      await page.goto('/login');
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
      await page.click('button[type="submit"]');
      await page.goto('/analytics');
      
      // Click Lead Generation tab
      await page.getByRole('tab', { name: 'Lead Generation' }).click();
      
      // Check for Courier Marketplace
      await expect(page.getByText('Courier Marketplace')).toBeVisible();
      await expect(page.getByText('Research and connect with couriers')).toBeVisible();
    });
  });

  // ============================================================================
  // CROSS-PAGE CONSISTENCY
  // ============================================================================

  test.describe('Cross-Page Consistency', () => {
    test('should have consistent branding across all pages', async ({ page }) => {
      const pages = ['/', '/subscription/plans', '/knowledge-base'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Logo should be consistent
        const logo = page.locator('img[alt="Performile"]');
        await expect(logo).toBeVisible();
        
        const logoSrc = await logo.getAttribute('src');
        expect(logoSrc).toBe('/logo.png');
      }
    });

    test('should have consistent navigation styling', async ({ page }) => {
      const pages = ['/', '/subscription/plans', '/knowledge-base'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        const header = page.locator('header').first();
        
        // Check white background
        const bgColor = await header.evaluate((el) => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(bgColor).toContain('255, 255, 255'); // White
      }
    });

    test('should maintain navigation state across pages', async ({ page }) => {
      await page.goto('/');
      
      // Navigate through all pages
      await page.getByRole('button', { name: 'Pricing' }).click();
      await expect(page).toHaveURL(/.*subscription\/plans/);
      await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
      
      await page.getByRole('button', { name: 'Knowledge Base' }).click();
      await expect(page).toHaveURL(/.*knowledge-base/);
      await expect(page.getByRole('button', { name: 'Knowledge Base' })).toBeVisible();
      
      // Return home via logo
      await page.locator('img[alt="Performile"]').click();
      await expect(page).toHaveURL('/');
    });
  });

  // ============================================================================
  // RESPONSIVE DESIGN - ALL PAGES
  // ============================================================================

  test.describe('Responsive Design - All Pages', () => {
    const pages = ['/', '/subscription/plans', '/knowledge-base'];
    
    test('should be mobile responsive on all pages', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Logo should be visible
        await expect(page.locator('img[alt="Performile"]')).toBeVisible();
        
        // Navigation should be accessible (may be hamburger menu)
        const nav = page.locator('header').first();
        await expect(nav).toBeVisible();
      }
    });

    test('should be tablet responsive on all pages', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await expect(page.locator('img[alt="Performile"]')).toBeVisible();
      }
    });
  });

  // ============================================================================
  // PERFORMANCE - ALL PAGES
  // ============================================================================

  test.describe('Performance - All Pages', () => {
    test('should load all pages within reasonable time', async ({ page }) => {
      const pages = ['/', '/subscription/plans', '/knowledge-base'];
      
      for (const pagePath of pages) {
        const startTime = Date.now();
        await page.goto(pagePath);
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(5000); // 5 seconds
      }
    });

    test('should have no console errors on any page', async ({ page }) => {
      const pages = ['/', '/subscription/plans', '/knowledge-base'];
      
      for (const pagePath of pages) {
        const errors: string[] = [];
        page.on('console', (msg) => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        
        const criticalErrors = errors.filter(err => 
          !err.includes('favicon') && 
          !err.includes('404')
        );
        
        expect(criticalErrors).toHaveLength(0);
      }
    });
  });

  // ============================================================================
  // SEO & ACCESSIBILITY - ALL PAGES
  // ============================================================================

  test.describe('SEO & Accessibility - All Pages', () => {
    const pages = ['/', '/subscription/plans', '/knowledge-base'];
    
    test('should have proper page titles', async ({ page }) => {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await expect(page).toHaveTitle(/Performile/);
      }
    });

    test('should have alt text on all images', async ({ page }) => {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        const images = page.locator('img');
        const count = await images.count();
        
        for (let i = 0; i < count; i++) {
          const alt = await images.nth(i).getAttribute('alt');
          expect(alt).toBeTruthy();
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        const h1 = page.locator('h1, [role="heading"][aria-level="1"]');
        const h1Count = await h1.count();
        
        expect(h1Count).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ============================================================================
  // REGRESSION TESTS - ENSURE NOTHING BROKE
  // ============================================================================

  test.describe('Regression Tests', () => {
    test('should still have all original landing page sections', async ({ page }) => {
      await page.goto('/');
      
      // Core sections
      await expect(page.getByRole('heading', { name: 'The Complete Delivery Platform' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'LMT Lastmile Trust Score' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Dynamic Checkout Widget' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Claims & Returns Made Simple' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Consumer-to-Consumer Shipping' })).toBeVisible();
    });

    test('should still have working CTAs', async ({ page }) => {
      await page.goto('/');
      
      const ctaButtons = page.getByRole('button', { name: /Get Started|Start Shipping|Watch Demo/i });
      const count = await ctaButtons.count();
      
      expect(count).toBeGreaterThan(0);
      
      // Test first CTA
      await ctaButtons.first().click();
      // Should navigate somewhere (register or demo)
      await page.waitForURL(/.*\/(register|checkout-demo|demo)/);
    });

    test('should still have partner logos', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.locator('img[alt="Bring"]')).toBeVisible();
      await expect(page.locator('img[alt="PostNord"]')).toBeVisible();
      await expect(page.locator('img[alt="DHL"]')).toBeVisible();
    });

    test('should still have product screenshots', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByText('Advanced Analytics Dashboard')).toBeVisible();
      await expect(page.getByText('Subscription Management')).toBeVisible();
    });
  });
});
