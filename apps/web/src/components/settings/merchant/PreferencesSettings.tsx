import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Divider, TextField, Grid } from '@mui/material';
import { Tune } from '@mui/icons-material';

interface PreferencesSettingsProps {
  subscriptionInfo?: any;
}

export const PreferencesSettings: React.FC<PreferencesSettingsProps> = ({ subscriptionInfo }) => {
  const [preferences, setPreferences] = useState({
    autoConfirmOrders: false,
    requireSignature: true,
    allowPartialShipments: true,
    trackInventory: true,
    lowStockThreshold: 10,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tune /> Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize your merchant experience
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Order Preferences</Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.autoConfirmOrders}
              onChange={(e) => setPreferences({...preferences, autoConfirmOrders: e.target.checked})}
            />
          }
          label="Auto-confirm orders"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Automatically confirm orders when received
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.requireSignature}
              onChange={(e) => setPreferences({...preferences, requireSignature: e.target.checked})}
            />
          }
          label="Require delivery signature"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Require customer signature for all deliveries
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.allowPartialShipments}
              onChange={(e) => setPreferences({...preferences, allowPartialShipments: e.target.checked})}
            />
          }
          label="Allow partial shipments"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 3 }}>
          Ship available items before the full order is ready
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Inventory Preferences</Typography>

        <FormControlLabel
          control={
            <Switch
              checked={preferences.trackInventory}
              onChange={(e) => setPreferences({...preferences, trackInventory: e.target.checked})}
            />
          }
          label="Track inventory"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Enable inventory tracking for your products
        </Typography>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Low stock threshold"
              type="number"
              value={preferences.lowStockThreshold}
              onChange={(e) => setPreferences({...preferences, lowStockThreshold: parseInt(e.target.value)})}
              helperText="Get notified when stock falls below this number"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
