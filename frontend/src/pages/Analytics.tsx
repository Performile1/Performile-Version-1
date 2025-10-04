import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Chip,
  Button,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { Assessment } from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { AnalyticsFilters } from '@/types/analytics';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { TimeFilter } from '../components/analytics/TimeFilter';

// Chart colors
// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const Analytics: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    timeRange: 'month',
    city: '',
    postalCode: '',
    country: ''
  });

  // Fetch analytics data from API
  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', user?.user_role, filters],
    queryFn: async () => {
      // Admin uses admin analytics endpoint with full data
      if (user?.user_role === 'admin') {
        console.log('Fetching admin analytics...');
        const response = await apiClient.get('/admin/analytics', {
          params: {
            compare: 'true',
            start_date: filters.customStartDate,
            end_date: filters.customEndDate,
            postal_code: filters.postalCode,
            country: filters.country
          }
        });
        console.log('Admin analytics response:', response.data);
        return response.data;
      }
      // Other roles would use different endpoints
      return null;
    },
    enabled: !!user
  });

  const courierData = analyticsData?.data || [];
  
  // Debug logging
  if (user?.user_role === 'admin') {
    console.log('Analytics Data:', analyticsData);
    console.log('Courier Data:', courierData);
    console.log('Loading:', analyticsLoading);
    console.log('Error:', analyticsError);
  }

  // Mock data for demonstration
  const performanceData = [
    { date: '2024-01', trustScore: 85, orderVolume: 1200, revenue: 45000, avgOrdersPerDay: 39, peakHours: '12-14,18-20' },
    { date: '2024-02', trustScore: 87, orderVolume: 1350, revenue: 52000, avgOrdersPerDay: 48, peakHours: '12-14,18-20' },
    { date: '2024-03', trustScore: 89, orderVolume: 1500, revenue: 58000, avgOrdersPerDay: 48, peakHours: '11-13,17-19' },
    { date: '2024-04', trustScore: 91, orderVolume: 1650, revenue: 63000, avgOrdersPerDay: 55, peakHours: '12-14,18-20' },
    { date: '2024-05', trustScore: 88, orderVolume: 1400, revenue: 55000, avgOrdersPerDay: 45, peakHours: '12-14,17-19' },
    { date: '2024-06', trustScore: 92, orderVolume: 1800, revenue: 68000, avgOrdersPerDay: 60, peakHours: '11-13,18-20' }
  ];

  const orderStatistics = {
    totalOrders: 9900,
    monthlyGrowth: 12.5,
    avgOrdersPerDay: 52,
    peakHours: ['12:00-14:00', '18:00-20:00'],
    completionRate: 94.2,
    avgDeliveryTime: 28.5
  };

  const metricsData = [
    { name: 'Completion Rate', value: 94.5, color: '#00C49F' },
    { name: 'On-Time Rate', value: 87.2, color: '#0088FE' },
    { name: 'Customer Satisfaction', value: 4.6, color: '#FFBB28' },
    { name: 'Response Time', value: 2.3, color: '#FF8042' }
  ];

  const competitorData = [
    { name: 'Competitor A', trustScore: 85, marketShare: 25, unlocked: false },
    { name: 'Competitor B', trustScore: 78, marketShare: 18, unlocked: true },
    { name: 'Competitor C', trustScore: 92, marketShare: 30, unlocked: false },
    { name: 'You', trustScore: 89, marketShare: 15, unlocked: true }
  ];

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFilterChange = (key: keyof AnalyticsFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleUnlockFeature = (featureId: number) => {
    console.log(`Unlock feature ${featureId}`);
  };

  const isFeatureRestricted = (feature: string) => {
    // Admin users have access to ALL features
    if (user?.user_role === 'admin') {
      return false;
    }
    
    // Mock subscription check - would integrate with actual subscription system
    const userTier = user?.subscription_tier || 'tier1';
    
    const restrictions: Record<string, string[]> = {
      tier1: ['competitor_analysis', 'advanced_filters', 'custom_reports'],
      tier2: ['custom_reports'],
      tier3: []
    };
    
    return restrictions[userTier]?.includes(feature) || false;
  };

  // Determine what couriers/data the user can see based on role and subscription
  const getDataAccessLevel = () => {
    if (!user) return { courierLimit: 0, marketLimit: 0, canSeeAllCouriers: false };

    // Admin: Full access to everything
    if (user.user_role === 'admin') {
      return {
        courierLimit: Infinity,
        marketLimit: Infinity,
        canSeeAllCouriers: true,
        canSeeCompetitors: true,
        canExportData: true,
        description: 'Full admin access to all data and features'
      };
    }

    // Merchant: Access based on subscription tier
    if (user.user_role === 'merchant') {
      const tier = user.subscription_tier || 'tier1';
      const tierLimits = {
        tier1: { 
          courierLimit: 2, 
          marketLimit: 2, 
          canSeeCompetitors: false,
          canBuyAddons: true,
          postalCodeAccess: false
        },
        tier2: { 
          courierLimit: 4, 
          marketLimit: 4, 
          canSeeCompetitors: false,
          canBuyAddons: true,
          postalCodeAccess: false
        },
        tier3: { 
          courierLimit: Infinity, 
          marketLimit: Infinity, 
          canSeeCompetitors: true,
          canBuyAddons: false,
          postalCodeAccess: true
        }
      };
      return {
        ...tierLimits[tier as keyof typeof tierLimits] || tierLimits.tier1,
        canSeeAllCouriers: false,
        canExportData: tier !== 'tier1',
        canBuyLeads: true,
        description: `Merchant ${tier.toUpperCase()} - ${tier === 'tier3' ? 'Unlimited' : tierLimits[tier as keyof typeof tierLimits].courierLimit + ' couriers, ' + tierLimits[tier as keyof typeof tierLimits].marketLimit + ' markets'}`
      };
    }

    // Courier: See own performance + limited competitor data based on tier
    if (user.user_role === 'courier') {
      const tier = user.subscription_tier || 'tier1';
      const tierLimits = {
        tier1: { 
          courierLimit: 1, 
          marketLimit: 1, 
          canSeeCompetitors: false,
          canBuyAddons: true,
          postalCodeAccess: false
        },
        tier2: { 
          courierLimit: 1, 
          marketLimit: 4, 
          canSeeCompetitors: false,
          canBuyAddons: true,
          postalCodeAccess: false
        },
        tier3: { 
          courierLimit: 1, 
          marketLimit: Infinity, 
          canSeeCompetitors: false,
          canBuyAddons: true,
          postalCodeAccess: false
        }
      };
      return {
        ...tierLimits[tier as keyof typeof tierLimits] || tierLimits.tier1,
        canSeeAllCouriers: false,
        canExportData: tier !== 'tier1',
        canBuyLeads: true,
        canBuyCompetitorData: true,
        canBuyPostalCodeData: true,
        description: `Courier ${tier.toUpperCase()} - Your performance, ${tierLimits[tier as keyof typeof tierLimits].marketLimit === Infinity ? 'unlimited' : tierLimits[tier as keyof typeof tierLimits].marketLimit} market${tierLimits[tier as keyof typeof tierLimits].marketLimit !== 1 ? 's' : ''}`
      };
    }

    // Consumer: Very limited access
    return {
      courierLimit: 0,
      marketLimit: 0,
      canSeeAllCouriers: false,
      canSeeCompetitors: false,
      canExportData: false,
      description: 'Consumer - No analytics access'
    };
  };

  const dataAccess = getDataAccessLevel();

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Comprehensive performance analytics and market insights
        </Typography>

        {/* Access Level Indicator */}
        <Alert 
          severity={user?.user_role === 'admin' ? 'success' : 'info'} 
          sx={{ mb: 3 }}
          icon={user?.user_role === 'admin' ? <Assessment /> : undefined}
        >
          <strong>{dataAccess.description}</strong>
          {user?.user_role !== 'admin' && (
            <>
              <br />
              <Typography variant="caption">
                Courier Access: {dataAccess.courierLimit === Infinity ? 'Unlimited' : dataAccess.courierLimit} | 
                Markets: {dataAccess.marketLimit === Infinity ? 'Unlimited' : dataAccess.marketLimit} | 
                Competitor Data: {dataAccess.canSeeCompetitors ? 'Yes' : 'No'} | 
                Export: {dataAccess.canExportData ? 'Yes' : 'No'}
              </Typography>
            </>
          )}
          {user?.user_role === 'admin' && courierData.length > 0 && (
            <>
              <br />
              <Typography variant="caption">
                Viewing {courierData.length} courier(s) | Full transparency mode - All data visible
              </Typography>
            </>
          )}
        </Alert>

        {/* Admin: Real-time Courier Data */}
        {user?.user_role === 'admin' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Courier Performance Overview (Live Data)
              </Typography>
              
              {analyticsLoading && (
                <Alert severity="info">Loading courier data...</Alert>
              )}
              
              {analyticsError && (
                <Alert severity="error">
                  Error loading data: {analyticsError instanceof Error ? analyticsError.message : 'Unknown error'}
                </Alert>
              )}
              
              {!analyticsLoading && !analyticsError && courierData.length === 0 && (
                <Alert severity="warning">
                  No courier data available. Make sure you've run the seed-demo-data.sql script in Supabase.
                </Alert>
              )}
              
              {courierData.length > 0 && (
                <>
              <Grid container spacing={2}>
                {courierData.slice(0, 5).map((courier: any, index: number) => (
                  <Grid item xs={12} md={6} lg={4} key={courier.courier_id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {courier.courier_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          📧 {courier.contact_email} | 📞 {courier.contact_phone}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" display="block">
                            Total Orders: <strong>{courier.total_orders}</strong> | 
                            Delivered: <strong>{courier.delivered_orders}</strong> | 
                            Success Rate: <strong>{courier.delivery_success_rate}%</strong>
                          </Typography>
                          <Typography variant="caption" display="block">
                            Avg Delivery: <strong>{courier.avg_delivery_hours}h</strong> | 
                            Rating: <strong>{courier.avg_rating}/5</strong> | 
                            Reviews: <strong>{courier.total_reviews}</strong>
                          </Typography>
                          <Typography variant="caption" display="block">
                            Customers: <strong>{courier.unique_customers}</strong> | 
                            Stores: <strong>{courier.total_stores_served}</strong>
                          </Typography>
                          <Typography variant="caption" display="block" color="primary">
                            Since: {new Date(courier.courier_since).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={filters.timeRange}
                    label="Time Range"
                    onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  >
                    <MenuItem value="day">Today</MenuItem>
                    <MenuItem value="week">Last Week</MenuItem>
                    <MenuItem value="month">Last Month</MenuItem>
                    <MenuItem value="6months">Last 6 Months</MenuItem>
                    <MenuItem value="year">Last Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Country"
                  value={filters.country}
                  onClick={() => handleUnlockFeature(29)}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  placeholder="e.g., USA"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="City"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  placeholder="e.g., New York"
                  disabled={isFeatureRestricted('advanced_filters')}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Postal Code"
                  value={filters.postalCode}
                  onChange={(e) => handleFilterChange('postalCode', e.target.value)}
                  placeholder="e.g., 10001"
                  disabled={isFeatureRestricted('advanced_filters')}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <Button variant="contained" fullWidth>
                  Apply Filters
                </Button>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                {isFeatureRestricted('advanced_filters') && (
                  <Chip
                    label="Upgrade for Advanced Filters"
                    color="warning"
                    size="small"
                  />
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Card>
          <CardContent>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Performance Overview" />
              <Tab label="Competitor Analysis" disabled={isFeatureRestricted('competitor_analysis')} />
              <Tab label="Market Insights" />
              <Tab label="Lead Generation" disabled={user?.user_role === 'courier'} />
            </Tabs>

            {/* Performance Overview Tab */}
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                {/* TrustScore Trend */}
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        TrustScore Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="trustScore" 
                            stroke="#8884d8" 
                            strokeWidth={3}
                            name="TrustScore"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Key Metrics */}
                <Grid item xs={12} lg={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Key Metrics
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={metricsData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}${name.includes('Rate') ? '%' : name.includes('Time') ? 'h' : ''}`}
                          >
                            {metricsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Order Statistics Cards */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {orderStatistics.totalOrders.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Orders
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            +{orderStatistics.monthlyGrowth}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Monthly Growth
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {orderStatistics.avgOrdersPerDay}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Orders/Day
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" color="warning.main">
                            {orderStatistics.avgDeliveryTime}min
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg Delivery Time
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Order Volume & Revenue */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Order Volume & Revenue Trends
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'Order Volume' ? `${value} orders` : `$${value?.toLocaleString()}`,
                              name
                            ]}
                          />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="orderVolume"
                            stackId="1"
                            stroke="#8884d8"
                            fill="#8884d8"
                            name="Order Volume"
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="revenue"
                            stackId="2"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            name="Revenue ($)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Daily Order Pattern */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Daily Order Pattern
                      </Typography>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value) => [`${value} orders/day`, 'Avg Daily Orders']}
                          />
                          <Bar dataKey="avgOrdersPerDay" fill="#8884d8" name="Avg Orders/Day" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Peak Hours Analysis */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Peak Order Hours
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        {orderStatistics.peakHours.map((hour, index) => (
                          <Chip 
                            key={index}
                            label={hour}
                            color="primary"
                            sx={{ mr: 1, mb: 1 }}
                          />
                        ))}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Completion Rate: {orderStatistics.completionRate}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Competitor Analysis Tab */}
            <TabPanel value={activeTab} index={1}>
              {isFeatureRestricted('advanced_filters') && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography>Upgrade to unlock advanced filtering options.</Typography>
                </Alert>
              )}
              {isFeatureRestricted('competitor_analysis') ? (
                <Alert severity="info">
                  <Typography>Competitor analysis available in premium plans.</Typography>
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Market Position Analysis
                        </Typography>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={competitorData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="trustScore" fill="#8884d8" name="TrustScore" />
                            <Bar dataKey="marketShare" fill="#82ca9d" name="Market Share %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Competitor Insights
                    </Typography>
                    <Grid container spacing={2}>
                      {competitorData.filter(c => c.name !== 'You').map((competitor, index) => (
                        <Grid item xs={12} md={4} key={index}>
                          <Card sx={{ position: 'relative' }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6">
                                  {competitor.unlocked ? competitor.name : `Anonymous Courier ${index + 1}`}
                                </Typography>
                                {!competitor.unlocked && (
                                  <Chip label={`Unlock $29`} color="primary" size="small" />
                                )}
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary">
                                TrustScore: {competitor.unlocked ? competitor.trustScore : '***'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Market Share: {competitor.unlocked ? `${competitor.marketShare}%` : '***%'}
                              </Typography>
                              
                              {!competitor.unlocked && (
                                <Button 
                                  variant="outlined" 
                                  size="small" 
                                  sx={{ mt: 2 }}
                                  fullWidth
                                >
                                  Unlock Full Data
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            {/* Market Insights Tab */}
            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Available Markets
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Upgrade to Pro to access advanced analytics features.
                      </Alert>
                      {user?.user_role !== 'admin' && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Your {user?.subscription_tier || 'Tier 1'} subscription allows access to{' '}
                          {user?.subscription_tier === 'tier3' ? '8' : user?.subscription_tier === 'tier2' ? '3' : '1'} market(s)
                        </Alert>
                      )}
                      {user?.user_role === 'admin' && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                          Admin Access - Full access to all markets and features
                        </Alert>
                      )}
                      
                      {/* Market cards would be rendered here */}
                      <Typography variant="body2" color="text.secondary">
                        Market analysis data would be displayed here based on subscription tier
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Geographic Performance
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Interactive map showing performance by location would be here
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Lead Generation Tab (Merchants and Admin) */}
            <TabPanel value={activeTab} index={3}>
              {(user?.user_role === 'merchant' || user?.user_role === 'admin' || user?.user_role === 'courier') ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Courier Marketplace
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Research and connect with couriers in your area. Send leads to potential partners.
                        </Typography>
                        
                        {user.user_role !== 'admin' && (
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Your {user?.subscription_tier || 'Tier 1'} subscription allows{' '}
                            {user?.subscription_tier === 'tier3' ? '8' : user?.subscription_tier === 'tier2' ? '3' : '1'} courier connection(s)
                          </Alert>
                        )}
                        {user.user_role === 'admin' && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            Admin Access - Unlimited courier connections
                          </Alert>
                        )}

                        <Typography variant="body2" color="text.secondary">
                          Courier marketplace and lead generation features would be implemented here
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  Lead generation is available for merchant accounts only.
                </Alert>
              )}
            </TabPanel>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
