import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from './middleware/security';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: true,
    rateLimit: 'default'
  });

  if (!security.success) {
    return;
  }

  const user = (req as any).user;

  try {
    switch (req.method) {
      case 'GET':
        return await getIntegrations(req, res, user.user_id);
      case 'POST':
        return await createIntegration(req, res, user.user_id);
      case 'PUT':
        return await updateIntegration(req, res, user.user_id);
      case 'DELETE':
        return await deleteIntegration(req, res, user.user_id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('E-commerce integration error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get user's integrations
async function getIntegrations(req: VercelRequest, res: VercelResponse, userId: string) {
  const query = `
    SELECT * FROM ecommerce_integrations
    WHERE user_id = $1
    ORDER BY created_at DESC
  `;

  const result = await pool.query(query, [userId]);

  return res.status(200).json({
    success: true,
    integrations: result.rows
  });
}

// Create integration
async function createIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    platform,
    store_url,
    store_name,
    api_key,
    api_secret,
    webhook_secret,
    auto_send_review_requests,
    review_delay_days
  } = req.body;

  if (!platform) {
    return res.status(400).json({ error: 'platform is required' });
  }

  const validPlatforms = ['shopify', 'woocommerce', 'opencart', 'prestashop', 'magento', 'wix', 'squarespace'];
  if (!validPlatforms.includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  const query = `
    INSERT INTO ecommerce_integrations (
      user_id, platform, store_url, store_name, api_key, api_secret,
      webhook_secret, auto_send_review_requests, review_delay_days, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const result = await pool.query(query, [
    userId,
    platform,
    store_url || null,
    store_name || null,
    api_key || null,
    api_secret || null,
    webhook_secret || null,
    auto_send_review_requests !== false,
    review_delay_days || 0,
    'pending'
  ]);

  return res.status(201).json({
    success: true,
    integration: result.rows[0],
    webhook_url: `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/api/webhooks/ecommerce?platform=${platform}`
  });
}

// Update integration
async function updateIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const { integration_id } = req.query;
  const updates = req.body;

  if (!integration_id) {
    return res.status(400).json({ error: 'integration_id required' });
  }

  const allowedFields = [
    'store_url', 'store_name', 'api_key', 'api_secret', 'webhook_secret',
    'auto_send_review_requests', 'review_delay_days', 'status'
  ];

  const updateFields: string[] = [];
  const values: any[] = [userId, integration_id];
  let paramIndex = 3;

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

  const query = `
    UPDATE ecommerce_integrations
    SET ${updateFields.join(', ')}
    WHERE user_id = $1 AND integration_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  return res.status(200).json({
    success: true,
    integration: result.rows[0]
  });
}

// Delete integration
async function deleteIntegration(req: VercelRequest, res: VercelResponse, userId: string) {
  const { integration_id } = req.query;

  if (!integration_id) {
    return res.status(400).json({ error: 'integration_id required' });
  }

  const query = `
    DELETE FROM ecommerce_integrations
    WHERE integration_id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [integration_id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Integration deleted'
  });
}
