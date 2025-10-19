/**
 * Service Performance Card Component
 * Week 4 Phase 6 - Frontend Components
 * 
 * Displays performance metrics for a specific courier service type
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Schedule,
  Star,
  People,
  Info
} from '@mui/icons-material';

interface ServicePerformanceData {
  performance_id: string;
  courier_id: string;
  courier_name: string;
  service_type_id: string;
  service_name: string;
  service_code: string;
  total_orders: number;
  completed_orders: number;
  completion_rate: number;
  on_time_rate: number;
  avg_delivery_days: number;
  total_reviews: number;
  avg_rating: number;
  trust_score: number;
  trust_score_grade: string;
  customer_satisfaction_score: number;
  coverage_area_count: number;
  period_start: string;
  period_end: string;
}

interface ServicePerformanceCardProps {
  data: ServicePerformanceData;
  showDetails?: boolean;
  onViewDetails?: () => void;
}

export const ServicePerformanceCard: React.FC<ServicePerformanceCardProps> = ({
  data,
  showDetails = true,
  onViewDetails
}) => {
  // Get color based on trust score
  const getTrustScoreColor = (score: number): string => {
    if (score >= 90) return '#4caf50'; // Green
    if (score >= 80) return '#8bc34a'; // Light Green
    if (score >= 70) return '#ffc107'; // Yellow
    if (score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  // Get grade color
  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'success';
    if (grade.startsWith('B')) return 'info';
    if (grade.startsWith('C')) return 'warning';
    return 'error';
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Format rating
  const formatRating = (value: number): string => {
    return value.toFixed(1);
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardHeader
        title={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" component="div">
              {data.courier_name}
            </Typography>
            <Chip
              label={data.trust_score_grade}
              color={getGradeColor(data.trust_score_grade) as any}
              size="small"
            />
          </Box>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            {data.service_name}
          </Typography>
        }
      />

      <CardContent>
        {/* Trust Score */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              TrustScore
            </Typography>
            <Typography 
              variant="h5" 
              fontWeight="bold"
              sx={{ color: getTrustScoreColor(data.trust_score) }}
            >
              {data.trust_score.toFixed(1)}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={data.trust_score}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getTrustScoreColor(data.trust_score),
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Key Metrics */}
        <Grid container spacing={2}>
          {/* Completion Rate */}
          <Grid item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Completion
                </Typography>
                <Tooltip title="Percentage of orders successfully completed">
                  <IconButton size="small" sx={{ p: 0 }}>
                    <Info sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatPercentage(data.completion_rate)}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {data.completion_rate >= 95 ? (
                  <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {data.completed_orders} / {data.total_orders}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* On-Time Rate */}
          <Grid item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <Schedule sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary">
                  On-Time
                </Typography>
                <Tooltip title="Percentage of deliveries on time">
                  <IconButton size="small" sx={{ p: 0 }}>
                    <Info sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatPercentage(data.on_time_rate)}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {data.on_time_rate >= 90 ? (
                  <TrendingUp sx={{ fontSize: 14, color: 'success.main' }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 14, color: 'error.main' }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  Avg {data.avg_delivery_days.toFixed(1)} days
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Average Rating */}
          <Grid item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Rating
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatRating(data.avg_rating)} / 5.0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.total_reviews} reviews
              </Typography>
            </Box>
          </Grid>

          {/* Customer Satisfaction */}
          <Grid item xs={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <People sx={{ fontSize: 16, color: 'info.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Satisfaction
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatPercentage(data.customer_satisfaction_score)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {data.coverage_area_count} areas
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Period Info */}
        {showDetails && (
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="text.secondary">
              Period: {new Date(data.period_start).toLocaleDateString()} - {new Date(data.period_end).toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ServicePerformanceCard;
