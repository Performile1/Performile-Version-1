# 🧪 Performile Testing Strategy

**Date:** October 14, 2025  
**Goal:** Achieve 70%+ test coverage  
**Timeline:** 4 weeks

---

## TESTING PYRAMID

```
        /\
       /E2E\      10% - Critical user flows
      /------\
     /  API   \   30% - Integration tests
    /----------\
   /   Unit     \ 60% - Unit tests
  /--------------\
```

---

## PHASE 1: UNIT TESTS (Week 1)

### Target: 60% of total coverage

**What to Test:**
1. Utility functions
2. Helper functions
3. React components
4. State management (Zustand)
5. Validation logic

**Tools:**
- Jest
- React Testing Library
- @testing-library/jest-dom
- @testing-library/user-event

**Priority Tests:**

#### Auth Store
```typescript
// frontend/src/store/__tests__/authStore.test.ts
describe('authStore', () => {
  it('should set user on login')
  it('should clear user on logout')
  it('should update token')
  it('should check if authenticated')
})
```

#### API Client
```typescript
// frontend/src/services/__tests__/apiClient.test.ts
describe('apiClient', () => {
  it('should add auth header')
  it('should refresh token on 401')
  it('should logout on invalid token')
  it('should handle network errors')
})
```

#### RLS Helper
```typescript
// frontend/api/lib/__tests__/rls.test.ts
describe('withRLS', () => {
  it('should set session variables')
  it('should execute callback')
  it('should reset variables on success')
  it('should reset variables on error')
})
```

---

## PHASE 2: INTEGRATION TESTS (Week 2)

### Target: 30% of total coverage

**What to Test:**
1. API endpoints
2. Database queries
3. RLS policies
4. Authentication flow
5. Authorization checks

**Tools:**
- Jest
- Supertest
- @supabase/supabase-js

**Priority Tests:**

#### Orders API
```typescript
// frontend/api/orders/__tests__/index.test.ts
describe('POST /api/orders', () => {
  it('should create order for merchant')
  it('should reject for consumer')
  it('should enforce subscription limits')
  it('should validate required fields')
})

describe('GET /api/orders', () => {
  it('should return all orders for admin')
  it('should return only store orders for merchant')
  it('should return only assigned for courier')
  it('should return only own for consumer')
})
```

#### RLS Policies
```typescript
// database/__tests__/rls.test.ts
describe('Orders RLS', () => {
  it('admin sees all orders')
  it('merchant sees only own store orders')
  it('courier sees only assigned orders')
  it('consumer sees only own email orders')
  it('prevents cross-role data access')
})
```

---

## PHASE 3: E2E TESTS (Week 3)

### Target: 10% of total coverage

**What to Test:**
1. Login/Logout flow
2. Order creation flow
3. Subscription upgrade flow
4. Multi-role scenarios

**Tools:**
- Playwright or Cypress

**Critical Flows:**

#### Login Flow
```typescript
test('should login as merchant', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'merchant@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```

#### Order Creation
```typescript
test('should create order', async ({ page }) => {
  // Login as merchant
  // Navigate to orders
  // Click create
  // Fill form
  // Submit
  // Verify order appears
})
```

---

## DATA LEAKAGE TESTS

### RLS Policy Tests

**Test Matrix:**
```typescript
const testMatrix = [
  { role: 'admin', table: 'orders', expected: 'all' },
  { role: 'merchant', table: 'orders', expected: 'own_stores' },
  { role: 'courier', table: 'orders', expected: 'assigned' },
  { role: 'consumer', table: 'orders', expected: 'own_email' },
]

testMatrix.forEach(({ role, table, expected }) => {
  it(`${role} should see ${expected} in ${table}`, async () => {
    // Set RLS context
    // Query table
    // Verify results match expected
  })
})
```

### Subscription Limit Tests

```typescript
describe('Subscription Limits', () => {
  it('should enforce order limit for free tier')
  it('should allow unlimited for enterprise')
  it('should prevent creation when limit reached')
  it('should show upgrade prompt')
})
```

---

## SETUP INSTRUCTIONS

### 1. Install Dependencies
```bash
npm install --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  supertest \
  @types/supertest \
  playwright
```

### 2. Configure Jest
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### 3. Add Test Scripts
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

---

## CI/CD INTEGRATION

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v2
```

---

## SUCCESS METRICS

- [ ] 70%+ code coverage
- [ ] All critical flows tested
- [ ] Zero data leakage
- [ ] All RLS policies tested
- [ ] Tests run in CI/CD
- [ ] No flaky tests

---

**Status:** Ready to implement  
**Next Step:** Install dependencies and setup Jest
