/**
 * WEEK 3: RATE LIMITING MIDDLEWARE
 * Purpose: Protect API endpoints from abuse
 * Features: Per-user, per-IP, per-API-key rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * In-memory rate limit store
 * In production, use Redis for distributed rate limiting
 */
class RateLimitStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  increment(key: string, windowMs: number): { count: number; resetAt: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetAt > now) {
      // Within window, increment
      existing.count++;
      return existing;
    } else {
      // New window
      const resetAt = now + windowMs;
      const entry = { count: 1, resetAt };
      this.store.set(key, entry);
      return entry;
    }
  }

  get(key: string): { count: number; resetAt: number } | null {
    const now = Date.now();
    const existing = this.store.get(key);

    if (existing && existing.resetAt > now) {
      return existing;
    }

    return null;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetAt <= now) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every minute
setInterval(() => rateLimitStore.cleanup(), 60000);

/**
 * Rate limit options
 */
interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string; // Error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skip?: (req: Request) => boolean; // Skip rate limiting for certain requests
  handler?: (req: Request, res: Response) => void; // Custom handler when limit exceeded
}

/**
 * Create rate limit middleware
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 60, // 60 requests per minute
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Default: use user ID or IP address
      return req.user?.id || req.ip || 'anonymous';
    },
    skip = () => false,
    handler = (req, res) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if needed
      if (skip(req)) {
        return next();
      }

      // Generate key
      const key = keyGenerator(req);

      // Increment counter
      const { count, resetAt } = rateLimitStore.increment(key, windowMs);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count));
      res.setHeader('X-RateLimit-Reset', new Date(resetAt).toISOString());

      // Check if limit exceeded
      if (count > max) {
        res.setHeader('Retry-After', Math.ceil((resetAt - Date.now()) / 1000));
        return handler(req, res);
      }

      next();
    } catch (error) {
      console.error('Rate limit error:', error);
      next(); // Don't block on errors
    }
  };
}

/**
 * Rate limiter for API key authenticated requests
 */
export function apiKeyRateLimiter() {
  return createRateLimiter({
    windowMs: 3600000, // 1 hour
    max: 1000, // Default 1000 requests per hour
    keyGenerator: (req) => {
      // Use API key ID if available
      if (req.apiKey?.api_key_id) {
        return `api_key:${req.apiKey.api_key_id}`;
      }
      return req.ip || 'anonymous';
    },
    handler: async (req, res) => {
      // Log rate limit exceeded event
      if (req.apiKey) {
        await supabase.from('week3_integration_events').insert({
          event_type: 'api_key.rate_limit_exceeded',
          entity_type: 'api_key',
          entity_id: req.apiKey.api_key_id,
          user_id: req.apiKey.user_id,
          event_data: {
            api_key_id: req.apiKey.api_key_id,
            limit: req.apiKey.rate_limit_per_hour
          },
          status: 'failed',
          error_message: 'Rate limit exceeded'
        });
      }

      res.status(429).json({
        error: 'API rate limit exceeded',
        limit: req.apiKey?.rate_limit_per_hour || 1000,
        retryAfter: 3600 // 1 hour
      });
    }
  });
}

/**
 * Strict rate limiter for sensitive endpoints
 */
export function strictRateLimiter() {
  return createRateLimiter({
    windowMs: 900000, // 15 minutes
    max: 10, // Only 10 requests per 15 minutes
    message: 'Too many requests to sensitive endpoint. Please try again later.'
  });
}

/**
 * Generous rate limiter for public endpoints
 */
export function publicRateLimiter() {
  return createRateLimiter({
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
    keyGenerator: (req) => req.ip || 'anonymous'
  });
}

/**
 * Per-user rate limiter
 */
export function userRateLimiter(max: number = 60, windowMs: number = 60000) {
  return createRateLimiter({
    windowMs,
    max,
    keyGenerator: (req) => {
      if (!req.user?.id) {
        throw new Error('User authentication required');
      }
      return `user:${req.user.id}`;
    }
  });
}

/**
 * Per-store rate limiter
 */
export function storeRateLimiter(max: number = 100, windowMs: number = 60000) {
  return createRateLimiter({
    windowMs,
    max,
    keyGenerator: (req) => {
      const storeId = req.params.store_id || req.query.store_id || req.body.store_id;
      if (!storeId) {
        throw new Error('Store ID required');
      }
      return `store:${storeId}`;
    }
  });
}

/**
 * Adaptive rate limiter based on subscription tier
 */
export async function adaptiveRateLimiter(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) {
      return next();
    }

    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', req.user.id)
      .eq('status', 'active')
      .single();

    // Determine rate limit based on tier
    let max = 60; // Default
    if (subscription?.subscription_plans?.tier === 'premium') {
      max = 300;
    } else if (subscription?.subscription_plans?.tier === 'enterprise') {
      max = 1000;
    }

    // Apply rate limit
    const limiter = createRateLimiter({
      windowMs: 60000,
      max,
      keyGenerator: (req) => `user:${req.user!.id}`,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          limit: max,
          tier: subscription?.subscription_plans?.tier || 'free',
          message: 'Upgrade your plan for higher rate limits',
          retryAfter: 60
        });
      }
    });

    return limiter(req, res, next);
  } catch (error) {
    console.error('Adaptive rate limiter error:', error);
    next(); // Don't block on errors
  }
}

/**
 * Export default rate limiter
 */
export const defaultRateLimiter = createRateLimiter();
