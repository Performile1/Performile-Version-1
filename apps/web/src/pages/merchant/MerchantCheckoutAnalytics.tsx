import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  LocalShipping,
  AttachMoney,
  ShoppingCart,
  CheckCircle,
  Star,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { CourierLogo } from '@/components/courier/CourierLogo';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B9D'];

export const MerchantCheckoutAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch merchant checkout analytics
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['merchant-checkout-analytics', user?.user_id, timeRange],
    queryFn: async () => {
      const response = await apiClient.get(`/merchant/checkout-analytics?timeRange=${timeRange}`);
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          <Typography variant="h6" gutterBottom>No Checkout Data Yet</Typography>
          <Typography variant="body2">
            Install the Performile plugin on your e-commerce store to start tracking courier selections in checkout.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Available for:</strong> Shopify, WooCommerce, and more coming soon!
          </Typography>
        </Alert>
      </Box>
    );
  }

  const { summary, courierPerformance, trends, recentCheckouts } = analyticsData;

  // Prepare courier selection data for pie chart
  const courierSelectionData = courierPerformance?.map((courier: any) => ({
    name: courier.courier_name,
    value: parseInt(courier.times_selected),
  })) || [];

  // Prepare trend data for line chart
  const trendData = trends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    checkouts: parseInt(item.total_checkouts),
    selections: parseInt(item.total_selections),
    avgOrderValue: parseFloat(item.avg_order_value),
  })) || [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            🛒 Checkout Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track courier selections and checkout performance
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ShoppingCart sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Total Checkouts
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.total_checkouts || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Courier displays
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Selection Rate
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.selection_rate || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary?.total_selections || 0} couriers selected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AttachMoney sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Order Value
                </Typography>
              </Box>
              <Typography variant="h4">
                ${summary?.avg_order_value || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per checkout
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalShipping sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Unique Couriers
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.unique_couriers || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Shown in checkout
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Courier Selection Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Courier Selection Distribution
              </Typography>
              {courierSelectionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={courierSelectionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {courierSelectionData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No courier selections yet</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Checkout Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Checkout Trends
              </Typography>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="checkouts" stroke="#8884d8" name="Checkouts" />
                    <Line type="monotone" dataKey="selections" stroke="#82ca9d" name="Selections" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Alert severity="info">No trend data yet</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Courier Performance Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Courier Performance
          </Typography>
          {courierPerformance && courierPerformance.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Courier</TableCell>
                    <TableCell align="right">Shown</TableCell>
                    <TableCell align="right">Selected</TableCell>
                    <TableCell align="right">Selection Rate</TableCell>
                    <TableCell align="right">Avg Position</TableCell>
                    <TableCell align="right">Avg Order Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {courierPerformance.map((courier: any) => (
                    <TableRow key={courier.courier_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CourierLogo
                            courierCode={courier.courier_code || courier.courier_name}
                            courierName={courier.courier_name}
                            size="small"
                            variant="rounded"
                            showName={false}
                          />
                          <Typography variant="body2">{courier.courier_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{courier.total_appearances}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={courier.times_selected} 
                          size="small" 
                          color="success"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          {courier.selection_rate}%
                          <LinearProgress 
                            variant="determinate" 
                            value={parseFloat(courier.selection_rate)} 
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={`#${courier.avg_position}`} 
                          size="small" 
                          color={parseFloat(courier.avg_position) <= 2 ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">${courier.avg_order_value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No courier performance data yet</Alert>
          )}
        </CardContent>
      </Card>

      {/* Recent Checkouts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Checkouts
          </Typography>
          {recentCheckouts && recentCheckouts.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Courier</TableCell>
                    <TableCell align="right">Position</TableCell>
                    <TableCell align="right">Selected</TableCell>
                    <TableCell align="right">Order Value</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentCheckouts.map((checkout: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(checkout.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{checkout.courier_name}</TableCell>
                      <TableCell align="right">
                        <Chip label={`#${checkout.position_shown}`} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {checkout.was_selected ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        ${checkout.order_value || 0}
                      </TableCell>
                      <TableCell>
                        {checkout.delivery_city}, {checkout.delivery_country}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No recent checkouts yet</Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MerchantCheckoutAnalytics;
