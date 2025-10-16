import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
export const ConsumerFavoritesSettings: React.FC = () => {
  return (<Box><Typography variant="h5" gutterBottom>Favorites</Typography><Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Manage your favorite shops</Typography><Paper sx={{ p: 3 }}><Typography>Favorites coming soon.</Typography></Paper></Box>);
};
