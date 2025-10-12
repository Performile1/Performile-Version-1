import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  LinearProgress,
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Store,
  Language,
  LocationOn,
  Email,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getUsagePercentage, formatLimit } from '@/utils/subscriptionHelpers';

interface Shop {
  shop_id: string;
  shop_name: string;
  website_url: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
}

interface ShopsSettingsProps {
  subscriptionInfo: any;
}

export const ShopsSettings: React.FC<ShopsSettingsProps> = ({ subscriptionInfo }) => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    shop_name: '',
    website_url: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'Sweden',
  });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShops(response.data.shops || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (shop?: Shop) => {
    if (shop) {
      setEditingShop(shop);
      setFormData({
        shop_name: shop.shop_name,
        website_url: shop.website_url,
        description: shop.description,
        contact_email: shop.contact_email,
        contact_phone: shop.contact_phone,
        address: shop.address,
        city: shop.city,
        postal_code: shop.postal_code,
        country: shop.country,
      });
    } else {
      setEditingShop(null);
      setFormData({
        shop_name: '',
        website_url: '',
        description: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        city: '',
        postal_code: '',
        country: 'Sweden',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingShop(null);
  };

  const handleSaveShop = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (editingShop) {
        // Update existing shop
        await axios.put(
          `/api/shops/${editingShop.shop_id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Shop updated successfully');
      } else {
        // Create new shop
        await axios.post('/api/shops', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Shop created successfully');
      }
      
      handleCloseDialog();
      fetchShops();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to save shop';
      toast.error(message);
      
      if (message.includes('limit')) {
        setTimeout(() => {
          if (confirm('Upgrade your subscription to add more shops?')) {
            navigate('/pricing');
          }
        }, 1000);
      }
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/shops/${shopId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Shop deleted successfully');
      fetchShops();
    } catch (error) {
      toast.error('Failed to delete shop');
    }
  };

  const handleToggleActive = async (shopId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/shops/${shopId}`,
        { is_active: !isActive },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(isActive ? 'Shop deactivated' : 'Shop activated');
      fetchShops();
    } catch (error) {
      toast.error('Failed to update shop status');
    }
  };

  if (loading) {
    return <Box sx={{ p: 3 }}><LinearProgress /></Box>;
  }

  const maxShops = subscriptionInfo?.subscription?.max_shops;
  const shopsCreated = subscriptionInfo?.usage?.shops_created || shops.length;
  const canAddMore = maxShops === null || shopsCreated < maxShops;
  const usagePercentage = getUsagePercentage(shopsCreated, maxShops);
  const _usageColor = getUsageColor(shopsCreated, maxShops); // Prefix with _ to indicate intentionally unused

  return (
    <Box>
      {/* Header with Usage */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Your Shops
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              Manage multiple shops and locations. Each shop can have its own settings and tracking page.
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h3" fontWeight={700}>
                {shopsCreated}
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.8 }}>
                / {formatLimit(maxShops)}
              </Typography>
            </Box>
            
            {maxShops !== null && (
              <LinearProgress 
                variant="determinate" 
                value={Math.min(usagePercentage, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: usagePercentage >= 100 ? '#ff5252' : 'white',
                  }
                }}
              />
            )}
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => canAddMore ? handleOpenDialog() : navigate('/pricing')}
              disabled={!canAddMore && maxShops !== null}
              sx={{
                bgcolor: 'white',
                color: '#667eea',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                },
              }}
            >
              {canAddMore ? 'Add Shop' : 'Upgrade to Add More'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Limit Warning */}
      {!canAddMore && maxShops !== null && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You've reached your shop limit ({maxShops} shops).
          <Button size="small" onClick={() => navigate('/pricing')} sx={{ ml: 1 }}>
            Upgrade Now
          </Button>
        </Alert>
      )}

      {/* Shops List */}
      {shops.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Store sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No shops yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first shop to start managing orders and tracking
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Create Your First Shop
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {shops.map((shop) => (
            <Grid item xs={12} md={6} key={shop.shop_id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                      <Store />
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {shop.shop_name}
                        </Typography>
                        {shop.is_active ? (
                          <Chip label="Active" size="small" color="success" icon={<CheckCircle />} />
                        ) : (
                          <Chip label="Inactive" size="small" color="default" icon={<Warning />} />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {shop.description || 'No description'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    {shop.website_url && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Language fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {shop.website_url}
                        </Typography>
                      </Box>
                    )}
                    
                    {shop.contact_email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {shop.contact_email}
                        </Typography>
                      </Box>
                    )}
                    
                    {shop.city && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {shop.city}, {shop.country}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={shop.is_active}
                          onChange={() => handleToggleActive(shop.shop_id, shop.is_active)}
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">Active</Typography>}
                    />
                    
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenDialog(shop)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteShop(shop.shop_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Shop Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingShop ? 'Edit Shop' : 'Add New Shop'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Shop Name"
                  value={formData.shop_name}
                  onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website URL"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://yourshop.com"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Postal Code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveShop} variant="contained">
            {editingShop ? 'Update Shop' : 'Create Shop'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
