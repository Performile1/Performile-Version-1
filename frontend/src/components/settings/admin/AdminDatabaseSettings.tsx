import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface AdminDatabaseSettingsProps {
  platformStats: any;
}

export const AdminDatabaseSettings: React.FC<AdminDatabaseSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>Database Settings</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage database backups and maintenance</Typography>
      <Paper sx={{ p: 3 }}><Typography>Database management coming soon.</Typography></Paper>
    </Box>
  );
};
