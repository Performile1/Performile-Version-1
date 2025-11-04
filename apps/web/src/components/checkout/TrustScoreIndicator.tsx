import React from 'react';
import { Box, Typography, LinearProgress, Tooltip, Chip } from '@mui/material';
import { Star, TrendingUp, CheckCircle } from '@mui/icons-material';

interface TrustScoreIndicatorProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showGrade?: boolean;
  grade?: string; // A+, A, B+, etc.
  variant?: 'default' | 'compact' | 'detailed';
}

export const TrustScoreIndicator: React.FC<TrustScoreIndicatorProps> = ({
  score,
  size = 'medium',
  showLabel = true,
  showGrade = true,
  grade,
  variant = 'default',
}) => {
  // Calculate grade if not provided
  const calculatedGrade = grade || getGrade(score);
  
  // Get color based on score
  const getColor = (score: number): string => {
    if (score >= 90) return '#4caf50'; // Green
    if (score >= 80) return '#8bc34a'; // Light green
    if (score >= 70) return '#ffc107'; // Yellow
    if (score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  // Get grade from score
  function getGrade(score: number): string {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    return 'D';
  }

  // Size configurations
  const sizeConfig = {
    small: {
      height: 4,
      fontSize: '0.75rem',
      gradeSize: 'small' as const,
    },
    medium: {
      height: 8,
      fontSize: '0.875rem',
      gradeSize: 'medium' as const,
    },
    large: {
      height: 12,
      fontSize: '1rem',
      gradeSize: 'medium' as const,
    },
  };

  const config = sizeConfig[size];
  const color = getColor(score);

  // Compact variant
  if (variant === 'compact') {
    return (
      <Tooltip title={`TrustScore: ${score}/100 - Grade ${calculatedGrade}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" fontWeight="bold" sx={{ color }}>
            {score}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              width: 60,
              height: config.height,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color,
              },
            }}
          />
        </Box>
      </Tooltip>
    );
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2" fontWeight="medium">
            TrustScore
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color }}>
              {score}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              /100
            </Typography>
            {showGrade && (
              <Chip
                label={calculatedGrade}
                size="small"
                sx={{
                  backgroundColor: color,
                  color: '#fff',
                  fontWeight: 'bold',
                  minWidth: 40,
                }}
              />
            )}
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: config.height,
            borderRadius: 4,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
              borderRadius: 4,
            },
          }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Based on {score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'fair'} performance
          </Typography>
          {score >= 90 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
              <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'medium' }}>
                Top Rated
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // Default variant
  return (
    <Box>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant={config.fontSize as any} color="text.secondary">
            TrustScore
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant={config.fontSize as any} fontWeight="bold" sx={{ color }}>
              {score}/100
            </Typography>
            {showGrade && (
              <Chip
                label={calculatedGrade}
                size={config.gradeSize}
                sx={{
                  backgroundColor: color,
                  color: '#fff',
                  fontWeight: 'bold',
                  height: size === 'small' ? 20 : 24,
                }}
              />
            )}
          </Box>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: config.height,
          borderRadius: 4,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: color,
            borderRadius: 4,
          },
        }}
      />
    </Box>
  );
};
