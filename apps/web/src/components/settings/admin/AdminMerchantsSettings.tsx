import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminMerchantsSettingsProps {
  platformStats: any;
}

export const AdminMerchantsSettings: React.FC<AdminMerchantsSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Merchant Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage merchants, shops, and merchant subscriptions
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>Merchant management features coming soon. Total merchants: {platformStats?.totalMerchants || 0}</Typography>
      </Paper>
    </Box>
  );
};
