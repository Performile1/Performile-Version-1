import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  LocalShipping as ShippingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface PricingPlan {
  plan_id: string;
  plan_name: string;
  user_role: 'merchant' | 'courier';
  price_monthly: number;
  price_yearly: number;
  features_json: {
    analytics?: boolean;
    marketplace?: boolean;
    integrations?: number;
    custom_branding?: boolean;
    priority_support?: boolean;
    [key: string]: any;
  };
  is_active: boolean;
}

const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'merchant' | 'courier'>('merchant');
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/subscriptions/plans');
        if (response.data.success) {
          setPlans(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback to hardcoded plans if API fails
        setPlans(fallbackPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Fallback plans in case API fails
  const fallbackPlans: PricingPlan[] = [
    {
      plan_id: '5b11cb84-ad36-440c-a427-5c91cb675e54',
      plan_name: 'Basic Merchant',
      user_role: 'merchant',
      price_monthly: 29.99,
      price_yearly: 299.99,
      features_json: {
        analytics: true,
        integrations: 3,
      },
      is_active: true,
    },
    {
      plan_id: 'bd63a4f5-3a5c-4bcf-b962-da880b649b02',
      plan_name: 'Pro Merchant',
      user_role: 'merchant',
      price_monthly: 79.99,
      price_yearly: 799.99,
      features_json: {
        analytics: true,
        integrations: 10,
        custom_branding: true,
      },
      is_active: true,
    },
    {
      plan_id: 'c20d6a21-507a-4674-aa29-a0f7e3cda5fe',
      plan_name: 'Basic Courier',
      user_role: 'courier',
      price_monthly: 19.99,
      price_yearly: 199.99,
      features_json: {
        analytics: true,
        marketplace: true,
      },
      is_active: true,
    },
    {
      plan_id: '972d92eb-53b4-4015-98db-5d280eeea51b',
      plan_name: 'Pro Courier',
      user_role: 'courier',
      price_monthly: 49.99,
      price_yearly: 499.99,
      features_json: {
        analytics: true,
        marketplace: true,
        priority_support: true,
      },
      is_active: true,
    },
  ];

  const filteredPlans = plans.filter(plan => plan.user_role === selectedRole);

  const getFeaturesList = (features: any, role: string) => {
    const featureList: string[] = [];

    if (role === 'merchant') {
      featureList.push('Order tracking & management');
      featureList.push('Review collection automation');
      if (features.analytics) featureList.push('Advanced analytics dashboard');
      if (features.integrations) featureList.push(`${features.integrations} e-commerce integrations`);
      if (features.custom_branding) featureList.push('Custom branding & white-label');
      featureList.push('Email notifications');
      if (features.integrations && features.integrations > 3) {
        featureList.push('Priority email support');
        featureList.push('API access');
      }
    } else {
      featureList.push('TrustScore™ profile');
      featureList.push('Performance analytics');
      if (features.marketplace) featureList.push('Marketplace visibility');
      if (features.analytics) featureList.push('Customer review insights');
      if (features.priority_support) {
        featureList.push('Priority support');
        featureList.push('Featured listing');
        featureList.push('API access');
      }
      featureList.push('Lead notifications');
    }

    return featureList;
  };

  const calculateSavings = (monthly: number, yearly: number) => {
    const monthlyCost = monthly * 12;
    const savings = monthlyCost - yearly;
    const savingsPercent = Math.round((savings / monthlyCost) * 100);
    return { savings, savingsPercent };
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    // If user is logged in, go to subscription page, otherwise register
    if (user) {
      navigate('/subscription/plans');
    } else {
      navigate(`/register?plan=${plan.plan_id}&role=${plan.user_role}`);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" gutterBottom fontWeight="bold">
            Choose Your Plan
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Transparent pricing for merchants and couriers
          </Typography>

          {/* Role Selector */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <Button
              variant={selectedRole === 'merchant' ? 'contained' : 'outlined'}
              size="large"
              startIcon={<StoreIcon />}
              onClick={() => setSelectedRole('merchant')}
              sx={{ minWidth: 200 }}
            >
              I'm a Merchant
            </Button>
            <Button
              variant={selectedRole === 'courier' ? 'contained' : 'outlined'}
              size="large"
              startIcon={<ShippingIcon />}
              onClick={() => setSelectedRole('courier')}
              sx={{ minWidth: 200 }}
            >
              I'm a Courier
            </Button>
          </Box>

          {/* Billing Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" color={!isAnnual ? 'primary' : 'text.secondary'}>
              Monthly
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={isAnnual}
                  onChange={(e) => setIsAnnual(e.target.checked)}
                  color="primary"
                />
              }
              label=""
            />
            <Typography variant="body1" color={isAnnual ? 'primary' : 'text.secondary'}>
              Annual
            </Typography>
            {isAnnual && (
              <Chip
                label="Save up to 17%"
                color="success"
                size="small"
                icon={<TrendingUpIcon />}
              />
            )}
          </Box>
        </Box>

        {/* Pricing Cards */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Grid container spacing={4} justifyContent="center">
            {filteredPlans.map((plan, index) => {
            const isPopular = index === 1; // Pro plans are popular
            const price = isAnnual ? plan.price_yearly : plan.price_monthly;
            const billingPeriod = isAnnual ? 'year' : 'month';
            const features = getFeaturesList(plan.features_json, plan.user_role);
            const savings = isAnnual ? calculateSavings(plan.price_monthly, plan.price_yearly) : null;

            return (
              <Grid item xs={12} md={6} key={plan.plan_id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isPopular ? 2 : 1,
                    borderColor: isPopular ? 'primary.main' : 'divider',
                    transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: isPopular ? 'scale(1.07)' : 'scale(1.02)',
                      boxShadow: 6,
                    },
                  }}
                >
                  {isPopular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                      }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1, p: 4 }}>
                    {/* Plan Name */}
                    <Typography variant="h4" gutterBottom fontWeight="bold">
                      {plan.plan_name}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ my: 3 }}>
                      <Typography variant="h3" component="span" fontWeight="bold" color="primary">
                        ${price}
                      </Typography>
                      <Typography variant="h6" component="span" color="text.secondary">
                        /{billingPeriod}
                      </Typography>
                      {savings && (
                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                          Save ${savings.savings.toFixed(2)}/year ({savings.savingsPercent}% off)
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    {/* Features List */}
                    <List dense>
                      {features.map((feature, idx) => (
                        <ListItem key={idx} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <CheckIcon color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'body2',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {/* CTA Button */}
                    <Button
                      variant={isPopular ? 'contained' : 'outlined'}
                      size="large"
                      fullWidth
                      onClick={() => handleSelectPlan(plan)}
                      sx={{ mt: 3 }}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          </Grid>
        )}

        {/* FAQ / Additional Info */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            All plans include
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">✓ 14-day free trial</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">✓ Cancel anytime</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body1">✓ No credit card required</Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Need a custom plan for your enterprise?{' '}
              <Button variant="text" onClick={() => navigate('/contact')}>
                Contact us
              </Button>
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Pricing;
