import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Upgrade,
  CheckCircle,
  Warning,
  Receipt,
  CreditCard,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface SubscriptionData {
  plan_name: string;
  plan_slug: string;
  user_type: 'merchant' | 'courier';
  tier: number;
  monthly_price: number;
  annual_price: number;
  billing_cycle: 'monthly' | 'yearly';
  status: string;
  current_period_start: string;
  current_period_end: string;
  max_orders_per_month: number | null;
  max_emails_per_month: number | null;
  max_shops: number | null;
  max_couriers: number | null;
  max_team_members: number | null;
  orders_used_this_month: number;
  cancel_at_period_end: boolean;
}

export const MySubscription: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/subscriptions/my-subscription');
      setSubscription(response.data.subscription);
    } catch (error: any) {
      console.error('Failed to fetch subscription:', error);
      setError(error.response?.data?.message || 'Failed to load subscription');
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'default';
      case 2: return 'primary';
      case 3: return 'success';
      case 4: return 'secondary';
      default: return 'default';
    }
  };

  const getUsagePercentage = (used: number, max: number | null) => {
    if (max === null) return 0;
    return Math.min((used / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const handleManageBilling = () => {
    navigate('/billing-portal');
  };

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !subscription) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'No active subscription found'}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/subscription/plans')}>
          View Available Plans
        </Button>
      </Container>
    );
  }

  const ordersPercentage = getUsagePercentage(
    subscription.orders_used_this_month,
    subscription.max_orders_per_month
  );

  const canUpgrade = subscription.tier < 4;
  const nextRenewal = new Date(subscription.current_period_end).toLocaleDateString();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Subscription
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your subscription plan and billing
        </Typography>
      </Box>

      {/* Cancellation Warning */}
      {subscription.cancel_at_period_end && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your subscription will be cancelled on {nextRenewal}. You'll still have access until then.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Plan Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {subscription.plan_name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`Tier ${subscription.tier}`}
                      color={getTierColor(subscription.tier)}
                      size="small"
                    />
                    <Chip
                      label={subscription.user_type === 'merchant' ? '💼 Merchant' : '🚗 Courier'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={subscription.status}
                      color={subscription.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4" color="primary">
                    ${subscription.billing_cycle === 'monthly' ? subscription.monthly_price : subscription.annual_price}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per {subscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Usage Statistics */}
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Usage This Month
              </Typography>

              <Grid container spacing={2}>
                {/* Orders Usage */}
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Orders
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">
                      {subscription.orders_used_this_month}
                      {subscription.max_orders_per_month !== null && ` / ${subscription.max_orders_per_month}`}
                    </Typography>
                    {subscription.max_orders_per_month === null && (
                      <Chip label="Unlimited" size="small" color="success" />
                    )}
                  </Box>
                  {subscription.max_orders_per_month !== null && (
                    <LinearProgress
                      variant="determinate"
                      value={ordersPercentage}
                      color={getUsageColor(ordersPercentage)}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  )}
                </Grid>

                {/* Plan Limits */}
                {subscription.user_type === 'merchant' && (
                  <>
                    <Grid item xs={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Max Shops
                      </Typography>
                      <Typography variant="h6">
                        {subscription.max_shops === null ? '∞' : subscription.max_shops}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} md={4}>
                      <Typography variant="body2" color="text.secondary">
                        Max Couriers
                      </Typography>
                      <Typography variant="h6">
                        {subscription.max_couriers === null ? '∞' : subscription.max_couriers}
                      </Typography>
                    </Grid>
                  </>
                )}

                {subscription.user_type === 'courier' && (
                  <Grid item xs={6} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Max Team Members
                    </Typography>
                    <Typography variant="h6">
                      {subscription.max_team_members === null ? '∞' : subscription.max_team_members}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={6} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Max Emails/Month
                  </Typography>
                  <Typography variant="h6">
                    {subscription.max_emails_per_month === null ? '∞' : subscription.max_emails_per_month}
                  </Typography>
                </Grid>
              </Grid>

              {/* Upgrade Warning */}
              {ordersPercentage >= 75 && canUpgrade && (
                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning />
                    <Typography variant="body2">
                      You're approaching your plan limits. Consider upgrading to avoid service interruption.
                    </Typography>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Actions Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {canUpgrade && (
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Upgrade />}
                    onClick={handleUpgrade}
                  >
                    Upgrade Plan
                  </Button>
                )}

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CreditCard />}
                  onClick={handleManageBilling}
                >
                  Manage Billing
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Receipt />}
                  onClick={() => navigate('/billing-portal')}
                >
                  View Invoices
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Next Renewal
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {nextRenewal}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Billing Cycle
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'}
              </Typography>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Features
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">
                    {subscription.max_orders_per_month === null ? 'Unlimited' : subscription.max_orders_per_month} orders/month
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">
                    Email notifications
                  </Typography>
                </Box>
                {subscription.tier >= 2 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">
                      Advanced analytics
                    </Typography>
                  </Box>
                )}
                {subscription.tier >= 3 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">
                      API access
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MySubscription;
