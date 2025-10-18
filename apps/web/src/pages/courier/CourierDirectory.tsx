import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Rating,
  LinearProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  LocalShipping as CourierIcon,
} from '@mui/icons-material';
import { CourierLogo } from '@/components/courier/CourierLogo';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { ManageCouriers } from '@/pages/admin/ManageCouriers';

interface AnonymousCourier {
  courier_id: string;
  trust_score: number;
  avg_rating: number;
  total_deliveries: number;
  successful_deliveries: number;
  total_reviews: number;
  location_area: string; // e.g., "North District", "City Center"
  subscription_tier: string;
}

export const CourierDirectory: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'trust_score' | 'rating' | 'deliveries'>('trust_score');

  // If admin, show full management page
  if (user?.user_role === 'admin') {
    return <ManageCouriers />;
  }

  // Fetch anonymized courier data
  const { data: couriersData, isLoading } = useQuery({
    queryKey: ['courier-directory', sortBy],
    queryFn: async () => {
      const response = await apiClient.get('/couriers/directory', {
        params: { sort: sortBy }
      });
      return response.data;
    }
  });

  const couriers: AnonymousCourier[] = Array.isArray(couriersData?.data) 
    ? couriersData.data.map((c: any) => ({
        ...c,
        trust_score: Number(c.trust_score) || 0,
        avg_rating: Number(c.avg_rating) || 0,
        total_deliveries: Number(c.total_deliveries) || 0,
        successful_deliveries: Number(c.successful_deliveries) || 0,
        total_reviews: Number(c.total_reviews) || 0
      }))
    : [];

  const filteredCouriers = couriers.filter(courier =>
    courier.location_area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const getSuccessRate = (courier: AnonymousCourier) => {
    if (courier.total_deliveries === 0) return 0;
    return Math.round((courier.successful_deliveries / courier.total_deliveries) * 100);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Courier Performance Directory
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Compare your performance with other couriers in your area (anonymized data)
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Couriers
                  </Typography>
                  <Typography variant="h4">
                    {couriers.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CourierIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg Trust Score
                  </Typography>
                  <Typography variant="h4">
                    {couriers.length > 0 
                      ? (couriers.reduce((sum, c) => sum + c.trust_score, 0) / couriers.length).toFixed(1)
                      : '0.0'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <StarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rating
                  </Typography>
                  <Typography variant="h4">
                    {couriers.length > 0 
                      ? (couriers.reduce((sum, c) => sum + c.avg_rating, 0) / couriers.length).toFixed(1)
                      : '0.0'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <StarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Deliveries
                  </Typography>
                  <Typography variant="h4">
                    {couriers.reduce((sum, c) => sum + c.total_deliveries, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by location area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <MenuItem value="trust_score">Trust Score</MenuItem>
                  <MenuItem value="rating">Average Rating</MenuItem>
                  <MenuItem value="deliveries">Total Deliveries</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Courier Cards */}
      <Grid container spacing={3}>
        {isLoading ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography align="center">Loading couriers...</Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : filteredCouriers.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography align="center" color="text.secondary">
                  No couriers found
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          filteredCouriers.map((courier, index) => (
            <Grid item xs={12} sm={6} md={4} key={courier.courier_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ position: 'relative', mr: 2 }}>
                      <CourierLogo
                        courierCode={courier.courier_code || `Courier-${index + 1}`}
                        courierName={`Courier #${courier.courier_id.substring(0, 8)}`}
                        size="large"
                        variant="rounded"
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          border: '2px solid white',
                        }}
                      >
                        #{index + 1}
                      </Box>
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        Courier #{courier.courier_id.substring(0, 8)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {courier.location_area}
                      </Typography>
                    </Box>
                    <Chip
                      label={Number(courier.trust_score || 0).toFixed(1)}
                      color={getTrustScoreColor(Number(courier.trust_score || 0))}
                      size="small"
                      icon={<StarIcon />}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Rating</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {Number(courier.avg_rating || 0).toFixed(1)} / 5.0
                      </Typography>
                    </Box>
                    <Rating value={courier.avg_rating} readOnly size="small" precision={0.1} />
                    <Typography variant="caption" color="text.secondary">
                      ({courier.total_reviews} reviews)
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Success Rate</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {getSuccessRate(courier)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={getSuccessRate(courier)}
                      color={getSuccessRate(courier) >= 90 ? 'success' : 'primary'}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Deliveries
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {courier.total_deliveries}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Tier
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {courier.subscription_tier}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};
