import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminCouriersSettingsProps {
  platformStats: any;
}

export const AdminCouriersSettings: React.FC<AdminCouriersSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Courier Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage courier companies and delivery services</Typography>
      <Paper sx={{ p: 3 }}><Typography>Courier management features coming soon. Total couriers: {platformStats?.totalCouriers || 0}</Typography></Paper>
    </Box>
  );
};
