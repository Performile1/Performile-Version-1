import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Divider } from '@mui/material';
import { Notifications } from '@mui/icons-material';

interface CourierNotificationSettingsProps {
  subscriptionInfo?: any;
}

export const CourierNotificationSettings: React.FC<CourierNotificationSettingsProps> = ({ subscriptionInfo }) => {
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    payments: true,
    leads: true,
    performance: false,
    marketing: false,
  });

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Notifications /> Notification Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose how you want to receive notifications
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Email Notifications</Typography>
        
        <FormControlLabel
          control={<Switch checked={notifications.newOrders} onChange={(e) => setNotifications({...notifications, newOrders: e.target.checked})} />}
          label="New order assignments"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Get notified when you receive new delivery orders
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.orderUpdates} onChange={(e) => setNotifications({...notifications, orderUpdates: e.target.checked})} />}
          label="Order status updates"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Updates about order pickups, deliveries, and issues
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.payments} onChange={(e) => setNotifications({...notifications, payments: e.target.checked})} />}
          label="Payment notifications"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Payout confirmations and payment updates
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.leads} onChange={(e) => setNotifications({...notifications, leads: e.target.checked})} />}
          label="New merchant leads"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Notifications about new merchants in your area
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.performance} onChange={(e) => setNotifications({...notifications, performance: e.target.checked})} />}
          label="Performance reports"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Weekly performance summaries and insights
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.marketing} onChange={(e) => setNotifications({...notifications, marketing: e.target.checked})} />}
          label="Marketing and tips"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
          Tips, best practices, and platform updates
        </Typography>
      </Paper>
    </Box>
  );
};
