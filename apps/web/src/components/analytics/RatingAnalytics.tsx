import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Email,
  CheckCircle,
  Schedule,
  TrendingUp,
  Store,
  Home,
  Lock,
  LocationOn,
  Business
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '@/services/apiClient';

interface RatingStats {
  overall: {
    total_requests: number;
    responses_received: number;
    auto_processed: number;
    expired: number;
    response_rate: number;
  };
  byPlatform: Array<{
    integration_platform: string;
    requests: number;
    responses: number;
    response_rate: number;
  }>;
}

interface ServicePerformance {
  courier_id: string;
  courier_name: string;
  service_type: string;
  total_orders: number;
  avg_rating: number;
  avg_service_rating: number;
  service_accuracy_rate: number;
  accurate_deliveries: number;
  service_substitutions: number;
  avg_delivery_hours: number;
}

const serviceIcons = {
  home_delivery: <Home />,
  parcelshop: <Store />,
  parcellocker: <Lock />,
  pickup_point: <LocationOn />,
  office_delivery: <Business />
};

const serviceLabels = {
  home_delivery: 'Home Delivery',
  parcelshop: 'Parcel Shop',
  parcellocker: 'Parcel Locker',
  pickup_point: 'Pickup Point',
  office_delivery: 'Office Delivery'
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const RatingAnalytics: React.FC = () => {
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [servicePerformance, setServicePerformance] = useState<ServicePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.get('/rating/analytics'); 
      setRatingStats(response.data.ratingAnalytics);
      setServicePerformance(response.data.servicePerformance);
    } catch (err: any) {
      setError('Failed to load rating analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const responseData = ratingStats?.byPlatform.map(platform => ({
    name: platform.integration_platform || 'Direct',
    requests: platform.requests,
    responses: platform.responses,
    rate: platform.response_rate
  })) || [];

  const serviceTypeData = servicePerformance.reduce((acc, service) => {
    const existing = acc.find(item => item.service_type === service.service_type);
    if (existing) {
      existing.total_orders += service.total_orders;
      existing.avg_rating = (existing.avg_rating + service.avg_rating) / 2;
    } else {
      acc.push({
        service_type: service.service_type,
        total_orders: service.total_orders,
        avg_rating: service.avg_rating,
        accuracy_rate: service.service_accuracy_rate
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Rating Request Analytics
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Email color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{ratingStats?.overall.total_requests || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Requests Sent
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{ratingStats?.overall.responses_received || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Responses Received
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Schedule color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{ratingStats?.overall.auto_processed || 0}</Typography>
              <Typography variant="body2" color="text.secondary">
                Auto-Processed (70%)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4">{ratingStats?.overall.response_rate || 0}%</Typography>
              <Typography variant="body2" color="text.secondary">
                Response Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Response Rate by Platform */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Rate by Platform
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={responseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Type Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Type Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_orders"
                    label={({ service_type, total_orders }) => 
                      `${serviceLabels[service_type as keyof typeof serviceLabels]} (${total_orders})`
                    }
                  >
                    {serviceTypeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Platform Statistics Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integration Platform Statistics
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Platform</TableCell>
                      <TableCell align="right">Requests Sent</TableCell>
                      <TableCell align="right">Responses</TableCell>
                      <TableCell align="right">Response Rate</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ratingStats?.byPlatform.map((platform) => (
                      <TableRow key={platform.integration_platform}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Email fontSize="small" />
                            {platform.integration_platform || 'Direct Email'}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{platform.requests}</TableCell>
                        <TableCell align="right">{platform.responses}</TableCell>
                        <TableCell align="right">{platform.response_rate}%</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={platform.response_rate >= 30 ? 'Good' : 'Needs Improvement'}
                            color={platform.response_rate >= 30 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Service Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Courier Service Performance
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Courier</TableCell>
                      <TableCell>Service Type</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Avg Rating</TableCell>
                      <TableCell align="right">Service Rating</TableCell>
                      <TableCell align="right">Accuracy Rate</TableCell>
                      <TableCell align="right">Substitutions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {servicePerformance.map((service, index) => (
                      <TableRow key={index}>
                        <TableCell>{service.courier_name}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {serviceIcons[service.service_type as keyof typeof serviceIcons]}
                            {serviceLabels[service.service_type as keyof typeof serviceLabels]}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{service.total_orders}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={service.avg_rating?.toFixed(1) || 'N/A'}
                            color={service.avg_rating >= 4 ? 'success' : service.avg_rating >= 3 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={service.avg_service_rating?.toFixed(1) || 'N/A'}
                            color={service.avg_service_rating >= 4 ? 'success' : service.avg_service_rating >= 3 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" gap={1}>
                            {service.service_accuracy_rate?.toFixed(1) || 0}%
                            <Chip
                              label={service.service_accuracy_rate >= 90 ? 'Excellent' : service.service_accuracy_rate >= 75 ? 'Good' : 'Needs Improvement'}
                              color={service.service_accuracy_rate >= 90 ? 'success' : service.service_accuracy_rate >= 75 ? 'info' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">{service.service_substitutions || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RatingAnalytics;
