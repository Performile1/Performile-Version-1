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
} from '@mui/material';
import {
  Add,
  DragIndicator,
  Delete,
  Star,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Courier {
  courier_id: string;
  courier_name: string;
  logo_url: string | null;
  trust_score: number;
  is_active: boolean;
  display_order: number;
  custom_name: string | null;
  priority_level: number;
}

interface AvailableCourier {
  courier_id: string;
  courier_name: string;
  logo_url: string | null;
  trust_score: number;
}

export const CourierPreferences: React.FC = () => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<AvailableCourier[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    fetchMerchantCouriers();
    fetchAvailableCouriers();
    fetchApiKey();
  }, []);

  const fetchMerchantCouriers = async () => {
    try {
      // Get token from auth store
      const authData = localStorage.getItem('performile-auth');
      const token = authData ? JSON.parse(authData).state?.tokens?.accessToken : null;
      
      const response = await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'get_selected_couriers' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Convert numeric strings to numbers
      const couriers = (response.data.couriers || []).map((c: any) => ({
        ...c,
        trust_score: Number(c.trust_score) || 0,
        display_order: Number(c.display_order) || 0,
        priority_level: Number(c.priority_level) || 0
      }));
      setCouriers(couriers);
    } catch (error) {
      console.error('Error fetching couriers:', error);
      toast.error('Failed to load couriers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCouriers = async () => {
    try {
      // Get token from auth store
      const authData = localStorage.getItem('performile-auth');
      const token = authData ? JSON.parse(authData).state?.tokens?.accessToken : null;
      const response = await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'get_available_couriers' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Convert trust_score from string to number
      const couriers = (response.data.couriers || []).map((c: any) => ({
        ...c,
        trust_score: Number(c.trust_score) || 0
      }));
      setAvailableCouriers(couriers);
    } catch (error) {
      console.error('Error fetching available couriers:', error);
    }
  };

  const fetchApiKey = async () => {
    try {
      // Get token from auth store
      const authData = localStorage.getItem('performile-auth');
      const token = authData ? JSON.parse(authData).state?.tokens?.accessToken : null;
      const response = await axios.get('/api/auth/api-key', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKey(response.data.api_key || '');
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const handleAddCourier = async (courierId: string) => {
    try {
      // Get token from auth store
      const authData = localStorage.getItem('performile-auth');
      const token = authData ? JSON.parse(authData).state?.tokens?.accessToken : null;
      await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'add_courier', courier_id: courierId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Courier added successfully');
      fetchMerchantCouriers();
      setAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add courier');
    }
  };

  const handleRemoveCourier = async (courierId: string) => {
    if (!confirm('Are you sure you want to remove this courier?')) {
      return;
    }

    try {
      // Get token from auth store
      const authData = localStorage.getItem('performile-auth');
      const token = authData ? JSON.parse(authData).state?.tokens?.accessToken : null;
      await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'remove_courier', courier_id: courierId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Courier removed successfully');
      fetchMerchantCouriers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove courier');
    }
  };

  const handleToggleActive = async (courierId: string, isActive: boolean) => {
    try {
      // Get token from auth store
      const authData = localStorage.getItem('performile-auth');
      const token = authData ? JSON.parse(authData).state?.tokens?.accessToken : null;
      await axios.post(
        '/api/couriers/merchant-preferences',
        { action: 'toggle_courier_active', courier_id: courierId, is_active: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(isActive ? 'Courier disabled' : 'Courier enabled');
      fetchMerchantCouriers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update courier');
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API key copied to clipboard');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Courier Preferences
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select which couriers to show in your checkout. Only selected couriers will be visible to your customers.
        </Typography>
      </Box>

      {/* API Key Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          API Key for Plugins
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
            Your Couriers ({couriers.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setAddDialogOpen(true)}
          >
            Add Courier
          </Button>
        </Box>

        {couriers.length === 0 ? (
          <Alert severity="info">
            No couriers selected. Click "Add Courier" to get started.
          </Alert>
        ) : (
          <List>
            {couriers.map((courier, index) => (
              <Card key={courier.courier_id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small">
                      <DragIndicator />
                    </IconButton>

                    <Avatar src={courier.logo_url || undefined} alt={courier.courier_name}>
                      {courier.courier_name.charAt(0)}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {courier.custom_name || courier.courier_name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Star fontSize="small" sx={{ color: 'warning.main' }} />
                        <Typography variant="body2" color="text.secondary">
                          {courier.trust_score.toFixed(1)} TrustScore
                        </Typography>
                        {courier.priority_level > 0 && (
                          <Chip label={`Priority ${courier.priority_level}`} size="small" color="primary" />
                        )}
                      </Box>
                    </Box>

                    <Switch
                      checked={courier.is_active}
                      onChange={() => handleToggleActive(courier.courier_id, courier.is_active)}
                    />

                    <IconButton
                      color="error"
                      onClick={() => handleRemoveCourier(courier.courier_id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Paper>

      {/* Add Courier Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Courier</DialogTitle>
        <DialogContent>
          <List>
            {availableCouriers
              .filter(ac => !couriers.find(c => c.courier_id === ac.courier_id))
              .map(courier => (
                <ListItem key={courier.courier_id} button onClick={() => handleAddCourier(courier.courier_id)}>
                  <ListItemAvatar>
                    <Avatar src={courier.logo_url || undefined}>
                      {courier.courier_name.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={courier.courier_name}
                    secondary={`${courier.trust_score.toFixed(1)} TrustScore`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleAddCourier(courier.courier_id)}>
                      <Add />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Instructions */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          How it works:
        </Typography>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>Only selected couriers will show in your checkout</li>
          <li>Drag to reorder (top couriers are recommended first)</li>
          <li>Toggle switch to enable/disable without removing</li>
          <li>Use API key to configure e-commerce plugins</li>
        </ul>
      </Alert>
    </Container>
  );
};
