import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminAnalyticsSettingsProps {
  platformStats: any;
}

export const AdminAnalyticsSettings: React.FC<AdminAnalyticsSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Analytics Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Configure analytics and reporting</Typography>
      <Paper sx={{ p: 3 }}><Typography>Analytics configuration coming soon.</Typography></Paper>
    </Box>
  );
};
