import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ShoppingCart,
  Star,
  LocalShipping,
  Report,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface Activity {
  id: string;
  type: 'order' | 'review' | 'courier' | 'claim';
  title: string;
  description: string;
  timestamp: string;
}

const activityIcons = {
  order: <ShoppingCart />,
  review: <Star />,
  courier: <LocalShipping />,
  claim: <Report />,
};

const activityColors = {
  order: 'primary.main',
  review: 'success.main',
  courier: 'info.main',
  claim: 'warning.main',
};

export const RecentActivityWidget: React.FC = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard/recent-activity');
      return response.data.data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const formatTimestamp = (timestamp: string) => {
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
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Recent Activity
          </Typography>
          <TrendingUp color="action" />
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : activities && activities.length > 0 ? (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {activities.map((activity: Activity) => (
              <ListItem
                key={activity.id}
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: activityColors[activity.type] }}>
                    {activityIcons[activity.type]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {activity.title}
                      </Typography>
                      <Chip 
                        label={activity.type} 
                        size="small" 
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTimestamp(activity.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No recent activity
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
