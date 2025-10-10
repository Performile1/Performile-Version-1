import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { applySecurityMiddleware } from '../middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply security middleware
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'auth'
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      message: 'Current password and new password are required' 
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ 
      message: 'New password must be at least 8 characters long' 
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ 
      message: 'New password must be different from current password' 
    });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Get user's current password hash
      const userResult = await client.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [user.user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password_hash } = userResult.rows[0];

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ 
          message: 'Current password is incorrect' 
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await client.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [newPasswordHash, user.user_id]
      );

      // Log the password change
      await client.query(
        `INSERT INTO audit_logs (user_id, action, details, ip_address) 
         VALUES ($1, $2, $3, $4)`,
        [
          user.user_id,
          'password_changed',
          JSON.stringify({ timestamp: new Date().toISOString() }),
          req.headers['x-forwarded-for'] || req.socket.remoteAddress
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Change password error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
