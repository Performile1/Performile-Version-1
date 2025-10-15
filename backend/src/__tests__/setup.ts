// Test setup file
// This runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'performile_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SESSION_SECRET = 'test-session-secret';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock logger to reduce noise in tests
jest.mock('../utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(), // Suppress error logs in tests
  warn: jest.fn(),  // Suppress warning logs in tests
};
