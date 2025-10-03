import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Search,
  Star,
  TrendingUp,
  TrendingDown,
  LocalShipping,
  Schedule,
  CheckCircle,
  ThumbUp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface CourierTrustScore {
  courier_id: string;
  courier_name: string;
  trust_score: number;
  performance_grade: string;
  rating: number;
  completion_rate: number;
  on_time_rate: number;
  response_time: number;
  customer_satisfaction: number;
  total_orders: number;
  total_reviews: number;
  last_updated: string;
}

export const TrustScores: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourier, setSelectedCourier] = useState<CourierTrustScore | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: trustScoresData, isLoading } = useQuery({
    queryKey: ['trust-scores', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiClient.get(`/trustscore?${params.toString()}`);
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const couriers = trustScoresData?.data || [];

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A+': return 'success';
      case 'A': return 'success';
      case 'B+': return 'info';
      case 'B': return 'info';
      case 'C+': return 'warning';
      case 'C': return 'warning';
      default: return 'error';
    }
  };

  const getTrendIcon = (score: number) => {
    if (score >= 80) return <TrendingUp color="success" />;
    if (score >= 60) return <TrendingUp color="warning" />;
    return <TrendingDown color="error" />;
  };

  const handleViewDetails = (courier: CourierTrustScore) => {
    setSelectedCourier(courier);
    setDetailsOpen(true);
  };

  const MetricCard: React.FC<{ label: string; value: number; suffix?: string; icon: React.ReactNode }> = ({
    label,
    value,
    suffix = '',
    icon,
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
            {icon}
          </Avatar>
          <Typography variant="h6" component="div">
            {value.toFixed(1)}{suffix}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={suffix === '%' ? value : (value / 5) * 100}
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Trust Scores
        </Typography>
        <LinearProgress sx={{ mb: 4 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Trust Scores
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor and compare courier performance metrics and trust scores.
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search couriers by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Couriers Grid */}
      <Grid container spacing={3}>
        {couriers.map((courier: CourierTrustScore) => (
          <Grid item xs={12} sm={6} md={4} key={courier.courier_id}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => handleViewDetails(courier)}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    <LocalShipping />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      {courier.courier_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={courier.performance_grade || 'N/A'}
                        color={getGradeColor(courier.performance_grade) as any}
                        size="small"
                      />
                      {getTrendIcon(courier.trust_score)}
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Trust Score</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {courier.trust_score?.toFixed(1) || '0.0'}/100
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={courier.trust_score || 0}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Rating</Typography>
                  <Typography variant="caption">
                    {courier.rating?.toFixed(1) || '0.0'}/5 ⭐
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">On-Time Rate</Typography>
                  <Typography variant="caption">
                    {courier.on_time_rate?.toFixed(1) || '0'}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="caption">Completion Rate</Typography>
                  <Typography variant="caption">
                    {courier.completion_rate?.toFixed(1) || '0'}%
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  {courier.total_orders || 0} orders • {courier.total_reviews || 0} reviews
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed View Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <LocalShipping />
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedCourier?.courier_name}
              </Typography>
              <Chip
                label={selectedCourier?.performance_grade || 'N/A'}
                color={getGradeColor(selectedCourier?.performance_grade || '') as any}
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedCourier && (
            <Box>
              {/* Overall Trust Score */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" color="primary" gutterBottom>
                  {selectedCourier.trust_score?.toFixed(1) || '0.0'}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Trust Score out of 100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={selectedCourier.trust_score || 0}
                  sx={{ mt: 2, height: 12, borderRadius: 6 }}
                />
              </Box>

              {/* Metrics Grid */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                  <MetricCard
                    label="Rating"
                    value={selectedCourier.rating || 0}
                    suffix="/5"
                    icon={<Star />}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <MetricCard
                    label="On-Time Rate"
                    value={selectedCourier.on_time_rate || 0}
                    suffix="%"
                    icon={<Schedule />}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <MetricCard
                    label="Completion Rate"
                    value={selectedCourier.completion_rate || 0}
                    suffix="%"
                    icon={<CheckCircle />}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <MetricCard
                    label="Customer Satisfaction"
                    value={selectedCourier.customer_satisfaction || 0}
                    suffix="/5"
                    icon={<ThumbUp />}
                  />
                </Grid>
              </Grid>

              {/* Performance Summary */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell align="right">Value</TableCell>
                      <TableCell align="right">Industry Avg</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Response Time</TableCell>
                      <TableCell align="right">
                        {selectedCourier.response_time?.toFixed(1) || '0'} min
                      </TableCell>
                      <TableCell align="right">15.2 min</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Orders</TableCell>
                      <TableCell align="right">
                        {selectedCourier.total_orders?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell align="right">1,247</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Reviews</TableCell>
                      <TableCell align="right">
                        {selectedCourier.total_reviews?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell align="right">892</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Last Updated</TableCell>
                      <TableCell align="right" colSpan={2}>
                        {selectedCourier.last_updated
                          ? new Date(selectedCourier.last_updated).toLocaleString()
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {user?.user_role === 'merchant' && (
            <Button variant="contained" onClick={() => setDetailsOpen(false)}>
              Select Courier
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
