# Tomorrow's Testing Plan - October 17, 2025
**Focus:** Comprehensive E2E Testing with Playwright  
**Priority:** High  
**Estimated Time:** 6-8 hours

---

## OBJECTIVES

### Primary Goals:
1. ✅ Set up Playwright testing infrastructure with console/network/API recording
2. ✅ Create E2E tests for all user roles (Admin, Merchant, Courier, Consumer)
3. ✅ Test critical user flows end-to-end
4. ✅ Record and analyze console errors, network requests, and API calls
5. ✅ Validate API responses and status codes
6. ✅ Generate comprehensive test reports with API call logs

### Success Criteria:
- [ ] All 4 user roles tested
- [ ] 20+ E2E test scenarios passing
- [ ] Console logs captured for debugging
- [ ] Network requests monitored and validated
- [ ] API calls recorded with request/response data
- [ ] API response times measured
- [ ] Test reports generated with screenshots and API logs
- [ ] CI/CD pipeline ready for automated testing

---

## TEST USERS

### Available Test Accounts:

| Role | Email | Password | User ID |
|------|-------|----------|---------|
| **Admin** | admin@performile.com | Test1234! | TBD |
| **Merchant** | merchant@performile.com | Test1234! | TBD |
| **Courier** | courier@performile.com | Test1234! | TBD |
| **Consumer** | consumer@performile.com | Test1234! | TBD |

**Database:** `ukeikwsmpofydmelrslq` (Supabase)  
**Base URL:** `https://performile-platform-main.vercel.app`

---

## PHASE 1: SETUP & CONFIGURATION (1 hour)

### 1.1 Install & Configure Playwright

**Tasks:**
- [ ] Verify Playwright installation in `e2e-tests/`
- [ ] Update `playwright.config.ts` with proper settings
- [ ] Configure test reporters (HTML, JSON, JUnit)
- [ ] Set up video recording for failed tests
- [ ] Enable trace recording for debugging

**Configuration:**

```typescript
// e2e-tests/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list']
  ],
  
  use: {
    baseURL: 'https://performile-platform-main.vercel.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Console and Network Recording
    launchOptions: {
      args: ['--enable-logging'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### 1.2 Create Test Utilities

**Files to Create:**
- [ ] `e2e-tests/utils/auth.ts` - Login helpers
- [ ] `e2e-tests/utils/console-logger.ts` - Console capture
- [ ] `e2e-tests/utils/network-logger.ts` - Network monitoring
- [ ] `e2e-tests/utils/api-logger.ts` - API call recording & validation
- [ ] `e2e-tests/utils/test-data.ts` - Test data generators
- [ ] `e2e-tests/fixtures/users.ts` - User credentials

**Example: Console Logger**

```typescript
// e2e-tests/utils/console-logger.ts
import { Page } from '@playwright/test';

export class ConsoleLogger {
  private logs: Array<{ type: string; message: string; timestamp: Date }> = [];

  constructor(private page: Page) {
    this.setupListeners();
  }

  private setupListeners() {
    this.page.on('console', msg => {
      this.logs.push({
        type: msg.type(),
        message: msg.text(),
        timestamp: new Date()
      });
    });

    this.page.on('pageerror', error => {
      this.logs.push({
        type: 'error',
        message: error.message,
        timestamp: new Date()
      });
    });
  }

  getLogs() {
    return this.logs;
  }

  getErrors() {
    return this.logs.filter(log => log.type === 'error');
  }

  getWarnings() {
    return this.logs.filter(log => log.type === 'warning');
  }

  clear() {
    this.logs = [];
  }

  printSummary() {
    console.log('\n=== Console Summary ===');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Errors: ${this.getErrors().length}`);
    console.log(`Warnings: ${this.getWarnings().length}`);
    
    if (this.getErrors().length > 0) {
      console.log('\n=== Errors ===');
      this.getErrors().forEach(log => {
        console.log(`[${log.timestamp.toISOString()}] ${log.message}`);
      });
    }
  }
}
```

**Example: Network Logger**

```typescript
// e2e-tests/utils/network-logger.ts
import { Page, Request, Response } from '@playwright/test';

export class NetworkLogger {
  private requests: Array<{
    url: string;
    method: string;
    status?: number;
    duration?: number;
    timestamp: Date;
  }> = [];

  constructor(private page: Page) {
    this.setupListeners();
  }

  private setupListeners() {
    this.page.on('request', request => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date()
      });
    });

    this.page.on('response', response => {
      const request = this.requests.find(r => r.url === response.url());
      if (request) {
        request.status = response.status();
      }
    });
  }

  getRequests() {
    return this.requests;
  }

  getAPIRequests() {
    return this.requests.filter(r => r.url.includes('/api/'));
  }

  getFailedRequests() {
    return this.requests.filter(r => r.status && r.status >= 400);
  }

  clear() {
    this.requests = [];
  }

  printSummary() {
    console.log('\n=== Network Summary ===');
    console.log(`Total requests: ${this.requests.length}`);
    console.log(`API requests: ${this.getAPIRequests().length}`);
    console.log(`Failed requests: ${this.getFailedRequests().length}`);
    
    if (this.getFailedRequests().length > 0) {
      console.log('\n=== Failed Requests ===');
      this.getFailedRequests().forEach(req => {
        console.log(`[${req.status}] ${req.method} ${req.url}`);
      });
    }
  }
}
```

**Example: API Logger**

```typescript
// e2e-tests/utils/api-logger.ts
import { Page, Route } from '@playwright/test';
import * as fs from 'fs/promises';

interface APICall {
  id: string;
  endpoint: string;
  method: string;
  requestHeaders: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  duration?: number;
  timestamp: Date;
  error?: string;
}

export class APILogger {
  private apiCalls: APICall[] = [];
  private callCounter = 0;

  constructor(private page: Page) {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Intercept all API requests
    this.page.route('**/api/**', async (route: Route) => {
      const request = route.request();
      const callId = `api-${++this.callCounter}`;
      const startTime = Date.now();

      // Record request
      const apiCall: APICall = {
        id: callId,
        endpoint: this.extractEndpoint(request.url()),
        method: request.method(),
        requestHeaders: request.headers(),
        requestBody: this.parseBody(request.postData()),
        timestamp: new Date()
      };

      try {
        // Continue with the request
        const response = await route.fetch();
        const endTime = Date.now();

        // Record response
        apiCall.responseStatus = response.status();
        apiCall.responseHeaders = response.headers();
        apiCall.responseBody = await this.parseResponse(response);
        apiCall.duration = endTime - startTime;

        // Fulfill the route with the response
        await route.fulfill({ response });
      } catch (error) {
        apiCall.error = error.message;
        await route.abort();
      }

      this.apiCalls.push(apiCall);
    });
  }

  private extractEndpoint(url: string): string {
    const match = url.match(/\/api\/(.+?)(?:\?|$)/);
    return match ? `/api/${match[1]}` : url;
  }

  private parseBody(body: string | null): any {
    if (!body) return null;
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  private async parseResponse(response: any): Promise<any> {
    try {
      const text = await response.text();
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  // Get all API calls
  getAPICalls(): APICall[] {
    return this.apiCalls;
  }

  // Get calls by endpoint
  getCallsByEndpoint(endpoint: string): APICall[] {
    return this.apiCalls.filter(call => call.endpoint.includes(endpoint));
  }

  // Get calls by method
  getCallsByMethod(method: string): APICall[] {
    return this.apiCalls.filter(call => call.method === method);
  }

  // Get failed calls (4xx, 5xx)
  getFailedCalls(): APICall[] {
    return this.apiCalls.filter(call => 
      call.responseStatus && call.responseStatus >= 400
    );
  }

  // Get slow calls (>1s)
  getSlowCalls(threshold: number = 1000): APICall[] {
    return this.apiCalls.filter(call => 
      call.duration && call.duration > threshold
    );
  }

  // Validate specific API call
  validateCall(endpoint: string, expectedStatus: number): boolean {
    const call = this.apiCalls.find(c => c.endpoint.includes(endpoint));
    return call?.responseStatus === expectedStatus;
  }

  // Get average response time
  getAverageResponseTime(): number {
    const callsWithDuration = this.apiCalls.filter(c => c.duration);
    if (callsWithDuration.length === 0) return 0;
    
    const total = callsWithDuration.reduce((sum, c) => sum + (c.duration || 0), 0);
    return total / callsWithDuration.length;
  }

  // Clear logs
  clear() {
    this.apiCalls = [];
    this.callCounter = 0;
  }

  // Print summary
  printSummary() {
    console.log('\n=== API Calls Summary ===');
    console.log(`Total API calls: ${this.apiCalls.length}`);
    console.log(`Failed calls: ${this.getFailedCalls().length}`);
    console.log(`Slow calls (>1s): ${this.getSlowCalls().length}`);
    console.log(`Average response time: ${this.getAverageResponseTime().toFixed(2)}ms`);

    // Group by endpoint
    const byEndpoint = this.groupByEndpoint();
    console.log('\n=== Calls by Endpoint ===');
    Object.entries(byEndpoint).forEach(([endpoint, calls]) => {
      console.log(`${endpoint}: ${calls.length} calls`);
    });

    // Show failed calls
    if (this.getFailedCalls().length > 0) {
      console.log('\n=== Failed API Calls ===');
      this.getFailedCalls().forEach(call => {
        console.log(`[${call.responseStatus}] ${call.method} ${call.endpoint}`);
        if (call.responseBody?.message) {
          console.log(`  Error: ${call.responseBody.message}`);
        }
      });
    }

    // Show slow calls
    if (this.getSlowCalls().length > 0) {
      console.log('\n=== Slow API Calls (>1s) ===');
      this.getSlowCalls().forEach(call => {
        console.log(`[${call.duration}ms] ${call.method} ${call.endpoint}`);
      });
    }
  }

  private groupByEndpoint(): Record<string, APICall[]> {
    return this.apiCalls.reduce((acc, call) => {
      if (!acc[call.endpoint]) {
        acc[call.endpoint] = [];
      }
      acc[call.endpoint].push(call);
      return acc;
    }, {} as Record<string, APICall[]>);
  }

  // Export to JSON file
  async exportToFile(filename: string) {
    const data = {
      summary: {
        totalCalls: this.apiCalls.length,
        failedCalls: this.getFailedCalls().length,
        slowCalls: this.getSlowCalls().length,
        averageResponseTime: this.getAverageResponseTime()
      },
      calls: this.apiCalls
    };

    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    console.log(`\nAPI logs exported to: ${filename}`);
  }

  // Generate detailed report
  generateReport(): string {
    let report = '# API Call Report\n\n';
    
    report += `## Summary\n`;
    report += `- Total API Calls: ${this.apiCalls.length}\n`;
    report += `- Failed Calls: ${this.getFailedCalls().length}\n`;
    report += `- Slow Calls (>1s): ${this.getSlowCalls().length}\n`;
    report += `- Average Response Time: ${this.getAverageResponseTime().toFixed(2)}ms\n\n`;

    report += `## Calls by Endpoint\n`;
    Object.entries(this.groupByEndpoint()).forEach(([endpoint, calls]) => {
      report += `- ${endpoint}: ${calls.length} calls\n`;
    });

    report += `\n## All API Calls\n`;
    this.apiCalls.forEach((call, index) => {
      report += `\n### ${index + 1}. ${call.method} ${call.endpoint}\n`;
      report += `- Status: ${call.responseStatus || 'N/A'}\n`;
      report += `- Duration: ${call.duration || 'N/A'}ms\n`;
      report += `- Timestamp: ${call.timestamp.toISOString()}\n`;
      
      if (call.requestBody) {
        report += `- Request Body: \`\`\`json\n${JSON.stringify(call.requestBody, null, 2)}\n\`\`\`\n`;
      }
      
      if (call.responseBody) {
        report += `- Response Body: \`\`\`json\n${JSON.stringify(call.responseBody, null, 2)}\n\`\`\`\n`;
      }

      if (call.error) {
        report += `- Error: ${call.error}\n`;
      }
    });

    return report;
  }
}
```

---

## PHASE 2: AUTHENTICATION TESTS (1 hour)

### 2.1 Login Flow Tests

**Test File:** `e2e-tests/tests/auth/login.spec.ts`

**Test Cases:**
- [ ] Admin login with valid credentials
- [ ] Merchant login with valid credentials
- [ ] Courier login with valid credentials
- [ ] Consumer login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Login with empty fields
- [ ] Login redirects to correct dashboard
- [ ] JWT token stored in localStorage
- [ ] Refresh token functionality

**Example Test:**

```typescript
import { test, expect } from '@playwright/test';
import { ConsoleLogger } from '../utils/console-logger';
import { NetworkLogger } from '../utils/network-logger';
import { APILogger } from '../utils/api-logger';

test.describe('Authentication - Login', () => {
  let consoleLogger: ConsoleLogger;
  let networkLogger: NetworkLogger;
  let apiLogger: APILogger;

  test.beforeEach(async ({ page }) => {
    consoleLogger = new ConsoleLogger(page);
    networkLogger = new NetworkLogger(page);
    apiLogger = new APILogger(page);
    await page.goto('/');
  });

  test.afterEach(async ({ page }, testInfo) => {
    consoleLogger.printSummary();
    networkLogger.printSummary();
    apiLogger.printSummary();
    
    // Export API logs to file
    const testName = testInfo.title.replace(/\s+/g, '-');
    await apiLogger.exportToFile(`api-logs/${testName}.json`);
  });

  test('Admin can login successfully', async ({ page }) => {
    // Navigate to login
    await page.click('text=Login');
    
    // Fill credentials
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL('**/dashboard');
    
    // Verify dashboard loaded
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verify token stored
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
    
    // Verify no console errors
    expect(consoleLogger.getErrors().length).toBe(0);
    
    // Verify login API call succeeded
    const loginRequest = networkLogger.getAPIRequests()
      .find(r => r.url.includes('/api/auth/login'));
    expect(loginRequest?.status).toBe(200);
    
    // Verify API call details
    expect(apiLogger.validateCall('/api/auth/login', 200)).toBe(true);
    const loginCall = apiLogger.getCallsByEndpoint('/api/auth/login')[0];
    expect(loginCall.requestBody).toHaveProperty('email', 'admin@performile.com');
    expect(loginCall.responseBody).toHaveProperty('access_token');
    expect(loginCall.responseBody).toHaveProperty('user');
    expect(loginCall.duration).toBeLessThan(1000); // Should respond in <1s
  });

  test('Merchant can login successfully', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'merchant@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verify merchant-specific content
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Store Settings')).toBeVisible();
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Verify failed API call
    const loginRequest = networkLogger.getAPIRequests()
      .find(r => r.url.includes('/api/auth/login'));
    expect(loginRequest?.status).toBe(401);
  });
});
```

### 2.2 Registration Flow Tests

**Test File:** `e2e-tests/tests/auth/register.spec.ts`

**Test Cases:**
- [ ] Register new merchant account
- [ ] Register new courier account
- [ ] Register new consumer account
- [ ] Email validation
- [ ] Password strength validation
- [ ] Duplicate email handling
- [ ] Required fields validation

---

## PHASE 3: ADMIN ROLE TESTS (1.5 hours)

### 3.1 Admin Dashboard Tests

**Test File:** `e2e-tests/tests/admin/dashboard.spec.ts`

**Test Cases:**
- [ ] Dashboard loads with correct statistics
- [ ] Total users count displayed
- [ ] Total orders count displayed
- [ ] Revenue metrics visible
- [ ] Charts render correctly
- [ ] Recent activity list loads
- [ ] No console errors on load

### 3.2 User Management Tests

**Test File:** `e2e-tests/tests/admin/users.spec.ts`

**Test Cases:**
- [ ] View all users list
- [ ] Filter users by role
- [ ] Search users by email
- [ ] View user details
- [ ] Activate/deactivate user
- [ ] Delete user (with confirmation)
- [ ] Pagination works correctly

### 3.3 Courier Management Tests

**Test File:** `e2e-tests/tests/admin/couriers.spec.ts`

**Test Cases:**
- [ ] View all couriers
- [ ] Add new courier
- [ ] Edit courier details
- [ ] Activate/deactivate courier
- [ ] Delete courier
- [ ] View courier performance metrics

### 3.4 Merchant Management Tests

**Test File:** `e2e-tests/tests/admin/merchants.spec.ts`

**Test Cases:**
- [ ] View all merchants
- [ ] View merchant details
- [ ] View merchant orders
- [ ] Activate/deactivate merchant
- [ ] View merchant analytics

---

## PHASE 4: MERCHANT ROLE TESTS (1.5 hours)

### 4.1 Merchant Dashboard Tests

**Test File:** `e2e-tests/tests/merchant/dashboard.spec.ts`

**Test Cases:**
- [ ] Dashboard shows merchant-specific stats
- [ ] Total orders count
- [ ] Pending orders count
- [ ] Revenue metrics
- [ ] Recent orders list
- [ ] Performance charts

### 4.2 Order Management Tests

**Test File:** `e2e-tests/tests/merchant/orders.spec.ts`

**Test Cases:**
- [ ] View all orders (merchant's only)
- [ ] Filter orders by status
- [ ] Search orders by tracking number
- [ ] View order details
- [ ] Create new order
- [ ] Update order status
- [ ] Assign courier to order
- [ ] Cancel order
- [ ] Export orders to CSV

**Example Test:**

```typescript
test('Merchant can create new order', async ({ page }) => {
  const consoleLogger = new ConsoleLogger(page);
  const networkLogger = new NetworkLogger(page);
  
  // Login as merchant
  await page.goto('/login');
  await page.fill('input[name="email"]', 'merchant@performile.com');
  await page.fill('input[name="password"]', 'Test1234!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // Navigate to orders
  await page.click('text=Orders');
  await page.waitForURL('**/orders');
  
  // Click create order
  await page.click('button:has-text("Create Order")');
  
  // Fill order form
  await page.fill('input[name="customer_email"]', 'customer@example.com');
  await page.fill('input[name="customer_name"]', 'John Doe');
  await page.fill('input[name="delivery_address"]', '123 Main St');
  await page.fill('input[name="postal_code"]', '12345');
  await page.fill('input[name="city"]', 'Stockholm');
  await page.selectOption('select[name="courier_id"]', { index: 1 });
  await page.fill('input[name="package_weight"]', '2.5');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page.locator('text=Order created successfully')).toBeVisible();
  
  // Verify API call
  const createRequest = networkLogger.getAPIRequests()
    .find(r => r.url.includes('/api/orders') && r.method === 'POST');
  expect(createRequest?.status).toBe(201);
  
  // Verify no errors
  expect(consoleLogger.getErrors().length).toBe(0);
  
  consoleLogger.printSummary();
  networkLogger.printSummary();
});
```

### 4.3 Store Settings Tests

**Test File:** `e2e-tests/tests/merchant/settings.spec.ts`

**Test Cases:**
- [ ] View store details
- [ ] Update store name
- [ ] Update contact information
- [ ] Upload store logo
- [ ] Update business hours
- [ ] Save changes successfully

---

## PHASE 5: COURIER ROLE TESTS (1 hour)

### 5.1 Courier Dashboard Tests

**Test File:** `e2e-tests/tests/courier/dashboard.spec.ts`

**Test Cases:**
- [ ] Dashboard shows courier-specific stats
- [ ] Assigned orders count
- [ ] Completed deliveries count
- [ ] On-time delivery rate
- [ ] Customer rating
- [ ] Upcoming deliveries list

### 5.2 Delivery Management Tests

**Test File:** `e2e-tests/tests/courier/deliveries.spec.ts`

**Test Cases:**
- [ ] View assigned orders
- [ ] Filter by delivery status
- [ ] View delivery details
- [ ] Update delivery status
- [ ] Mark as picked up
- [ ] Mark as in transit
- [ ] Mark as delivered
- [ ] Add delivery notes
- [ ] Upload proof of delivery

### 5.3 Fleet Management Tests

**Test File:** `e2e-tests/tests/courier/fleet.spec.ts`

**Test Cases:**
- [ ] View fleet vehicles
- [ ] Add new vehicle
- [ ] Update vehicle status
- [ ] Assign driver to vehicle
- [ ] View vehicle location (if tracking enabled)

---

## PHASE 6: CONSUMER ROLE TESTS (1 hour)

### 6.1 Order Tracking Tests

**Test File:** `e2e-tests/tests/consumer/tracking.spec.ts`

**Test Cases:**
- [ ] Search order by tracking number
- [ ] View order status
- [ ] View delivery timeline
- [ ] View courier information
- [ ] View estimated delivery time
- [ ] Receive status updates

### 6.2 Review Submission Tests

**Test File:** `e2e-tests/tests/consumer/reviews.spec.ts`

**Test Cases:**
- [ ] View delivered orders
- [ ] Submit review for order
- [ ] Rate delivery speed
- [ ] Rate package condition
- [ ] Rate communication
- [ ] Add review text
- [ ] Submit review successfully
- [ ] View submitted reviews

---

## PHASE 7: CROSS-CUTTING TESTS (1 hour)

### 7.1 Navigation Tests

**Test File:** `e2e-tests/tests/common/navigation.spec.ts`

**Test Cases:**
- [ ] All navigation links work
- [ ] Breadcrumbs display correctly
- [ ] Back button works
- [ ] Role-based menu items visible
- [ ] Logout works correctly

### 7.2 Responsive Design Tests

**Test File:** `e2e-tests/tests/common/responsive.spec.ts`

**Test Cases:**
- [ ] Mobile viewport (375x667)
- [ ] Tablet viewport (768x1024)
- [ ] Desktop viewport (1920x1080)
- [ ] Menu collapses on mobile
- [ ] Tables scroll horizontally on mobile

### 7.3 Performance Tests

**Test File:** `e2e-tests/tests/common/performance.spec.ts`

**Test Cases:**
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks
- [ ] Bundle size acceptable
- [ ] Images optimized

---

## PHASE 8: REPORTING & ANALYSIS (30 minutes)

### 8.1 Generate Test Reports

**Tasks:**
- [ ] Run all tests with `npx playwright test`
- [ ] Generate HTML report: `npx playwright show-report`
- [ ] Export JSON results for analysis
- [ ] Create test coverage summary

### 8.2 Analyze Results

**Analysis Points:**
- [ ] Total tests run
- [ ] Pass/fail ratio
- [ ] Average test duration
- [ ] Console errors found
- [ ] Network errors found
- [ ] API call statistics (total, failed, slow)
- [ ] API response times (average, min, max)
- [ ] Performance bottlenecks
- [ ] Browser compatibility issues

### 8.3 Create Summary Document

**File:** `e2e-tests/TEST_RESULTS_SUMMARY.md`

**Include:**
- Test execution date/time
- Total tests: X passed, Y failed
- Console errors summary
- Network errors summary
- API call statistics and performance
- API endpoints tested
- Failed API calls with details
- Performance metrics
- Screenshots of failures
- Recommendations for fixes

---

## CONSOLE & NETWORK RECORDING STRATEGY

### Console Monitoring:

**What to Capture:**
- ✅ All console.log messages
- ✅ console.warn messages
- ✅ console.error messages
- ✅ Unhandled promise rejections
- ✅ Page errors
- ✅ Resource loading errors

**Storage:**
```typescript
// Save to file after each test
test.afterEach(async ({ page }, testInfo) => {
  const logs = consoleLogger.getLogs();
  const logFile = `logs/${testInfo.title.replace(/\s+/g, '-')}.json`;
  await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
});
```

### Network Monitoring:

**What to Capture:**
- ✅ All HTTP requests
- ✅ Request method and URL
- ✅ Response status codes
- ✅ Response times
- ✅ Failed requests (4xx, 5xx)
- ✅ API endpoints called
- ✅ Request/response headers
- ✅ Request/response bodies (for API calls)

**HAR File Export:**
```typescript
// Record network traffic
const context = await browser.newContext({
  recordHar: { path: 'network-logs/test.har' }
});
```

### API Call Recording:

**What to Capture:**
- ✅ All API requests (/api/**)
- ✅ Request method, endpoint, headers
- ✅ Request body (JSON payload)
- ✅ Response status code
- ✅ Response headers
- ✅ Response body (JSON data)
- ✅ Response time (duration in ms)
- ✅ Timestamp of each call
- ✅ Errors/failures

**Validation:**
```typescript
// Validate API responses
test('API validation example', async ({ page }) => {
  const apiLogger = new APILogger(page);
  
  // Perform action that triggers API call
  await page.click('button:has-text("Load Data")');
  
  // Validate the API call
  expect(apiLogger.validateCall('/api/orders', 200)).toBe(true);
  
  // Check response structure
  const ordersCall = apiLogger.getCallsByEndpoint('/api/orders')[0];
  expect(ordersCall.responseBody).toHaveProperty('data');
  expect(ordersCall.responseBody.data).toBeInstanceOf(Array);
  
  // Check performance
  expect(ordersCall.duration).toBeLessThan(500);
  
  // Check no failed calls
  expect(apiLogger.getFailedCalls().length).toBe(0);
});
```

**Export & Reporting:**
```typescript
// After each test, export API logs
test.afterEach(async ({ page }, testInfo) => {
  const testName = testInfo.title.replace(/\s+/g, '-');
  
  // Export to JSON
  await apiLogger.exportToFile(`api-logs/${testName}.json`);
  
  // Generate markdown report
  const report = apiLogger.generateReport();
  await fs.writeFile(`api-reports/${testName}.md`, report);
  
  // Print summary to console
  apiLogger.printSummary();
});
```

---

## TEST DATA MANAGEMENT

### Test Data Strategy:

**Approach:**
1. Use existing test users (don't create new ones)
2. Create test orders that can be cleaned up
3. Use unique identifiers for test data
4. Clean up after tests (optional)

**Test Data File:**

```typescript
// e2e-tests/fixtures/test-data.ts
export const TEST_USERS = {
  admin: {
    email: 'admin@performile.com',
    password: 'Test1234!',
    role: 'admin'
  },
  merchant: {
    email: 'merchant@performile.com',
    password: 'Test1234!',
    role: 'merchant'
  },
  courier: {
    email: 'courier@performile.com',
    password: 'Test1234!',
    role: 'courier'
  },
  consumer: {
    email: 'consumer@performile.com',
    password: 'Test1234!',
    role: 'consumer'
  }
};

export const TEST_ORDER = {
  customer_email: 'test@example.com',
  customer_name: 'Test Customer',
  delivery_address: '123 Test Street',
  postal_code: '12345',
  city: 'Stockholm',
  country: 'Sweden',
  package_weight: 2.5,
  package_dimensions: '30x20x10'
};
```

---

## CI/CD INTEGRATION

### GitHub Actions Workflow:

**File:** `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
      
      - name: Install dependencies
        run: |
          cd e2e-tests
          npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Run tests
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
      
      - name: Upload console logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: console-logs
          path: logs/
```

---

## SUCCESS METRICS

### Quantitative Metrics:
- [ ] 100% of critical user flows tested
- [ ] 95%+ test pass rate
- [ ] < 5 console errors across all tests
- [ ] < 2% failed network requests
- [ ] All tests complete in < 10 minutes

### Qualitative Metrics:
- [ ] Tests are maintainable and readable
- [ ] Console logs provide useful debugging info
- [ ] Network logs help identify performance issues
- [ ] Reports are easy to understand
- [ ] Tests can run in CI/CD

---

## DELIVERABLES

### End of Day:
1. ✅ **Test Suite** - 20+ E2E tests covering all roles
2. ✅ **Test Report** - HTML report with results
3. ✅ **Console Logs** - JSON files with console output
4. ✅ **Network Logs** - HAR files with network traffic
5. ✅ **Summary Document** - Test results and recommendations
6. ✅ **CI/CD Pipeline** - GitHub Actions workflow ready

---

## TIMELINE

| Time | Task | Duration |
|------|------|----------|
| 09:00 - 10:00 | Setup & Configuration | 1h |
| 10:00 - 11:00 | Authentication Tests | 1h |
| 11:00 - 12:30 | Admin Role Tests | 1.5h |
| 12:30 - 13:30 | Lunch Break | 1h |
| 13:30 - 15:00 | Merchant Role Tests | 1.5h |
| 15:00 - 16:00 | Courier Role Tests | 1h |
| 16:00 - 17:00 | Consumer Role Tests | 1h |
| 17:00 - 18:00 | Cross-cutting Tests | 1h |
| 18:00 - 18:30 | Reporting & Analysis | 30min |

**Total:** 8 hours

---

## RISKS & MITIGATION

### Potential Issues:

1. **Flaky Tests:**
   - Mitigation: Use proper waits, not timeouts
   - Add retry logic for network-dependent tests

2. **Test Data Conflicts:**
   - Mitigation: Use unique identifiers
   - Clean up test data after runs

3. **Environment Issues:**
   - Mitigation: Verify deployment is stable first
   - Have fallback to staging environment

4. **Performance:**
   - Mitigation: Run tests sequentially
   - Use test.describe.serial for dependent tests

---

## NOTES

- **Database:** Ensure correct database (`ukeikwsmpofydmelrslq`) is configured in Vercel
- **Environment:** Tests run against production deployment
- **Credentials:** Test users must exist in database
- **Cleanup:** Consider if test data should be cleaned up after tests
- **Screenshots:** Automatically captured on failure
- **Videos:** Recorded for failed tests only

---

**End of Plan**  
**Prepared by:** AI Assistant  
**Date:** October 16, 2025, 11:58 PM UTC+2  
**Next Review:** After test execution on October 17, 2025
