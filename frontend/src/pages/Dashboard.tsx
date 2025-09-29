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
import { useQuery } from 'react-query';
import { apiClient } from '@/services/apiClient';

interface DashboardStats {
  total_couriers: number;
  avg_trust_score: number;
  avg_on_time_rate: number;
  avg_completion_rate: number;
  total_orders_processed: number;
  total_reviews_count: number;
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
  const { user } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/trustscore/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = dashboardData?.statistics as DashboardStats;
  const topCouriers = dashboardData?.couriers?.slice(0, 5) || [];

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
                value={stats?.avg_trust_score?.toFixed(1) || '0.0'}
                icon={<Star />}
                color="warning.main"
                subtitle="Out of 100"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Orders"
                value={stats?.total_orders_processed?.toLocaleString() || '0'}
                icon={<Assessment />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Reviews"
                value={stats?.total_reviews_count?.toLocaleString() || '0'}
                icon={<TrendingUp />}
                color="info.main"
              />
            </Grid>
          </Grid>
        );

      case 'merchant':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="On-Time Rate"
                value={`${stats?.avg_on_time_rate?.toFixed(1) || '0'}%`}
                icon={<Schedule />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Completion Rate"
                value={`${stats?.avg_completion_rate?.toFixed(1) || '0'}%`}
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
          </Grid>
        );

      case 'courier':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="My Trust Score"
                value="85.2"
                icon={<Star />}
                color="warning.main"
                trend={2.3}
                subtitle="Industry average: 78.4"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="Orders This Month"
                value="1,247"
                icon={<LocalShipping />}
                color="primary.main"
                trend={12}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <StatCard
                title="On-Time Rate"
                value="92.1%"
                icon={<Schedule />}
                color="success.main"
                trend={-1.2}
              />
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
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {index + 1}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {courier.courier_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Trust Score: {courier.trust_score?.toFixed(1) || '0.0'}
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
                      <Typography variant="caption">
                        {courier.on_time_rate?.toFixed(1) || '0'}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={courier.on_time_rate || 0}
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
