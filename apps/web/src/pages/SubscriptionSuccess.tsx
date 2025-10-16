import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Invalidate subscription-related queries
    queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  }, [queryClient]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: 'success.main',
                mb: 3,
              }}
            />
            
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Welcome Aboard! 🎉
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Your subscription has been activated successfully!
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              You now have full access to all premium features. Start optimizing your delivery performance today!
            </Typography>

            {sessionId && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Session ID: {sessionId}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/settings')}
              >
                View Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SubscriptionSuccess;
