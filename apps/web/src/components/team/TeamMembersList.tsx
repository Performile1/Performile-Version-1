import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert
} from '@mui/material';
import {
  MoreVert,
  PersonAdd,
  Edit,
  Delete,
  AdminPanelSettings,
  ManageAccounts,
  Person,
  Visibility
} from '@mui/icons-material';
import { TeamMember, TeamRole, canPerformAction } from '@/types/team';
import { useAuthStore } from '@/store/authStore';

interface TeamMembersListProps {
  members: TeamMember[];
  currentUserRole: TeamRole;
  entityType: 'courier' | 'store';
  onInviteMember: () => void;
  onUpdateMember: (memberId: string, role: TeamRole) => void;
  onRemoveMember: (memberId: string) => void;
  loading?: boolean;
}

const getRoleIcon = (role: TeamRole) => {
  switch (role) {
    case 'owner':
      return <AdminPanelSettings color="error" />;
    case 'admin':
      return <ManageAccounts color="warning" />;
    case 'manager':
      return <Person color="info" />;
    case 'member':
      return <Person color="primary" />;
    case 'viewer':
      return <Visibility color="action" />;
    default:
      return <Person />;
  }
};

const getRoleColor = (role: TeamRole): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
  switch (role) {
    case 'owner':
      return 'error';
    case 'admin':
      return 'warning';
    case 'manager':
      return 'info';
    case 'member':
      return 'primary';
    case 'viewer':
      return 'default';
    default:
      return 'default';
  }
};

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  members,
  currentUserRole,
  entityType,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
  loading = false
}) => {
  const { user } = useAuthStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<TeamRole>('member');

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: TeamMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handleEditRole = () => {
    if (selectedMember) {
      setNewRole(selectedMember.team_role);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleRemoveMember = () => {
    if (selectedMember) {
      onRemoveMember(selectedMember.team_member_id);
    }
    handleMenuClose();
  };

  const handleSaveRole = () => {
    if (selectedMember) {
      onUpdateMember(selectedMember.team_member_id, newRole);
      setEditDialogOpen(false);
    }
  };

  const canEditMember = (member: TeamMember) => {
    if (member.user_id === user?.user_id) return false; // Can't edit yourself
    if (member.team_role === 'owner') return false; // Can't edit owner
    return canPerformAction(currentUserRole, 'canUpdateRoles');
  };

  const canRemoveMember = (member: TeamMember) => {
    if (member.team_role === 'owner') return false; // Can't remove owner
    if (member.user_id === user?.user_id) return true; // Can remove yourself
    return canPerformAction(currentUserRole, 'canRemove');
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Team Members ({members.length})
          </Typography>
          {canPerformAction(currentUserRole, 'canInvite') && (
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={onInviteMember}
              disabled={loading}
            >
              Invite Member
            </Button>
          )}
        </Box>

        {members.length === 0 ? (
          <Alert severity="info">
            No team members found. Invite members to collaborate on this {entityType}.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.team_member_id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {member.first_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {member.first_name && member.last_name
                              ? `${member.first_name} ${member.last_name}`
                              : member.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(member.team_role)}
                        label={member.team_role.charAt(0).toUpperCase() + member.team_role.slice(1)}
                        color={getRoleColor(member.team_role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(member.joined_at).toLocaleDateString()}
                      </Typography>
                      {member.invited_by_name && (
                        <Typography variant="caption" color="text.secondary">
                          Invited by {member.invited_by_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {member.last_login
                          ? new Date(member.last_login).toLocaleDateString()
                          : 'Never'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {(canEditMember(member) || canRemoveMember(member)) && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, member)}
                        >
                          <MoreVert />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {selectedMember && canEditMember(selectedMember) && (
            <MenuItem onClick={handleEditRole}>
              <Edit fontSize="small" sx={{ mr: 1 }} />
              Edit Role
            </MenuItem>
          )}
          {selectedMember && canRemoveMember(selectedMember) && (
            <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
              <Delete fontSize="small" sx={{ mr: 1 }} />
              {selectedMember.user_id === user?.user_id ? 'Leave Team' : 'Remove Member'}
            </MenuItem>
          )}
        </Menu>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>Edit Team Member Role</DialogTitle>
          <DialogContent>
            <Box mt={2}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newRole}
                  label="Role"
                  onChange={(e) => setNewRole(e.target.value as TeamRole)}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="viewer">Viewer</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRole} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
