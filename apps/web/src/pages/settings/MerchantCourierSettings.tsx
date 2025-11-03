import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Switch,
  TextField,
  IconButton,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Grid,
  Tooltip,
  Badge,
} from '@mui/material';
import { Star, DragIndicator, Edit, Check, Close, Add, Delete, Lock, Info, Upgrade, VpnKey, CheckCircle, Warning } from '@mui/icons-material';
import { CourierLogo } from '@/components/courier/CourierLogo';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Courier {
  courier_id: string;
  courier_name: string;
  logo_url: string | null;
  trust_score: number;
  is_active: boolean;
  display_order: number;
  custom_name: string | null;
  custom_description: string | null;
  priority_level: number;
  total_deliveries: number;
  reliability_score: number;
  courier_code: string;
  credentials_configured: boolean;
  has_credentials: boolean;
  customer_number?: string;
  credential_id?: string;
}

interface AvailableCourier {
  courier_id: string;
  courier_name: string;
  logo_url: string | null;
  trust_score: number;
  total_deliveries: number;
  is_selected: boolean;
  can_add_more: boolean;
  courier_code: string;
}

interface SubscriptionInfo {
  subscription: {
    plan_name: string;
    tier: number;
    max_couriers: number | null;
    max_shops: number | null;
    max_orders_per_month: number | null;
    has_api_access: boolean;
    has_advanced_analytics: boolean;
    has_custom_templates: boolean;
    has_white_label: boolean;
  };
  usage: {
    couriers_selected: number;
    shops_created: number;
    can_add_courier: boolean;
  };
}

export const MerchantCourierSettings: React.FC = () => {
  const navigate = useNavigate();
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<AvailableCourier[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [apiKey, setApiKey] = useState('');
  
  // Credentials management state
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [selectedCourierForCredentials, setSelectedCourierForCredentials] = useState<Courier | null>(null);
  const [credentialsForm, setCredentialsForm] = useState({
    customer_number: '',
    api_key: '',
    account_name: '',
    base_url: ''
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSubscriptionInfo(),
        fetchSelectedCouriers(),
        fetchAvailableCouriers(),
        fetchApiKey(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'get_subscription_info' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubscriptionInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  const fetchSelectedCouriers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'get_selected_couriers' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCouriers(response.data.couriers || []);
    } catch (error) {
      console.error('Error fetching couriers:', error);
      toast.error('Failed to load couriers');
    }
  };

  const fetchAvailableCouriers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'get_available_couriers' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAvailableCouriers(response.data.couriers || []);
    } catch (error) {
      console.error('Error fetching available couriers:', error);
    }
  };

  const fetchApiKey = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/auth/api-key', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiKey(response.data.api_key || '');
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const handleAddCourier = async (courierId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'add_courier', courier_id: courierId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Courier added successfully');
      fetchData();
      setAddDialogOpen(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add courier';
      toast.error(message);
      
      if (message.includes('limit reached')) {
        // Show upgrade prompt
        setTimeout(() => {
          if (confirm('Upgrade your subscription to add more couriers?')) {
            navigate('/pricing');
          }
        }, 1000);
      }
    }
  };

  const handleRemoveCourier = async (courierId: string) => {
    if (!confirm('Are you sure you want to remove this courier?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'remove_courier', courier_id: courierId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Courier removed successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove courier');
    }
  };

  const handleToggleActive = async (courierId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/couriers/merchant-preferences',
        { 
          action: 'toggle_courier_active', 
          courier_id: courierId,
          is_active: !isActive 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(isActive ? 'Courier disabled' : 'Courier enabled');
      fetchSelectedCouriers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update courier');
    }
  };

  const handleSaveCustomName = async (courierId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/couriers/merchant-preferences',
        { 
          action: 'update_courier_settings', 
          courier_id: courierId,
          custom_name: customName || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Courier name updated');
      setEditingCourier(null);
      setCustomName('');
      fetchSelectedCouriers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update courier');
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  const getCourierLogo = (courierName: string, logoUrl: string | null) => {
    // Try to use the logo from courier-logos folder
    const normalizedName = courierName.toLowerCase().replace(/\s+/g, '_');
    const logoPath = `/courier-logos/${normalizedName}_logo.jpeg`;
    
    // Return the logo path or fallback to logoUrl or first letter
    return logoPath;
  };

  const getUsagePercentage = () => {
    if (!subscriptionInfo) return 0;
    const { max_couriers } = subscriptionInfo.subscription;
    const { couriers_selected } = subscriptionInfo.usage;
    
    if (max_couriers === null) return 0; // Unlimited
    return (couriers_selected / max_couriers) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 100) return 'error';
    if (percentage >= 80) return 'warning';
    return 'success';
  };

  // Credentials management functions
  const getCourierBaseUrl = (courierCode: string): string => {
    const urls: Record<string, string> = {
      'POSTNORD': 'https://api2.postnord.com',
      'BRING': 'https://api.bring.com',
      'DHL': 'https://api-eu.dhl.com',
      'UPS': 'https://onlinetools.ups.com',
      'FEDEX': 'https://apis.fedex.com',
      'INSTABOX': 'https://api.instabox.io',
      'BUDBEE': 'https://api.budbee.com',
      'PORTERBUDDY': 'https://api.porterbuddy.com'
    };
    return urls[courierCode] || '';
  };

  const handleAddCredentials = (courier: Courier) => {
    setSelectedCourierForCredentials(courier);
    setCredentialsForm({
      customer_number: courier.customer_number || '',
      api_key: '',
      account_name: '',
      base_url: getCourierBaseUrl(courier.courier_code)
    });
    setTestResult(null);
    setCredentialsModalOpen(true);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/courier-credentials/test',
        {
          courier_id: selectedCourierForCredentials?.courier_id,
          customer_number: credentialsForm.customer_number,
          api_key: credentialsForm.api_key,
          base_url: credentialsForm.base_url
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTestResult({
        success: true,
        message: response.data.message || 'Connection successful!'
      });
      toast.success('Connection test passed!');
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection failed'
      });
      toast.error('Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!testResult?.success) {
      toast.error('Please test the connection first');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/courier-credentials',
        {
          courier_id: selectedCourierForCredentials?.courier_id,
          customer_number: credentialsForm.customer_number,
          api_key: credentialsForm.api_key,
          account_name: credentialsForm.account_name,
          base_url: credentialsForm.base_url
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Credentials saved successfully');
      setCredentialsModalOpen(false);
      fetchSelectedCouriers(); // Refresh to show updated status
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save credentials');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const maxCouriers = subscriptionInfo?.subscription?.max_couriers;
  const couriersSelected = subscriptionInfo?.usage.couriers_selected || 0;
  const canAddMore = subscriptionInfo?.usage.can_add_courier !== false;
  const planName = subscriptionInfo?.subscription.plan_name || 'Free';
  const tier = subscriptionInfo?.subscription.tier || 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Courier Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage which couriers appear in your checkout. Your customers will only see the couriers you select here.
        </Typography>
      </Box>

      {/* Subscription Status */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip 
                label={planName} 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 600 
                }} 
              />
              {tier >= 2 && (
                <Chip 
                  icon={<Star sx={{ color: 'gold !important' }} />}
                  label="Premium" 
                  sx={{ bgcolor: 'rgba(255,215,0,0.3)', color: 'white' }} 
                />
              )}
            </Box>
            
            <Typography variant="h6" gutterBottom>
              Courier Selection Limit
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h3" fontWeight={700}>
                {couriersSelected}
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.8 }}>
                / {maxCouriers === null ? '∞' : maxCouriers}
              </Typography>
            </Box>
            
            {maxCouriers !== null && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(getUsagePercentage(), 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getUsagePercentage() >= 100 ? '#ff5252' : 'white',
                    }
                  }}
                />
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            {!canAddMore && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Upgrade />}
                onClick={() => navigate('/pricing')}
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Upgrade Plan
              </Button>
            )}
            {maxCouriers !== null && maxCouriers !== undefined && canAddMore && (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {maxCouriers - couriersSelected} slots remaining
              </Typography>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* API Key Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Key for E-commerce Plugins
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Use this API key to configure WooCommerce, Shopify, or other e-commerce plugins.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            value={apiKey}
            InputProps={{ readOnly: true }}
            size="small"
            type="password"
          />
          <Button variant="outlined" onClick={copyApiKey}>
            Copy
          </Button>
        </Box>
      </Paper>

      {/* Selected Couriers */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Your Selected Couriers ({couriers.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={canAddMore ? <Add /> : <Lock />}
            onClick={() => canAddMore ? setAddDialogOpen(true) : navigate('/pricing')}
            disabled={!canAddMore && maxCouriers !== null}
          >
            {canAddMore ? 'Add Courier' : 'Upgrade to Add More'}
          </Button>
        </Box>

        {!canAddMore && maxCouriers !== null && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You've reached your courier limit ({maxCouriers} couriers). 
            <Button 
              size="small" 
              onClick={() => navigate('/pricing')}
              sx={{ ml: 1 }}
            >
              Upgrade Now
            </Button>
          </Alert>
        )}

        {couriers.length === 0 ? (
          <Alert severity="info">
            No couriers selected. Click "Add Courier" to get started.
          </Alert>
        ) : (
          <List>
            {couriers.map((courier) => (
              <Card key={courier.courier_id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" sx={{ cursor: 'grab' }}>
                      <DragIndicator />
                    </IconButton>

                    <CourierLogo
                      courierCode={courier.courier_code || courier.courier_name}
                      courierName={courier.courier_name}
                      size="large"
                      variant="rounded"
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      {editingCourier === courier.courier_id ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder={courier.courier_name}
                            autoFocus
                          />
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleSaveCustomName(courier.courier_id)}
                          >
                            <Check />
                          </IconButton>
                          <IconButton 
                            size="small"
                            onClick={() => {
                              setEditingCourier(null);
                              setCustomName('');
                            }}
                          >
                            <Close />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {courier.custom_name || courier.courier_name}
                          </Typography>
                          <Tooltip title="Edit display name">
                            <IconButton 
                              size="small"
                              onClick={() => {
                                setEditingCourier(courier.courier_id);
                                setCustomName(courier.custom_name || courier.courier_name);
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Star fontSize="small" sx={{ color: 'warning.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            {courier.trust_score.toFixed(1)} TrustScore
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          • {courier.total_deliveries.toLocaleString()} deliveries
                        </Typography>
                        
                        {courier.priority_level > 0 && (
                          <Chip 
                            label={`Priority ${courier.priority_level}`} 
                            size="small" 
                            color="primary" 
                          />
                        )}
                        
                        {/* Credentials Status */}
                        {courier.credentials_configured ? (
                          <Chip 
                            icon={<CheckCircle />}
                            label={`Credentials: ${courier.customer_number}`}
                            size="small" 
                            color="success" 
                          />
                        ) : (
                          <Chip 
                            icon={<Warning />}
                            label="No Credentials"
                            size="small" 
                            color="warning" 
                          />
                        )}
                      </Box>
                    </Box>

                    {/* Credentials Button */}
                    {courier.credentials_configured ? (
                      <Tooltip title="Edit credentials">
                        <IconButton
                          color="primary"
                          onClick={() => handleAddCredentials(courier)}
                        >
                          <VpnKey />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VpnKey />}
                        onClick={() => handleAddCredentials(courier)}
                        sx={{ mr: 1 }}
                      >
                        Add Credentials
                      </Button>
                    )}

                    <Tooltip title={courier.is_active ? 'Disable' : 'Enable'}>
                      <Switch
                        checked={courier.is_active}
                        onChange={() => handleToggleActive(courier.courier_id, courier.is_active)}
                      />
                    </Tooltip>

                    <Tooltip title="Remove courier">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveCourier(courier.courier_id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Paper>

      {/* Add Courier Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Courier</Typography>
            <Chip 
              label={`${couriersSelected} / ${maxCouriers === null ? '∞' : maxCouriers} selected`}
              color={getUsageColor()}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {availableCouriers
              .filter(ac => !ac.is_selected)
              .map(courier => (
                <ListItem 
                  key={courier.courier_id}
                  button 
                  onClick={() => canAddMore && handleAddCourier(courier.courier_id)}
                  disabled={!canAddMore}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={!canAddMore ? <Lock fontSize="small" /> : null}
                      color="error"
                    >
                      <CourierLogo
                        courierCode={courier.courier_code || courier.courier_name}
                        courierName={courier.courier_name}
                        size="medium"
                        variant="rounded"
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={courier.courier_name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star fontSize="small" sx={{ color: 'warning.main' }} />
                        <span>{courier.trust_score.toFixed(1)} TrustScore</span>
                        <span>• {courier.total_deliveries.toLocaleString()} deliveries</span>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {canAddMore ? (
                      <IconButton 
                        edge="end" 
                        onClick={() => handleAddCourier(courier.courier_id)}
                        color="primary"
                      >
                        <Add />
                      </IconButton>
                    ) : (
                      <Tooltip title="Upgrade to add more couriers">
                        <IconButton edge="end" disabled>
                          <Lock />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
          
          {!canAddMore && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              You've reached your courier limit. 
              <Button 
                size="small" 
                onClick={() => {
                  setAddDialogOpen(false);
                  navigate('/pricing');
                }}
                sx={{ ml: 1 }}
              >
                Upgrade Now
              </Button>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Credentials Modal */}
      <Dialog 
        open={credentialsModalOpen} 
        onClose={() => setCredentialsModalOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {selectedCourierForCredentials?.credentials_configured ? 'Edit' : 'Add'} {selectedCourierForCredentials?.courier_name} Credentials
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Customer Number"
              value={credentialsForm.customer_number}
              onChange={(e) => setCredentialsForm({...credentialsForm, customer_number: e.target.value})}
              required
              sx={{ mb: 2 }}
              helperText={`Find this in your ${selectedCourierForCredentials?.courier_name} portal`}
            />
            
            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={credentialsForm.api_key}
              onChange={(e) => setCredentialsForm({...credentialsForm, api_key: e.target.value})}
              required
              sx={{ mb: 2 }}
              helperText={`Generate this in ${selectedCourierForCredentials?.courier_name} Developer Portal`}
            />
            
            <TextField
              fullWidth
              label="Account Name (optional)"
              value={credentialsForm.account_name}
              onChange={(e) => setCredentialsForm({...credentialsForm, account_name: e.target.value})}
              sx={{ mb: 2 }}
              helperText="e.g., Main Account, Store 1"
            />
            
            <TextField
              fullWidth
              label="API Base URL"
              value={credentialsForm.base_url}
              onChange={(e) => setCredentialsForm({...credentialsForm, base_url: e.target.value})}
              sx={{ mb: 2 }}
              helperText="API endpoint URL"
            />
            
            <Button
              fullWidth
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testingConnection || !credentialsForm.customer_number || !credentialsForm.api_key}
              sx={{ mb: 2 }}
            >
              {testingConnection ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            
            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {testResult.message}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCredentialsModalOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCredentials}
            variant="contained"
            disabled={!testResult?.success}
          >
            Save Credentials
          </Button>
        </DialogActions>
      </Dialog>

      {/* Instructions */}
      <Alert severity="info" icon={<Info />}>
        <Typography variant="subtitle2" gutterBottom fontWeight={600}>
          How Courier Selection Works:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Only selected couriers will appear in your checkout</li>
          <li>Drag to reorder (top couriers are recommended first)</li>
          <li>Toggle switch to enable/disable without removing</li>
          <li>Customize courier names for your customers</li>
          <li>Add API credentials to enable booking with each courier</li>
          <li>Your subscription plan determines how many couriers you can select</li>
        </ul>
      </Alert>
    </Container>
  );
};
