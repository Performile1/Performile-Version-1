// Playwright Configuration
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  timeout: 60000,
  retries: 1,
  
  use: {
    baseURL: 'https://frontend-two-swart-31.vercel.app',
    headless: false, // Show browser
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],
});
