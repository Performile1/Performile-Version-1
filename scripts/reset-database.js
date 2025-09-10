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
  },
  max: 1 // Use a single connection for reset operations
});

async function resetDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting database reset...');
    
    // Drop all tables (except auth.users which is managed by Supabase)
    const dropTablesQuery = `
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        -- Disable all triggers
        SET session_replication_role = 'replica';
        
        -- Drop all tables in the public schema
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'schema_migrations') 
        LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
        
        -- Drop all types
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e')
        LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
        
        -- Re-enable triggers
        SET session_replication_role = 'origin';
      END $$;
    `;
    
    await client.query(dropTablesQuery);
    console.log('✅ Dropped all tables and types');
    
    // Recreate extensions
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Recreated extensions');
    
    await client.query('COMMIT');
    console.log('✅ Database reset completed successfully!');
    
    // Now apply migrations to recreate the schema
    console.log('\n🔄 Applying migrations...');
    require('./apply-migrations.js');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the reset
resetDatabase().catch(console.error);
