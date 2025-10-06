import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { applySecurityMiddleware } from '../middleware/security';
import crypto from 'crypto';

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
  const { entityType, entityId } = req.query; // 'courier' or 'store'

  try {
    if (req.method === 'POST') {
      return await inviteTeamMember(req, res, user.user_id, entityType as string, entityId as string);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Team invitation error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function inviteTeamMember(
  req: VercelRequest,
  res: VercelResponse,
  userId: string,
  entityType: string,
  entityId: string
) {
  const { email, teamRole } = req.body;

  if (!email || !teamRole) {
    return res.status(400).json({ error: 'Email and team role are required' });
  }

  if (!['courier', 'store'].includes(entityType)) {
    return res.status(400).json({ error: 'Invalid entity type' });
  }

  // Check team member limit
  const limitCheck = await pool.query(
    'SELECT * FROM check_team_member_limit($1)',
    [userId]
  );

  const limit = limitCheck.rows[0];

  if (!limit.can_add_member) {
    return res.status(403).json({
      error: 'Team member limit reached',
      message: limit.message,
      current_count: limit.current_count,
      max_allowed: limit.max_allowed,
      upgrade_required: true
    });
  }

  // Verify ownership of entity
  let ownershipQuery;
  if (entityType === 'courier') {
    ownershipQuery = `
      SELECT courier_id FROM couriers 
      WHERE courier_id = $1 AND user_id = $2
    `;
  } else {
    ownershipQuery = `
      SELECT store_id FROM stores 
      WHERE store_id = $1 AND user_id = $2
    `;
  }

  const ownershipResult = await pool.query(ownershipQuery, [entityId, userId]);

  if (ownershipResult.rows.length === 0) {
    return res.status(403).json({ error: 'You do not own this entity' });
  }

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT user_id, user_role FROM users WHERE email = $1',
    [email]
  );

  // Generate invitation token
  const invitationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Create invitation record (you'll need to create this table)
  const invitationQuery = `
    INSERT INTO team_invitations (
      token, invited_by_user_id, entity_type, entity_id,
      email, team_role, expires_at, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
    RETURNING *
  `;

  const invitation = await pool.query(invitationQuery, [
    invitationToken,
    userId,
    entityType,
    entityId,
    email,
    teamRole,
    expiresAt
  ]);

  // TODO: Send invitation email via Resend
  const invitationLink = `${process.env.VERCEL_URL || 'https://frontend-two-swart-31.vercel.app'}/invite/${invitationToken}`;

  // Log the invitation
  console.log(`Team invitation sent to ${email} for ${entityType} ${entityId}`);
  console.log(`Invitation link: ${invitationLink}`);

  return res.status(201).json({
    success: true,
    message: 'Invitation sent successfully',
    invitation: {
      id: invitation.rows[0].invitation_id,
      email,
      teamRole,
      expiresAt,
      invitationLink
    },
    limit_info: {
      current_count: limit.current_count + 1, // Include the new invitation
      max_allowed: limit.max_allowed,
      remaining: limit.max_allowed ? limit.max_allowed - limit.current_count - 1 : null
    }
  });
}
