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

// Verify user token
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
    const userId = user.user_id;

    const client = await pool.connect();
    try {
      // GET: Retrieve preferences
      if (req.method === 'GET') {
        const result = await client.query(
          `SELECT 
            preference_id,
            user_id,
            email_enabled,
            push_enabled,
            sms_enabled,
            preferences,
            quiet_hours_enabled,
            quiet_hours_start,
            quiet_hours_end,
            created_at,
            updated_at
          FROM notification_preferences
          WHERE user_id = $1`,
          [userId]
        );

        // If no preferences exist, create default ones
        if (result.rows.length === 0) {
          const defaultPreferences = {
            new_order: { email: true, push: true, sms: false },
            order_status: { email: true, push: true, sms: false },
            delivery_update: { email: false, push: true, sms: false },
            payment_received: { email: true, push: false, sms: false },
            new_review: { email: true, push: true, sms: false },
            proximity_match: { email: false, push: true, sms: false },
            system_alert: { email: true, push: true, sms: false },
          };

          const insertResult = await client.query(
            `INSERT INTO notification_preferences (user_id, preferences)
             VALUES ($1, $2)
             RETURNING *`,
            [userId, JSON.stringify(defaultPreferences)]
          );

          return res.status(200).json({
            success: true,
            data: insertResult.rows[0],
          });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0],
        });
      }

      // PUT: Update preferences
      else if (req.method === 'PUT') {
        const {
          email_enabled,
          push_enabled,
          sms_enabled,
          preferences,
          quiet_hours_enabled,
          quiet_hours_start,
          quiet_hours_end,
        } = req.body;

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [userId];
        let paramCount = 1;

        if (email_enabled !== undefined) {
          paramCount++;
          updates.push(`email_enabled = $${paramCount}`);
          values.push(email_enabled);
        }
        if (push_enabled !== undefined) {
          paramCount++;
          updates.push(`push_enabled = $${paramCount}`);
          values.push(push_enabled);
        }
        if (sms_enabled !== undefined) {
          paramCount++;
          updates.push(`sms_enabled = $${paramCount}`);
          values.push(sms_enabled);
        }
        if (preferences !== undefined) {
          paramCount++;
          updates.push(`preferences = $${paramCount}`);
          values.push(JSON.stringify(preferences));
        }
        if (quiet_hours_enabled !== undefined) {
          paramCount++;
          updates.push(`quiet_hours_enabled = $${paramCount}`);
          values.push(quiet_hours_enabled);
        }
        if (quiet_hours_start !== undefined) {
          paramCount++;
          updates.push(`quiet_hours_start = $${paramCount}`);
          values.push(quiet_hours_start);
        }
        if (quiet_hours_end !== undefined) {
          paramCount++;
          updates.push(`quiet_hours_end = $${paramCount}`);
          values.push(quiet_hours_end);
        }

        if (updates.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No fields to update',
          });
        }

        const query = `
          UPDATE notification_preferences
          SET ${updates.join(', ')}
          WHERE user_id = $1
          RETURNING *
        `;

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Preferences not found',
          });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0],
        });
      }

      else {
        return res.status(405).json({
          success: false,
          message: 'Method not allowed',
        });
      }
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Notification preferences API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}
