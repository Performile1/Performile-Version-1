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
  Login,
  PersonAdd,
  Star,
  CheckCircle,
  Map,
  BarChart,
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
      {/* Top Navigation Bar */}
      <Box
        sx={{
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          py: 2,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src="/logo.png"
                alt="Performile Logo"
                style={{ height: 40, width: 40, objectFit: 'contain' }}
              />
              <Typography variant="h6" fontWeight="bold" color="primary">
                Performile
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Button
                color="inherit"
                sx={{ textTransform: 'none', display: { xs: 'none', md: 'inline-flex' } }}
                onClick={() => navigate('/subscription/plans')}
              >
                Pricing
              </Button>
              <Button
                color="inherit"
                sx={{ textTransform: 'none', display: { xs: 'none', md: 'inline-flex' } }}
                onClick={() => navigate('/info')}
              >
                About
              </Button>
              <Button
                color="inherit"
                sx={{ textTransform: 'none', display: { xs: 'none', md: 'inline-flex' } }}
                onClick={() => navigate('/contact')}
              >
                Contact
              </Button>
              {!isAuthenticated && (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<Login />}
                    onClick={() => navigate('/login')}
                    sx={{ textTransform: 'none' }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => navigate('/register')}
                    sx={{ textTransform: 'none' }}
                  >
                    Get Started
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <Button
                  variant="contained"
                  onClick={() => navigate('/dashboard')}
                  sx={{ textTransform: 'none' }}
                >
                  Dashboard
                </Button>
              )}
            </Stack>
          </Box>
        </Container>
      </Box>

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

      {/* Feature Showcase with Screenshots */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Powerful Features
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Everything you need to manage and optimize last-mile delivery performance
          </Typography>
        </Box>

        {/* Feature 1: Analytics Dashboard */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BarChart sx={{ color: '#667eea', fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold">
                  Analytics Dashboard
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                Get real-time insights into your delivery performance with comprehensive analytics,
                charts, and reports.
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Real-time performance metrics</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Customizable reports</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Export to CSV/PDF</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                📊 Dashboard Screenshot
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Feature 2: Parcel Points Map */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }} direction={{ xs: 'column', md: 'row-reverse' }}>
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Map sx={{ color: '#667eea', fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold">
                  Parcel Points Map
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                Find nearby parcel points, check coverage areas, and optimize your delivery routes
                with our interactive map.
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Interactive map interface</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Coverage checker</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Route optimization</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                🗺️ Map View Screenshot
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Feature 3: Service Performance */}
        <Grid container spacing={4} alignItems="center" sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Speed sx={{ color: '#667eea', fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold">
                  Service Performance
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                Track and compare courier performance with detailed metrics, ratings, and reviews
                from real customers.
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">TrustScore ratings</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Performance comparisons</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Customer reviews</Typography>
                </Box>
              </Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary">
                ⭐ Performance Charts Screenshot
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Original Features Grid */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Why Choose Performile?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            Comprehensive tools for merchants and couriers
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

      {/* Enhanced Stats & Social Proof Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Trusted by Thousands
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join the growing community of merchants and couriers
            </Typography>
          </Box>
          <Grid container spacing={4} textAlign="center">
            <Grid item xs={12} sm={3}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  10K+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Deliveries Tracked
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  1,000+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Active Merchants
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  5,000+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Registered Couriers
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper elevation={0} sx={{ p: 4, bgcolor: 'transparent' }}>
                <Typography variant="h3" fontWeight="bold" color="primary">
                  50K+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Customer Reviews
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Testimonial */}
          <Box sx={{ mt: 6 }}>
            <Paper elevation={2} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} sx={{ color: '#FFD700', fontSize: 28 }} />
                ))}
              </Box>
              <Typography variant="h6" textAlign="center" gutterBottom>
                "Best delivery tracking platform we've used"
              </Typography>
              <Typography variant="body1" color="text.secondary" textAlign="center" paragraph>
                Performile has transformed how we manage our deliveries. The analytics are
                incredible and the TrustScore system helps us choose the best couriers.
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" fontWeight="bold">
                — Sarah Johnson, E-commerce Manager
              </Typography>
            </Paper>
          </Box>
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
