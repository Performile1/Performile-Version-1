import React from 'react';
import { Box, Typography, Paper, Button, Grid, TextField, Alert } from '@mui/material';
import { Payment, CreditCard, AccountBalance } from '@mui/icons-material';

interface PaymentSettingsProps {
  subscriptionInfo?: any;
}

export const PaymentSettings: React.FC<PaymentSettingsProps> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Payment /> Payment Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage payment methods and billing information
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Payments are processed securely through Stripe
      </Alert>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CreditCard /> Payment Methods
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          No payment methods added yet
        </Typography>
        <Button variant="outlined" startIcon={<CreditCard />}>
          Add Payment Method
        </Button>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalance /> Bank Account
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Account Holder Name" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Bank Name" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Account Number" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Routing Number" />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained">
              Save Bank Details
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Billing History</Typography>
        <Typography color="text.secondary">No billing history yet</Typography>
      </Paper>
    </Box>
  );
};
