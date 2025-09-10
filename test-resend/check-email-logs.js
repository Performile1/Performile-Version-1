require('dotenv').config();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function checkEmailLogsTable() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking if email_logs table exists...');
    
    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'email_logs'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log('📊 email_logs table exists:', tableExists);
    
    if (tableExists) {
      // Get table structure
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'email_logs';
      `);
      
      console.log('\n📋 email_logs table structure:');
      console.table(tableInfo.rows);
    } else {
      console.log('\n❌ email_logs table does not exist. You need to run the migration.');
      console.log('Run: psql -d your_database -f database/migrations/add_email_logs_table.sql');
    }
    
  } catch (error) {
    console.error('❌ Error checking email_logs table:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmailLogsTable();
