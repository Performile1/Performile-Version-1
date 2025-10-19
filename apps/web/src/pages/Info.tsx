/**
 * Info/About Page
 * Information about Performile platform
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Button,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Verified,
  Speed,
  Assessment,
  Security,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const Info: React.FC = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Transparency',
      description: 'We believe in complete transparency in delivery performance metrics.',
    },
    {
      icon: <People sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Customer First',
      description: 'Every decision we make is centered around improving customer experience.',
    },
    {
      icon: <Verified sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Trust',
      description: 'Building trust through verified reviews and authentic performance data.',
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: '#667eea' }} />,
      title: 'Innovation',
      description: 'Continuously improving our platform with cutting-edge technology.',
    },
  ];

  const team = [
    {
      role: 'For Merchants',
      description: 'Optimize your delivery operations with data-driven insights and performance analytics.',
      features: [
        'Real-time delivery tracking',
        'Performance analytics dashboard',
        'Courier comparison tools',
        'Customer satisfaction metrics',
      ],
    },
    {
      role: 'For Couriers',
      description: 'Build your reputation and grow your business with transparent performance ratings.',
      features: [
        'TrustScore system',
        'Performance tracking',
        'Customer reviews',
        'Business analytics',
      ],
    },
    {
      role: 'For Customers',
      description: 'Make informed decisions about delivery services based on real performance data.',
      features: [
        'Transparent ratings',
        'Delivery tracking',
        'Service comparisons',
        'Review system',
      ],
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight="bold" gutterBottom>
            About Performile
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            The Last Mile Performance Index
          </Typography>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Our Mission
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
              Performile is revolutionizing last-mile delivery by providing transparent, data-driven
              performance metrics that benefit everyone in the delivery ecosystem.
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
              We believe that transparency in delivery performance leads to better service, happier
              customers, and more efficient operations for merchants and couriers alike.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
              Our TrustScore system provides an unbiased view of delivery service performance,
              helping customers make informed decisions and encouraging continuous improvement
              across the industry.
            </Typography>
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
                  width: '250px',
                  height: '250px',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Values Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
            Our Values
          </Typography>
          <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            The principles that guide everything we do
          </Typography>

          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box mb={2}>{value.icon}</Box>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Who We Serve Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" fontWeight="bold" textAlign="center" gutterBottom>
          Who We Serve
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
          Performile is built for everyone in the delivery ecosystem
        </Typography>

        <Grid container spacing={4}>
          {team.map((item, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
                    {item.role}
                  </Typography>
                  <Typography variant="body1" paragraph color="text.secondary">
                    {item.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1}>
                    {item.features.map((feature, idx) => (
                      <Typography key={idx} variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Verified sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                        {feature}
                      </Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Technology Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Built with Modern Technology
              </Typography>
              <Typography variant="body1" paragraph>
                Performile is built on a robust, scalable architecture using the latest technologies:
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Real-Time Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Advanced analytics engine processing millions of data points to provide accurate performance metrics.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Enterprise Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bank-level encryption and security protocols to protect your data and transactions.
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
                    High Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Optimized infrastructure ensuring fast load times and real-time updates.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Platform Statistics
                  </Typography>
                  <Stack spacing={3} sx={{ mt: 3 }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        10,000+
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Deliveries Tracked
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        500+
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Active Merchants
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        98%
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Customer Satisfaction
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Card
          sx={{
            p: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Ready to Join Performile?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Start optimizing your delivery performance today
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
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
        </Card>
      </Container>
    </Box>
  );
};

export default Info;
