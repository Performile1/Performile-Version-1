import React from 'react';
import { Box, Typography, Paper, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Chip } from '@mui/material';
import { Email, Edit, Add } from '@mui/icons-material';

interface EmailTemplatesSettingsProps {
  subscriptionInfo?: any;
}

export const EmailTemplatesSettings: React.FC<EmailTemplatesSettingsProps> = ({ subscriptionInfo }) => {
  const hasCustomTemplates = subscriptionInfo?.has_custom_templates || false;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email /> Email Templates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Customize email templates for customer communications
      </Typography>

      {!hasCustomTemplates && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <Typography variant="body2">
            Custom email templates are available on Professional and Enterprise plans
          </Typography>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Templates</Typography>
          <Button variant="contained" startIcon={<Add />} disabled={!hasCustomTemplates}>
            Create Template
          </Button>
        </Box>

        <List>
          <ListItem>
            <ListItemText
              primary="Order Confirmation"
              secondary="Sent when a customer places an order"
            />
            <ListItemSecondaryAction>
              <Chip label="Default" size="small" sx={{ mr: 1 }} />
              <IconButton edge="end" disabled={!hasCustomTemplates}>
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Shipping Notification"
              secondary="Sent when an order is shipped"
            />
            <ListItemSecondaryAction>
              <Chip label="Default" size="small" sx={{ mr: 1 }} />
              <IconButton edge="end" disabled={!hasCustomTemplates}>
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>

          <ListItem>
            <ListItemText
              primary="Delivery Confirmation"
              secondary="Sent when an order is delivered"
            />
            <ListItemSecondaryAction>
              <Chip label="Default" size="small" sx={{ mr: 1 }} />
              <IconButton edge="end" disabled={!hasCustomTemplates}>
                <Edit />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};
