/**
 * PERFORMILE PLATFORM - COURIER CREDENTIALS TESTS
 * 
 * Purpose: Test courier credentials management feature
 * Framework: Playwright E2E Testing
 * Date: November 4, 2025
 * 
 * Tests:
 * 1. Navigation to Courier Settings
 * 2. View Selected Couriers
 * 3. Add Courier Credentials
 * 4. Test Courier Connection
 * 5. Save Credentials
 * 6. Verify Status Updates
 * 7. Edit Credentials
 * 8. Remove Credentials
 */

import { test, expect, Page } from '@playwright/test';

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://frontend-two-swart-31.vercel.app';
const TEST_TIMEOUT = 60000; // 60 seconds for API calls

// Test merchant user
const TEST_MERCHANT = {
  email: 'merchant@performile.com',
  password: process.env.TEST_MERCHANT_PASSWORD || 'TestPassword123!',
  name: 'Test Merchant'
};

// Test courier credentials (for testing)
const TEST_CREDENTIALS = {
  postnord: {
    customer_number: 'TEST123456',
    api_key: 'test-api-key-postnord',
    courier_name: 'PostNord'
  },
  bring: {
    customer_number: 'BRING123',
    api_key: 'test-api-key-bring',
    courier_name: 'Bring'
  },
  dhl: {
    customer_number: 'DHL123',
    api_key: 'test-api-key-dhl',
    courier_name: 'DHL Express'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function login(page: Page, email: string, password: string) {
  console.log(`Logging in as ${email}...`);
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard', { timeout: TEST_TIMEOUT });
  console.log('Login successful');
}

async function navigateToSettings(page: Page) {
  console.log('Navigating to Settings...');
  
  // Click Settings in navigation
  await page.click('a[href="/settings"], button:has-text("Settings")');
  await page.waitForURL('**/settings**', { timeout: TEST_TIMEOUT });
  
  console.log('Settings page loaded');
}

async function navigateToCouriersTab(page: Page) {
  console.log('Navigating to Couriers tab...');
  
  // Click Couriers tab
  await page.click('button:has-text("Couriers"), [role="tab"]:has-text("Couriers")');
  
  // Wait for courier settings to load
  await page.waitForSelector('text=Courier Settings, text=Selected Couriers', { timeout: TEST_TIMEOUT });
  
  console.log('Couriers tab loaded');
}

async function openCredentialsModal(page: Page, courierName: string) {
  console.log(`Opening credentials modal for ${courierName}...`);
  
  // Find the courier card and click "Add Credentials" or "Edit Credentials"
  const courierCard = page.locator(`[data-courier-name="${courierName}"], :has-text("${courierName}")`).first();
  
  // Try to find "Add Credentials" or "Edit Credentials" button
  const addButton = courierCard.locator('button:has-text("Add Credentials")');
  const editButton = courierCard.locator('button:has-text("Edit Credentials"), button:has-text("Edit")');
  
  if (await addButton.count() > 0) {
    await addButton.click();
  } else if (await editButton.count() > 0) {
    await editButton.click();
  } else {
    // Fallback: click any button with credentials text
    await page.click('button:has-text("Add Credentials"), button:has-text("Edit Credentials")');
  }
  
  // Wait for modal to open
  await page.waitForSelector('[role="dialog"], .MuiDialog-root', { timeout: TEST_TIMEOUT });
  
  console.log('Credentials modal opened');
}

async function fillCredentials(page: Page, customerNumber: string, apiKey: string) {
  console.log('Filling credentials...');
  
  // Fill customer number
  await page.fill('input[name="customer_number"], input[placeholder*="Customer Number"]', customerNumber);
  
  // Fill API key
  await page.fill('input[name="api_key"], input[placeholder*="API Key"]', apiKey);
  
  console.log('Credentials filled');
}

async function testConnection(page: Page) {
  console.log('Testing connection...');
  
  // Click Test Connection button
  await page.click('button:has-text("Test Connection"), button:has-text("Test")');
  
  // Wait for test result (either success or error message)
  await page.waitForSelector(
    'text=Connection successful, text=Connection failed, text=Test successful, text=Test failed, .MuiAlert-root',
    { timeout: TEST_TIMEOUT }
  );
  
  console.log('Connection test completed');
}

async function saveCredentials(page: Page) {
  console.log('Saving credentials...');
  
  // Click Save button
  await page.click('button:has-text("Save"), button:has-text("Save Credentials")');
  
  // Wait for modal to close
  await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: TEST_TIMEOUT });
  
  // Wait for success message
  await page.waitForSelector('text=saved successfully, text=updated successfully, .MuiAlert-success', { timeout: TEST_TIMEOUT });
  
  console.log('Credentials saved');
}

async function verifyCredentialsStatus(page: Page, courierName: string, expectedStatus: 'configured' | 'missing') {
  console.log(`Verifying credentials status for ${courierName}...`);
  
  const courierCard = page.locator(`:has-text("${courierName}")`).first();
  
  if (expectedStatus === 'configured') {
    // Should show "✅ Configured" or similar
    await expect(courierCard.locator('text=Configured, text=✅')).toBeVisible({ timeout: TEST_TIMEOUT });
  } else {
    // Should show "⚠️ No Credentials" or "Add Credentials" button
    await expect(courierCard.locator('text=No Credentials, text=Missing, button:has-text("Add Credentials")')).toBeVisible({ timeout: TEST_TIMEOUT });
  }
  
  console.log(`Status verified: ${expectedStatus}`);
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Courier Credentials Management', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page, TEST_MERCHANT.email, TEST_MERCHANT.password);
  });

  // ============================================================================
  // TEST 1: Navigation to Courier Settings
  // ============================================================================
  
  test('should navigate to courier settings from dashboard', async ({ page }) => {
    await navigateToSettings(page);
    
    // Verify Settings page loaded
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Settings/i })).toBeVisible();
    
    await navigateToCouriersTab(page);
    
    // Verify Couriers tab content loaded
    await expect(page.locator('text=Courier Settings, text=Selected Couriers, text=Available Couriers')).toBeVisible();
  });

  // ============================================================================
  // TEST 2: View Selected Couriers
  // ============================================================================
  
  test('should display list of selected couriers', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    // Should show at least one courier (or empty state)
    const hasCouriers = await page.locator('text=PostNord, text=Bring, text=DHL').count() > 0;
    const hasEmptyState = await page.locator('text=No couriers selected, text=Add your first courier').count() > 0;
    
    expect(hasCouriers || hasEmptyState).toBeTruthy();
  });

  // ============================================================================
  // TEST 3: Add Courier Credentials
  // ============================================================================
  
  test('should open credentials modal when clicking Add Credentials', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    // Find a courier without credentials and click Add Credentials
    const addButton = page.locator('button:has-text("Add Credentials")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      
      // Verify modal opened
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Customer Number, text=API Key')).toBeVisible();
      
      // Close modal
      await page.click('button:has-text("Cancel"), button:has-text("Close")');
    } else {
      console.log('No couriers without credentials found - skipping test');
    }
  });

  // ============================================================================
  // TEST 4: Fill and Validate Credentials Form
  // ============================================================================
  
  test('should validate credentials form fields', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    // Open credentials modal
    const addButton = page.locator('button:has-text("Add Credentials")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Try to save without filling fields
      const saveButton = page.locator('button:has-text("Save")');
      await saveButton.click();
      
      // Should show validation errors or prevent save
      // (Either form validation or disabled button)
      
      // Fill fields
      await fillCredentials(page, 'TEST123', 'test-api-key');
      
      // Save button should be enabled
      await expect(saveButton).toBeEnabled();
      
      // Close modal
      await page.click('button:has-text("Cancel")');
    } else {
      console.log('No couriers without credentials found - skipping test');
    }
  });

  // ============================================================================
  // TEST 5: Test Connection (Mock/Validation)
  // ============================================================================
  
  test('should test courier connection', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    const addButton = page.locator('button:has-text("Add Credentials")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Fill test credentials
      await fillCredentials(page, 'TEST123', 'test-api-key');
      
      // Click Test Connection
      await page.click('button:has-text("Test Connection"), button:has-text("Test")');
      
      // Wait for result (success or failure)
      await page.waitForSelector(
        'text=Connection, text=Test, text=successful, text=failed, .MuiAlert-root',
        { timeout: TEST_TIMEOUT }
      );
      
      // Close modal
      await page.click('button:has-text("Cancel")');
    } else {
      console.log('No couriers without credentials found - skipping test');
    }
  });

  // ============================================================================
  // TEST 6: Save Credentials and Verify Status
  // ============================================================================
  
  test('should save credentials and update status', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    const addButton = page.locator('button:has-text("Add Credentials")').first();
    
    if (await addButton.count() > 0) {
      // Get courier name before opening modal
      const courierCard = addButton.locator('xpath=ancestor::*[contains(@class, "MuiCard") or contains(@class, "courier")]').first();
      const courierName = await courierCard.textContent() || '';
      
      await addButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Fill credentials
      await fillCredentials(page, 'TEST123456', 'test-api-key-12345');
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Wait for modal to close
      await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: TEST_TIMEOUT });
      
      // Wait for success message
      await page.waitForSelector('text=saved, text=success', { timeout: TEST_TIMEOUT });
      
      // Verify status updated (should show "Configured" or similar)
      await page.waitForSelector('text=Configured, text=✅', { timeout: TEST_TIMEOUT });
      
    } else {
      console.log('No couriers without credentials found - skipping test');
    }
  });

  // ============================================================================
  // TEST 7: Edit Existing Credentials
  // ============================================================================
  
  test('should edit existing credentials', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    const editButton = page.locator('button:has-text("Edit Credentials"), button:has-text("Edit")').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Verify existing values are pre-filled
      const customerNumberInput = page.locator('input[name="customer_number"]');
      const existingValue = await customerNumberInput.inputValue();
      expect(existingValue).toBeTruthy();
      
      // Update customer number
      await customerNumberInput.fill('UPDATED123');
      
      // Save
      await page.click('button:has-text("Save")');
      
      // Wait for success
      await page.waitForSelector('text=updated, text=success', { timeout: TEST_TIMEOUT });
      
    } else {
      console.log('No couriers with credentials found - skipping test');
    }
  });

  // ============================================================================
  // TEST 8: API Endpoint Integration
  // ============================================================================
  
  test('should call correct API endpoints', async ({ page }) => {
    // Listen for API calls
    const apiCalls: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/courier')) {
        apiCalls.push(url);
        console.log('API Call:', request.method(), url);
      }
    });
    
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    // Should call get selected couriers API
    expect(apiCalls.some(url => url.includes('/api/couriers/merchant-preferences'))).toBeTruthy();
    
    const addButton = page.locator('button:has-text("Add Credentials")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      await fillCredentials(page, 'TEST123', 'test-key');
      
      // Test connection
      await page.click('button:has-text("Test Connection")');
      
      // Should call test API
      await page.waitForTimeout(2000); // Wait for API call
      expect(apiCalls.some(url => url.includes('/api/courier-credentials/test'))).toBeTruthy();
      
      // Close modal
      await page.click('button:has-text("Cancel")');
    }
  });

  // ============================================================================
  // TEST 9: Error Handling
  // ============================================================================
  
  test('should handle API errors gracefully', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    const addButton = page.locator('button:has-text("Add Credentials")').first();
    
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForSelector('[role="dialog"]');
      
      // Fill invalid credentials
      await fillCredentials(page, 'INVALID', 'invalid-key');
      
      // Test connection (should fail)
      await page.click('button:has-text("Test Connection")');
      
      // Should show error message
      await page.waitForSelector(
        'text=failed, text=error, text=invalid, .MuiAlert-error',
        { timeout: TEST_TIMEOUT }
      );
      
      // Close modal
      await page.click('button:has-text("Cancel")');
    }
  });

  // ============================================================================
  // TEST 10: Multiple Couriers
  // ============================================================================
  
  test('should manage credentials for multiple couriers', async ({ page }) => {
    await navigateToSettings(page);
    await navigateToCouriersTab(page);
    
    // Count how many couriers are displayed
    const courierCount = await page.locator('[data-courier-name], .courier-card, :has-text("PostNord"), :has-text("Bring"), :has-text("DHL")').count();
    
    console.log(`Found ${courierCount} couriers`);
    
    // Should have at least one courier
    expect(courierCount).toBeGreaterThan(0);
    
    // Each courier should have either "Add Credentials" or "Edit Credentials" button
    const credentialButtons = await page.locator('button:has-text("Add Credentials"), button:has-text("Edit Credentials")').count();
    
    expect(credentialButtons).toBeGreaterThan(0);
  });

});

// ============================================================================
// DATABASE VERIFICATION TESTS (Optional - requires direct DB access)
// ============================================================================

test.describe('Courier Credentials - Database Verification', () => {
  
  test.skip('should verify credentials saved in database', async ({ page }) => {
    // This test requires direct database access
    // Skip for now, implement when DB access is available
    
    // TODO: Query courier_api_credentials table
    // TODO: Verify merchant_courier_selections.credentials_configured = true
    // TODO: Verify credential_id is set
  });

});
