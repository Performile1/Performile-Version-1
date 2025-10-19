/**
 * Environment Variable Utilities
 * Provides type-safe access to environment variables
 * 
 * Created: October 19, 2025
 * Purpose: Fix TypeScript errors in API files
 */

/**
 * Get an environment variable with validation
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if not found
 * @returns The environment variable value
 * @throws Error if variable is not found and no default provided
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

/**
 * Get an environment variable as a number
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if not found
 * @returns The environment variable value as a number
 */
export function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = getEnvVar(key, defaultValue?.toString());
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} is not a valid number: ${value}`);
  }
  
  return parsed;
}

/**
 * Get an environment variable as a boolean
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if not found
 * @returns The environment variable value as a boolean
 */
export function getEnvVarAsBoolean(key: string, defaultValue?: boolean): boolean {
  const value = getEnvVar(key, defaultValue?.toString());
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Check if an environment variable exists
 * @param key - The environment variable key
 * @returns True if the variable exists
 */
export function hasEnvVar(key: string): boolean {
  return process.env[key] !== undefined && process.env[key] !== '';
}

/**
 * Get Supabase configuration from environment
 */
export function getSupabaseConfig() {
  return {
    url: getEnvVar('SUPABASE_URL'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY'),
    serviceKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', ''),
  };
}

/**
 * Get Stripe configuration from environment
 */
export function getStripeConfig() {
  return {
    secretKey: getEnvVar('STRIPE_SECRET_KEY'),
    webhookSecret: getEnvVar('STRIPE_WEBHOOK_SECRET', ''),
    publishableKey: getEnvVar('STRIPE_PUBLISHABLE_KEY', ''),
  };
}

/**
 * Get email configuration from environment
 */
export function getEmailConfig() {
  return {
    resendApiKey: getEnvVar('RESEND_API_KEY'),
    fromEmail: getEnvVar('FROM_EMAIL', 'noreply@performile.com'),
  };
}

/**
 * Get JWT configuration from environment
 */
export function getJwtConfig() {
  return {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV', 'development') === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV', 'development') === 'development';
}

/**
 * Get the current environment name
 */
export function getEnvironment(): string {
  return getEnvVar('NODE_ENV', 'development');
}
