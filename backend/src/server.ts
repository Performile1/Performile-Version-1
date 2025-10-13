// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
const envPath = require('path').join(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);
console.log('.env file exists:', require('fs').existsSync(envPath));
const result = dotenv.config({ path: envPath });
console.log('dotenv result:', result.error ? result.error.message : 'SUCCESS');
console.log('DB_PASSWORD after dotenv:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');

import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import RedisStore from 'connect-redis';

// Import configurations
import database from './config/database';
import redisClient from './config/redis';
import logger from './utils/logger';

// Import middleware
import { corsOptions, helmetConfig, generalRateLimit, sanitizeInput, securityHeaders, requestSizeLimit } from './middleware/security';
import { AppError } from './types';
import ratingProcessor from './jobs/ratingProcessor';

// Import routes
import authRoutes from './routes/auth';
import trustScoreRoutes from './routes/trustscore';
import teamRoutes from './routes/team';
import analyticsRoutes from './routes/analytics';
import ratingRoutes from './routes/rating';
import adminRoutes from './routes/admin';
import integrationRoutes from './routes/integration';
import shopifyRoutes from './routes/shopify';
import courierRoutes from './routes/courierRoutes';
import merchantDashboardRoutes from './routes/merchant-dashboard';
import courierCheckoutAnalyticsRoutes from './routes/courier-checkout-analytics';
import merchantCheckoutAnalyticsRoutes from './routes/merchant-checkout-analytics';


class Server {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmetConfig);
    this.app.use(cors(corsOptions));
    this.app.use(securityHeaders);
    this.app.use(generalRateLimit);
    this.app.use(requestSizeLimit('10mb'));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression middleware
    this.app.use(compression());

    // Input sanitization
    this.app.use(sanitizeInput);

    // Logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.http(message.trim());
        }
      }
    }));

    // Session middleware with Redis store
    this.app.use(session({
      store: new RedisStore({ client: redisClient.getClient() }),
      secret: process.env.SESSION_SECRET || 'fallback-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      },
      name: 'performile.sid'
    }));

    // Trust proxy for accurate IP addresses behind reverse proxy
    this.app.set('trust proxy', 1);
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', async (req, res) => {
      try {
        const dbHealth = await database.healthCheck();
        const redisHealth = await redisClient.healthCheck();

        const health = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          version: process.env.npm_package_version || '1.0.0',
          services: {
            database: dbHealth ? 'healthy' : 'unhealthy',
            redis: redisHealth ? 'healthy' : 'unhealthy'
          }
        };

        const statusCode = dbHealth && redisHealth ? 200 : 503;
        res.status(statusCode).json(health);
      } catch (error) {
        logger.error('Health check failed', error);
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          message: 'Health check failed'
        });
      }
    });

    // Register routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/trustscore', trustScoreRoutes);
    this.app.use('/api/team', teamRoutes);
    this.app.use('/api/analytics', analyticsRoutes);
    this.app.use('/api/rating', ratingRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/integration', integrationRoutes);
    this.app.use('/api/shopify', shopifyRoutes);
    this.app.use('/api/couriers', courierRoutes);
    this.app.use('/api/merchant', merchantDashboardRoutes);
    this.app.use('/api/courier/checkout-analytics', courierCheckoutAnalyticsRoutes);
    this.app.use('/api/merchant/checkout-analytics', merchantCheckoutAnalyticsRoutes);

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Performile API',
        version: '1.0.0',
        description: 'Logistics Performance Platform API',
        endpoints: {
          auth: '/api/auth',
          trustscore: '/api/trustscore',
          health: '/api/health'
        },
        documentation: 'https://docs.performile.com'
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested API endpoint was not found',
        path: req.originalUrl
      });
    });

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Performile API Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Handle known application errors
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
          message: error.message,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }

      // Handle database errors
      if (error.name === 'DatabaseError' || error.message.includes('database')) {
        res.status(500).json({
          success: false,
          error: 'Database Error',
          message: 'A database error occurred',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          path: req.path
        });
        return;
      }

      // Default error response
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    });

    // Handle 404 for non-API routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'The requested resource was not found',
        statusCode: 404,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to Redis
      await redisClient.connect();

      // Test database connection
      try {
        await database.healthCheck();
        logger.info('Database connected successfully');
      } catch (error) {
        logger.warn('Database connection failed, continuing without database', error);
      }

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      // Start the HTTP server
      this.app.listen(this.port, () => {
        logger.info(`🚀 Performile API Server running on port ${this.port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 Health check: http://localhost:${this.port}/api/health`);
        logger.info(`📖 API docs: http://localhost:${this.port}/api`);
      });

      // Start background jobs
      ratingProcessor.initializeJobs();
      logger.info('📈 Background rating processor started');

    } catch (error) {
      logger.error('Failed to start server', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        // Close database connections
        await database.close();
        
        // Close Redis connection
        await redisClient.disconnect();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', error);
        process.exit(1);
      }
    };

    // Handle process termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

export default Server;

