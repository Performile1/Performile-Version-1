import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  Store as StoreIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color = 'primary' }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

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
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {isPositive && <TrendingUpIcon color="success" fontSize="small" />}
                {isNegative && <TrendingDownIcon color="error" fontSize="small" />}
                <Typography
                  variant="body2"
                  color={isPositive ? 'success.main' : isNegative ? 'error.main' : 'text.secondary'}
                  sx={{ ml: 0.5 }}
                >
                  {change > 0 ? '+' : ''}{change}%
                </Typography>
              </Box>
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

export const AdminAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState(30);

  // Fetch platform analytics
  const { data: platformData, isLoading, error } = useQuery({
    queryKey: ['platform-analytics', period],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics/platform?period=${period}`);
      return response.data.data;
    },
  });

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
        <Alert severity="error">Failed to load analytics data. Please try again.</Alert>
      </Box>
    );
  }

  const { summary, trends, topCouriers } = platformData || {};

  // Prepare chart data
  const chartData = {
    labels: trends?.map((t: any) => new Date(t.metric_date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Total Orders',
        data: trends?.map((t: any) => t.total_orders) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Delivered Orders',
        data: trends?.map((t: any) => t.delivered_orders) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Order Trends (Last ${period} Days)`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 Analytics Dashboard
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="Platform Overview" />
        <Tab label="Top Performers" />
        <Tab label="Trends" />
      </Tabs>

      {/* Tab 1: Platform Overview */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Metrics Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Orders"
                value={summary?.total_orders?.toLocaleString() || '0'}
                change={summary?.orders_growth}
                icon={<AssessmentIcon color="primary" />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Couriers"
                value={summary?.active_couriers?.toLocaleString() || '0'}
                icon={<ShippingIcon color="success" />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Stores"
                value={summary?.active_stores?.toLocaleString() || '0'}
                icon={<StoreIcon color="info" />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Average Rating"
                value={summary?.avg_rating?.toFixed(2) || '0.00'}
                change={summary?.rating_growth}
                icon={<StarIcon color="warning" />}
                color="warning"
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
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Completion Rate
                      </Typography>
                      <Typography variant="h5">
                        {summary?.avg_completion_rate?.toFixed(1) || '0'}%
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        On-Time Rate
                      </Typography>
                      <Typography variant="h5">
                        {summary?.avg_on_time_rate?.toFixed(1) || '0'}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Trust Score
                      </Typography>
                      <Typography variant="h5">
                        {summary?.avg_trust_score?.toFixed(1) || '0'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Order Status Breakdown */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Status
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Delivered</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {summary?.delivered_orders?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">In Transit</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {summary?.in_transit_orders?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Pending</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {summary?.pending_orders?.toLocaleString() || '0'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Tab 2: Top Performers */}
      {activeTab === 1 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Top Performing Couriers
              </Typography>
              <Box sx={{ mt: 2 }}>
                {topCouriers?.map((courier: any, index: number) => (
                  <Box
                    key={courier.courier_id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      mb: 1,
                      bgcolor: index < 3 ? 'action.hover' : 'transparent',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" color="text.secondary">
                        #{index + 1}
                      </Typography>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {courier.courier_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {courier.total_orders} orders • {courier.completion_rate?.toFixed(1)}% completion
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <StarIcon color="warning" fontSize="small" />
                        <Typography variant="body1" fontWeight="bold">
                          {courier.avg_rating?.toFixed(2)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Trust: {courier.trust_score?.toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 3: Trends */}
      {activeTab === 2 && (
        <Box>
          <Card>
            <CardContent>
              <Line data={chartData} options={chartOptions} />
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AdminAnalytics;
