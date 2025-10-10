import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Hash the token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Get user_id from valid token
      const tokenResult = await client.query(
        `SELECT user_id, expires_at 
         FROM password_reset_tokens 
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({ 
          message: 'Invalid or expired reset token' 
        });
      }

      const { user_id } = tokenResult.rows[0];

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await client.query(
        `UPDATE users 
         SET password_hash = $1, updated_at = NOW() 
         WHERE user_id = $2`,
        [passwordHash, user_id]
      );

      // Delete used token
      await client.query(
        'DELETE FROM password_reset_tokens WHERE user_id = $1',
        [user_id]
      );

      // Log the password reset
      await client.query(
        `INSERT INTO audit_logs (user_id, action, details, ip_address) 
         VALUES ($1, $2, $3, $4)`,
        [
          user_id,
          'password_reset',
          JSON.stringify({ method: 'email_reset', timestamp: new Date().toISOString() }),
          req.headers['x-forwarded-for'] || req.socket.remoteAddress
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ 
      message: 'Failed to reset password',
      error: error.message 
    });
  }
}
