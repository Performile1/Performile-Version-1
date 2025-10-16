import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
export const ConsumerNotificationSettings: React.FC = () => {
  return (<Box><Typography variant="h5" gutterBottom>Notifications</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage notification preferences</Typography><Paper sx={{ p: 3 }}><Typography>Notification settings coming soon.</Typography></Paper></Box>);
};
