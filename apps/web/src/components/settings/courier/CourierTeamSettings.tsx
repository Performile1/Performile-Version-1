import React from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { Group, Add, PersonAdd } from '@mui/icons-material';

interface CourierTeamSettingsProps {
  subscriptionInfo?: any;
}

export const CourierTeamSettings: React.FC<CourierTeamSettingsProps> = ({ subscriptionInfo }) => {
  const maxTeamMembers = subscriptionInfo?.max_team_members || 1;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Group /> Team Members
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your courier team and assign roles
      </Typography>

      {subscriptionInfo && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Your plan allows up to {maxTeamMembers} team member{maxTeamMembers !== 1 ? 's' : ''}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Team Members</Typography>
          <Button variant="contained" startIcon={<PersonAdd />}>
            Invite Team Member
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Group sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">No team members yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Invite team members to help manage deliveries
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
