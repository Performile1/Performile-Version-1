import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Alert } from '@mui/material';
import { Analytics, TrendingUp, LocalShipping, AttachMoney } from '@mui/icons-material';

interface CourierAnalyticsSettingsProps {
  subscriptionInfo?: any;
}

export const CourierAnalyticsSettings: React.FC<CourierAnalyticsSettingsProps> = ({ subscriptionInfo }) => {
  const hasAdvancedAnalytics = subscriptionInfo?.has_advanced_analytics || false;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Analytics /> Analytics Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your analytics preferences and data retention
      </Typography>

      {!hasAdvancedAnalytics && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Upgrade to Professional or higher to unlock advanced analytics features
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalShipping color="primary" />
                <Typography variant="h6">Delivery Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Track delivery times, routes, and efficiency metrics
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AttachMoney color="success" />
                <Typography variant="h6">Revenue Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Monitor earnings, trends, and financial performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Data Retention</Typography>
            <Typography color="text.secondary">
              Your analytics data is retained for 12 months
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
