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

// Verify token and get user
const verifyUser = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  return decoded;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = verifyUser(req);
    const client = await pool.connect();

    try {
      // GET - Fetch proximity settings
      if (req.method === 'GET') {
        const { entity_type, entity_id } = req.query;

        if (!entity_type || !entity_id) {
          return res.status(400).json({
            success: false,
            message: 'entity_type and entity_id are required'
          });
        }

        const result = await client.query(`
          SELECT 
            setting_id,
            user_id,
            entity_type,
            entity_id,
            delivery_range_km,
            postal_code_ranges,
            latitude,
            longitude,
            address,
            city,
            country,
            postal_code,
            auto_accept_within_range,
            notify_on_nearby_orders,
            priority_zones,
            is_active,
            created_at,
            updated_at
          FROM proximity_settings
          WHERE entity_type = $1 AND entity_id = $2
        `, [entity_type, entity_id]);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Proximity settings not found'
          });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0]
        });
      }

      // POST - Create proximity settings
      if (req.method === 'POST') {
        const {
          entity_type,
          entity_id,
          delivery_range_km,
          postal_code_ranges,
          latitude,
          longitude,
          address,
          city,
          country,
          postal_code,
          auto_accept_within_range,
          notify_on_nearby_orders,
          priority_zones
        } = req.body;

        if (!entity_type || !entity_id) {
          return res.status(400).json({
            success: false,
            message: 'entity_type and entity_id are required'
          });
        }

        const result = await client.query(`
          INSERT INTO proximity_settings (
            user_id,
            entity_type,
            entity_id,
            delivery_range_km,
            postal_code_ranges,
            latitude,
            longitude,
            address,
            city,
            country,
            postal_code,
            auto_accept_within_range,
            notify_on_nearby_orders,
            priority_zones
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (entity_type, entity_id)
          DO UPDATE SET
            delivery_range_km = EXCLUDED.delivery_range_km,
            postal_code_ranges = EXCLUDED.postal_code_ranges,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            country = EXCLUDED.country,
            postal_code = EXCLUDED.postal_code,
            auto_accept_within_range = EXCLUDED.auto_accept_within_range,
            notify_on_nearby_orders = EXCLUDED.notify_on_nearby_orders,
            priority_zones = EXCLUDED.priority_zones,
            updated_at = NOW()
          RETURNING *
        `, [
          user.userId,
          entity_type,
          entity_id,
          delivery_range_km || 50,
          JSON.stringify(postal_code_ranges || []),
          latitude,
          longitude,
          address,
          city,
          country,
          postal_code,
          auto_accept_within_range || false,
          notify_on_nearby_orders !== false,
          JSON.stringify(priority_zones || [])
        ]);

        return res.status(201).json({
          success: true,
          message: 'Proximity settings saved',
          data: result.rows[0]
        });
      }

      // PUT - Update proximity settings
      if (req.method === 'PUT') {
        const { setting_id } = req.query;
        const updates = req.body;

        if (!setting_id) {
          return res.status(400).json({
            success: false,
            message: 'setting_id is required'
          });
        }

        // Build dynamic update query
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramCount = 0;

        const allowedFields = [
          'delivery_range_km',
          'postal_code_ranges',
          'latitude',
          'longitude',
          'address',
          'city',
          'country',
          'postal_code',
          'auto_accept_within_range',
          'notify_on_nearby_orders',
          'priority_zones',
          'is_active'
        ];

        for (const field of allowedFields) {
          if (updates[field] !== undefined) {
            updateFields.push(`${field} = $${++paramCount}`);
            values.push(
              field === 'postal_code_ranges' || field === 'priority_zones'
                ? JSON.stringify(updates[field])
                : updates[field]
            );
          }
        }

        if (updateFields.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid fields to update'
          });
        }

        updateFields.push(`updated_at = NOW()`);
        values.push(setting_id);

        const result = await client.query(`
          UPDATE proximity_settings
          SET ${updateFields.join(', ')}
          WHERE setting_id = $${++paramCount}
          RETURNING *
        `, values);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Proximity settings not found'
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Proximity settings updated',
          data: result.rows[0]
        });
      }

      // DELETE - Delete proximity settings
      if (req.method === 'DELETE') {
        const { setting_id } = req.query;

        if (!setting_id) {
          return res.status(400).json({
            success: false,
            message: 'setting_id is required'
          });
        }

        await client.query(`
          DELETE FROM proximity_settings
          WHERE setting_id = $1 AND user_id = $2
        `, [setting_id, user.userId]);

        return res.status(200).json({
          success: true,
          message: 'Proximity settings deleted'
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
    console.error('Proximity settings API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
