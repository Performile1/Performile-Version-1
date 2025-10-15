import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import jwt from 'jsonwebtoken';

const pool = getPool();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(authHeader: string | undefined): any {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Admin Subscription Plans Management
 * GET - List all plans
 * POST - Create new plan
 * PUT - Update existing plan
 * DELETE - Delete plan
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify admin authentication
  const user = verifyToken(req.headers.authorization);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const client = await pool.connect();

  try {
    if (req.method === 'GET') {
      // Get all subscription plans
      const result = await client.query(`
        SELECT 
          plan_id,
          plan_name,
          user_role,
          price_monthly,
          price_yearly,
          features_json,
          limits_json,
          is_active,
          created_at,
          updated_at
        FROM "SubscriptionPlans"
        ORDER BY user_role, price_monthly
      `);

      return res.status(200).json({
        success: true,
        data: result.rows
      });

    } else if (req.method === 'POST') {
      // Create new subscription plan
      const {
        plan_name,
        user_role,
        price_monthly,
        price_yearly,
        features_json,
        limits_json,
        is_active = true
      } = req.body;

      // Validation
      if (!plan_name || !user_role || price_monthly === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: plan_name, user_role, price_monthly' 
        });
      }

      if (!['merchant', 'courier'].includes(user_role)) {
        return res.status(400).json({ 
          error: 'user_role must be either "merchant" or "courier"' 
        });
      }

      const result = await client.query(`
        INSERT INTO "SubscriptionPlans" (
          plan_name, user_role, price_monthly, price_yearly,
          features_json, limits_json, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        plan_name,
        user_role,
        price_monthly,
        price_yearly || price_monthly * 10, // Default yearly = 10x monthly
        features_json || {},
        limits_json || {},
        is_active
      ]);

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Plan created successfully'
      });

    } else if (req.method === 'PUT') {
      // Update existing subscription plan
      const {
        plan_id,
        plan_name,
        price_monthly,
        price_yearly,
        features_json,
        limits_json,
        is_active
      } = req.body;

      if (!plan_id) {
        return res.status(400).json({ error: 'plan_id is required' });
      }

      const result = await client.query(`
        UPDATE "SubscriptionPlans"
        SET 
          plan_name = COALESCE($1, plan_name),
          price_monthly = COALESCE($2, price_monthly),
          price_yearly = COALESCE($3, price_yearly),
          features_json = COALESCE($4, features_json),
          limits_json = COALESCE($5, limits_json),
          is_active = COALESCE($6, is_active),
          updated_at = NOW()
        WHERE plan_id = $7
        RETURNING *
      `, [
        plan_name,
        price_monthly,
        price_yearly,
        features_json,
        limits_json,
        is_active,
        plan_id
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Plan updated successfully'
      });

    } else if (req.method === 'DELETE') {
      // Delete subscription plan
      const { plan_id } = req.query;

      if (!plan_id) {
        return res.status(400).json({ error: 'plan_id is required' });
      }

      // Check if plan has active subscriptions
      const checkResult = await client.query(`
        SELECT COUNT(*) as count
        FROM "UserSubscriptions"
        WHERE plan_id = $1 AND status = 'active'
      `, [plan_id]);

      if (parseInt(checkResult.rows[0].count) > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete plan with active subscriptions. Deactivate it instead.' 
        });
      }

      const result = await client.query(`
        DELETE FROM "SubscriptionPlans"
        WHERE plan_id = $1
        RETURNING *
      `, [plan_id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Plan deleted successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Subscription plans API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    client.release();
  }
}
