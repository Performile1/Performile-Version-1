import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material';
import { TrendingUp, Star, Speed, CheckCircle } from '@mui/icons-material';

interface CourierPerformanceSettingsProps {
  subscriptionInfo?: any;
}

export const CourierPerformanceSettings: React.FC<CourierPerformanceSettingsProps> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUp /> Performance Metrics
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View and manage your courier performance metrics
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Star color="primary" />
                <Typography variant="h6">4.8</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Average Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Speed color="success" />
                <Typography variant="h6">95%</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                On-Time Delivery
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" />
                <Typography variant="h6">1,234</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Completed Deliveries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6">Trust Score</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Excellent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Performance Goals</Typography>
            <Typography color="text.secondary">
              Set and track your performance goals to improve your trust score
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
