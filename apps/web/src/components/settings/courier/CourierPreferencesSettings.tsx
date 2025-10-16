import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Divider, Slider } from '@mui/material';
import { Tune } from '@mui/icons-material';

interface CourierPreferencesSettingsProps {
  subscriptionInfo?: any;
}

export const CourierPreferencesSettings: React.FC<CourierPreferencesSettingsProps> = ({ subscriptionInfo }) => {
  const [preferences, setPreferences] = useState({
    autoAcceptOrders: false,
    showInMarketplace: true,
    allowDirectContact: true,
    maxDailyOrders: 20,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tune /> Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize your courier experience
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Order Preferences</Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={preferences.autoAcceptOrders}
              onChange={(e) => setPreferences({...preferences, autoAcceptOrders: e.target.checked})}
            />
          }
          label="Auto-accept orders"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Automatically accept orders that match your criteria
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography gutterBottom>Maximum daily orders</Typography>
        <Slider
          value={preferences.maxDailyOrders}
          onChange={(e, value) => setPreferences({...preferences, maxDailyOrders: value as number})}
          min={1}
          max={50}
          marks
          valueLabelDisplay="on"
          sx={{ mb: 3 }}
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Visibility Preferences</Typography>

        <FormControlLabel
          control={
            <Switch
              checked={preferences.showInMarketplace}
              onChange={(e) => setPreferences({...preferences, showInMarketplace: e.target.checked})}
            />
          }
          label="Show in marketplace"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Allow merchants to discover and select you
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Switch
              checked={preferences.allowDirectContact}
              onChange={(e) => setPreferences({...preferences, allowDirectContact: e.target.checked})}
            />
          }
          label="Allow direct contact"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Let merchants contact you directly
        </Typography>
      </Paper>
    </Box>
  );
};
