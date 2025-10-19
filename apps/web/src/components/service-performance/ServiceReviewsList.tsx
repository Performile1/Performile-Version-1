/**
 * Service Reviews List Component
 * Week 4 Phase 6 - Frontend Components
 * 
 * Display service-specific customer reviews
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Rating,
  Chip,
  Avatar,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  VerifiedUser,
  ThumbUp,
  Schedule,
  LocalShipping,
  ChatBubble
} from '@mui/icons-material';

interface ServiceReview {
  service_review_id: string;
  review_id: string;
  service_name: string;
  courier_name: string;
  rating: number;
  review_text: string;
  delivery_speed_rating: number;
  package_condition_rating: number;
  communication_rating: number;
  service_quality_rating?: number;
  location_convenience_rating?: number;
  facility_condition_rating?: number;
  staff_helpfulness_rating?: number;
  service_comment?: string;
  is_verified: boolean;
  created_at: string;
}

interface ServiceReviewsListProps {
  reviews: ServiceReview[];
  serviceName: string;
  stats?: {
    total_reviews: number;
    avg_rating: number;
    avg_service_quality: number;
    verified_count: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
}

export const ServiceReviewsList: React.FC<ServiceReviewsListProps> = ({
  reviews,
  serviceName,
  stats
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.review_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.service_comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.courier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = filterRating === 'all' || review.rating === filterRating;
    const matchesVerified = !showVerifiedOnly || review.is_verified;
    
    return matchesSearch && matchesRating && matchesVerified;
  });

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  // Get rating color
  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return 'success';
    if (rating >= 3.5) return 'info';
    if (rating >= 2.5) return 'warning';
    return 'error';
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box>
            <Typography variant="h6">
              Service Reviews
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {serviceName}
            </Typography>
          </Box>
        }
      />

      <CardContent>
        {/* Statistics Summary */}
        {stats && (
          <Box mb={3} p={2} bgcolor="grey.50" borderRadius={2}>
            <Box display="flex" gap={3} flexWrap="wrap" mb={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total Reviews
                </Typography>
                <Typography variant="h6">
                  {stats.total_reviews}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Average Rating
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {stats.avg_rating.toFixed(1)}
                  </Typography>
                  <Rating value={stats.avg_rating} readOnly size="small" precision={0.1} />
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Service Quality
                </Typography>
                <Typography variant="h6">
                  {stats.avg_service_quality.toFixed(1)} / 5.0
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Verified Reviews
                </Typography>
                <Typography variant="h6">
                  {stats.verified_count} ({((stats.verified_count / stats.total_reviews) * 100).toFixed(0)}%)
                </Typography>
              </Box>
            </Box>

            {/* Rating Distribution */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Rating Distribution
              </Typography>
              {[5, 4, 3, 2, 1].map((star) => (
                <Box key={star} display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="caption" sx={{ minWidth: 20 }}>
                    {star}★
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.rating_distribution[star as keyof typeof stats.rating_distribution] / stats.total_reviews) * 100}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" sx={{ minWidth: 30 }}>
                    {stats.rating_distribution[star as keyof typeof stats.rating_distribution]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Filters */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <TextField
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, minWidth: 200 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rating</InputLabel>
            <Select
              value={filterRating}
              label="Rating"
              onChange={(e) => setFilterRating(e.target.value as number | 'all')}
            >
              <MenuItem value="all">All Ratings</MenuItem>
              <MenuItem value={5}>5 Stars</MenuItem>
              <MenuItem value={4}>4 Stars</MenuItem>
              <MenuItem value={3}>3 Stars</MenuItem>
              <MenuItem value={2}>2 Stars</MenuItem>
              <MenuItem value={1}>1 Star</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant={showVerifiedOnly ? 'contained' : 'outlined'}
            size="small"
            startIcon={<VerifiedUser />}
            onClick={() => setShowVerifiedOnly(!showVerifiedOnly)}
          >
            Verified Only
          </Button>
        </Box>

        {/* Reviews List */}
        <Box display="flex" flexDirection="column" gap={2}>
          {filteredReviews.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <ChatBubble sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No reviews match your filters
              </Typography>
            </Paper>
          ) : (
            filteredReviews.map((review) => (
              <Paper key={review.service_review_id} variant="outlined" sx={{ p: 2 }}>
                {/* Review Header */}
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box display="flex" gap={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {review.courier_name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {review.courier_name}
                        </Typography>
                        {review.is_verified && (
                          <Tooltip title="Verified Purchase">
                            <VerifiedUser sx={{ fontSize: 16, color: 'success.main' }} />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(review.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${review.rating.toFixed(1)} / 5.0`}
                    color={getRatingColor(review.rating) as any}
                    size="small"
                  />
                </Box>

                {/* Overall Rating */}
                <Box mb={2}>
                  <Rating value={review.rating} readOnly size="small" precision={0.5} />
                </Box>

                {/* Review Text */}
                {review.review_text && (
                  <Typography variant="body2" paragraph>
                    {review.review_text}
                  </Typography>
                )}

                {/* Service Comment */}
                {review.service_comment && (
                  <Box mb={2} p={1.5} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      Service-Specific Feedback:
                    </Typography>
                    <Typography variant="body2">
                      {review.service_comment}
                    </Typography>
                  </Box>
                )}

                {/* Detailed Ratings */}
                <Box display="flex" gap={2} flexWrap="wrap">
                  {review.delivery_speed_rating && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Delivery Speed
                        </Typography>
                      </Box>
                      <Rating value={review.delivery_speed_rating} readOnly size="small" />
                    </Box>
                  )}
                  {review.package_condition_rating && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <LocalShipping sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Package Condition
                        </Typography>
                      </Box>
                      <Rating value={review.package_condition_rating} readOnly size="small" />
                    </Box>
                  )}
                  {review.communication_rating && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <ChatBubble sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Communication
                        </Typography>
                      </Box>
                      <Rating value={review.communication_rating} readOnly size="small" />
                    </Box>
                  )}
                  {review.service_quality_rating && (
                    <Box>
                      <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                        <ThumbUp sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Service Quality
                        </Typography>
                      </Box>
                      <Rating value={review.service_quality_rating} readOnly size="small" />
                    </Box>
                  )}
                </Box>
              </Paper>
            ))
          )}
        </Box>

        {/* Load More (if needed) */}
        {filteredReviews.length > 0 && filteredReviews.length < reviews.length && (
          <Box textAlign="center" mt={3}>
            <Button variant="outlined">
              Load More Reviews
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceReviewsList;
