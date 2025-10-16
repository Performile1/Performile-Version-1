import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CreditCard,
  LocationOn,
  TrendingUp,
  AttachMoney,
  Business
} from '@mui/icons-material';
import { apiClient } from '../services/apiClient';
import toast from 'react-hot-toast';

interface Lead {
  lead_id: string;
  title: string;
  description: string;
  delivery_areas: string;
  estimated_order_volume: number;
  avg_order_value: number;
  lead_price: number;
  requirements: string;
  budget_min: number;
  budget_max: number;
  merchant_contact_name: string;
  merchant_contact_email: string;
  merchant_contact_phone: string;
  lead_score: number;
  lead_category: string;
  created_at: string;
}

interface LeadPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onPurchaseSuccess: () => void;
}

const LeadPurchaseModal: React.FC<LeadPurchaseModalProps> = ({
  open,
  onClose,
  lead,
  onPurchaseSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripeCheckout = async () => {
    if (!lead) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/leads?action=checkout', {
        leadId: lead.lead_id,
        successUrl: `${window.location.origin}/dashboard?payment=success&leadId=${lead.lead_id}`,
        cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`
      });

      if (response.data.success) {
        // Call success callback before redirect
        onPurchaseSuccess();
        // Redirect to Stripe Checkout
        window.location.href = response.data.data.url;
      } else {
        throw new Error(response.data.message || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.message || 'Failed to initiate payment');
      toast.error('Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPurchase = async () => {
    if (!lead) return;

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll use Stripe Checkout
      // In production, you'd implement Stripe Elements for direct payment
      await handleStripeCheckout();
    } catch (error: any) {
      console.error('Purchase error:', error);
      setError(error.response?.data?.message || 'Failed to process payment');
      toast.error('Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  const monthlyRevenuePotential = lead.estimated_order_volume * lead.avg_order_value;
  const roiMonths = Math.ceil(lead.lead_price / (monthlyRevenuePotential * 0.1)); // Assuming 10% margin

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CreditCard color="primary" />
          <Typography variant="h6">Purchase Lead</Typography>
          <Chip 
            label={`Score: ${lead.lead_score}/100`} 
            color={lead.lead_score >= 80 ? 'success' : lead.lead_score >= 60 ? 'warning' : 'error'}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {lead.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {lead.description}
            </Typography>

            <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <LocationOn fontSize="small" color="action" />
                <Typography variant="body2">{lead.delivery_areas}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <TrendingUp fontSize="small" color="action" />
                <Typography variant="body2">
                  {lead.estimated_order_volume} orders/month
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2">
                  ${lead.avg_order_value} avg order value
                </Typography>
              </Box>
            </Box>

            <Chip 
              label={lead.lead_category} 
              variant="outlined" 
              size="small"
              sx={{ mr: 1 }}
            />
          </CardContent>
        </Card>

        <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Revenue Potential Analysis
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Monthly Revenue Potential
                </Typography>
                <Typography variant="h6" color="success.main">
                  ${monthlyRevenuePotential.toLocaleString()}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Estimated ROI Timeline
                </Typography>
                <Typography variant="h6" color="info.main">
                  {roiMonths} months
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Merchant Contact Information
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Business fontSize="small" color="action" />
                <Typography variant="body2">
                  {lead.merchant_contact_name}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Email: {lead.merchant_contact_email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Phone: {lead.merchant_contact_phone}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box 
          sx={{ 
            p: 2, 
            bgcolor: 'success.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.200'
          }}
        >
          <Typography variant="h5" color="success.dark" textAlign="center">
            Lead Price: ${lead.lead_price}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mt={1}>
            One-time payment • Secure payment via Stripe
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleDirectPurchase}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
          size="large"
        >
          {loading ? 'Processing...' : `Purchase for $${lead.lead_price}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadPurchaseModal;
