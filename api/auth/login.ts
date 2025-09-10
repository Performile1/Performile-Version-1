import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Query user from database
    const client = await pool.connect();
    try {
      const userQuery = 'SELECT user_id, email, password_hash, user_role, first_name, last_name, is_active FROM users WHERE email = $1';
      const userResult = await client.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      if (!user.is_active) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT tokens
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

      const accessToken = jwt.sign(
        { 
          userId: user.user_id, 
          email: user.email, 
          role: user.user_role 
        },
        jwtSecret,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.user_id },
        jwtRefreshSecret,
        { expiresIn: '7d' }
      );

      // Update last login
      await client.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.user_id,
          email: user.email,
          role: user.user_role,
          firstName: user.first_name,
          lastName: user.last_name
        },
        accessToken,
        refreshToken
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
