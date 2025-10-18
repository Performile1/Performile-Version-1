import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  LocalShipping,
  Assessment,
  Star,
  Schedule,
  CheckCircle,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { TrackingWidget } from '@/components/tracking/TrackingWidget';
import { 
  PerformanceTrendsChart,
  RecentActivityWidget,
  QuickActionsPanel,
  OrderTrendsChart,
  ClaimsTrendsChart,
  ClaimsManagementWidget,
} from '@/components/dashboard';
import { CourierLogo } from '@/components/courier/CourierLogo';

interface DashboardStats {
  total_couriers: number;
  avg_trust_score: number;
  avg_on_time_rate: number;
  avg_completion_rate: number;
  total_orders_processed: number;
  total_reviews: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {trend && (
          <Chip
            label={`${trend > 0 ? '+' : ''}${trend}%`}
            color={trend > 0 ? 'success' : 'error'}
            size="small"
          />
        )}
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard: React.FC = () => {
  console.log('🚀 Dashboard v3.0 - Role-based data filtering enabled!');
  const { user } = useAuthStore();

  // Get role-specific dashboard endpoint
  // UNIFIED APPROACH: All roles use the same endpoint
  // Backend filters data based on user role + subscription automatically
  const getDashboardEndpoint = () => {
    // ALL roles now use the unified endpoint with role-based filtering
    return '/trustscore/dashboard';
  };

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.user_role, user?.user_id],
    queryFn: async () => {
      const endpoint = getDashboardEndpoint();
      const response = await apiClient.get(endpoint);
      return response.data.data;
    },
    enabled: !!user, // Only fetch when user is authenticated
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = dashboardData?.statistics as DashboardStats;
  const topCouriers = Array.isArray(dashboardData?.couriers) ? dashboardData.couriers.slice(0, 5) : [];

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${greeting}, ${user?.first_name || 'there'}!`;
  };

  const getRoleDashboard = () => {
    switch (user?.user_role) {
      case 'admin':
        return (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Couriers"
                value={stats?.total_couriers || 0}
                icon={<LocalShipping />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Avg Trust Score"
                value={stats?.avg_trust_score ? Number(stats.avg_trust_score).toFixed(1) : '0.0'}
                icon={<Star />}
                color="warning.main"
                subtitle="Out of 100"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Orders"
                value={stats?.total_orders_processed ? Number(stats.total_orders_processed).toLocaleString() : '0'}
                icon={<Assessment />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Reviews"
                value={stats?.total_reviews ? Number(stats.total_reviews).toLocaleString() : '0'}
                icon={<TrendingUp />}
                color="info.main"
              />
            </Grid>

            {/* Performance Trends Chart */}
            <Grid item xs={12} lg={8}>
              <PerformanceTrendsChart />
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} lg={4}>
              <RecentActivityWidget />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <QuickActionsPanel />
            </Grid>

            {/* Tracking Widget */}
            <Grid item xs={12} md={6}>
              <TrackingWidget />
            </Grid>
          </Grid>
        );

      case 'merchant':
        return (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="On-Time Rate"
                value={stats?.avg_on_time_rate ? `${Number(stats.avg_on_time_rate).toFixed(1)}%` : '0%'}
                icon={<Schedule />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Completion Rate"
                value={stats?.avg_completion_rate ? `${Number(stats.avg_completion_rate).toFixed(1)}%` : '0%'}
                icon={<CheckCircle />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Available Couriers"
                value={stats?.total_couriers || 0}
                icon={<LocalShipping />}
                color="info.main"
              />
            </Grid>

            {/* Order Trends Chart */}
            <Grid item xs={12} lg={6}>
              <OrderTrendsChart 
                entityType="merchant"
                subscriptionTier={user?.subscription_tier || 'tier1'}
              />
            </Grid>

            {/* Claims Trends Chart */}
            <Grid item xs={12} lg={6}>
              <ClaimsTrendsChart 
                entityType="merchant"
                subscriptionTier={user?.subscription_tier || 'tier1'}
              />
            </Grid>

            {/* Claims Management Widget */}
            <Grid item xs={12}>
              <ClaimsManagementWidget 
                entityType="merchant"
                subscriptionTier={user?.subscription_tier || 'tier1'}
              />
            </Grid>

            {/* Performance Trends */}
            <Grid item xs={12} lg={8}>
              <PerformanceTrendsChart />
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} lg={4}>
              <RecentActivityWidget />
            </Grid>

            {/* Tracking Widget */}
            <Grid item xs={12} md={6}>
              <TrackingWidget />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={6}>
              <QuickActionsPanel />
            </Grid>
          </Grid>
        );

      case 'courier':
        return (
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="My Trust Score"
                value={stats?.avg_trust_score ? Number(stats.avg_trust_score).toFixed(1) : '0'}
                icon={<Star />}
                color="warning.main"
                subtitle="Industry average: 78.4"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Orders This Month"
                value={stats?.total_orders_processed ? Number(stats.total_orders_processed).toLocaleString() : '0'}
                icon={<LocalShipping />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="On-Time Rate"
                value={stats?.avg_on_time_rate ? `${Number(stats.avg_on_time_rate).toFixed(1)}%` : '0%'}
                icon={<Schedule />}
                color="success.main"
              />
            </Grid>

            {/* Order Trends Chart */}
            <Grid item xs={12} lg={6}>
              <OrderTrendsChart 
                entityType="courier"
                subscriptionTier={user?.subscription_tier || 'tier1'}
              />
            </Grid>

            {/* Claims Trends Chart */}
            <Grid item xs={12} lg={6}>
              <ClaimsTrendsChart 
                entityType="courier"
                subscriptionTier={user?.subscription_tier || 'tier1'}
              />
            </Grid>

            {/* Claims Management Widget */}
            <Grid item xs={12}>
              <ClaimsManagementWidget 
                entityType="courier"
                subscriptionTier={user?.subscription_tier || 'tier1'}
              />
            </Grid>

            {/* Performance Trends */}
            <Grid item xs={12} lg={8}>
              <PerformanceTrendsChart />
            </Grid>

            {/* Recent Activity */}
            <Grid item xs={12} lg={4}>
              <RecentActivityWidget />
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <QuickActionsPanel />
            </Grid>
          </Grid>
        );

      default: // consumer
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Tracked Orders"
                value="23"
                icon={<LocalShipping />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Reviews Given"
                value="18"
                icon={<Star />}
                color="warning.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Avg Rating Given"
                value="4.2"
                icon={<TrendingUp />}
                color="success.main"
                subtitle="Out of 5 stars"
              />
            </Grid>
          </Grid>
        );
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {getWelcomeMessage()}
        </Typography>
        <LinearProgress sx={{ mb: 4 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {getWelcomeMessage()}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Here's what's happening with your logistics performance today.
      </Typography>

      {getRoleDashboard()}

      {/* Top Performers Section */}
      {(user?.user_role === 'admin' || user?.user_role === 'merchant') && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Top Performing Couriers
          </Typography>
          <Grid container spacing={2}>
            {topCouriers.map((courier: any, index: number) => (
              <Grid item xs={12} sm={6} md={4} key={courier.courier_id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ position: 'relative', mr: 2 }}>
                        <CourierLogo
                          courierCode={courier.courier_code || courier.courier_name}
                          courierName={courier.courier_name}
                          size="large"
                          variant="rounded"
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            border: '2px solid white',
                          }}
                        >
                          {index + 1}
                        </Box>
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {courier.courier_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Trust Score: {courier.overall_score ? Number(courier.overall_score).toFixed(1) : '0.0'}
                        </Typography>
                      </Box>
                      <Chip
                        label={courier.performance_grade || 'N/A'}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption">On-Time Rate</Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {courier.on_time_rate ? Number(courier.on_time_rate).toFixed(1) : '0'}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Number(courier.on_time_rate) || 0}
                      sx={{ mb: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {courier.total_orders || 0} orders • {courier.total_reviews || 0} reviews
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
