import React from 'react';
import { Box, Typography, Paper, Button, TextField, Alert, Chip, Tabs, Tab } from '@mui/material';
import { Code, ContentCopy, Refresh, Description } from '@mui/icons-material';

interface APISettingsProps {
  subscriptionInfo?: any;
}

export const APISettings: React.FC<APISettingsProps> = ({ subscriptionInfo }) => {
  const [tabValue, setTabValue] = React.useState(0);
  const hasAPIAccess = subscriptionInfo?.has_api_access || false;

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Code /> API Access
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Integrate Performile with your e-commerce platform
      </Typography>

      {!hasAPIAccess ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          API access is not available on your current plan. Upgrade to Professional or higher to enable API access.
        </Alert>
      ) : (
        <>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
            <Tab label="API Keys" />
            <Tab label="Webhooks" />
            <Tab label="Documentation" />
          </Tabs>

          {tabValue === 0 && (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Production API Key</Typography>
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

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button variant="outlined" startIcon={<Refresh />}>
                  Regenerate Key
                </Button>
                <Button variant="outlined" color="error">
                  Revoke Key
                </Button>
              </Box>

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Test API Key</Typography>
              <TextField
                fullWidth
                value="pk_test_••••••••••••••••••••••••••••"
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <Button startIcon={<ContentCopy />} size="small">
                      Copy
                    </Button>
                  ),
                }}
              />
            </Paper>
          )}

          {tabValue === 1 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Webhook Endpoints</Typography>
              <Typography color="text.secondary" paragraph>
                Configure webhook endpoints to receive real-time updates
              </Typography>
              <Button variant="contained">Add Webhook</Button>
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Description /> API Documentation
              </Typography>
              <Typography color="text.secondary" paragraph>
                Learn how to integrate Performile with your platform
              </Typography>
              <Button variant="contained">
                View Documentation
              </Button>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};
