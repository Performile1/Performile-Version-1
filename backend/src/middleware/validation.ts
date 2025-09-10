import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { AppError } from '../types';
import logger from '../utils/logger';

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined,
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: validationErrors,
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input data',
      details: validationErrors,
    });
    return;
  }
  
  next();
};

// Auth validation rules
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  handleValidationErrors,
];

export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required and must be less than 100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required and must be less than 100 characters'),
  body('user_role')
    .isIn(['merchant', 'courier', 'consumer'])
    .withMessage('User role must be merchant, courier, or consumer'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors,
];

// Order validation rules
export const validateCreateOrder = [
  body('tracking_number')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Tracking number is required and must be less than 100 characters'),
  body('store_id')
    .isUUID()
    .withMessage('Store ID must be a valid UUID'),
  body('courier_id')
    .isUUID()
    .withMessage('Courier ID must be a valid UUID'),
  body('consumer_id')
    .optional()
    .isUUID()
    .withMessage('Consumer ID must be a valid UUID'),
  body('order_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Order number must be less than 100 characters'),
  body('estimated_delivery')
    .optional()
    .isISO8601()
    .withMessage('Estimated delivery must be a valid date'),
  body('level_of_service')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Level of service must be less than 100 characters'),
  body('type_of_delivery')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Type of delivery must be less than 100 characters'),
  body('postal_code')
    .optional()
    .matches(/^[0-9A-Za-z\s-]{3,20}$/)
    .withMessage('Postal code must be 3-20 characters and contain only letters, numbers, spaces, and hyphens'),
  body('country')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Country must be a 3-character ISO code'),
  body('delivery_address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Delivery address must be less than 500 characters'),
  handleValidationErrors,
];

export const validateUpdateOrder = [
  param('orderId')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('delivery_date')
    .optional()
    .isISO8601()
    .withMessage('Delivery date must be a valid date'),
  body('order_status')
    .optional()
    .isIn(['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'failed'])
    .withMessage('Invalid order status'),
  body('first_response_time')
    .optional()
    .matches(/^\d+:\d{2}:\d{2}$/)
    .withMessage('First response time must be in HH:MM:SS format'),
  body('issue_reported')
    .optional()
    .isBoolean()
    .withMessage('Issue reported must be a boolean'),
  body('issue_resolved')
    .optional()
    .isBoolean()
    .withMessage('Issue resolved must be a boolean'),
  body('delivery_attempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Delivery attempts must be between 1 and 10'),
  body('last_mile_duration')
    .optional()
    .matches(/^\d+:\d{2}:\d{2}$/)
    .withMessage('Last mile duration must be in HH:MM:SS format'),
  handleValidationErrors,
];

// Review validation rules
export const validateCreateReview = [
  body('order_id')
    .isUUID()
    .withMessage('Order ID must be a valid UUID'),
  body('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('on_time_delivery_score')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('On-time delivery score must be between 1 and 5'),
  body('package_condition_score')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Package condition score must be between 1 and 5'),
  body('communication_score')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Communication score must be between 1 and 5'),
  body('delivery_person_score')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Delivery person score must be between 1 and 5'),
  body('review_text')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Review text must be less than 2000 characters'),
  body('delay_minutes')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Delay minutes must be a non-negative integer'),
  handleValidationErrors,
];

// Store validation rules
export const validateCreateStore = [
  body('store_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Store name is required and must be less than 255 characters'),
  body('website_url')
    .optional()
    .isURL()
    .withMessage('Website URL must be a valid URL'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  handleValidationErrors,
];

// Courier validation rules
export const validateCreateCourier = [
  body('courier_name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Courier name is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('logo_url')
    .optional()
    .isURL()
    .withMessage('Logo URL must be a valid URL'),
  body('contact_email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Contact email must be a valid email address'),
  body('contact_phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Contact phone must be a valid phone number'),
  body('service_areas')
    .optional()
    .isArray()
    .withMessage('Service areas must be an array'),
  body('service_areas.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each service area must be 1-100 characters'),
  handleValidationErrors,
];

// Query validation rules
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort by field must be 1-50 characters'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors,
];

export const validateTrustScoreQuery = [
  query('country')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Country must be a 3-character ISO code'),
  query('postal_code')
    .optional()
    .matches(/^[0-9A-Za-z\s-]{3,20}$/)
    .withMessage('Postal code must be 3-20 characters'),
  query('min_reviews')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum reviews must be a non-negative integer'),
  query('courier_id')
    .optional()
    .isUUID()
    .withMessage('Courier ID must be a valid UUID'),
  handleValidationErrors,
];

// UUID parameter validation
export const validateUUIDParam = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors,
];

// File upload validation
export const validateFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: 'No file uploaded',
      message: 'Please select a file to upload',
    });
    return;
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Only JPEG, PNG, GIF, and WebP images are allowed',
    });
    return;
  }

  if (req.file.size > maxSize) {
    res.status(400).json({
      success: false,
      error: 'File too large',
      message: 'File size must be less than 5MB',
    });
    return;
  }

  next();
};

