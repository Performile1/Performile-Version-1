import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Standard Error Response Interface
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined Error Classes
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(message, 403, true);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'A database error occurred', details?: any) {
    super(message, 500, true, details);
    this.name = 'DatabaseError';
  }
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: Error | AppError,
  req: Request
): ErrorResponse {
  const isAppError = error instanceof AppError;
  
  return {
    success: false,
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    statusCode: isAppError ? error.statusCode : 500,
    timestamp: new Date().toISOString(),
    path: req.path,
    details: isAppError ? error.details : undefined,
  };
}

/**
 * Send error response
 */
export function sendErrorResponse(
  res: Response,
  error: Error | AppError,
  req: Request
): void {
  const errorResponse = formatErrorResponse(error, req);
  
  // Log error
  logger.error('Error response sent', {
    error: errorResponse.error,
    message: errorResponse.message,
    statusCode: errorResponse.statusCode,
    path: errorResponse.path,
    stack: error.stack,
  });

  res.status(errorResponse.statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: any): AppError {
  // PostgreSQL error codes
  const pgErrors: Record<string, { message: string; statusCode: number }> = {
    '23505': { message: 'Duplicate entry. This record already exists.', statusCode: 409 },
    '23503': { message: 'Referenced record not found.', statusCode: 400 },
    '23502': { message: 'Required field is missing.', statusCode: 400 },
    '22P02': { message: 'Invalid input format.', statusCode: 400 },
    '42P01': { message: 'Database table not found.', statusCode: 500 },
    '42703': { message: 'Database column not found.', statusCode: 500 },
  };

  const errorCode = error.code;
  const errorInfo = pgErrors[errorCode];

  if (errorInfo) {
    return new AppError(errorInfo.message, errorInfo.statusCode, true, {
      code: errorCode,
      detail: error.detail,
      constraint: error.constraint,
    });
  }

  // Generic database error
  return new DatabaseError('A database error occurred', {
    code: errorCode,
    message: error.message,
  });
}

/**
 * Handle validation errors
 */
export function handleValidationError(errors: any[]): ValidationError {
  const formattedErrors = errors.map((err) => ({
    field: err.param || err.field,
    message: err.msg || err.message,
    value: err.value,
  }));

  return new ValidationError('Validation failed', formattedErrors);
}

/**
 * Global error handler middleware
 */
export function globalErrorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Don't handle if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Handle different error types
  let handledError: AppError;

  if (error instanceof AppError) {
    handledError = error;
  } else if (error.name === 'ValidationError') {
    handledError = new ValidationError(error.message);
  } else if (error.message?.includes('database') || error.message?.includes('query')) {
    handledError = handleDatabaseError(error);
  } else {
    // Unknown error
    handledError = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      500,
      false
    );
  }

  // Send error response
  sendErrorResponse(res, handledError, req);

  // Log critical errors
  if (!handledError.isOperational) {
    logger.error('Critical error occurred', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  }
}

/**
 * Handle 404 errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = new NotFoundError('The requested resource was not found');
  sendErrorResponse(res, error, req);
}

/**
 * Try-catch wrapper for route handlers
 */
export function tryCatch(handler: Function) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    throw new ValidationError('Missing required fields', {
      missingFields,
      providedFields: Object.keys(data),
    });
  }
}

/**
 * Success response helper
 */
export function sendSuccessResponse(
  res: Response,
  data: any,
  message?: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Paginated response helper
 */
export function sendPaginatedResponse(
  res: Response,
  data: any[],
  page: number,
  limit: number,
  total: number,
  message?: string
): void {
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    message,
    timestamp: new Date().toISOString(),
  });
}
