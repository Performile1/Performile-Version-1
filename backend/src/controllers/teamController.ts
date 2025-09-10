import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import database from '../config/database';
import { AppError } from '../types';
import logger from '../utils/logger';
import { EncryptionService } from '../utils/encryption';
import { validate } from '../utils/validation';
import Joi from 'joi';

export class TeamController {
  // Get team members for a courier
  async getCourierTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courierId } = req.params;
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Check if user has permission to view team
      const hasPermission = await database.query(
        'SELECT user_has_courier_permission($1, $2, $3) as has_permission',
        [userId, courierId, 'viewer']
      );

      if (!hasPermission.rows[0]?.has_permission) {
        throw new AppError('Access denied', 403);
      }

      const result = await database.query(`
        SELECT 
          ctm.team_member_id,
          ctm.team_role,
          ctm.permissions,
          ctm.joined_at,
          ctm.is_active,
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.last_login,
          invited_by_user.first_name as invited_by_name
        FROM CourierTeamMembers ctm
        JOIN Users u ON ctm.user_id = u.user_id
        LEFT JOIN Users invited_by_user ON ctm.invited_by = invited_by_user.user_id
        WHERE ctm.courier_id = $1 AND ctm.is_active = true
        ORDER BY 
          CASE ctm.team_role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'manager' THEN 3 
            WHEN 'member' THEN 4 
            WHEN 'viewer' THEN 5 
          END,
          ctm.joined_at ASC
      `, [courierId]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error fetching courier team members', error);
      throw error;
    }
  }

  // Get team members for a store
  async getStoreTeamMembers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { storeId } = req.params;
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Check if user has permission to view team
      const hasPermission = await database.query(
        'SELECT user_has_store_permission($1, $2, $3) as has_permission',
        [userId, storeId, 'viewer']
      );

      if (!hasPermission.rows[0]?.has_permission) {
        throw new AppError('Access denied', 403);
      }

      const result = await database.query(`
        SELECT 
          stm.team_member_id,
          stm.team_role,
          stm.permissions,
          stm.joined_at,
          stm.is_active,
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          u.phone,
          u.last_login,
          invited_by_user.first_name as invited_by_name
        FROM StoreTeamMembers stm
        JOIN Users u ON stm.user_id = u.user_id
        LEFT JOIN Users invited_by_user ON stm.invited_by = invited_by_user.user_id
        WHERE stm.store_id = $1 AND stm.is_active = true
        ORDER BY 
          CASE stm.team_role 
            WHEN 'owner' THEN 1 
            WHEN 'admin' THEN 2 
            WHEN 'manager' THEN 3 
            WHEN 'member' THEN 4 
            WHEN 'viewer' THEN 5 
          END,
          stm.joined_at ASC
      `, [storeId]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      logger.error('Error fetching store team members', error);
      throw error;
    }
  }

  // Invite user to courier team
  async inviteToCourierTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { courierId } = req.params;
      const { email, teamRole, permissions } = req.body;
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Validate input
      const schema = Joi.object({
        email: Joi.string().email().required(),
        teamRole: Joi.string().valid('admin', 'manager', 'member', 'viewer').default('member'),
        permissions: Joi.object().default({})
      });

      const { error, value } = schema.validate({ email, teamRole, permissions });
      if (error) {
        throw new AppError(error.details?.[0]?.message || 'Validation error', 400);
      }

      // Check if user has permission to invite (admin or owner)
      const hasPermission = await database.query(
        'SELECT user_has_courier_permission($1, $2, $3) as has_permission',
        [userId, courierId, 'admin']
      );

      if (!hasPermission.rows[0]?.has_permission) {
        throw new AppError('Access denied: Only admins and owners can invite team members', 403);
      }

      // Check if user is already a team member
      const existingMember = await database.query(
        `SELECT ctm.team_member_id 
         FROM CourierTeamMembers ctm 
         JOIN Users u ON ctm.user_id = u.user_id 
         WHERE ctm.courier_id = $1 AND u.email = $2`,
        [courierId, value.email]
      );

      if (existingMember.rows.length > 0) {
        throw new AppError('User is already a team member', 400);
      }

      // Check for existing pending invitation
      const existingInvitation = await database.query(
        `SELECT invitation_id FROM TeamInvitations 
         WHERE entity_type = 'courier' AND entity_id = $1 AND invited_email = $2 AND status = 'pending'`,
        [courierId, value.email]
      );

      if (existingInvitation.rows.length > 0) {
        throw new AppError('Invitation already sent to this email', 400);
      }

      // Generate invitation token
      const invitationToken = EncryptionService.generateSecureToken(32);

      // Create invitation
      const invitation = await database.query(`
        INSERT INTO TeamInvitations (
          entity_type, entity_id, invited_email, invited_by, 
          team_role, permissions, invitation_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING invitation_id, invitation_token, expires_at
      `, ['courier', courierId, value.email, userId, value.teamRole, JSON.stringify(value.permissions), invitationToken]);

      // TODO: Send invitation email here
      logger.info('Team invitation created', {
        courierId,
        invitedEmail: value.email,
        invitedBy: userId,
        role: value.teamRole
      });

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          invitationId: invitation.rows[0].invitation_id,
          expiresAt: invitation.rows[0].expires_at
        }
      });
    } catch (error) {
      logger.error('Error inviting to courier team', error);
      throw error;
    }
  }

  // Invite user to store team
  async inviteToStoreTeam(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { storeId } = req.params;
      const { email, teamRole, permissions } = req.body;
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Validate input
      const schema = Joi.object({
        email: Joi.string().email().required(),
        teamRole: Joi.string().valid('admin', 'manager', 'member', 'viewer').default('member'),
        permissions: Joi.object().default({})
      });

      const { error, value } = schema.validate({ email, teamRole, permissions });
      if (error) {
        throw new AppError(error.details?.[0]?.message || 'Validation error', 400);
      }

      // Check if user has permission to invite
      const hasPermission = await database.query(
        'SELECT user_has_store_permission($1, $2, $3) as has_permission',
        [userId, storeId, 'admin']
      );

      if (!hasPermission.rows[0]?.has_permission) {
        throw new AppError('Access denied: Only admins and owners can invite team members', 403);
      }

      // Check if user is already a team member
      const existingMember = await database.query(
        `SELECT stm.team_member_id 
         FROM StoreTeamMembers stm 
         JOIN Users u ON stm.user_id = u.user_id 
         WHERE stm.store_id = $1 AND u.email = $2`,
        [storeId, value.email]
      );

      if (existingMember.rows.length > 0) {
        throw new AppError('User is already a team member', 400);
      }

      // Check for existing pending invitation
      const existingInvitation = await database.query(
        `SELECT invitation_id FROM TeamInvitations 
         WHERE entity_type = 'store' AND entity_id = $1 AND invited_email = $2 AND status = 'pending'`,
        [storeId, value.email]
      );

      if (existingInvitation.rows.length > 0) {
        throw new AppError('Invitation already sent to this email', 400);
      }

      // Generate invitation token
      const invitationToken = EncryptionService.generateSecureToken(32);

      // Create invitation
      const invitation = await database.query(`
        INSERT INTO TeamInvitations (
          entity_type, entity_id, invited_email, invited_by, 
          team_role, permissions, invitation_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING invitation_id, invitation_token, expires_at
      `, ['store', storeId, value.email, userId, value.teamRole, JSON.stringify(value.permissions), invitationToken]);

      logger.info('Team invitation created', {
        storeId,
        invitedEmail: value.email,
        invitedBy: userId,
        role: value.teamRole
      });

      res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: {
          invitationId: invitation.rows[0].invitation_id,
          expiresAt: invitation.rows[0].expires_at
        }
      });
    } catch (error) {
      logger.error('Error inviting to store team', error);
      throw error;
    }
  }

  // Accept team invitation
  async acceptInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;
      const userId = req.user?.user_id;
      const userEmail = req.user?.email;
      
      if (!userId || !userEmail) {
        throw new AppError('Authentication required', 401);
      }

      // Get invitation details
      const invitation = await database.query(`
        SELECT * FROM TeamInvitations 
        WHERE invitation_token = $1 AND status = 'pending' AND expires_at > NOW()
      `, [token]);

      if (invitation.rows.length === 0) {
        throw new AppError('Invalid or expired invitation', 400);
      }

      const inv = invitation.rows[0];

      // Check if invitation email matches user email
      if (inv.invited_email !== userEmail) {
        throw new AppError('This invitation was not sent to your email address', 403);
      }

      await database.transaction(async (client) => {
        // Add user to appropriate team
        if (inv.entity_type === 'courier') {
          await client.query(`
            INSERT INTO CourierTeamMembers (courier_id, user_id, team_role, permissions, invited_by)
            VALUES ($1, $2, $3, $4, $5)
          `, [inv.entity_id, userId, inv.team_role, inv.permissions, inv.invited_by]);
        } else if (inv.entity_type === 'store') {
          await client.query(`
            INSERT INTO StoreTeamMembers (store_id, user_id, team_role, permissions, invited_by)
            VALUES ($1, $2, $3, $4, $5)
          `, [inv.entity_id, userId, inv.team_role, inv.permissions, inv.invited_by]);
        }

        // Update invitation status
        await client.query(`
          UPDATE TeamInvitations 
          SET status = 'accepted', accepted_at = NOW() 
          WHERE invitation_id = $1
        `, [inv.invitation_id]);
      });

      logger.info('Team invitation accepted', {
        invitationId: inv.invitation_id,
        userId,
        entityType: inv.entity_type,
        entityId: inv.entity_id
      });

      res.json({
        success: true,
        message: 'Invitation accepted successfully',
        data: {
          entityType: inv.entity_type,
          entityId: inv.entity_id,
          role: inv.team_role
        }
      });
    } catch (error) {
      logger.error('Error accepting invitation', error);
      throw error;
    }
  }

  async updateTeamMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { teamMemberId } = req.params;
      const { teamRole, permissions } = req.body;
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Validate input
      const schema = Joi.object({
        teamRole: Joi.string().valid('owner', 'admin', 'manager', 'member', 'viewer').required(),
        permissions: Joi.array().items(Joi.string()).optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        throw new AppError(error.details?.[0]?.message || 'Validation error', 400);
      }

      // Get team member details to determine entity type
      const courierMember = await database.query(
        'SELECT courier_id, user_id, team_role FROM CourierTeamMembers WHERE team_member_id = $1',
        [teamMemberId]
      );

      const storeMember = await database.query(
        'SELECT store_id, user_id, team_role FROM StoreTeamMembers WHERE team_member_id = $1',
        [teamMemberId]
      );

      let entityId: string;
      let entityType: string;
      let targetUserId: string;
      let currentRole: string;

      if (courierMember.rows.length > 0) {
        entityId = courierMember.rows[0].courier_id;
        entityType = 'courier';
        targetUserId = courierMember.rows[0].user_id;
        currentRole = courierMember.rows[0].team_role;
      } else if (storeMember.rows.length > 0) {
        entityId = storeMember.rows[0].store_id;
        entityType = 'store';
        targetUserId = storeMember.rows[0].user_id;
        currentRole = storeMember.rows[0].team_role;
      } else {
        throw new AppError('Team member not found', 404);
      }

      // Check permissions
      const permissionFunction = entityType === 'courier' ? 'user_has_courier_permission' : 'user_has_store_permission';
      const hasPermission = await database.query(
        `SELECT ${permissionFunction}($1, $2, $3) as has_permission`,
        [userId, entityId, 'admin']
      );

      if (!hasPermission.rows[0]?.has_permission) {
        throw new AppError('Access denied: Only admins and owners can update roles', 403);
      }

      // Prevent changing owner role
      if (currentRole === 'owner') {
        throw new AppError('Cannot change owner role', 400);
      }

      // Update role
      const table = entityType === 'courier' ? 'CourierTeamMembers' : 'StoreTeamMembers';
      await database.query(`
        UPDATE ${table} 
        SET team_role = $1, permissions = $2 
        WHERE team_member_id = $3
      `, [value.teamRole, JSON.stringify(value.permissions), teamMemberId]);

      logger.info('Team member role updated', {
        teamMemberId,
        entityType,
        entityId,
        newRole: value.teamRole,
        updatedBy: userId
      });

      res.json({
        success: true,
        message: 'Team member role updated successfully'
      });
    } catch (error) {
      logger.error('Error updating team member role', error);
      throw error;
    }
  }

  // Remove team member
  async removeTeamMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { teamMemberId } = req.params;
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      // Get team member details
      const courierMember = await database.query(
        'SELECT courier_id, user_id, team_role FROM CourierTeamMembers WHERE team_member_id = $1',
        [teamMemberId]
      );

      const storeMember = await database.query(
        'SELECT store_id, user_id, team_role FROM StoreTeamMembers WHERE team_member_id = $1',
        [teamMemberId]
      );

      let entityId: string;
      let entityType: string;
      let targetUserId: string;
      let currentRole: string;

      if (courierMember.rows.length > 0) {
        entityId = courierMember.rows[0].courier_id;
        entityType = 'courier';
        targetUserId = courierMember.rows[0].user_id;
        currentRole = courierMember.rows[0].team_role;
      } else if (storeMember.rows.length > 0) {
        entityId = storeMember.rows[0].store_id;
        entityType = 'store';
        targetUserId = storeMember.rows[0].user_id;
        currentRole = storeMember.rows[0].team_role;
      } else {
        throw new AppError('Team member not found', 404);
      }

      // Prevent removing owner
      if (currentRole === 'owner') {
        throw new AppError('Cannot remove owner from team', 400);
      }

      // Check permissions (admin can remove others, users can remove themselves)
      const permissionFunction = entityType === 'courier' ? 'user_has_courier_permission' : 'user_has_store_permission';
      const hasPermission = await database.query(
        `SELECT ${permissionFunction}($1, $2, $3) as has_permission`,
        [userId, entityId, 'admin']
      );

      const canRemove = hasPermission.rows[0]?.has_permission || userId === targetUserId;

      if (!canRemove) {
        throw new AppError('Access denied: You can only remove yourself or be an admin', 403);
      }

      // Remove team member (soft delete)
      const table = entityType === 'courier' ? 'CourierTeamMembers' : 'StoreTeamMembers';
      await database.query(`
        UPDATE ${table} 
        SET is_active = false 
        WHERE team_member_id = $1
      `, [teamMemberId]);

      logger.info('Team member removed', {
        teamMemberId,
        entityType,
        entityId,
        removedBy: userId
      });

      res.json({
        success: true,
        message: 'Team member removed successfully'
      });
    } catch (error) {
      logger.error('Error removing team member', error);
      throw error;
    }
  }

  // Get user's accessible entities
  async getUserEntities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.user_id;
      
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const [couriers, stores] = await Promise.all([
        database.query('SELECT * FROM get_user_couriers($1)', [userId]),
        database.query('SELECT * FROM get_user_stores($1)', [userId])
      ]);

      res.json({
        success: true,
        data: {
          couriers: couriers.rows,
          stores: stores.rows
        }
      });
    } catch (error) {
      logger.error('Error fetching user entities', error);
      throw error;
    }
  }
}
