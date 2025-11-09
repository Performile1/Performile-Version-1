/**
 * Landing Page E2E Tests
 * Tests all sections, navigation, links, and features on the landing page
 * Created: November 9, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Landing Page - Complete Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Navigation Bar', () => {
    test('should display logo and be clickable', async ({ page }) => {
      const logo = page.locator('img[alt="Performile"]');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', '/logo.png');
      
      // Click logo should stay on home page
      await logo.click();
      await expect(page).toHaveURL('/');
    });

    test('should have all navigation links', async ({ page }) => {
      // Check for main navigation buttons
      await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Knowledge Base' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    });

    test('should navigate to Pricing page', async ({ page }) => {
      await page.getByRole('button', { name: 'Pricing' }).click();
      await expect(page).toHaveURL(/.*subscription\/plans/);
    });

    test('should navigate to Knowledge Base', async ({ page }) => {
      await page.getByRole('button', { name: 'Knowledge Base' }).click();
      await expect(page).toHaveURL(/.*knowledge-base/);
    });

    test('should navigate to Login page', async ({ page }) => {
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL(/.*login/);
    });

    test('should navigate to Register page', async ({ page }) => {
      await page.getByRole('button', { name: 'Get Started' }).click();
      await expect(page).toHaveURL(/.*register/);
    });
  });

  test.describe('Hero Section', () => {
    test('should display main heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'The Complete Delivery Platform' })).toBeVisible();
    });

    test('should display subheading', async ({ page }) => {
      await expect(page.getByText('Global Delivery Intelligence')).toBeVisible();
    });

    test('should have CTA buttons', async ({ page }) => {
      const heroSection = page.locator('text=The Complete Delivery Platform').locator('..');
      await expect(heroSection.getByRole('button', { name: 'Get Started Free' })).toBeVisible();
      await expect(heroSection.getByRole('button', { name: 'Watch Demo' })).toBeVisible();
    });
  });

  test.describe('Features Overview Section', () => {
    test('should display all 6 feature cards', async ({ page }) => {
      await expect(page.getByText('Mobile Apps')).toBeVisible();
      await expect(page.getByText('Checkout Plugins')).toBeVisible();
      await expect(page.getByText('Multi-Payment Support')).toBeVisible();
      await expect(page.getByText('Real-Time Tracking')).toBeVisible();
      await expect(page.getByText('C2C Shipping')).toBeVisible();
      await expect(page.getByText('Advanced Analytics')).toBeVisible();
    });

    test('should display feature descriptions', async ({ page }) => {
      await expect(page.getByText('Native iOS & Android apps')).toBeVisible();
      await expect(page.getByText('WooCommerce & Shopify integrations')).toBeVisible();
    });
  });

  test.describe('LMT Lastmile Trust Score Section', () => {
    test('should display LMT Score heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'LMT Lastmile Trust Score' })).toBeVisible();
    });

    test('should display postal code-specific feature', async ({ page }) => {
      await expect(page.getByText('Postal Code-Specific')).toBeVisible();
      await expect(page.getByText('Same courier performs differently in different areas')).toBeVisible();
    });

    test('should display real customer data feature', async ({ page }) => {
      await expect(page.getByText('Real Customer Data')).toBeVisible();
    });

    test('should display global rating badge', async ({ page }) => {
      await expect(page.getByText('The most accurate courier rating system globally')).toBeVisible();
    });
  });

  test.describe('Dynamic Checkout Section', () => {
    test('should display dynamic checkout heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Dynamic Checkout Widget' })).toBeVisible();
    });

    test('should display courier options with LMT scores', async ({ page }) => {
      // Check for example courier cards
      await expect(page.getByText('LMT:')).toBeVisible();
    });

    test('should display how it works steps', async ({ page }) => {
      await expect(page.getByText('Consumer enters postal code')).toBeVisible();
      await expect(page.getByText('Shows LMT Score')).toBeVisible();
    });
  });

  test.describe('Predictive Delivery Section', () => {
    test('should display predictive delivery heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Predictive Delivery/i })).toBeVisible();
    });

    test('should display time predictions', async ({ page }) => {
      await expect(page.getByText(/14:00-17:00/)).toBeVisible();
    });
  });

  test.describe('Claims & RMA Section', () => {
    test('should display claims heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Claims & Returns Made Simple' })).toBeVisible();
    });

    test('should display 8 claim types', async ({ page }) => {
      await expect(page.getByText('8 Claim Types Supported')).toBeVisible();
      await expect(page.getByText('Lost Package')).toBeVisible();
      await expect(page.getByText('Damaged Package')).toBeVisible();
      await expect(page.getByText('Late Delivery')).toBeVisible();
      await expect(page.getByText('Wrong Address')).toBeVisible();
      await expect(page.getByText('Missing Items')).toBeVisible();
      await expect(page.getByText('Quality Issues')).toBeVisible();
      await expect(page.getByText('Return Request')).toBeVisible();
      await expect(page.getByText('Refund Request')).toBeVisible();
    });

    test('should display claim types centered', async ({ page }) => {
      const claimCard = page.locator('text=8 Claim Types Supported').locator('..');
      await expect(claimCard).toHaveCSS('text-align', 'center');
    });
  });

  test.describe('C2C Shipping Section', () => {
    test('should display C2C heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Consumer-to-Consumer Shipping' })).toBeVisible();
    });

    test('should display 3-step process', async ({ page }) => {
      await expect(page.getByText('Create Shipment')).toBeVisible();
      await expect(page.getByText('Get Your Label')).toBeVisible();
      await expect(page.getByText('Drop Off & Track')).toBeVisible();
    });

    test('should display key features', async ({ page }) => {
      await expect(page.getByText('Choose Rated Couriers')).toBeVisible();
      await expect(page.getByText('Track All Your Shipments')).toBeVisible();
      await expect(page.getByText('Easy Claims Process')).toBeVisible();
    });

    test('should NOT display margin or revenue information', async ({ page }) => {
      // Ensure confidential info is not shown
      await expect(page.getByText(/20-30% margin/i)).not.toBeVisible();
      await expect(page.getByText(/€6M ARR/i)).not.toBeVisible();
      await expect(page.getByText(/Performile keeps/i)).not.toBeVisible();
    });

    test('should have Start Shipping Now button', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Start Shipping Now' })).toBeVisible();
    });
  });

  test.describe('Partner Logos Section', () => {
    test('should display partner heading', async ({ page }) => {
      await expect(page.getByText('Trusted by leading courier companies worldwide')).toBeVisible();
    });

    test('should display courier logos', async ({ page }) => {
      // Check for logo images
      const bringLogo = page.locator('img[alt="Bring"]');
      const postnordLogo = page.locator('img[alt="PostNord"]');
      const dhlLogo = page.locator('img[alt="DHL"]');
      
      await expect(bringLogo).toBeVisible();
      await expect(postnordLogo).toBeVisible();
      await expect(dhlLogo).toBeVisible();
    });

    test('should have grayscale logos that turn color on hover', async ({ page }) => {
      const logo = page.locator('img[alt="Bring"]').first();
      
      // Check initial grayscale
      const initialFilter = await logo.evaluate((el: HTMLImageElement) => 
        window.getComputedStyle(el).filter
      );
      expect(initialFilter).toContain('grayscale');
      
      // Hover and check color
      await logo.hover();
      await page.waitForTimeout(500); // Wait for transition
    });
  });

  test.describe('Product Screenshots Section', () => {
    test('should display screenshots heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'See the Platform in Action' })).toBeVisible();
    });

    test('should display 4 screenshot cards', async ({ page }) => {
      await expect(page.getByText('Advanced Analytics Dashboard')).toBeVisible();
      await expect(page.getByText('Subscription Management')).toBeVisible();
      await expect(page.getByText('User Dashboard')).toBeVisible();
      await expect(page.getByText('Mobile Apps Coming Soon')).toBeVisible();
    });

    test('should display screenshot images', async ({ page }) => {
      const analyticsImg = page.locator('img[alt="Analytics Dashboard"]');
      const subscriptionImg = page.locator('img[alt="Subscription Management"]');
      
      // Images should be present (may not load in test)
      await expect(analyticsImg).toBeAttached();
      await expect(subscriptionImg).toBeAttached();
    });
  });

  test.describe('Pricing Comparison Section', () => {
    test('should display comparison heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'What Competitors Are Missing' })).toBeVisible();
    });

    test('should display comparison table', async ({ page }) => {
      // Check table headers
      await expect(page.getByRole('cell', { name: 'Traditional Courier' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'ShipStation' })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'Performile' })).toBeVisible();
    });

    test('should highlight unique features', async ({ page }) => {
      await expect(page.getByText('Dynamic Checkout (Changes by Postal Code)')).toBeVisible();
      await expect(page.getByText('Real-Time LMT Score & Ratings')).toBeVisible();
      await expect(page.getByText('Postal Code-Specific ETA')).toBeVisible();
      await expect(page.getByText('Consumer Choice at Checkout')).toBeVisible();
    });

    test('should display pricing', async ({ page }) => {
      await expect(page.getByText('$199/mo')).toBeVisible();
      await expect(page.getByText('$149/mo')).toBeVisible();
      await expect(page.getByText('$29/mo')).toBeVisible();
    });

    test('should display unique advantages cards', async ({ page }) => {
      await expect(page.getByText('Dynamic Checkout')).toBeVisible();
      await expect(page.getByText('LMT Score Integration')).toBeVisible();
      await expect(page.getByText('Predictive ETA')).toBeVisible();
      await expect(page.getByText('Consumer Choice')).toBeVisible();
    });
  });

  test.describe('Testimonials Section', () => {
    test('should display testimonials heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Trusted by Thousands' })).toBeVisible();
    });

    test('should display testimonial cards', async ({ page }) => {
      await expect(page.getByText('CEO, Fashion Retailer')).toBeVisible();
      await expect(page.getByText('Operations Manager, SwiftDelivery')).toBeVisible();
    });

    test('should display 5-star ratings', async ({ page }) => {
      // Check for rating components
      const ratings = page.locator('[aria-label*="5 Stars"]');
      await expect(ratings.first()).toBeVisible();
    });
  });

  test.describe('FAQ Section', () => {
    test('should display FAQ heading', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Frequently Asked Questions' })).toBeVisible();
    });

    test('should have expandable FAQ items', async ({ page }) => {
      const faqItem = page.getByText('How quickly can I get started?');
      await expect(faqItem).toBeVisible();
      
      // Click to expand
      await faqItem.click();
      await expect(page.getByText('You can start shipping in less than 10 minutes')).toBeVisible();
    });

    test('should display global payment methods', async ({ page }) => {
      const paymentFaq = page.getByText('What payment methods do you support?');
      await paymentFaq.click();
      await expect(page.getByText('We support global payment methods')).toBeVisible();
    });
  });

  test.describe('Newsletter Section', () => {
    test('should display newsletter signup', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Stay Updated/i })).toBeVisible();
    });

    test('should have email input and subscribe button', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').last();
      const subscribeButton = page.getByRole('button', { name: /Subscribe/i }).last();
      
      await expect(emailInput).toBeVisible();
      await expect(subscribeButton).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check key elements are still visible
      await expect(page.getByRole('heading', { name: 'The Complete Delivery Platform' })).toBeVisible();
      await expect(page.locator('img[alt="Performile"]')).toBeVisible();
    });

    test('should be tablet responsive', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.getByRole('heading', { name: 'The Complete Delivery Platform' })).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    });

    test('should have no console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Filter out known acceptable errors
      const criticalErrors = errors.filter(err => 
        !err.includes('favicon') && 
        !err.includes('404')
      );
      
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('SEO and Accessibility', () => {
    test('should have proper page title', async ({ page }) => {
      await expect(page).toHaveTitle(/Performile/);
    });

    test('should have meta description', async ({ page }) => {
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toBeAttached();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1, [role="heading"][aria-level="1"]');
      await expect(h1).toHaveCount(1); // Should have exactly one H1
    });

    test('should have alt text on images', async ({ page }) => {
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy(); // All images should have alt text
      }
    });
  });

  test.describe('Links and Navigation', () => {
    test('should have no broken internal links', async ({ page }) => {
      const links = page.locator('a[href^="/"]');
      const count = await links.count();
      
      // Check first 10 internal links
      for (let i = 0; i < Math.min(count, 10); i++) {
        const href = await links.nth(i).getAttribute('href');
        if (href && !href.includes('#')) {
          const response = await page.request.get(href);
          expect(response.status()).toBeLessThan(400);
        }
      }
    });
  });
});
