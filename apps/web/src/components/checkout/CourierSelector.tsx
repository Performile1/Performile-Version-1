import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Avatar,
  Chip,
  Rating,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Speed,
  Star,
} from '@mui/icons-material';

interface Courier {
  courier_id: string;
  courier_name: string;
  company_name: string;
  logo_url: string | null;
  trust_score: number;
  total_reviews: number;
  avg_delivery_time: string;
  on_time_percentage: number;
  badge: 'excellent' | 'very_good' | 'good' | 'average';
}

interface CourierSelectorProps {
  postalCode: string;
  onCourierSelect: (courierId: string) => void;
  selectedCourierId?: string;
}

const badgeConfig = {
  excellent: { label: 'Excellent', color: '#4caf50' },
  very_good: { label: 'Very Good', color: '#8bc34a' },
  good: { label: 'Good', color: '#ffc107' },
  average: { label: 'Average', color: '#ff9800' },
};

export const CourierSelector: React.FC<CourierSelectorProps> = ({
  postalCode,
  onCourierSelect,
  selectedCourierId,
}) => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalData, setIsLocalData] = useState(true);

  useEffect(() => {
    if (postalCode) {
      fetchCourierRatings();
    }
  }, [postalCode]);

  const fetchCourierRatings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/couriers/ratings-by-postal?postal_code=${postalCode}&limit=5`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courier ratings');
      }

      const data = await response.json();
      
      if (data.success) {
        setCouriers(data.couriers);
        setIsLocalData(data.is_local_data);
        
        // Auto-select top courier if none selected
        if (!selectedCourierId && data.couriers.length > 0) {
          onCourierSelect(data.couriers[0].courier_id);
        }
      } else {
        throw new Error(data.message || 'Failed to load couriers');
      }
    } catch (err: any) {
      console.error('Error fetching couriers:', err);
      setError(err.message || 'Failed to load courier ratings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
            Loading Top Rated Couriers...
          </Typography>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={80} />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (couriers.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        No courier ratings available for your area yet.
      </Alert>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LocalShipping sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div">
            Top Rated Couriers in Your Area
          </Typography>
        </Box>

        {!isLocalData && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No local couriers found. Showing top national couriers.
          </Alert>
        )}

        <RadioGroup
          value={selectedCourierId || ''}
          onChange={(e) => onCourierSelect(e.target.value)}
        >
          {couriers.map((courier, index) => (
            <Card
              key={courier.courier_id}
              variant="outlined"
              sx={{
                mb: 2,
                cursor: 'pointer',
                border: selectedCourierId === courier.courier_id ? 2 : 1,
                borderColor: selectedCourierId === courier.courier_id 
                  ? 'primary.main' 
                  : 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1,
                },
              }}
              onClick={() => onCourierSelect(courier.courier_id)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <FormControlLabel
                    value={courier.courier_id}
                    control={<Radio />}
                    label=""
                    sx={{ mr: 1 }}
                  />

                  <Avatar
                    src={courier.logo_url || undefined}
                    alt={courier.courier_name}
                    variant="rounded"
                    sx={{ 
                      mr: 2, 
                      width: 60, 
                      height: 60,
                      bgcolor: courier.logo_url ? 'white' : 'primary.main',
                      border: '1px solid',
                      borderColor: 'divider',
                      '& img': {
                        objectFit: 'contain',
                        padding: 1
                      }
                    }}
                  >
                    {courier.courier_name.charAt(0)}
                  </Avatar>

                  <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
                        {courier.courier_name}
                      </Typography>
                      
                      {index === 0 && (
                        <Chip
                          label="Recommended"
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}

                      <Chip
                        label={badgeConfig[courier.badge].label}
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: badgeConfig[courier.badge].color,
                          color: 'white',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating
                        value={courier.trust_score}
                        precision={0.1}
                        readOnly
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        {courier.trust_score.toFixed(1)} ({courier.total_reviews} reviews)
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Speed fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {courier.avg_delivery_time}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                        <Typography variant="body2" color="text.secondary">
                          {courier.on_time_percentage.toFixed(0)}% on-time
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <Star fontSize="small" sx={{ mr: 0.5 }} />
            Ratings based on verified customer reviews • Powered by Performile
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
