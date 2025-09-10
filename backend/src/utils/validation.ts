import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';

// Enhanced validation schemas
export const schemas = {
  // User validation
  email: Joi.string()
    .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu', 'gov', 'se', 'dk', 'no', 'fi'] } })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),

  // UUID validation
  uuid: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid UUID format',
      'any.required': 'ID is required'
    }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().valid('created_at', 'updated_at', 'name', 'rating', 'trust_score'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Order validation
  trackingNumber: Joi.string()
    .alphanum()
    .min(5)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Tracking number must contain only letters and numbers',
      'string.min': 'Tracking number must be at least 5 characters',
      'string.max': 'Tracking number cannot exceed 50 characters'
    }),

  // Rating validation
  rating: Joi.number()
    .min(1)
    .max(5)
    .precision(2)
    .required()
    .messages({
      'number.min': 'Rating must be between 1 and 5',
      'number.max': 'Rating must be between 1 and 5'
    }),

  // Text validation with XSS protection
  safeText: Joi.string()
    .max(1000)
    .pattern(new RegExp('^[^<>]*$'))
    .messages({
      'string.pattern.base': 'Text cannot contain HTML tags',
      'string.max': 'Text cannot exceed 1000 characters'
    }),

  // Phone validation
  phone: Joi.string()
    .pattern(new RegExp('^[+]?[1-9]\\d{1,14}$'))
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),

  // Country code validation
  countryCode: Joi.string()
    .length(3)
    .uppercase()
    .valid('SWE', 'DNK', 'NOR', 'FIN', 'DEU', 'GBR', 'USA', 'CAN')
    .default('SWE')
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      throw new AppError(`Validation failed: ${errorDetails.map(e => e.message).join(', ')}`, 400);
    }

    req.body = value;
    next();
  };
};

// Query parameter validation
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      throw new AppError(`Query validation failed: ${errorDetails.map(e => e.message).join(', ')}`, 400);
    }

    req.query = value;
    next();
  };
};

// Sanitization utilities
export const sanitizeInput = {
  email: (email: string): string => email.toLowerCase().trim(),
  
  text: (text: string): string => {
    return text
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },
  
  sql: (input: string): string => {
    return input.replace(/['";\\]/g, '');
  }
};
