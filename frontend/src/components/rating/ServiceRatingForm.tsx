import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Grid,
  Chip,
  Paper
} from '@mui/material';
import {
  Home,
  Store,
  Lock,
  LocationOn,
  Business,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';

interface ServiceRatingFormProps {
  token?: string;
}

const serviceTypeIcons = {
  home_delivery: <Home />,
  parcelshop: <Store />,
  parcellocker: <Lock />,
  pickup_point: <LocationOn />,
  office_delivery: <Business />
};

const serviceTypeLabels = {
  home_delivery: 'Home Delivery',
  parcelshop: 'Parcel Shop',
  parcellocker: 'Parcel Locker',
  pickup_point: 'Pickup Point',
  office_delivery: 'Office Delivery'
};

const ServiceRatingForm: React.FC<ServiceRatingFormProps> = ({ token: propToken }) => {
  const { token: urlToken } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const token = propToken || urlToken;

  const [formData, setFormData] = useState({
    rating: 0,
    reviewText: '',
    requestedService: '',
    actualService: '',
    serviceAccuracyRating: 0,
    serviceSatisfactionRating: 0,
    deliveryMethodFeedback: '',
    onTimeDeliveryScore: 0,
    communicationScore: 0,
    packageConditionScore: 0,
    overallSatisfactionScore: 0
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiClient.post('/rating/submit', { 
        token,
        ...formData
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (field: 'requestedService' | 'actualService', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isServiceAccurate = formData.requestedService === formData.actualService;

  if (submitted) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Card sx={{ maxWidth: 500, textAlign: 'center', p: 3 }}>
          <CardContent>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Thank You!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your rating has been submitted successfully. Your feedback helps us improve our delivery services.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/')}
              sx={{ mt: 3 }}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box maxWidth="800px" mx="auto" p={3}>
      <Typography variant="h4" gutterBottom align="center">
        Rate Your Delivery Experience
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" mb={4}>
        Help us improve our service by sharing your delivery experience
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Overall Rating */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Overall Rating
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Rating
                  value={formData.rating}
                  onChange={(_, value) => setFormData(prev => ({ ...prev, rating: value || 0 }))}
                  size="large"
                />
                <Typography variant="body2" color="text.secondary">
                  {formData.rating === 0 ? 'Select rating' : `${formData.rating} out of 5 stars`}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Service Type Verification */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                y Service Verification
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Service You Requested</InputLabel>
                    <Select
                      value={formData.requestedService}
                      onChange={(e) => handleServiceChange('requestedService', e.target.value)}
                      required
                    >
                      {Object.entries(serviceTypeLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {serviceTypeIcons[key as keyof typeof serviceTypeIcons]}
                            {label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Service You Actually Received</InputLabel>
                    <Select
                      value={formData.actualService}
                      onChange={(e) => handleServiceChange('actualService', e.target.value)}
                      required
                    >
                      {Object.entries(serviceTypeLabels).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          <Box display="flex" alignItems="center" gap={1}>
                            {serviceTypeIcons[key as keyof typeof serviceTypeIcons]}
                            {label}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {formData.requestedService && formData.actualService && (
                <Box mt={2}>
                  <Chip
                    icon={isServiceAccurate ? <CheckCircle /> : <Warning />}
                    label={isServiceAccurate ? 'Service as requested' : 'Different service provided'}
                    color={isServiceAccurate ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Service-Specific Ratings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Service Quality Ratings
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Service Accuracy
                  </Typography>
                  <Rating
                    value={formData.serviceAccuracyRating}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      serviceAccuracyRating: value || 0 
                    }))}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Did you receive the service you requested?
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Service Satisfaction
                  </Typography>
                  <Rating
                    value={formData.serviceSatisfactionRating}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      serviceSatisfactionRating: value || 0 
                    }))}
                  />
                  <Typography variant="caption" color="text.secondary">
                    How satisfied are you with the delivery method?
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    On-Time Delivery
                  </Typography>
                  <Rating
                    value={formData.onTimeDeliveryScore}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      onTimeDeliveryScore: value || 0 
                    }))}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Communication
                  </Typography>
                  <Rating
                    value={formData.communicationScore}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      communicationScore: value || 0 
                    }))}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Package Condition
                  </Typography>
                  <Rating
                    value={formData.packageConditionScore}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      packageConditionScore: value || 0 
                    }))}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Overall Satisfaction
                  </Typography>
                  <Rating
                    value={formData.overallSatisfactionScore}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      overallSatisfactionScore: value || 0 
                    }))}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Feedback Text */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Additional Feedback
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Review Comments"
                value={formData.reviewText}
                onChange={(e) => setFormData(prev => ({ ...prev, reviewText: e.target.value }))}
                placeholder="Share your experience with this delivery..."
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Delivery Method Feedback"
                value={formData.deliveryMethodFeedback}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethodFeedback: e.target.value }))}
                placeholder="Any specific feedback about the delivery method used?"
              />
            </Paper>
          </Grid>

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center">
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || formData.rating === 0 || !formData.requestedService || !formData.actualService}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ServiceRatingForm;
