import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  LocalShipping as DeliveryIcon,
  Star as RatingIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement } from 'chart.js';
import { PerformanceByLocation } from '@/components/analytics/PerformanceByLocation';

ChartJS.register(ArcElement);

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

export const MerchantAnalytics: React.FC = () => {
  const [shopId, setShopId] = useState('');
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);

  // Fetch shop analytics
  const { data: shopData, isLoading, error } = useQuery({
    queryKey: ['shop-analytics', shopId, period, days],
    queryFn: async () => {
      if (!shopId) return null;
      const response = await apiClient.get(
        `/analytics/shop?shop_id=${shopId}&period=${period}&days=${days}`
      );
      return response.data.data;
    },
    enabled: !!shopId,
  });

  const { summary, trends, deliveryBreakdown } = shopData || {};

  // Prepare trend chart data
  const trendChartData = {
    labels: trends?.map((t: any) => new Date(t.snapshot_date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Revenue',
        data: trends?.map((t: any) => t.total_revenue) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Orders',
        data: trends?.map((t: any) => t.total_orders) || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Revenue & Orders Trend',
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Revenue',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Orders',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Prepare delivery method chart
  const deliveryChartData = {
    labels: ['Home Delivery', 'Parcel Shop', 'Parcel Locker'],
    datasets: [
      {
        data: [
          deliveryBreakdown?.home_delivery || 0,
          deliveryBreakdown?.parcel_shop || 0,
          deliveryBreakdown?.parcel_locker || 0,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (!shopId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          📊 Shop Analytics
        </Typography>
        <Alert severity="info">
          Please select a shop to view analytics.
        </Alert>
      </Box>
    );
  }

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
        <Alert severity="error">Failed to load shop analytics. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📊 Shop Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)} label="Period">
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Days</InputLabel>
            <Select value={days} onChange={(e) => setDays(Number(e.target.value))} label="Days">
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Metrics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Orders"
            value={summary?.total_orders?.toLocaleString() || '0'}
            subtitle={`${summary?.completed_orders || 0} completed`}
            icon={<OrdersIcon color="primary" />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Revenue"
            value={`$${summary?.total_revenue?.toLocaleString() || '0'}`}
            subtitle={`Avg: $${summary?.average_order_value?.toFixed(2) || '0'}`}
            icon={<RevenueIcon color="success" />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="On-Time Rate"
            value={`${summary?.on_time_delivery_rate?.toFixed(1) || '0'}%`}
            subtitle={`${summary?.average_delivery_time_hours?.toFixed(1) || '0'} hrs avg`}
            icon={<DeliveryIcon color="info" />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Satisfaction"
            value={summary?.customer_satisfaction_score?.toFixed(2) || '0.00'}
            subtitle={`Completion: ${summary?.completion_rate || '0'}%`}
            icon={<RatingIcon color="warning" />}
            color="warning"
          />
        </Grid>

        {/* Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Line data={trendChartData} options={trendChartOptions} />
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Method Breakdown */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Delivery Methods
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Doughnut data={deliveryChartData} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Home Delivery</Typography>
                  <Chip label={deliveryBreakdown?.home_delivery || 0} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Parcel Shop</Typography>
                  <Chip label={deliveryBreakdown?.parcel_shop || 0} size="small" color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Parcel Locker</Typography>
                  <Chip label={deliveryBreakdown?.parcel_locker || 0} size="small" color="info" />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Overview
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="h4">{summary?.completed_orders || 0}</Typography>
                    <Typography variant="body2">Completed</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="h4">{summary?.pending_orders || 0}</Typography>
                    <Typography variant="body2">Pending</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="h4">{summary?.cancelled_orders || 0}</Typography>
                    <Typography variant="body2">Cancelled</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.300', borderRadius: 1 }}>
                    <Typography variant="h4">{summary?.courier_count || 0}</Typography>
                    <Typography variant="body2">Couriers Used</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance by Location */}
        <Grid item xs={12}>
          <PerformanceByLocation />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MerchantAnalytics;
