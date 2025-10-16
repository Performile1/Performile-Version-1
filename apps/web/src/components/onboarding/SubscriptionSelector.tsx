import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Radio,
  FormControlLabel,
  RadioGroup
} from '@mui/material';
import { Check, Star } from '@mui/icons-material';

interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  user_type: string;
  tier: number;
  monthly_price: number;
  annual_price?: number;
  max_orders_per_month?: number;
  max_emails_per_month?: number;
  max_sms_per_month?: number;
  max_couriers?: number;
  max_shops?: number;
  description?: string;
  is_popular: boolean;
}

interface SubscriptionSelectorProps {
  userType: 'merchant' | 'courier';
  selectedPlanId: number | null;
  plans: SubscriptionPlan[];
  onChange: (planId: number) => void;
}

const SubscriptionSelector: React.FC<SubscriptionSelectorProps> = ({
  userType,
  selectedPlanId,
  plans,
  onChange
}) => {
  const filteredPlans = plans.filter(p => p.user_type === userType);

  const getFeatures = (plan: SubscriptionPlan) => {
    const features: string[] = [];
    
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

    features.push('Unlimited push notifications');

    if (userType === 'merchant') {
      if (plan.max_couriers) {
        features.push(`Up to ${plan.max_couriers} couriers`);
      } else {
        features.push('Unlimited couriers');
      }

      if (plan.max_shops) {
        features.push(`Up to ${plan.max_shops} shops`);
      } else if (plan.tier === 3) {
        features.push('Unlimited shops');
      }
    }

    if (plan.tier === 2) {
      features.push('Custom email templates');
      features.push('Advanced analytics');
      features.push('Priority support');
    }

    if (plan.tier === 3) {
      features.push('White-label options');
      features.push('Dedicated account manager');
      features.push('API access');
      features.push('Custom integrations');
    }

    return features;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your Plan
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select a subscription plan that fits your needs. You can upgrade or downgrade anytime.
      </Typography>

      <RadioGroup value={selectedPlanId?.toString()} onChange={(e) => onChange(parseInt(e.target.value))}>
        <Grid container spacing={3}>
          {filteredPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.plan_id;
            const features = getFeatures(plan);

            return (
              <Grid item xs={12} md={4} key={plan.plan_id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => onChange(plan.plan_id)}
                >
                  {plan.is_popular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      icon={<Star />}
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16
                      }}
                    />
                  )}

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 2 }}>
                      <FormControlLabel
                        value={plan.plan_id.toString()}
                        control={<Radio />}
                        label=""
                        sx={{ m: 0, mb: 1 }}
                      />
                      <Typography variant="h5" gutterBottom>
                        {plan.plan_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {plan.description}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h3" component="span">
                        ${plan.monthly_price}
                      </Typography>
                      <Typography variant="body2" component="span" color="text.secondary">
                        /month
                      </Typography>
                      {plan.annual_price && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          or ${plan.annual_price}/year (save ${(plan.monthly_price * 12 - plan.annual_price).toFixed(0)})
                        </Typography>
                      )}
                    </Box>

                    <List dense sx={{ flexGrow: 1 }}>
                      {features.map((feature, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Check color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      variant={isSelected ? 'contained' : 'outlined'}
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => onChange(plan.plan_id)}
                    >
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </RadioGroup>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          💳 <strong>14-day free trial</strong> • No credit card required • Cancel anytime
        </Typography>
      </Box>
    </Box>
  );
};

export default SubscriptionSelector;
