import React from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Rating, LinearProgress } from '@mui/material';
import { Star, TrendingUp } from '@mui/icons-material';

interface RatingSettingsProps {
  subscriptionInfo?: any;
}

export const RatingSettings: React.FC<RatingSettingsProps> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Star /> Ratings & Reviews
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your shop ratings and customer reviews
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h3" align="center">4.8</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                <Rating value={4.8} precision={0.1} readOnly />
              </Box>
              <Typography variant="body2" color="text.secondary" align="center">
                Based on 234 reviews
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Rating Breakdown</Typography>
            {[5, 4, 3, 2, 1].map((stars) => (
              <Box key={stars} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography sx={{ minWidth: 60 }}>{stars} stars</Typography>
                <LinearProgress
                  variant="determinate"
                  value={stars === 5 ? 75 : stars === 4 ? 20 : 5}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                />
                <Typography sx={{ minWidth: 40 }} variant="body2" color="text.secondary">
                  {stars === 5 ? '75%' : stars === 4 ? '20%' : '5%'}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Reviews</Typography>
            <Typography color="text.secondary">No reviews yet</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
