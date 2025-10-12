import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
export const ConsumerPaymentSettings: React.FC = () => {
  return (<Box><Typography variant="h5" gutterBottom>Payment Methods</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage your payment methods</Typography><Paper sx={{ p: 3 }}><Typography>Payment settings coming soon.</Typography></Paper></Box>);
};
