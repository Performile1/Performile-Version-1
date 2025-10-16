import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  TextField,
  Button,
  Grid,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Home,
  Store,
  Lock,
  LocationOn,
  Business,
  Add,
  Delete,
  Save
} from '@mui/icons-material';
import { apiClient } from '@/services/apiClient'; 

interface CourierService {
  serviceId?: string;
  serviceType: string;
  isAvailable: boolean;
  priceModifier: number;
  estimatedDeliveryHours: number;
  coverageAreas: string[];
  specialInstructions: string;
}

const serviceTypeOptions = [
  { value: 'home_delivery', label: 'Home Delivery', icon: <Home /> },
  { value: 'parcelshop', label: 'Parcel Shop', icon: <Store /> },
  { value: 'parcellocker', label: 'Parcel Locker', icon: <Lock /> },
  { value: 'pickup_point', label: 'Pickup Point', icon: <LocationOn /> },
  { value: 'office_delivery', label: 'Office Delivery', icon: <Business /> }
];

const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<CourierService[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/rating/services/me');
      setServices(response.data.services || []);
    } catch (err: any) {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    setServices(prev => [...prev, {
      serviceType: 'home_delivery',
      isAvailable: true,
      priceModifier: 1.00,
      estimatedDeliveryHours: 24,
      coverageAreas: [],
      specialInstructions: ''
    }]);
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: keyof CourierService, value: any) => {
    setServices(prev => prev.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    ));
  };

  const handleCoverageAreasChange = (index: number, value: string) => {
    const areas = value.split(',').map(area => area.trim()).filter(area => area);
    updateService(index, 'coverageAreas', areas);
  };

  const saveServices = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await apiClient.put('/rating/services', { services });
      setMessage('Services updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save services');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          y Services Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={addService}
        >
          Add Service
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {services.map((service, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Service Type</InputLabel>
                    <Select
                      value={service.serviceType}
                      onChange={(e) => updateService(index, 'serviceType', e.target.value)}
                    >
                      {serviceTypeOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {option.icon}
                            {option.label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <IconButton
                    color="error"
                    onClick={() => removeService(index)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="body2">Available</Typography>
                  <Switch
                    checked={service.isAvailable}
                    onChange={(e) => updateService(index, 'isAvailable', e.target.checked)}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Price Modifier"
                      type="number"
                      value={service.priceModifier}
                      onChange={(e) => updateService(index, 'priceModifier', parseFloat(e.target.value) || 1.00)}
                      inputProps={{ min: 0.5, max: 3.0, step: 0.1 }}
                      helperText="1.0 = base price"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Delivery Hours"
                      type="number"
                      value={service.estimatedDeliveryHours}
                      onChange={(e) => updateService(index, 'estimatedDeliveryHours', parseInt(e.target.value) || 24)}
                      inputProps={{ min: 1, max: 168 }}
                      helperText="Estimated hours"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Coverage Areas"
                      value={service.coverageAreas.join(', ')}
                      onChange={(e) => handleCoverageAreasChange(index, e.target.value)}
                      placeholder="Enter postal codes or areas (comma separated)"
                      helperText="e.g. 1000, 2000, Downtown, City Center"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      label="Special Instructions"
                      value={service.specialInstructions}
                      onChange={(e) => updateService(index, 'specialInstructions', e.target.value)}
                      placeholder="Any special notes for this service type..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {services.length === 0 && !loading && (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Services Configured
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Add your first delivery service to get started
            </Typography>
            <Button variant="contained" startIcon={<Add />} onClick={addService}>
              Add Service
            </Button>
          </CardContent>
        </Card>
      )}

      {services.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={saveServices}
            disabled={saving}
            sx={{ minWidth: 200 }}
          >
            {saving ? 'Saving...' : 'Save Services'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ServiceManagement;
