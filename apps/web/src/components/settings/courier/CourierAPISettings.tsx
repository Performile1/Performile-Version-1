import React from 'react';
import { Box, Typography, Paper, Button, TextField, Alert, Chip } from '@mui/material';
import { Code, ContentCopy, Refresh } from '@mui/icons-material';

interface CourierAPISettingsProps {
  subscriptionInfo?: any;
}

export const CourierAPISettings: React.FC<CourierAPISettingsProps> = ({ subscriptionInfo }) => {
  const hasAPIAccess = subscriptionInfo?.has_api_access || false;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Code /> API Access
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your API keys and integration settings
      </Typography>

      {!hasAPIAccess ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          API access is not available on your current plan. Upgrade to Professional or higher to enable API access.
        </Alert>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">API Key</Typography>
              <Chip label="Active" color="success" size="small" />
            </Box>
            
            <TextField
              fullWidth
              value="pk_live_••••••••••••••••••••••••••••"
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <Button startIcon={<ContentCopy />} size="small">
                    Copy
                  </Button>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Refresh />}>
                Regenerate Key
              </Button>
              <Button variant="outlined" color="error">
                Revoke Key
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>API Documentation</Typography>
            <Typography color="text.secondary" paragraph>
              Use our API to integrate Performile with your existing systems.
            </Typography>
            <Button variant="contained">
              View Documentation
            </Button>
          </Paper>
        </>
      )}
    </Box>
  );
};
