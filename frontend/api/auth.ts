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
    const { action, email, password, first_name, last_name, phone, user_role } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    // Handle login
    if (action === 'login') {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const client = await pool.connect();
      try {
        const userQuery = 'SELECT user_id, email, password_hash, user_role, first_name, last_name, is_active, is_verified, created_at, updated_at FROM users WHERE email = $1';
        const userResult = await client.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
          return res.status(401).json({ message: 'Account is deactivated' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

        const accessToken = jwt.sign(
          { userId: user.user_id, email: user.email, role: user.user_role },
          jwtSecret,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { userId: user.user_id },
          jwtRefreshSecret,
          { expiresIn: '7d' }
        );

        await client.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

        return res.status(200).json({
          success: true,
          data: {
            user: {
              user_id: user.user_id,
              email: user.email,
              user_role: user.user_role,
              first_name: user.first_name,
              last_name: user.last_name,
              is_verified: user.is_verified || false,
              is_active: user.is_active,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: user.updated_at || new Date().toISOString()
            },
            tokens: {
              accessToken,
              refreshToken
            }
          }
        });

      } finally {
        client.release();
      }
    }

    // Handle register
    if (action === 'register') {
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }

      const client = await pool.connect();
      try {
        const existingUser = await client.query(
          'SELECT user_id FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          return res.status(409).json({ message: 'User already exists' });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

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
          false,
          true
        ]);

        const newUser = result.rows[0];

        const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';

        const accessToken = jwt.sign(
          { userId: newUser.user_id, email: newUser.email, role: newUser.user_role },
          jwtSecret,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { userId: newUser.user_id },
          jwtRefreshSecret,
          { expiresIn: '7d' }
        );

        return res.status(201).json({
          success: true,
          data: {
            user: {
              id: newUser.user_id,
              email: newUser.email,
              role: newUser.user_role,
              firstName: newUser.first_name,
              lastName: newUser.last_name
            },
            tokens: {
              accessToken,
              refreshToken
            }
          }
        });

      } finally {
        client.release();
      }
    }

    return res.status(400).json({ message: 'Invalid action' });

  } catch (error: any) {
    console.error('Auth error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
