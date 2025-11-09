import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
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
            for the Nordic Region
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
            { icon: <AttachMoney />, title: 'Multi-Payment Support', description: 'Vipps, Swish, MobilePay, Stripe - all major Nordic payments', color: '#4caf50' },
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
                  🏆 The most accurate courier rating in the Nordic region
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
              <CardContent>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  8 Claim Types Supported
                </Typography>
                <Stack spacing={2} sx={{ mt: 3 }}>
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
                    <Stack key={claim.type} direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6">{claim.icon}</Typography>
                      <Typography>{claim.type}</Typography>
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
                  <LocalShipping sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Pickup Scheduling
                  </Typography>
                  <Typography color="text.secondary">
                    Schedule courier pickup for returns. No need to go to drop-off location. Convenient for consumers.
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

      {/* C2C Shipping - REVENUE DRIVER */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 12 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
            Consumer-to-Consumer Shipping
          </Typography>
          <Typography variant="h6" textAlign="center" sx={{ mb: 2, opacity: 0.9 }}>
            Send packages to friends, family, or sell online
          </Typography>
          <Typography variant="h5" textAlign="center" color="success.light" fontWeight="bold" sx={{ mb: 6 }}>
            €6M ARR Potential by Year 5
          </Typography>

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }} gutterBottom>
                      How It Works
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {[
                        'Consumer creates shipment on Performile',
                        'Pays upfront (Performile keeps 20-30% margin)',
                        'Gets PDF label with QR code',
                        'Drops off at courier location',
                        'Real-time tracking included',
                        'Performile pays courier',
                      ].map((step, idx) => (
                        <Stack key={idx} direction="row" spacing={2} alignItems="center">
                          <Chip label={idx + 1} sx={{ bgcolor: 'success.main', color: 'white' }} size="small" />
                          <Typography sx={{ color: 'white' }}>{step}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                <Alert severity="success">
                  <Typography fontWeight="600" gutterBottom>High-Margin Revenue Stream</Typography>
                  <Typography variant="body2">
                    20-30% margin on every shipment. Transaction-based revenue that scales with volume.
                  </Typography>
                </Alert>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Example Pricing
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Courier Base Price:</Typography>
                    <Typography fontWeight="bold">€10.00</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography>Performile Margin (25%):</Typography>
                    <Typography fontWeight="bold" color="success.main">+€2.50</Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">Consumer Pays:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">€12.50</Typography>
                  </Stack>
                </Stack>

                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Revenue Projections:
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">Year 1: €30K ARR</Typography>
                    <Typography variant="body2">Year 2: €300K ARR</Typography>
                    <Typography variant="body2">Year 3: €1.5M ARR</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">Year 5: €6M ARR</Typography>
                  </Stack>
                </Box>
              </Paper>
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
                <Card sx={{ textAlign: 'center', bgcolor: 'rgba(255,255,255,0.05)' }}>
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
          Trusted by leading Nordic courier companies
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2, opacity: 0.6 }}>
          {['Bring', 'PostNord', 'DHL', 'Budbee', 'Porterbuddy', 'Helthjem', 'Instabox', 'Best Transport'].map((partner) => (
            <Grid item xs={6} md={3} key={partner}>
              <Typography variant="h5" fontWeight="bold" color="text.secondary">
                {partner}
              </Typography>
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
            { name: 'Sarah Johnson', role: 'CEO, Nordic Fashion', rating: 5, text: 'Performile transformed our delivery operations. We reduced shipping costs by 35% and customer satisfaction increased to 98%.' },
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

      {/* Pricing Comparison */}
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
            Why Pay More?
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Compare Performile with traditional solutions
          </Typography>

          <Grid container spacing={4}>
            {[
              { name: 'Traditional Courier', price: '$199/mo', features: ['Single courier', 'Manual labels', 'Basic tracking', 'No multi-courier', 'No real-time rates', 'No mobile apps', 'No analytics', 'No API'] },
              { name: 'ShipStation', price: '$149/mo', features: ['Multi-carrier', 'Label printing', 'Basic tracking', 'No Nordic couriers', 'Real-time rates', 'No mobile apps', 'No advanced analytics', 'No C2C'] },
              { name: 'Performile', price: '$29/mo', features: ['Multi-courier', 'Automated labels', 'Real-time tracking', 'Nordic specialists', 'Dynamic pricing', 'Native mobile apps', 'Advanced analytics', 'C2C shipping'], highlight: true, savings: '$120/mo' },
            ].map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    ...(plan.highlight && {
                      border: 4,
                      borderColor: 'primary.main',
                      transform: 'scale(1.05)',
                      boxShadow: 8,
                    }),
                  }}
                >
                  <CardContent>
                    {plan.highlight && (
                      <Chip label="BEST VALUE" color="warning" sx={{ mb: 2, fontWeight: 'bold' }} />
                    )}
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
                      {plan.price}
                    </Typography>
                    {plan.savings && (
                      <Typography variant="body2" color="success.main" fontWeight="600" gutterBottom>
                        Save {plan.savings}
                      </Typography>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack spacing={1}>
                      {plan.features.map((feature, idx) => (
                        <Stack key={idx} direction="row" spacing={1} alignItems="center">
                          <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                    <Button
                      variant={plan.highlight ? 'contained' : 'outlined'}
                      fullWidth
                      sx={{ mt: 3 }}
                      disabled={!plan.highlight}
                    >
                      {plan.highlight ? 'Start Free Trial' : 'Not Available'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
          { q: 'What payment methods do you support?', a: 'We support all major Nordic payment methods including Vipps, Swish, MobilePay, and Stripe for global coverage.' },
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
