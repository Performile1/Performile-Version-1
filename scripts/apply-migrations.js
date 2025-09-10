require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;
const supabase = createClient(supabaseUrl, supabaseKey);

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting database migrations...');
    
    // Read and execute initial schema
    const schemaPath = path.join(__dirname, '..', 'database', 'init', '00-initial-schema.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    await client.query(schemaSql);
    
    // Apply RLS policies
    console.log('🔒 Setting up Row Level Security policies...');
    const policiesPath = path.join(__dirname, '..', 'database', 'policies', '01-setup-rls-policies.sql');
    try {
      const policiesSql = await fs.readFile(policiesPath, 'utf8');
      await client.query(policiesSql);
      console.log('✅ RLS policies applied successfully');
    } catch (err) {
      console.error('❌ Error applying RLS policies:', err);
      throw err;
    }
    
    // Apply any additional migrations
    const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
    let migrationFiles = [];
    
    try {
      migrationFiles = await fs.readdir(migrationsDir);
      migrationFiles = migrationFiles
        .filter(file => file.endsWith('.sql') && file !== '01-setup-rls-policies.sql')
        .sort(); // Ensure consistent order
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      console.log('No additional migrations found.');
    }
    
    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const migration = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      await client.query(migration);
    }
    
    await client.query('COMMIT');
    console.log('✅ Database migrations completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migrations
runMigrations().catch(console.error);
