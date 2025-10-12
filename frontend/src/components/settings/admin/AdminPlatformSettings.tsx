import React from 'react';
import { Box, Paper, Typography, Grid, Card, CardContent } from '@mui/material';
import { Dashboard, TrendingUp, People, ShoppingBag } from '@mui/icons-material';

interface AdminPlatformSettingsProps {
  platformStats: any;
}

export const AdminPlatformSettings: React.FC<AdminPlatformSettingsProps> = ({ platformStats }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Platform Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Monitor overall platform health and key metrics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Dashboard color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Total Users
                </Typography>
              </Box>
              <Typography variant="h4">
                {platformStats?.totalUsers || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingBag color="success" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Total Orders
                </Typography>
              </Box>
              <Typography variant="h4">
                {platformStats?.totalOrders || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="info" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Active Merchants
                </Typography>
              </Box>
              <Typography variant="h4">
                {platformStats?.activeMerchants || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="warning" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Revenue
                </Typography>
              </Box>
              <Typography variant="h4">
                ${platformStats?.totalRevenue || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Platform Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Platform-wide configuration options will be available here.
        </Typography>
      </Paper>
    </Box>
  );
};
