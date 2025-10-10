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
  Divider,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CreditCard,
  Receipt,
  TrendingUp,
  Cancel,
  CheckCircle,
  Warning,
  Download,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Subscription interface moved to types
interface SubscriptionData {
  subscription_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  stripe_subscription_id?: string;
}

interface Invoice {
  invoice_id: string;
  amount: number;
  status: string;
  invoice_date: string;
  due_date: string;
  paid_date?: string;
  invoice_url?: string;
}

export const BillingPortal: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch current subscription
  const { data: subscription, isLoading: loadingSubscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: async () => {
      const response = await apiClient.get('/subscriptions/current');
      return response.data.subscription;
    },
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['user-invoices'],
    queryFn: async () => {
      const response = await apiClient.get('/subscriptions/invoices');
      return response.data.invoices || [];
    },
  });

  // Update payment method mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/subscriptions/update-payment-method');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error('Failed to update payment method');
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async (reason: string) => {
      return await apiClient.post('/subscriptions/cancel', { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
      toast.success('Subscription cancelled successfully');
      setShowCancelDialog(false);
    },
    onError: () => {
      toast.error('Failed to cancel subscription');
    },
  });

  const handleUpdatePaymentMethod = () => {
    updatePaymentMutation.mutate();
  };

  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate(cancelReason);
  };

  const handleUpgrade = () => {
    navigate('/subscription/plans');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'cancelled':
      case 'canceled':
        return 'error';
      case 'past_due':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loadingSubscription) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Billing & Subscription
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your subscription, payment methods, and invoices
        </Typography>
      </Box>

      {/* Current Subscription */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <CreditCard sx={{ fontSize: 28, color: 'primary.main' }} />
                <Typography variant="h6">Current Subscription</Typography>
              </Box>

              {subscription ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box>
                        <Typography variant="h5" fontWeight="bold">
                          {subscription.plan_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                        </Typography>
                      </Box>
                      <Chip
                        label={subscription.status}
                        color={getStatusColor(subscription.status) as any}
                        icon={subscription.status === 'active' ? <CheckCircle /> : <Warning />}
                      />
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Current Period
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Amount
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(subscription.price)} / {subscription.billing_cycle === 'monthly' ? 'month' : 'year'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {subscription.status === 'active' && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Your subscription will automatically renew on {formatDate(subscription.current_period_end)}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<TrendingUp />}
                      onClick={handleUpgrade}
                    >
                      Change Plan
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CreditCard />}
                      onClick={handleUpdatePaymentMethod}
                      disabled={updatePaymentMutation.isPending}
                    >
                      {updatePaymentMutation.isPending ? 'Loading...' : 'Update Payment Method'}
                    </Button>
                    {subscription.status === 'active' && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => setShowCancelDialog(true)}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    You don't have an active subscription
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/subscription/plans')}
                    sx={{ mt: 2 }}
                  >
                    View Plans
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Billing Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Spent
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(
                      invoices
                        .filter((inv: Invoice) => inv.status === 'paid')
                        .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0)
                    )}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Invoices
                  </Typography>
                  <Typography variant="h6">{invoices.length}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Next Billing Date
                  </Typography>
                  <Typography variant="body2">
                    {subscription?.current_period_end
                      ? formatDate(subscription.current_period_end)
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Invoices */}
      <Card sx={{ mt: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Receipt sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h6">Invoice History</Typography>
          </Box>

          {loadingInvoices ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : invoices.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice: Invoice) => (
                    <TableRow key={invoice.invoice_id}>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={getStatusColor(invoice.status) as any}
                        />
                      </TableCell>
                      <TableCell>{formatDate(invoice.due_date)}</TableCell>
                      <TableCell align="right">
                        {invoice.invoice_url && (
                          <Button
                            size="small"
                            startIcon={<Download />}
                            href={invoice.invoice_url}
                            target="_blank"
                          >
                            Download
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No invoices yet</Alert>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
          </Alert>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please let us know why you're cancelling (optional):
          </Typography>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Your feedback helps us improve..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontFamily: 'inherit',
              fontSize: '14px',
              marginTop: '8px',
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Keep Subscription</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleCancelSubscription}
            disabled={cancelSubscriptionMutation.isPending}
          >
            {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BillingPortal;
