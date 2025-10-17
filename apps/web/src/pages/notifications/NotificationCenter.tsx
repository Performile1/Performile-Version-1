import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import {
  Circle as CircleIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useNavigate } from 'react-router-dom';

interface Notification {
  notification_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: any;
}

export const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const filter = activeTab === 0 ? 'all' : 'unread';

  // Fetch notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', 'list', filter, page],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      const unreadOnly = filter === 'unread' ? 'true' : 'false';
      const response = await apiClient.get(
        `/notifications/list?limit=${pageSize}&offset=${offset}&unread_only=${unreadOnly}`
      );
      return response.data.data;
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.put('/notifications/mark-read', {
        notification_id: notificationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/notifications/mark-read', {
        mark_all: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.notification_id);
    }
    
    if (notification.data?.url) {
      navigate(notification.data.url);
    }
  };

  const handleMarkAsRead = (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const getNotificationTypeColor = (type: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (type) {
      case 'new_order': return 'primary';
      case 'order_status': return 'success';
      case 'delivery_update': return 'primary';
      case 'payment_received': return 'success';
      case 'new_review': return 'warning';
      case 'proximity_match': return 'primary';
      case 'system_alert': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load notifications. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">🔔 Notifications</Typography>
        <Button
          startIcon={<SettingsIcon />}
          onClick={() => navigate('/settings/notifications')}
        >
          Preferences
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label={`All (${data?.total || 0})`} />
              <Tab label={`Unread (${unreadCount})`} />
            </Tabs>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                Mark all as read
              </Button>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : "You haven't received any notifications yet."}
              </Typography>
            </Box>
          ) : (
            <>
              <List>
                {notifications.map((notification: Notification) => (
                  <ListItem
                    key={notification.notification_id}
                    sx={{
                      bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: notification.is_read ? 'action.hover' : 'action.selected',
                      },
                    }}
                    onClick={() => handleNotificationClick(notification)}
                    secondaryAction={
                      !notification.is_read && (
                        <IconButton
                          edge="end"
                          onClick={(e) => handleMarkAsRead(notification.notification_id, e)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon>
                      {notification.is_read ? (
                        <CheckCircleIcon color="disabled" />
                      ) : (
                        <CircleIcon color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body1"
                            fontWeight={notification.is_read ? 'normal' : 'bold'}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.type.replace('_', ' ')}
                            size="small"
                            color={getNotificationTypeColor(notification.type)}
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            {formatDate(notification.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(e, value) => setPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationCenter;
