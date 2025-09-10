const { Pool } = require('pg');
const crypto = require('crypto');

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function testAuth() {
  try {
    // Check if test user exists
    const result = await pool.query("SELECT * FROM users WHERE email = 'test@example.com'");
    
    if (result.rows.length === 0) {
      // Create test user if not exists
      const password = 'testpassword';
      const { salt, hash } = hashPassword(password);
      
      await pool.query(`
        INSERT INTO users (email, name, password_hash, password_salt, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, name, role
      `, ['test@example.com', 'Test User', hash, salt, 'admin']);
      
      console.log('Test user created with email: test@example.com and password: testpassword');
    } else {
      console.log('Test user already exists:', result.rows[0]);
    }
  } catch (error) {
    console.error('Error setting up test user:', error);
  } finally {
    await pool.end();
  }
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
}

testAuth();
