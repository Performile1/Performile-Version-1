# Quick Test Guide

## Running Backend Tests

### Prerequisites
```bash
cd backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
# Auth tests
npm test -- auth.test.ts

# Orders tests
npm test -- orders.test.ts

# RLS tests
npm test -- rls-policies.test.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Run Tests Matching Pattern
```bash
# Run only registration tests
npm test -- --testNamePattern="register"

# Run only RLS tests
npm test -- --testNamePattern="RLS"
```

## Test Status

✅ **Auth Tests** - Registration, login, logout, token refresh  
✅ **Orders Tests** - CRUD operations, RLS verification  
✅ **RLS Policy Tests** - Database-level security for orders, reviews, claims, users

## Expected Output

```
PASS  src/__tests__/routes/auth.test.ts
PASS  src/__tests__/routes/orders.test.ts
PASS  src/__tests__/database/rls-policies.test.ts

Test Suites: 3 passed, 3 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        5.234 s
```

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Check connection settings in .env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=performile_test
```

### Module Not Found
```bash
# Reinstall dependencies
npm install

# Clear Jest cache
npm test -- --clearCache
```

### Timeout Errors
```bash
# Increase timeout in jest.config.js
testTimeout: 30000  // 30 seconds
```

## Quick Commands

```bash
# Full test suite with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Single run (CI/CD)
npm test

# Specific test file
npm test -- auth.test.ts

# Pattern matching
npm test -- --testNamePattern="should register"
```

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 80% | TBD |
| Branches | 75% | TBD |
| Functions | 80% | TBD |
| Lines | 80% | TBD |

Run `npm run test:coverage` to see current coverage.
