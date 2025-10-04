import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../../utils/env';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Verify admin token
const verifyAdmin = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  if (decoded.role !== 'admin') {
    throw new Error('Admin access required');
  }
  
  return decoded;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    verifyAdmin(req);
    
    const client = await pool.connect();
    try {
      if (req.method === 'GET') {
        // Get invalid reviews
        const result = await client.query(`
          SELECT * FROM admin_invalid_reviews
          ORDER BY created_at DESC
        `);

        return res.status(200).json({
          success: true,
          data: result.rows,
          total: result.rows.length
        });
      }
      
      if (req.method === 'DELETE') {
        // Discard (delete) invalid review
        const { reviewId } = req.query;
        
        if (!reviewId) {
          return res.status(400).json({
            success: false,
            message: 'Review ID required'
          });
        }

        await client.query('DELETE FROM Reviews WHERE review_id = $1', [reviewId]);

        return res.status(200).json({
          success: true,
          message: 'Review discarded successfully'
        });
      }

      return res.status(405).json({ message: 'Method not allowed' });
      
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Admin reviews API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
