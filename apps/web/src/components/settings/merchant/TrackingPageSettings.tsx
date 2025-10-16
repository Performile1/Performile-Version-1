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
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  InputAdornment,
  Chip,
  // Image, // Not exported from MUI
} from '@mui/material';
import {
  ContentCopy,
  Preview,
  Save,
  Palette,
  Image as ImageIcon,
  Code,
  Visibility,
  Language,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface TrackingPageSettingsProps {
  subscriptionInfo: any;
}

export const TrackingPageSettings: React.FC<TrackingPageSettingsProps> = ({ subscriptionInfo }) => {
  const [settings, setSettings] = useState({
    tracking_page_enabled: true,
    custom_domain: '',
    page_title: 'Track Your Order',
    header_text: 'Enter your tracking number to see your order status',
    primary_color: '#667eea',
    secondary_color: '#764ba2',
    logo_url: '',
    show_estimated_delivery: true,
    show_courier_info: true,
    show_order_history: true,
    custom_css: '',
    custom_footer_text: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [trackingUrl, setTrackingUrl] = useState('');

  useEffect(() => {
    fetchSettings();
    generateTrackingUrl();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tracking-page/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching tracking page settings:', error);
    }
  };

  const generateTrackingUrl = () => {
    const baseUrl = window.location.origin;
    const userId = localStorage.getItem('userId') || 'your-merchant-id';
    setTrackingUrl(`${baseUrl}/track/${userId}`);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/tracking-page/settings',
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Tracking page settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const copyTrackingUrl = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success('Tracking URL copied to clipboard');
  };

  const copyEmbedCode = () => {
    const embedCode = `<iframe src="${trackingUrl}" width="100%" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  const openPreview = () => {
    window.open(trackingUrl, '_blank');
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          Tracking Page Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Customize your branded tracking page where customers can track their orders
        </Typography>
      </Paper>

      {/* Tracking URL */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Your Tracking Page URL
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          Share this URL with your customers or embed it on your website
        </Alert>
        
        <TextField
          fullWidth
          value={trackingUrl}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={copyTrackingUrl} edge="end">
                  <ContentCopy />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={openPreview}
          >
            Preview Page
          </Button>
          <Button
            variant="outlined"
            startIcon={<Code />}
            onClick={copyEmbedCode}
          >
            Copy Embed Code
          </Button>
        </Box>
      </Paper>

      {/* Basic Settings */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Basic Settings
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.tracking_page_enabled}
                  onChange={(e) => setSettings({ ...settings, tracking_page_enabled: e.target.checked })}
                />
              }
              label="Enable Tracking Page"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Page Title"
              value={settings.page_title}
              onChange={(e) => setSettings({ ...settings, page_title: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Custom Domain (Optional)"
              value={settings.custom_domain}
              onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
              placeholder="track.yourstore.com"
              helperText="Professional+ feature"
              disabled={subscriptionInfo?.subscription?.tier < 2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Header Text"
              value={settings.header_text}
              onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Footer Text (Optional)"
              value={settings.custom_footer_text}
              onChange={(e) => setSettings({ ...settings, custom_footer_text: e.target.value })}
              placeholder="© 2025 Your Store. All rights reserved."
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Branding */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Palette />
          <Typography variant="h6">
            Branding & Colors
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Primary Color"
              type="color"
              value={settings.primary_color}
              onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Secondary Color"
              type="color"
              value={settings.secondary_color}
              onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Logo URL"
              value={settings.logo_url}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
              placeholder="https://yourstore.com/logo.png"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ImageIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Display Options */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Display Options
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.show_estimated_delivery}
                onChange={(e) => setSettings({ ...settings, show_estimated_delivery: e.target.checked })}
              />
            }
            label="Show Estimated Delivery Date"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.show_courier_info}
                onChange={(e) => setSettings({ ...settings, show_courier_info: e.target.checked })}
              />
            }
            label="Show Courier Information"
          />

          <FormControlLabel
            control={
              <Switch
                checked={settings.show_order_history}
                onChange={(e) => setSettings({ ...settings, show_order_history: e.target.checked })}
              />
            }
            label="Show Order History Timeline"
          />
        </Box>
      </Paper>

      {/* Custom CSS */}
      {subscriptionInfo?.subscription?.tier >= 2 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Code />
            <Typography variant="h6">
              Custom CSS
            </Typography>
            <Chip label="Professional+" size="small" color="primary" />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={settings.custom_css}
            onChange={(e) => setSettings({ ...settings, custom_css: e.target.value })}
            placeholder=".tracking-page { background: #f5f5f5; }"
            sx={{ fontFamily: 'monospace' }}
          />
        </Paper>
      )}

      {/* Integration Instructions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How to Add to Your Website
        </Typography>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Option 1: Direct Link
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Add a "Track Order" link in your website menu or footer:
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {`<a href="${trackingUrl}">Track Your Order</a>`}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Option 2: Embed on Page
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Embed the tracking page directly on your website:
            </Typography>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
              {`<iframe src="${trackingUrl}" width="100%" height="600" frameborder="0"></iframe>`}
            </Box>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Option 3: WooCommerce/Shopify Plugin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Our plugins automatically add tracking links to order confirmation emails and customer accounts.
              Install from the Integrations page.
            </Typography>
          </CardContent>
        </Card>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Preview />}
          onClick={openPreview}
        >
          Preview Changes
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
};
