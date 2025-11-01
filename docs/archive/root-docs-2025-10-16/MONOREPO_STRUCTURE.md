# Performile Monorepo Structure

**Updated:** October 16, 2025  
**Structure:** Apps-based monorepo

---

## 📁 PROJECT STRUCTURE

```
performile/
├── apps/
│   ├── web/                    # Frontend React application
│   │   ├── src/               # React components, pages, services
│   │   ├── public/            # Static assets
│   │   ├── dist/              # Build output
│   │   ├── package.json       # Frontend dependencies
│   │   └── vite.config.ts     # Vite configuration
│   │
│   └── api/                    # Backend API (Vercel serverless)
│       ├── auth/              # Authentication endpoints
│       ├── admin/             # Admin endpoints
│       ├── merchant/          # Merchant endpoints
│       ├── courier/           # Courier endpoints
│       ├── orders/            # Order management
│       ├── tracking/          # Tracking endpoints
│       ├── trustscore/        # Trust score calculations
│       ├── lib/               # Shared utilities
│       ├── middleware/        # API middleware
│       └── package.json       # API dependencies
│
├── backend/                    # Legacy backend (not used)
├── database/                   # SQL scripts and migrations
├── e2e-tests/                  # Playwright tests
├── scripts/                    # Build and deployment scripts
├── docs/                       # Documentation
│
├── package.json               # Root workspace configuration
├── vercel.json                # Vercel deployment config
└── README.md                  # Project documentation
```

---

## 🚀 GETTING STARTED

### Install Dependencies
```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run setup
```

### Development
```bash
# Run frontend dev server
npm run dev:web

# Run API dev server (if needed)
npm run dev:api

# Run both (default)
npm run dev
```

### Build
```bash
# Build frontend
npm run build:web

# Build API
npm run build:api

# Build all (default)
npm run build
```

---

## 📦 APPS

### `apps/web` - Frontend Application

**Tech Stack:**
- React 18
- TypeScript
- Vite
- Material-UI
- React Router
- Zustand (state management)
- React Query (data fetching)

**Key Features:**
- Role-based dashboards (Admin, Merchant, Courier, Consumer)
- Trust score visualization
- Order management
- Real-time tracking
- Analytics dashboards
- E-commerce integrations

**Scripts:**
```bash
cd apps/web
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run type-check   # TypeScript check
```

---

### `apps/api` - Backend API

**Tech Stack:**
- Node.js
- TypeScript
- Vercel Serverless Functions
- PostgreSQL (Supabase)
- JWT Authentication

**Endpoints:**
- `/api/auth` - Authentication
- `/api/orders` - Order management
- `/api/couriers` - Courier data
- `/api/trustscore` - Trust scores
- `/api/tracking` - Shipment tracking
- `/api/admin/*` - Admin operations
- `/api/merchant/*` - Merchant operations
- `/api/courier/*` - Courier operations

**Features:**
- JWT-based authentication
- Role-based access control (RBAC)
- Database connection pooling
- Error handling middleware
- Request validation
- Rate limiting

---

## 🔧 CONFIGURATION

### Vercel Deployment

The `vercel.json` configures:
- **Build:** Builds frontend from `apps/web`
- **Output:** Serves from `apps/web/dist`
- **Functions:** Deploys API from `apps/api`
- **Routing:** Routes `/api/*` to serverless functions

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "apps/web/dist",
  "functions": {
    "apps/api/**/*.ts": {
      "runtime": "@vercel/node@3.0.0",
      "maxDuration": 60
    }
  }
}
```

---

## 🧪 TESTING

### E2E Tests (Playwright)
```bash
cd e2e-tests

# Run all tests
npm test

# Run specific role tests
npm run test:merchant
npm run test:admin

# Run comprehensive audit
npm run test:comprehensive
```

---

## 📊 DEPLOYMENT

### Automatic Deployment (Vercel)
```bash
# Push to main branch
git push origin main

# Vercel automatically:
# 1. Installs dependencies
# 2. Builds frontend (apps/web)
# 3. Deploys API functions (apps/api)
# 4. Configures routing
```

### Manual Deployment
```bash
# Deploy to Vercel
npm run deploy

# Deploy with CI
npm run deploy:ci
```

---

## 🔐 ENVIRONMENT VARIABLES

### Required Variables (Vercel Dashboard)

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Authentication:**
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret

**CORS:**
- `CORS_ALLOWED_ORIGINS` - Allowed origins (comma-separated)

**Optional:**
- `STRIPE_SECRET_KEY` - Stripe integration
- `SMTP_HOST` - Email notifications
- `SENTRY_DSN` - Error tracking

---

## 📝 SCRIPTS REFERENCE

### Root Scripts
```bash
npm run dev              # Start development
npm run build            # Build for production
npm run test             # Run all tests
npm run lint             # Lint all code
npm run type-check       # TypeScript check
npm run setup            # Install all dependencies
```

### Web App Scripts
```bash
npm run dev:web          # Start web dev server
npm run build:web        # Build web app
npm run preview:web      # Preview web build
npm run lint:web         # Lint web code
npm run type-check:web   # TypeScript check web
```

### API Scripts
```bash
npm run dev:api          # Start API dev server
npm run build:api        # Build API
npm run lint:api         # Lint API code
npm run type-check:api   # TypeScript check API
```

### Database Scripts
```bash
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database
npm run db:seed          # Seed database
```

---

## 🎯 BENEFITS OF MONOREPO

### Advantages
✅ **Clear separation** - Frontend and backend are distinct
✅ **Shared tooling** - One set of dev tools
✅ **Atomic commits** - Frontend + backend changes together
✅ **Easier refactoring** - Move code between apps easily
✅ **Single deployment** - Everything deploys together
✅ **Type safety** - Share TypeScript types (future)

### vs. Previous Structure
- **Before:** `/frontend/` with nested `/frontend/api/`
- **After:** `/apps/web/` and `/apps/api/` (clean separation)

---

## 🚧 FUTURE IMPROVEMENTS

### Potential Additions

1. **Shared Packages** (`/packages/`)
   ```
   packages/
   ├── types/          # Shared TypeScript types
   ├── utils/          # Shared utilities
   └── config/         # Shared configuration
   ```

2. **Workspace Management**
   - Use npm workspaces or pnpm
   - Share dependencies
   - Faster installs

3. **Build Optimization**
   - Turborepo for caching
   - Parallel builds
   - Incremental builds

---

## 📚 DOCUMENTATION

- **API Docs:** `/docs/API_DOCUMENTATION.md`
- **Database:** `/database/SETUP_ORDER.md`
- **Deployment:** `/DEPLOYMENT_STATUS.md`
- **Testing:** `/e2e-tests/README.md`

---

## 🆘 TROUBLESHOOTING

### Build Fails
```bash
# Clear caches
rm -rf apps/web/node_modules
rm -rf apps/web/dist
npm run setup:web
npm run build:web
```

### API Not Working
1. Check Vercel function logs
2. Verify environment variables
3. Check database connection
4. Review API endpoint paths

### Tests Failing
```bash
# Update test paths
cd e2e-tests
# Tests should still work (no changes needed)
```

---

## 📞 SUPPORT

- **Issues:** GitHub Issues
- **Docs:** `/docs/`
- **Tests:** `/e2e-tests/README.md`

---

**Structure Version:** 2.0  
**Last Updated:** October 16, 2025  
**Migration:** Complete ✅
