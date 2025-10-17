/**
 * Environment variable utilities
 * Provides type-safe access to environment variables
 */

export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || defaultValue || '';
}

export function getRequiredEnvVar(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value;
}

export function getOptionalEnvVar(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue;
}

export function getEnvVarAsNumber(key: string, defaultValue?: number): number {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return defaultValue;
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  
  return parsed;
}

export function getEnvVarAsBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  
  if (!value) {
    return defaultValue;
  }
  
  return value.toLowerCase() === 'true' || value === '1';
}

// Common environment variables
export const env = {
  SUPABASE_URL: getRequiredEnvVar('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  SUPABASE_ANON_KEY: getRequiredEnvVar('SUPABASE_ANON_KEY'),
  
  STRIPE_SECRET_KEY: getOptionalEnvVar('STRIPE_SECRET_KEY'),
  STRIPE_WEBHOOK_SECRET: getOptionalEnvVar('STRIPE_WEBHOOK_SECRET'),
  
  RESEND_API_KEY: getOptionalEnvVar('RESEND_API_KEY'),
  
  PUSHER_APP_ID: getOptionalEnvVar('PUSHER_APP_ID'),
  PUSHER_KEY: getOptionalEnvVar('PUSHER_KEY'),
  PUSHER_SECRET: getOptionalEnvVar('PUSHER_SECRET'),
  PUSHER_CLUSTER: getOptionalEnvVar('PUSHER_CLUSTER', 'eu'),
  
  ENCRYPTION_KEY: getOptionalEnvVar('ENCRYPTION_KEY'),
  
  NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),
  
  isProduction: getOptionalEnvVar('NODE_ENV') === 'production',
  isDevelopment: getOptionalEnvVar('NODE_ENV') === 'development',
};
