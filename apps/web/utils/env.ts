/**
 * Environment variable validation and access
 * Ensures critical secrets are configured before use
 */

export function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // TEMPORARY: Allow fallback in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  WARNING: Using fallback JWT_SECRET in development');
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    console.error('CRITICAL: JWT_SECRET environment variable is not configured');
    throw new Error('Server configuration error - JWT_SECRET missing');
  }
  
  if (secret.length < 32) {
    console.error('CRITICAL: JWT_SECRET is too short (minimum 32 characters required)');
    throw new Error('Server configuration error - JWT_SECRET invalid');
  }
  
  return secret;
}

export function getJWTRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  
  if (!secret) {
    // TEMPORARY: Allow fallback in development only
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  WARNING: Using fallback JWT_REFRESH_SECRET in development');
      return 'development-fallback-refresh-secret-min-32-chars-for-testing';
    }
    console.error('CRITICAL: JWT_REFRESH_SECRET environment variable is not configured');
    throw new Error('Server configuration error - JWT_REFRESH_SECRET missing');
  }
  
  if (secret.length < 32) {
    console.error('CRITICAL: JWT_REFRESH_SECRET is too short (minimum 32 characters required)');
    throw new Error('Server configuration error - JWT_REFRESH_SECRET invalid');
  }
  
  return secret;
}

export function getDatabaseURL(): string {
  const url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('CRITICAL: DATABASE_URL environment variable is not configured');
    throw new Error('Server configuration error - DATABASE_URL missing');
  }
  
  return url;
}

/**
 * Validate all required environment variables on startup
 */
export function validateEnvironment(): void {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('CRITICAL: Missing required environment variables:', missing.join(', '));
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT secrets are strong enough
  try {
    getJWTSecret();
    getJWTRefreshSecret();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
  
  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'production' && nodeEnv !== 'test') {
    console.warn('WARNING: NODE_ENV should be "development", "production", or "test"');
  }
  
  // Check database URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    console.warn('WARNING: DATABASE_URL should start with postgres:// or postgresql://');
  }
  
  console.log('✅ Environment variables validated successfully');
  console.log(`   - NODE_ENV: ${nodeEnv}`);
  console.log(`   - Database: ${dbUrl ? 'Configured' : 'Missing'}`);
  console.log(`   - JWT Secrets: Configured and validated`);
}

/**
 * Get all required environment variables for documentation
 */
export function getRequiredEnvVars(): string[] {
  return [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV'
  ];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
