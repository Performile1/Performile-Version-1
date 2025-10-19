/**
 * OrderTrendsChart Component
 * Displays order trends over time with multiple series
 * 
 * Phase: Dashboard Analytics Enhancement - Phase 1.2
 * Created: October 18, 2025, 6:52 PM
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  LocalShipping,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface OrderTrendsChartProps {
  entityType: 'courier' | 'merchant';
  entityId?: string;
  subscriptionTier?: string;
}

interface OrderTrendData {
  date: string;
  total_orders: number;
  delivered_orders: number;
  in_transit_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  avg_order_value: number;
}

export const OrderTrendsChart: React.FC<OrderTrendsChartProps> = ({
  entityType,
  entityId,
  subscriptionTier = 'tier1',
}) => {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<string>('30d');

  // Determine available periods based on subscription tier
  const getAvailablePeriods = () => {
    switch (subscriptionTier) {
      case 'tier1':
        return [{ value: '7d', label: 'Last 7 Days' }];
      case 'tier2':
        return [
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
        ];
      case 'tier3':
        return [
          { value: '7d', label: 'Last 7 Days' },
          { value: '30d', label: 'Last 30 Days' },
          { value: '90d', label: 'Last 90 Days' },
          { value: '1y', label: 'Last Year' },
        ];
      default:
        return [{ value: '7d', label: 'Last 7 Days' }];
    }
  };

  const availablePeriods = getAvailablePeriods();

  // Fetch order trends data
  const { data: trendsData, isLoading, error } = useQuery({
    queryKey: ['order-trends', entityType, entityId || user?.user_id, period],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/order-trends', {
        params: {
          entity_type: entityType,
          entity_id: entityId || user?.user_id,
          period,
        },
      });
      return response.data.data as OrderTrendData[];
    },
    enabled: !!user,
  });

  // Early return for loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load order trends. Please try again later.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics (only after data is loaded and validated)
  const calculateSummary = () => {
    if (!trendsData || trendsData.length === 0) {
      return {
        totalOrders: 0,
        deliveredOrders: 0,
        growthRate: 0,
        avgOrderValue: 0,
      };
    }

    const totalOrders = trendsData.reduce((sum, day) => sum + day.total_orders, 0);
    const deliveredOrders = trendsData.reduce((sum, day) => sum + day.delivered_orders, 0);
    const avgOrderValue = trendsData.reduce((sum, day) => sum + day.avg_order_value, 0) / trendsData.length;

    // Calculate growth rate (compare first half vs second half)
    const midPoint = Math.floor(trendsData.length / 2);
    const firstHalf = trendsData.slice(0, midPoint);
    const secondHalf = trendsData.slice(midPoint);
    
    const firstHalfTotal = firstHalf.reduce((sum, day) => sum + day.total_orders, 0);
    const secondHalfTotal = secondHalf.reduce((sum, day) => sum + day.total_orders, 0);
    
    const growthRate = firstHalfTotal > 0 
      ? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100 
      : 0;

    return {
      totalOrders,
      deliveredOrders,
      growthRate: Math.round(growthRate * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    };
  };

  const summary = calculateSummary();

  // Format data for chart
  const chartData = trendsData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Total: item.total_orders,
    Delivered: item.delivered_orders,
    'In Transit': item.in_transit_orders,
    Pending: item.pending_orders,
    Cancelled: item.cancelled_orders,
  })) || [];

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              📦 Order Trends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your order volume and status over time
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              {availablePeriods.map(p => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Summary Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShipping sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {summary.totalOrders}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Orders
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: 'success.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {summary.deliveredOrders}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Delivered
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {summary.growthRate >= 0 ? (
              <TrendingUp sx={{ color: 'success.main' }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main' }} />
            )}
            <Box>
              <Typography variant="h5" fontWeight="bold" color={summary.growthRate >= 0 ? 'success.main' : 'error.main'}>
                {summary.growthRate > 0 ? '+' : ''}{summary.growthRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Growth Rate
              </Typography>
            </Box>
          </Box>

          {subscriptionTier !== 'tier1' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                ${summary.avgOrderValue}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Order Value
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Chart */}
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Delivered" 
                stroke="#82ca9d" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="In Transit" 
                stroke="#ffc658" 
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              {subscriptionTier !== 'tier1' && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="Pending" 
                    stroke="#ff8042" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Cancelled" 
                    stroke="#d32f2f" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Tier Upgrade Notice */}
        {subscriptionTier === 'tier1' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Upgrade to Pro</strong> to view 30-day trends, cancelled orders, and average order value.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTrendsChart;
