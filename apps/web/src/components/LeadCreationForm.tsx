import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';

interface Store {
  store_id: string;
  store_name: string;
  store_type: string;
}

interface LeadFormData {
  title: string;
  description: string;
  lead_category: string;
  lead_priority: string;
  shipment_cost: number;
  order_value: number;
  delivery_country: string;
  delivery_city: string;
  delivery_postal_code: string;
  merchant_company_name: string;
  merchant_contact_name: string;
  merchant_contact_email: string;
  merchant_contact_phone: string;
  lead_price: number;
  competition_level: number;
  is_repeat_customer: boolean;
  previous_orders_count: number;
  total_previous_spend: number;
  next_follow_up: string;
  follow_up_type: string;
  expires_at: string;
  is_premium: boolean;
  is_featured: boolean;
  created_by_store_id: string;
  tags: string[];
}

const steps = ['Basic Information', 'Shipment Details', 'Contact Information', 'Pricing & Settings'];

const categories = [
  'electronics',
  'fashion',
  'home_garden',
  'automotive',
  'health_beauty',
  'sports_outdoors',
  'books_media',
  'food_beverages',
  'other'
];

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const followUpTypes = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'In-Person Meeting' },
  { value: 'none', label: 'No Follow-up' }
];

const LeadCreationForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState<LeadFormData>({
    title: '',
    description: '',
    lead_category: '',
    lead_priority: 'medium',
    shipment_cost: 0,
    order_value: 0,
    delivery_country: '',
    delivery_city: '',
    delivery_postal_code: '',
    merchant_company_name: '',
    merchant_contact_name: '',
    merchant_contact_email: '',
    merchant_contact_phone: '',
    lead_price: 0,
    competition_level: 3,
    is_repeat_customer: false,
    previous_orders_count: 0,
    total_previous_spend: 0,
    next_follow_up: '',
    follow_up_type: 'email',
    expires_at: '',
    is_premium: false,
    is_featured: false,
    created_by_store_id: '',
    tags: []
  });

  // Fetch user's stores on component mount
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }

      const data = await response.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError('Failed to load stores');
    }
  };

  const handleInputChange = (field: keyof LeadFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Basic Information
        if (!formData.title.trim()) {
          setError('Title is required');
          return false;
        }
        if (!formData.description.trim()) {
          setError('Description is required');
          return false;
        }
        if (!formData.lead_category) {
          setError('Category is required');
          return false;
        }
        break;
      case 1: // Shipment Details
        if (!formData.delivery_country.trim()) {
          setError('Delivery country is required');
          return false;
        }
        if (!formData.delivery_city.trim()) {
          setError('Delivery city is required');
          return false;
        }
        if (formData.shipment_cost <= 0) {
          setError('Shipment cost must be greater than 0');
          return false;
        }
        if (formData.order_value <= 0) {
          setError('Order value must be greater than 0');
          return false;
        }
        break;
      case 2: // Contact Information
        if (!formData.merchant_company_name.trim()) {
          setError('Company name is required');
          return false;
        }
        if (!formData.merchant_contact_name.trim()) {
          setError('Contact name is required');
          return false;
        }
        if (!formData.merchant_contact_email.trim()) {
          setError('Contact email is required');
          return false;
        }
        break;
      case 3: // Pricing & Settings
        if (formData.lead_price <= 0) {
          setError('Lead price must be greater than 0');
          return false;
        }
        if (!formData.created_by_store_id && stores.length > 0) {
          setError('Please select a store');
          return false;
        }
        break;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          ...formData,
          expires_at: formData.expires_at || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create lead');
      }

      setSuccess('Lead created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        lead_category: '',
        lead_priority: 'medium',
        shipment_cost: 0,
        order_value: 0,
        delivery_country: '',
        delivery_city: '',
        delivery_postal_code: '',
        merchant_company_name: '',
        merchant_contact_name: '',
        merchant_contact_email: '',
        merchant_contact_phone: '',
        lead_price: 0,
        competition_level: 3,
        is_repeat_customer: false,
        previous_orders_count: 0,
        total_previous_spend: 0,
        next_follow_up: '',
        follow_up_type: 'email',
        expires_at: '',
        is_premium: false,
        is_featured: false,
        created_by_store_id: '',
        tags: []
      });
      setActiveStep(0);

    } catch (err) {
      console.error('Error creating lead:', err);
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lead Title *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Weekly Electronics Delivery Route"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description *"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the delivery opportunity..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  value={formData.lead_category}
                  label="Category *"
                  onChange={(e) => handleInputChange('lead_category', e.target.value)}
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.lead_priority}
                  label="Priority"
                  onChange={(e) => handleInputChange('lead_priority', e.target.value)}
                >
                  {priorities.map(priority => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery Country *"
                value={formData.delivery_country}
                onChange={(e) => handleInputChange('delivery_country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Delivery City *"
                value={formData.delivery_city}
                onChange={(e) => handleInputChange('delivery_city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Shipment Cost *"
                type="number"
                value={formData.shipment_cost}
                onChange={(e) => handleInputChange('shipment_cost', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order Value *"
                type="number"
                value={formData.order_value}
                onChange={(e) => handleInputChange('order_value', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name *"
                value={formData.merchant_company_name}
                onChange={(e) => handleInputChange('merchant_company_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Name *"
                value={formData.merchant_contact_name}
                onChange={(e) => handleInputChange('merchant_contact_name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Email *"
                type="email"
                value={formData.merchant_contact_email}
                onChange={(e) => handleInputChange('merchant_contact_email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Phone"
                value={formData.merchant_contact_phone}
                onChange={(e) => handleInputChange('merchant_contact_phone', e.target.value)}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Lead Price *"
                type="number"
                value={formData.lead_price}
                onChange={(e) => handleInputChange('lead_price', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Follow-up Type</InputLabel>
                <Select
                  value={formData.follow_up_type}
                  label="Follow-up Type"
                  onChange={(e) => handleInputChange('follow_up_type', e.target.value)}
                >
                  {followUpTypes.map(followUpType => (
                    <MenuItem key={followUpType.value} value={followUpType.value}>
                      {followUpType.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expires At"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => handleInputChange('expires_at', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_premium}
                    onChange={(e) => handleInputChange('is_premium', e.target.checked)}
                  />
                }
                label="Premium Lead"
              />
            </Grid>
            {stores.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={formData.created_by_store_id}
                    label="Store"
                    onChange={(e) => handleInputChange('created_by_store_id', e.target.value)}
                  >
                    {stores.map(store => (
                      <MenuItem key={store.store_id} value={store.store_id}>
                        {store.store_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        Create New Lead
      </Typography>

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
            >
              Back
            </Button>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Lead'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default LeadCreationForm;
