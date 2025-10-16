import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  Save,
  Refresh,
  Preview,
  Email,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface EmailTemplate {
  template_id?: string;
  template_type: string;
  custom_text: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}

export const EmailTemplateEditor: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('review_request');
  const [customText, setCustomText] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#667eea');
  const [secondaryColor, setSecondaryColor] = useState('#764ba2');
  const [showPreview, setShowPreview] = useState(false);

  // Fetch existing templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const response = await apiClient.get('/email-templates');
      return response.data.templates || [];
    },
  });

  // Load template when type changes
  useEffect(() => {
    if (templates && templates.length > 0) {
      const template = templates.find((t: EmailTemplate) => t.template_type === selectedType);
      if (template) {
        setCustomText(template.custom_text || '');
        setLogoUrl(template.logo_url || '');
        setPrimaryColor(template.primary_color || '#667eea');
        setSecondaryColor(template.secondary_color || '#764ba2');
      } else {
        // Reset to defaults
        setCustomText('');
        setLogoUrl('');
        setPrimaryColor('#667eea');
        setSecondaryColor('#764ba2');
      }
    }
  }, [selectedType, templates]);

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (data: EmailTemplate) => {
      return await apiClient.post('/email-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template saved successfully!');
    },
    onError: () => {
      toast.error('Failed to save email template');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      template_type: selectedType,
      custom_text: customText,
      logo_url: logoUrl,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
    });
  };

  const handleReset = () => {
    setCustomText('');
    setLogoUrl('');
    setPrimaryColor('#667eea');
    setSecondaryColor('#764ba2');
  };

  // Email preview component
  const EmailPreview = () => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        background: '#f5f5f5',
        maxWidth: 600,
        mx: 'auto',
      }}
    >
      <Box
        sx={{
          background: 'white',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            p: 3,
            textAlign: 'center',
          }}
        >
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ maxHeight: '60px', marginBottom: '16px' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
            How was your delivery?
          </Typography>
        </Box>

        {/* Body */}
        <Box sx={{ p: 3 }}>
          <Typography variant="body1" paragraph>
            Hi [Customer Name],
          </Typography>
          <Typography variant="body1" paragraph>
            Your order was recently delivered by [Courier Name]. We'd love to hear about your experience!
          </Typography>
          
          {customText && (
            <Box
              sx={{
                p: 2,
                background: '#f9f9f9',
                borderRadius: 1,
                borderLeft: `4px solid ${primaryColor}`,
                mb: 2,
              }}
            >
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {customText}
              </Typography>
            </Box>
          )}

          <Typography variant="body1" paragraph>
            Please take a moment to rate your delivery experience:
          </Typography>

          {/* Rating buttons */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', my: 3 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Box
                key={star}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                ★
              </Box>
            ))}
          </Box>

          <Typography variant="body2" color="text.secondary" align="center">
            Your feedback helps us improve our delivery service
          </Typography>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 2,
            background: '#f9f9f9',
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © 2025 Your Company. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Email Template Customization
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Customize your review request emails with your branding
      </Typography>

      <Grid container spacing={3}>
        {/* Editor */}
        <Grid item xs={12} md={showPreview ? 6 : 12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Editor
              </Typography>

              {/* Template Type Selector */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Template Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Template Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value="review_request">Review Request</MenuItem>
                  <MenuItem value="order_confirmation">Order Confirmation</MenuItem>
                  <MenuItem value="delivery_notification">Delivery Notification</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              {/* Logo URL */}
              <TextField
                fullWidth
                label="Logo URL"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
                helperText="Enter the URL of your company logo"
                sx={{ mb: 2 }}
              />

              {/* Custom Message */}
              <TextField
                fullWidth
                label="Custom Message"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Add a personal message to your customers..."
                multiline
                rows={4}
                helperText="This message will appear in the email body"
                sx={{ mb: 2 }}
              />

              {/* Color Pickers */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Primary Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Secondary Color
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      style={{
                        width: '60px',
                        height: '40px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    />
                    <TextField
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Tip:</strong> Use your brand colors to make emails recognizable to your customers
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Template'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                >
                  Reset
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Preview />}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? 'Hide' : 'Show'} Preview
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        {showPreview && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email /> Live Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This is how your email will look to customers
                </Typography>
                <EmailPreview />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
