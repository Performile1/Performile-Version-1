import database from '../config/database';
import logger from './logger';
import { PoolClient } from 'pg';

/**
 * Database Helper Utilities
 * Provides enhanced database operations with better error handling and logging
 */

export interface QueryOptions {
  name?: string; // Named query for logging
  timeout?: number; // Query timeout in ms
  logQuery?: boolean; // Whether to log the query
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  readOnly?: boolean;
}

/**
 * Execute a query with enhanced error handling and logging
 */
export async function executeQuery<T = any>(
  text: string,
  params?: any[],
  options: QueryOptions = {}
): Promise<T> {
  const { name, timeout = 30000, logQuery = true } = options;
  const start = Date.now();

  try {
    if (logQuery) {
      logger.debug('Executing query', {
        name,
        query: text.substring(0, 100), // Log first 100 chars
        params: params?.length || 0,
      });
    }

    // Set statement timeout if specified
    if (timeout) {
      await database.query(`SET statement_timeout = ${timeout}`);
    }

    const result = await database.query(text, params);
    const duration = Date.now() - start;

    if (logQuery) {
      logger.debug('Query completed', {
        name,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    // Reset timeout
    if (timeout) {
      await database.query('RESET statement_timeout');
    }

    return result.rows as T;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query failed', {
      name,
      query: text.substring(0, 100),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Execute a query and return a single row
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[],
  options: QueryOptions = {}
): Promise<T | null> {
  const rows = await executeQuery<T[]>(text, params, options);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute a query and return multiple rows
 */
export async function queryMany<T = any>(
  text: string,
  params?: any[],
  options: QueryOptions = {}
): Promise<T[]> {
  return executeQuery<T[]>(text, params, options);
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const { isolationLevel, readOnly = false } = options;
  const client = await database.getClient();

  try {
    // Start transaction
    await client.query('BEGIN');

    // Set isolation level if specified
    if (isolationLevel) {
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    }

    // Set read-only if specified
    if (readOnly) {
      await client.query('SET TRANSACTION READ ONLY');
    }

    logger.debug('Transaction started', { isolationLevel, readOnly });

    // Execute callback
    const result = await callback(client);

    // Commit transaction
    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    // Always release client back to pool
    client.release();
  }
}

/**
 * Execute multiple queries in a batch
 */
export async function executeBatch(queries: Array<{ text: string; params?: any[] }>): Promise<any[]> {
  return executeTransaction(async (client) => {
    const results = [];
    for (const query of queries) {
      const result = await client.query(query.text, query.params);
      results.push(result.rows);
    }
    return results;
  });
}

/**
 * Check if a record exists
 */
export async function exists(table: string, conditions: Record<string, any>): Promise<boolean> {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');

  const query = `SELECT EXISTS(SELECT 1 FROM ${table} WHERE ${whereClause}) as exists`;
  const result = await queryOne<{ exists: boolean }>(query, values, { name: 'exists_check' });

  return result?.exists || false;
}

/**
 * Count records matching conditions
 */
export async function count(table: string, conditions: Record<string, any> = {}): Promise<number> {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.length > 0 ? `WHERE ${keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ')}` : '';

  const query = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
  const result = await queryOne<{ count: string }>(query, values, { name: 'count' });

  return parseInt(result?.count || '0', 10);
}

/**
 * Insert a record and return the inserted row
 */
export async function insertOne<T = any>(
  table: string,
  data: Record<string, any>,
  returning: string = '*'
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

  const query = `
    INSERT INTO ${table} (${keys.join(', ')})
    VALUES (${placeholders})
    RETURNING ${returning}
  `;

  return queryOne<T>(query, values, { name: `insert_${table}` });
}

/**
 * Update records and return updated rows
 */
export async function updateMany<T = any>(
  table: string,
  data: Record<string, any>,
  conditions: Record<string, any>,
  returning: string = '*'
): Promise<T[]> {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const conditionKeys = Object.keys(conditions);
  const conditionValues = Object.values(conditions);

  const setClause = dataKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const whereClause = conditionKeys
    .map((key, index) => `${key} = $${dataKeys.length + index + 1}`)
    .join(' AND ');

  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereClause}
    RETURNING ${returning}
  `;

  return queryMany<T>(query, [...dataValues, ...conditionValues], { name: `update_${table}` });
}

/**
 * Delete records and return deleted rows
 */
export async function deleteMany<T = any>(
  table: string,
  conditions: Record<string, any>,
  returning: string = '*'
): Promise<T[]> {
  const keys = Object.keys(conditions);
  const values = Object.values(conditions);
  const whereClause = keys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');

  const query = `
    DELETE FROM ${table}
    WHERE ${whereClause}
    RETURNING ${returning}
  `;

  return queryMany<T>(query, values, { name: `delete_${table}` });
}

/**
 * Set RLS context for the current session
 */
export async function setRLSContext(userId: string, userRole: string): Promise<void> {
  await database.query(`SET app.user_id = '${userId}'`);
  await database.query(`SET app.user_role = '${userRole}'`);
  logger.debug('RLS context set', { userId, userRole });
}

/**
 * Reset RLS context
 */
export async function resetRLSContext(): Promise<void> {
  await database.query('RESET app.user_id');
  await database.query('RESET app.user_role');
  logger.debug('RLS context reset');
}

/**
 * Get pool statistics
 */
export function getPoolStats() {
  const pool = database.getPool();
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

/**
 * Log pool statistics
 */
export function logPoolStats(): void {
  const stats = getPoolStats();
  logger.info('Database pool statistics', stats);
}
