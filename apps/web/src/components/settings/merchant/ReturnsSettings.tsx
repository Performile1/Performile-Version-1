import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Grid, FormControlLabel, Switch } from '@mui/material';
import { Undo, Save } from '@mui/icons-material';

interface ReturnsSettingsProps {
  subscriptionInfo?: any;
}

export const ReturnsSettings: React.FC<ReturnsSettingsProps> = ({ subscriptionInfo }) => {
  const [settings, setSettings] = useState({
    acceptReturns: true,
    returnWindow: 30,
    returnAddress: '',
    requireReason: true,
    autoApprove: false,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Undo /> Returns & Refunds
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your return and refund policies
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.acceptReturns}
                  onChange={(e) => setSettings({...settings, acceptReturns: e.target.checked})}
                />
              }
              label="Accept returns"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Return window (days)"
              type="number"
              value={settings.returnWindow}
              onChange={(e) => setSettings({...settings, returnWindow: parseInt(e.target.value)})}
              helperText="Number of days customers can request returns"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Return address"
              multiline
              rows={3}
              value={settings.returnAddress}
              onChange={(e) => setSettings({...settings, returnAddress: e.target.value})}
              helperText="Address where customers should send returns"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.requireReason}
                  onChange={(e) => setSettings({...settings, requireReason: e.target.checked})}
                />
              }
              label="Require return reason"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoApprove}
                  onChange={(e) => setSettings({...settings, autoApprove: e.target.checked})}
                />
              }
              label="Auto-approve returns"
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" startIcon={<Save />}>
              Save Return Policy
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
