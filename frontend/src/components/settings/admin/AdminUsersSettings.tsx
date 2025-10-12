import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminUsersSettingsProps {
  platformStats: any;
}

export const AdminUsersSettings: React.FC<AdminUsersSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage platform users, roles, and permissions
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          User management features coming soon. Total users: {platformStats?.totalUsers || 0}
        </Typography>
      </Paper>
    </Box>
  );
};
