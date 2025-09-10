require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const crypto = require('crypto');

// Simple password hashing using crypto
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
  max: 1 // Use a single connection for seeding
});

// Test user data
const testUsers = [
  {
    email: 'admin@performile.com',
    password: 'admin123',
    role: 'admin',
    full_name: 'Admin User'
  },
  {
    email: 'merchant@performile.com',
    password: 'merchant123',
    role: 'merchant',
    full_name: 'Merchant User'
  },
  {
    email: 'courier@performile.com',
    password: 'courier123',
    role: 'courier',
    full_name: 'Courier User'
  },
  {
    email: 'customer@performile.com',
    password: 'customer123',
    role: 'consumer',
    full_name: 'Test Customer'
  }
];

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting database seeding...');
    
    // Create test users
    for (const user of testUsers) {
      console.log(`Creating user: ${user.email}`);
      
      // Create auth user with hashed password
      const hashedPassword = hashPassword(user.password);
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: hashedPassword,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name,
          role: user.role
        }
      });
      
      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`User ${user.email} already exists, skipping...`);
          continue;
        }
        throw authError;
      }
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          username: user.email.split('@')[0],
          full_name: user.full_name,
          role: user.role,
          updated_at: new Date()
        });
        
      if (profileError) throw profileError;
    }
    
    // Create a test store for the merchant
    console.log('Creating test store...');
    const merchantUser = testUsers.find(u => u.role === 'merchant');
    if (merchantUser) {
      const { data: merchant } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', merchantUser.email)
        .single();
      
      if (merchant) {
        const { error: storeError } = await supabase
          .from('stores')
          .upsert({
            owner_id: merchant.id,
            name: 'Test Store',
            slug: 'test-store',
            description: 'A test store for development',
            is_active: true
          });
          
        if (storeError) throw storeError;
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
seedDatabase().catch(console.error);
