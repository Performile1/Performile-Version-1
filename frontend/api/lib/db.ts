import { Pool } from 'pg';

// Shared database connection pool
// This prevents "max clients reached" errors by reusing connections
let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 3, // Further reduced for Supabase Session Mode
      idleTimeoutMillis: 10000, // Release idle connections faster
      connectionTimeoutMillis: 30000, // Increased timeout
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
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
