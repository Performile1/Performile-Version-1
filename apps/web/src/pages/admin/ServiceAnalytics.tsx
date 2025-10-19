/**
 * Admin Service Analytics Dashboard
 * Week 4 - Admin Integration
 * 
 * Comprehensive view of service performance and parcel points for admins
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper
} from '@mui/material';
import {
  TrendingUp,
  Map as MapIcon,
  Assessment,
  Store,
  Refresh
} from '@mui/icons-material';
import {
  ServicePerformanceCard,
  ServiceComparisonChart,
  GeographicHeatmap,
  ServiceReviewsList
} from '../../components/service-performance';
import {
  ParcelPointMap,
  CoverageChecker
} from '../../components/parcel-points';

interface TabPanelProps {
  children?: React.Node;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const ServiceAnalytics: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [reviewsData, setReviewsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch service performance data
      const perfResponse = await fetch('/api/service-performance?period_type=monthly&limit=10');
      const perfData = await perfResponse.json();

      if (perfData.success) {
        setPerformanceData(perfData.data);
        
        // Get top 5 for comparison
        const top5 = perfData.data.slice(0, 5);
        setComparisonData(top5);
      }

      // Fetch reviews for home delivery service
      const reviewsResponse = await fetch('/api/service-performance?action=reviews&service_type_id=home_delivery&limit=20');
      const reviewsResult = await reviewsResponse.json();

      if (reviewsResult.success) {
        setReviewsData(reviewsResult.data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Service Analytics Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comprehensive performance metrics and parcel point analytics
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Quick Stats */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Assessment color="primary" />
                  <Typography variant="caption" color="text.secondary">
                    Services Tracked
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {performanceData.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp color="success" />
                  <Typography variant="caption" color="text.secondary">
                    Avg Trust Score
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {performanceData.length > 0
                    ? (performanceData.reduce((sum, item) => sum + item.trust_score, 0) / performanceData.length).toFixed(1)
                    : '0.0'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Store color="info" />
                  <Typography variant="caption" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {performanceData.reduce((sum, item) => sum + item.total_orders, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MapIcon color="warning" />
                  <Typography variant="caption" color="text.secondary">
                    Coverage Areas
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {performanceData.reduce((sum, item) => sum + (item.coverage_area_count || 0), 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Performance Overview" icon={<Assessment />} iconPosition="start" />
          <Tab label="Service Comparison" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Geographic Analysis" icon={<MapIcon />} iconPosition="start" />
          <Tab label="Parcel Points Map" icon={<Store />} iconPosition="start" />
          <Tab label="Coverage Checker" icon={<MapIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      )}

      {/* Tab Panels */}
      {!loading && (
        <>
          {/* Tab 1: Performance Overview */}
          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              {performanceData.length === 0 ? (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No performance data available. Data will appear once orders are processed.
                  </Alert>
                </Grid>
              ) : (
                performanceData.map((data) => (
                  <Grid item xs={12} md={6} lg={4} key={data.performance_id}>
                    <ServicePerformanceCard data={data} />
                  </Grid>
                ))
              )}
            </Grid>
          </TabPanel>

          {/* Tab 2: Service Comparison */}
          <TabPanel value={currentTab} index={1}>
            {comparisonData.length >= 2 ? (
              <ServiceComparisonChart
                data={comparisonData}
                title="Top 5 Services Comparison"
              />
            ) : (
              <Alert severity="info">
                Need at least 2 services with data to show comparison chart.
              </Alert>
            )}
          </TabPanel>

          {/* Tab 3: Geographic Analysis */}
          <TabPanel value={currentTab} index={2}>
            {performanceData.length > 0 ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Select a courier to view geographic performance
                </Typography>
                <Grid container spacing={2} mb={3}>
                  {[...new Set(performanceData.map(p => p.courier_name))].map((courierName) => (
                    <Grid item key={courierName}>
                      <Chip
                        label={courierName}
                        onClick={() => {
                          // Would fetch geographic data for this courier
                          console.log('Selected courier:', courierName);
                        }}
                        color="primary"
                        variant="outlined"
                      />
                    </Grid>
                  ))}
                </Grid>
                <Alert severity="info">
                  Geographic data will be displayed here. Select a courier above to view area-specific performance.
                </Alert>
              </Box>
            ) : (
              <Alert severity="info">
                No geographic data available yet.
              </Alert>
            )}
          </TabPanel>

          {/* Tab 4: Parcel Points Map */}
          <TabPanel value={currentTab} index={3}>
            <ParcelPointMap />
          </TabPanel>

          {/* Tab 5: Coverage Checker */}
          <TabPanel value={currentTab} index={4}>
            <CoverageChecker />
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default ServiceAnalytics;
