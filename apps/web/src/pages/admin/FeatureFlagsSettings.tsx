import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  tier: string;
  features: {
    [key: string]: boolean;
  };
  monthly_price: number;
  annual_price: number;
}

const availableFeatures = [
  { key: 'proximity_matching', label: 'Proximity Matching', description: 'Match couriers based on location' },
  { key: 'advanced_analytics', label: 'Advanced Analytics', description: 'Detailed reports and insights' },
  { key: 'priority_support', label: 'Priority Support', description: '24/7 priority customer support' },
  { key: 'api_access', label: 'API Access', description: 'RESTful API for integrations' },
  { key: 'white_label', label: 'White Label', description: 'Custom branding options' },
  { key: 'custom_integrations', label: 'Custom Integrations', description: 'Build custom integrations' },
  { key: 'bulk_operations', label: 'Bulk Operations', description: 'Bulk import/export capabilities' },
  { key: 'advanced_reporting', label: 'Advanced Reporting', description: 'Custom report builder' },
  { key: 'multi_user', label: 'Multi-User Access', description: 'Team collaboration features' },
  { key: 'sla_guarantees', label: 'SLA Guarantees', description: 'Service level agreements' },
];

export const FeatureFlagsSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [localPlans, setLocalPlans] = useState<SubscriptionPlan[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch subscription plans
  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/subscription-plans');
      return response.data.data as SubscriptionPlan[];
    },
  });

  // Initialize local state
  React.useEffect(() => {
    if (plans && localPlans.length === 0) {
      setLocalPlans(plans);
    }
  }, [plans]);

  // Update features mutation
  const updateFeaturesMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      await apiClient.put(`/admin/subscription-plans/${plan.plan_id}/features`, {
        features: plan.features,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast.success('Features updated successfully');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Failed to update features');
    },
  });

  const handleFeatureToggle = (planId: string, featureKey: string) => {
    setLocalPlans((prev) =>
      prev.map((plan) => {
        if (plan.plan_id === planId) {
          return {
            ...plan,
            features: {
              ...plan.features,
              [featureKey]: !plan.features[featureKey],
            },
          };
        }
        return plan;
      })
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    localPlans.forEach((plan) => {
      updateFeaturesMutation.mutate(plan);
    });
  };

  const handleReset = () => {
    if (plans) {
      setLocalPlans(plans);
      setHasChanges(false);
    }
  };

  const getTierColor = (tier: string): 'default' | 'primary' | 'secondary' | 'success' => {
    switch (tier.toLowerCase()) {
      case 'free':
      case 'basic':
        return 'default';
      case 'pro':
      case 'professional':
        return 'primary';
      case 'enterprise':
      case 'unlimited':
        return 'success';
      default:
        return 'secondary';
    }
  };

  if (isLoading || localPlans.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load subscription plans. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            🚩 Feature Flags
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure which features are available in each subscription plan
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={!hasChanges || updateFeaturesMutation.isPending}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges || updateFeaturesMutation.isPending}
          >
            {updateFeaturesMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes
        </Alert>
      )}

      <Grid container spacing={3}>
        {localPlans.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.plan_id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{plan.plan_name}</Typography>
                  <Chip label={plan.tier} color={getTierColor(plan.tier)} size="small" />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ${plan.monthly_price}/mo • ${plan.annual_price}/yr
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlagIcon fontSize="small" />
                  Features
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {availableFeatures.map((feature) => (
                    <Box key={feature.key} sx={{ mb: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={plan.features[feature.key] || false}
                            onChange={() => handleFeatureToggle(plan.plan_id, feature.key)}
                            size="small"
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">{feature.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {feature.description}
                            </Typography>
                          </Box>
                        }
                      />
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="caption" color="text.secondary">
                  {Object.values(plan.features).filter(Boolean).length} of {availableFeatures.length} features enabled
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💡 Feature Descriptions
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {availableFeatures.map((feature) => (
              <Grid item xs={12} sm={6} key={feature.key}>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {feature.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FeatureFlagsSettings;
