/**
 * Performance By Location Component
 * Week 2 Day 4 - Performance Limits Integration
 * 
 * Displays courier performance data by location with subscription-based access control
 * Created: November 6, 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid
} from '@mui/material';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';

interface PerformanceData {
  courierId: string;
  courierName: string;
  postalCode: string;
  city: string;
  country: string;
  displayCount: number;
  selectionCount: number;
  selectionRate: number;
}

interface Limits {
  maxCountries: number;
  maxDays: number;
  maxRows: number;
  appliedLimits?: {
    country: string;
    daysBack: number;
    rowsReturned: number;
  };
}

interface SubscriptionInfo {
  hasAccess: boolean;
  reason: string;
}

export const PerformanceByLocation: React.FC = () => {
  const { user, tokens } = useAuthStore();
  const [country, setCountry] = useState('NO');
  const [daysBack, setDaysBack] = useState(30);
  const [data, setData] = useState<PerformanceData[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>('Starter');

  const countries = [
    { code: 'NO', name: 'Norway' },
    { code: 'SE', name: 'Sweden' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setAccessDenied(false);

    try {
      // Use apiClient which handles auth automatically
      const response = await apiClient.get('/analytics/performance-by-location', {
        params: {
          country,
          daysBack
        }
      });

      // Success - set data
      setData(response.data.data || []);
      setLimits(response.data.limits);
      setSubscription(response.data.subscription);
      setAccessDenied(false);
    } catch (err: any) {
      // Handle 403 (access denied) separately
      if (err.response?.status === 403) {
        const errorData = err.response.data;
        setAccessDenied(true);
        setUpgradeMessage(errorData.reason);
        setLimits(errorData.limits);
        setCurrentPlan(errorData.currentPlan || 'Starter');
        setData([]);
      } else {
        setError(err.response?.data?.error || err.message || 'Failed to load performance data');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [country, daysBack, user]);

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Performance by Location
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Analyze courier performance across different postal codes and cities
          </Typography>

          {/* Filters */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Country</InputLabel>
                <Select
                  value={country}
                  label="Country"
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={loading}
                >
                  {countries.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={daysBack}
                  label="Time Range"
                  onChange={(e) => setDaysBack(Number(e.target.value))}
                  disabled={loading}
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                  <MenuItem value={365}>Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Subscription Limits Info */}
          {limits && !accessDenied && subscription?.hasAccess && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Your plan includes:
                </Typography>
                <Chip 
                  label={`${limits.maxCountries} countries`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${limits.maxDays} days history`} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={`${limits.maxRows} rows max`} 
                  size="small" 
                  color="primary" 
                />
                {limits.appliedLimits && (
                  <Chip 
                    label={`Showing ${limits.appliedLimits.rowsReturned} results`} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
              </Box>
            </Alert>
          )}

          {/* Access Denied - Upgrade Prompt */}
          {accessDenied && (
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  variant="outlined"
                  href="/subscription-plans"
                >
                  Upgrade Now
                </Button>
              }
            >
              <Typography variant="subtitle2" gutterBottom>
                🔒 Subscription Limit Reached
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {upgradeMessage}
              </Typography>
              {limits && (
                <Box mt={1}>
                  <Typography variant="caption" display="block">
                    <strong>Current Plan:</strong> {currentPlan}
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>Your limits:</strong> {limits.maxCountries} countries, {limits.maxDays} days history
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    💡 Upgrade to Professional or Enterprise for expanded access
                  </Typography>
                </Box>
              )}
            </Alert>
          )}

          {/* Loading */}
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Loading performance data...
              </Typography>
            </Box>
          )}

          {/* Error */}
          {error && !accessDenied && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Data Display - Table */}
          {!loading && !error && !accessDenied && data.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Courier</strong></TableCell>
                    <TableCell><strong>Postal Code</strong></TableCell>
                    <TableCell><strong>City</strong></TableCell>
                    <TableCell align="right"><strong>Displays</strong></TableCell>
                    <TableCell align="right"><strong>Selections</strong></TableCell>
                    <TableCell align="right"><strong>Selection Rate</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={`${row.courierId}-${row.postalCode}-${index}`}>
                      <TableCell>{row.courierName}</TableCell>
                      <TableCell>{row.postalCode}</TableCell>
                      <TableCell>{row.city}</TableCell>
                      <TableCell align="right">{row.displayCount}</TableCell>
                      <TableCell align="right">{row.selectionCount}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`${row.selectionRate}%`}
                          color={row.selectionRate >= 50 ? 'success' : row.selectionRate >= 25 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* No Data */}
          {!loading && !error && !accessDenied && data.length === 0 && (
            <Alert severity="info">
              No performance data available for the selected filters. Try selecting a different country or time range.
            </Alert>
          )}

          {/* Summary Stats */}
          {!loading && !error && !accessDenied && data.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Locations
                  </Typography>
                  <Typography variant="h6">
                    {data.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Displays
                  </Typography>
                  <Typography variant="h6">
                    {data.reduce((sum, row) => sum + row.displayCount, 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Selections
                  </Typography>
                  <Typography variant="h6">
                    {data.reduce((sum, row) => sum + row.selectionCount, 0)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Avg Selection Rate
                  </Typography>
                  <Typography variant="h6">
                    {(data.reduce((sum, row) => sum + row.selectionRate, 0) / data.length).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PerformanceByLocation;
