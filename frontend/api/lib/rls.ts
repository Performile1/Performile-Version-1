/**
 * Row Level Security (RLS) Helper Module
 * 
 * This module provides utilities for integrating PostgreSQL Row Level Security
 * with API endpoints. It ensures that database queries are automatically filtered
 * based on the authenticated user's role and ID.
 * 
 * Usage:
 * ```typescript
 * const result = await withRLS(pool, user, async (client) => {
 *   return await client.query('SELECT * FROM Stores');
 * });
 * ```
 */

import { Pool, PoolClient } from 'pg';

export interface RLSUser {
  userId: string;
  role: string;
}

/**
 * Execute a database operation with RLS context set
 * 
 * This function:
 * 1. Gets a client from the pool
 * 2. Sets session variables (app.user_id, app.user_role)
 * 3. Executes your callback with the client
 * 4. Resets session variables
 * 5. Releases the client back to the pool
 * 
 * @param pool - PostgreSQL connection pool
 * @param user - User object with userId and role
 * @param callback - Async function that performs database operations
 * @returns Result from the callback function
 */
export async function withRLS<T>(
  pool: Pool,
  user: RLSUser,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    // Set RLS session variables
    // Note: SET command doesn't support parameterized queries, so we use string interpolation
    // The values are from JWT tokens which are already validated
    await client.query(`SET app.user_id = '${user.userId}'`);
    await client.query(`SET app.user_role = '${user.role}'`);
    
    // Execute the callback with RLS context active
    const result = await callback(client);
    
    return result;
  } finally {
    // Always reset session variables and release client
    try {
      await client.query('RESET app.user_id');
      await client.query('RESET app.user_role');
    } catch (error) {
      console.error('Error resetting RLS session variables:', error);
    }
    client.release();
  }
}

/**
 * Execute a single query with RLS context
 * 
 * Convenience function for simple queries that don't need a callback.
 * 
 * @param pool - PostgreSQL connection pool
 * @param user - User object with userId and role
 * @param queryText - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export async function queryWithRLS(
  pool: Pool,
  user: RLSUser,
  queryText: string,
  params: any[] = []
) {
  return withRLS(pool, user, async (client) => {
    return await client.query(queryText, params);
  });
}

/**
 * Execute multiple queries in a transaction with RLS context
 * 
 * All queries will be executed within a single transaction.
 * If any query fails, all changes are rolled back.
 * 
 * @param pool - PostgreSQL connection pool
 * @param user - User object with userId and role
 * @param callback - Async function that performs database operations
 * @returns Result from the callback function
 */
export async function transactionWithRLS<T>(
  pool: Pool,
  user: RLSUser,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    // Set RLS session variables
    // Note: SET command doesn't support parameterized queries
    await client.query(`SET app.user_id = '${user.userId}'`);
    await client.query(`SET app.user_role = '${user.role}'`);
    
    // Begin transaction
    await client.query('BEGIN');
    
    try {
      // Execute the callback
      const result = await callback(client);
      
      // Commit transaction
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    // Always reset session variables and release client
    try {
      await client.query('RESET app.user_id');
      await client.query('RESET app.user_role');
    } catch (error) {
      console.error('Error resetting RLS session variables:', error);
    }
    client.release();
  }
}

/**
 * Verify that RLS is properly configured
 * 
 * This function checks if the RLS helper functions exist in the database.
 * Call this during application startup to verify RLS is set up correctly.
 * 
 * @param pool - PostgreSQL connection pool
 * @returns True if RLS functions exist, false otherwise
 */
export async function verifyRLSSetup(pool: Pool): Promise<boolean> {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'current_user_id'
        ) as has_user_id,
        EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'current_user_role'
        ) as has_user_role,
        EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = 'is_admin'
        ) as has_is_admin
      `);
      
      const { has_user_id, has_user_role, has_is_admin } = result.rows[0];
      
      if (!has_user_id || !has_user_role || !has_is_admin) {
        console.error('❌ RLS helper functions not found in database!');
        console.error('Please run: database/row-level-security-safe.sql');
        return false;
      }
      
      console.log('✅ RLS helper functions verified');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error verifying RLS setup:', error);
    return false;
  }
}

/**
 * Get current RLS context (for debugging)
 * 
 * Returns the current session variables set for RLS.
 * Useful for debugging to verify context is set correctly.
 * 
 * @param client - PostgreSQL client
 * @returns Object with userId and role from session
 */
export async function getRLSContext(client: PoolClient): Promise<{ userId: string | null; role: string | null }> {
  try {
    const userIdResult = await client.query('SHOW app.user_id');
    const roleResult = await client.query('SHOW app.user_role');
    
    return {
      userId: userIdResult.rows[0]?.app?.user_id || null,
      role: roleResult.rows[0]?.app?.user_role || null,
    };
  } catch (error) {
    return { userId: null, role: null };
  }
}
