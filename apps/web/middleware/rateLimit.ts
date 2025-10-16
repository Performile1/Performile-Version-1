import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple in-memory rate limiter for Vercel serverless functions
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: number[];
}

const requests: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(requests).forEach(key => {
    requests[key] = requests[key].filter(time => time > now - 900000); // Keep last 15 min
    if (requests[key].length === 0) {
      delete requests[key];
    }
  });
}, 300000);

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  message?: string;      // Custom error message
}

/**
 * Rate limiting middleware
 * @param config Rate limit configuration
 * @returns Middleware function
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    maxRequests = 100,
    message = 'Too many requests, please try again later'
  } = config;

  return (req: VercelRequest, res: VercelResponse, next?: () => void): boolean => {
    // Get client identifier (IP address)
    const identifier = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (req.headers['x-real-ip'] as string) ||
      req.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    const windowStart = now - windowMs;

    // Initialize or get existing request times for this identifier
    if (!requests[identifier]) {
      requests[identifier] = [];
    }

    // Filter out requests outside the current window
    requests[identifier] = requests[identifier].filter(time => time > windowStart);

    // Check if limit exceeded
    if (requests[identifier].length >= maxRequests) {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
      return false;
    }

    // Add current request
    requests[identifier].push(now);

    // Call next middleware if provided
    if (next) {
      next();
    }

    return true;
  };
}

/**
 * Strict rate limiter for sensitive endpoints (login, register)
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many attempts, please try again in 15 minutes'
});

/**
 * Standard rate limiter for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Rate limit exceeded, please try again later'
});

/**
 * Generous rate limiter for public endpoints
 */
export const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 300,
  message: 'Rate limit exceeded'
});
