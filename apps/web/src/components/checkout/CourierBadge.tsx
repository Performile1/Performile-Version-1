import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  Speed,
  AttachMoney,
  Star,
  LocalShipping,
  CheckCircle,
} from '@mui/icons-material';

export type BadgeType =
  | 'top_rated'
  | 'most_popular'
  | 'fastest'
  | 'best_value'
  | 'recommended'
  | 'eco_friendly'
  | 'verified';

interface CourierBadgeProps {
  type: BadgeType;
  size?: 'small' | 'medium';
  showIcon?: boolean;
}

export const CourierBadge: React.FC<CourierBadgeProps> = ({
  type,
  size = 'small',
  showIcon = true,
}) => {
  const badgeConfig = {
    top_rated: {
      label: 'Top Rated',
      icon: <EmojiEvents sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#ffd700',
      bgColor: '#fff8e1',
      tooltip: 'Highest rated courier based on customer reviews',
    },
    most_popular: {
      label: 'Most Popular',
      icon: <TrendingUp sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#2196f3',
      bgColor: '#e3f2fd',
      tooltip: 'Most frequently selected by customers',
    },
    fastest: {
      label: 'Fastest',
      icon: <Speed sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#ff5722',
      bgColor: '#fbe9e7',
      tooltip: 'Quickest delivery time',
    },
    best_value: {
      label: 'Best Value',
      icon: <AttachMoney sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#4caf50',
      bgColor: '#e8f5e9',
      tooltip: 'Best balance of price and quality',
    },
    recommended: {
      label: 'Recommended',
      icon: <Star sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      tooltip: 'Recommended based on your preferences',
    },
    eco_friendly: {
      label: 'Eco-Friendly',
      icon: <LocalShipping sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#66bb6a',
      bgColor: '#e8f5e9',
      tooltip: 'Carbon-neutral or low-emission delivery',
    },
    verified: {
      label: 'Verified',
      icon: <CheckCircle sx={{ fontSize: size === 'small' ? 14 : 16 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      tooltip: 'Verified and trusted courier partner',
    },
  };

  const config = badgeConfig[type];

  return (
    <Tooltip title={config.tooltip} arrow>
      <Chip
        icon={showIcon ? config.icon : undefined}
        label={config.label}
        size={size}
        sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          fontWeight: 600,
          fontSize: size === 'small' ? '0.7rem' : '0.75rem',
          height: size === 'small' ? 20 : 24,
          '& .MuiChip-icon': {
            color: config.color,
          },
          border: `1px solid ${config.color}40`,
        }}
      />
    </Tooltip>
  );
};

// Helper function to determine which badges a courier should have
export const getCourierBadges = (courier: {
  trust_score: number;
  avg_rating: number;
  total_reviews: number;
  delivery_time_min: number;
  price: number;
  is_eco_friendly?: boolean;
}): BadgeType[] => {
  const badges: BadgeType[] = [];

  // Top Rated: TrustScore >= 90 and rating >= 4.5
  if (courier.trust_score >= 90 && courier.avg_rating >= 4.5) {
    badges.push('top_rated');
  }

  // Most Popular: High number of reviews
  if (courier.total_reviews >= 1000) {
    badges.push('most_popular');
  }

  // Fastest: Delivery time <= 1 day
  if (courier.delivery_time_min <= 1) {
    badges.push('fastest');
  }

  // Best Value: Good score and reasonable price
  if (courier.trust_score >= 80 && courier.price <= 60) {
    badges.push('best_value');
  }

  // Eco-Friendly
  if (courier.is_eco_friendly) {
    badges.push('eco_friendly');
  }

  // Verified: Always show for couriers with good track record
  if (courier.total_reviews >= 100 && courier.avg_rating >= 4.0) {
    badges.push('verified');
  }

  return badges;
};
