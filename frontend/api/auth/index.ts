import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
import crypto from 'crypto';
// Logger removed as it's not defined in the project

// Extend VercelRequest interface to include custom properties
declare module '@vercel/node' {
  interface VercelRequest {
    method?: string;
    url?: string;
    headers: {
      [key: string]: string | string[] | undefined;
      'content-type'?: string;
      'authorization'?: string;
    };
    body?: any;
    query: {
      [key: string]: string | string[];
    };
    cookies: {
      [key: string]: string;
    };
  }
}

// Type for environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_EXPIRES_IN = '1d';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// Type for user data
interface User {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Type for token payload
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Type for API response
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Helper function to generate JWT token
function generateToken(user: { id: string; email: string; role: string }, expiresIn: string = JWT_EXPIRES_IN): string {
  const payload = { 
    id: user.id, 
    email: user.email, 
    role: user.role 
  };
  
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
}

// Helper function to verify JWT token
function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Hash password
function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
}

// Verify password
function verifyPassword(password: string, hash: string, salt: string): boolean {
  const hashVerify = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === hashVerify;
}

// Handler functions
async function handleLogin(req: VercelRequest, res: VercelResponse, context: any = {}) {
  const sendResponse = (status: number, data: any): void => {
    res.status(status).json(data);
  };
  
  // Set default empty cookies object if not present
  if (!req.cookies) {
    req.cookies = {};
  }
  const { email, password } = req.body;
  
  if (!email || !password) {
    sendResponse(400, { 
      success: false, 
      message: 'Email and password are required' 
    });
    return;
  }

  try {
    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    const user = result.rows[0];
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Verify password
    const isPasswordValid = verifyPassword(
      password, 
      user.password_hash, 
      user.password_salt
    );

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateToken(user, REFRESH_TOKEN_EXPIRES_IN);

    // Update user's refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    );

    // Remove sensitive data before sending response
    const { password_hash, password_salt, refresh_token, ...userData } = user;

    // Set HTTP-only cookie for refresh token
    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    // Send user data and access token
    sendResponse(200, {
      success: true,
      data: {
        user: userData,
        token: accessToken
      }
    });
    return;
  } catch (error) {
    console.error('Login error:', error);
    sendResponse(500, { 
      success: false, 
      message: 'Internal server error' 
    });
    return;
  }
}

async function handleRegister(req: VercelRequest, res: VercelResponse, context: any = {}) {
  const { email, password, name, role = 'user' } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and password are required'
    });
  }

  try {
    // Check if user already exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const { salt, hash } = hashPassword(password);
    // Create a temporary user object for token generation
    const tempUser = {
      id: 'temp', // Will be replaced by database ID
      email: email.toLowerCase(),
      role: role,
      name: name
    };
    const refreshToken = generateToken(tempUser, REFRESH_TOKEN_EXPIRES_IN);

    // Create new user
    const result = await pool.query(
      `INSERT INTO users (email, name, password_hash, password_salt, refresh_token, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, name, role, created_at`,
      [email.toLowerCase(), name, hash, salt, refreshToken, role]
    );

    const user = result.rows[0];
    const accessToken = generateToken(user);

    // Set HTTP-only cookie for refresh token
    res.setHeader('Set-Cookie', [
      `refreshToken=${refreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    res.status(201).json({
      success: true,
      data: {
        user,
        token: accessToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
}

async function handleRefresh(req: VercelRequest, res: VercelResponse, context: any = {}) {
  // Ensure cookies object exists
  req.cookies = req.cookies || {};
  const refreshToken = (req.cookies.refreshToken as string) || req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'No refresh token provided'
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Find user by ID from token
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 AND refresh_token = $2',
      [(decoded as any).id, refreshToken]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or invalid refresh token'
      });
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateToken(user, REFRESH_TOKEN_EXPIRES_IN);

    // Update refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.id]
    );

    // Set new HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `refreshToken=${newRefreshToken}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    // Remove sensitive data
    const { password_hash, password_salt, refresh_token, ...userData } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userData,
        token: newAccessToken
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token'
    });
  }
}

async function handleProfile(req: VercelRequest, res: VercelResponse, context: any = {}) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const result = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
      [(decoded as any).id]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse, context: any = {}) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Clear refresh token in database
    await pool.query(
      'UPDATE users SET refresh_token = NULL WHERE id = $1',
      [(decoded as any).id]
    );

    // Clear HTTP-only cookie
    res.setHeader('Set-Cookie', [
      'refreshToken=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ]);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
}

async function handleAuthRequest(req: VercelRequest, res: VercelResponse) {
  const context = {}; // Initialize empty context
  
  try {
    // Route based on method and path
    const path = req.url || '';
    switch (req.method) {
      case 'POST':
        if (path.endsWith('/login')) {
          return await handleLogin(req, res, context);
        } else if (path.endsWith('/register')) {
          return await handleRegister(req, res, context);
        } else if (path.endsWith('/refresh')) {
          return await handleRefresh(req, res, context);
        }
        break;
      case 'GET':
        if (path.endsWith('/profile')) {
          return await handleProfile(req, res, context);
        }
        if (path.endsWith('/logout')) {
          return await handleLogout(req, res, context);
        }
        break;
    }

    // If no route matches
    res.status(404).json({ success: false, message: 'Not Found' });
  } catch (error: any) {
    console.error('Auth error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  }
}

// Set CORS headers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Main handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  return handleAuthRequest(req, res);
}

// For backward compatibility
module.exports = handler;
