import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Grid,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  Email,
  ShoppingCart,
  Sms,
  Warning,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';

export const UsageDashboard: React.FC = () => {
  const { usageSummary, isLoading, refetchUsage } = useSubscriptionLimits();

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!usageSummary?.hasSubscription) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No active subscription found. Subscribe to a plan to track your usage.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const { plan, usage, period } = usageSummary;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const UsageItem = ({
    icon,
    label,
    used,
    limit,
    percentage,
    unlimited,
  }: {
    icon: React.ReactNode;
    label: string;
    used: number;
    limit: number | null;
    percentage: number;
    unlimited: boolean;
  }) => (
    <Grid item xs={12} md={4}>
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
          <Typography variant="h4" fontWeight="bold">
            {used.toLocaleString()}
          </Typography>
          {!unlimited && limit !== null && (
            <Typography variant="body2" color="text.secondary">
              / {limit.toLocaleString()}
            </Typography>
          )}
          {unlimited && (
            <Chip label="Unlimited" size="small" color="success" />
          )}
        </Box>

        {!unlimited && limit !== null && (
          <>
            <LinearProgress
              variant="determinate"
              value={Math.min(percentage, 100)}
              color={getUsageColor(percentage)}
              sx={{ height: 8, borderRadius: 1, mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {percentage.toFixed(0)}% used
              {percentage >= 75 && percentage < 90 && ' - Consider upgrading'}
              {percentage >= 90 && ' - Limit almost reached!'}
            </Typography>
          </>
        )}
      </Box>
    </Grid>
  );

  const showWarning =
    (usage?.orders && usage.orders.percentage >= 75) ||
    (usage?.emails && usage.emails.percentage >= 75) ||
    (usage?.sms && usage.sms.percentage >= 75);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Usage Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plan?.name} Plan • Tier {plan?.tier}
            </Typography>
            {period && (
              <Typography variant="caption" color="text.secondary">
                Period: {formatDate(period.start)} - {formatDate(period.end)}
              </Typography>
            )}
          </Box>
          <Box>
            <Chip
              icon={<Refresh />}
              label="Auto-refreshes"
              size="small"
              variant="outlined"
              onClick={() => refetchUsage()}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>

        {showWarning && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            You're approaching your plan limits. Consider upgrading to avoid service interruption.
          </Alert>
        )}

        <Grid container spacing={2}>
          {usage?.orders && (
            <UsageItem
              icon={<ShoppingCart color="primary" />}
              label="Orders This Month"
              used={usage.orders.used}
              limit={usage.orders.limit}
              percentage={usage.orders.percentage}
              unlimited={usage.orders.unlimited}
            />
          )}

          {usage?.emails && (
            <UsageItem
              icon={<Email color="primary" />}
              label="Emails Sent"
              used={usage.emails.used}
              limit={usage.emails.limit}
              percentage={usage.emails.percentage}
              unlimited={usage.emails.unlimited}
            />
          )}

          {usage?.sms && (
            <UsageItem
              icon={<Sms color="primary" />}
              label="SMS Sent"
              used={usage.sms.used}
              limit={usage.sms.limit}
              percentage={usage.sms.percentage}
              unlimited={usage.sms.unlimited}
            />
          )}
        </Grid>

        {/* Success message if usage is healthy */}
        {!showWarning && (
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" fontSize="small" />
            <Typography variant="body2" color="success.main">
              Your usage is healthy. Keep up the good work!
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageDashboard;
