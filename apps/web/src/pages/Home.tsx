/**
 * Public Homepage
 * Simple landing page with info about Performile
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Security,
  Assessment,
  LocalShipping,
  Store,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'TrustScore System',
      description: 'Transparent performance ratings for all delivery services based on real customer experiences.',
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Real-Time Tracking',
      description: 'Track your parcels in real-time with accurate ETAs and delivery updates.',
    },
    {
      icon: <Assessment sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Analytics Dashboard',
      description: 'Comprehensive analytics for merchants and couriers to optimize delivery performance.',
    },
    {
      icon: <Security sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Secure Platform',
      description: 'Enterprise-grade security with encrypted data and secure payment processing.',
    },
    {
      icon: <LocalShipping sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Courier Network',
      description: 'Connect with verified couriers and compare services based on performance metrics.',
    },
    {
      icon: <Store sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Merchant Tools',
      description: 'Powerful tools for e-commerce stores to manage deliveries and customer satisfaction.',
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Typography variant="h2" fontWeight="bold">
                  Performile
                </Typography>
                <Typography variant="h5" sx={{ opacity: 0.95 }}>
                  The Last Mile Performance Index
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.1rem', opacity: 0.9 }}>
                  Transparent delivery performance ratings that help customers choose the best courier services
                  and empower merchants to optimize their last-mile delivery.
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  {isAuthenticated ? (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/dashboard')}
                      sx={{
                        bgcolor: 'white',
                        color: '#667eea',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                      }}
                      endIcon={<ArrowForward />}
                    >
                      Go to Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/register')}
                        sx={{
                          bgcolor: 'white',
                          color: '#667eea',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        }}
                      >
                        Get Started
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/login')}
                        sx={{
                          borderColor: 'white',
                          color: 'white',
                          '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                        }}
                      >
                        Sign In
                      </Button>
                    </>
                  )}
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <img
                  src="/Performile-lastmile performance index.ico"
                  alt="Performile Logo"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Why Choose Performile?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Everything you need to manage and optimize last-mile delivery performance
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box mb={2}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Stats Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  10K+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Deliveries Tracked
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  500+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Active Merchants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  98%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Customer Satisfaction
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of merchants and couriers optimizing their delivery performance
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/subscription/plans')}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
              }}
            >
              View Pricing
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/contact')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Contact Us
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Performile
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                The Last Mile Performance Index
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Quick Links
              </Typography>
              <Stack spacing={1}>
                <Button
                  color="inherit"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  onClick={() => navigate('/info')}
                >
                  About Us
                </Button>
                <Button
                  color="inherit"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  onClick={() => navigate('/subscription/plans')}
                >
                  Pricing
                </Button>
                <Button
                  color="inherit"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  onClick={() => navigate('/contact')}
                >
                  Contact
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" gutterBottom>
                Legal
              </Typography>
              <Stack spacing={1}>
                <Button
                  color="inherit"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Privacy Policy
                </Button>
                <Button
                  color="inherit"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Terms of Service
                </Button>
              </Stack>
            </Grid>
          </Grid>
          <Box mt={4} pt={4} borderTop="1px solid rgba(255,255,255,0.1)" textAlign="center">
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              © {new Date().getFullYear()} Performile. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
