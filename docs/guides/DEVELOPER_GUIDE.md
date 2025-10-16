# Performile Platform - Developer Guide

**Version:** 1.0  
**Last Updated:** October 11, 2025  
**For:** Developers & Technical Teams

---

## 📖 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Getting Started](#getting-started)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [Authentication](#authentication)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend:**
- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite
- **UI Library:** Material-UI (MUI)
- **State Management:** MobX
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form
- **Charts:** Recharts / Chart.js
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Styling:** Emotion (CSS-in-JS)

**Backend:**
- **Runtime:** Node.js 22+
- **Platform:** Vercel Serverless Functions
- **Language:** TypeScript
- **Database:** PostgreSQL (Supabase)
- **ORM:** Direct SQL with pg library
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Custom middleware

**Infrastructure:**
- **Hosting:** Vercel
- **Database:** Supabase (Transaction Mode pooler)
- **Storage:** Vercel Blob (file uploads)
- **Email:** SendGrid / Resend
- **Payments:** Stripe
- **Real-time:** Pusher
- **Error Tracking:** Sentry
- **Analytics:** PostHog

### System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Vercel CDN                    │
│              (Static Assets + Edge)             │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│              React Frontend (SPA)               │
│  - Material-UI Components                       │
│  - TanStack Query (API calls)                   │
│  - MobX Stores (State)                          │
└────────────────────┬────────────────────────────┘
                     │ HTTPS/REST
┌────────────────────▼────────────────────────────┐
│        Vercel Serverless Functions              │
│  - /api/auth       - /api/orders                │
│  - /api/couriers   - /api/dashboard             │
│  - /api/stripe     - /api/admin                 │
│  - 110+ endpoints                               │
└────────┬───────────────────────────┬────────────┘
         │                           │
         │ Connection Pool (3)       │
         │                           │
┌────────▼────────────┐    ┌────────▼────────────┐
│  Supabase PostgreSQL│    │  External Services  │
│  (Transaction Mode) │    │  - Stripe           │
│  - 30+ tables       │    │  - Pusher           │
│  - Indexes          │    │  - SendGrid         │
│  - Foreign Keys     │    │  - Sentry           │
└─────────────────────┘    └─────────────────────┘
```

### Key Design Decisions

**1. Serverless Architecture**
- Scalable by default
- Pay-per-use pricing
- No server management
- Cold start considerations

**2. Shared Connection Pool**
- Single pool for all endpoints
- Max 3 connections
- 30-second timeout
- Prevents connection exhaustion

**3. Transaction Mode Pooler**
- Optimized for serverless
- Faster connection cycling
- Supports concurrent functions
- Better than Session Mode

**4. JWT Authentication**
- Stateless authentication
- Access token (15 min expiry)
- Refresh token (7 days expiry)
- Secure, scalable

---

## 🚀 Getting Started

### Prerequisites

**Required:**
- Node.js >= 22.0.0
- npm or yarn
- Git
- Code editor (VS Code recommended)

**Accounts Needed:**
- Supabase account (database)
- Vercel account (deployment)
- Stripe account (payments)
- SendGrid/Resend (email)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Performile1/Performile-Version-1.git
cd Performile-Version-1

# 2. Install dependencies
cd frontend
npm install --legacy-peer-deps

# Note: --legacy-peer-deps needed for some package conflicts
```

### Environment Variables

Create `.env.local` in `frontend/` directory:

```env
# Database
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres

# JWT Secrets
JWT_SECRET=your-64-character-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-64-character-refresh-secret-here

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Email
SENDGRID_API_KEY=SG.xxxxx
# OR
RESEND_API_KEY=re_xxxxx

# Pusher (Real-time)
PUSHER_APP_ID=xxxxx
PUSHER_KEY=xxxxx
PUSHER_SECRET=xxxxx
PUSHER_CLUSTER=eu

# Sentry (Error Tracking)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# PostHog (Analytics)
POSTHOG_KEY=phc_xxxxx
POSTHOG_HOST=https://us.i.posthog.com

# Environment
NODE_ENV=development
```

### Running Locally

```bash
# Development server
npm run dev

# Server starts at http://localhost:5173
# API endpoints at http://localhost:5173/api/*
```

### Building for Production

```bash
# Build frontend
npm run build

# Preview production build
npm run preview
```

---

## 📁 Project Structure

```
performile-platform/
├── frontend/
│   ├── api/                      # Serverless API endpoints
│   │   ├── lib/
│   │   │   └── db.ts            # Shared connection pool ⭐
│   │   ├── middleware/
│   │   │   └── security.ts      # Auth, CORS, rate limiting
│   │   ├── auth/
│   │   │   └── index.ts         # Login, register, refresh
│   │   ├── orders/
│   │   │   ├── index.ts         # CRUD operations
│   │   │   └── filters.ts       # Filter options
│   │   ├── couriers/
│   │   ├── stores/
│   │   ├── reviews/
│   │   ├── dashboard/
│   │   ├── trustscore/
│   │   ├── admin/
│   │   ├── stripe/
│   │   ├── subscriptions/
│   │   ├── team/
│   │   └── tracking/
│   │
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/          # Shared components
│   │   │   ├── orders/          # Order-specific
│   │   │   ├── dashboard/
│   │   │   └── layout/
│   │   │
│   │   ├── pages/               # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Orders.tsx
│   │   │   ├── Couriers.tsx
│   │   │   ├── Analytics.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── stores/              # MobX stores
│   │   │   ├── authStore.ts
│   │   │   ├── orderStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── services/            # API clients
│   │   │   ├── apiClient.ts     # Axios instance
│   │   │   └── authService.ts
│   │   │
│   │   ├── utils/               # Utility functions
│   │   │   ├── exportToCSV.ts
│   │   │   ├── formatters.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/               # TypeScript types
│   │   │   ├── order.ts
│   │   │   ├── courier.ts
│   │   │   └── user.ts
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   └── useOrders.ts
│   │   │
│   │   ├── App.tsx              # Root component
│   │   ├── main.tsx             # Entry point
│   │   └── index.css            # Global styles
│   │
│   ├── public/                  # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── vercel.json              # Vercel configuration
│
├── docs/                        # Documentation
│   ├── current/
│   │   ├── PLATFORM_STATUS_MASTER.md
│   │   └── PLATFORM_ROADMAP_MASTER.md
│   ├── guides/
│   │   ├── USER_GUIDE.md
│   │   ├── ADMIN_GUIDE.md
│   │   └── DEVELOPER_GUIDE.md
│   └── technical/
│
├── database/                    # Database scripts
│   ├── schema.sql
│   ├── migrations/
│   └── seeds/
│
└── README.md
```

### Key Files

**`frontend/api/lib/db.ts`** - Shared connection pool (CRITICAL!)
```typescript
import { Pool } from 'pg';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 30000,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
};
```

**`frontend/api/middleware/security.ts`** - Security middleware
- JWT verification
- CORS handling
- Rate limiting
- Input validation
- SQL injection protection

**`frontend/src/services/apiClient.ts`** - API client
- Axios instance
- Request/response interceptors
- Token refresh logic
- Error handling

---

## 🔄 Development Workflow

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes
# ... code ...

# 3. Commit changes
git add .
git commit -m "feat: Add new feature"

# 4. Push to GitHub
git push origin feature/your-feature-name

# 5. Create Pull Request
# ... on GitHub ...

# 6. After approval, merge to main
git checkout main
git pull origin main
```

### Commit Message Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Code Style

**TypeScript:**
- Strict mode enabled
- No implicit any
- Explicit return types
- Interface over type

**React:**
- Functional components
- Hooks over classes
- Props destructuring
- Named exports

**Formatting:**
- Prettier for formatting
- ESLint for linting
- 2 spaces indentation
- Single quotes

### Adding a New API Endpoint

**Example: Create `/api/shipments` endpoint**

```typescript
// frontend/api/shipments/index.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applySecurityMiddleware } from '../middleware/security';
import { getPool } from '../lib/db';

const pool = getPool(); // ⭐ Use shared pool!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply security middleware
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return; // Middleware already sent response
  }

  const user = security.user;

  try {
    if (req.method === 'GET') {
      // Get shipments
      const result = await pool.query(
        'SELECT * FROM shipments WHERE user_id = $1',
        [user.userId]
      );

      return res.status(200).json({
        success: true,
        shipments: result.rows
      });
    }

    if (req.method === 'POST') {
      // Create shipment
      const { tracking_number, courier_id } = req.body;

      const result = await pool.query(
        'INSERT INTO shipments (tracking_number, courier_id, user_id) VALUES ($1, $2, $3) RETURNING *',
        [tracking_number, courier_id, user.userId]
      );

      return res.status(201).json({
        success: true,
        shipment: result.rows[0]
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Shipments API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
```

### Adding a New React Component

```typescript
// frontend/src/components/shipments/ShipmentList.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Box, Card, Typography } from '@mui/material';

interface Shipment {
  shipment_id: string;
  tracking_number: string;
  status: string;
}

export const ShipmentList: React.FC = () => {
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['shipments'],
    queryFn: async () => {
      const response = await apiClient.get('/shipments');
      return response.data.shipments;
    }
  });

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      {shipments.map((shipment: Shipment) => (
        <Card key={shipment.shipment_id}>
          <Typography>{shipment.tracking_number}</Typography>
          <Typography>{shipment.status}</Typography>
        </Card>
      ))}
    </Box>
  );
};
```

---

## 📡 API Documentation

### Base URL

**Production:** `https://frontend-two-swart-31.vercel.app/api`  
**Local:** `http://localhost:5173/api`

### Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

### Common Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### Authentication Endpoints

#### POST /api/auth
**Login, Register, Logout, Refresh**

**Login:**
```json
POST /api/auth
{
  "action": "login",
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "user_role": "merchant"
  }
}
```

**Register:**
```json
POST /api/auth
{
  "action": "register",
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "user_role": "merchant"
}
```

**Refresh Token:**
```json
POST /api/auth
{
  "action": "refresh",
  "refreshToken": "eyJhbGc..."
}
```

### Orders Endpoints

#### GET /api/orders
**Get orders with filtering**

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term
- `status` (string): Filter by status
- `courier` (number): Filter by courier_id
- `store` (number): Filter by store_id
- `country` (string): Filter by country
- `from_date` (string): Start date (YYYY-MM-DD)
- `to_date` (string): End date (YYYY-MM-DD)
- `sort_by` (string): Column to sort by
- `sort_order` (string): 'asc' or 'desc'

**Example:**
```
GET /api/orders?page=1&limit=10&status=delivered&from_date=2025-10-01
```

**Response:**
```json
{
  "success": true,
  "orders": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### GET /api/orders/:id
**Get single order by ID**

```
GET /api/orders/4fdffdfe-7df0-4025-98f5-cc45ad3f6292
```

**Response:**
```json
{
  "success": true,
  "order": {
    "order_id": "4fdffdfe-7df0-4025-98f5-cc45ad3f6292",
    "tracking_number": "TRK123456",
    "order_status": "delivered",
    ...
  }
}
```

#### POST /api/orders
**Create new order**

```json
POST /api/orders
{
  "tracking_number": "TRK123456",
  "order_number": "ORD-001",
  "store_id": "uuid",
  "courier_id": "uuid",
  "order_status": "pending",
  "postal_code": "12345",
  "city": "Stockholm",
  "country": "Sweden"
}
```

#### GET /api/orders/filters
**Get available filter options**

```
GET /api/orders/filters
```

**Response:**
```json
{
  "statuses": ["pending", "delivered", ...],
  "couriers": [{courier_id, courier_name}, ...],
  "stores": [{store_id, store_name}, ...],
  "countries": ["Sweden", "Norway", ...]
}
```

### Complete API Reference

See all 110+ endpoints in: `/docs/technical/API_REFERENCE.md` (to be created)

---

## 🗄️ Database Schema

### Connection Configuration

```typescript
// Transaction Mode (REQUIRED for serverless)
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
//                                                                                      ^^^^ Port 6543!

// Connection Pool Settings
max: 3                      // Max connections
connectionTimeoutMillis: 30000  // 30 seconds
idleTimeoutMillis: 10000    // 10 seconds
```

### Key Tables

**users**
```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  user_role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**orders**
```sql
CREATE TABLE orders (
  order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  order_number VARCHAR(100),
  store_id UUID REFERENCES stores(store_id),
  courier_id UUID REFERENCES couriers(courier_id),
  customer_id INTEGER REFERENCES users(user_id),
  order_status VARCHAR(50) NOT NULL,
  order_date TIMESTAMP NOT NULL,
  delivery_date TIMESTAMP,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**couriers**
```sql
CREATE TABLE couriers (
  courier_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  courier_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  trust_score DECIMAL(5,2) DEFAULT 0,
  on_time_rate DECIMAL(5,2) DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Database Migrations

**Manual SQL Migrations:**
1. Write SQL script in `database/migrations/`
2. Run in Supabase SQL Editor
3. Document in migration log

**Example Migration:**
```sql
-- database/migrations/001_add_parcel_details.sql
ALTER TABLE orders
ADD COLUMN weight DECIMAL(10,2),
ADD COLUMN dimensions VARCHAR(50),
ADD COLUMN parcel_value DECIMAL(10,2);
```

---

## 🔐 Authentication

### JWT Implementation

**Token Structure:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "role": "merchant",
  "iat": 1697000000,
  "exp": 1697000900
}
```

**Token Expiry:**
- Access Token: 15 minutes
- Refresh Token: 7 days

### Token Refresh Flow

```typescript
// Automatic token refresh in apiClient.ts
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/api/auth', {
        action: 'refresh',
        refreshToken
      });
      
      // Save new tokens
      localStorage.setItem('token', response.data.token);
      
      // Retry original request
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### Security Middleware

**Usage in API endpoints:**
```typescript
const security = applySecurityMiddleware(req, res, {
  requireAuth: true,           // Require JWT token
  rateLimit: 'default',        // Apply rate limiting
  validateSchema: {            // Validate request body
    field: { required: true, type: 'string' }
  }
});

if (!security.success) return;

const user = security.user;  // Authenticated user
```

---

## 🧪 Testing

### Unit Testing (To be implemented)

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Token refresh works
- [ ] Logout clears tokens

**Orders:**
- [ ] Create order
- [ ] View orders list
- [ ] Filter orders
- [ ] Export orders
- [ ] Edit order
- [ ] Delete order

**API Testing:**
```bash
# Using curl
curl -X POST https://your-domain.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"test@test.com","password":"password"}'
```

---

## 🚀 Deployment

### Vercel Deployment

**Automatic Deployment:**
1. Push to `main` branch
2. Vercel auto-deploys
3. Build takes ~60 seconds
4. Live in 2-3 minutes

**Manual Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Environment Variables

**Set in Vercel Dashboard:**
1. Go to Project Settings
2. Click "Environment Variables"
3. Add all variables from `.env.local`
4. Redeploy

### Database Deployment

**Supabase:**
1. Run migrations in SQL Editor
2. Verify schema changes
3. Test with staging data
4. Deploy to production

### Rollback Procedure

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

---

## 🔧 Troubleshooting

### Common Issues

**"MaxClientsInSessionMode" Error**
- **Cause:** Using Session Mode instead of Transaction Mode
- **Fix:** Change port from 5432 to 6543 in DATABASE_URL

**"Pool is not defined" Error**
- **Cause:** Endpoint creating its own Pool instead of using shared
- **Fix:** Import and use `getPool()` from `api/lib/db.ts`

**"Token has expired" Error**
- **Cause:** Access token expired
- **Fix:** Implement token refresh logic

**Build Failures**
- Check TypeScript errors
- Verify all imports
- Check environment variables

### Debug Mode

```typescript
// Enable detailed logging
console.log('[Debug]', variable);

// Log API requests
apiClient.interceptors.request.use(request => {
  console.log('Request:', request);
  return request;
});
```

### Performance Monitoring

**Vercel Analytics:**
- View in Vercel Dashboard
- Monitor response times
- Track errors

**Sentry:**
- Error tracking
- Performance monitoring
- User feedback

---

## 📚 Additional Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **React Query:** https://tanstack.com/query
- **Material-UI:** https://mui.com
- **Stripe Docs:** https://stripe.com/docs

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Write tests
5. Submit pull request

---

*Developer Guide Version 1.0*  
*Last Updated: October 11, 2025*  
*For technical support: dev@performile.com*
