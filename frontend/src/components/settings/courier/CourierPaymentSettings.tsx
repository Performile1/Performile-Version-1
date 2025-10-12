import React from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, Alert } from '@mui/material';
import { Payment, AccountBalance, Save } from '@mui/icons-material';

interface CourierPaymentSettingsProps {
  subscriptionInfo?: any;
}

export const CourierPaymentSettings: React.FC<CourierPaymentSettingsProps> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Payment /> Payment Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your payment methods and payout preferences
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Payments are processed weekly. Minimum payout threshold is $50.
      </Alert>

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
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="SWIFT/BIC Code" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="IBAN" />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" startIcon={<Save />}>
              Save Payment Details
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Payout History</Typography>
        <Typography color="text.secondary">No payouts yet</Typography>
      </Paper>
    </Box>
  );
};
