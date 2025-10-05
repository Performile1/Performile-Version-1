import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Chip,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Preview as PreviewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';

interface ReviewForm {
  order_id: string;
  courier_id: string;
  consumer_id: string;
  rating: number;
  review_text: string;
  damaged: boolean;
  late: boolean;
  switched_service: boolean;
  delivery_speed: number;
  packaging_quality: number;
  communication: number;
  professionalism: number;
}

export const ReviewBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState<ReviewForm>({
    order_id: '',
    courier_id: '',
    consumer_id: '',
    rating: 5,
    review_text: '',
    damaged: false,
    late: false,
    switched_service: false,
    delivery_speed: 5,
    packaging_quality: 5,
    communication: 5,
    professionalism: 5,
  });

  // Fetch orders for selection
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/orders');
      return response.data;
    },
  });

  // Fetch couriers for selection
  const { data: couriersData } = useQuery({
    queryKey: ['admin-couriers'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', { params: { role: 'courier' } });
      return response.data;
    },
  });

  // Fetch consumers for selection
  const { data: consumersData } = useQuery({
    queryKey: ['admin-consumers'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', { params: { role: 'consumer' } });
      return response.data;
    },
  });

  const orders = Array.isArray(ordersData?.data) ? ordersData.data : [];
  const couriers = Array.isArray(couriersData?.data) ? couriersData.data : [];
  const consumers = Array.isArray(consumersData?.data) ? consumersData.data : [];

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewForm) => {
      const response = await apiClient.post('/admin/reviews', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Review created successfully!');
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-couriers'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create review');
    },
  });

  const resetForm = () => {
    setFormData({
      order_id: '',
      courier_id: '',
      consumer_id: '',
      rating: 5,
      review_text: '',
      damaged: false,
      late: false,
      switched_service: false,
      delivery_speed: 5,
      packaging_quality: 5,
      communication: 5,
      professionalism: 5,
    });
  };

  const handleSubmit = () => {
    if (!formData.order_id || !formData.courier_id || !formData.consumer_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    submitReviewMutation.mutate(formData);
  };

  const calculateOverallRating = () => {
    const ratings = [
      formData.delivery_speed,
      formData.packaging_quality,
      formData.communication,
      formData.professionalism,
    ];
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    
    // Deduct points for issues
    let deductions = 0;
    if (formData.damaged) deductions += 1;
    if (formData.late) deductions += 0.5;
    if (formData.switched_service) deductions += 0.5;
    
    return Math.max(1, Math.min(5, avg - deductions));
  };

  const getIssueChips = (): string[] => {
    const issues: string[] = [];
    if (formData.damaged) issues.push('Damaged');
    if (formData.late) issues.push('Late Delivery');
    if (formData.switched_service) issues.push('Service Switched');
    return issues;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Review Builder
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create and manage customer reviews for courier performance tracking
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Details
              </Typography>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Order Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Order *</InputLabel>
                    <Select
                      value={formData.order_id}
                      onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                      label="Order *"
                    >
                      <MenuItem value="">
                        <em>Select an order</em>
                      </MenuItem>
                      {orders.map((order: any) => (
                        <MenuItem key={order.order_id} value={order.order_id}>
                          Order #{order.order_id.substring(0, 8)} - {order.pickup_address}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Courier Selection */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Courier *</InputLabel>
                    <Select
                      value={formData.courier_id}
                      onChange={(e) => setFormData({ ...formData, courier_id: e.target.value })}
                      label="Courier *"
                    >
                      <MenuItem value="">
                        <em>Select a courier</em>
                      </MenuItem>
                      {couriers.map((courier: any) => (
                        <MenuItem key={courier.user_id} value={courier.user_id}>
                          {courier.first_name} {courier.last_name} ({courier.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Consumer Selection */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Consumer *</InputLabel>
                    <Select
                      value={formData.consumer_id}
                      onChange={(e) => setFormData({ ...formData, consumer_id: e.target.value })}
                      label="Consumer *"
                    >
                      <MenuItem value="">
                        <em>Select a consumer</em>
                      </MenuItem>
                      {consumers.map((consumer: any) => (
                        <MenuItem key={consumer.user_id} value={consumer.user_id}>
                          {consumer.first_name} {consumer.last_name} ({consumer.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Performance Ratings
                  </Typography>
                </Grid>

                {/* Delivery Speed */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Delivery Speed
                  </Typography>
                  <Rating
                    value={formData.delivery_speed}
                    onChange={(_, value) => setFormData({ ...formData, delivery_speed: value || 5 })}
                    size="large"
                  />
                </Grid>

                {/* Packaging Quality */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Packaging Quality
                  </Typography>
                  <Rating
                    value={formData.packaging_quality}
                    onChange={(_, value) => setFormData({ ...formData, packaging_quality: value || 5 })}
                    size="large"
                  />
                </Grid>

                {/* Communication */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Communication
                  </Typography>
                  <Rating
                    value={formData.communication}
                    onChange={(_, value) => setFormData({ ...formData, communication: value || 5 })}
                    size="large"
                  />
                </Grid>

                {/* Professionalism */}
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" gutterBottom>
                    Professionalism
                  </Typography>
                  <Rating
                    value={formData.professionalism}
                    onChange={(_, value) => setFormData({ ...formData, professionalism: value || 5 })}
                    size="large"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Delivery Issues
                  </Typography>
                </Grid>

                {/* Issue Checkboxes */}
                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.damaged}
                          onChange={(e) => setFormData({ ...formData, damaged: e.target.checked })}
                        />
                      }
                      label="Package was damaged"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.late}
                          onChange={(e) => setFormData({ ...formData, late: e.target.checked })}
                        />
                      }
                      label="Delivery was late"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.switched_service}
                          onChange={(e) => setFormData({ ...formData, switched_service: e.target.checked })}
                        />
                      }
                      label="Service was switched without notice"
                    />
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Review Text
                  </Typography>
                </Grid>

                {/* Review Text */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Review Comments"
                    value={formData.review_text}
                    onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                    placeholder="Enter detailed review comments..."
                    helperText="Provide specific feedback about the delivery experience"
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PreviewIcon />}
                      onClick={() => setPreviewOpen(true)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSubmit}
                      disabled={submitReviewMutation.isPending}
                    >
                      {submitReviewMutation.isPending ? 'Creating...' : 'Create Review'}
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={resetForm}>
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Preview & Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Summary
              </Typography>

              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="h2" color="primary">
                  {calculateOverallRating().toFixed(1)}
                </Typography>
                <Rating value={calculateOverallRating()} readOnly precision={0.1} size="large" />
                <Typography variant="caption" color="text.secondary" display="block">
                  Calculated Overall Rating
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Performance Breakdown
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Delivery Speed"
                    secondary={
                      <Rating value={formData.delivery_speed} readOnly size="small" />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Packaging Quality"
                    secondary={
                      <Rating value={formData.packaging_quality} readOnly size="small" />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Communication"
                    secondary={
                      <Rating value={formData.communication} readOnly size="small" />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Professionalism"
                    secondary={
                      <Rating value={formData.professionalism} readOnly size="small" />
                    }
                  />
                </ListItem>
              </List>

              {getIssueChips().length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Reported Issues
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {getIssueChips().map((issue) => (
                      <Chip
                        key={issue}
                        label={issue}
                        color="error"
                        size="small"
                        icon={<WarningIcon />}
                      />
                    ))}
                  </Box>
                </>
              )}

              {getIssueChips().length === 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="success" icon={<CheckCircleIcon />}>
                    No issues reported
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Impact on TrustScore
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This review will affect the courier's TrustScore calculation based on:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Rating Weight"
                    secondary="40% of TrustScore"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Time Decay"
                    secondary="Recent reviews weighted higher"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Issue Penalties"
                    secondary={`${getIssueChips().length} issue(s) will reduce score`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Preview</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                {calculateOverallRating().toFixed(1)} / 5.0
              </Typography>
              <Rating value={calculateOverallRating()} readOnly precision={0.1} />
            </Box>
            
            {getIssueChips().length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {getIssueChips().map((issue) => (
                  <Chip key={issue} label={issue} color="error" size="small" />
                ))}
              </Box>
            )}

            <Typography variant="body2" paragraph>
              {formData.review_text || 'No review text provided'}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Delivery Speed
                </Typography>
                <Rating value={formData.delivery_speed} readOnly size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Packaging
                </Typography>
                <Rating value={formData.packaging_quality} readOnly size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Communication
                </Typography>
                <Rating value={formData.communication} readOnly size="small" />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Professionalism
                </Typography>
                <Rating value={formData.professionalism} readOnly size="small" />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => {
            setPreviewOpen(false);
            handleSubmit();
          }}>
            Create Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
