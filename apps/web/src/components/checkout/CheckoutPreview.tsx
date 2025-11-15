import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  FormControl,
  MenuItem,
  Select,
} from '@mui/material';
import { LocationOn, Refresh, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { CourierComparisonView } from './CourierComparisonView';
import { CourierOption } from './CourierSelectionCard';
import { apiClient } from '@/services/apiClient';
import debounce from 'lodash.debounce';

const sampleCouriers: CourierOption[] = [
  {
    courier_id: '1',
    courier_name: 'DHL Express',
    courier_code: 'dhl',
    price: 65,
    currency: 'NOK',
    delivery_time_min: 1,
    delivery_time_max: 1,
    delivery_time_unit: 'days',
    trust_score: 92,
    avg_rating: 4.8,
    total_reviews: 1234,
    on_time_rate: 98,
    completion_rate: 99,
    performance_grade: 'A+',
    is_eco_friendly: false,
    description: 'Premium express delivery service with guaranteed next-day delivery.',
    features: ['Track & Trace', 'SMS Notifications', 'Signature Required', 'Insurance Included'],
  },
  {
    courier_id: '2',
    courier_name: 'Bring',
    courier_code: 'bring',
    price: 55,
    currency: 'NOK',
    original_price: 65,
    delivery_time_min: 1,
    delivery_time_max: 2,
    delivery_time_unit: 'days',
    trust_score: 88,
    avg_rating: 4.6,
    total_reviews: 987,
    on_time_rate: 95,
    completion_rate: 97,
    performance_grade: 'A',
    is_eco_friendly: true,
    description: 'Reliable delivery with eco-friendly options and flexible pickup points.',
    features: ['Parcel Lockers', 'Eco-Friendly', 'Flexible Pickup', 'Track & Trace'],
  },
  {
    courier_id: '3',
    courier_name: 'PostNord',
    courier_code: 'postnord',
    price: 49,
    currency: 'NOK',
    delivery_time_min: 2,
    delivery_time_max: 3,
    delivery_time_unit: 'days',
    trust_score: 82,
    avg_rating: 4.3,
    total_reviews: 756,
    on_time_rate: 92,
    completion_rate: 95,
    performance_grade: 'B+',
    is_eco_friendly: false,
    description: 'Affordable delivery option with extensive parcel shop network.',
    features: ['Parcel Shops', 'Track & Trace', 'SMS Notifications'],
  },
  {
    courier_id: '4',
    courier_name: 'Instabox',
    courier_code: 'instabox',
    price: 59,
    currency: 'NOK',
    delivery_time_min: 1,
    delivery_time_max: 2,
    delivery_time_unit: 'days',
    trust_score: 85,
    avg_rating: 4.5,
    total_reviews: 543,
    on_time_rate: 94,
    completion_rate: 96,
    performance_grade: 'A-',
    is_eco_friendly: true,
    description: 'Modern delivery service with smart lockers and flexible pickup times.',
    features: ['Smart Lockers', '24/7 Pickup', 'Eco-Friendly', 'App Integration'],
  },
  {
    courier_id: '5',
    courier_name: 'Budbee',
    courier_code: 'budbee',
    price: 52,
    currency: 'NOK',
    delivery_time_min: 1,
    delivery_time_max: 2,
    delivery_time_unit: 'days',
    trust_score: 86,
    avg_rating: 4.4,
    total_reviews: 432,
    on_time_rate: 93,
    completion_rate: 96,
    performance_grade: 'A-',
    is_eco_friendly: true,
    description: 'Flexible home delivery with evening and weekend options.',
    features: ['Evening Delivery', 'Weekend Delivery', 'Live Tracking', 'Eco-Friendly'],
  },
];

export interface CheckoutPreviewProps {
  showBackButton?: boolean;
  showInfoPanel?: boolean;
  onBack?: () => void;
  onContinue?: (courier?: CourierOption) => void;
}

export const CheckoutPreview: React.FC<CheckoutPreviewProps> = ({
  showBackButton = true,
  showInfoPanel = true,
  onBack,
  onContinue,
}) => {
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);

  const handleContinue = () => {
    if (selectedCourierId) {
      const selectedCourier = sampleCouriers.find((c) => c.courier_id === selectedCourierId);
      if (onContinue) {
        onContinue(selectedCourier);
      } else {
        window.alert(
          `Selected: ${selectedCourier?.courier_name}\nPrice: ${selectedCourier?.price} ${selectedCourier?.currency}\nTrustScore: ${selectedCourier?.trust_score}/100`
        );
      }
    } else {
      window.alert('Please select a delivery method');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Step 3 of 4: Select Delivery Method
        </Typography>

        <CourierComparisonView
          couriers={sampleCouriers}
          selectedCourierId={selectedCourierId}
          onSelectCourier={setSelectedCourierId}
          sortBy="trustscore"
          showSortOptions
          showTrustScoreInfo
          maxVisible={3}
        />

        <Box
          sx={{
            mt: 4,
            display: 'flex',
            justifyContent: showBackButton ? 'space-between' : 'flex-end',
          }}
        >
          {showBackButton && (
            <Button variant="outlined" onClick={onBack}>
              ← Back
            </Button>
          )}
          <Button
            variant="contained"
            size="large"
            onClick={handleContinue}
            disabled={!selectedCourierId}
          >
            Continue to Payment →
          </Button>
        </Box>
      </Paper>

      {showInfoPanel && (
        <Paper sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom>
            About This Demo
          </Typography>
          <Typography variant="body2" paragraph>
            This demo shows how TrustScore is integrated into the checkout flow:
          </Typography>
          <ul>
            <li>Couriers are sorted by TrustScore by default (highest first)</li>
            <li>Each courier card shows rating, reviews, and TrustScore</li>
            <li>Performance metrics (on-time rate, completion rate) are visible</li>
            <li>Badges highlight top-rated, fastest, and best-value options</li>
            <li>Users can view detailed TrustScore information</li>
            <li>Link to full TrustScore page for comparison</li>
          </ul>
          <Typography variant="body2" sx={{ mt: 2 }}>
            <strong>Key Features:</strong>
          </Typography>
          <ul>
            <li>Mobile-responsive design</li>
            <li>Expandable details for each courier</li>
            <li>Multiple sorting options (TrustScore, price, speed, rating)</li>
            <li>Visual indicators and badges</li>
            <li>Direct link to full TrustScore comparison page</li>
          </ul>
        </Paper>
      )}
    </Box>
  );
};
