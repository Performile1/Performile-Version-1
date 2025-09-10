const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use service role key for admin operations

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase URL or service key in environment variables');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Function to execute SQL files
async function executeSqlFile(filePath) {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    console.log(`Executing SQL file: ${filePath}`);
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { query: statement });
        if (error) {
          console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
          console.error('Error details:', error);
        } else {
          console.log(`✓ Executed: ${statement.substring(0, 100)}...`);
        }
      } catch (err) {
        console.error('Error in statement execution:', err);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Error reading/executing SQL file ${filePath}:`, error);
    return false;
  }
}

// Main function to set up the database
async function setupDatabase() {
  console.log('Starting database setup...');
  
  try {
    // Execute schema files in order
    const schemaFiles = [
      '../database/schema.sql',
      '../database/trustscore_functions.sql',
      '../database/seed_data.sql',
      '../database/demo_data.sql'
    ];

    for (const file of schemaFiles) {
      const filePath = path.join(__dirname, file);
      console.log(`\nProcessing: ${file}`);
      await executeSqlFile(filePath);
    }

    console.log('\n✅ Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
