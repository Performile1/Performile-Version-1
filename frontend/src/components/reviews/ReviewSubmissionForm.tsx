import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface ReviewFormProps {
  orderId: string;
  courierId: string;
  courierName: string;
  onSuccess?: () => void;
}

interface ReviewCriteria {
  delivery_speed: number;
  communication: number;
  professionalism: number;
  package_condition: number;
}

export const ReviewSubmissionForm: React.FC<ReviewFormProps> = ({
  orderId,
  courierId,
  courierName,
  onSuccess,
}) => {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [criteria, setCriteria] = useState<ReviewCriteria>({
    delivery_speed: 0,
    communication: 0,
    professionalism: 0,
    package_condition: 0,
  });
  const [reviewText, setReviewText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/reviews', data);
      return response.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      if (onSuccess) {
        setTimeout(onSuccess, 2000);
      }
    },
  });

  const handleCriteriaChange = (criterion: keyof ReviewCriteria, value: number) => {
    setCriteria(prev => ({ ...prev, [criterion]: value }));
  };

  const handleSubmit = () => {
    if (overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    submitReviewMutation.mutate({
      order_id: orderId,
      courier_id: courierId,
      rating: overallRating,
      review_text: reviewText,
      criteria: criteria,
      is_anonymous: isAnonymous,
      would_recommend: wouldRecommend,
    });
  };

  const averageCriteriaRating = Object.values(criteria).reduce((a, b) => a + b, 0) / 4;
  const isFormValid = overallRating > 0;

  if (submitted) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <SuccessIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Thank You for Your Review!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your feedback helps us improve our service and helps other customers make informed decisions.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Review Your Delivery Experience
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Share your experience with <strong>{courierName}</strong>
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Overall Rating */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Overall Rating
          </Typography>
          <Rating
            value={overallRating}
            onChange={(_, value) => setOverallRating(value || 0)}
            size="large"
            sx={{ fontSize: '3rem' }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {overallRating === 0 && 'Click to rate'}
            {overallRating === 1 && 'Poor'}
            {overallRating === 2 && 'Fair'}
            {overallRating === 3 && 'Good'}
            {overallRating === 4 && 'Very Good'}
            {overallRating === 5 && 'Excellent'}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Detailed Criteria */}
        <Typography variant="h6" gutterBottom>
          Rate Specific Aspects
        </Typography>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Delivery Speed
              </Typography>
              <Rating
                value={criteria.delivery_speed}
                onChange={(_, value) => handleCriteriaChange('delivery_speed', value || 0)}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Communication
              </Typography>
              <Rating
                value={criteria.communication}
                onChange={(_, value) => handleCriteriaChange('communication', value || 0)}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Professionalism
              </Typography>
              <Rating
                value={criteria.professionalism}
                onChange={(_, value) => handleCriteriaChange('professionalism', value || 0)}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" gutterBottom>
                Package Condition
              </Typography>
              <Rating
                value={criteria.package_condition}
                onChange={(_, value) => handleCriteriaChange('package_condition', value || 0)}
              />
            </Box>
          </Grid>
        </Grid>

        {averageCriteriaRating > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Average criteria rating: {averageCriteriaRating.toFixed(1)} / 5
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(averageCriteriaRating / 5) * 100}
              sx={{ mt: 1 }}
            />
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Written Review */}
        <Typography variant="h6" gutterBottom>
          Share Your Experience (Optional)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Tell us about your delivery experience..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          helperText={`${reviewText.length} / 500 characters`}
          inputProps={{ maxLength: 500 }}
          sx={{ mb: 3 }}
        />

        {/* Additional Options */}
        <FormGroup sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={wouldRecommend}
                onChange={(e) => setWouldRecommend(e.target.checked)}
              />
            }
            label="I would recommend this courier to others"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            }
            label="Post this review anonymously"
          />
        </FormGroup>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Your review will be public and help other customers
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={!isFormValid || submitReviewMutation.isPending}
          >
            {submitReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </Box>

        {submitReviewMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Failed to submit review. Please try again.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
