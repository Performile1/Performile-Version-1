import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Check if user exists
      const userResult = await client.query(
        'SELECT user_id, email, first_name FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      // Always return success to prevent email enumeration
      if (userResult.rows.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, you will receive password reset instructions.'
        });
      }

      const user = userResult.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token
      await client.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) 
         DO UPDATE SET token_hash = $2, expires_at = $3, created_at = NOW()`,
        [user.user_id, resetTokenHash, expiresAt]
      );

      // Generate reset URL
      const resetUrl = `${process.env.FRONTEND_URL || 'https://performile.vercel.app'}/reset-password?token=${resetToken}`;

      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Performile Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Reset Your Password</h1>
              </div>
              <div class="content">
                <p>Hi ${user.first_name || 'there'},</p>
                <p>We received a request to reset your password for your Performile account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
                  ${resetUrl}
                </p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
                <div class="footer">
                  <p>© 2025 Performile. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Hi ${user.first_name || 'there'},
          
          We received a request to reset your password for your Performile account.
          
          Click the link below to reset your password:
          ${resetUrl}
          
          This link will expire in 1 hour.
          
          If you didn't request this password reset, you can safely ignore this email.
          
          © 2025 Performile
        `
      });

      return res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email'
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ 
      message: 'Failed to process password reset request',
      error: error.message 
    });
  }
}
