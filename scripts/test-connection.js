require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('Database URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testConnection().catch(console.error);
