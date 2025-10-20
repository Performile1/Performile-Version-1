import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  // Check if user is admin
  const user = security.user;
  if (!user || (user.role !== 'admin' && user.user_role !== 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getSubscriptionPlans(req, res);
      case 'POST':
        return await createSubscriptionPlan(req, res);
      case 'PUT':
        return await updateSubscriptionPlan(req, res);
      case 'DELETE':
        return await deleteSubscriptionPlan(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Subscription management error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get all subscription plans
async function getSubscriptionPlans(req: VercelRequest, res: VercelResponse) {
  const { user_type, include_inactive } = req.query;

  let query = 'SELECT * FROM subscription_plans WHERE 1=1';
  const params: any[] = [];

  if (user_type) {
    params.push(user_type);
    query += ` AND user_type = $${params.length}`;
  }

  if (include_inactive !== 'true') {
    query += ' AND is_active = true';
  }

  query += ' ORDER BY user_type, monthly_price';

  const result = await pool.query(query, params);

  return res.status(200).json({
    success: true,
    plans: result.rows
  });
}

// Create new subscription plan
async function createSubscriptionPlan(req: VercelRequest, res: VercelResponse) {
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
    is_popular
  } = req.body;

  // Validation
  if (!plan_name || !plan_slug || !user_type || !tier || monthly_price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['merchant', 'courier'].includes(user_type)) {
    return res.status(400).json({ error: 'Invalid user_type' });
  }

  if (![1, 2, 3].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier (must be 1, 2, or 3)' });
  }

  const query = `
    INSERT INTO subscription_plans (
      plan_name, plan_slug, user_type, tier, monthly_price, annual_price,
      max_orders_per_month, max_emails_per_month, max_sms_per_month,
      max_push_notifications_per_month, max_couriers, max_team_members, max_shops,
      description, features, is_popular
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    RETURNING *
  `;

  const result = await pool.query(query, [
    plan_name, plan_slug, user_type, tier, monthly_price, annual_price,
    max_orders_per_month, max_emails_per_month, max_sms_per_month,
    max_push_notifications_per_month, max_couriers, max_team_members, max_shops,
    description, features || {}, is_popular || false
  ]);

  return res.status(201).json({
    success: true,
    plan: result.rows[0]
  });
}

// Update subscription plan
async function updateSubscriptionPlan(req: VercelRequest, res: VercelResponse) {
  const { plan_id } = req.query;
  const updates = req.body;

  if (!plan_id) {
    return res.status(400).json({ error: 'plan_id required' });
  }

  // Build dynamic update query
  const allowedFields = [
    'plan_name', 'monthly_price', 'annual_price', 'max_orders_per_month',
    'max_emails_per_month', 'max_sms_per_month', 'max_push_notifications_per_month',
    'max_couriers', 'max_team_members', 'max_shops', 'description',
    'features', 'is_popular', 'is_active', 'is_visible', 'display_order'
  ];

  const updateFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields.push(`${field} = $${paramIndex}`);
      values.push(updates[field]);
      paramIndex++;
    }
  }

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  updateFields.push(`updated_at = NOW()`);
  values.push(plan_id);

  const query = `
    UPDATE subscription_plans
    SET ${updateFields.join(', ')}
    WHERE plan_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  return res.status(200).json({
    success: true,
    plan: result.rows[0]
  });
}

// Delete (deactivate) subscription plan
async function deleteSubscriptionPlan(req: VercelRequest, res: VercelResponse) {
  const { plan_id } = req.query;

  if (!plan_id) {
    return res.status(400).json({ error: 'plan_id required' });
  }

  // Don't actually delete, just deactivate
  const query = `
    UPDATE subscription_plans
    SET is_active = false, updated_at = NOW()
    WHERE plan_id = $1
    RETURNING *
  `;

  const result = await pool.query(query, [plan_id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Plan deactivated',
    plan: result.rows[0]
  });
}
