import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Verify token helper
function verifyToken(authHeader: string | undefined): any {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify admin authentication
  const user = verifyToken(req.headers.authorization);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    if (req.method === 'GET') {
      // Get all subscription plans
      const result = await pool.query(`
        SELECT 
          plan_id,
          plan_name,
          plan_slug,
          user_type,
          tier,
          monthly_price,
          annual_price,
          max_orders_per_month,
          max_emails_per_month,
          max_sms_per_month,
          max_push_notifications_per_month,
          max_couriers,
          max_team_members,
          max_shops,
          plan_description as description,
          features,
          is_popular,
          is_active,
          display_order,
          created_at,
          updated_at
        FROM subscription_plans
        ORDER BY user_type, tier
      `);

      return res.status(200).json({
        success: true,
        plans: result.rows
      });

    } else if (req.method === 'PUT') {
      // Update a subscription plan
      const {
        plan_id,
        plan_name,
        monthly_price,
        annual_price,
        max_orders_per_month,
        max_emails_per_month,
        max_sms_per_month,
        max_push_notifications_per_month,
        max_couriers,
        max_team_members,
        max_shops,
        description,
        features,
        is_popular,
        is_active
      } = req.body;

      if (!plan_id) {
        return res.status(400).json({ message: 'Plan ID is required' });
      }

      const result = await pool.query(`
        UPDATE subscription_plans
        SET 
          plan_name = COALESCE($1, plan_name),
          monthly_price = COALESCE($2, monthly_price),
          annual_price = COALESCE($3, annual_price),
          max_orders_per_month = $4,
          max_emails_per_month = $5,
          max_sms_per_month = $6,
          max_push_notifications_per_month = $7,
          max_couriers = $8,
          max_team_members = $9,
          max_shops = $10,
          plan_description = COALESCE($11, plan_description),
          features = COALESCE($12, features),
          is_popular = COALESCE($13, is_popular),
          is_active = COALESCE($14, is_active),
          updated_at = NOW()
        WHERE plan_id = $15
        RETURNING *
      `, [
        plan_name,
        monthly_price,
        annual_price,
        max_orders_per_month,
        max_emails_per_month,
        max_sms_per_month,
        max_push_notifications_per_month,
        max_couriers,
        max_team_members,
        max_shops,
        description,
        features,
        is_popular,
        is_active,
        plan_id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      return res.status(200).json({
        success: true,
        plan: result.rows[0],
        message: 'Plan updated successfully'
      });

    } else if (req.method === 'POST') {
      // Create a new subscription plan
      const {
        plan_name,
        plan_slug,
        user_type,
        tier,
        monthly_price,
        annual_price,
        max_orders_per_month,
        max_emails_per_month,
        max_sms_per_month,
        max_push_notifications_per_month,
        max_couriers,
        max_team_members,
        max_shops,
        description,
        features,
        is_popular,
        display_order
      } = req.body;

      if (!plan_name || !plan_slug || !user_type || !tier) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const result = await pool.query(`
        INSERT INTO subscription_plans (
          plan_name, plan_slug, user_type, tier, monthly_price, annual_price,
          max_orders_per_month, max_emails_per_month, max_sms_per_month,
          max_push_notifications_per_month, max_couriers, max_team_members, max_shops,
          description, features, is_popular, display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        plan_name, plan_slug, user_type, tier, monthly_price, annual_price,
        max_orders_per_month, max_emails_per_month, max_sms_per_month,
        max_push_notifications_per_month, max_couriers, max_team_members, max_shops,
        description, features, is_popular, display_order
      ]);

      return res.status(201).json({
        success: true,
        plan: result.rows[0],
        message: 'Plan created successfully'
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Subscription plans API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}
