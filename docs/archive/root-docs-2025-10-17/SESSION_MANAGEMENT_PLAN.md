# Session Management Testing & Implementation Plan
**Date:** October 17, 2025, 8:22 AM  
**Issue:** Sessions persist indefinitely - need 30-minute expiration  
**Priority:** HIGH - Security & UX concern

---

## 🔴 CURRENT PROBLEM

### **Issue Identified:**
- ✅ Users remain logged in indefinitely
- ✅ Sessions persist across browser sessions (localStorage)
- ❌ No automatic logout after inactivity
- ❌ No session expiration time
- ❌ Security risk - stale sessions never expire

### **Expected Behavior:**
- ✅ Sessions should expire after 30 minutes of inactivity
- ✅ Users should be automatically logged out
- ✅ Redirect to login page with "Session expired" message
- ✅ Refresh tokens should be used for active users

---

## 🎯 REQUIREMENTS

### **1. Session Timeout: 30 Minutes**
- Inactivity timeout: 30 minutes
- Activity tracking: Mouse movement, clicks, keyboard input
- Warning before expiration: 2 minutes warning
- Auto-logout on expiration

### **2. Token Management**
- Access token: Short-lived (15 minutes)
- Refresh token: Longer-lived (7 days)
- Automatic refresh when access token expires
- Secure storage (httpOnly cookies for refresh tokens)

### **3. User Experience**
- Show countdown timer before logout
- "Extend session" button in warning modal
- Clear error message on expired session
- Preserve user's intended destination for redirect after re-login

---

## 🔧 IMPLEMENTATION PLAN

### **Phase 1: Backend Changes**

#### **1.1 Update JWT Configuration**

**File:** `backend/src/middleware/auth.ts`

```typescript
// Current (needs update):
const ACCESS_TOKEN_EXPIRY = '24h'; // Too long!

// Should be:
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 days
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms
```

#### **1.2 Add Refresh Token Endpoint**

**File:** `backend/src/routes/auth.ts`

```typescript
// Add new endpoint:
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = generateAccessToken(decoded.userId);
    
    res.json({ access_token: newAccessToken });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

#### **1.3 Update Login Response**

**File:** `backend/src/controllers/authController.ts`

```typescript
// Set refresh token as httpOnly cookie
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Return access token in response
res.json({
  access_token: accessToken,
  expires_in: 900, // 15 minutes in seconds
  token_type: 'Bearer'
});
```

---

### **Phase 2: Frontend Changes**

#### **2.1 Create Session Manager**

**File:** `apps/web/src/utils/sessionManager.ts`

```typescript
class SessionManager {
  private timeout: NodeJS.Timeout | null = null;
  private warningTimeout: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private readonly SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly WARNING_TIME = 2 * 60 * 1000; // 2 minutes before expiry
  
  constructor() {
    this.setupActivityListeners();
    this.startSessionTimer();
  }
  
  private setupActivityListeners() {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
  }
  
  private resetTimer() {
    this.lastActivity = Date.now();
    this.clearTimers();
    this.startSessionTimer();
  }
  
  private startSessionTimer() {
    // Warning timer (28 minutes)
    this.warningTimeout = setTimeout(() => {
      this.showWarning();
    }, this.SESSION_DURATION - this.WARNING_TIME);
    
    // Logout timer (30 minutes)
    this.timeout = setTimeout(() => {
      this.logout();
    }, this.SESSION_DURATION);
  }
  
  private showWarning() {
    // Show modal: "Your session will expire in 2 minutes"
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="session-warning-modal">
        <h3>Session Expiring Soon</h3>
        <p>Your session will expire in 2 minutes due to inactivity.</p>
        <button onclick="sessionManager.extendSession()">Stay Logged In</button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  public extendSession() {
    this.resetTimer();
    // Close warning modal
    document.querySelector('.session-warning-modal')?.remove();
  }
  
  private logout() {
    localStorage.removeItem('access_token');
    sessionStorage.clear();
    window.location.href = '/login?reason=session_expired';
  }
  
  private clearTimers() {
    if (this.timeout) clearTimeout(this.timeout);
    if (this.warningTimeout) clearTimeout(this.warningTimeout);
  }
}

export const sessionManager = new SessionManager();
```

#### **2.2 Add Token Refresh Logic**

**File:** `apps/web/src/utils/api.ts`

```typescript
// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const { data } = await axios.post('/api/auth/refresh');
        localStorage.setItem('access_token', data.access_token);
        
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        localStorage.removeItem('access_token');
        window.location.href = '/login?reason=session_expired';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

#### **2.3 Update Login Page**

**File:** `apps/web/src/pages/Login.tsx`

```typescript
// Show session expired message
const searchParams = new URLSearchParams(window.location.search);
const reason = searchParams.get('reason');

{reason === 'session_expired' && (
  <div className="alert alert-warning">
    Your session has expired due to inactivity. Please log in again.
  </div>
)}
```

---

### **Phase 3: Testing**

#### **3.1 E2E Tests for Session Management**

**File:** `e2e-tests/tests/auth/session-management.spec.js`

```javascript
test.describe('Session Management', () => {
  
  test('Session expires after 30 minutes of inactivity', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Mock time to 31 minutes later
    await page.evaluate(() => {
      const now = Date.now();
      Date.now = () => now + (31 * 60 * 1000);
    });
    
    // Trigger activity check
    await page.reload();
    
    // Should redirect to login with expired message
    await expect(page).toHaveURL(/login.*session_expired/);
  });
  
  test('Warning shows 2 minutes before expiration', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Mock time to 28 minutes later
    await page.evaluate(() => {
      const now = Date.now();
      Date.now = () => now + (28 * 60 * 1000);
    });
    
    // Should show warning modal
    await expect(page.locator('.session-warning-modal')).toBeVisible();
    await expect(page.locator('text=Session Expiring Soon')).toBeVisible();
  });
  
  test('User can extend session', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Mock time to 28 minutes later
    await page.evaluate(() => {
      const now = Date.now();
      Date.now = () => now + (28 * 60 * 1000);
    });
    
    // Click extend session
    await page.click('button:has-text("Stay Logged In")');
    
    // Warning should disappear
    await expect(page.locator('.session-warning-modal')).not.toBeVisible();
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
  
  test('Activity resets session timer', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Simulate activity every 20 minutes for 1 hour
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(1000); // Simulate 20 min
      await page.mouse.move(100, 100); // Activity
    }
    
    // Should still be logged in
    await expect(page).toHaveURL(/dashboard/);
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeTruthy();
  });
  
  test('Token refresh works automatically', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@performile.com');
    await page.fill('input[name="password"]', 'Test1234!');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard');
    
    // Get initial token
    const initialToken = await page.evaluate(() => localStorage.getItem('access_token'));
    
    // Mock time to 16 minutes later (after access token expires)
    await page.evaluate(() => {
      const now = Date.now();
      Date.now = () => now + (16 * 60 * 1000);
    });
    
    // Make an API call (should trigger refresh)
    await page.click('text=Orders'); // Navigate somewhere
    
    // Token should be refreshed
    const newToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(newToken).not.toBe(initialToken);
    expect(newToken).toBeTruthy();
  });
});
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Backend:**
- [ ] Update JWT expiry times (15min access, 7day refresh)
- [ ] Add `/api/auth/refresh` endpoint
- [ ] Set refresh token as httpOnly cookie
- [ ] Update login response format
- [ ] Add session tracking to database (optional)

### **Frontend:**
- [ ] Create `SessionManager` class
- [ ] Add activity listeners
- [ ] Implement warning modal
- [ ] Add token refresh interceptor
- [ ] Update login page for expired sessions
- [ ] Add "Stay Logged In" functionality

### **Testing:**
- [ ] Write session expiration tests
- [ ] Write warning modal tests
- [ ] Write token refresh tests
- [ ] Write activity tracking tests
- [ ] Manual testing with real timers

### **Documentation:**
- [ ] Update API documentation
- [ ] Document session behavior for users
- [ ] Add troubleshooting guide

---

## 🎯 SUCCESS CRITERIA

- ✅ Sessions expire after 30 minutes of inactivity
- ✅ Warning shows 2 minutes before expiration
- ✅ Users can extend session
- ✅ Activity resets timer
- ✅ Tokens refresh automatically
- ✅ Clear messaging on expiration
- ✅ No security vulnerabilities
- ✅ All tests pass

---

## 🚀 ROLLOUT PLAN

### **Phase 1: Development (2-3 days)**
- Implement backend changes
- Implement frontend changes
- Write tests

### **Phase 2: Testing (1 day)**
- Run E2E tests
- Manual testing
- Security review

### **Phase 3: Deployment (1 day)**
- Deploy to staging
- Test in staging
- Deploy to production
- Monitor for issues

---

**Priority:** HIGH  
**Estimated Time:** 4-5 days  
**Security Impact:** HIGH  
**User Impact:** MEDIUM (better security, minor UX change)

---

**Last Updated:** October 17, 2025, 8:22 AM UTC+2
