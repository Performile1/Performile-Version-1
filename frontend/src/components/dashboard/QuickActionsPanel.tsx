import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Box,
} from '@mui/material';
import {
  Assessment,
  LocalShipping,
  Store,
  Report,
  Settings,
  People,
  Add,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  roles?: string[];
}

export const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const allActions: QuickAction[] = [
    {
      label: 'View Analytics',
      icon: <Assessment />,
      path: '/analytics',
      color: 'primary',
      roles: ['admin'],
    },
    {
      label: 'Manage Couriers',
      icon: <LocalShipping />,
      path: '/couriers',
      color: 'info',
      roles: ['admin'],
    },
    {
      label: 'View Stores',
      icon: <Store />,
      path: '/stores',
      color: 'success',
      roles: ['admin', 'merchant'],
    },
    {
      label: 'TrustScores',
      icon: <TrendingUp />,
      path: '/trustscores',
      color: 'warning',
      roles: ['admin', 'merchant', 'courier'],
    },
    {
      label: 'Create Order',
      icon: <Add />,
      path: '/orders',
      color: 'primary',
      roles: ['merchant'],
    },
    {
      label: 'View Reports',
      icon: <Report />,
      path: '/reports',
      color: 'secondary',
      roles: ['merchant'],
    },
    {
      label: 'My Orders',
      icon: <LocalShipping />,
      path: '/orders',
      color: 'info',
      roles: ['courier'],
    },
    {
      label: 'My TrustScore',
      icon: <TrendingUp />,
      path: '/trustscores',
      color: 'warning',
      roles: ['courier'],
    },
    {
      label: 'Team',
      icon: <People />,
      path: '/team',
      color: 'info',
      roles: ['admin', 'merchant'],
    },
    {
      label: 'Settings',
      icon: <Settings />,
      path: '/settings',
      color: 'default',
      roles: ['admin', 'merchant', 'courier'],
    },
  ];

  // Filter actions based on user role
  const actions = allActions.filter(action => 
    !action.roles || action.roles.includes(user?.user_role || '')
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {actions.map((action) => (
            <Grid item xs={6} sm={4} md={3} key={action.label}>
              <Button
                fullWidth
                variant="outlined"
                color={action.color as any}
                startIcon={action.icon}
                onClick={() => navigate(action.path)}
                sx={{
                  py: 1.5,
                  flexDirection: 'column',
                  gap: 0.5,
                  '& .MuiButton-startIcon': {
                    margin: 0,
                  },
                }}
              >
                <Box sx={{ fontSize: '0.875rem' }}>
                  {action.label}
                </Box>
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
