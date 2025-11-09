# 🧪 COMPREHENSIVE TESTING GUIDE

**Last Updated:** November 9, 2025  
**Platform:** Performile v1.0  
**Coverage Target:** 80%+

---

## 📋 TESTING CHECKLIST

### **✅ COMPLETED TODAY:**
- [x] Payment infrastructure (Vipps, Swish, Stripe)
- [x] Consumer web app (Dashboard, Orders, C2C)
- [x] Mobile app foundation (Dashboard, Orders, Tracking, Claims)
- [x] API endpoints (8 endpoints)
- [x] Database migrations (3 tables)
- [x] Weekly audit process

### **🔄 READY TO TEST:**
- [ ] Token refresh mechanism
- [ ] Payment flows (all 3 providers)
- [ ] Consumer dashboards (web + mobile)
- [ ] Order tracking (web + mobile)
- [ ] Claims system (mobile)
- [ ] API endpoints
- [ ] Database integrity

---

## 🎯 TESTING STRATEGY

### **1. Unit Testing**
Test individual functions and components in isolation.

### **2. Integration Testing**
Test how different parts work together.

### **3. End-to-End Testing**
Test complete user flows from start to finish.

### **4. Manual Testing**
Test on real devices and browsers.

---

## 🔧 SETUP TESTING ENVIRONMENT

### **Install Dependencies:**
```bash
# Web app
cd apps/web
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest

# Mobile app
cd apps/mobile
npm install --save-dev @testing-library/react-native jest
```

### **Configure Vitest (Web):**
```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### **Configure Jest (Mobile):**
```javascript
// apps/mobile/jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

---

## 🧪 TEST CASES

### **1. TOKEN REFRESH**

**Test File:** `apps/web/src/store/__tests__/authStore.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';

describe('Token Refresh', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should refresh token when expired', async () => {
    // Mock expired token
    const expiredToken = 'expired.jwt.token';
    
    // Set up store
    useAuthStore.getState().setAuth({
      accessToken: expiredToken,
      refreshToken: 'refresh.token',
      user: { user_id: '123', email: 'test@test.com' },
    });

    // Trigger refresh
    await useAuthStore.getState().validateStoredToken();

    // Assert new token
    expect(useAuthStore.getState().accessToken).not.toBe(expiredToken);
  });

  it('should logout when refresh fails', async () => {
    // Mock failed refresh
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Refresh failed'));

    // Trigger refresh
    await useAuthStore.getState().refreshToken();

    // Assert logged out
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
```

**Manual Test:**
1. Login to web app
2. Wait 50 minutes
3. Verify token refreshes automatically
4. Verify no interruption to user

---

### **2. VIPPS PAYMENT**

**Test File:** `api/__tests__/vipps-payment.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import handler from '../vipps/create-payment';

describe('Vipps Payment Creation', () => {
  it('should create payment for C2C shipment', async () => {
    const req = {
      method: 'POST',
      body: {
        orderId: 'order-123',
        paymentType: 'c2c_shipment',
      },
      user: { user_id: 'user-123', user_role: 'consumer' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        vippsUrl: expect.any(String),
        reference: expect.any(String),
      })
    );
  });

  it('should reject subscription payments', async () => {
    const req = {
      method: 'POST',
      body: {
        planId: 'plan-123',
        paymentType: 'subscription',
      },
      user: { user_id: 'user-123', user_role: 'merchant' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('C2C and returns only'),
      })
    );
  });
});
```

**Manual Test:**
1. Create C2C shipment
2. Select Vipps as payment method
3. Verify redirect to Vipps app
4. Complete payment in Vipps
5. Verify callback updates order status
6. Verify payment recorded in database

---

### **3. SWISH PAYMENT**

**Test File:** `api/__tests__/swish-payment.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import handler from '../swish/create-payment';

describe('Swish Payment Creation', () => {
  it('should create payment for Swedish user', async () => {
    const req = {
      method: 'POST',
      body: {
        orderId: 'order-123',
        paymentType: 'c2c_shipment',
        phoneNumber: '+46701234567',
      },
      user: { user_id: 'user-123', country: 'SE' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentRequestToken: expect.any(String),
      })
    );
  });
});
```

**Manual Test:**
1. Create C2C shipment from Sweden
2. Select Swish as payment method
3. Enter Swedish phone number
4. Verify redirect to Swish app
5. Complete payment
6. Verify callback updates status

---

### **4. STRIPE C2C PAYMENT**

**Test File:** `api/__tests__/stripe-c2c-payment.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import handler from '../stripe/create-c2c-payment';

describe('Stripe C2C Payment', () => {
  it('should create PaymentIntent for C2C', async () => {
    const req = {
      method: 'POST',
      body: {
        orderId: 'order-123',
        paymentType: 'c2c_shipment',
      },
      user: { user_id: 'user-123', email: 'test@test.com' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        clientSecret: expect.any(String),
        paymentIntentId: expect.any(String),
      })
    );
  });
});
```

**Manual Test:**
1. Create C2C shipment from any country
2. Select Stripe as payment method
3. Enter card details
4. Complete payment
5. Verify webhook updates status
6. Verify payment in Stripe dashboard

---

### **5. PAYMENT METHOD SELECTOR**

**Test File:** `api/__tests__/payment-methods.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import handler from '../c2c/get-payment-methods';

describe('Payment Method Selector', () => {
  it('should return Vipps for Norwegian users', async () => {
    const req = {
      method: 'GET',
      query: { country: 'NO', amount: 150 },
      user: { user_id: 'user-123' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    const methods = res.json.mock.calls[0][0];
    expect(methods[0].provider).toBe('vipps');
    expect(methods[0].recommended).toBe(true);
  });

  it('should return Swish for Swedish users', async () => {
    const req = {
      method: 'GET',
      query: { country: 'SE', amount: 150 },
      user: { user_id: 'user-123' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    const methods = res.json.mock.calls[0][0];
    expect(methods[0].provider).toBe('swish');
  });

  it('should always include Stripe as fallback', async () => {
    const req = {
      method: 'GET',
      query: { country: 'US', amount: 150 },
      user: { user_id: 'user-123' },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req as any, res as any);

    const methods = res.json.mock.calls[0][0];
    expect(methods.some((m: any) => m.provider === 'stripe')).toBe(true);
  });
});
```

**Manual Test:**
1. Create shipment from Norway → Verify Vipps recommended
2. Create shipment from Sweden → Verify Swish recommended
3. Create shipment from USA → Verify Stripe recommended
4. Verify all methods show correct fees

---

### **6. CONSUMER DASHBOARD**

**Test File:** `apps/web/src/pages/consumer/__tests__/Dashboard.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';

describe('Consumer Dashboard', () => {
  it('should display dashboard stats', async () => {
    // Mock API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        totalOrders: 10,
        activeShipments: 3,
        pendingClaims: 1,
        c2cShipments: 5,
      }),
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

**Manual Test:**
1. Login as consumer
2. Navigate to dashboard
3. Verify stats display correctly
4. Verify quick actions work
5. Verify recent activity shows

---

### **7. MOBILE APP**

**Test File:** `apps/mobile/src/screens/consumer/__tests__/DashboardScreen.test.tsx`

```typescript
import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react-native';
import DashboardScreen from '../DashboardScreen';

describe('Mobile Dashboard', () => {
  it('should render dashboard', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText(/Welcome/i)).toBeTruthy();
  });

  it('should display stat cards', () => {
    const { getByText } = render(<DashboardScreen />);
    expect(getByText(/Total Orders/i)).toBeTruthy();
    expect(getByText(/Active Shipments/i)).toBeTruthy();
  });
});
```

**Manual Test:**
1. Install Expo Go on phone
2. Run `npm start` in apps/mobile
3. Scan QR code
4. Test all screens:
   - Dashboard
   - Orders
   - Tracking
   - Claims
5. Test navigation
6. Test pull-to-refresh

---

### **8. DATABASE INTEGRITY**

**Test File:** `database/__tests__/migrations.test.sql`

```sql
-- Test Vipps payments table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'vipps_payments'
    ) THEN 'PASS: vipps_payments table exists'
    ELSE 'FAIL: vipps_payments table missing'
  END as test_result;

-- Test Swish payments table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'swish_payments'
    ) THEN 'PASS: swish_payments table exists'
    ELSE 'FAIL: swish_payments table missing'
  END as test_result;

-- Test Stripe C2C payments table
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'stripe_c2c_payments'
    ) THEN 'PASS: stripe_c2c_payments table exists'
    ELSE 'FAIL: stripe_c2c_payments table missing'
  END as test_result;

-- Test RLS policies
SELECT 
  tablename, 
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN 'PASS: SELECT policy exists'
    WHEN cmd = 'INSERT' THEN 'PASS: INSERT policy exists'
    ELSE 'INFO: ' || cmd || ' policy exists'
  END as test_result
FROM pg_policies
WHERE tablename IN ('vipps_payments', 'swish_payments', 'stripe_c2c_payments');
```

**Manual Test:**
1. Run migrations
2. Verify tables created
3. Verify RLS policies active
4. Test insert/select as user
5. Verify foreign keys work

---

## 🚀 RUNNING TESTS

### **Web App:**
```bash
cd apps/web
npm test                    # Run all tests
npm test -- --coverage      # With coverage
npm test -- --watch         # Watch mode
```

### **Mobile App:**
```bash
cd apps/mobile
npm test                    # Run all tests
npm test -- --coverage      # With coverage
```

### **API Endpoints:**
```bash
cd api
npm test                    # Run all tests
```

---

## 📊 COVERAGE TARGETS

**Current Coverage:** 45%  
**Target Coverage:** 80%+

**Priority Areas:**
1. Payment flows: 90%+
2. Authentication: 85%+
3. API endpoints: 80%+
4. UI components: 70%+

---

## ✅ TESTING CHECKLIST

### **Before Deployment:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Manual testing complete
- [ ] Database migrations tested
- [ ] Payment flows tested
- [ ] Mobile app tested on devices
- [ ] Security audit complete
- [ ] Performance testing done
- [ ] Load testing done
- [ ] Error handling tested

---

## 🐛 BUG TRACKING

**Found Issues:** Track in GitHub Issues  
**Critical Bugs:** Fix immediately  
**Minor Bugs:** Schedule for next sprint

---

**Last Updated:** November 9, 2025, 3:40 PM  
**Status:** Ready for Testing  
**Next Steps:** Run test suite and fix any issues
