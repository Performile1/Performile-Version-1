import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

export const ConsumerProfileSettings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Profile Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage your personal information</Typography>
      <Paper sx={{ p: 3 }}><Typography>Profile settings coming soon.</Typography></Paper>
    </Box>
  );
};
