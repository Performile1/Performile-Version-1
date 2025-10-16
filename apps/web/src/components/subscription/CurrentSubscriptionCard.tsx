import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Grid,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Warning,
  Upgrade,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface CurrentSubscriptionCardProps {
  subscriptionInfo: {
    plan_name: string;
    tier: number;
    max_orders_per_month: number | null;
    max_shops: number | null;
    max_couriers: number | null;
    max_team_members: number | null;
    max_emails_per_month: number | null;
    current_orders_used: number;
    current_emails_used: number;
    has_api_access: boolean;
    has_advanced_analytics: boolean;
  };
  userType: 'merchant' | 'courier';
}

export const CurrentSubscriptionCard: React.FC<CurrentSubscriptionCardProps> = ({
  subscriptionInfo,
  userType,
}) => {
  const navigate = useNavigate();

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'default';
      case 2:
        return 'primary';
      case 3:
        return 'success';
      default:
        return 'default';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return userType === 'merchant' ? 'Starter' : 'Individual';
      case 2:
        return 'Professional';
      case 3:
        return userType === 'merchant' ? 'Enterprise' : 'Fleet';
      default:
        return 'Free';
    }
  };

  const getUsagePercentage = (used: number, max: number | null) => {
    if (max === null) return 0; // Unlimited
    return (used / max) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const canUpgrade = subscriptionInfo.tier < 3;
  const canDowngrade = subscriptionInfo.tier > 1;

  const ordersPercentage = getUsagePercentage(
    subscriptionInfo.current_orders_used,
    subscriptionInfo.max_orders_per_month
  );

  const emailsPercentage = getUsagePercentage(
    subscriptionInfo.current_emails_used,
    subscriptionInfo.max_emails_per_month
  );

  return (
    <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Current Subscription
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={subscriptionInfo.plan_name}
                color={getTierColor(subscriptionInfo.tier)}
                sx={{ fontWeight: 'bold' }}
              />
              <Chip
                label={`Tier ${subscriptionInfo.tier}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {canDowngrade && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/settings?tab=subscription')}
              >
                Downgrade
              </Button>
            )}
            {canUpgrade && (
              <Button
                variant="contained"
                startIcon={<Upgrade />}
                onClick={() => navigate('/settings?tab=subscription')}
              >
                Upgrade
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          {/* Orders Usage */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Orders This Month
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {subscriptionInfo.current_orders_used}
                {subscriptionInfo.max_orders_per_month !== null && ` / ${subscriptionInfo.max_orders_per_month}`}
              </Typography>
              {subscriptionInfo.max_orders_per_month === null && (
                <Chip label="Unlimited" size="small" color="success" />
              )}
            </Box>
            {subscriptionInfo.max_orders_per_month !== null && (
              <LinearProgress
                variant="determinate"
                value={Math.min(ordersPercentage, 100)}
                color={getUsageColor(ordersPercentage)}
                sx={{ height: 8, borderRadius: 1 }}
              />
            )}
          </Grid>

          {/* Emails Usage */}
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Emails This Month
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6">
                {subscriptionInfo.current_emails_used}
                {subscriptionInfo.max_emails_per_month !== null && ` / ${subscriptionInfo.max_emails_per_month}`}
              </Typography>
              {subscriptionInfo.max_emails_per_month === null && (
                <Chip label="Unlimited" size="small" color="success" />
              )}
            </Box>
            {subscriptionInfo.max_emails_per_month !== null && (
              <LinearProgress
                variant="determinate"
                value={Math.min(emailsPercentage, 100)}
                color={getUsageColor(emailsPercentage)}
                sx={{ height: 8, borderRadius: 1 }}
              />
            )}
          </Grid>

          {/* Merchant Specific Limits */}
          {userType === 'merchant' && (
            <>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Shops
                </Typography>
                <Typography variant="h6">
                  {subscriptionInfo.max_shops === null ? '∞' : subscriptionInfo.max_shops}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Couriers
                </Typography>
                <Typography variant="h6">
                  {subscriptionInfo.max_couriers === null ? '∞' : subscriptionInfo.max_couriers}
                </Typography>
              </Grid>
            </>
          )}

          {/* Courier Specific Limits */}
          {userType === 'courier' && (
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Team Members
              </Typography>
              <Typography variant="h6">
                {subscriptionInfo.max_team_members === null ? '∞' : subscriptionInfo.max_team_members}
              </Typography>
            </Grid>
          )}

          {/* Features */}
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Features
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {subscriptionInfo.has_api_access && (
                <Chip icon={<CheckCircle />} label="API Access" size="small" color="success" />
              )}
              {subscriptionInfo.has_advanced_analytics && (
                <Chip icon={<CheckCircle />} label="Advanced Analytics" size="small" color="success" />
              )}
              {!subscriptionInfo.has_api_access && (
                <Chip icon={<Warning />} label="No API Access" size="small" variant="outlined" />
              )}
              {!subscriptionInfo.has_advanced_analytics && (
                <Chip icon={<Warning />} label="Basic Analytics Only" size="small" variant="outlined" />
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Upgrade Warning */}
        {(ordersPercentage >= 75 || emailsPercentage >= 75) && canUpgrade && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'warning.50',
              border: '1px solid',
              borderColor: 'warning.200',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" />
              <Typography variant="body2">
                You're approaching your plan limits. Consider upgrading to avoid service interruption.
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
