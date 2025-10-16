# Performile - Logistics Performance Platform

A comprehensive full-stack logistics performance platform that enables consumers to make informed carrier choices, empowers e-commerce companies to source carrier leads, and provides carriers with performance analytics.

**Last Updated:** October 13, 2025  
**Status:** 100% Production-Ready ✅ | Live on Vercel

---

## 🔗 Quick Links

- **🌐 Live Platform:** https://frontend-two-swart-31.vercel.app
- **📚 Documentation Hub:** [docs/README.md](./docs/README.md)
- **📊 Platform Status:** [Platform Status Master](./docs/current/PLATFORM_STATUS_MASTER.md)
- **🗺️ Roadmap:** [Platform Roadmap Master](./docs/current/PLATFORM_ROADMAP_MASTER.md)
- **👨‍💻 Developer Guide:** [Developer Guide](./docs/guides/DEVELOPER_GUIDE.md)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+ and npm
- Supabase account (for database)
- Vercel account (for deployment)

### Development Setup

1. **Clone and setup environment**:
```bash
git clone <repository-url>
cd Performile\ 1.0
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and JWT secrets
```

2. **Generate JWT secrets**:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

3. **Install dependencies and start development**:
```bash
cd frontend
npm install
npm run dev
```

### Access Points
- **Development**: http://localhost:5173
- **Production**: Your Vercel deployment URL
- **Database**: Supabase Dashboard
- **API**: /frontend/api/* (serverless functions)

## 🏗️ Architecture

### System Overview
- **Frontend**: React + TypeScript + Vite (deployed on Vercel)
- **API**: Vercel serverless functions (Node.js + TypeScript)
- **Database**: Supabase PostgreSQL with connection pooling
- **Authentication**: JWT with refresh tokens using Node.js crypto
- **Security**: Rate limiting, CORS, input validation
- **Deployment**: Vercel serverless with automatic HTTPS

### User Roles
1. **Consumer**: Carrier selection, order tracking, rating submission
2. **E-commerce**: Performance analytics, carrier sourcing
3. **Carrier**: Performance monitoring, lead generation
4. **Admin**: Full system control, user management

## 🔐 Security Features

- JWT authentication with refresh tokens
- Role-based access control (RBAC)
- Node.js crypto PBKDF2 password hashing (SHA-512, 10,000 iterations)
- Rate limiting on all endpoints
- CORS protection with environment-based allowlists
- Input validation and sanitization
- Serverless function isolation
- Supabase Row Level Security (RLS)

## 📊 TrustScore System

Advanced courier performance calculation using:
- **40%** Weighted customer ratings (time-decay)
- **15%** Completion rate
- **15%** On-time delivery rate
- **10%** Response time performance
- **10%** Customer satisfaction score
- **5%** Issue resolution rate
- **2.5%** Delivery attempts efficiency
- **2.5%** Last-mile performance

## 🔧 Development

### Project Structure
```
/performile
├── /frontend                   # React SPA + Vercel API functions
│   ├── /api                   # Vercel serverless functions
│   │   ├── /auth             # Authentication endpoints
│   │   ├── /analytics        # Analytics endpoints
│   │   ├── /rating           # Rating system endpoints
│   │   └── /trustscore       # TrustScore endpoints
│   └── /src                  # React application
├── /database                  # Supabase SQL schemas & migrations
├── /backend                   # Legacy backend (deprecated)
└── /scripts                   # Utility scripts
```

### Key Commands
```bash
# Development
cd frontend && npm run dev      # Start development server
vercel dev                      # Test serverless functions locally

# Database
# Run migrations in Supabase dashboard or via SQL editor

# Testing
npm test                        # Run frontend tests
npm run type-check             # TypeScript validation

# Production
vercel --prod                   # Deploy to production
```

## 🚀 Deployment

### Deployment Status
- ✅ **Live on Vercel:** https://frontend-two-swart-31.vercel.app
- ✅ TypeScript compilation errors resolved
- ✅ ES module syntax converted to CommonJS for Vercel compatibility
- ✅ Serverless optimization applied
- ✅ Connection pooling standardized across all APIs (110+ endpoints)
- ✅ Database: Supabase PostgreSQL (Transaction Mode)
- ✅ Authentication: JWT with refresh tokens working
- ✅ 80+ features implemented and tested
- 🚀 **97% Production-Ready**

Last updated: October 11, 2025

### Vercel Deployment
- ✅ GitHub repository connected to Vercel
- ✅ Environment variables configured in Vercel dashboard
- ✅ Supabase database set up with complete schema (30+ tables)
- ✅ JWT secrets generated and configured
- ✅ Automatic deployment on push to main branch
- ✅ HTTPS enabled by default

### Environment Variables (Vercel)
```bash
DATABASE_URL=postgresql://postgres.project:[M3nv]@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
JWT_SECRET=your_32_byte_hex_string
JWT_REFRESH_SECRET=your_32_byte_hex_string
NODE_ENV=production
```

### Supabase Setup
1. Create new Supabase project
2. Run database schema from `/database/schema.sql`
3. Import demo data from `/database/demo_users_crypto.sql`
4. Configure Row Level Security policies
5. Copy connection string to Vercel environment variables

## 📝 API Documentation

### Authentication Endpoints (Consolidated)
- `POST /frontend/api/auth` - All auth operations
  - `{ action: 'login', email, password }` - User login
  - `{ action: 'register', email, password, role, name }` - User registration
  - `{ action: 'refresh', refreshToken }` - Refresh JWT token
  - `{ action: 'logout' }` - User logout
  - `{ action: 'profile' }` - Get user profile

### Core Endpoints (Consolidated)
- `POST /frontend/api/analytics` - Analytics operations
  - `{ action: 'markets' }` - Market analytics
  - `{ action: 'performance' }` - Performance metrics
- `POST /frontend/api/rating` - Rating operations
  - `{ action: 'submit', rating, review, orderId }` - Submit reviews
  - `{ action: 'analytics' }` - Rating analytics
- `POST /frontend/api/trustscore` - TrustScore operations
  - `{ action: 'dashboard' }` - Dashboard statistics
  - `{ action: 'index' }` - TrustScore data

## 🔍 Monitoring

### Health Checks
- Vercel automatic function monitoring
- Supabase database health dashboard
- Real-time error tracking in Vercel dashboard

### Metrics Tracked
- Serverless function execution times
- Database query performance via Supabase
- TrustScore calculation performance
- User authentication events
- Error rates and function failures

## 🛡️ Security Considerations

### Production Security
- Environment variables managed securely by Vercel
- HTTPS enforced by default on Vercel
- Serverless function isolation
- Supabase connection pooling for security
- Regular dependency updates via Dependabot

### Password Security
- PBKDF2 with SHA-512 and 10,000 iterations
- Cryptographically secure random salt (16 bytes)
- No external dependencies (bcrypt removed)
- Cross-platform consistent behavior
- Format: `salt:hash` (both hex strings)

### Data Protection
- Supabase built-in encryption at rest and in transit
- Row Level Security (RLS) policies
- Audit logging via Supabase
- GDPR compliance features
- User data export/deletion capabilities

## 📚 Documentation

### 📖 Essential Guides
- **[Documentation Hub](./docs/README.md)** - Complete documentation index
- **[Platform Status](./docs/current/PLATFORM_STATUS_MASTER.md)** - Current status and features
- **[Platform Roadmap](./docs/current/PLATFORM_ROADMAP_MASTER.md)** - Future development plans

### 👥 User Documentation
- **[User Guide](./docs/guides/USER_GUIDE.md)** - For merchants and couriers
- **[Admin Guide](./docs/guides/ADMIN_GUIDE.md)** - For platform administrators
- **[Developer Guide](./docs/guides/DEVELOPER_GUIDE.md)** - For developers

### 🔧 Technical Documentation
- **[Deployment Guide](./docs/technical/DEPLOYMENT.md)** - Deployment procedures
- **[Development Guide](./docs/technical/DEVELOPMENT.md)** - Development setup
- **[Data Sources](./docs/technical/DATA_SOURCES.md)** - Data architecture
- **[E-commerce Integration](./docs/technical/ECOMMERCE_FLOW_PLAN.md)** - E-commerce setup

## 🧪 Demo Users

Demo user credentials:
- `admin@performile.com` - Admin user (password: `password123`)
- `merchant@performile.com` - Merchant (Sarah Johnson) (password: `admin123`)
- `courier@performile.com` - Courier (Mike Anderson) (password: `password123`)
- `consumer@performile.com` - Consumer (Emma Wilson) (password: `password123`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests: `npm run lint && npm test`
6. Submit a pull request
7. Vercel will automatically deploy preview

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: Project documentation files
- **Deployment**: Vercel dashboard and logs
 
