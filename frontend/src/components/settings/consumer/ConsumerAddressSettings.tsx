import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const ConsumerAddressSettings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Address Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage your delivery addresses</Typography>
      <Paper sx={{ p: 3 }}><Typography>Address management coming soon.</Typography></Paper>
    </Box>
  );
};
