import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
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
  Button,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Store,
  LocalShipping,
  AttachMoney,
  Inventory,
  Scale,
  LocationOn,
  Lock,
  Upgrade,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ marginTop: '24px' }}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const CourierCheckoutAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState(0);

  // Fetch My Merchants analytics
  const { data: myMerchantsData, isLoading: loadingMyMerchants } = useQuery({
    queryKey: ['courier-checkout-analytics', user?.user_id],
    queryFn: async () => {
      const response = await apiClient.get('/courier/checkout-analytics');
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch Market Insights (premium)
  const { data: marketInsightsData, isLoading: loadingMarketInsights, error: marketError } = useQuery({
    queryKey: ['courier-market-insights', user?.user_id],
    queryFn: async () => {
      const response = await apiClient.get('/market-insights/courier');
      return response.data.data;
    },
    enabled: !!user && activeTab === 1,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const isPremium = marketInsightsData && !marketError;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          🛒 Checkout Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your performance in merchant checkouts and discover opportunities
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="📊 My Merchants" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🔍 Market Insights
                {!isPremium && <Chip label="Premium" size="small" color="warning" />}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Tab 1: My Merchants */}
      <TabPanel value={activeTab} index={0}>
        {loadingMyMerchants ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : myMerchantsData ? (
          <MyMerchantsTab data={myMerchantsData} />
        ) : (
          <Alert severity="info">No data available yet. Start accepting orders to see your analytics!</Alert>
        )}
      </TabPanel>

      {/* Tab 2: Market Insights */}
      <TabPanel value={activeTab} index={1}>
        {!isPremium && marketError ? (
          <PremiumGate error={marketError} />
        ) : loadingMarketInsights ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : marketInsightsData ? (
          <MarketInsightsTab data={marketInsightsData} />
        ) : null}
      </TabPanel>
    </Box>
  );
};

// =====================================================
// My Merchants Tab Component
// =====================================================

const MyMerchantsTab: React.FC<{ data: any }> = ({ data }) => {
  const { summary, topMerchants, distribution, trend, subscription } = data;

  // Prepare position distribution data for pie chart
  const positionData = distribution.map((item: any) => ({
    name: `Position ${item.position_shown}`,
    value: parseFloat(item.percentage),
  }));

  // Prepare trend data for line chart
  const trendData = trend.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    position: parseFloat(item.avg_position),
    appearances: parseInt(item.appearances),
    selections: parseInt(item.selections),
  }));

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LocalShipping sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Position
                </Typography>
              </Box>
              <Typography variant="h4">
                #{summary?.avg_position || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Out of {summary?.total_appearances || 0} appearances
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Selection Rate
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.selection_rate || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {summary?.times_selected || 0} times selected
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
                ${summary?.avg_order_value?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per order
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Scale sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Package Weight
                </Typography>
              </Box>
              <Typography variant="h4">
                {summary?.avg_package_weight?.toFixed(1) || '0.0'} kg
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Per package
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Position Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Position Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={positionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {positionData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Position Trend (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="position"
                    stroke="#8884d8"
                    name="Avg Position"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="selections"
                    stroke="#82ca9d"
                    name="Selections"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Merchants Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Top Merchants by Performance
            </Typography>
            {subscription?.isLimited && (
              <Chip
                label={`Showing ${subscription.maxMerchants} of ${subscription.maxMerchants + subscription.hiddenMerchants}`}
                color="warning"
                size="small"
                icon={<Lock />}
              />
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Merchant</TableCell>
                  <TableCell align="center">Avg Position</TableCell>
                  <TableCell align="center">Appearances</TableCell>
                  <TableCell align="center">Selections</TableCell>
                  <TableCell align="center">Selection Rate</TableCell>
                  <TableCell align="center">Avg Order Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topMerchants?.map((merchant: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {merchant.merchant_name || 'Unknown'}
                        </Typography>
                        {merchant.store_name && (
                          <Typography variant="caption" color="text.secondary">
                            {merchant.store_name}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`#${merchant.avg_position}`}
                        size="small"
                        color={parseFloat(merchant.avg_position) <= 2 ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">{merchant.appearances}</TableCell>
                    <TableCell align="center">{merchant.selections}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(merchant.selection_rate)}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption">
                          {merchant.selection_rate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      ${parseFloat(merchant.avg_order_value || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {subscription?.isLimited && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {subscription.upgradeMessage} - <Button size="small">Upgrade Now</Button>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// =====================================================
// Market Insights Tab Component
// =====================================================

const MarketInsightsTab: React.FC<{ data: any }> = ({ data }) => {
  const { merchantSegments, geographicOpportunities, industryTrends, marketBenchmarks } = data;

  return (
    <Box>
      <Alert severity="success" sx={{ mb: 3 }}>
        📊 <strong>Anonymized Market Data</strong> - All merchant identities are protected. Data shows market trends and opportunities.
      </Alert>

      {/* Market Benchmarks */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Market Avg Position
              </Typography>
              <Typography variant="h4">
                #{marketBenchmarks?.market_avg_position || 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top 25%: #{marketBenchmarks?.top_25_position || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Market Avg Selection Rate
              </Typography>
              <Typography variant="h4">
                {marketBenchmarks?.market_avg_selection_rate || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Top 25%: {marketBenchmarks?.top_25_selection_rate || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Merchant Segments */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💰 Merchant Segments by Order Value
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Discover which merchant segments offer the best opportunities
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Segment</TableCell>
                  <TableCell align="right">Merchants</TableCell>
                  <TableCell align="right">Avg Order Value</TableCell>
                  <TableCell align="right">Selection Rate</TableCell>
                  <TableCell align="right">Total Checkouts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {merchantSegments?.map((segment: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip label={segment.segment} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="right">{segment.merchant_count}</TableCell>
                    <TableCell align="right">${segment.avg_order_value}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        {segment.avg_selection_rate}%
                        <LinearProgress 
                          variant="determinate" 
                          value={parseFloat(segment.avg_selection_rate)} 
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{segment.total_checkouts}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Geographic Opportunities */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🗺️ Geographic Opportunities
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Top locations with active merchant demand
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location</TableCell>
                  <TableCell align="right">Merchants</TableCell>
                  <TableCell align="right">Checkouts</TableCell>
                  <TableCell align="right">Avg Order Value</TableCell>
                  <TableCell align="right">Selection Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {geographicOpportunities?.slice(0, 10).map((location: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        {location.delivery_city}, {location.delivery_country}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{location.merchant_count}</TableCell>
                    <TableCell align="right">{location.total_checkouts}</TableCell>
                    <TableCell align="right">${location.avg_order_value}</TableCell>
                    <TableCell align="right">{location.selection_rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Industry Trends */}
      {industryTrends && industryTrends.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📦 Industry Trends
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Merchant types based on order patterns
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Industry Type</TableCell>
                    <TableCell align="right">Merchants</TableCell>
                    <TableCell align="right">Avg Order Value</TableCell>
                    <TableCell align="right">Avg Items/Order</TableCell>
                    <TableCell align="right">Avg Weight (kg)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {industryTrends.map((trend: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Chip label={trend.industry_type} size="small" />
                      </TableCell>
                      <TableCell align="right">{trend.merchant_count}</TableCell>
                      <TableCell align="right">${trend.avg_order_value}</TableCell>
                      <TableCell align="right">{trend.avg_items_per_order}</TableCell>
                      <TableCell align="right">{trend.avg_package_weight || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// =====================================================
// Premium Gate Component
// =====================================================

const PremiumGate: React.FC<{ error: any }> = ({ error }) => {
  const premiumInfo = error?.response?.data?.premium;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ textAlign: 'center', p: 4 }}>
        <Lock sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          💎 Market Insights Premium
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Unlock anonymized market data to discover opportunities and benchmark your performance
        </Typography>

        {premiumInfo?.benefits && (
          <Box sx={{ textAlign: 'left', mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              What's included:
            </Typography>
            {premiumInfo.benefits.map((benefit: string, index: number) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="body2">{benefit}</Typography>
              </Box>
            ))}
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" color="primary">
            ${premiumInfo?.price || 29}
            <Typography component="span" variant="body2" color="text.secondary">
              /{premiumInfo?.billing || 'month'}
            </Typography>
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<Upgrade />}
          fullWidth
        >
          Upgrade to Premium
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Cancel anytime. No long-term commitment.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CourierCheckoutAnalytics;
