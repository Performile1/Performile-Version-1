import React, { useState, useEffect, useMemo } from 'react';
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
import { CourierLogo } from '@/components/courier/CourierLogo';
import { isFeatureEnabled } from '@/lib/analytics';

interface Courier {
  courier_id: string;
  courier_name: string;
  courier_code?: string; // Added for CourierLogo
  company_name: string;
  logo_url: string | null;
  trust_score: number;
  total_reviews: number;
  avg_delivery_time: string;
  on_time_percentage: number;
  badge: 'excellent' | 'very_good' | 'good' | 'average';
  final_score?: number | null;
  selection_rate?: number | null;
  rank_position?: number | null;
  eta_minutes?: number | null;
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

const DYNAMIC_RANKING_FLAG_KEY = 'dynamic_courier_ranking';
const DEFAULT_LIMIT = 5;

const determineBadge = (trustScore: number): Courier['badge'] => {
  if (trustScore >= 4.5) return 'excellent';
  if (trustScore >= 4.0) return 'very_good';
  if (trustScore >= 3.5) return 'good';
  return 'average';
};

const formatDeliveryWindow = (avgDays?: number | null, etaMinutes?: number | null): string => {
  if (etaMinutes && etaMinutes > 0) {
    const approxHours = Math.max(1, Math.round(etaMinutes / 60));
    const upperHours = approxHours + 1;
    return `${approxHours}-${upperHours} hours`;
  }

  if (avgDays && avgDays > 0) {
    const rounded = Math.max(1, Math.round(avgDays));
    return `${rounded}-${rounded + 1} days`;
  }

  return 'N/A';
};

const mapDynamicCouriers = (items: any[]): Courier[] =>
  items.map((courier) => {
    const trustScore = Number(courier.trust_score ?? 0);
    const totalReviews = Number(courier.total_reviews ?? 0);
    const onTimeRate = Number(
      courier.on_time_rate ?? courier.on_time_percentage ?? courier.on_time ?? 0
    );

    return {
      courier_id: courier.courier_id,
      courier_name: courier.courier_name ?? 'Unknown Courier',
      courier_code: courier.courier_code ?? courier.courier_name ?? undefined,
      company_name: courier.company_name ?? '',
      logo_url: courier.logo_url ?? null,
      trust_score: trustScore,
      total_reviews: totalReviews,
      avg_delivery_time: formatDeliveryWindow(courier.avg_delivery_days, courier.eta_minutes),
      on_time_percentage: onTimeRate,
      badge: determineBadge(trustScore),
      final_score: courier.final_score ?? courier.final_ranking_score ?? null,
      selection_rate: courier.selection_rate ?? null,
      rank_position: courier.rank_position ?? null,
      eta_minutes: courier.eta_minutes ?? null,
    };
  });

const mapLegacyCouriers = (items: any[]): Courier[] =>
  items.map((courier) => {
    const trustScore = Number(courier.trust_score ?? 0);
    return {
      courier_id: courier.courier_id,
      courier_name: courier.courier_name ?? 'Unknown Courier',
      courier_code: courier.courier_code ?? courier.courier_name ?? undefined,
      company_name: courier.company_name ?? '',
      logo_url: courier.logo_url ?? null,
      trust_score: trustScore,
      total_reviews: Number(courier.total_reviews ?? 0),
      avg_delivery_time: courier.avg_delivery_time ?? 'N/A',
      on_time_percentage: Number(courier.on_time_percentage ?? 0),
      badge: determineBadge(trustScore),
    };
  });

export const CourierSelector: React.FC<CourierSelectorProps> = ({
  postalCode,
  onCourierSelect,
  selectedCourierId,
}) => {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocalData, setIsLocalData] = useState(true);

  const dynamicRankingEnabled = useMemo(() => {
    if (import.meta.env.VITE_ENABLE_DYNAMIC_RANKING === 'true') {
      return true;
    }

    try {
      return isFeatureEnabled(DYNAMIC_RANKING_FLAG_KEY);
    } catch (error) {
      console.warn('[CourierSelector] Failed to resolve PostHog flag:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    if (postalCode) {
      fetchCourierRatings();
    }
  }, [postalCode]);

  const fetchCourierRatings = async () => {
    setLoading(true);
    setError(null);

    const tryDynamicRanking = async (): Promise<boolean> => {
      if (!dynamicRankingEnabled) {
        return false;
      }

      const params = new URLSearchParams({
        postal_code: postalCode,
        limit: `${DEFAULT_LIMIT}`,
      });

      try {
        const response = await fetch(`/api/couriers/rankings?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Dynamic rankings request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data?.success) {
          return false;
        }

        const formatted = mapDynamicCouriers(data.couriers ?? []);

        if (formatted.length === 0) {
          return false;
        }

        setCouriers(formatted);
        setIsLocalData(data.is_local_data !== false);

        if (!selectedCourierId) {
          onCourierSelect(formatted[0].courier_id);
        }

        return true;
      } catch (error) {
        console.warn('[CourierSelector] Dynamic ranking fetch failed:', error);
        return false;
      }
    };

    const tryLegacyRanking = async () => {
      const response = await fetch(
        `/api/couriers/ratings-by-postal?postal_code=${encodeURIComponent(
          postalCode
        )}&limit=${DEFAULT_LIMIT}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch courier ratings');
      }

      const data = await response.json();

      if (!data?.success) {
        throw new Error(data?.message || 'Failed to load couriers');
      }

      const formatted = mapLegacyCouriers(data.couriers ?? []);

      setCouriers(formatted);
      setIsLocalData(data.is_local_data ?? true);

      if (!selectedCourierId && formatted.length > 0) {
        onCourierSelect(formatted[0].courier_id);
      }
    };

    try {
      const dynamicSucceeded = await tryDynamicRanking();

      if (!dynamicSucceeded) {
        await tryLegacyRanking();
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

                  <Box sx={{ mr: 2 }}>
                    <CourierLogo
                      courierCode={courier.courier_code || courier.courier_name}
                      courierName={courier.courier_name}
                      size="large"
                      variant="rounded"
                      showName={false}
                    />
                  </Box>

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
