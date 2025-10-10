import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';
import { getJWTSecret } from '../../utils/env';

const pool = getPool();

// Verify token
const verifyToken = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  return jwt.verify(token, getJWTSecret());
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = verifyToken(req);
    const client = await pool.connect();
    
    try {
      if (req.method === 'GET') {
        // Get leads - merchants see their own, couriers see available leads
        let query = '';
        let params: any[] = [];
        
        if (user.role === 'admin') {
          // Admin sees ALL leads with full details
          query = `
            SELECT 
              l.*,
              s.store_name,
              u.email as merchant_email,
              u.first_name || ' ' || u.last_name as merchant_name,
              COUNT(DISTINCT ld.courier_id) as download_count,
              ARRAY_AGG(DISTINCT uc.email) FILTER (WHERE uc.email IS NOT NULL) as downloaded_by_emails
            FROM LeadsMarketplace l
            JOIN Stores s ON l.store_id = s.store_id
            JOIN Users u ON l.merchant_id = u.user_id
            LEFT JOIN LeadDownloads ld ON l.lead_id = ld.lead_id
            LEFT JOIN Users uc ON ld.courier_id = uc.user_id
            GROUP BY l.lead_id, s.store_name, u.email, u.first_name, u.last_name
            ORDER BY l.created_at DESC
          `;
        } else if (user.role === 'merchant') {
          // Merchants see their own leads
          query = `
            SELECT 
              l.*,
              s.store_name,
              COUNT(DISTINCT ld.courier_id) as download_count
            FROM LeadsMarketplace l
            JOIN Stores s ON l.store_id = s.store_id
            LEFT JOIN LeadDownloads ld ON l.lead_id = ld.lead_id
            WHERE l.merchant_id = $1
            GROUP BY l.lead_id, s.store_name
            ORDER BY l.created_at DESC
          `;
          params = [user.userId];
        } else if (user.role === 'courier') {
          // Couriers see active leads they haven't downloaded yet
          query = `
            SELECT 
              l.lead_id,
              l.title,
              l.description,
              l.delivery_volume,
              l.postal_codes,
              l.cities,
              l.countries,
              l.budget_min,
              l.budget_max,
              l.price,
              l.download_count,
              l.expires_at,
              l.created_at,
              s.store_name,
              CASE WHEN ld.courier_id IS NOT NULL THEN true ELSE false END as is_downloaded
            FROM LeadsMarketplace l
            JOIN Stores s ON l.store_id = s.store_id
            LEFT JOIN LeadDownloads ld ON l.lead_id = ld.lead_id AND ld.courier_id = $1
            WHERE l.status = 'active' 
              AND (l.expires_at IS NULL OR l.expires_at > NOW())
            ORDER BY l.created_at DESC
          `;
          params = [user.userId];
        }

        const result = await client.query(query, params);
        
        return res.status(200).json({
          success: true,
          data: result.rows
        });
      }
      
      if (req.method === 'POST') {
        // Create new lead (merchants only)
        if (user.role !== 'merchant' && user.role !== 'admin') {
          return res.status(403).json({ message: 'Only merchants can create leads' });
        }

        const {
          store_id,
          title,
          description,
          delivery_volume,
          postal_codes,
          cities,
          countries,
          budget_min,
          budget_max,
          requirements_json,
          price,
          expires_at
        } = req.body;

        const result = await client.query(`
          INSERT INTO LeadsMarketplace (
            merchant_id, store_id, title, description, delivery_volume,
            postal_codes, cities, countries, budget_min, budget_max,
            requirements_json, price, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *
        `, [
          user.userId, store_id, title, description, delivery_volume,
          postal_codes, cities, countries, budget_min, budget_max,
          requirements_json || {}, price || 0, expires_at
        ]);

        return res.status(201).json({
          success: true,
          data: result.rows[0]
        });
      }

      if (req.method === 'PUT') {
        // Download/purchase lead (couriers only)
        const { lead_id } = req.body;
        
        if (user.role !== 'courier') {
          return res.status(403).json({ message: 'Only couriers can download leads' });
        }

        // Check if already downloaded
        const existing = await client.query(
          'SELECT * FROM LeadDownloads WHERE lead_id = $1 AND courier_id = $2',
          [lead_id, user.userId]
        );

        if (existing.rows.length > 0) {
          return res.status(400).json({ message: 'Lead already downloaded' });
        }

        // Record download
        await client.query(
          'INSERT INTO LeadDownloads (lead_id, courier_id) VALUES ($1, $2)',
          [lead_id, user.userId]
        );

        // Increment download count
        await client.query(
          'UPDATE LeadsMarketplace SET download_count = download_count + 1 WHERE lead_id = $1',
          [lead_id]
        );

        // Get full lead details
        const lead = await client.query(
          `SELECT l.*, s.store_name, u.email as merchant_email, u.phone as merchant_phone
           FROM LeadsMarketplace l
           JOIN Stores s ON l.store_id = s.store_id
           JOIN Users u ON l.merchant_id = u.user_id
           WHERE l.lead_id = $1`,
          [lead_id]
        );

        return res.status(200).json({
          success: true,
          message: 'Lead downloaded successfully',
          data: lead.rows[0]
        });
      }

      return res.status(405).json({ message: 'Method not allowed' });
      
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Leads API error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
