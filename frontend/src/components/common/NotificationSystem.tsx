import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  LocalShipping,
  Receipt,
  CheckCircle,
  Info,
  Close,
  MarkEmailRead,
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'order_update' | 'new_order' | 'courier_assigned' | 'rating_received' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  user_id: string;
}

interface NotificationSystemProps {
  maxVisible?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({
  maxVisible = 50,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications');
      return response.data;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Update local state when data changes
  useEffect(() => {
    if (notificationsData) {
      setNotifications(notificationsData);
    }
  }, [notificationsData]);

  // Real-time subscription effect
  useEffect(() => {
    if (!user) return;

    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      try {
        const { tokens } = useAuthStore.getState();
        if (!tokens?.accessToken) {
          console.warn('No access token available for SSE connection');
          return;
        }

        // Create Server-Sent Events connection with token as query parameter
        // EventSource doesn't support Authorization headers, so we pass token in URL
        eventSource = new EventSource(`/api/notifications?stream=true&userId=${user.user_id}&token=${tokens.accessToken}`, {
          withCredentials: true,
        });

        eventSource.onopen = () => {
          console.log('Notification stream connected');
        };

        eventSource.onmessage = (event) => {
          try {
            const notification: Notification = JSON.parse(event.data);
            
            // Add to notifications list
            setNotifications(prev => [notification, ...prev].slice(0, maxVisible));
            
            // Show toast notification
            showToastNotification(notification);
            
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            
          } catch (error) {
            console.error('Failed to parse notification:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('Notification stream error:', error);
          eventSource?.close();
          
          // Retry connection after 5 seconds
          setTimeout(setupSSE, 5000);
        };

      } catch (error) {
        console.error('Failed to setup notification stream:', error);
      }
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, maxVisible, queryClient]);

  const showToastNotification = useCallback((notification: Notification) => {
    const toastOptions = {
      duration: 5000,
      position: 'top-right' as const,
    };

    switch (notification.type) {
      case 'order_update':
        toast.success(notification.title, toastOptions);
        break;
      case 'new_order':
        toast.success(notification.title, toastOptions);
        break;
      case 'courier_assigned':
        toast(notification.title, toastOptions);
        break;
      case 'rating_received':
        toast.success(notification.title, toastOptions);
        break;
      case 'system':
        toast(notification.title, toastOptions);
        break;
      default:
        toast(notification.title, toastOptions);
    }
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_update':
        return <Receipt color="primary" />;
      case 'new_order':
        return <Receipt color="success" />;
      case 'courier_assigned':
        return <LocalShipping color="info" />;
      case 'rating_received':
        return <CheckCircle color="success" />;
      case 'system':
        return <Info color="warning" />;
      default:
        return <Notifications />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_update':
        return 'primary';
      case 'new_order':
        return 'success';
      case 'courier_assigned':
        return 'info';
      case 'rating_received':
        return 'success';
      case 'system':
        return 'warning';
      default:
        return 'default';
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      
      refetch();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      
      refetch();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );
      
      refetch();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const isOpen = Boolean(anchorEl);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <IconButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        color="inherit"
        sx={{
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          {unreadCount > 0 ? (
            <NotificationsActive />
          ) : (
            <Notifications />
          )}
        </Badge>
      </IconButton>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 600,
            mt: 1,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkEmailRead />}
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    cursor: 'pointer',
                  }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <ListItemIcon>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: `${getNotificationColor(notification.type)}.light`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                            flex: 1,
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {!notification.read && (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {formatTime(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    sx={{ ml: 1 }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Showing {Math.min(notifications.length, maxVisible)} notifications
              </Typography>
            </Box>
          </>
        )}
      </Popover>
    </>
  );
};

export default NotificationSystem;
