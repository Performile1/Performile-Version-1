import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface SubscriptionPlan {
  subscription_plan_id: number;
  plan_name: string;
  description: string;
  price_per_month: number;
  price_per_year: number;
  user_type: 'merchant' | 'courier';
  features: string[];
  is_popular?: boolean;
  stripe_price_id_monthly?: string;
  stripe_price_id_yearly?: string;
}

export const SubscriptionPlans: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  // Fetch subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans', user?.user_role],
    queryFn: async () => {
      const response = await apiClient.get('/admin/subscriptions');
      const allPlans = response.data.plans || [];
      // Filter by user role
      return allPlans.filter((p: SubscriptionPlan) => p.user_type === user?.user_role);
    },
    enabled: !!user,
  });

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoadingPlanId(plan.subscription_plan_id);

    try {
      // Create Stripe checkout session
      const priceId = billingCycle === 'monthly' 
        ? plan.stripe_price_id_monthly 
        : plan.stripe_price_id_yearly;

      if (!priceId) {
        toast.error('Payment configuration not available for this plan');
        setLoadingPlanId(null);
        return;
      }

      const response = await apiClient.post('/payments/create-checkout-session', {
        price_id: priceId,
        plan_id: plan.subscription_plan_id,
        success_url: `${window.location.origin}/subscription/success`,
        cancel_url: `${window.location.origin}/subscription/cancel`,
      });

      // Redirect to Stripe Checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        toast.error('Failed to create checkout session');
        setLoadingPlanId(null);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.message || 'Failed to start checkout');
      setLoadingPlanId(null);
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.price_per_month : plan.price_per_year;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyCost = plan.price_per_month * 12;
    const yearlyCost = plan.price_per_year;
    const savings = monthlyCost - yearlyCost;
    const percentage = Math.round((savings / monthlyCost) * 100);
    return { amount: savings, percentage };
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
            Choose Your Plan
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            Start optimizing your delivery performance today
          </Typography>

          {/* Billing Cycle Toggle */}
          <ToggleButtonGroup
            value={billingCycle}
            exclusive
            onChange={(_, value) => value && setBillingCycle(value)}
            sx={{
              background: 'white',
              '& .MuiToggleButton-root': {
                px: 4,
                py: 1.5,
                border: 'none',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }
                }
              }
            }}
          >
            <ToggleButton value="monthly">
              Monthly
            </ToggleButton>
            <ToggleButton value="yearly">
              Yearly
              <Chip 
                label="Save up to 20%" 
                size="small" 
                color="success" 
                sx={{ ml: 1, height: 20 }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Plans Grid */}
        {plans && plans.length > 0 ? (
          <Grid container spacing={4} justifyContent="center">
            {plans.map((plan: SubscriptionPlan) => {
              const savings = getSavings(plan);
              const isPopular = plan.is_popular;
              
              return (
                <Grid item xs={12} md={4} key={plan.subscription_plan_id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transform: isPopular ? 'scale(1.05)' : 'scale(1)',
                      transition: 'transform 0.3s',
                      border: isPopular ? '3px solid #667eea' : 'none',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 6,
                      }
                    }}
                  >
                    {isPopular && (
                      <Chip
                        icon={<StarIcon />}
                        label="Most Popular"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontWeight: 'bold',
                        }}
                      />
                    )}

                    <CardContent sx={{ flexGrow: 1, p: 4 }}>
                      {/* Plan Name */}
                      <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
                        {plan.plan_name}
                      </Typography>

                      {/* Price */}
                      <Box sx={{ textAlign: 'center', my: 3 }}>
                        <Typography variant="h3" color="primary" fontWeight="bold">
                          ${getPrice(plan)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          per {billingCycle === 'monthly' ? 'month' : 'year'}
                        </Typography>
                        {billingCycle === 'yearly' && savings.amount > 0 && (
                          <Chip
                            label={`Save $${savings.amount}/year (${savings.percentage}%)`}
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        {plan.description}
                      </Typography>

                      {/* Features */}
                      <List dense>
                        {plan.features?.map((feature: string, index: number) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CheckIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary={feature} />
                          </ListItem>
                        ))}
                      </List>

                      {/* CTA Button */}
                      <Button
                        fullWidth
                        variant={isPopular ? 'contained' : 'outlined'}
                        size="large"
                        onClick={() => handleSelectPlan(plan)}
                        disabled={loadingPlanId === plan.subscription_plan_id}
                        sx={{ mt: 3 }}
                      >
                        {loadingPlanId === plan.subscription_plan_id ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Get Started'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Alert severity="info" sx={{ maxWidth: 600, mx: 'auto' }}>
            <Typography variant="body1">
              No subscription plans available at the moment. Please contact support.
            </Typography>
          </Alert>
        )}

        {/* Features Comparison */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 3 }}>
            All Plans Include
          </Typography>
          <Grid container spacing={3} justifyContent="center">
            {[
              'Real-time tracking',
              'Performance analytics',
              'TrustScore ratings',
              'Email notifications',
              'API access',
              '24/7 support',
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <TrendingUpIcon sx={{ color: 'white' }} />
                  <Typography sx={{ color: 'white' }}>{feature}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ or Contact */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 2 }}>
            Need a custom plan or have questions?
          </Typography>
          <Button
            variant="outlined"
            sx={{
              color: 'white',
              borderColor: 'white',
              '&:hover': {
                borderColor: 'white',
                background: 'rgba(255,255,255,0.1)',
              }
            }}
            onClick={() => navigate('/contact')}
          >
            Contact Sales
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default SubscriptionPlans;
