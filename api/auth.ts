import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from './lib/db';

// Inline environment helpers to avoid ES module issues
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  WARNING: Using fallback JWT_SECRET in development');
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  if (secret.length < 32) {
    throw new Error('JWT_SECRET too short (min 32 chars)');
  }
  return secret;
}

function getJWTRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  WARNING: Using fallback JWT_REFRESH_SECRET in development');
      return 'development-fallback-refresh-secret-min-32-chars-for-testing';
    }
    throw new Error('JWT_REFRESH_SECRET not configured');
  }
  if (secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET too short (min 32 chars)');
  }
  return secret;
}

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Log environment status for debugging
    console.log('Auth API called:', {
      action: req.body?.action,
      hasJWTSecret: !!process.env.JWT_SECRET,
      hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
      hasDatabase: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV
    });

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

        const jwtSecret = getJWTSecret();
        const jwtRefreshSecret = getJWTRefreshSecret();

        const accessToken = jwt.sign(
          { user_id: user.user_id, userId: user.user_id, email: user.email, user_role: user.user_role, role: user.user_role },
          jwtSecret,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { user_id: user.user_id, userId: user.user_id },
          jwtRefreshSecret,
          { expiresIn: '7d' }
        );

        await client.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

        // Set httpOnly cookies for security (prevents XSS attacks)
        const isProduction = process.env.NODE_ENV === 'production';
        res.setHeader('Set-Cookie', [
          `accessToken=${accessToken}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=3600`,
          `refreshToken=${refreshToken}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=604800`
        ]);

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

        const jwtSecret = getJWTSecret();
        const jwtRefreshSecret = getJWTRefreshSecret();

        const accessToken = jwt.sign(
          { user_id: newUser.user_id, userId: newUser.user_id, email: newUser.email, user_role: newUser.user_role, role: newUser.user_role },
          jwtSecret,
          { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
          { user_id: newUser.user_id, userId: newUser.user_id },
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

    // Handle token refresh
    if (action === 'refresh') {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ 
          success: false,
          message: 'Refresh token is required' 
        });
      }

      try {
        const jwtRefreshSecret = getJWTRefreshSecret();
        const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;

        if (!decoded.userId) {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid refresh token' 
          });
        }

        // Get user from database to ensure they still exist and are active
        const client = await pool.connect();
        try {
          const userQuery = 'SELECT user_id, email, user_role, first_name, last_name, is_active FROM users WHERE user_id = $1';
          const userResult = await client.query(userQuery, [decoded.userId]);

          if (userResult.rows.length === 0) {
            return res.status(401).json({ 
              success: false,
              message: 'User not found' 
            });
          }

          const user = userResult.rows[0];

          if (!user.is_active) {
            return res.status(401).json({ 
              success: false,
              message: 'Account is deactivated' 
            });
          }

          // Generate new tokens
          const jwtSecret = getJWTSecret();
          
          const newAccessToken = jwt.sign(
            { user_id: user.user_id, userId: user.user_id, email: user.email, user_role: user.user_role, role: user.user_role },
            jwtSecret,
            { expiresIn: '1h' }
          );

          const newRefreshToken = jwt.sign(
            { user_id: user.user_id, userId: user.user_id },
            jwtRefreshSecret,
            { expiresIn: '7d' }
          );

          // Update last login
          await client.query('UPDATE users SET last_login = NOW() WHERE user_id = $1', [user.user_id]);

          // Set httpOnly cookies
          const isProduction = process.env.NODE_ENV === 'production';
          res.setHeader('Set-Cookie', [
            `accessToken=${newAccessToken}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=3600`,
            `refreshToken=${newRefreshToken}; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=604800`
          ]);

          return res.status(200).json({
            success: true,
            data: {
              user: {
                user_id: user.user_id,
                email: user.email,
                user_role: user.user_role,
                first_name: user.first_name,
                last_name: user.last_name
              },
              tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
              }
            }
          });

        } finally {
          client.release();
        }

      } catch (error: any) {
        console.error('Token refresh error:', error);
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false,
            message: 'Refresh token has expired. Please log in again.' 
          });
        } else if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid refresh token' 
          });
        }
        throw error;
      }
    }

    // Handle logout
    if (action === 'logout') {
      // Clear cookies
      const isProduction = process.env.NODE_ENV === 'production';
      res.setHeader('Set-Cookie', [
        `accessToken=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`,
        `refreshToken=; HttpOnly; ${isProduction ? 'Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`
      ]);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (error: any) {
    console.error('Auth API error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: {
        hasJWTSecret: !!process.env.JWT_SECRET,
        hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
        hasDatabase: !!process.env.DATABASE_URL
      }
    });
  }
}
