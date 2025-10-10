import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = (req as any).user;

  try {
    const client = await pool.connect();
    
    try {
      // Get user's invoices
      const result = await client.query(`
        SELECT 
          invoice_id,
          amount,
          status,
          invoice_date,
          due_date,
          paid_date,
          stripe_invoice_id,
          invoice_url
        FROM invoices
        WHERE user_id = $1
        ORDER BY invoice_date DESC
        LIMIT 50
      `, [user.user_id]);

      return res.status(200).json({
        success: true,
        invoices: result.rows
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch invoices',
      error: error.message 
    });
  }
}
