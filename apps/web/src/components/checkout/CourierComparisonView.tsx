import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Link as MuiLink,
} from '@mui/material';
import { Sort, Info, TrendingUp } from '@mui/icons-material';
import { CourierSelectionCard, CourierOption } from './CourierSelectionCard';
import { useNavigate } from 'react-router-dom';

interface CourierComparisonViewProps {
  couriers: CourierOption[];
  selectedCourierId: string | null;
  onSelectCourier: (courierId: string) => void;
  sortBy?: 'trustscore' | 'price' | 'speed' | 'rating';
  showSortOptions?: boolean;
  showTrustScoreInfo?: boolean;
  maxVisible?: number;
}

export const CourierComparisonView: React.FC<CourierComparisonViewProps> = ({
  couriers,
  selectedCourierId,
  onSelectCourier,
  sortBy = 'trustscore',
  showSortOptions = true,
  showTrustScoreInfo = true,
  maxVisible,
}) => {
  const navigate = useNavigate();
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [showAllCouriers, setShowAllCouriers] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCourierForDetails, setSelectedCourierForDetails] = useState<CourierOption | null>(null);

  // Sort couriers
  const sortedCouriers = [...couriers].sort((a, b) => {
    switch (currentSortBy) {
      case 'trustscore':
        return b.trust_score - a.trust_score;
      case 'price':
        return a.price - b.price;
      case 'speed':
        return a.delivery_time_min - b.delivery_time_min;
      case 'rating':
        return b.avg_rating - a.avg_rating;
      default:
        return 0;
    }
  });

  // Limit visible couriers if maxVisible is set
  const visibleCouriers = maxVisible && !showAllCouriers
    ? sortedCouriers.slice(0, maxVisible)
    : sortedCouriers;

  const hasMoreCouriers = maxVisible && sortedCouriers.length > maxVisible;

  // Handle view details
  const handleViewDetails = (courierId: string) => {
    const courier = couriers.find(c => c.courier_id === courierId);
    if (courier) {
      setSelectedCourierForDetails(courier);
      setDetailsDialogOpen(true);
    }
  };

  // Handle view all TrustScores
  const handleViewAllTrustScores = () => {
    navigate('/trustscores');
  };

  // Get sort label
  const getSortLabel = (sort: string) => {
    switch (sort) {
      case 'trustscore':
        return 'TrustScore (Highest First)';
      case 'price':
        return 'Price (Lowest First)';
      case 'speed':
        return 'Delivery Speed (Fastest First)';
      case 'rating':
        return 'Rating (Highest First)';
      default:
        return 'TrustScore';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Select Delivery Method
          </Typography>
          {showSortOptions && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={currentSortBy}
                label="Sort By"
                onChange={(e) => setCurrentSortBy(e.target.value as any)}
                startAdornment={<Sort sx={{ mr: 1, fontSize: 18 }} />}
              >
                <MenuItem value="trustscore">TrustScore</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="speed">Delivery Speed</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        {/* TrustScore info banner */}
        {showTrustScoreInfo && (
          <Alert
            severity="info"
            icon={<TrendingUp />}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={handleViewAllTrustScores}
              >
                View All
              </Button>
            }
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              Couriers are ranked by <strong>TrustScore</strong> - our data-driven rating based on delivery performance, customer reviews, and reliability.{' '}
              <MuiLink
                component="button"
                variant="body2"
                onClick={handleViewAllTrustScores}
                sx={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                Learn more
              </MuiLink>
            </Typography>
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary">
          Sorted by: {getSortLabel(currentSortBy)} • {sortedCouriers.length} options available
        </Typography>
      </Box>

      {/* Courier cards */}
      <Stack spacing={2}>
        {visibleCouriers.map((courier, index) => (
          <CourierSelectionCard
            key={courier.courier_id}
            courier={courier}
            selected={selectedCourierId === courier.courier_id}
            onSelect={onSelectCourier}
            onViewDetails={handleViewDetails}
            showDetailedView={true}
            rank={index + 1}
          />
        ))}
      </Stack>

      {/* Show more button */}
      {hasMoreCouriers && !showAllCouriers && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setShowAllCouriers(true)}
          >
            Show {sortedCouriers.length - maxVisible!} More Options
          </Button>
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCourierForDetails?.courier_name} - Full TrustScore Details
        </DialogTitle>
        <DialogContent>
          {selectedCourierForDetails && (
            <Box>
              <Typography variant="body1" paragraph>
                TrustScore: <strong>{selectedCourierForDetails.trust_score}/100</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The TrustScore is calculated based on multiple factors including delivery performance,
                customer reviews, on-time rate, and completion rate.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Performance Metrics:
                </Typography>
                <ul>
                  <li>Average Rating: {selectedCourierForDetails.avg_rating}/5 ({selectedCourierForDetails.total_reviews} reviews)</li>
                  <li>On-Time Delivery: {selectedCourierForDetails.on_time_rate}%</li>
                  <li>Completion Rate: {selectedCourierForDetails.completion_rate}%</li>
                  <li>Performance Grade: {selectedCourierForDetails.performance_grade || 'N/A'}</li>
                </ul>
              </Box>

              <Button
                variant="outlined"
                onClick={handleViewAllTrustScores}
                sx={{ mt: 2 }}
              >
                View All Courier TrustScores
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedCourierForDetails && (
            <Button
              variant="contained"
              onClick={() => {
                onSelectCourier(selectedCourierForDetails.courier_id);
                setDetailsDialogOpen(false);
              }}
            >
              Select This Courier
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
