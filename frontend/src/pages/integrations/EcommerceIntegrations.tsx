import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ShoppingCart as ShopifyIcon,
  Store as WooCommerceIcon,
  Storefront as WixIcon,
  ShoppingBag as PrestaShopIcon,
  LocalMall as OpenCartIcon,
  Shop as MagentoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';

interface Integration {
  integration_id: string;
  platform: string;
  store_url: string;
  api_key: string;
  api_secret: string;
  is_active: boolean;
  last_sync: string;
  orders_synced: number;
  created_at: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const platforms = [
  { name: 'WooCommerce', icon: WooCommerceIcon, color: '#96588A', docs: 'https://woocommerce.github.io/woocommerce-rest-api-docs/' },
  { name: 'Shopify', icon: ShopifyIcon, color: '#96BF48', docs: 'https://shopify.dev/api/admin-rest' },
  { name: 'Wix', icon: WixIcon, color: '#0C6EFC', docs: 'https://dev.wix.com/api/rest/getting-started' },
  { name: 'PrestaShop', icon: PrestaShopIcon, color: '#DF0067', docs: 'https://devdocs.prestashop.com/1.7/webservice/' },
  { name: 'OpenCart', icon: OpenCartIcon, color: '#2AC2EF', docs: 'https://docs.opencart.com/en-gb/system/users/api/' },
  { name: 'Magento', icon: MagentoIcon, color: '#EE672F', docs: 'https://devdocs.magento.com/guides/v2.4/rest/bk-rest.html' },
];

export const EcommerceIntegrations: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const [formData, setFormData] = useState({
    store_url: '',
    api_key: '',
    api_secret: '',
    webhook_url: '',
  });

  // Fetch integrations
  const { data: integrationsData } = useQuery({
    queryKey: ['ecommerce-integrations'],
    queryFn: async () => {
      const response = await apiClient.get('/integrations/ecommerce');
      return response.data;
    },
  });

  const integrations: Integration[] = Array.isArray(integrationsData?.data) ? integrationsData.data : [];

  // Add integration mutation
  const addIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/integrations/ecommerce', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Integration added successfully!');
      queryClient.invalidateQueries({ queryKey: ['ecommerce-integrations'] });
      setSetupDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add integration');
    },
  });

  // Sync integration mutation
  const syncIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiClient.post(`/integrations/ecommerce/${integrationId}/sync`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Sync started successfully!');
      queryClient.invalidateQueries({ queryKey: ['ecommerce-integrations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to sync');
    },
  });

  // Delete integration mutation
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await apiClient.delete(`/integrations/ecommerce/${integrationId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Integration deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['ecommerce-integrations'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete integration');
    },
  });

  const resetForm = () => {
    setFormData({
      store_url: '',
      api_key: '',
      api_secret: '',
      webhook_url: '',
    });
    setActiveStep(0);
    setSelectedPlatform(null);
  };

  const handleSetupPlatform = (platform: string) => {
    setSelectedPlatform(platform);
    setFormData({
      ...formData,
      webhook_url: `${window.location.origin}/api/webhooks/ecommerce/${platform.toLowerCase()}`,
    });
    setSetupDialogOpen(true);
  };

  const handleSubmitIntegration = () => {
    if (!selectedPlatform || !formData.store_url || !formData.api_key || !formData.api_secret) {
      toast.error('Please fill in all required fields');
      return;
    }

    addIntegrationMutation.mutate({
      platform: selectedPlatform,
      ...formData,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getIntegrationsByPlatform = (platform: string) => {
    return integrations.filter(i => i.platform === platform);
  };

  const getSetupSteps = (platform: string) => {
    const baseSteps = [
      {
        label: 'Store URL',
        description: `Enter your ${platform} store URL`,
        content: (
          <TextField
            fullWidth
            label="Store URL"
            value={formData.store_url}
            onChange={(e) => setFormData({ ...formData, store_url: e.target.value })}
            placeholder={`https://your-store.${platform.toLowerCase()}.com`}
            helperText={`Your ${platform} store URL`}
          />
        ),
      },
      {
        label: 'API Credentials',
        description: 'Enter your API key and secret',
        content: (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="API Key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder="Enter your API key"
            />
            <TextField
              fullWidth
              label="API Secret"
              type={showApiSecret ? 'text' : 'password'}
              value={formData.api_secret}
              onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
              placeholder="Enter your API secret"
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowApiSecret(!showApiSecret)} edge="end">
                    {showApiSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                ),
              }}
            />
          </Box>
        ),
      },
      {
        label: 'Webhook Setup',
        description: 'Configure webhook for real-time order sync',
        content: (
          <Box>
            <Typography variant="body2" paragraph>
              Add this webhook URL to your {platform} store settings:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {formData.webhook_url}
                </Typography>
                <IconButton size="small" onClick={() => copyToClipboard(formData.webhook_url)}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
            <Alert severity="info" sx={{ mt: 2 }}>
              This webhook will automatically sync orders to Performile when they are created or updated.
            </Alert>
          </Box>
        ),
      },
    ];

    return baseSteps;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          E-commerce Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your e-commerce platforms to automatically sync orders and track deliveries
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">
                {integrations.filter(i => i.is_active).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Integrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">
                {integrations.reduce((sum, i) => sum + (i.orders_synced || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Orders Synced
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4">
                {platforms.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported Platforms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">
                {integrations.filter(i => !i.is_active).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Inactive Integrations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Platform Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {platforms.map((platform, index) => (
            <Tab
              key={platform.name}
              label={platform.name}
              icon={<platform.icon />}
              iconPosition="start"
            />
          ))}
        </Tabs>

        {platforms.map((platform, index) => (
          <TabPanel key={platform.name} value={activeTab} index={index}>
            <CardContent>
              {/* Platform Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <platform.icon sx={{ fontSize: 48, color: platform.color }} />
                  <Box>
                    <Typography variant="h5">{platform.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connect your {platform.name} store to sync orders automatically
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleSetupPlatform(platform.name)}
                >
                  Add Integration
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Existing Integrations */}
              {getIntegrationsByPlatform(platform.name).length > 0 ? (
                <List>
                  {getIntegrationsByPlatform(platform.name).map((integration) => (
                    <ListItem
                      key={integration.integration_id}
                      sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        {integration.is_active ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={integration.store_url}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip
                              size="small"
                              label={integration.is_active ? 'Active' : 'Inactive'}
                              color={integration.is_active ? 'success' : 'default'}
                            />
                            <Chip
                              size="small"
                              label={`${integration.orders_synced || 0} orders synced`}
                            />
                            {integration.last_sync && (
                              <Chip
                                size="small"
                                label={`Last sync: ${new Date(integration.last_sync).toLocaleDateString()}`}
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => syncIntegrationMutation.mutate(integration.integration_id)}
                          disabled={!integration.is_active || syncIntegrationMutation.isPending}
                        >
                          <SyncIcon />
                        </IconButton>
                        <IconButton edge="end">
                          <SettingsIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this integration?')) {
                              deleteIntegrationMutation.mutate(integration.integration_id);
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No {platform.name} integrations configured yet. Click "Add Integration" to get started.
                </Alert>
              )}

              {/* Documentation Link */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Need help?
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  href={platform.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View {platform.name} API Documentation
                </Button>
              </Box>
            </CardContent>
          </TabPanel>
        ))}
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupDialogOpen} onClose={() => setSetupDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Setup {selectedPlatform} Integration
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            {selectedPlatform && getSetupSteps(selectedPlatform).map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {step.description}
                  </Typography>
                  {step.content}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (index === getSetupSteps(selectedPlatform).length - 1) {
                          handleSubmitIntegration();
                        } else {
                          setActiveStep(index + 1);
                        }
                      }}
                      disabled={addIntegrationMutation.isPending}
                    >
                      {index === getSetupSteps(selectedPlatform).length - 1 
                        ? (addIntegrationMutation.isPending ? 'Connecting...' : 'Complete Setup')
                        : 'Continue'}
                    </Button>
                    {index > 0 && (
                      <Button onClick={() => setActiveStep(index - 1)} sx={{ ml: 1 }}>
                        Back
                      </Button>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSetupDialogOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
