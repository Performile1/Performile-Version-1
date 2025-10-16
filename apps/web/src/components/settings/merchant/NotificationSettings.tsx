import React, { useState } from 'react';
import { Box, Typography, Paper, FormControlLabel, Switch, Divider } from '@mui/material';
import { Notifications } from '@mui/icons-material';

interface NotificationSettingsProps {
  subscriptionInfo?: any;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ subscriptionInfo }) => {
  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    lowStock: true,
    courierUpdates: true,
    reviews: true,
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
          label="New orders"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Get notified when you receive new orders
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.orderUpdates} onChange={(e) => setNotifications({...notifications, orderUpdates: e.target.checked})} />}
          label="Order status updates"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Updates about order shipping, delivery, and issues
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.lowStock} onChange={(e) => setNotifications({...notifications, lowStock: e.target.checked})} />}
          label="Low stock alerts"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Alerts when products are running low on stock
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.courierUpdates} onChange={(e) => setNotifications({...notifications, courierUpdates: e.target.checked})} />}
          label="Courier updates"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Updates from your selected couriers
        </Typography>

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={<Switch checked={notifications.reviews} onChange={(e) => setNotifications({...notifications, reviews: e.target.checked})} />}
          label="New reviews"
        />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
          Notifications when customers leave reviews
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
