import { Request, Response, NextFunction } from 'express';
import { getPoolStats, logPoolStats, setRLSContext } from '../utils/dbHelpers';
import logger from '../utils/logger';

/**
 * Middleware to monitor database pool health
 */
export function monitorPoolHealth(req: Request, res: Response, next: NextFunction): void {
  const stats = getPoolStats();

  // Warn if pool is getting full
  if (stats.totalCount >= 18) { // 90% of default max (20)
    logger.warn('Database pool nearing capacity', stats);
  }

  // Warn if many queries are waiting
  if (stats.waitingCount > 5) {
    logger.warn('High number of queries waiting for connection', stats);
  }

  next();
}

/**
 * Middleware to log pool stats periodically
 */
export function setupPoolMonitoring(): void {
  // Log pool stats every 5 minutes
  setInterval(() => {
    logPoolStats();
  }, 5 * 60 * 1000);

  logger.info('Database pool monitoring started');
}

/**
 * Middleware to set RLS context for authenticated requests
 */
export function setRLSMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user;

  if (user && user.user_id && user.user_role) {
    // Set RLS context asynchronously
    setRLSContext(user.user_id, user.user_role)
      .then(() => {
        logger.debug('RLS context set for request', {
          userId: user.user_id,
          role: user.user_role,
          path: req.path,
        });
        next();
      })
      .catch((error) => {
        logger.error('Failed to set RLS context', error);
        next(error);
      });
  } else {
    // No authenticated user, skip RLS
    next();
  }
}

/**
 * Middleware to track query performance
 */
export function trackQueryPerformance(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Override res.json to capture response time
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - start;

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`);

    return originalJson(body);
  };

  next();
}

/**
 * Middleware to handle connection errors gracefully
 */
export function handleConnectionErrors(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if it's a database connection error
  if (
    error.code === 'ECONNREFUSED' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('connection')
  ) {
    logger.error('Database connection error', {
      error: error.message,
      code: error.code,
      path: req.path,
    });

    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database connection error. Please try again later.',
      statusCode: 503,
      timestamp: new Date().toISOString(),
    });
  }

  // Pass to next error handler
  next(error);
}

/**
 * Middleware to add database utilities to request object
 */
export function attachDbHelpers(req: Request, res: Response, next: NextFunction): void {
  // Attach pool stats getter
  (req as any).getPoolStats = getPoolStats;

  next();
}
