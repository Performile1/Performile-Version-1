import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Rating,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';
import axios from 'axios';

interface OrderInfo {
  order_id: string;
  order_number: string;
  courier_name: string;
  courier_id: string;
  delivered_at: string;
  customer_name: string;
}

export const PublicReview: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (token) {
      fetchOrderInfo();
    }
  }, [token]);

  const fetchOrderInfo = async () => {
    try {
      const response = await axios.get(`/api/reviews/order-info/${token}`);
      
      if (response.data.success) {
        setOrderInfo(response.data.order);
        
        // Check if already reviewed
        if (response.data.order.review_submitted) {
          setError('You have already submitted a review for this delivery.');
        }
      } else {
        setError(response.data.message || 'Invalid review link');
      }
    } catch (err: any) {
      console.error('Error fetching order info:', err);
      setError(err.response?.data?.message || 'Failed to load order information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await axios.post('/api/reviews/submit-public', {
        review_token: token,
        rating,
        comment: comment.trim(),
      });

      if (response.data.success) {
        setSubmitted(true);
        
        // Redirect to thank you page after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading review form...
        </Typography>
      </Container>
    );
  }

  if (submitted) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Thank You!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your review has been submitted successfully.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your feedback helps other customers make better delivery choices.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 3 }}
          >
            Back to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  if (error && !orderInfo) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Star sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Rate Your Delivery
          </Typography>
          <Typography variant="body1" color="text.secondary">
            How was your experience with {orderInfo?.courier_name}?
          </Typography>
        </Box>

        {orderInfo && (
          <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Order: <strong>#{orderInfo.order_number}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Courier: <strong>{orderInfo.courier_name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Delivered: <strong>{new Date(orderInfo.delivered_at).toLocaleDateString()}</strong>
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              Your Rating
            </Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue || 0)}
              size="large"
              sx={{ fontSize: '3rem' }}
            />
            <Box sx={{ mt: 1 }}>
              {rating >= 4.5 && <Chip label="Excellent!" color="success" />}
              {rating >= 3.5 && rating < 4.5 && <Chip label="Good" color="primary" />}
              {rating >= 2.5 && rating < 3.5 && <Chip label="Average" color="warning" />}
              {rating < 2.5 && rating > 0 && <Chip label="Needs Improvement" color="error" />}
            </Box>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your Review (Optional)"
            placeholder="Tell us about your delivery experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting || !rating}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Your review will be publicly visible and help other customers
          </Typography>
        </form>
      </Paper>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Powered by <strong>Performile</strong> - Trusted Delivery Reviews
        </Typography>
      </Box>
    </Container>
  );
};
