import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText, ListItemSecondaryAction, Switch, Divider } from '@mui/material';
import { Security, VpnKey, Smartphone } from '@mui/icons-material';
import { ChangePasswordForm } from '../ChangePasswordForm';

interface SecuritySettingsProps {
  subscriptionInfo?: any;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Security /> Security Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account security and authentication
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VpnKey /> Password
        </Typography>
        <ChangePasswordForm />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Smartphone /> Two-Factor Authentication
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Add an extra layer of security to your account
        </Typography>
        <Button variant="outlined">
          Enable 2FA
        </Button>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Security Preferences</Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Login notifications"
              secondary="Get notified when someone logs into your account"
            />
            <ListItemSecondaryAction>
              <Switch defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="Suspicious activity alerts"
              secondary="Receive alerts for unusual account activity"
            />
            <ListItemSecondaryAction>
              <Switch defaultChecked />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};
