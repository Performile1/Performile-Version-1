import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import {
  Lock,
  Upgrade,
  Star,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { SubscriptionInfo } from '@/utils/subscriptionHelpers';
import {
  canAccessFeature,
  isProfessionalOrHigher,
  isEnterpriseTier,
  getTierDisplayName,
  getUpgradeMessage,
} from '@/utils/subscriptionHelpers';

interface SubscriptionGateProps {
  children: React.ReactNode;
  subscriptionInfo: SubscriptionInfo | null;
  requiredTier?: 'professional' | 'enterprise';
  requiredFeature?: keyof SubscriptionInfo['subscription'];
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  featureName?: string;
}

/**
 * SubscriptionGate Component
 * 
 * Conditionally renders content based on user's subscription tier or feature access.
 * Shows upgrade prompts when user doesn't have access.
 * 
 * @example
 * // Require Professional tier or higher
 * <SubscriptionGate 
 *   subscriptionInfo={subscriptionInfo}
 *   requiredTier="professional"
 *   featureName="Advanced Analytics"
 * >
 *   <AdvancedAnalyticsComponent />
 * </SubscriptionGate>
 * 
 * @example
 * // Require specific feature
 * <SubscriptionGate 
 *   subscriptionInfo={subscriptionInfo}
 *   requiredFeature="has_api_access"
 *   featureName="API Access"
 * >
 *   <APIKeySection />
 * </SubscriptionGate>
 */
export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  subscriptionInfo,
  requiredTier,
  requiredFeature,
  fallback,
  showUpgradePrompt = true,
  featureName = 'this feature',
}) => {
  const navigate = useNavigate();

  // Check if user has access
  const hasAccess = React.useMemo(() => {
    if (!subscriptionInfo) return false;

    const { tier } = subscriptionInfo.subscription;

    // Check tier requirement
    if (requiredTier === 'professional' && !isProfessionalOrHigher(tier)) {
      return false;
    }
    if (requiredTier === 'enterprise' && !isEnterpriseTier(tier)) {
      return false;
    }

    // Check feature requirement
    if (requiredFeature && !canAccessFeature(subscriptionInfo, requiredFeature)) {
      return false;
    }

    return true;
  }, [subscriptionInfo, requiredTier, requiredFeature]);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  if (showUpgradePrompt) {
    const currentPlan = subscriptionInfo?.subscription.plan_name || 'Free';

    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />

        <Lock sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />

        <Typography variant="h5" fontWeight={600} gutterBottom>
          Unlock {featureName}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          {getUpgradeMessage(requiredFeature || requiredTier || 'feature')}
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
          <Chip
            label={`Current: ${currentPlan}`}
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
          {requiredTier && (
            <Chip
              icon={<Star sx={{ color: 'gold !important' }} />}
              label={`Required: ${getTierDisplayName(requiredTier === 'professional' ? 2 : 3)}`}
              sx={{ bgcolor: 'rgba(255,215,0,0.3)', color: 'white' }}
            />
          )}
        </Stack>

        <Button
          variant="contained"
          size="large"
          startIcon={<Upgrade />}
          onClick={() => navigate('/pricing')}
          sx={{
            bgcolor: 'white',
            color: '#667eea',
            fontWeight: 600,
            px: 4,
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)',
            },
          }}
        >
          View Pricing Plans
        </Button>

        {/* Features list */}
        {requiredTier === 'professional' && (
          <Box sx={{ mt: 4, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Professional Plan Includes:
            </Typography>
            <Stack spacing={1}>
              {[
                'Advanced Analytics',
                'Up to 20 Couriers',
                'API Access',
                'Custom Templates',
                'Priority Support',
              ].map((feature) => (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle fontSize="small" />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {requiredTier === 'enterprise' && (
          <Box sx={{ mt: 4, textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Enterprise Plan Includes:
            </Typography>
            <Stack spacing={1}>
              {[
                'Unlimited Couriers',
                'Unlimited Shops',
                'White Label',
                'Dedicated Manager',
                'Custom Integrations',
              ].map((feature) => (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle fontSize="small" />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Paper>
    );
  }

  // No upgrade prompt, just hide content
  return null;
};

/**
 * SubscriptionBadge Component
 * 
 * Shows a badge indicating subscription tier
 */
interface SubscriptionBadgeProps {
  subscriptionInfo: SubscriptionInfo | null;
  showDetails?: boolean;
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({
  subscriptionInfo,
  showDetails = false,
}) => {
  if (!subscriptionInfo) return null;

  const { plan_name, tier } = subscriptionInfo.subscription;

  const getBadgeColor = () => {
    switch (tier) {
      case 0: return '#9e9e9e';
      case 1: return '#2196f3';
      case 2: return '#9c27b0';
      case 3: return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <Chip
      icon={tier >= 2 ? <Star sx={{ color: 'gold !important' }} /> : undefined}
      label={plan_name}
      size="small"
      sx={{
        bgcolor: getBadgeColor(),
        color: 'white',
        fontWeight: 600,
      }}
    />
  );
};

/**
 * FeatureLockedAlert Component
 * 
 * Shows an inline alert for locked features
 */
interface FeatureLockedAlertProps {
  featureName: string;
  requiredTier?: string;
  onUpgrade?: () => void;
}

export const FeatureLockedAlert: React.FC<FeatureLockedAlertProps> = ({
  featureName,
  requiredTier = 'Professional',
  onUpgrade,
}) => {
  const navigate = useNavigate();

  return (
    <Alert
      severity="info"
      icon={<Lock />}
      action={
        <Button
          size="small"
          onClick={onUpgrade || (() => navigate('/pricing'))}
        >
          Upgrade
        </Button>
      }
    >
      <strong>{featureName}</strong> is available on the {requiredTier} plan and above.
    </Alert>
  );
};

export default SubscriptionGate;
