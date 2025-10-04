/**
 * Input validation and sanitization utilities
 * Prevents SQL injection, XSS, and other attacks
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number (basic international format)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitize SQL input (basic - use parameterized queries instead!)
 * This is a backup - ALWAYS use parameterized queries
 */
export function sanitizeSQL(input: string): string {
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Validate postal code (basic format)
 */
export function validatePostalCode(code: string): boolean {
  // Supports various formats: 12345, 12345-6789, A1A 1A1, etc.
  const postalRegex = /^[A-Z0-9\s\-]{3,10}$/i;
  return postalRegex.test(code);
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate number within range
 */
export function validateNumberRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Validate string length
 */
export function validateLength(str: string, min: number, max: number): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Validate array of allowed values
 */
export function validateEnum<T>(value: T, allowedValues: T[]): boolean {
  return allowedValues.includes(value);
}

/**
 * Comprehensive input validator
 */
export class InputValidator {
  private errors: string[] = [];

  /**
   * Add validation error
   */
  private addError(field: string, message: string): void {
    this.errors.push(`${field}: ${message}`);
  }

  /**
   * Validate required field
   */
  required(field: string, value: any): this {
    if (value === null || value === undefined || value === '') {
      this.addError(field, 'This field is required');
    }
    return this;
  }

  /**
   * Validate email field
   */
  email(field: string, value: string): this {
    if (value && !validateEmail(value)) {
      this.addError(field, 'Invalid email format');
    }
    return this;
  }

  /**
   * Validate password field
   */
  password(field: string, value: string): this {
    if (value) {
      const result = validatePassword(value);
      if (!result.valid) {
        result.errors.forEach(err => this.addError(field, err));
      }
    }
    return this;
  }

  /**
   * Validate UUID field
   */
  uuid(field: string, value: string): this {
    if (value && !validateUUID(value)) {
      this.addError(field, 'Invalid UUID format');
    }
    return this;
  }

  /**
   * Validate string length
   */
  length(field: string, value: string, min: number, max: number): this {
    if (value && !validateLength(value, min, max)) {
      this.addError(field, `Must be between ${min} and ${max} characters`);
    }
    return this;
  }

  /**
   * Validate number range
   */
  range(field: string, value: number, min: number, max: number): this {
    if (value !== undefined && !validateNumberRange(value, min, max)) {
      this.addError(field, `Must be between ${min} and ${max}`);
    }
    return this;
  }

  /**
   * Get validation result
   */
  getResult(): { valid: boolean; errors: string[] } {
    return {
      valid: this.errors.length === 0,
      errors: this.errors
    };
  }

  /**
   * Reset validator
   */
  reset(): this {
    this.errors = [];
    return this;
  }
}

/**
 * Example usage:
 * 
 * const validator = new InputValidator();
 * validator
 *   .required('email', email)
 *   .email('email', email)
 *   .required('password', password)
 *   .password('password', password);
 * 
 * const result = validator.getResult();
 * if (!result.valid) {
 *   return res.status(400).json({ errors: result.errors });
 * }
 */
