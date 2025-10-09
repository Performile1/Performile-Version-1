import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

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
            <CancelIcon
              sx={{
                fontSize: 80,
                color: 'warning.main',
                mb: 3,
              }}
            />
            
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Subscription Cancelled
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              Your subscription process was cancelled.
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              No charges were made. You can try again anytime or explore our free features.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/subscription/plans')}
              >
                View Plans Again
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
              Need help? <a href="/contact" style={{ color: 'inherit' }}>Contact our support team</a>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default SubscriptionCancel;
