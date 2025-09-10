import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, JWTPayload, AppError } from '../types';
import database from '../config/database';
import logger from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from database
    const result = await database.query(
      'SELECT user_id, email, user_role, first_name, last_name, phone, is_verified, is_active, created_at, updated_at, last_login FROM Users WHERE user_id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or inactive', 401);
    }

    const user: User = result.rows[0];

    // Update last login
    await database.query(
      'UPDATE Users SET last_login = NOW() WHERE user_id = $1',
      [user.user_id]
    );

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication failed'
      });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        message: 'Authentication failed'
      });
      return;
    }

    logger.error('Authentication middleware error', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.user_role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.user_id,
        userRole: req.user.user_role,
        requiredRoles: allowedRoles
      });
      
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireMerchant = requireRole(['admin', 'merchant']);
export const requireCourier = requireRole(['admin', 'courier']);
export const requireConsumer = requireRole(['admin', 'consumer']);

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const result = await database.query(
      'SELECT user_id, email, user_role, first_name, last_name, phone, is_verified, is_active, created_at, updated_at, last_login FROM Users WHERE user_id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }

    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

// Check if user owns resource
export const requireOwnership = (resourceIdParam: string, ownerField: string = 'user_id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please authenticate first'
      });
      return;
    }

    // Admin can access everything
    if (req.user.user_role === 'admin') {
      next();
      return;
    }

    const resourceId = req.params[resourceIdParam];
    const userId = req.user.user_id;

    // For now, we'll implement a simple check
    // In a real implementation, you'd query the database to verify ownership
    if (ownerField === 'user_id' && resourceId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
      return;
    }

    next();
  };
};

// Rate limiting per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.user_id || req.ip || 'anonymous';
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }

    userRequests.count++;
    next();
  };
};

