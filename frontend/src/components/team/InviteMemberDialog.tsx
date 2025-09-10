import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Chip
} from '@mui/material';
import { TeamRole, ROLE_PERMISSIONS } from '@/types/team';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: TeamRole) => Promise<void>;
  entityType: 'courier' | 'store';
  loading?: boolean;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onClose,
  onInvite,
  entityType,
  loading = false
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('member');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await onInvite(email.trim(), role);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation');
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('member');
    setError('');
    onClose();
  };

  const getRoleDescription = (role: TeamRole) => {
    const permissions = ROLE_PERMISSIONS[role];
    const actions = [];
    
    if (permissions.canManageSettings) actions.push('Manage settings');
    if (permissions.canInvite) actions.push('Invite members');
    if (permissions.canUpdateRoles) actions.push('Update roles');
    if (permissions.canRemove) actions.push('Remove members');
    if (permissions.canEdit) actions.push('Edit content');
    if (permissions.canViewAll) actions.push('View all data');
    
    return actions.join(', ');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Invite Team Member to {entityType === 'courier' ? 'Courier Company' : 'Store'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            placeholder="colleague@example.com"
            helperText="The person will receive an invitation email"
          />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as TeamRole)}
            >
              <MenuItem value="admin">
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Admin
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Full access except ownership transfer
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="manager">
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Manager
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Can invite members and edit content
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="member">
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Member
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Can view and access most features
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="viewer">
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    Viewer
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Read-only access to data
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Selected Role Permissions:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {getRoleDescription(role).split(', ').map((permission, index) => (
                <Chip
                  key={index}
                  label={permission}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>

          <Alert severity="info">
            The invited person will receive an email with instructions to join your team. 
            The invitation will expire in 7 days.
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !email.trim()}
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
