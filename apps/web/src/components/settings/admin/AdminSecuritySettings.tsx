import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminSecuritySettingsProps {
  platformStats: any;
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Security Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Configure security policies and access controls</Typography>
      <Paper sx={{ p: 3 }}><Typography>Security settings coming soon.</Typography></Paper>
    </Box>
  );
};
