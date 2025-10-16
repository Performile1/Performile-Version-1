// Merchant Role Frontend Audit Test
// This script will automatically test all merchant features

const { test, expect } = require('@playwright/test');

test.describe('Merchant Role Audit', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('https://frontend-two-swart-31.vercel.app/#/login');
    
    // Fill login form
    await page.fill('input[type="email"]', 'merchant@performile.com');
    await page.fill('input[type="password"]', 'Test1234!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
  });

  test('1. Login and Dashboard', async ({ page }) => {
    console.log('\n=== TESTING: Login & Dashboard ===');
    
    // Check if we're logged in
    const url = page.url();
    console.log('Current URL:', url);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'screenshots/01-dashboard.png',
      fullPage: true 
    });
    
    // Check for errors
    const errors = await page.locator('.error, .alert-danger, [role="alert"]').count();
    console.log('Errors found:', errors);
    
    console.log('✅ Dashboard test complete');
  });

  test('2. Navigation Menu Items', async ({ page }) => {
    console.log('\n=== TESTING: Navigation Menu ===');
    
    // Material-UI uses ListItemButton, not <a> tags!
    const navButtons = await page.locator('.MuiListItemButton-root').all();
    
    console.log(`Found ${navButtons.length} navigation buttons`);
    
    if (navButtons.length > 0) {
      console.log('\nNavigation Menu Items:');
      
      const menuItems = [];
      
      // Only check visible buttons to avoid timeout
      for (let i = 0; i < Math.min(navButtons.length, 20); i++) {
        const button = navButtons[i];
        
        try {
          const isVisible = await button.isVisible({ timeout: 1000 });
          if (isVisible) {
            const text = await button.textContent({ timeout: 1000 });
            if (text && text.trim()) {
              menuItems.push(text.trim());
              console.log(`  ${menuItems.length}. ${text.trim()}`);
            }
          }
        } catch (e) {
          // Skip buttons that timeout (hidden/loading)
          continue;
        }
      }
      
      console.log(`\nTotal visible menu items: ${menuItems.length}`);
    } else {
      console.log('⚠️ No navigation buttons found. Taking screenshot...');
      await page.screenshot({ path: 'screenshots/debug-navigation.png', fullPage: true });
    }
    
    console.log('✅ Navigation menu documented');
  });

  test('3. Test All Pages', async ({ page }) => {
    console.log('\n=== TESTING: All Pages ===');
    
    // Get all navigation links
    const navLinks = await page.locator('nav a, .sidebar a, .menu a').all();
    
    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const text = await link.textContent();
      const pageName = text?.trim() || `page-${i}`;
      
      console.log(`\nTesting: ${pageName}`);
      
      try {
        // Click the link
        await link.click();
        await page.waitForTimeout(1500);
        
        // Get current URL
        const url = page.url();
        console.log(`  URL: ${url}`);
        
        // Check for errors
        const errorElements = await page.locator('.error, .alert-danger, [role="alert"]').all();
        console.log(`  Errors: ${errorElements.length}`);
        
        // Check for empty states
        const emptyStates = await page.locator('text=/no data|empty|no results/i').count();
        console.log(`  Empty states: ${emptyStates}`);
        
        // Take screenshot
        const filename = pageName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await page.screenshot({ 
          path: `screenshots/${filename}.png`,
          fullPage: true 
        });
        
        console.log(`  ✅ Screenshot saved: ${filename}.png`);
        
      } catch (error) {
        console.log(`  ❌ ERROR: ${error.message}`);
      }
    }
    
    console.log('\n✅ All pages tested');
  });

  test('4. Console Errors', async ({ page }) => {
    console.log('\n=== TESTING: Console Errors ===');
    
    const consoleErrors = [];
    const networkErrors = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Listen for network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Navigate through a few pages
    const testPages = ['#/dashboard', '#/orders', '#/trustscores'];
    
    for (const pagePath of testPages) {
      await page.goto(`https://frontend-two-swart-31.vercel.app/${pagePath}`);
      await page.waitForTimeout(2000);
    }
    
    // Report errors
    console.log('\nConsole Errors:', consoleErrors.length);
    consoleErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    
    console.log('\nNetwork Errors:', networkErrors.length);
    networkErrors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error.status} ${error.statusText} - ${error.url}`);
    });
    
    console.log('\n✅ Error check complete');
  });

  test('5. Test Forms and Buttons', async ({ page }) => {
    console.log('\n=== TESTING: Forms and Buttons ===');
    
    // Find all buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const isVisible = await button.isVisible();
      const isEnabled = await button.isEnabled();
      
      console.log(`  ${i + 1}. "${text?.trim()}" - Visible: ${isVisible}, Enabled: ${isEnabled}`);
    }
    
    // Find all input fields
    const inputs = await page.locator('input').all();
    console.log(`\nFound ${inputs.length} input fields`);
    
    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
      const input = inputs[i];
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      
      console.log(`  ${i + 1}. Type: ${type}, Placeholder: ${placeholder}`);
    }
    
    console.log('\n✅ Forms and buttons documented');
  });

});
