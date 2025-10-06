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
        return await getEmailTemplates(req, res, user.user_id);
      case 'POST':
        return await createEmailTemplate(req, res, user.user_id);
      case 'PUT':
        return await updateEmailTemplate(req, res, user.user_id);
      case 'DELETE':
        return await deleteEmailTemplate(req, res, user.user_id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Email template error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get user's email templates
async function getEmailTemplates(req: VercelRequest, res: VercelResponse, userId: string) {
  const { template_type } = req.query;

  let query = 'SELECT * FROM email_templates WHERE user_id = $1';
  const params: any[] = [userId];

  if (template_type) {
    params.push(template_type);
    query += ` AND template_type = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';

  const result = await pool.query(query, params);

  return res.status(200).json({
    success: true,
    templates: result.rows
  });
}

// Create email template
async function createEmailTemplate(req: VercelRequest, res: VercelResponse, userId: string) {
  const {
    template_name,
    template_type,
    subject_line,
    custom_text,
    logo_url,
    primary_color,
    secondary_color
  } = req.body;

  if (!template_type) {
    return res.status(400).json({ error: 'template_type is required' });
  }

  // Check if template already exists for this type
  const existingQuery = `
    SELECT template_id FROM email_templates
    WHERE user_id = $1 AND template_type = $2
  `;
  const existing = await pool.query(existingQuery, [userId, template_type]);

  if (existing.rows.length > 0) {
    // Update existing template instead
    return updateEmailTemplate(req, res, userId);
  }

  const query = `
    INSERT INTO email_templates (
      user_id, template_name, template_type, subject_line,
      custom_text, logo_url, primary_color, secondary_color
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const result = await pool.query(query, [
    userId,
    template_name || `${template_type} Template`,
    template_type,
    subject_line,
    custom_text,
    logo_url,
    primary_color || '#667eea',
    secondary_color || '#764ba2'
  ]);

  return res.status(201).json({
    success: true,
    template: result.rows[0]
  });
}

// Update email template
async function updateEmailTemplate(req: VercelRequest, res: VercelResponse, userId: string) {
  const { template_id, template_type } = req.query;
  const updates = req.body;

  if (!template_id && !template_type) {
    return res.status(400).json({ error: 'template_id or template_type required' });
  }

  // Build dynamic update query
  const allowedFields = [
    'template_name', 'subject_line', 'custom_text', 'logo_url',
    'primary_color', 'secondary_color', 'is_active'
  ];

  const updateFields: string[] = [];
  const values: any[] = [userId];
  let paramIndex = 2;

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

  let whereClause = 'user_id = $1';
  if (template_id) {
    values.push(template_id);
    whereClause += ` AND template_id = $${paramIndex}`;
  } else if (template_type) {
    values.push(template_type);
    whereClause += ` AND template_type = $${paramIndex}`;
  }

  const query = `
    UPDATE email_templates
    SET ${updateFields.join(', ')}
    WHERE ${whereClause}
    RETURNING *
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.status(200).json({
    success: true,
    template: result.rows[0]
  });
}

// Delete email template
async function deleteEmailTemplate(req: VercelRequest, res: VercelResponse, userId: string) {
  const { template_id } = req.query;

  if (!template_id) {
    return res.status(400).json({ error: 'template_id required' });
  }

  const query = `
    DELETE FROM email_templates
    WHERE template_id = $1 AND user_id = $2
    RETURNING *
  `;

  const result = await pool.query(query, [template_id, userId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Template not found' });
  }

  return res.status(200).json({
    success: true,
    message: 'Template deleted'
  });
}
