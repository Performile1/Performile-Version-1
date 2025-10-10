import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const client = await pool.connect();
    
    try {
      // Hash the token
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Check if token exists and is not expired
      const result = await client.query(
        `SELECT user_id, expires_at 
         FROM password_reset_tokens 
         WHERE token_hash = $1 AND expires_at > NOW()`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ 
          valid: false,
          message: 'Invalid or expired reset token' 
        });
      }

      return res.status(200).json({
        valid: true,
        message: 'Token is valid'
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Validate token error:', error);
    return res.status(500).json({ 
      message: 'Failed to validate token',
      error: error.message 
    });
  }
}
