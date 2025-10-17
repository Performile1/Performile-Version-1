import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MyLocation as LocationIcon,
  Map as MapIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

interface PostalCodeRange {
  start: string;
  end: string;
}

interface ProximitySettings {
  setting_id?: string;
  entity_type: string;
  entity_id: string;
  delivery_range_km: number;
  postal_code_ranges: PostalCodeRange[];
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  auto_accept_within_range: boolean;
  notify_on_nearby_orders: boolean;
  priority_zones: any[];
  is_active: boolean;
}

export const ProximitySettings: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);
  const [newRange, setNewRange] = useState({ start: '', end: '' });
  const [geocoding, setGeocoding] = useState(false);

  // Determine entity type and ID based on user role
  const entityType = user?.user_role === 'merchant' ? 'merchant' : 'courier';
  const entityId = user?.user_id; // Simplified - should get actual merchant/courier ID

  // Fetch settings
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['proximity-settings', entityType, entityId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/proximity/settings?entity_type=${entityType}&entity_id=${entityId}`);
        return response.data.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          // Return default settings if not found
          return {
            entity_type: entityType,
            entity_id: entityId,
            delivery_range_km: entityType === 'merchant' ? 50 : 100,
            postal_code_ranges: [],
            auto_accept_within_range: false,
            notify_on_nearby_orders: true,
            priority_zones: [],
            is_active: true,
          };
        }
        throw error;
      }
    },
    enabled: !!entityId,
  });

  const [formData, setFormData] = useState<ProximitySettings | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ProximitySettings) => {
      if (data.setting_id) {
        return apiClient.put(`/proximity/settings?setting_id=${data.setting_id}`, data);
      } else {
        return apiClient.post('/proximity/settings', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proximity-settings'] });
      setHasChanges(false);
    },
  });

  // Geocode address mutation
  const geocodeMutation = useMutation({
    mutationFn: async (address: string) => {
      const response = await apiClient.post('/proximity/geocode', { address });
      return response.data.data;
    },
    onSuccess: (data) => {
      if (formData) {
        setFormData({
          ...formData,
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city,
          country: data.country,
          postal_code: data.postal_code,
          address: data.formatted_address,
        });
        setHasChanges(true);
      }
    },
  });

  const handleChange = (field: keyof ProximitySettings, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
      setHasChanges(true);
    }
  };

  const handleAddRange = () => {
    if (newRange.start && newRange.end && formData) {
      setFormData({
        ...formData,
        postal_code_ranges: [...formData.postal_code_ranges, newRange],
      });
      setNewRange({ start: '', end: '' });
      setHasChanges(true);
    }
  };

  const handleRemoveRange = (index: number) => {
    if (formData) {
      const newRanges = [...formData.postal_code_ranges];
      newRanges.splice(index, 1);
      setFormData({ ...formData, postal_code_ranges: newRanges });
      setHasChanges(true);
    }
  };

  const handleGeocode = async () => {
    if (formData?.address) {
      setGeocoding(true);
      try {
        await geocodeMutation.mutateAsync(formData.address);
      } finally {
        setGeocoding(false);
      }
    }
  };

  const handleSave = () => {
    if (formData) {
      saveMutation.mutate(formData);
    }
  };

  if (isLoading || !formData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📍 Proximity Settings
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || saveMutation.isPending}
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {saveMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => saveMutation.reset()}>
          Proximity settings saved successfully!
        </Alert>
      )}

      {saveMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to save settings. Please try again.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Location Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📍 Location
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Address"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                margin="normal"
                placeholder="Enter your full address"
              />

              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<LocationIcon />}
                  onClick={handleGeocode}
                  disabled={!formData.address || geocoding}
                  fullWidth
                >
                  {geocoding ? 'Geocoding...' : 'Get Coordinates'}
                </Button>
              </Box>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={formData.latitude || ''}
                    onChange={(e) => handleChange('latitude', parseFloat(e.target.value))}
                    type="number"
                    inputProps={{ step: 0.000001 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={formData.longitude || ''}
                    onChange={(e) => handleChange('longitude', parseFloat(e.target.value))}
                    type="number"
                    inputProps={{ step: 0.000001 }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Postal Code"
                    value={formData.postal_code || ''}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={formData.country || ''}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Range Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Service Range
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label={entityType === 'merchant' ? 'Delivery Range (km)' : 'Service Range (km)'}
                value={formData.delivery_range_km}
                onChange={(e) => handleChange('delivery_range_km', parseInt(e.target.value) || 0)}
                type="number"
                margin="normal"
                helperText="Maximum distance for deliveries/services"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.auto_accept_within_range}
                    onChange={(e) => handleChange('auto_accept_within_range', e.target.checked)}
                  />
                }
                label="Auto-accept orders within range"
                sx={{ mt: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.notify_on_nearby_orders}
                    onChange={(e) => handleChange('notify_on_nearby_orders', e.target.checked)}
                  />
                }
                label="Notify on nearby orders"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                  />
                }
                label="Proximity matching active"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Postal Code Ranges */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📮 Postal Code Ranges
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Define postal code ranges you want to serve. Leave empty to use distance-based matching only.
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Start"
                    value={newRange.start}
                    onChange={(e) => setNewRange({ ...newRange, start: e.target.value })}
                    placeholder="1000"
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="End"
                    value={newRange.end}
                    onChange={(e) => setNewRange({ ...newRange, end: e.target.value })}
                    placeholder="1999"
                  />
                </Grid>
                <Grid item xs={2}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddRange}
                    disabled={!newRange.start || !newRange.end}
                    fullWidth
                    sx={{ height: '56px' }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.postal_code_ranges.map((range, index) => (
                  <Chip
                    key={index}
                    label={`${range.start} - ${range.end}`}
                    onDelete={() => handleRemoveRange(index)}
                    deleteIcon={<DeleteIcon />}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {formData.postal_code_ranges.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No postal code ranges defined. Using distance-based matching only.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Map Preview (Placeholder) */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🗺️ Coverage Map
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  height: 300,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <MapIcon sx={{ fontSize: 60, color: 'grey.400', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Map integration coming soon
                  </Typography>
                  {formData.latitude && formData.longitude && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Location: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProximitySettings;
