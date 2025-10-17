import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Star as RatingIcon,
  TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Line, Doughnut } from 'react-chartjs-2';
import { useAuthStore } from '@/store/authStore';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color = 'primary' }) => {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}.light`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface PerformanceBarProps {
  label: string;
  value: number;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const PerformanceBar: React.FC<PerformanceBarProps> = ({ label, value, color }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="bold">
          {value.toFixed(1)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{ height: 8, borderRadius: 1 }}
      />
    </Box>
  );
};

export const CourierAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const courierId = user?.user_id; // Simplified - should get actual courier_id

  // Fetch courier analytics
  const { data: courierData, isLoading, error } = useQuery({
    queryKey: ['courier-analytics', courierId],
    queryFn: async () => {
      if (!courierId) return null;
      const response = await apiClient.get(`/analytics/courier?courier_id=${courierId}`);
      return response.data.data;
    },
    enabled: !!courierId,
  });

  const { summary, trends, statusBreakdown, performanceMetrics } = courierData || {};

  // Prepare trend chart
  const trendChartData = {
    labels: trends?.map((t: any) => new Date(t.order_date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Total Orders',
        data: trends?.map((t: any) => t.order_count) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Delivered',
        data: trends?.map((t: any) => t.delivered_count) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Order Trends (Last 30 Days)',
      },
    },
  };

  // Prepare status breakdown chart
  const statusChartData = {
    labels: ['Delivered', 'In Transit', 'Pending', 'Cancelled'],
    datasets: [
      {
        data: [
          statusBreakdown?.delivered || 0,
          statusBreakdown?.in_transit || 0,
          statusBreakdown?.pending || 0,
          statusBreakdown?.cancelled || 0,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load courier analytics. Please try again.</Alert>
      </Box>
    );
  }

  if (!summary) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No analytics data available yet.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🚚 Courier Performance
      </Typography>

      <Grid container spacing={3}>
        {/* Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={summary.total_orders?.toLocaleString() || '0'}
            subtitle={`${summary.delivered_orders || 0} delivered`}
            icon={<DeliveryIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Completion Rate"
            value={`${summary.completion_rate?.toFixed(1) || '0'}%`}
            subtitle={`${summary.in_transit_orders || 0} in transit`}
            icon={<CompletedIcon color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Average Rating"
            value={summary.avg_rating?.toFixed(2) || '0.00'}
            subtitle={`${summary.total_reviews || 0} reviews`}
            icon={<RatingIcon color="warning" />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Trust Score"
            value={summary.trust_score?.toFixed(1) || '0'}
            subtitle={`${summary.customer_count || 0} customers`}
            icon={<TrendIcon color="info" />}
            color="info"
          />
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Box sx={{ mt: 2 }}>
                <PerformanceBar
                  label="Completion Rate"
                  value={performanceMetrics?.completion_rate || 0}
                  color="success"
                />
                <PerformanceBar
                  label="On-Time Rate"
                  value={performanceMetrics?.on_time_rate || 0}
                  color="primary"
                />
                <PerformanceBar
                  label="Trust Score"
                  value={performanceMetrics?.trust_score || 0}
                  color="info"
                />
              </Box>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Average Delivery Time
                </Typography>
                <Typography variant="h5">
                  {summary.avg_delivery_days?.toFixed(1) || '0'} days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Breakdown
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={statusChartData} />
              </Box>
              <Grid container spacing={1} sx={{ mt: 2 }}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h6">{statusBreakdown?.delivered || 0}</Typography>
                    <Typography variant="caption">Delivered</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="h6">{statusBreakdown?.in_transit || 0}</Typography>
                    <Typography variant="caption">In Transit</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                    <Typography variant="h6">{statusBreakdown?.pending || 0}</Typography>
                    <Typography variant="caption">Pending</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="h6">{statusBreakdown?.cancelled || 0}</Typography>
                    <Typography variant="caption">Cancelled</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Line data={trendChartData} options={trendChartOptions} />
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Order
                    </Typography>
                    <Typography variant="body1">
                      {summary.last_order_date
                        ? new Date(summary.last_order_date).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Review
                    </Typography>
                    <Typography variant="body1">
                      {summary.last_review_date
                        ? new Date(summary.last_review_date).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Last Calculated
                    </Typography>
                    <Typography variant="body1">
                      {summary.last_calculated
                        ? new Date(summary.last_calculated).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourierAnalytics;
