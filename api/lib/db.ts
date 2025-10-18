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
      ssl: {
        rejectUnauthorized: false, // Required for Supabase
      },
      max: 1, // Minimal connections for serverless
      min: 0, // No minimum connections
      idleTimeoutMillis: 10000, // 10 seconds
      connectionTimeoutMillis: 20000, // 20 second connection timeout
      statement_timeout: 30000, // 30 second query timeout
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
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
