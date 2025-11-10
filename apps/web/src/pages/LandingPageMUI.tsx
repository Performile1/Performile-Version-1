import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  AppBar,
  Toolbar,
  Stack,
  Paper,
  Chip,
  Rating,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Security,
  Assessment,
  LocalShipping,
  Store,
  ArrowForward,
  Smartphone,
  CheckCircle,
  Star,
  ExpandMore,
  Calculate,
  Map,
  Article,
  Email,
  Download,
  PlayArrow,
  Close,
  Check,
  TrendingDown,
  Business,
  Person,
  AttachMoney,
  Schedule,
} from '@mui/icons-material';
import { GoogleAnalytics } from '../components/analytics/GoogleAnalytics';

export default function LandingPageMUI() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  
  // ROI Calculator state
  const [roiInputs, setRoiInputs] = useState({
    monthlyOrders: 1000,
    avgOrderValue: 50,
    currentShippingCost: 8,
    currentProcessingTime: 5,
  });

  const calculateROI = () => {
    const { monthlyOrders, avgOrderValue, currentShippingCost, currentProcessingTime } = roiInputs;
    const currentMonthlyShipping = monthlyOrders * currentShippingCost;
    const currentLaborCost = (currentProcessingTime / 60) * 25 * monthlyOrders;
    const currentTotalCost = currentMonthlyShipping + currentLaborCost;
    const performileShippingCost = monthlyOrders * (currentShippingCost * 0.75);
    const performileLaborCost = (1 / 60) * 25 * monthlyOrders;
    const performileSubscription = 29;
    const performileTotalCost = performileShippingCost + performileLaborCost + performileSubscription;
    const monthlySavings = currentTotalCost - performileTotalCost;
    const annualSavings = monthlySavings * 12;
    const roi = ((annualSavings - (performileSubscription * 12)) / (performileSubscription * 12)) * 100;
    
    return {
      currentMonthlyCost: currentTotalCost,
      performileMonthlyCost: performileTotalCost,
      monthlySavings,
      annualSavings,
      roi,
    };
  };

  const results = calculateROI();

  const roleSegments = useMemo(
    () => [
      {
        title: 'Merchants',
        description: 'Launch dynamic checkout, configure couriers, and get actionable revenue analytics.',
        cta: 'Merchant Success Guide',
        icon: <Store sx={{ fontSize: 32, color: 'primary.main' }} />,
        navigateTo: '/knowledge-base?role=merchant',
      },
      {
        title: 'Couriers',
        description: 'Optimize routes, manage fleets, and turn lead marketplace insights into bookings.',
        cta: 'Courier Success Guide',
        icon: <LocalShipping sx={{ fontSize: 32, color: 'success.main' }} />,
        navigateTo: '/knowledge-base?role=courier',
      },
      {
        title: 'Consumers',
        description: 'Select the best drop-off points, track parcels in real-time, and manage returns effortlessly.',
        cta: 'Consumer Success Guide',
        icon: <Smartphone sx={{ fontSize: 32, color: 'secondary.main' }} />,
        navigateTo: '/knowledge-base?role=consumer',
      },
      {
        title: 'Admins',
        description: 'Oversee platform health, enforce role-based access, and monitor compliance from one hub.',
        cta: 'Admin Success Guide',
        icon: <Security sx={{ fontSize: 32, color: 'warning.main' }} />,
        navigateTo: '/knowledge-base?role=admin',
      },
    ],
    [navigate]
  );

  const handleNewsletterSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterSuccess(true);
    setEmail('');
    setTimeout(() => setNewsletterSuccess(false), 5000);
  };

  return (
    <Box>
      {/* Google Analytics */}
      <GoogleAnalytics measurementId="G-XXXXXXXXXX" />

      {/* Navigation Bar */}
      <AppBar 
        position="sticky" 
        sx={{ 
          bgcolor: 'white', 
          color: 'text.primary',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <img
              src="/logo.png"
              alt="Performile Logo"
              style={{ height: 40, width: 40, objectFit: 'contain' }}
            />
            <Typography variant="h6" fontWeight="bold" color="primary">
              Performile
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button color="inherit" onClick={() => navigate('/subscription/plans')}>
              Pricing
            </Button>
            <Button color="inherit" onClick={() => navigate('/contact')}>
              Contact
            </Button>
            <Button variant="outlined" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="contained" onClick={() => navigate('/register')}>
              Start Free Trial
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            The Complete Delivery Platform
          </Typography>
          <Typography variant="h5" sx={{ mb: 1, opacity: 0.9 }}>
            Global Delivery Intelligence
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.8, maxWidth: 800, mx: 'auto' }}>
            Connect merchants, couriers, and consumers with AI-powered logistics,
            real-time tracking, and seamless payments
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              onClick={() => navigate('/demo')}
            >
              Watch Demo
            </Button>
          </Stack>
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
            ✓ No credit card required ✓ 14-day free trial ✓ Cancel anytime
          </Typography>

          {/* Role-specific entry points */}
          <Grid container spacing={3} sx={{ mt: 6 }}>
            {roleSegments.map((segment) => (
              <Grid item xs={12} sm={6} md={3} key={segment.title}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(6px)',
                    cursor: 'pointer',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                    },
                  }}
                  onClick={() => navigate(segment.navigateTo)}
                >
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>{segment.icon}</Box>
                      <Typography variant="h6" fontWeight="bold" color="white">
                        {segment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {segment.description}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: 'rgba(255,255,255,0.6)',
                          color: 'white',
                          alignSelf: 'flex-start',
                          '&:hover': {
                            borderColor: 'white',
                            bgcolor: 'rgba(255,255,255,0.12)',
                          },
                        }}
                      >
                        {segment.cta}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Stats */}
          <Grid container spacing={4} sx={{ mt: 6 }}>
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Deliveries/Month', value: '500K+' },
              { label: 'Countries', value: '250+' },
              { label: 'Satisfaction', value: '98%' },
            ].map((stat) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Typography variant="h3" fontWeight="bold">{stat.value}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>{stat.label}</Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Guided tour preview */}
      <Container maxWidth="lg" sx={{ mt: -8, zIndex: 2, position: 'relative' }}>
        <Card
          sx={{
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 18px 45px rgba(80, 56, 160, 0.15)',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="primary" fontWeight={700}>
              Guided Tour Preview
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mt: 1, mb: 2 }}>
              Explore the onboarding journey before you sign up
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Watch a 90-second walkthrough of the merchant dashboard tour powered by Shepherd.js. See how we
              guide new teams through courier setup, drop-off filtering, and analytics in-app.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
              >
                Watch Guided Tour
              </Button>
              <Button variant="outlined" onClick={() => navigate('/knowledge-base?article=guided-tour')}>
                Read Tour Setup Docs
              </Button>
            </Stack>
          </Box>
          <CardMedia
            component="img"
            image="/assets/merchant-tour-preview.gif"
            alt="Performile Guided Tour Preview"
            sx={{
              width: { xs: '100%', md: 360 },
              borderRadius: 3,
              boxShadow: '0 12px 30px rgba(102,126,234,0.25)',
              border: '1px solid rgba(102,126,234,0.2)',
            }}
            onError={(event) => {
              (event.target as HTMLImageElement).src = '/images/dashboard-preview.png';
            }}
          />
        </Card>
      </Container>

      {/* Features Overview */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Everything You Need in One Platform
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          From checkout widgets to mobile apps, we've built the complete ecosystem
        </Typography>

        <Grid container spacing={4}>
          {[
            { icon: <Smartphone />, title: 'Mobile Apps', description: 'Native iOS & Android apps for consumers with real-time tracking', color: '#2196f3' },
            { icon: <Store />, title: 'Checkout Plugins', description: 'WooCommerce & Shopify integrations for instant setup', color: '#9c27b0' },
            { icon: <AttachMoney />, title: 'Multi-Payment Support', description: 'Vipps, Swish, MobilePay, Stripe, Klarna, Qliro, Adyen, Worldpay - supporting global payment methods', color: '#4caf50' },
            { icon: <Map />, title: 'Real-Time Tracking', description: 'Live GPS tracking with ETA predictions and notifications', color: '#f44336' },
            { icon: <LocalShipping />, title: 'C2C Shipping', description: 'Consumer-to-consumer shipping with integrated payments', color: '#ff9800' },
            { icon: <Assessment />, title: 'Advanced Analytics', description: 'Real-time insights, performance metrics, and revenue tracking', color: '#673ab7' },
          ].map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%', '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.3s' }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: feature.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {React.cloneElement(feature.icon, { sx: { fontSize: 32, color: 'white' } })}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* LMT Lastmile Trust Score - CORE USP */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
            LMT Lastmile Trust Score
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 6, opacity: 0.9 }}>
            Data-driven courier ratings based on real performance
          </Typography>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 6, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', textAlign: 'center' }}>
                <Typography variant="h1" fontWeight="bold" sx={{ color: 'white', mb: 2 }}>
                  LMT
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: 'white', mb: 3 }}>
                  Lastmile Trust Score
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Comprehensive performance rating based on customer reviews, delivery success, on-time performance, and claim rates.
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.95)' }}>
                  <CardContent>
                    <Map sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Postal Code-Specific
                    </Typography>
                    <Typography color="text.secondary">
                      Same courier performs differently in different areas. We show performance for YOUR postal code, not national averages.
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'rgba(255,255,255,0.95)' }}>
                  <CardContent>
                    <Star sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Real Customer Data
                    </Typography>
                    <Typography color="text.secondary">
                      Based on actual delivery performance, customer reviews, and verified tracking data. Transparent and fair scoring.
                    </Typography>
                  </CardContent>
                </Card>

                <Alert severity="success" sx={{ fontWeight: 600 }}>
                  🏆 The most accurate courier rating system globally
                </Alert>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Dynamic Checkout - CORE FEATURE */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Dynamic Checkout - Let Consumers Choose
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Weighted courier list based on postal code-specific LMT Score
        </Typography>

        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Paper elevation={8} sx={{ p: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Consumer enters postal code: 0150 (Oslo)
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {[
                { courier: 'PostNord', score: 92, rating: 4.5, price: '49 SEK', time: '1-2 days', recommended: true },
                { courier: 'Bring', score: 88, rating: 4.3, price: '55 SEK', time: '1-2 days', recommended: false },
                { courier: 'Porterbuddy', score: 85, rating: 4.2, price: '69 SEK', time: 'Same day', recommended: false },
              ].map((option) => (
                <Card key={option.courier} sx={{ mb: 2, border: option.recommended ? 3 : 1, borderColor: option.recommended ? 'success.main' : 'grey.300' }}>
                  <CardContent>
                    {option.recommended && (
                      <Chip label="RECOMMENDED" color="success" size="small" sx={{ mb: 1, fontWeight: 'bold' }} />
                    )}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6" fontWeight="bold">{option.courier}</Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={`LMT: ${option.score}`} size="small" color="primary" />
                          <Rating value={option.rating} precision={0.1} size="small" readOnly />
                        </Stack>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" fontWeight="bold" color="primary">{option.price}</Typography>
                        <Typography variant="body2" color="text.secondary">{option.time}</Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      "Fast delivery!" - Review from 0150
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  How It Works
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {[
                    'Consumer enters postal code at checkout',
                    'System calculates weighted score for each courier',
                    'Shows LMT Score, reviews, and pricing',
                    'Consumer sees data from THEIR postal code',
                    'Best option automatically recommended',
                    'Consumer makes informed choice',
                  ].map((step, idx) => (
                    <Stack key={idx} direction="row" spacing={2} alignItems="center">
                      <Chip label={idx + 1} color="primary" size="small" />
                      <Typography>{step}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Alert severity="info">
                <Typography fontWeight="600" gutterBottom>Transparent & Fair</Typography>
                <Typography variant="body2">
                  Consumers see real performance data, not just who paid the most for placement. Better experience = higher conversion rates.
                </Typography>
              </Alert>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Predictive Delivery - COMPETITIVE EDGE */}
      <Box sx={{ bgcolor: 'grey.50', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
            Predictive Delivery Estimates
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 2 }}>
            Know exactly when your package will arrive
          </Typography>
          <Typography variant="h5" textAlign="center" color="primary.main" fontWeight="bold" sx={{ mb: 6 }}>
            🏆 Amazon doesn't even do this at postal code level!
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Schedule sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Time-of-Day Predictions
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    "Usually delivered between 14:00-17:00"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on actual tracking timestamps from your postal code. Home delivery only.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <TrendingUp sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Day-Based Predictions
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    Monday-Sunday delivery patterns
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Historical data with outlier removal and recency weighting. Shows confidence intervals.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Map sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Postal Code-Specific
                  </Typography>
                  <Typography color="text.secondary" paragraph>
                    Predictions for YOUR area
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Not national averages. Real data from your postal code and day-of-week.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto', bgcolor: 'success.50' }}>
              <Typography variant="h6" fontWeight="bold" color="success.dark" gutterBottom>
                Example Prediction
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>PostNord to 0150 (Oslo)</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📦 Expected delivery: <strong>Tuesday, 2-3 days</strong><br />
                🕐 Typical delivery time: <strong>14:00-17:00</strong><br />
                📊 Confidence: <strong>92%</strong> (based on 847 deliveries)
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Analytics trust signal */}
      <Box sx={{ py: 12, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" color="primary" fontWeight={700}>
                Real-time courier insights
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ mt: 1, mb: 2 }}>
                Analytics that react the moment customers choose a courier
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Powered by our checkout analytics implementation, Performile logs every courier impression and
                selection to update rankings instantly. Merchants can see which delivery options convert, and
                couriers understand how their performance impacts placement.
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Assessment sx={{ color: 'primary.main' }} />
                  <Typography variant="body1">Session-level display & selection logging</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <TrendingUp sx={{ color: 'success.main' }} />
                  <Typography variant="body1">Automatic ranking recalculations per postal code</Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Speed sx={{ color: 'secondary.main' }} />
                  <Typography variant="body1"><strong>&lt; 300ms</strong> analytics write latency to keep dashboards live</Typography>
                </Stack>
              </Stack>
              <Button
                variant="text"
                sx={{ mt: 3 }}
                onClick={() => navigate('/knowledge-base?article=checkout-analytics')}
              >
                Read the analytics deep dive
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 4, height: '100%' }}>
                <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                  Snapshot · Last 24 hours
                </Typography>
                <Stack spacing={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h4" fontWeight="bold">+18%</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Checkout conversions when QR-ready drop-off shown first
                      </Typography>
                    </Box>
                    <Chip label="Live" color="success" size="small" />
                  </Stack>
                  <Divider />
                  <Stack spacing={2}>
                    {[
                      {
                        courier: 'PostNord',
                        impression: '73,421 displays',
                        selection: '31,204 selections',
                      },
                      {
                        courier: 'Bring',
                        impression: '52,908 displays',
                        selection: '22,110 selections',
                      },
                      {
                        courier: 'Porterbuddy',
                        impression: '18,564 displays',
                        selection: '9,441 selections',
                      },
                    ].map((row) => (
                      <Box key={row.courier}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {row.courier}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.impression} · {row.selection}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Claims & RMA System - MAJOR FEATURE */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Claims & Returns Made Simple
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Centralized system for all couriers - faster resolution, better tracking
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  8 Claim Types Supported
                </Typography>
                <Stack spacing={2.5} sx={{ mt: 4 }}>
                  {[
                    { type: 'Lost Package', icon: '📦' },
                    { type: 'Damaged Package', icon: '💔' },
                    { type: 'Late Delivery', icon: '⏰' },
                    { type: 'Wrong Address', icon: '📍' },
                    { type: 'Missing Items', icon: '🔍' },
                    { type: 'Quality Issues', icon: '⚠️' },
                    { type: 'Return Request', icon: '↩️' },
                    { type: 'Refund Request', icon: '💰' },
                  ].map((claim) => (
                    <Stack key={claim.type} direction="row" spacing={2} alignItems="center" justifyContent="center">
                      <Typography variant="h5">{claim.icon}</Typography>
                      <Typography variant="h6" fontWeight="500">{claim.type}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Card>
                <CardContent>
                  <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Automated Return Labels
                  </Typography>
                  <Typography color="text.secondary">
                    Generate return labels instantly. No waiting for merchant approval. PDF with barcode or QR code.
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Track Orders & Claims
                  </Typography>
                  <Typography color="text.secondary">
                    Keep track of all your orders, file claims for issues, and create returns - all from one dashboard. Complete visibility and control.
                  </Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <AttachMoney sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Refund Tracking
                  </Typography>
                  <Typography color="text.secondary">
                    Track refund status in real-time. Automatic notifications when refund is processed. Full transparency.
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography fontWeight="600" gutterBottom>iFrame Widget Available</Typography>
            <Typography variant="body2">
              Embed our RMA system directly on your site. Seamless experience for your customers.
            </Typography>
          </Alert>
        </Box>
      </Container>

      {/* C2C Shipping - Consumer Feature */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
            Consumer-to-Consumer Shipping
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 6, opacity: 0.9 }}>
            Send packages to friends, family, or sell online - Quick, easy, and affordable
          </Typography>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: 'white' }} gutterBottom>
                    Simple 3-Step Process
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 3 }}>
                    {[
                      { step: '1', title: 'Create Shipment', desc: 'Enter sender and recipient details online' },
                      { step: '2', title: 'Get Your Label', desc: 'Download PDF label or use QR code on your phone' },
                      { step: '3', title: 'Drop Off & Track', desc: 'Drop at courier location and track in real-time' },
                    ].map((item) => (
                      <Stack key={item.step} direction="row" spacing={2} alignItems="flex-start">
                        <Chip 
                          label={item.step} 
                          sx={{ 
                            bgcolor: 'success.main', 
                            color: 'white', 
                            fontWeight: 'bold',
                            minWidth: 40,
                            height: 40,
                            fontSize: '1.2rem'
                          }} 
                        />
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {item.desc}
                          </Typography>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Star sx={{ fontSize: 48, color: 'warning.light', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }} gutterBottom>
                      Choose Rated Couriers
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      See LMT Scores and customer reviews for each courier. Compare prices and ratings to make the best choice for your shipment.
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Assessment sx={{ fontSize: 48, color: 'info.light', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }} gutterBottom>
                      Track All Your Shipments
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      View all your shipments in one dashboard. Real-time tracking updates, delivery notifications, and complete shipment history.
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <CheckCircle sx={{ fontSize: 48, color: 'success.light', mb: 2 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }} gutterBottom>
                      Easy Claims Process
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Lost or damaged package? File claims directly from your dashboard. Fast resolution and full support throughout the process.
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 4 }}>
            {[
              { icon: '📄', title: 'PDF Labels', desc: 'Print at home or show QR code' },
              { icon: '📱', title: 'QR Codes', desc: 'PostNord, Bring, Budbee supported' },
              { icon: '🚚', title: 'Multiple Couriers', desc: 'Choose best price and speed' },
              { icon: '📍', title: 'Real-Time Tracking', desc: 'Track every shipment' },
            ].map((feature) => (
              <Grid item xs={6} md={3} key={feature.title}>
                <Card sx={{ textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }, transition: 'all 0.3s' }}>
                  <CardContent>
                    <Typography variant="h3" sx={{ mb: 1 }}>{feature.icon}</Typography>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: 'grey.900', '&:hover': { bgcolor: 'grey.100' }, px: 6, py: 2 }}
              onClick={() => navigate('/register')}
            >
              Start Shipping Now
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Trust Badges */}
      <Box sx={{ bgcolor: 'grey.50', py: 4, borderTop: 1, borderBottom: 1, borderColor: 'grey.200' }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={4} justifyContent="center" flexWrap="wrap">
            {[
              { icon: <Security />, text: 'SSL Encrypted' },
              { icon: <CheckCircle />, text: 'GDPR Compliant' },
              { icon: <Star />, text: 'ISO 27001 Certified' },
              { icon: <CheckCircle />, text: 'PCI DSS Level 1' },
            ].map((badge, index) => (
              <Stack key={index} direction="row" spacing={1} alignItems="center">
                {React.cloneElement(badge.icon, { sx: { color: 'success.main' } })}
                <Typography fontWeight="600">{badge.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Partner Logos */}
      <Container maxWidth="lg" sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary" fontWeight="600" gutterBottom>
          Trusted by leading courier companies worldwide
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }} alignItems="center" justifyContent="center">
          {[
            { name: 'Bring', logo: '/courier-logos/bring_logo.jpeg' },
            { name: 'PostNord', logo: '/courier-logos/postnord_logo.jpeg' },
            { name: 'DHL', logo: '/courier-logos/dhl_logo.jpeg' },
            { name: 'Budbee', logo: '/courier-logos/budbee_logo.jpeg' },
            { name: 'Porterbuddy', logo: '/courier-logos/porterbuddy_logo.jpeg' },
            { name: 'Helthjem', logo: '/courier-logos/helthjem_logo.jpeg' },
            { name: 'Instabox', logo: '/courier-logos/instabox_logo.jpeg' },
            { name: 'Best Transport', logo: '/courier-logos/best_transport_logo.jpeg' },
          ].map((partner) => (
            <Grid item xs={6} sm={4} md={3} key={partner.name}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 80,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  style={{
                    maxHeight: '60px',
                    maxWidth: '100%',
                    objectFit: 'contain',
                    filter: 'grayscale(100%)',
                    opacity: 0.6,
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(100%)';
                    e.currentTarget.style.opacity = '0.6';
                  }}
                  onError={(e) => {
                    // Fallback to text if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<Typography variant="h6" color="text.secondary">${partner.name}</Typography>`;
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Demo Video */}
      <Box sx={{ bgcolor: 'primary.main', py: 10 }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" textAlign="center" color="white" gutterBottom>
            See Performile in Action
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
            Watch our 2-minute product tour
          </Typography>
          <Paper
            sx={{
              position: 'relative',
              paddingTop: '56.25%',
              bgcolor: 'grey.900',
              borderRadius: 2,
              overflow: 'hidden',
              cursor: 'pointer',
            }}
            onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              <IconButton
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'white',
                  '&:hover': { bgcolor: 'grey.100', transform: 'scale(1.1)' },
                  transition: 'all 0.3s',
                }}
              >
                <PlayArrow sx={{ fontSize: 48, color: 'primary.main' }} />
              </IconButton>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Product Screenshots - Real Platform */}
      <Container maxWidth="lg" sx={{ py: 12 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          See the Platform in Action
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Real screenshots from our live platform
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', '&:hover': { boxShadow: 8 }, transition: 'box-shadow 0.3s' }}>
              <CardMedia
                component="img"
                image="/screenshots/analytics-dashboard.png"
                alt="Analytics Dashboard"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'grey.200',
                  objectFit: 'cover',
                  height: 300,
                }}
                onError={(e) => {
                  // Fallback if screenshot doesn't exist
                  e.currentTarget.style.display = 'none';
                }}
              />
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Assessment sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Advanced Analytics Dashboard
                  </Typography>
                </Stack>
                <Typography color="text.secondary" paragraph>
                  Real-time performance metrics with heatmap visualization. See courier performance by postal code, market, and time period.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="Heatmap View" size="small" />
                  <Chip label="Market Analysis" size="small" />
                  <Chip label="Real-Time Data" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', '&:hover': { boxShadow: 8 }, transition: 'box-shadow 0.3s' }}>
              <CardMedia
                component="img"
                image="/screenshots/subscription-management.png"
                alt="Subscription Management"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'grey.200',
                  objectFit: 'cover',
                  height: 300,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Business sx={{ color: 'success.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    Subscription Management
                  </Typography>
                </Stack>
                <Typography color="text.secondary" paragraph>
                  Easy plan management for merchants and couriers. View features, pricing, and upgrade options all in one place.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="Plan Comparison" size="small" />
                  <Chip label="Easy Upgrades" size="small" />
                  <Chip label="Feature Overview" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', '&:hover': { boxShadow: 8 }, transition: 'box-shadow 0.3s' }}>
              <CardMedia
                component="img"
                image="/screenshots/my-subscription.png"
                alt="My Subscription"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'grey.200',
                  objectFit: 'cover',
                  height: 300,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Person sx={{ color: 'info.main' }} />
                  <Typography variant="h6" fontWeight="bold">
                    User Dashboard
                  </Typography>
                </Stack>
                <Typography color="text.secondary" paragraph>
                  Track your usage, view statistics, and manage your subscription. Clear visibility of orders, limits, and billing.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="Usage Stats" size="small" />
                  <Chip label="Billing History" size="small" />
                  <Chip label="Order Tracking" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 4 }}>
                <Smartphone sx={{ fontSize: 60, mb: 3, opacity: 0.9 }} />
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Mobile Apps Coming Soon
                </Typography>
                <Typography variant="body1" paragraph sx={{ opacity: 0.9 }}>
                  Native iOS and Android apps with QR code scanning, real-time tracking, and C2C shipping.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="QR Scanner" sx={{ bgcolor: 'white', color: 'primary.main' }} size="small" />
                  <Chip label="Push Notifications" sx={{ bgcolor: 'white', color: 'primary.main' }} size="small" />
                  <Chip label="Offline Mode" sx={{ bgcolor: 'white', color: 'primary.main' }} size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography fontWeight="600" gutterBottom>
              All Features Included
            </Typography>
            <Typography variant="body2">
              These are real screenshots from our production platform. What you see is what you get!
            </Typography>
          </Alert>
        </Box>
      </Container>

      {/* Testimonials */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Trusted by Thousands
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          See what our customers say about Performile
        </Typography>

        <Grid container spacing={4}>
          {[
            { name: 'Sarah Johnson', role: 'CEO, Fashion Retailer', rating: 5, text: 'Performile transformed our delivery operations. We reduced shipping costs by 35% and customer satisfaction increased to 98%.' },
            { name: 'Lars Andersson', role: 'Operations Manager, SwiftDelivery', rating: 5, text: 'As a courier company, Performile\'s route optimization saved us 30% in fuel costs. Best investment we\'ve made.' },
            { name: 'Emma Nielsen', role: 'Founder, Copenhagen Electronics', rating: 5, text: 'The WooCommerce plugin installed in 5 minutes. Revenue increased 25% in 3 months!' },
          ].map((testimonial, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Rating value={testimonial.rating} readOnly sx={{ mb: 2 }} />
                  <Typography variant="body1" paragraph>
                    "{testimonial.text}"
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    {testimonial.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonial.role}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Chip
            icon={<Star sx={{ color: 'success.main' }} />}
            label="4.9/5 average rating • 2,500+ reviews"
            sx={{ bgcolor: 'success.50', color: 'success.dark', fontWeight: 600 }}
          />
        </Box>
      </Container>

      {/* Feature Comparison - What Competitors Are Missing */}
      <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Chip
              icon={<TrendingDown />}
              label="Save up to 85% vs competitors"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
            What Competitors Are Missing
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            See why Performile is the only complete solution
          </Typography>

          {/* Feature Comparison Table */}
          <TableContainer component={Paper} sx={{ mb: 6 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>Feature</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>Traditional Courier</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>ShipStation</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold', bgcolor: 'primary.dark' }}>Performile</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { feature: 'Dynamic Checkout (Changes by Postal Code)', traditional: false, shipstation: false, performile: true, highlight: true },
                  { feature: 'Real-Time LMT Score & Ratings', traditional: false, shipstation: false, performile: true, highlight: true },
                  { feature: 'Postal Code-Specific ETA', traditional: false, shipstation: false, performile: true, highlight: true },
                  { feature: 'Predictive Delivery Times (14:00-17:00)', traditional: false, shipstation: false, performile: true, highlight: true },
                  { feature: 'Consumer Choice at Checkout', traditional: false, shipstation: false, performile: true, highlight: true },
                  { feature: 'Weighted Courier List', traditional: false, shipstation: false, performile: true, highlight: true },
                  { feature: 'Multi-Courier Support', traditional: false, shipstation: true, performile: true },
                  { feature: 'Global Courier Integrations', traditional: false, shipstation: false, performile: true },
                  { feature: 'C2C Shipping Platform', traditional: false, shipstation: false, performile: true },
                  { feature: 'Claims & RMA System', traditional: false, shipstation: false, performile: true },
                  { feature: 'Mobile Apps (iOS & Android)', traditional: false, shipstation: false, performile: true },
                  { feature: 'Advanced Analytics', traditional: false, shipstation: false, performile: true },
                  { feature: 'Lead Generation (B2B)', traditional: false, shipstation: false, performile: true },
                  { feature: 'Consumer Dashboard', traditional: false, shipstation: false, performile: true },
                ].map((row, index) => (
                  <TableRow 
                    key={index}
                    sx={{ 
                      bgcolor: row.highlight ? 'warning.50' : 'white',
                      '&:hover': { bgcolor: row.highlight ? 'warning.100' : 'grey.50' }
                    }}
                  >
                    <TableCell sx={{ fontWeight: row.highlight ? 'bold' : 'normal' }}>
                      {row.feature}
                      {row.highlight && <Chip label="UNIQUE" size="small" color="warning" sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell align="center">
                      {row.traditional ? (
                        <CheckCircle sx={{ color: 'success.main' }} />
                      ) : (
                        <Close sx={{ color: 'error.main' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {row.shipstation ? (
                        <CheckCircle sx={{ color: 'success.main' }} />
                      ) : (
                        <Close sx={{ color: 'error.main' }} />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ bgcolor: row.highlight ? 'success.50' : 'success.100' }}>
                      <CheckCircle sx={{ color: 'success.main', fontSize: 28 }} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.900' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>Monthly Price</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>$199/mo</TableCell>
                  <TableCell align="center" sx={{ color: 'white', fontWeight: 'bold' }}>$149/mo</TableCell>
                  <TableCell align="center" sx={{ color: 'success.light', fontWeight: 'bold', fontSize: '1.2rem' }}>$29/mo</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Key Differentiators */}
          <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom sx={{ mt: 6, mb: 4 }}>
            Our Unique Advantages
          </Typography>
          
          <Grid container spacing={3}>
            {[
              {
                title: 'Dynamic Checkout',
                desc: 'Checkout changes in real-time based on postal code. Shows different couriers, ratings, and ETAs for each location.',
                icon: '🔄',
                color: 'primary.main'
              },
              {
                title: 'LMT Score Integration',
                desc: 'Real-time courier ratings displayed at checkout. Consumers see performance data before choosing.',
                icon: '⭐',
                color: 'warning.main'
              },
              {
                title: 'Predictive ETA',
                desc: 'Shows "Usually delivered 14:00-17:00" based on postal code history. No competitor does this.',
                icon: '🕐',
                color: 'success.main'
              },
              {
                title: 'Consumer Choice',
                desc: 'Weighted list lets consumers choose their preferred courier. Transparent, fair, increases conversion.',
                icon: '✅',
                color: 'info.main'
              },
            ].map((item, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', borderLeft: 4, borderColor: item.color }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Typography variant="h3">{item.icon}</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {item.title}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary">
                      {item.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Alert severity="success" sx={{ maxWidth: 600, mx: 'auto', fontSize: '1.1rem' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Only Performile Has It All
              </Typography>
              <Typography>
                Dynamic checkout + Real-time ratings + Predictive ETA + Consumer choice = Better conversion rates
              </Typography>
            </Alert>
          </Box>
        </Container>
      </Box>

      {/* ROI Calculator */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Calculate sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Calculate Your Savings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            See how much you can save with Performile
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Your Current Situation
                </Typography>
                <Stack spacing={3} sx={{ mt: 3 }}>
                  <TextField
                    label="Monthly Orders"
                    type="number"
                    value={roiInputs.monthlyOrders}
                    onChange={(e) => setRoiInputs({ ...roiInputs, monthlyOrders: parseInt(e.target.value) || 0 })}
                    fullWidth
                  />
                  <TextField
                    label="Average Order Value ($)"
                    type="number"
                    value={roiInputs.avgOrderValue}
                    onChange={(e) => setRoiInputs({ ...roiInputs, avgOrderValue: parseInt(e.target.value) || 0 })}
                    fullWidth
                  />
                  <TextField
                    label="Current Shipping Cost per Order ($)"
                    type="number"
                    value={roiInputs.currentShippingCost}
                    onChange={(e) => setRoiInputs({ ...roiInputs, currentShippingCost: parseInt(e.target.value) || 0 })}
                    fullWidth
                  />
                  <TextField
                    label="Processing Time per Order (minutes)"
                    type="number"
                    value={roiInputs.currentProcessingTime}
                    onChange={(e) => setRoiInputs({ ...roiInputs, currentProcessingTime: parseInt(e.target.value) || 0 })}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'success.main', color: 'white', height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                  <TrendingUp sx={{ fontSize: 32 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Your Potential Savings
                  </Typography>
                </Stack>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Monthly Savings</Typography>
                    <Typography variant="h3" fontWeight="bold">
                      ${results.monthlySavings.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Annual Savings</Typography>
                    <Typography variant="h4" fontWeight="bold">
                      ${results.annualSavings.toLocaleString()}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)' }} />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Return on Investment</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {results.roi.toFixed(0)}% ROI
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">Current Monthly Cost</Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ${results.currentMonthlyCost.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: 'success.50' }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">With Performile</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.dark">
                      ${results.performileMonthlyCost.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>

      {/* Newsletter */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 10 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Email sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Stay Updated with Performile
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Get the latest features, tips, and industry insights
            </Typography>
          </Box>

          {newsletterSuccess ? (
            <Alert severity="success" sx={{ maxWidth: 600, mx: 'auto' }}>
              <Typography variant="h6" gutterBottom>You're subscribed!</Typography>
              <Typography>Check your inbox for a confirmation email.</Typography>
            </Alert>
          ) : (
            <Box component="form" onSubmit={handleNewsletterSignup} sx={{ maxWidth: 600, mx: 'auto' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  fullWidth
                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' }, whiteSpace: 'nowrap' }}
                  endIcon={<ArrowForward />}
                >
                  Subscribe
                </Button>
              </Stack>
              <Typography variant="body2" sx={{ mt: 2, opacity: 0.8, textAlign: 'center' }}>
                Join 10,000+ subscribers • No spam • Unsubscribe anytime
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* FAQ */}
      <Container maxWidth="md" sx={{ py: 10 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Frequently Asked Questions
        </Typography>
        <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Everything you need to know about Performile
        </Typography>

        {[
          { q: 'How quickly can I get started?', a: 'You can start shipping in less than 10 minutes! Sign up, install our plugin (if using e-commerce), and you\'re ready to go.' },
          { q: 'What payment methods do you support?', a: 'We support global payment methods including Vipps, Swish, MobilePay, Stripe, Klarna, Qliro, Adyen, Worldpay, and more. Easy integration with your preferred payment provider.' },
          { q: 'Do you offer mobile apps?', a: 'Yes! We have native iOS and Android apps for consumers with features like real-time tracking, C2C shipping, claims, and returns.' },
          { q: 'How does pricing work?', a: 'We offer flexible subscription plans starting at $29/month. Consumers can use the platform for free. C2C shipping has transparent per-shipment fees.' },
        ].map((faq, index) => (
          <Accordion key={index} expanded={openFaq === index} onChange={() => setOpenFaq(openFaq === index ? null : index)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography fontWeight="600">{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>

      {/* Final CTA */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 10, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Transform Your Delivery Operations?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.8 }}>
            Join 50,000+ users who trust Performile for their delivery needs
          </Typography>
          <Button
            variant="contained"
            size="large"
            color="primary"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/register')}
            sx={{ px: 6, py: 2 }}
          >
            Start Your Free Trial
          </Button>
          <Typography variant="body2" sx={{ mt: 3, opacity: 0.6 }}>
            No credit card required • 14-day free trial • Cancel anytime
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
