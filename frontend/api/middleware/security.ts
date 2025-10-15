import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// CORS whitelist - production domains
const CORS_WHITELIST = [
  'https://performile.com',
  'https://www.performile.com',
  'https://performile.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Rate limiting configuration
const RATE_LIMITS = {
  default: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  auth: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 auth attempts per 15 minutes
  upload: { requests: 10, windowMs: 60 * 1000 }, // 10 uploads per minute
  payment: { requests: 3, windowMs: 60 * 1000 }, // 3 payments per minute
  email: { requests: 20, windowMs: 60 * 1000 } // 20 emails per minute
};

// Input validation schemas
const validationSchemas = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^\+?[\d\s\-\(\)]{10,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  postalCode: /^[A-Za-z0-9\s\-]{3,10}$/,
  price: /^\d+(\.\d{1,2})?$/
};

// Get client IP address
const getClientIP = (req: VercelRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (typeof realIP === 'string') {
    return realIP;
  }
  return req.connection?.remoteAddress || 'unknown';
};

// CORS middleware
export const corsMiddleware = (req: VercelRequest, res: VercelResponse): boolean => {
  const origin = req.headers.origin;
  
  // Allow requests without origin (mobile apps, Postman, etc.)
  if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return true;
  }

  // Check if origin is in whitelist
  if (CORS_WHITELIST.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    return true;
  }

  // Block unauthorized origins in production
  if (process.env.NODE_ENV === 'production') {
    res.status(403).json({
      success: false,
      message: 'CORS: Origin not allowed'
    });
    return false;
  }

  // Allow all origins in development
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return true;
};

// Rate limiting middleware
export const rateLimitMiddleware = (
  req: VercelRequest, 
  res: VercelResponse, 
  endpoint: keyof typeof RATE_LIMITS = 'default'
): boolean => {
  const clientIP = getClientIP(req);
  const now = Date.now();
  const limit = RATE_LIMITS[endpoint];
  const key = `${clientIP}:${endpoint}`;

  // Clean up expired entries
  for (const [storeKey, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(storeKey);
    }
  }

  // Get or create rate limit data for this client
  let rateLimitData = rateLimitStore.get(key);
  
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitData = {
      count: 0,
      resetTime: now + limit.windowMs
    };
  }

  rateLimitData.count++;
  rateLimitStore.set(key, rateLimitData);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.requests.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit.requests - rateLimitData.count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitData.resetTime / 1000).toString());

  // Check if rate limit exceeded
  if (rateLimitData.count > limit.requests) {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((rateLimitData.resetTime - now) / 1000)
    });
    return false;
  }

  return true;
};

// Input validation middleware
export const validateInput = (data: any, schema: { [key: string]: any }): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors.push(`${field} is required`);
      continue;
    }

    // Skip validation if field is not required and empty
    if (!rules.required && (!value || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
      continue;
    }

    // String length validation
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters long`);
    }
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
    }

    // Number range validation
    if (rules.min && typeof value === 'number' && value < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
    if (rules.max && typeof value === 'number' && value > rules.max) {
      errors.push(`${field} must be no more than ${rules.max}`);
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      const pattern = validationSchemas[rules.pattern as keyof typeof validationSchemas] || rules.pattern;
      if (!pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// SQL injection prevention
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove or escape potentially dangerous characters
    return input
      .replace(/'/g, "''") // Escape single quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove SQL block comments start
      .replace(/\*\//g, '') // Remove SQL block comments end
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Helper to get JWT secret (matches auth.ts) - Updated for deployment
const getJWTSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  WARNING: Using fallback JWT_SECRET in development');
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET too short (min 32 chars)');
  }
  return secret;
};

// JWT verification with enhanced security
export const verifyTokenSecure = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization token provided');
  }

  const token = authHeader.substring(7);
  
  if (!token || token.length < 10) {
    throw new Error('Invalid token format');
  }

  try {
    const jwtSecret = getJWTSecret();
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Check token expiration with buffer
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token has expired');
    }
    
    // Validate required token fields
    if (!decoded.userId && !decoded.user_id) {
      console.error('[Security] Token missing userId:', decoded);
      throw new Error('Invalid token payload');
    }
    
    // Normalize userId field (support both userId and user_id)
    if (decoded.user_id && !decoded.userId) {
      decoded.userId = decoded.user_id;
    }
    
    return decoded;
  } catch (error: any) {
    console.error('[Security] Token verification failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw error;
    }
  }
};

// Security headers middleware
export const securityHeaders = (res: VercelResponse): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
};

// Combined security middleware
export const applySecurityMiddleware = (
  req: VercelRequest, 
  res: VercelResponse, 
  options: {
    rateLimit?: keyof typeof RATE_LIMITS;
    requireAuth?: boolean;
    validateSchema?: { [key: string]: any };
  } = {}
): { success: boolean; user?: any; errors?: string[] } => {
  
  // Apply security headers
  securityHeaders(res);
  
  // Apply CORS
  if (!corsMiddleware(req, res)) {
    return { success: false };
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return { success: false };
  }
  
  // Apply rate limiting
  if (options.rateLimit && !rateLimitMiddleware(req, res, options.rateLimit)) {
    return { success: false };
  }
  
  // Sanitize input
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  
  // Validate input schema
  if (options.validateSchema && req.body) {
    const validation = validateInput(req.body, options.validateSchema);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
      return { success: false, errors: validation.errors };
    }
  }
  
  // Verify authentication
  let user = null;
  if (options.requireAuth) {
    try {
      user = verifyTokenSecure(req);
      // Attach user to request for downstream handlers
      (req as any).user = user;
    } catch (error: any) {
      res.status(401).json({
        success: false,
        message: error.message || 'Authentication failed'
      });
      return { success: false };
    }
  }
  
  return { success: true, user };
};

// Export validation schemas for reuse
export const schemas = {
  courierRegistration: {
    courier_name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    email: { required: true, type: 'string', pattern: 'email' },
    phone: { required: true, type: 'string', pattern: 'phone' },
    city: { required: true, type: 'string', minLength: 2, maxLength: 50 },
    postal_code: { required: true, type: 'string', pattern: 'postalCode' },
    country: { required: true, type: 'string', minLength: 2, maxLength: 50 }
  },
  
  leadPurchase: {
    lead_id: { required: true, type: 'string', pattern: 'uuid' },
    paymentMethodId: { required: true, type: 'string', minLength: 10 }
  },
  
  leads: {
    company_name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    contact_name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    contact_email: { required: true, type: 'string', pattern: 'email' },
    contact_phone: { required: false, type: 'string', pattern: 'phone' },
    service_type: { required: true, type: 'string', enum: ['standard', 'express', 'same_day', 'scheduled'] },
    pickup_address: { required: true, type: 'string', minLength: 10, maxLength: 200 },
    delivery_address: { required: true, type: 'string', minLength: 10, maxLength: 200 },
    lead_price: { required: false, type: 'number', min: 0, max: 10000 }
  },
  
  orderCreate: {
    courier_id: { required: true, type: 'string', pattern: 'uuid' },
    service_type: { required: true, type: 'string', enum: ['standard', 'express', 'same_day', 'scheduled'] },
    pickup_address: { required: true, type: 'string', minLength: 10, maxLength: 200 },
    delivery_address: { required: true, type: 'string', minLength: 10, maxLength: 200 }
  },
  
  fileUpload: {
    filename: { required: true, type: 'string', minLength: 1, maxLength: 255 },
    fileType: { required: true, type: 'string', minLength: 3, maxLength: 50 },
    documentType: { required: true, type: 'string', enum: ['logo', 'license', 'insurance', 'certification'] }
  }
};
