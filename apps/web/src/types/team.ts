// Team management types for frontend
export type TeamRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface TeamMember {
  team_member_id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  team_role: TeamRole;
  permissions: Record<string, any>;
  joined_at: string;
  last_login?: string;
  is_active: boolean;
  invited_by_name?: string;
}

export interface TeamInvitation {
  invitation_id: string;
  entity_type: 'courier' | 'store';
  entity_id: string;
  invited_email: string;
  invited_by: string;
  team_role: TeamRole;
  permissions: Record<string, any>;
  invitation_token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at?: string;
  declined_at?: string;
  created_at: string;
}

export interface InviteTeamMemberRequest {
  email: string;
  teamRole: TeamRole;
  permissions?: Record<string, any>;
}

export interface UpdateTeamMemberRequest {
  teamRole: TeamRole;
  permissions?: Record<string, any>;
}

export interface UserEntity {
  courier_id?: string;
  store_id?: string;
  courier_name?: string;
  store_name?: string;
  team_role: TeamRole;
  permissions: Record<string, any>;
}

export interface UserEntities {
  couriers: UserEntity[];
  stores: UserEntity[];
}

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1
};

// Role permissions
export const ROLE_PERMISSIONS = {
  owner: {
    canInvite: true,
    canRemove: true,
    canUpdateRoles: true,
    canManageSettings: true,
    canViewAll: true,
    canEdit: true
  },
  admin: {
    canInvite: true,
    canRemove: true,
    canUpdateRoles: true,
    canManageSettings: true,
    canViewAll: true,
    canEdit: true
  },
  manager: {
    canInvite: true,
    canRemove: false,
    canUpdateRoles: false,
    canManageSettings: false,
    canViewAll: true,
    canEdit: true
  },
  member: {
    canInvite: false,
    canRemove: false,
    canUpdateRoles: false,
    canManageSettings: false,
    canViewAll: true,
    canEdit: false
  },
  viewer: {
    canInvite: false,
    canRemove: false,
    canUpdateRoles: false,
    canManageSettings: false,
    canViewAll: true,
    canEdit: false
  }
};

export const hasPermission = (userRole: TeamRole, requiredRole: TeamRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

export const canPerformAction = (userRole: TeamRole, action: keyof typeof ROLE_PERMISSIONS.owner): boolean => {
  return ROLE_PERMISSIONS[userRole][action];
};
