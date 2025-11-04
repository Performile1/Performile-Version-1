import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Radio,
  Chip,
  Button,
  Collapse,
  IconButton,
  Divider,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Star,
  Schedule,
  LocalShipping,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { CourierLogo } from '@/components/courier/CourierLogo';
import { TrustScoreIndicator } from './TrustScoreIndicator';
import { CourierBadge, getCourierBadges, BadgeType } from './CourierBadge';

export interface CourierOption {
  courier_id: string;
  courier_name: string;
  courier_code: string;
  logo_url?: string;
  
  // Pricing
  price: number;
  currency: string;
  original_price?: number; // For showing discounts
  
  // Delivery
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_time_unit: 'hours' | 'days';
  estimated_delivery_date?: string;
  
  // TrustScore
  trust_score: number; // 0-100
  avg_rating: number; // 0-5
  total_reviews: number;
  on_time_rate: number; // percentage
  completion_rate: number; // percentage
  performance_grade?: string; // A+, A, B+, etc.
  
  // Additional
  is_eco_friendly?: boolean;
  description?: string;
  features?: string[];
}

interface CourierSelectionCardProps {
  courier: CourierOption;
  selected: boolean;
  onSelect: (courierId: string) => void;
  onViewDetails?: (courierId: string) => void;
  showDetailedView?: boolean;
  rank?: number; // Position in list (1, 2, 3...)
}

export const CourierSelectionCard: React.FC<CourierSelectionCardProps> = ({
  courier,
  selected,
  onSelect,
  onViewDetails,
  showDetailedView = false,
  rank,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get badges for this courier
  const badges = getCourierBadges({
    trust_score: courier.trust_score,
    avg_rating: courier.avg_rating,
    total_reviews: courier.total_reviews,
    delivery_time_min: courier.delivery_time_min,
    price: courier.price,
    is_eco_friendly: courier.is_eco_friendly,
  });

  // Format delivery time
  const formatDeliveryTime = () => {
    const { delivery_time_min, delivery_time_max, delivery_time_unit } = courier;
    if (delivery_time_min === delivery_time_max) {
      return `${delivery_time_min} ${delivery_time_unit}`;
    }
    return `${delivery_time_min}-${delivery_time_max} ${delivery_time_unit}`;
  };

  // Format price
  const formatPrice = () => {
    return `${courier.price} ${courier.currency}`;
  };

  // Check if this is a top courier
  const isTopCourier = rank && rank <= 3;

  return (
    <Card
      sx={{
        cursor: 'pointer',
        border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #e0e0e0',
        backgroundColor: selected ? `${theme.palette.primary.main}08` : '#fff',
        transition: 'all 0.2s',
        position: 'relative',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={() => onSelect(courier.courier_id)}
    >
      {/* Rank badge for top 3 */}
      {isTopCourier && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            left: 16,
            backgroundColor: rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : '#cd7f32',
            color: '#fff',
            borderRadius: '12px',
            padding: '2px 12px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            zIndex: 1,
          }}
        >
          #{rank}
        </Box>
      )}

      <CardContent sx={{ p: isMobile ? 2 : 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Radio button */}
          <Grid item xs="auto">
            <Radio
              checked={selected}
              onChange={() => onSelect(courier.courier_id)}
              onClick={(e) => e.stopPropagation()}
              sx={{ p: 0 }}
            />
          </Grid>

          {/* Courier logo and name */}
          <Grid item xs="auto">
            <CourierLogo
              courierCode={courier.courier_code}
              courierName={courier.courier_name}
              size={isMobile ? 'medium' : 'large'}
              variant="rounded"
            />
          </Grid>

          {/* Main content */}
          <Grid item xs>
            <Box>
              {/* Courier name and badges */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography variant={isMobile ? 'body1' : 'h6'} fontWeight="bold">
                  {courier.courier_name}
                </Typography>
                {badges.slice(0, isMobile ? 1 : 2).map((badge) => (
                  <CourierBadge key={badge} type={badge} size="small" />
                ))}
              </Box>

              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star sx={{ fontSize: 16, color: '#ffc107' }} />
                  <Typography variant="body2" fontWeight="medium">
                    {courier.avg_rating.toFixed(1)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ({courier.total_reviews.toLocaleString()} reviews)
                </Typography>
              </Box>

              {/* TrustScore - Compact on mobile, default on desktop */}
              <Box sx={{ mb: 1 }}>
                <TrustScoreIndicator
                  score={courier.trust_score}
                  size={isMobile ? 'small' : 'medium'}
                  grade={courier.performance_grade}
                  variant={isMobile ? 'compact' : 'default'}
                />
              </Box>

              {/* Performance metrics */}
              {!isMobile && (
                <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
                    <Typography variant="caption">
                      {courier.on_time_rate}% On-Time
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
                    <Typography variant="caption">
                      {courier.completion_rate}% Complete
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Price and delivery time */}
          <Grid item xs={12} sm="auto">
            <Box sx={{ textAlign: isMobile ? 'left' : 'right' }}>
              {/* Price */}
              <Box sx={{ mb: 1 }}>
                {courier.original_price && courier.original_price > courier.price && (
                  <Typography
                    variant="caption"
                    sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 1 }}
                  >
                    {courier.original_price} {courier.currency}
                  </Typography>
                )}
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {formatPrice()}
                </Typography>
              </Box>

              {/* Delivery time */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                <LocalShipping sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatDeliveryTime()}
                </Typography>
              </Box>

              {courier.estimated_delivery_date && (
                <Typography variant="caption" color="text.secondary">
                  Est. {new Date(courier.estimated_delivery_date).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        {/* Expandable details */}
        {showDetailedView && (
          <>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewDetails) {
                    onViewDetails(courier.courier_id);
                  }
                }}
                startIcon={<Info />}
              >
                View Full TrustScore
              </Button>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>

            <Collapse in={expanded}>
              <Divider sx={{ my: 2 }} />
              
              {/* Detailed metrics */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    On-Time Rate
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courier.on_time_rate}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courier.completion_rate}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Total Reviews
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courier.total_reviews.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">
                    Performance
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {courier.performance_grade || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Features */}
              {courier.features && courier.features.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Features:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {courier.features.map((feature, index) => (
                      <Chip key={index} label={feature} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Description */}
              {courier.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  {courier.description}
                </Typography>
              )}
            </Collapse>
          </>
        )}
      </CardContent>
    </Card>
  );
};
