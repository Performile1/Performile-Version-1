import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Cancel,
  Upgrade,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  open: boolean;
  onClose: () => void;
  limitType: string;
  currentUsage: number;
  maxAllowed: number;
  planName: string;
  tier: number;
  message?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  open,
  onClose,
  limitType,
  currentUsage,
  maxAllowed,
  planName,
  tier,
  message
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/settings?tab=subscription');
    onClose();
  };

  const getNextTierBenefits = () => {
    if (tier === 1) {
      return {
        tierName: 'Professional',
        benefits: [
          'Up to 500 orders per month',
          'Advanced analytics',
          'API access',
          'Priority support',
          'Custom templates'
        ]
      };
    } else if (tier === 2) {
      return {
        tierName: 'Enterprise',
        benefits: [
          'Unlimited orders',
          'White label branding',
          'Dedicated account manager',
          'Custom integrations',
          'SLA guarantee'
        ]
      };
    }
    return {
      tierName: 'Premium',
      benefits: ['Unlimited everything']
    };
  };

  const nextTier = getNextTierBenefits();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6">Upgrade Required</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          {message || `You've reached your ${limitType} limit`}
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Plan
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip label={planName} color="default" />
            <Chip label={`Tier ${tier}`} size="small" />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Usage
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" color="error">
              {currentUsage} / {maxAllowed}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {limitType}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.50', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'primary.200'
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Upgrade color="primary" />
            Upgrade to {nextTier.tierName}
          </Typography>
          
          <List dense>
            {nextTier.benefits.map((benefit, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <CheckCircle color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={benefit}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<Cancel />}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpgrade} 
          variant="contained" 
          startIcon={<Upgrade />}
          color="primary"
        >
          View Plans
        </Button>
      </DialogActions>
    </Dialog>
  );
};
