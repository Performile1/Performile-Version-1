import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { withRLS } from '../lib/rls';
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

  const user = (req as any).user;

  try {
    switch (req.method) {
      case 'GET':
        return await getClaims(req, res, user);
      case 'POST':
        return await createClaim(req, res, user);
      case 'PUT':
        return await updateClaim(req, res, user);
      case 'DELETE':
        return await deleteClaim(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Claims API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Get claims
async function getClaims(req: VercelRequest, res: VercelResponse, user: any) {
  const { claim_id, status, courier } = req.query;

  if (claim_id) {
    // Get specific claim with timeline (role-based access)
    let claimQuery = `
      SELECT c.*, 
        o.order_number,
        s.shop_name,
        co.courier_name,
        json_agg(
          json_build_object(
            'timeline_id', ct.timeline_id,
            'event_type', ct.event_type,
            'event_description', ct.event_description,
            'actor_name', ct.actor_name,
            'created_at', ct.created_at
          ) ORDER BY ct.created_at DESC
        ) as timeline
      FROM claims c
      LEFT JOIN claim_timeline ct ON c.claim_id = ct.claim_id
      LEFT JOIN orders o ON c.order_id = o.order_id
      LEFT JOIN shops s ON o.shop_id = s.shop_id
      LEFT JOIN couriers co ON o.courier_id = co.courier_id
      WHERE c.claim_id = $1
    `;
    const claimParams: any[] = [claim_id];

    // RLS will handle role-based access control automatically
    claimQuery += ` GROUP BY c.claim_id, o.order_number, s.shop_name, co.courier_name`;

    // Use RLS context
    const claimResult = await withRLS(pool, { userId: user.userId || user.user_id, role: user.role || user.user_role }, async (client) => {
      return await client.query(claimQuery, claimParams);
    });

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found or access denied' });
    }

    return res.status(200).json({
      success: true,
      data: claimResult.rows[0]
    });
  }

  // Get all claims for user (role-based filtering)
  let query = `
    SELECT c.*, o.order_number, s.shop_name as store_name, co.courier_name
    FROM claims c
    LEFT JOIN orders o ON c.order_id = o.order_id
    LEFT JOIN shops s ON o.shop_id = s.shop_id
    LEFT JOIN couriers co ON o.courier_id = co.courier_id
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramCount = 1;

  // RLS will handle role-based filtering automatically
  query += ` WHERE 1=1`;

  if (status) {
    query += ` AND c.claim_status = $${paramCount}`;
    params.push(status);
    paramCount++;
  }

  if (courier) {
    query += ` AND c.courier = $${paramCount}`;
    params.push(courier);
    paramCount++;
  }

  query += ` ORDER BY c.created_at DESC`;

  // Use RLS context
  const result = await withRLS(pool, { userId: user.userId || user.user_id, role: user.role || user.user_role }, async (client) => {
    return await client.query(query, params);
  });

  return res.status(200).json({
    success: true,
    data: result.rows
  });
}

// Create claim
async function createClaim(req: VercelRequest, res: VercelResponse, user: any) {
  const {
    order_id,
    tracking_number,
    courier,
    claim_type,
    incident_date,
    incident_description,
    incident_location,
    claimed_amount,
    declared_value,
    photos,
    documents
  } = req.body;

  // Validation
  if (!courier || !claim_type || !incident_description || !claimed_amount) {
    return res.status(400).json({ 
      error: 'Missing required fields: courier, claim_type, incident_description, claimed_amount' 
    });
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create claim
    const claimResult = await client.query(
      `INSERT INTO claims (
        order_id, tracking_number, courier, claim_type, claim_status,
        claimant_id, claimant_name, claimant_email, claimant_phone,
        incident_date, incident_description, incident_location,
        claimed_amount, declared_value, photos, documents, created_by
      ) VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        order_id, tracking_number, courier, claim_type,
        user.user_id, user.first_name + ' ' + user.last_name, user.email, user.phone,
        incident_date, incident_description, incident_location,
        claimed_amount, declared_value, 
        photos ? JSON.stringify(photos) : null,
        documents ? JSON.stringify(documents) : null,
        user.user_id
      ]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      data: claimResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Update claim
async function updateClaim(req: VercelRequest, res: VercelResponse, user: any) {
  const { claim_id } = req.query;
  const updates = req.body;

  if (!claim_id) {
    return res.status(400).json({ error: 'claim_id required' });
  }

  // Verify ownership
  const ownerCheck = await pool.query(
    'SELECT claim_id FROM claims WHERE claim_id = $1 AND claimant_id = $2',
    [claim_id, user.user_id]
  );

  if (ownerCheck.rows.length === 0) {
    return res.status(403).json({ error: 'Not authorized to update this claim' });
  }

  // Build update query
  const allowedFields = [
    'incident_description', 'incident_location', 'claimed_amount',
    'declared_value', 'photos', 'documents'
  ];

  const updateFields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (updateFields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  values.push(claim_id);

  const result = await pool.query(
    `UPDATE claims SET ${updateFields.join(', ')}, updated_at = NOW()
     WHERE claim_id = $${paramCount}
     RETURNING *`,
    values
  );

  return res.status(200).json({
    success: true,
    data: result.rows[0]
  });
}

// Delete claim
async function deleteClaim(req: VercelRequest, res: VercelResponse, user: any) {
  const { claim_id } = req.query;

  if (!claim_id) {
    return res.status(400).json({ error: 'claim_id required' });
  }

  // Only allow deletion of draft claims
  const result = await pool.query(
    `DELETE FROM claims 
     WHERE claim_id = $1 AND claimant_id = $2 AND claim_status = 'draft'
     RETURNING claim_id`,
    [claim_id, user.user_id]
  );

  if (result.rows.length === 0) {
    return res.status(403).json({ 
      error: 'Cannot delete claim (not found, not yours, or already submitted)' 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Claim deleted successfully'
  });
}
