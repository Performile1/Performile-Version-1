import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';
import { getJwtConfig } from '../../utils/env';

const pool = getPool();

// Verify admin token
const verifyAdmin = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJwtConfig().secret) as any;
  
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
      
      if (req.method === 'POST') {
        // Create new review
        const {
          order_id,
          courier_id,
          consumer_id,
          rating,
          review_text,
          damaged,
          late,
          switched_service,
          delivery_speed,
          packaging_quality,
          communication,
          professionalism
        } = req.body;

        if (!order_id || !courier_id || !consumer_id) {
          return res.status(400).json({
            success: false,
            message: 'Order ID, Courier ID, and Consumer ID are required'
          });
        }

        // Calculate overall rating
        const ratings = [delivery_speed, packaging_quality, communication, professionalism];
        const avgRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
        let deductions = 0;
        if (damaged) deductions += 1;
        if (late) deductions += 0.5;
        if (switched_service) deductions += 0.5;
        const finalRating = Math.max(1, Math.min(5, avgRating - deductions));

        // Insert review
        const result = await client.query(`
          INSERT INTO Reviews (
            order_id,
            courier_id,
            consumer_id,
            rating,
            review_text,
            delivery_speed,
            packaging_quality,
            communication,
            professionalism,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *
        `, [
          order_id,
          courier_id,
          consumer_id,
          finalRating,
          review_text || '',
          delivery_speed,
          packaging_quality,
          communication,
          professionalism
        ]);

        // Log issues if any
        if (damaged || late || switched_service) {
          const issues = [];
          if (damaged) issues.push('damaged');
          if (late) issues.push('late');
          if (switched_service) issues.push('switched_service');
          
          await client.query(`
            INSERT INTO ReviewIssues (review_id, issue_type, created_at)
            SELECT $1, unnest($2::text[]), NOW()
          `, [result.rows[0].review_id, issues]);
        }

        return res.status(201).json({
          success: true,
          data: result.rows[0],
          message: 'Review created successfully'
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
