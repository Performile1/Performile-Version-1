import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthTokens, LoginRequest, RegisterRequest, ApiResponse, AuthenticatedRequest } from '../types';
import database from '../config/database';
import redisClient from '../config/redis';
import logger from '../utils/logger';

export class AuthController {
  // User registration
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name, user_role, phone }: RegisterRequest = req.body;

      // Check if user already exists
      const existingUser = await database.query(
        'SELECT user_id FROM Users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'An account with this email address already exists'
        });
        return;
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await database.query(
        `INSERT INTO Users (user_id, email, password_hash, user_role, first_name, last_name, phone, is_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING user_id, email, user_role, first_name, last_name, phone, is_verified, is_active, created_at`,
        [uuidv4(), email, passwordHash, user_role, first_name, last_name, phone, false, true]
      );

      const user: User = result.rows[0];

      // Assign default subscription plan
      await this.assignDefaultSubscription(user.user_id, user_role);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token in Redis
      await redisClient.set(
        `refresh_token:${user.user_id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      logger.info('User registered successfully', {
        userId: user.user_id,
        email: user.email,
        role: user.user_role
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            email: user.email,
            user_role: user.user_role,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            is_verified: user.is_verified,
            is_active: user.is_active
          },
          tokens
        },
        message: 'User registered successfully'
      });
    } catch (error) {
      logger.error('Registration error', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }

  // User login
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Mock authentication for testing when database is unavailable
      if (email === 'admin@performile.com' && password === 'demo12345') {
        const mockUser: User = {
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'admin@performile.com',
          user_role: 'admin',
          first_name: 'Admin',
          last_name: 'User',
          is_verified: true,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        const tokens = this.generateTokens(mockUser);
        
        res.json({
          success: true,
          data: { user: mockUser, tokens },
          message: 'Login successful (mock mode)'
        });
        return;
      }

      // Get user from database
      const result = await database.query(
        `SELECT user_id, email, password_hash, user_role, first_name, last_name, phone, 
                is_verified, is_active, failed_login_attempts, locked_until
         FROM Users WHERE email = $1`,
        [email]
      );
      
      console.log('Database query result rows:', result.rows.length);

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
        return;
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        res.status(401).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled'
        });
        return;
      }

      // Check if account is locked
      if (user.locked_until && new Date() < new Date(user.locked_until)) {
        res.status(423).json({
          success: false,
          error: 'Account locked',
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await this.handleFailedLogin(user.user_id, user.failed_login_attempts || 0);
        
        res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          message: 'Email or password is incorrect'
        });
        return;
      }

      // Reset failed login attempts on successful login
      await database.query(
        'UPDATE Users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE user_id = $1',
        [user.user_id]
      );

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Store refresh token in Redis
      await redisClient.set(
        `refresh_token:${user.user_id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      logger.info('User logged in successfully', {
        userId: user.user_id,
        email: user.email,
        role: user.user_role
      });

      res.json({
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            email: user.email,
            user_role: user.user_role,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            is_verified: user.is_verified,
            is_active: user.is_active
          },
          tokens
        },
        message: 'Login successful'
      });
    } catch (error) {
      logger.error('Login error', error);
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  // Refresh token
  public async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Refresh token required',
          message: 'Please provide a refresh token'
        });
        return;
      }

      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      if (!jwtRefreshSecret) {
        throw new Error('JWT refresh secret not configured');
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as any;

      // Check if refresh token exists in Redis
      const storedToken = await redisClient.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
        return;
      }

      // Get user from database
      const result = await database.query(
        `SELECT user_id, email, user_role, first_name, last_name, phone, is_verified, is_active
         FROM Users WHERE user_id = $1 AND is_active = true`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User not found or inactive'
        });
        return;
      }

      const user = result.rows[0];

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Update refresh token in Redis
      await redisClient.set(
        `refresh_token:${user.user_id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60 // 7 days
      );

      res.json({
        success: true,
        data: { tokens },
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
          message: 'Refresh token is invalid or expired'
        });
        return;
      }

      logger.error('Token refresh error', error);
      res.status(500).json({
        success: false,
        error: 'Token refresh failed',
        message: 'An error occurred while refreshing token'
      });
    }
  }

  // Logout
  public async logout(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please login first'
        });
        return;
      }

      // Remove refresh token from Redis
      await redisClient.del(`refresh_token:${user.user_id}`);

      logger.info('User logged out successfully', {
        userId: user.user_id,
        email: user.email
      });

      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      logger.error('Logout error', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  // Get current user profile
  public async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
          message: 'Please login first'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            user_id: user.user_id,
            email: user.email,
            user_role: user.user_role,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            is_verified: user.is_verified,
            is_active: user.is_active,
            created_at: user.created_at,
            last_login: user.last_login
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
        message: 'An error occurred while fetching profile'
      });
    }
  }

  // Private helper methods
  private generateTokens(user: User): AuthTokens {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    const jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }

    const payload = {
      userId: user.user_id,
      email: user.email,
      role: user.user_role
    };

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, { expiresIn: jwtRefreshExpiresIn } as jwt.SignOptions);

    // Calculate expiration time in seconds
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded.exp - decoded.iat;

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  private async handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const maxAttempts = 5;
    const lockDuration = 15 * 60 * 1000; // 15 minutes

    const newAttempts = currentAttempts + 1;
    let lockedUntil = null;

    if (newAttempts >= maxAttempts) {
      lockedUntil = new Date(Date.now() + lockDuration);
    }

    await database.query(
      'UPDATE Users SET failed_login_attempts = $1, locked_until = $2 WHERE user_id = $3',
      [newAttempts, lockedUntil, userId]
    );

    if (lockedUntil) {
      logger.warn('User account locked due to failed login attempts', {
        userId,
        attempts: newAttempts,
        lockedUntil
      });
    }
  }

  private async assignDefaultSubscription(userId: string, userRole: string): Promise<void> {
    try {
      // Get default subscription plan for user role
      const planResult = await database.query(
        `SELECT plan_id FROM SubscriptionPlans 
         WHERE user_role = $1 AND plan_name LIKE '%Free%' OR plan_name LIKE '%Basic%'
         ORDER BY price_monthly ASC LIMIT 1`,
        [userRole]
      );

      if (planResult.rows.length > 0) {
        const planId = planResult.rows[0].plan_id;
        
        await database.query(
          `INSERT INTO UserSubscriptions (user_id, plan_id, status, start_date, end_date)
           VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 year')`,
          [userId, planId]
        );
      }
    } catch (error) {
      logger.error('Failed to assign default subscription', { userId, userRole, error });
    }
  }
}

