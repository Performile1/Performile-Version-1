import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Info,
  Edit,
  TrendingUp,
  AttachMoney,
  Calculate,
  LocalShipping,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface PricingSettings {
  default_margin_type: 'percentage' | 'fixed';
  default_margin_value: number;
  round_prices: boolean;
  round_to: number;
  min_delivery_price?: number;
  max_delivery_price?: number;
  show_original_price: boolean;
  show_savings: boolean;
  currency: string;
}

interface CourierMargin {
  courier_id: string;
  courier_name: string;
  logo_url: string | null;
  courier_code: string;
  services: ServiceMargin[];
}

interface ServiceMargin {
  service_type: string;
  margin_type: 'percentage' | 'fixed';
  margin_value: number;
  fixed_price?: number;
  is_active: boolean;
}

interface PriceCalculation {
  base_price: number;
  margin_type: string;
  margin_value: number;
  margin_amount: number;
  final_price: number;
  rounded_price: number;
  savings: number;
}

export const MerchantPricingSettings: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Pricing settings state
  const [settings, setSettings] = useState<PricingSettings>({
    default_margin_type: 'percentage',
    default_margin_value: 15,
    round_prices: true,
    round_to: 5.00,
    min_delivery_price: undefined,
    max_delivery_price: undefined,
    show_original_price: false,
    show_savings: true,
    currency: 'NOK'
  });

  // Courier margins state
  const [courierMargins, setCourierMargins] = useState<CourierMargin[]>([]);
  const [editingCourier, setEditingCourier] = useState<CourierMargin | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Price calculator state
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calcBasePrice, setCalcBasePrice] = useState<number>(100);
  const [calcCourierId, setCalcCourierId] = useState<string>('');
  const [calcServiceType, setCalcServiceType] = useState<string>('express');
  const [calculation, setCalculation] = useState<PriceCalculation | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPricingSettings();
    fetchCourierMargins();
  }, []);

  const fetchPricingSettings = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/merchant/pricing-settings`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error: any) {
      console.error('Failed to fetch pricing settings:', error);
      toast.error('Failed to load pricing settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourierMargins = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/merchant/courier-margins`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setCourierMargins(response.data.couriers);
      }
    } catch (error: any) {
      console.error('Failed to fetch courier margins:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/merchant/pricing-settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        toast.success('Pricing settings saved successfully');
        setSettings(response.data.settings);
      }
    } catch (error: any) {
      console.error('Failed to save pricing settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCourier = (courier: CourierMargin) => {
    setEditingCourier(courier);
    setEditDialogOpen(true);
  };

  const handleSaveCourierMargins = async () => {
    if (!editingCourier) return;

    setSaving(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/merchant/courier-margins`,
        {
          courier_id: editingCourier.courier_id,
          services: editingCourier.services
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        toast.success('Courier margins saved successfully');
        setEditDialogOpen(false);
        fetchCourierMargins();
      }
    } catch (error: any) {
      console.error('Failed to save courier margins:', error);
      toast.error(error.response?.data?.error || 'Failed to save margins');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculatePrice = async () => {
    if (!calcCourierId || !calcBasePrice) {
      toast.error('Please select courier and enter base price');
      return;
    }

    setCalculating(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/merchant/calculate-price`,
        {
          courier_id: calcCourierId,
          service_type: calcServiceType,
          base_price: calcBasePrice
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setCalculation(response.data.calculation);
      }
    } catch (error: any) {
      console.error('Failed to calculate price:', error);
      toast.error('Failed to calculate price');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
          Pricing & Margins Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure your pricing strategy and profit margins for delivery services
        </Typography>
      </Box>

      {/* Global Margin Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <TrendingUp sx={{ mr: 1 }} />
          <Typography variant="h6">Global Margin Settings</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Margin Type</InputLabel>
              <Select
                value={settings.default_margin_type}
                label="Margin Type"
                onChange={(e) => setSettings({ 
                  ...settings, 
                  default_margin_type: e.target.value as 'percentage' | 'fixed' 
                })}
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label={settings.default_margin_type === 'percentage' ? 'Margin (%)' : `Margin (${settings.currency})`}
              type="number"
              value={settings.default_margin_value}
              onChange={(e) => setSettings({ 
                ...settings, 
                default_margin_value: parseFloat(e.target.value) || 0 
              })}
              InputProps={{
                endAdornment: settings.default_margin_type === 'percentage' ? '%' : settings.currency
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info" icon={<Info />}>
              This margin will be applied to all couriers by default. You can override it per courier below.
            </Alert>
          </Grid>
        </Grid>
      </Paper>

      {/* Price Rounding Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Calculate sx={{ mr: 1 }} />
          <Typography variant="h6">Price Rounding</Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.round_prices}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    round_prices: e.target.checked 
                  })}
                />
              }
              label="Round prices to nearest value"
            />
          </Grid>

          {settings.round_prices && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Round To"
                type="number"
                value={settings.round_to}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  round_to: parseFloat(e.target.value) || 1 
                })}
                helperText="Round to nearest 1, 5, 10, etc."
                InputProps={{
                  endAdornment: settings.currency
                }}
              />
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Minimum Delivery Price (Optional)"
              type="number"
              value={settings.min_delivery_price || ''}
              onChange={(e) => setSettings({ 
                ...settings, 
                min_delivery_price: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              InputProps={{
                endAdornment: settings.currency
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Maximum Delivery Price (Optional)"
              type="number"
              value={settings.max_delivery_price || ''}
              onChange={(e) => setSettings({ 
                ...settings, 
                max_delivery_price: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              InputProps={{
                endAdornment: settings.currency
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Display Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SettingsIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Display Settings</Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.show_original_price}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    show_original_price: e.target.checked 
                  })}
                />
              }
              label="Show original price (before margin)"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.show_savings}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    show_savings: e.target.checked 
                  })}
                />
              }
              label="Show savings amount"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Save Button */}
      <Box display="flex" justifyContent="flex-end" mb={4}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          Save Settings
        </Button>
      </Box>

      {/* Courier-Specific Margins */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <LocalShipping sx={{ mr: 1 }} />
            <Typography variant="h6">Courier-Specific Margins</Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Calculate />}
            onClick={() => setCalculatorOpen(true)}
          >
            Price Calculator
          </Button>
        </Box>

        {courierMargins.length === 0 ? (
          <Alert severity="info">
            No couriers selected yet. Go to Courier Preferences to select couriers first.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Courier</TableCell>
                  <TableCell>Services Configured</TableCell>
                  <TableCell>Using Global</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courierMargins.map((courier) => (
                  <TableRow key={courier.courier_id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {courier.logo_url && (
                          <img 
                            src={courier.logo_url} 
                            alt={courier.courier_name}
                            style={{ width: 40, height: 40, marginRight: 12, objectFit: 'contain' }}
                          />
                        )}
                        <Typography>{courier.courier_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {courier.services.length > 0 ? (
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {courier.services.map((service) => (
                            <Chip 
                              key={service.service_type}
                              label={service.service_type}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          None
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {courier.services.length === 0 ? (
                        <Chip label="Yes" size="small" color="default" />
                      ) : (
                        <Chip label="Custom" size="small" color="primary" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit margins">
                        <IconButton onClick={() => handleEditCourier(courier)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Edit Courier Margins Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Margins - {editingCourier?.courier_name}
        </DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Configure service-specific margins. Leave empty to use global settings.
            </Alert>

            <Grid container spacing={2}>
              {['express', 'standard', 'economy', 'same_day'].map((serviceType) => {
                const existingService = editingCourier?.services.find(
                  s => s.service_type === serviceType
                );

                return (
                  <Grid item xs={12} key={serviceType}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom sx={{ textTransform: 'capitalize' }}>
                          {serviceType.replace('_', ' ')}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={existingService?.margin_type || 'percentage'}
                                label="Type"
                                onChange={(e) => {
                                  if (!editingCourier) return;
                                  const services = [...editingCourier.services];
                                  const index = services.findIndex(s => s.service_type === serviceType);
                                  if (index >= 0) {
                                    services[index].margin_type = e.target.value as 'percentage' | 'fixed';
                                  } else {
                                    services.push({
                                      service_type: serviceType,
                                      margin_type: e.target.value as 'percentage' | 'fixed',
                                      margin_value: 0,
                                      is_active: true
                                    });
                                  }
                                  setEditingCourier({ ...editingCourier, services });
                                }}
                              >
                                <MenuItem value="percentage">Percentage</MenuItem>
                                <MenuItem value="fixed">Fixed</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Value"
                              type="number"
                              value={existingService?.margin_value || 0}
                              onChange={(e) => {
                                if (!editingCourier) return;
                                const services = [...editingCourier.services];
                                const index = services.findIndex(s => s.service_type === serviceType);
                                if (index >= 0) {
                                  services[index].margin_value = parseFloat(e.target.value) || 0;
                                } else {
                                  services.push({
                                    service_type: serviceType,
                                    margin_type: 'percentage',
                                    margin_value: parseFloat(e.target.value) || 0,
                                    is_active: true
                                  });
                                }
                                setEditingCourier({ ...editingCourier, services });
                              }}
                            />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveCourierMargins}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            Save Margins
          </Button>
        </DialogActions>
      </Dialog>

      {/* Price Calculator Dialog */}
      <Dialog 
        open={calculatorOpen} 
        onClose={() => setCalculatorOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Price Calculator</DialogTitle>
        <DialogContent>
          <Box py={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Courier</InputLabel>
                  <Select
                    value={calcCourierId}
                    label="Courier"
                    onChange={(e) => setCalcCourierId(e.target.value)}
                  >
                    {courierMargins.map((courier) => (
                      <MenuItem key={courier.courier_id} value={courier.courier_id}>
                        {courier.courier_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Service Type</InputLabel>
                  <Select
                    value={calcServiceType}
                    label="Service Type"
                    onChange={(e) => setCalcServiceType(e.target.value)}
                  >
                    <MenuItem value="express">Express</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="economy">Economy</MenuItem>
                    <MenuItem value="same_day">Same Day</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Base Price"
                  type="number"
                  value={calcBasePrice}
                  onChange={(e) => setCalcBasePrice(parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: settings.currency
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleCalculatePrice}
                  disabled={calculating}
                  startIcon={calculating ? <CircularProgress size={20} /> : <Calculate />}
                >
                  Calculate
                </Button>
              </Grid>

              {calculation && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Calculation Result</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography>Base Price:</Typography>
                        <Typography fontWeight="bold">
                          {calculation.base_price.toFixed(2)} {settings.currency}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography>Margin ({calculation.margin_type}):</Typography>
                        <Typography>
                          {calculation.margin_value.toFixed(2)}
                          {calculation.margin_type === 'percentage' ? '%' : ` ${settings.currency}`}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography>Margin Amount:</Typography>
                        <Typography color="success.main">
                          +{calculation.margin_amount.toFixed(2)} {settings.currency}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between" py={1}>
                        <Typography variant="h6">Final Price:</Typography>
                        <Typography variant="h6" color="primary">
                          {calculation.rounded_price.toFixed(2)} {settings.currency}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalculatorOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MerchantPricingSettings;
