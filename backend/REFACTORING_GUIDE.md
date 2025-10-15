# Backend Refactoring Guide

**Created:** October 16, 2025  
**Purpose:** Guide for using centralized database pool and standardized error handling

---

## 📋 Overview

This guide explains the new utilities and patterns for cleaner, more maintainable backend code.

### What's New?

1. **Database Helpers** (`utils/dbHelpers.ts`)
   - Simplified query functions
   - Transaction management
   - Pool monitoring
   - RLS context management

2. **Error Handling** (`utils/errorHandler.ts`)
   - Standardized error classes
   - Consistent error responses
   - Try-catch wrappers
   - Success response helpers

3. **Database Middleware** (`middleware/dbPool.ts`)
   - Pool health monitoring
   - Query performance tracking
   - Connection error handling

---

## 🔧 Database Helpers

### Basic Queries

#### Query One Row
```typescript
import { queryOne } from '../utils/dbHelpers';

// Old way
const result = await database.query('SELECT * FROM users WHERE user_id = $1', [userId]);
const user = result.rows[0];

// New way
const user = await queryOne<User>('SELECT * FROM users WHERE user_id = $1', [userId]);
```

#### Query Multiple Rows
```typescript
import { queryMany } from '../utils/dbHelpers';

// Old way
const result = await database.query('SELECT * FROM orders WHERE merchant_id = $1', [merchantId]);
const orders = result.rows;

// New way
const orders = await queryMany<Order>('SELECT * FROM orders WHERE merchant_id = $1', [merchantId]);
```

#### Execute Query with Options
```typescript
import { executeQuery } from '../utils/dbHelpers';

const result = await executeQuery(
  'SELECT * FROM large_table',
  [],
  {
    name: 'get_large_table',
    timeout: 60000, // 60 seconds
    logQuery: true
  }
);
```

### Helper Functions

#### Check if Record Exists
```typescript
import { exists } from '../utils/dbHelpers';

// Old way
const result = await database.query('SELECT 1 FROM orders WHERE order_id = $1', [orderId]);
const orderExists = result.rows.length > 0;

// New way
const orderExists = await exists('orders', { order_id: orderId });
```

#### Count Records
```typescript
import { count } from '../utils/dbHelpers';

// Old way
const result = await database.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['pending']);
const total = parseInt(result.rows[0].count);

// New way
const total = await count('orders', { status: 'pending' });
```

#### Insert Record
```typescript
import { insertOne } from '../utils/dbHelpers';

// Old way
const result = await database.query(
  'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
  [email, name]
);
const user = result.rows[0];

// New way
const user = await insertOne<User>('users', { email, name });
```

#### Update Records
```typescript
import { updateMany } from '../utils/dbHelpers';

// Old way
const result = await database.query(
  'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
  ['delivered', orderId]
);
const order = result.rows[0];

// New way
const orders = await updateMany<Order>(
  'orders',
  { status: 'delivered' },
  { order_id: orderId }
);
const order = orders[0];
```

### Transactions

```typescript
import { executeTransaction } from '../utils/dbHelpers';

// Old way
const client = await database.getClient();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO orders ...');
  await client.query('INSERT INTO order_timeline ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}

// New way
const result = await executeTransaction(async (client) => {
  await client.query('INSERT INTO orders ...');
  await client.query('INSERT INTO order_timeline ...');
  return { success: true };
});
```

#### Transaction with Options
```typescript
const result = await executeTransaction(
  async (client) => {
    // Your queries here
  },
  {
    isolationLevel: 'SERIALIZABLE',
    readOnly: false
  }
);
```

### RLS Context Management

```typescript
import { setRLSContext, resetRLSContext } from '../utils/dbHelpers';

// Set RLS context for queries
await setRLSContext(userId, userRole);

// Your queries here - will respect RLS policies

// Reset context
await resetRLSContext();
```

### Pool Monitoring

```typescript
import { getPoolStats, logPoolStats } from '../utils/dbHelpers';

// Get current pool statistics
const stats = getPoolStats();
console.log(stats); // { totalCount: 5, idleCount: 3, waitingCount: 0 }

// Log pool stats
logPoolStats(); // Logs to logger
```

---

## 🚨 Error Handling

### Error Classes

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../utils/errorHandler';

// Throw specific errors
throw new ValidationError('Invalid email format');
throw new AuthenticationError(); // Uses default message
throw new AuthorizationError('You cannot access this resource');
throw new NotFoundError('Order'); // "Order not found"
throw new ConflictError('Email already exists');
throw new DatabaseError('Failed to connect');
```

### Try-Catch Wrapper

```typescript
import { tryCatch } from '../utils/errorHandler';

// Old way
router.get('/orders', async (req, res) => {
  try {
    const orders = await getOrders();
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// New way
router.get('/orders', tryCatch(async (req, res) => {
  const orders = await getOrders();
  sendSuccessResponse(res, orders);
}));
```

### Validate Required Fields

```typescript
import { validateRequiredFields } from '../utils/errorHandler';

// Old way
if (!req.body.email || !req.body.password) {
  return res.status(400).json({ error: 'Missing required fields' });
}

// New way
validateRequiredFields(req.body, ['email', 'password']);
// Throws ValidationError if fields are missing
```

### Success Responses

```typescript
import { sendSuccessResponse, sendPaginatedResponse } from '../utils/errorHandler';

// Simple success response
sendSuccessResponse(res, data, 'Operation successful');

// Paginated response
sendPaginatedResponse(res, data, page, limit, total, 'Orders retrieved');
```

---

## 🎯 Complete Example

### Before Refactoring

```typescript
router.get('/orders/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.user_id;
    
    const result = await database.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    const order = result.rows[0];
    
    // Check authorization
    const merchantResult = await database.query(
      'SELECT merchant_id FROM merchants WHERE user_id = $1',
      [userId]
    );
    
    if (merchantResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    if (order.merchant_id !== merchantResult.rows[0].merchant_id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get order error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});
```

### After Refactoring

```typescript
router.get('/orders/:id', authenticateToken, tryCatch(async (req, res) => {
  const { id } = req.params;
  const userId = (req as any).user?.user_id;
  
  // Check if order exists
  const order = await queryOne<Order>(
    'SELECT * FROM orders WHERE order_id = $1',
    [id]
  );
  
  if (!order) {
    throw new NotFoundError('Order');
  }
  
  // Check authorization
  const merchant = await queryOne<{ merchant_id: string }>(
    'SELECT merchant_id FROM merchants WHERE user_id = $1',
    [userId]
  );
  
  if (!merchant || merchant.merchant_id !== order.merchant_id) {
    throw new AuthorizationError();
  }
  
  sendSuccessResponse(res, order);
}));
```

**Benefits:**
- ✅ 50% less code
- ✅ Cleaner, more readable
- ✅ Consistent error handling
- ✅ Type-safe with generics
- ✅ Automatic logging
- ✅ Standardized responses

---

## 📊 Migration Checklist

### For Each Route File:

- [ ] Import new utilities at the top
- [ ] Replace `database.query()` with helper functions
- [ ] Wrap route handlers with `tryCatch()`
- [ ] Use error classes instead of manual status codes
- [ ] Use `sendSuccessResponse()` for success cases
- [ ] Use `validateRequiredFields()` for validation
- [ ] Replace manual transactions with `executeTransaction()`
- [ ] Test the refactored routes

### Priority Routes to Refactor:

1. **High Traffic:**
   - `/api/orders` (all methods)
   - `/api/auth` (login, register)
   - `/api/dashboard`
   - `/api/reviews`

2. **Complex Logic:**
   - `/api/courier/checkout-analytics`
   - `/api/market-insights`
   - `/api/webhooks`

3. **Error-Prone:**
   - `/api/claims`
   - `/api/subscriptions`
   - `/api/upload`

---

## 🔍 Testing Refactored Code

### Unit Tests

```typescript
import { queryOne, executeTransaction } from '../utils/dbHelpers';
import { NotFoundError } from '../utils/errorHandler';

jest.mock('../utils/dbHelpers');

describe('Orders Route', () => {
  it('should throw NotFoundError when order does not exist', async () => {
    (queryOne as jest.Mock).mockResolvedValue(null);
    
    await expect(getOrder('invalid-id')).rejects.toThrow(NotFoundError);
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import app from '../server';

describe('GET /api/orders/:id', () => {
  it('should return 404 for non-existent order', async () => {
    const response = await request(app)
      .get('/api/orders/invalid-id')
      .set('Authorization', 'Bearer token');
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('NotFoundError');
  });
});
```

---

## 📈 Performance Benefits

### Before:
- Manual connection management
- No query timeout handling
- No pool monitoring
- Inconsistent error logging

### After:
- ✅ Automatic connection pooling
- ✅ Configurable query timeouts
- ✅ Real-time pool monitoring
- ✅ Structured error logging
- ✅ Performance metrics tracking

---

## 🚀 Best Practices

1. **Always use `tryCatch()` wrapper**
   - Automatic error handling
   - Consistent error responses

2. **Use specific error classes**
   - Better error messages
   - Correct HTTP status codes

3. **Prefer helper functions over raw queries**
   - Less boilerplate
   - Type safety
   - Automatic logging

4. **Use transactions for multi-step operations**
   - Data consistency
   - Automatic rollback

5. **Monitor pool health**
   - Check logs for warnings
   - Adjust pool size if needed

6. **Validate input early**
   - Use `validateRequiredFields()`
   - Fail fast

---

## 📚 Reference

### Database Helpers API

| Function | Purpose | Returns |
|----------|---------|---------|
| `queryOne<T>()` | Get single row | `T \| null` |
| `queryMany<T>()` | Get multiple rows | `T[]` |
| `executeQuery<T>()` | Execute with options | `T` |
| `exists()` | Check if record exists | `boolean` |
| `count()` | Count records | `number` |
| `insertOne<T>()` | Insert and return | `T \| null` |
| `updateMany<T>()` | Update and return | `T[]` |
| `deleteMany<T>()` | Delete and return | `T[]` |
| `executeTransaction<T>()` | Run transaction | `T` |
| `setRLSContext()` | Set RLS variables | `void` |
| `getPoolStats()` | Get pool metrics | `PoolStats` |

### Error Classes

| Class | Status Code | Use Case |
|-------|-------------|----------|
| `ValidationError` | 400 | Invalid input |
| `AuthenticationError` | 401 | Not authenticated |
| `AuthorizationError` | 403 | No permission |
| `NotFoundError` | 404 | Resource not found |
| `ConflictError` | 409 | Duplicate/conflict |
| `RateLimitError` | 429 | Too many requests |
| `DatabaseError` | 500 | DB operation failed |

---

## 🎓 Examples

See `routes/orders-refactored-example.ts` for a complete working example.

---

**Questions?** Check the inline documentation in the utility files or ask the team!
