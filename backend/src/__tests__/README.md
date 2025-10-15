# Backend Tests

This directory contains the test suite for the Performile backend API.

## Test Structure

```
__tests__/
├── setup.ts                    # Global test setup and configuration
├── routes/                     # API route tests
│   ├── auth.test.ts           # Authentication endpoints
│   ├── orders.test.ts         # Orders CRUD operations
│   └── ...
├── database/                   # Database-specific tests
│   └── rls-policies.test.ts   # Row-Level Security policy tests
└── README.md                   # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- auth.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should register"
```

## Test Environment

Tests use a separate test database to avoid affecting production or development data.

### Environment Variables

Set these in your `.env.test` file or test environment:

```env
NODE_ENV=test
DB_NAME=performile_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=test-jwt-secret
JWT_REFRESH_SECRET=test-refresh-secret
REDIS_URL=redis://localhost:6379
```

## Test Categories

### 1. Unit Tests
Test individual functions and modules in isolation.

**Location:** `__tests__/units/`

**Example:**
- Utility functions
- Helper methods
- Business logic

### 2. Integration Tests
Test API endpoints and their interactions with the database.

**Location:** `__tests__/routes/`

**Example:**
- `auth.test.ts` - Authentication flow
- `orders.test.ts` - Order management
- `claims.test.ts` - Claims system

### 3. Database Tests
Test database-specific functionality like RLS policies.

**Location:** `__tests__/database/`

**Example:**
- `rls-policies.test.ts` - Row-Level Security

## Writing Tests

### Basic Test Structure

```typescript
import request from 'supertest';
import app from '../../server';
import database from '../../config/database';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  it('should do something', async () => {
    // Arrange
    const testData = { /* ... */ };

    // Act
    const response = await request(app)
      .post('/api/endpoint')
      .send(testData);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
```

### Mocking Database Queries

```typescript
jest.mock('../../config/database');

(database.query as jest.Mock).mockResolvedValueOnce({
  rows: [{ id: 1, name: 'Test' }]
});
```

### Testing Authentication

```typescript
// Mock authenticated user
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = {
      user_id: 'test-user-id',
      email: 'test@example.com',
      user_role: 'merchant',
    };
    next();
  },
}));
```

## RLS Policy Tests

Row-Level Security (RLS) tests verify that database policies correctly restrict data access.

### Prerequisites

1. Test database with RLS policies enabled
2. Test users created with different roles
3. Sample data for testing

### Running RLS Tests

```bash
# Run only RLS tests
npm test -- rls-policies.test.ts

# Skip RLS tests (if database not available)
npm test -- --testPathIgnorePatterns=rls-policies
```

### Test Users

RLS tests use predefined test user IDs:

- **Admin:** `00000000-0000-0000-0000-000000000001`
- **Merchant:** `00000000-0000-0000-0000-000000000002`
- **Courier:** `00000000-0000-0000-0000-000000000003`
- **Consumer:** `00000000-0000-0000-0000-000000000004`

Create these users in your test database before running RLS tests.

## Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

## Best Practices

1. **Isolation:** Each test should be independent
2. **Cleanup:** Always clean up test data
3. **Mocking:** Mock external dependencies
4. **Assertions:** Use specific, meaningful assertions
5. **Naming:** Use descriptive test names
6. **Organization:** Group related tests with `describe`

## Common Issues

### Database Connection Errors

If tests fail with database connection errors:

1. Ensure PostgreSQL is running
2. Check database credentials in `.env.test`
3. Verify test database exists
4. Check network connectivity

### Mock Not Working

If mocks aren't being applied:

1. Ensure mock is defined before importing module
2. Clear mocks between tests with `jest.clearAllMocks()`
3. Check mock path matches actual import path

### Timeout Errors

If tests timeout:

1. Increase timeout in `jest.config.js`
2. Check for hanging database connections
3. Ensure async operations complete

## Continuous Integration

Tests run automatically on:

- Pull requests
- Pushes to main branch
- Pre-deployment checks

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this README if needed
