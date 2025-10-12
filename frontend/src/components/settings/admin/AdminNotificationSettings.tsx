import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminNotificationSettingsProps {
  platformStats: any;
}

export const AdminNotificationSettings: React.FC<AdminNotificationSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Notification Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Configure platform notifications and alerts</Typography>
      <Paper sx={{ p: 3 }}><Typography>Notification settings coming soon.</Typography></Paper>
    </Box>
  );
};
