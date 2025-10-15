# Performile v1.11 - Missing Features Implementation Plan

## Overview
**Current Completion:** 95%  
**Missing Features:** 5 high priority, 3 medium priority  
**Timeline:** 2-3 weeks

---

## HIGH PRIORITY FEATURES

### 1. Admin Subscription Management UI Connection
**Status:** 80% (Frontend exists, uses mock data)  
**Effort:** 1 hour  
**Priority:** HIGH

#### Current State
- Frontend page exists: `frontend/src/pages/admin/ManageSubscriptions.tsx`
- Uses hardcoded mock data
- API endpoint exists and works: `/api/admin/subscriptions`

#### Implementation
**File:** `frontend/src/pages/admin/ManageSubscriptions.tsx`

```typescript
// Replace mock data with API call
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const ManageSubscriptions: React.FC = () => {
  // Fetch subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/subscription-plans');
      return response.data;
    }
  });

  // Fetch active subscriptions
  const { data: subscriptions } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/subscriptions');
      return response.data;
    }
  });

  if (isLoading) return <Loading />;

  return (
    // Use plans.data and subscriptions.data instead of mock data
  );
};
```

**Testing:**
1. Login as admin
2. Navigate to Subscription Management
3. Verify real data displays
4. Test plan editing/creation

---

### 2. Automated Testing Suite
**Status:** 0%  
**Effort:** 1 week  
**Priority:** HIGH

#### Setup
```bash
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest
```

#### Configuration
**File:** `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'frontend/api/**/*.ts',
    '!frontend/api/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

#### First Test
**File:** `tests/api/auth.test.ts`
```typescript
import request from 'supertest';
import { app } from '../setup';

describe('Authentication API', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'courier@performile.com',
          password: 'Test1234!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.role).toBe('courier');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'courier@performile.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });
});
```

**Implementation Steps:**
1. Set up Jest configuration
2. Create test database
3. Write 10 critical endpoint tests
4. Set up CI/CD pipeline
5. Achieve 70% coverage

---

### 3. Error Monitoring (Sentry)
**Status:** 0%  
**Effort:** 2 hours  
**Priority:** HIGH

#### Setup
```bash
npm install @sentry/node @sentry/react
```

#### Backend Integration
**File:** `frontend/api/lib/sentry.ts`
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

export { Sentry };
```

**File:** `frontend/api/lib/error-handler.ts`
```typescript
import { Sentry } from './sentry';

export function handleError(error: Error, context?: any) {
  console.error('Error:', error);
  
  Sentry.captureException(error, {
    extra: context
  });
  
  return {
    success: false,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
}
```

#### Frontend Integration
**File:** `frontend/src/main.tsx`
```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Environment Variables:**
```env
SENTRY_DSN=your-sentry-dsn
```

---

### 4. Email System Integration
**Status:** Templates exist, not integrated  
**Effort:** 1 day  
**Priority:** HIGH

#### Setup
```bash
npm install @sendgrid/mail
# or
npm install resend
```

#### Implementation (Resend - Recommended)
**File:** `frontend/api/lib/email.ts`
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Performile <noreply@performile.com>',
      to,
      subject,
      html
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}
```

#### Email Templates
**File:** `frontend/api/lib/email-templates.ts`
```typescript
export const templates = {
  welcome: (name: string) => `
    <h1>Welcome to Performile, ${name}!</h1>
    <p>Your account has been created successfully.</p>
  `,
  
  orderAssigned: (courierName: string, orderNumber: string) => `
    <h1>New Order Assigned</h1>
    <p>Hi ${courierName},</p>
    <p>Order #${orderNumber} has been assigned to you.</p>
  `,
  
  orderDelivered: (customerName: string, orderNumber: string) => `
    <h1>Order Delivered</h1>
    <p>Hi ${customerName},</p>
    <p>Your order #${orderNumber} has been delivered.</p>
  `
};
```

#### Usage
**File:** `frontend/api/auth/register.ts`
```typescript
import { sendEmail } from '../lib/email';
import { templates } from '../lib/email-templates';

// After user registration
await sendEmail({
  to: user.email,
  subject: 'Welcome to Performile',
  html: templates.welcome(user.name)
});
```

---

### 5. API Documentation (Swagger/OpenAPI)
**Status:** 0%  
**Effort:** 1 day  
**Priority:** MEDIUM

#### Setup
```bash
npm install swagger-jsdoc swagger-ui-express
```

#### Configuration
**File:** `frontend/api/docs/swagger.ts`
```typescript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Performile API',
      version: '1.11.0',
      description: 'Last-mile delivery performance platform API'
    },
    servers: [
      {
        url: 'https://your-app.vercel.app',
        description: 'Production'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./frontend/api/**/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
```

#### Endpoint Documentation
**File:** `frontend/api/orders/index.ts`
```typescript
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders list
 *     description: Returns orders filtered by user role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized
 */
```

#### Serve Documentation
**File:** `frontend/api/docs/index.ts`
```typescript
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(swaggerSpec);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

## MEDIUM PRIORITY FEATURES

### 6. Advanced Rate Limiting (Redis)
**Status:** Basic implementation exists  
**Effort:** 4 hours  
**Priority:** MEDIUM

#### Current State
- Basic in-memory rate limiting
- No distributed rate limiting
- No Redis integration

#### Implementation
```bash
npm install ioredis rate-limiter-flexible
```

**File:** `frontend/api/lib/rate-limit.ts`
```typescript
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';

const redis = new Redis(process.env.REDIS_URL);

const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

export async function checkRateLimit(identifier: string) {
  try {
    await rateLimiter.consume(identifier);
    return { allowed: true };
  } catch (error) {
    return { allowed: false, retryAfter: error.msBeforeNext };
  }
}
```

---

### 7. Bulk Operations
**Status:** 0%  
**Effort:** 2 days  
**Priority:** MEDIUM

#### Features
1. Bulk order import (CSV)
2. Bulk user management
3. Bulk courier assignment

#### Implementation
**File:** `frontend/api/admin/bulk-import-orders.ts`
```typescript
import { parse } from 'csv-parse/sync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { csv } = req.body;
  
  // Parse CSV
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true
  });

  // Validate and insert
  const results = {
    success: [],
    errors: []
  };

  for (const record of records) {
    try {
      // Validate record
      // Insert into database
      results.success.push(record);
    } catch (error) {
      results.errors.push({ record, error: error.message });
    }
  }

  return res.json({
    success: true,
    imported: results.success.length,
    failed: results.errors.length,
    errors: results.errors
  });
}
```

---

### 8. Advanced Analytics
**Status:** Basic metrics only  
**Effort:** 1 week  
**Priority:** LOW

#### Features
1. Trend analysis
2. Forecasting
3. Cohort analysis
4. Custom reports

#### Implementation
**File:** `frontend/api/analytics/trends.ts`
```typescript
export default async function handler(req, res) {
  const { metric, period } = req.query;
  
  // Calculate trends
  const data = await calculateTrend(metric, period);
  
  return res.json({
    success: true,
    data: {
      current: data.current,
      previous: data.previous,
      change: data.change,
      trend: data.trend, // 'up' | 'down' | 'stable'
      forecast: data.forecast
    }
  });
}
```

---

## Implementation Timeline

### Week 1: Critical Fixes
- Day 1-2: Admin subscription UI connection
- Day 3-5: Set up testing framework + first 20 tests

### Week 2: Monitoring & Communication
- Day 1: Sentry integration
- Day 2-3: Email system integration
- Day 4-5: API documentation

### Week 3: Enhancements
- Day 1-2: Advanced rate limiting
- Day 3-5: Bulk operations

---

## Success Criteria

✅ Admin can manage subscriptions via UI  
✅ 70% test coverage achieved  
✅ Error monitoring active (Sentry)  
✅ Email notifications working  
✅ API documentation available  
✅ Redis rate limiting implemented  
✅ Bulk import working

---

## Next Steps

1. ✅ Connect admin subscription UI (1 hour)
2. ✅ Set up Jest + write first tests (1 day)
3. ✅ Integrate Sentry (2 hours)
4. ✅ Set up email system (1 day)
5. ✅ Generate API docs (1 day)
