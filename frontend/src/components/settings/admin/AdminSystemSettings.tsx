import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminSystemSettingsProps {
  platformStats: any;
}

export const AdminSystemSettings: React.FC<AdminSystemSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>System Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Configure system-wide settings and preferences</Typography>
      <Paper sx={{ p: 3 }}><Typography>System settings coming soon.</Typography></Paper>
    </Box>
  );
};
