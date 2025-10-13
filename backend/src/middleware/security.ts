import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { AppError } from '../types';
import logger from '../utils/logger';

// Rate limiting configuration
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: 'Too many requests',
      message: message || 'Rate limit exceeded. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: message || 'Rate limit exceeded. Please try again later.',
      });
    },
  });
};

// General rate limiting
export const generalRateLimit = createRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for auth endpoints
export const authRateLimit = createRateLimit(
  900000, // 15 minutes
  5, // 5 attempts per window
  'Too many authentication attempts, please try again later.'
);

// API rate limiting for authenticated users
export const apiRateLimit = createRateLimit(
  60000, // 1 minute
  60, // 60 requests per minute
  'API rate limit exceeded.'
);

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow Shopify domains for checkout extensions
    if (origin.includes('.myshopify.com') || origin.includes('shopify.com')) {
      return callback(null, true);
    }

    // Allow WooCommerce/WordPress sites (common patterns)
    if (origin.includes('woocommerce') || origin.includes('wordpress')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// Helmet security configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS attempts
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};

// Request size limiter
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        logger.warn('Request size exceeded', {
          contentLength: sizeInBytes,
          maxSize: maxSizeInBytes,
          ip: req.ip,
          path: req.path,
        });
        
        res.status(413).json({
          success: false,
          error: 'Request too large',
          message: `Request size exceeds maximum allowed size of ${maxSize}`,
        });
        return;
      }
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// IP whitelist middleware (for admin endpoints)
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      logger.warn('IP not whitelisted', {
        clientIP,
        allowedIPs,
        path: req.path,
      });
      
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Your IP address is not authorized to access this resource',
      });
      return;
    }
    
    next();
  };
};

// Utility function to parse size strings
function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  
  const value = parseFloat(match[1]!);
  const unit = match[2] || 'b';
  
  return Math.floor(value * (units[unit] || 1));
}

// Brute force protection
export const bruteForceProtection = () => {
  const attempts = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>();
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.body.email || 'unknown'}`;
    const now = Date.now();
    const userAttempts = attempts.get(key);

    if (userAttempts) {
      // Check if user is currently blocked
      if (userAttempts.blocked && (now - userAttempts.lastAttempt) < BLOCK_DURATION) {
        const remainingTime = Math.ceil((BLOCK_DURATION - (now - userAttempts.lastAttempt)) / 1000);
        
        res.status(429).json({
          success: false,
          error: 'Account temporarily blocked',
          message: `Too many failed attempts. Try again in ${remainingTime} seconds.`,
          retryAfter: remainingTime,
        });
        return;
      }

      // Reset if block duration has passed
      if (userAttempts.blocked && (now - userAttempts.lastAttempt) >= BLOCK_DURATION) {
        attempts.delete(key);
      }
      // Reset if attempt window has passed
      else if ((now - userAttempts.lastAttempt) >= ATTEMPT_WINDOW) {
        attempts.delete(key);
      }
    }

    // Store original end function to intercept response
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      if (res.statusCode === 401 || res.statusCode === 403) {
        // Failed authentication attempt
        const current = attempts.get(key) || { count: 0, lastAttempt: 0, blocked: false };
        current.count++;
        current.lastAttempt = now;
        
        if (current.count >= MAX_ATTEMPTS) {
          current.blocked = true;
          logger.warn('User blocked due to brute force attempts', {
            key,
            attempts: current.count,
            ip: req.ip,
          });
        }
        
        attempts.set(key, current);
      } else if (res.statusCode === 200) {
        // Successful authentication, clear attempts
        attempts.delete(key);
      }
      
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

