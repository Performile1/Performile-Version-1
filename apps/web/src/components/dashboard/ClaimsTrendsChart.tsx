/**
 * ClaimsTrendsChart Component
 * Displays claims trends over time by status
 * 
 * Phase: Dashboard Analytics Enhancement - Phase 1.3
 * Created: October 18, 2025, 6:54 PM
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
  Warning,
  CheckCircle,
  Cancel,
  Schedule,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface ClaimsTrendsChartProps {
  entityType: 'courier' | 'merchant';
  entityId?: string;
  subscriptionTier?: string;
}

interface ClaimTrendData {
  date: string;
  total_claims: number;
  open_claims: number;
  in_review_claims: number;
  approved_claims: number;
  declined_claims: number;
  closed_claims: number;
  avg_resolution_days: number;
}

export const ClaimsTrendsChart: React.FC<ClaimsTrendsChartProps> = ({
  entityType,
  entityId,
  subscriptionTier = 'tier1',
}) => {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<string>('30d');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

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

  // Fetch claims trends data
  const { data: trendsData, isLoading, error } = useQuery({
    queryKey: ['claims-trends', entityType, entityId || user?.user_id, period],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/claims-trends', {
        params: {
          entity_type: entityType,
          entity_id: entityId || user?.user_id,
          period,
        },
      });
      return response.data.data as ClaimTrendData[];
    },
    enabled: !!user,
  });

  // Calculate summary statistics
  const calculateSummary = () => {
    if (!trendsData || trendsData.length === 0) {
      return {
        totalClaims: 0,
        openClaims: 0,
        resolvedClaims: 0,
        avgResolutionDays: 0,
        claimRate: 0,
      };
    }

    const totalClaims = trendsData.reduce((sum, day) => sum + day.total_claims, 0);
    const openClaims = trendsData.reduce((sum, day) => sum + day.open_claims, 0);
    const approvedClaims = trendsData.reduce((sum, day) => sum + day.approved_claims, 0);
    const declinedClaims = trendsData.reduce((sum, day) => sum + day.declined_claims, 0);
    const closedClaims = trendsData.reduce((sum, day) => sum + day.closed_claims, 0);
    const resolvedClaims = approvedClaims + declinedClaims + closedClaims;

    const avgResolutionDays = trendsData
      .filter(day => day.avg_resolution_days > 0)
      .reduce((sum, day) => sum + day.avg_resolution_days, 0) / 
      trendsData.filter(day => day.avg_resolution_days > 0).length || 0;

    return {
      totalClaims,
      openClaims,
      resolvedClaims,
      avgResolutionDays: Math.round(avgResolutionDays * 10) / 10,
      claimRate: 0, // Would need order data to calculate
    };
  };

  const summary = calculateSummary();

  // Format data for chart
  const chartData = trendsData?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Open: item.open_claims,
    'In Review': item.in_review_claims,
    Approved: item.approved_claims,
    Declined: item.declined_claims,
    Closed: item.closed_claims,
    Total: item.total_claims,
  })) || [];

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
            Failed to load claims trends. Please try again later.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              ⚠️ Claims Trends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor claims and resolution performance
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={chartType}
                label="Type"
                onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
              >
                <MenuItem value="bar">Bar</MenuItem>
                <MenuItem value="line">Line</MenuItem>
              </Select>
            </FormControl>
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
          </Stack>
        </Box>

        {/* Summary Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Warning sx={{ color: 'warning.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {summary.totalClaims}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Claims
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Schedule sx={{ color: 'info.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {summary.openClaims}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Open Claims
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle sx={{ color: 'success.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {summary.resolvedClaims}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Resolved
              </Typography>
            </Box>
          </Box>

          {subscriptionTier !== 'tier1' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" fontWeight="bold">
                {summary.avgResolutionDays}d
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Resolution
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Chart */}
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
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
                <Bar dataKey="Open" fill="#ffc658" stackId="a" />
                <Bar dataKey="In Review" fill="#8884d8" stackId="a" />
                <Bar dataKey="Approved" fill="#82ca9d" stackId="a" />
                {subscriptionTier !== 'tier1' && (
                  <>
                    <Bar dataKey="Declined" fill="#ff8042" stackId="a" />
                    <Bar dataKey="Closed" fill="#999999" stackId="a" />
                  </>
                )}
              </BarChart>
            ) : (
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
                <Line type="monotone" dataKey="Total" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Open" stroke="#ffc658" strokeWidth={2} />
                <Line type="monotone" dataKey="Approved" stroke="#82ca9d" strokeWidth={2} />
                {subscriptionTier !== 'tier1' && (
                  <>
                    <Line type="monotone" dataKey="Declined" stroke="#ff8042" strokeWidth={1} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="Closed" stroke="#999999" strokeWidth={1} strokeDasharray="5 5" />
                  </>
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>

        {/* Status Legend */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
          <Chip label="🟡 Open" size="small" variant="outlined" />
          <Chip label="🔵 In Review" size="small" variant="outlined" />
          <Chip label="🟢 Approved" size="small" variant="outlined" />
          {subscriptionTier !== 'tier1' && (
            <>
              <Chip label="🔴 Declined" size="small" variant="outlined" />
              <Chip label="⚫ Closed" size="small" variant="outlined" />
            </>
          )}
        </Stack>

        {/* Tier Upgrade Notice */}
        {subscriptionTier === 'tier1' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Upgrade to Pro</strong> to view declined/closed claims and resolution time metrics.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ClaimsTrendsChart;
