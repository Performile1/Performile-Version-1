import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminSubscriptionsSettingsProps {
  platformStats: any;
}

export const AdminSubscriptionsSettings: React.FC<AdminSubscriptionsSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Subscription Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage subscription plans and billing</Typography>
      <Paper sx={{ p: 3 }}><Typography>Subscription management features coming soon.</Typography></Paper>
    </Box>
  );
};
