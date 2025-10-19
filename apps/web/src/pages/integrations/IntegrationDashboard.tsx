/**
 * IntegrationDashboard Component
 * Overview of all integrations with status and statistics
 * 
 * Week 3 Phase 3: Frontend UI
 * Created: October 19, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Settings,
  TrendingUp,
  TrendingDown,
  LocalShipping,
  Webhook,
  VpnKey,
  Code,
  Timeline,
  Speed,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { CourierLogo } from '@/components/courier/CourierLogo';
import { IntegrationStatusBadge } from '@/components/courier/IntegrationStatusBadge';
import { useNavigate } from 'react-router-dom';

interface IntegrationStats {
  courier_credentials: {
    total: number;
    active: number;
    inactive: number;
  };
  webhooks: {
    total: number;
    active: number;
    total_deliveries: number;
    failed_deliveries: number;
  };
  api_keys: {
    total: number;
    active: number;
    total_requests: number;
  };
  recent_events: Array<{
    event_id: string;
    event_type: string;
    entity_type: string;
    courier_name?: string;
    status: string;
    created_at: string;
  }>;
  api_usage: {
    today: number;
    this_week: number;
    this_month: number;
  };
}

export const IntegrationDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch integration stats
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['integration-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/week3-integrations/stats');
      return response.data.data as IntegrationStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 500);
  };

  const getHealthStatus = (): { status: 'healthy' | 'warning' | 'error'; message: string } => {
    if (!stats) return { status: 'warning', message: 'Loading...' };

    const hasActiveCredentials = stats.courier_credentials.active > 0;
    const webhookFailureRate = stats.webhooks.total_deliveries > 0
      ? stats.webhooks.failed_deliveries / stats.webhooks.total_deliveries
      : 0;

    if (!hasActiveCredentials) {
      return { status: 'warning', message: 'No active courier integrations' };
    }

    if (webhookFailureRate > 0.1) {
      return { status: 'error', message: 'High webhook failure rate' };
    }

    if (webhookFailureRate > 0.05) {
      return { status: 'warning', message: 'Some webhook failures detected' };
    }

    return { status: 'healthy', message: 'All systems operational' };
  };

  const healthStatus = getHealthStatus();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Integration Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage all your integrations
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <Refresh className={refreshing ? 'rotating' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Health Status Alert */}
      <Alert
        severity={healthStatus.status === 'healthy' ? 'success' : healthStatus.status === 'warning' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
        icon={
          healthStatus.status === 'healthy' ? <CheckCircle /> :
          healthStatus.status === 'warning' ? <Warning /> : <Error />
        }
      >
        <Typography variant="body2">
          <strong>System Status:</strong> {healthStatus.message}
        </Typography>
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Courier Integrations */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <LocalShipping />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.courier_credentials.active || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Couriers
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total: {stats?.courier_credentials.total || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Inactive: {stats?.courier_credentials.inactive || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats?.courier_credentials.total
                  ? (stats.courier_credentials.active / stats.courier_credentials.total) * 100
                  : 0}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Settings />}
                onClick={() => navigate('/integrations/couriers')}
              >
                Manage Couriers
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Webhooks */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Webhook />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.webhooks.total_deliveries || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Webhook Deliveries
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Active: {stats?.webhooks.active || 0}
                </Typography>
                <Typography variant="caption" color={stats?.webhooks.failed_deliveries ? 'error' : 'text.secondary'}>
                  Failed: {stats?.webhooks.failed_deliveries || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats?.webhooks.total_deliveries
                  ? ((stats.webhooks.total_deliveries - stats.webhooks.failed_deliveries) / stats.webhooks.total_deliveries) * 100
                  : 100}
                color={stats?.webhooks.failed_deliveries && stats.webhooks.failed_deliveries > 0 ? 'warning' : 'success'}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Settings />}
                onClick={() => navigate('/integrations/webhooks')}
              >
                Manage Webhooks
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* API Keys */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <VpnKey />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats?.api_keys.total_requests || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    API Requests
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Total Keys: {stats?.api_keys.total || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active: {stats?.api_keys.active || 0}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={stats?.api_keys.total
                  ? (stats.api_keys.active / stats.api_keys.total) * 100
                  : 0}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="outlined"
                size="small"
                startIcon={<Settings />}
                onClick={() => navigate('/integrations/api-keys')}
              >
                Manage API Keys
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* API Usage Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                API Usage
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary" fontWeight="bold">
                      {stats?.api_usage.today || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Today
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main" fontWeight="bold">
                      {stats?.api_usage.this_week || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This Week
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="info.main" fontWeight="bold">
                      {stats?.api_usage.this_month || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This Month
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LocalShipping />}
                  onClick={() => navigate('/integrations/couriers')}
                >
                  Add Courier
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Webhook />}
                  onClick={() => navigate('/integrations/webhooks')}
                >
                  Create Webhook
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VpnKey />}
                  onClick={() => navigate('/integrations/api-keys')}
                >
                  Generate API Key
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Code />}
                  onClick={() => window.open('/docs/api', '_blank')}
                >
                  API Documentation
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Events */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Integration Events
          </Typography>
          {stats?.recent_events && stats.recent_events.length > 0 ? (
            <List>
              {stats.recent_events.slice(0, 10).map((event, index) => (
                <React.Fragment key={event.event_id}>
                  {index > 0 && <Divider />}
                  <ListItem>
                    <ListItemIcon>
                      {event.status === 'success' ? (
                        <CheckCircle color="success" />
                      ) : event.status === 'failed' ? (
                        <Error color="error" />
                      ) : (
                        <Info color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {event.event_type.replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Typography>
                          {event.courier_name && (
                            <Chip label={event.courier_name} size="small" />
                          )}
                          <Chip
                            label={event.status}
                            size="small"
                            color={event.status === 'success' ? 'success' : event.status === 'failed' ? 'error' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {event.entity_type} • {new Date(event.created_at).toLocaleString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No recent events
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
