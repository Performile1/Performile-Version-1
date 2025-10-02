import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, first_name, last_name, phone, user_role } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    // Connect to database
    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const insertQuery = `
        INSERT INTO users (email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING user_id, email, user_role, first_name, last_name
      `;

      const result = await client.query(insertQuery, [
        email,
        password_hash,
        user_role || 'consumer',
        first_name || null,
        last_name || null,
        phone || null,
        false, // is_verified
        true   // is_active
      ]);

      const newUser = result.rows[0];

      // Generate JWT tokens
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

      const accessToken = jwt.sign(
        { 
          userId: newUser.user_id, 
          email: newUser.email, 
          role: newUser.user_role 
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: newUser.user_id },
        jwtRefreshSecret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: newUser.user_id,
          email: newUser.email,
          role: newUser.user_role,
          firstName: newUser.first_name,
          lastName: newUser.last_name
        },
        accessToken,
        refreshToken
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
