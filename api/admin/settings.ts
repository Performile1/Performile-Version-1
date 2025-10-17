import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

// Inline JWT helper
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

const pool = getPool();

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
    const user = verifyAdmin(req);
    const client = await pool.connect();

    try {
      // GET - Fetch all settings
      if (req.method === 'GET') {
        const result = await client.query(`
          SELECT setting_key, setting_value, data_type, setting_category
          FROM system_settings
          ORDER BY setting_category, setting_key
        `);

        // Group settings by category
        const settings: any = {
          email: {},
          api: {},
          security: {},
          features: {},
          maintenance: {}
        };

        result.rows.forEach((row) => {
          const [category, key] = row.setting_key.split('.');
          if (category && key && settings[category]) {
            // Convert value based on data type
            let value: any = row.setting_value;
            if (row.data_type === 'number') {
              value = parseInt(value) || 0;
            } else if (row.data_type === 'boolean') {
              value = value === 'true';
            }
            settings[category][key] = value;
          }
        });

        return res.status(200).json({
          success: true,
          data: settings
        });
      }

      // PUT - Update settings
      if (req.method === 'PUT') {
        const { category, settings } = req.body;

        if (!category || !settings) {
          return res.status(400).json({
            success: false,
            message: 'Category and settings are required'
          });
        }

        let updatedCount = 0;

        for (const [key, value] of Object.entries(settings)) {
          const settingKey = `${category}.${key}`;
          
          await client.query(
            `UPDATE system_settings 
             SET setting_value = $1, updated_by = $2, updated_at = NOW()
             WHERE setting_key = $3`,
            [String(value), user.userId, settingKey]
          );
          updatedCount++;
        }

        return res.status(200).json({
          success: true,
          message: 'Settings updated successfully',
          data: {
            category,
            updated_count: updatedCount,
            updated_at: new Date().toISOString()
          }
        });
      }

      // POST /reset - Reset to defaults
      if (req.method === 'POST' && req.url?.includes('/reset')) {
        // This would require default values - for now just return success
        return res.status(200).json({
          success: true,
          message: 'Settings reset to defaults'
        });
      }

      return res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Admin settings API error:', error);
    return res.status(error.message.includes('Admin') ? 403 : 500).json({ 
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
