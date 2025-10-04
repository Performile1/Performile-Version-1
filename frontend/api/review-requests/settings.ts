import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

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
      // GET - Get user's review request settings
      if (req.method === 'GET') {
        const query = `
          SELECT * FROM ReviewRequestSettings
          WHERE user_id = $1
        `;

        const result = await client.query(query, [user.userId]);

        if (result.rows.length === 0) {
          // Create default settings if none exist
          const createQuery = `
            INSERT INTO ReviewRequestSettings (user_id, user_role)
            VALUES ($1, $2)
            RETURNING *
          `;
          
          const created = await client.query(createQuery, [user.userId, user.role]);
          
          return res.status(200).json({
            success: true,
            data: created.rows[0]
          });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0]
        });
      }

      // PUT - Update review request settings
      if (req.method === 'PUT') {
        const {
          auto_request_enabled,
          days_after_delivery,
          max_requests_per_order,
          reminder_interval_days,
          email_enabled,
          sms_enabled,
          in_app_enabled,
          custom_message,
          custom_subject,
          include_incentive,
          incentive_text,
          min_order_value,
          only_successful_deliveries,
          exclude_low_ratings,
        } = req.body;

        const updateQuery = `
          UPDATE ReviewRequestSettings
          SET 
            auto_request_enabled = COALESCE($2, auto_request_enabled),
            days_after_delivery = COALESCE($3, days_after_delivery),
            max_requests_per_order = COALESCE($4, max_requests_per_order),
            reminder_interval_days = COALESCE($5, reminder_interval_days),
            email_enabled = COALESCE($6, email_enabled),
            sms_enabled = COALESCE($7, sms_enabled),
            in_app_enabled = COALESCE($8, in_app_enabled),
            custom_message = COALESCE($9, custom_message),
            custom_subject = COALESCE($10, custom_subject),
            include_incentive = COALESCE($11, include_incentive),
            incentive_text = COALESCE($12, incentive_text),
            min_order_value = COALESCE($13, min_order_value),
            only_successful_deliveries = COALESCE($14, only_successful_deliveries),
            exclude_low_ratings = COALESCE($15, exclude_low_ratings),
            updated_at = NOW()
          WHERE user_id = $1
          RETURNING *
        `;

        const result = await client.query(updateQuery, [
          user.userId,
          auto_request_enabled,
          days_after_delivery,
          max_requests_per_order,
          reminder_interval_days,
          email_enabled,
          sms_enabled,
          in_app_enabled,
          custom_message,
          custom_subject,
          include_incentive,
          incentive_text,
          min_order_value,
          only_successful_deliveries,
          exclude_low_ratings,
        ]);

        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Settings not found' });
        }

        return res.status(200).json({
          success: true,
          data: result.rows[0]
        });
      }

      return res.status(405).json({ message: 'Method not allowed' });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Review request settings API error:', error);
    return res.status(500).json({ 
      message: error.message || 'Internal server error'
    });
  }
}
