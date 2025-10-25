/**
 * PERFORMILE PLATFORM - SMOKE TESTS
 * 
 * Purpose: Critical flow testing for production readiness
 * Framework: Playwright E2E Testing
 * Date: October 23, 2025
 * 
 * Tests:
 * 1. User Authentication (signup/login)
 * 2. Merchant Dashboard
 * 3. Courier Dashboard
 * 4. Order Creation
 * 5. Review System
 * 6. Analytics Display
 * 7. Week 4 Features (Service Performance & Parcel Points)
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://frontend-two-swart-31.vercel.app';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test users
const TEST_MERCHANT = {
  email: 'test-merchant@performile.com',
  password: 'TestPassword123!',
  name: 'Test Merchant'
};

const TEST_COURIER = {
  email: 'test-courier@performile.com',
  password: 'TestPassword123!',
  name: 'Test Courier'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: TEST_TIMEOUT });
}

async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('**/login', { timeout: TEST_TIMEOUT });
}

// ============================================================================
// TEST SUITE 1: AUTHENTICATION
// ============================================================================

test.describe('Authentication Tests', () => {
  
  test('should load login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Check page loaded
    await expect(page).toHaveTitle(/Performile/);
    
    // Check login form exists
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should login merchant successfully', async ({ page }) => {
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should show merchant dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should login courier successfully', async ({ page }) => {
    await login(page, TEST_COURIER.email, TEST_COURIER.password);
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Should show courier dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

});

// ============================================================================
// TEST SUITE 2: MERCHANT DASHBOARD
// ============================================================================

test.describe('Merchant Dashboard Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
  });

  test('should display dashboard metrics', async ({ page }) => {
    // Check for key metrics
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="trust-score"]')).toBeVisible();
  });

  test('should display orders table', async ({ page }) => {
    // Navigate to orders
    await page.click('[data-testid="nav-orders"]');
    await page.waitForURL('**/orders', { timeout: TEST_TIMEOUT });
    
    // Check table exists
    await expect(page.locator('table')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('th')).toContainText(['Order ID', 'Status', 'Courier']);
  });

  test('should display analytics charts', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="nav-analytics"]');
    await page.waitForURL('**/analytics', { timeout: TEST_TIMEOUT });
    
    // Check charts exist
    await expect(page.locator('[data-testid="order-trends-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('should not show console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

});

// ============================================================================
// TEST SUITE 3: COURIER DASHBOARD
// ============================================================================

test.describe('Courier Dashboard Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_COURIER.email, TEST_COURIER.password);
  });

  test('should display courier metrics', async ({ page }) => {
    // Check for courier-specific metrics
    await expect(page.locator('[data-testid="total-deliveries"]')).toBeVisible();
    await expect(page.locator('[data-testid="on-time-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="customer-rating"]')).toBeVisible();
    await expect(page.locator('[data-testid="trust-score"]')).toBeVisible();
  });

  test('should display delivery list', async ({ page }) => {
    // Navigate to deliveries
    await page.click('[data-testid="nav-deliveries"]');
    await page.waitForURL('**/deliveries', { timeout: TEST_TIMEOUT });
    
    // Check list exists
    await expect(page.locator('[data-testid="delivery-list"]')).toBeVisible();
  });

  test('should display performance analytics', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="nav-analytics"]');
    await page.waitForURL('**/analytics', { timeout: TEST_TIMEOUT });
    
    // Check performance charts
    await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
  });

});

// ============================================================================
// TEST SUITE 4: ORDER CREATION
// ============================================================================

test.describe('Order Creation Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
  });

  test('should create new order', async ({ page }) => {
    // Navigate to create order
    await page.click('[data-testid="create-order-button"]');
    
    // Fill order form
    await page.fill('input[name="recipient_name"]', 'Test Recipient');
    await page.fill('input[name="recipient_email"]', 'recipient@test.com');
    await page.fill('input[name="recipient_phone"]', '+46701234567');
    await page.fill('input[name="delivery_address"]', 'Test Street 123');
    await page.fill('input[name="postal_code"]', '12345');
    await page.fill('input[name="city"]', 'Stockholm');
    
    // Select courier
    await page.selectOption('select[name="courier_id"]', { index: 1 });
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show success message
    await expect(page.locator('[role="alert"]')).toContainText('Order created');
  });

});

// ============================================================================
// TEST SUITE 5: REVIEW SYSTEM
// ============================================================================

test.describe('Review System Tests', () => {
  
  test('should display reviews page', async ({ page }) => {
    await page.goto(`${BASE_URL}/reviews`);
    
    // Check reviews list
    await expect(page.locator('[data-testid="reviews-list"]')).toBeVisible();
  });

  test('should filter reviews by rating', async ({ page }) => {
    await page.goto(`${BASE_URL}/reviews`);
    
    // Click 5-star filter
    await page.click('[data-testid="filter-5-stars"]');
    
    // Should show only 5-star reviews
    const reviews = await page.locator('[data-testid="review-item"]').all();
    for (const review of reviews) {
      await expect(review.locator('[data-testid="rating"]')).toContainText('5');
    }
  });

});

// ============================================================================
// TEST SUITE 6: WEEK 4 - SERVICE PERFORMANCE
// ============================================================================

test.describe('Week 4: Service Performance Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
  });

  test('should display service performance cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-performance`);
    
    // Check for 3 service types
    await expect(page.locator('[data-testid="service-card-home"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-card-shop"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-card-locker"]')).toBeVisible();
  });

  test('should display service comparison chart', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-performance`);
    
    // Check chart exists
    await expect(page.locator('[data-testid="service-comparison-chart"]')).toBeVisible();
  });

  test('should display geographic heatmap', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-performance/geographic`);
    
    // Check map exists
    await expect(page.locator('[data-testid="geographic-heatmap"]')).toBeVisible();
  });

  test('should display service reviews', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-performance/reviews`);
    
    // Check reviews list
    await expect(page.locator('[data-testid="service-reviews-list"]')).toBeVisible();
  });

  test('should test service performance API', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/service-performance?action=summary&courierId=1`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('services');
  });

});

// ============================================================================
// TEST SUITE 7: WEEK 4 - PARCEL POINTS
// ============================================================================

test.describe('Week 4: Parcel Points Tests', () => {
  
  test('should display parcel point map', async ({ page }) => {
    await page.goto(`${BASE_URL}/parcel-points`);
    
    // Check map exists
    await expect(page.locator('[data-testid="parcel-point-map"]')).toBeVisible();
  });

  test('should search parcel points by postal code', async ({ page }) => {
    await page.goto(`${BASE_URL}/parcel-points`);
    
    // Enter postal code
    await page.fill('input[name="postal_code"]', '12345');
    await page.click('button[type="submit"]');
    
    // Should show results
    await expect(page.locator('[data-testid="parcel-points-list"]')).toBeVisible();
  });

  test('should display parcel point details', async ({ page }) => {
    await page.goto(`${BASE_URL}/parcel-points`);
    
    // Click first parcel point
    await page.click('[data-testid="parcel-point-item"]:first-child');
    
    // Should show details modal
    await expect(page.locator('[data-testid="parcel-point-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="opening-hours"]')).toBeVisible();
  });

  test('should check coverage', async ({ page }) => {
    await page.goto(`${BASE_URL}/parcel-points/coverage`);
    
    // Enter postal code
    await page.fill('input[name="postal_code"]', '12345');
    await page.click('button[type="submit"]');
    
    // Should show coverage status
    await expect(page.locator('[data-testid="coverage-status"]')).toBeVisible();
  });

  test('should test parcel points API', async ({ page }) => {
    const response = await page.request.get(`${BASE_URL}/api/parcel-points?action=search&postalCode=12345`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('points');
  });

});

// ============================================================================
// TEST SUITE 8: API ENDPOINTS
// ============================================================================

test.describe('API Endpoint Tests', () => {
  
  test('should test service performance APIs', async ({ page }) => {
    const endpoints = [
      '/api/service-performance?action=summary&courierId=1',
      '/api/service-performance?action=details&courierId=1&serviceType=Home',
      '/api/service-performance?action=geographic&courierId=1',
      '/api/service-performance?action=trends&courierId=1&period=30'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

  test('should test parcel points APIs', async ({ page }) => {
    const endpoints = [
      '/api/parcel-points?action=search&postalCode=12345',
      '/api/parcel-points?action=details&pointId=1',
      '/api/parcel-points?action=coverage&postalCode=12345',
      '/api/parcel-points?action=nearby&lat=59.3293&lng=18.0686&radius=5'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint}`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });

});

// ============================================================================
// TEST SUITE 9: PERFORMANCE
// ============================================================================

test.describe('Performance Tests', () => {
  
  test('should load homepage within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load dashboard within 3 seconds', async ({ page }) => {
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
    
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

});

// ============================================================================
// TEST SUITE 10: MOBILE RESPONSIVE
// ============================================================================

test.describe('Mobile Responsive Tests', () => {
  
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE
  
  test('should display mobile menu', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check mobile menu button exists
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
  });

  test('should navigate on mobile', async ({ page }) => {
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    
    // Click orders
    await page.click('[data-testid="mobile-nav-orders"]');
    
    // Should navigate to orders
    await expect(page).toHaveURL(/.*orders/);
  });

});

// ============================================================================
// TEST SUITE 11: ACCESSIBILITY
// ============================================================================

test.describe('Accessibility Tests', () => {
  
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check h1 exists
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check all images have alt text
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Tab through form
    await page.keyboard.press('Tab'); // Email field
    await page.keyboard.press('Tab'); // Password field
    await page.keyboard.press('Tab'); // Submit button
    
    // Submit button should be focused
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe('BUTTON');
  });

});
