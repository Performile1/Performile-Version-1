import { Pool } from 'pg';

// Shared database connection pool
// This prevents "max clients reached" errors by reusing connections
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('[DB] Creating connection pool...');
    console.log('[DB] Connection string format:', connectionString.substring(0, 30) + '...');
    
    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 1, // Minimal connections for serverless
      min: 0, // No minimum connections
      idleTimeoutMillis: 5000, // Release idle connections very quickly
      connectionTimeoutMillis: 10000, // Fail fast if can't connect
      statement_timeout: 30000, // 30 second query timeout
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[DB] Unexpected database pool error:', err);
      pool = null; // Reset pool on error
    });
    
    pool.on('connect', () => {
      console.log('[DB] New client connected to database');
    });
    
    pool.on('remove', () => {
      console.log('[DB] Client removed from pool');
    });
  }

  return pool;
};

// Helper to execute queries with automatic connection management
export const query = async (text: string, params?: any[]) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};
