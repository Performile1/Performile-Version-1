import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';
import { randomBytes } from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  const user = (req as any).user;

  if (req.method === 'GET') {
    // Get existing API key or generate new one
    try {
      const result = await pool.query(
        'SELECT api_key FROM users WHERE user_id = $1',
        [user.user_id]
      );

      let apiKey = result.rows[0]?.api_key;

      // If no API key exists, generate one
      if (!apiKey) {
        apiKey = 'pk_' + randomBytes(32).toString('hex');
        
        await pool.query(
          'UPDATE users SET api_key = $1 WHERE user_id = $2',
          [apiKey, user.user_id]
        );
      }

      return res.status(200).json({
        success: true,
        api_key: apiKey
      });

    } catch (error: any) {
      console.error('Error fetching API key:', error);
      return res.status(500).json({
        error: 'Failed to fetch API key',
        message: error.message
      });
    }
  }

  if (req.method === 'POST') {
    // Regenerate API key
    try {
      const newApiKey = 'pk_' + randomBytes(32).toString('hex');

      await pool.query(
        'UPDATE users SET api_key = $1 WHERE user_id = $2',
        [newApiKey, user.user_id]
      );

      return res.status(200).json({
        success: true,
        api_key: newApiKey,
        message: 'API key regenerated successfully'
      });

    } catch (error: any) {
      console.error('Error regenerating API key:', error);
      return res.status(500).json({
        error: 'Failed to regenerate API key',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
