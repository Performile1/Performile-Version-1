# Performile Development Guide

## Quick Start

### Prerequisites
- Node.js 22+
- Docker Desktop
- Git

### Setup Commands
```bash
# Clone and setup
git clone <repository-url>
cd performile
npm run setup          # Install dependencies and build Docker images
npm run db:setup       # Initialize database with schema and seed data
npm start              # Start all services
```

Access the application at: **http://localhost**

## Development Workflow

### Local Development (without Docker)
```bash
# Terminal 1: Start database and Redis
docker-compose up postgres redis

# Terminal 2: Start backend
cd backend
npm run dev

# Terminal 3: Start frontend
cd frontend  
npm run dev
```

### Docker Development
```bash
# Start all services
docker-compose up

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose build
docker-compose up
```

## Project Structure

```
performile/
├── backend/                 # Node.js/TypeScript API
│   ├── src/
│   │   ├── config/         # Database, Redis configuration
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, security, validation
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Utilities, logger
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React/TypeScript UI
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   ├── store/          # State management
│   │   └── types/          # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── database/               # PostgreSQL schema and functions
│   ├── schema.sql          # Database schema
│   ├── trustscore_functions.sql  # TrustScore calculations
│   └── seed_data.sql       # Sample data
├── nginx/                  # Reverse proxy configuration
└── scripts/                # Setup and deployment scripts
```

## Key Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Merchant, Courier, Consumer)
- Secure password hashing with bcrypt
- Rate limiting and brute force protection

### TrustScore System
- Advanced courier rating algorithm
- Real-time score calculations
- Performance metrics tracking
- Weighted scoring based on multiple factors

### Security Features
- CORS protection
- Helmet security headers
- Input sanitization
- CSRF protection
- Rate limiting
- Request size limiting

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### TrustScore
- `GET /api/trustscore` - Get courier trust scores
- `GET /api/trustscore/dashboard` - Get dashboard statistics
- `GET /api/trustscore/trends` - Get performance trends
- `POST /api/trustscore/update` - Update trust score cache

## Database Schema

### Core Tables
- **users** - User accounts and profiles
- **subscription_plans** - Available subscription tiers
- **user_subscriptions** - User subscription mappings
- **stores** - Merchant store information
- **couriers** - Courier profiles and settings
- **orders** - Order tracking and details
- **reviews** - Customer reviews and ratings
- **courier_trust_scores** - Cached trust score data

### TrustScore Calculation
The system uses a sophisticated algorithm that considers:
- Customer ratings (weight: 25%)
- Completion rate (weight: 20%)
- On-time delivery rate (weight: 20%)
- Response time (weight: 15%)
- Customer satisfaction (weight: 10%)
- Issue resolution rate (weight: 5%)
- Delivery attempts (weight: 3%)
- Last mile performance (weight: 2%)

## Environment Configuration

### Required Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=performile_db
DB_USER=performile_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# External APIs
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=...
```

## Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:coverage      # Coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                   # Run all tests
npm run test:coverage     # Coverage report
```

## Deployment

### Production Deployment
1. Update environment variables for production
2. Enable HTTPS in Nginx configuration
3. Set up SSL certificates
4. Configure monitoring and logging
5. Deploy with Docker Compose

```bash
# Production build
npm run build
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks
- Backend: `GET /api/health`
- Frontend: `GET /health`
- Database: Automatic health checks in Docker

## Monitoring & Logging

### Logging
- Winston logger with file and console outputs
- Structured JSON logging in production
- Log rotation and retention policies
- Security event logging

### Health Monitoring
- Application health endpoints
- Database connection monitoring
- Redis connection monitoring
- Docker container health checks

## Security Best Practices

### Development
- Never commit secrets to version control
- Use environment variables for configuration
- Keep dependencies updated
- Run security audits regularly

### Production
- Enable HTTPS with valid SSL certificates
- Configure proper CORS origins
- Set up rate limiting
- Enable security headers
- Monitor for security events
- Regular security audits

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
npm run db:setup
```

**Frontend Build Errors**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Docker Issues**
```bash
# Clean up Docker resources
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

### Performance Optimization
- Enable Redis caching for frequently accessed data
- Use database indexes for query optimization
- Implement pagination for large datasets
- Optimize bundle sizes with code splitting
- Use CDN for static assets in production

## Contributing

1. Create feature branch from `main`
2. Make changes with appropriate tests
3. Run linting and tests
4. Submit pull request with description
5. Ensure CI/CD pipeline passes

### Code Standards
- TypeScript strict mode enabled
- ESLint and Prettier configuration
- Conventional commit messages
- Comprehensive test coverage
- Documentation for new features
