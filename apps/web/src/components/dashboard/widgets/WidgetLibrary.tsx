/**
 * WIDGET LIBRARY
 * Reusable dashboard widgets for custom layouts
 * Created: October 21, 2025
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  LocalShipping,
  Assessment,
  Star,
  Schedule,
  CheckCircle,
  MoreVert,
  Refresh,
  ShowChart,
  ShoppingCart,
  Notifications,
  Map,
  Speed,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

// ============================================================================
// WIDGET TYPES
// ============================================================================

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  settings?: Record<string, any>;
}

export interface WidgetProps {
  config: WidgetConfig;
  onRefresh?: () => void;
  onSettings?: () => void;
  onRemove?: () => void;
}

// ============================================================================
// PERFORMANCE STATS WIDGET
// ============================================================================

export const PerformanceStatsWidget: React.FC<WidgetProps> = ({ config, onRefresh }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['widget-performance-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/trustscore/dashboard');
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const stats = [
    {
      label: 'Avg Trust Score',
      value: data?.avg_trust_score?.toFixed(1) || '0.0',
      icon: <Star />,
      color: '#ffc107',
    },
    {
      label: 'On-Time Rate',
      value: `${data?.avg_on_time_rate?.toFixed(1) || '0'}%`,
      icon: <Schedule />,
      color: '#4caf50',
    },
    {
      label: 'Completion Rate',
      value: `${data?.avg_completion_rate?.toFixed(1) || '0'}%`,
      icon: <CheckCircle />,
      color: '#2196f3',
    },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Performance Stats"
        action={
          <IconButton size="small" onClick={onRefresh}>
            <Refresh />
          </IconButton>
        }
      />
      <CardContent>
        {isLoading ? (
          <LinearProgress />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stats.map((stat, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: stat.color, width: 40, height: 40 }}>
                  {stat.icon}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// RECENT ORDERS WIDGET
// ============================================================================

export const RecentOrdersWidget: React.FC<WidgetProps> = ({ config, onRefresh }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['widget-recent-orders'],
    queryFn: async () => {
      const response = await apiClient.get('/orders/list?limit=5&sort=created_at:desc');
      return response.data.data?.orders || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const orders = data || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'info',
      in_transit: 'primary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Recent Orders"
        action={
          <IconButton size="small" onClick={onRefresh}>
            <Refresh />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {isLoading ? (
          <LinearProgress />
        ) : orders.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No recent orders
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {orders.slice(0, 5).map((order: any, index: number) => (
              <React.Fragment key={order.order_id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <ShoppingCart />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Order #${order.order_id?.slice(0, 8)}`}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={order.status}
                          size="small"
                          color={getStatusColor(order.status) as any}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(order.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ACTIVE DELIVERIES WIDGET
// ============================================================================

export const ActiveDeliveriesWidget: React.FC<WidgetProps> = ({ config, onRefresh }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['widget-active-deliveries'],
    queryFn: async () => {
      const response = await apiClient.get('/orders/list?status=in_transit&limit=5');
      return response.data.data?.orders || [];
    },
    refetchInterval: 30000,
  });

  const deliveries = data || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Active Deliveries"
        action={
          <IconButton size="small" onClick={onRefresh}>
            <Refresh />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {isLoading ? (
          <LinearProgress />
        ) : deliveries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No active deliveries
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {deliveries.slice(0, 5).map((delivery: any, index: number) => (
              <React.Fragment key={delivery.order_id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <LocalShipping />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={delivery.tracking_number || 'No tracking'}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {delivery.courier_name || 'Unknown courier'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ETA: {delivery.estimated_delivery ? new Date(delivery.estimated_delivery).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// QUICK ACTIONS WIDGET
// ============================================================================

export const QuickActionsWidget: React.FC<WidgetProps> = ({ config }) => {
  const actions = [
    { label: 'Create Order', icon: <ShoppingCart />, color: 'primary', path: '/orders/create' },
    { label: 'Track Package', icon: <LocalShipping />, color: 'success', path: '/tracking' },
    { label: 'View Analytics', icon: <Assessment />, color: 'info', path: '/analytics' },
    { label: 'Manage Couriers', icon: <Star />, color: 'warning', path: '/couriers' },
  ];

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Quick Actions" />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outlined"
              color={action.color as any}
              startIcon={action.icon}
              fullWidth
              sx={{ py: 1.5 }}
              onClick={() => window.location.href = `#${action.path}`}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// NOTIFICATIONS WIDGET
// ============================================================================

export const NotificationsWidget: React.FC<WidgetProps> = ({ config, onRefresh }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['widget-notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/list?limit=5');
      return response.data.data?.notifications || [];
    },
    refetchInterval: 30000,
  });

  const notifications = data || [];

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Recent Notifications"
        action={
          <IconButton size="small" onClick={onRefresh}>
            <Refresh />
          </IconButton>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {isLoading ? (
          <LinearProgress />
        ) : notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No new notifications
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.slice(0, 5).map((notification: any, index: number) => (
              <React.Fragment key={notification.notification_id}>
                {index > 0 && <Divider />}
                <ListItem sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.is_read ? 'grey.400' : 'primary.main' }}>
                      <Notifications />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.created_at).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// WIDGET REGISTRY
// ============================================================================

export const WIDGET_REGISTRY = {
  'performance-stats': {
    component: PerformanceStatsWidget,
    title: 'Performance Stats',
    description: 'Key performance metrics',
    icon: <Speed />,
    defaultSize: 'medium' as const,
  },
  'recent-orders': {
    component: RecentOrdersWidget,
    title: 'Recent Orders',
    description: 'Latest orders',
    icon: <ShoppingCart />,
    defaultSize: 'medium' as const,
  },
  'active-deliveries': {
    component: ActiveDeliveriesWidget,
    title: 'Active Deliveries',
    description: 'In-transit packages',
    icon: <LocalShipping />,
    defaultSize: 'medium' as const,
  },
  'quick-actions': {
    component: QuickActionsWidget,
    title: 'Quick Actions',
    description: 'Common tasks',
    icon: <TrendingUp />,
    defaultSize: 'small' as const,
  },
  'notifications': {
    component: NotificationsWidget,
    title: 'Notifications',
    description: 'Recent alerts',
    icon: <Notifications />,
    defaultSize: 'medium' as const,
  },
};

export type WidgetType = keyof typeof WIDGET_REGISTRY;
