import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminEmailSettingsProps {
  platformStats: any;
}

export const AdminEmailSettings: React.FC<AdminEmailSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Email Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Configure email templates and SMTP settings</Typography>
      <Paper sx={{ p: 3 }}><Typography>Email configuration coming soon.</Typography></Paper>
    </Box>
  );
};
