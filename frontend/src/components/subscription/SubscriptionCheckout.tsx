import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { Check, CreditCard } from '@mui/icons-material';
import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe';
import { analytics } from '@/lib/analytics';

interface SubscriptionCheckoutProps {
  open: boolean;
  onClose: () => void;
  plan: {
    plan_id: number;
    plan_name: string;
    monthly_price: number;
    annual_price?: number;
    description?: string;
    max_orders_per_month?: number;
    max_emails_per_month?: number;
    max_sms_per_month?: number;
    max_couriers?: number;
    max_team_members?: number;
  };
  userId: string;
}

export const SubscriptionCheckout: React.FC<SubscriptionCheckoutProps> = ({
  open,
  onClose,
  plan,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const sessionId = await createCheckoutSession(plan.plan_id.toString(), userId);

      // Track event
      analytics.subscriptionStarted(
        plan.plan_id.toString(),
        plan.plan_name,
        plan.monthly_price
      );

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout');
      setLoading(false);
    }
  };

  const getFeatures = () => {
    const features = [];

    if (plan.max_orders_per_month) {
      features.push(`${plan.max_orders_per_month} orders/month`);
    } else {
      features.push('Unlimited orders');
    }

    if (plan.max_emails_per_month) {
      features.push(`${plan.max_emails_per_month} emails/month`);
    } else {
      features.push('Unlimited emails');
    }

    if (plan.max_sms_per_month && plan.max_sms_per_month > 0) {
      features.push(`${plan.max_sms_per_month} SMS/month`);
    }

    if (plan.max_couriers) {
      features.push(`Up to ${plan.max_couriers} team members`);
    } else if (plan.max_team_members) {
      features.push(`Up to ${plan.max_team_members} team members`);
    }

    features.push('14-day free trial');
    features.push('Cancel anytime');

    return features;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Subscribe to {plan.plan_name}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" component="div" gutterBottom>
            ${plan.monthly_price}
            <Typography variant="body1" component="span" color="text.secondary">
              /month
            </Typography>
          </Typography>

          {plan.annual_price && (
            <Typography variant="body2" color="text.secondary">
              or ${plan.annual_price}/year (save $
              {(plan.monthly_price * 12 - plan.annual_price).toFixed(0)})
            </Typography>
          )}
        </Box>

        {plan.description && (
          <Typography variant="body2" color="text.secondary" paragraph>
            {plan.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          What's included:
        </Typography>

        <List dense>
          {getFeatures().map((feature, index) => (
            <ListItem key={index} disableGutters>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Check color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={feature} />
            </ListItem>
          ))}
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>14-day free trial</strong> • No credit card required during trial •
            Cancel anytime
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCheckout}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
          size="large"
        >
          {loading ? 'Processing...' : 'Start Free Trial'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
