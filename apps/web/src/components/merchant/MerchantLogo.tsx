/**
 * MerchantLogo Component
 * Displays merchant/shop logo with fallback to initials
 * 
 * Phase: B.4 - Frontend Components
 * Created: October 18, 2025, 5:30 PM
 * 
 * Similar to CourierLogo but for merchant shops
 */

import React, { useState } from 'react';
import { Avatar, Box, Tooltip, Typography, Skeleton } from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';

export interface MerchantLogoProps {
  /** Shop ID (optional, for future use) */
  shopId?: string;
  
  /** Shop/Merchant name (required) */
  shopName: string;
  
  /** Logo URL from Supabase Storage */
  logoUrl?: string | null;
  
  /** Size of the logo */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  
  /** Shape variant */
  variant?: 'circular' | 'rounded' | 'square';
  
  /** Show shop name next to logo */
  showName?: boolean;
  
  /** Show tooltip on hover */
  tooltip?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Custom className */
  className?: string;
  
  /** Click handler */
  onClick?: () => void;
}

// Size mappings (in pixels)
const SIZE_MAP = {
  small: 32,
  medium: 48,
  large: 64,
  xlarge: 80,
};

// Border radius mappings
const VARIANT_MAP = {
  circular: '50%',
  rounded: '8px',
  square: '0px',
};

/**
 * Get initials from shop name
 */
function getInitials(name: string): string {
  if (!name) return 'S';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Generate consistent color from shop name
 */
function getColorFromName(name: string): string {
  const colors = [
    '#1976d2', // blue
    '#388e3c', // green
    '#d32f2f', // red
    '#f57c00', // orange
    '#7b1fa2', // purple
    '#0288d1', // light blue
    '#c2185b', // pink
    '#00796b', // teal
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export const MerchantLogo: React.FC<MerchantLogoProps> = ({
  shopId,
  shopName,
  logoUrl,
  size = 'medium',
  variant = 'rounded',
  showName = false,
  tooltip = true,
  loading = false,
  className,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeInPx = SIZE_MAP[size];
  const borderRadius = VARIANT_MAP[variant];
  const initials = getInitials(shopName);
  const backgroundColor = getColorFromName(shopName);

  // Determine if we should show the logo or fallback
  const showLogo = logoUrl && !imageError;

  const logoElement = (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showName ? 1.5 : 0,
        cursor: onClick ? 'pointer' : 'default',
      }}
      className={className}
      onClick={onClick}
    >
      {loading ? (
        <Skeleton
          variant={variant === 'circular' ? 'circular' : 'rectangular'}
          width={sizeInPx}
          height={sizeInPx}
          sx={{ borderRadius }}
        />
      ) : (
        <Avatar
          src={showLogo ? logoUrl : undefined}
          alt={shopName}
          variant={variant === 'circular' ? 'circular' : 'rounded'}
          sx={{
            width: sizeInPx,
            height: sizeInPx,
            borderRadius,
            bgcolor: showLogo ? 'transparent' : backgroundColor,
            border: '1px solid',
            borderColor: 'divider',
            fontSize: size === 'small' ? '0.875rem' : size === 'xlarge' ? '1.5rem' : '1rem',
            fontWeight: 600,
            '& img': {
              objectFit: 'contain',
              padding: '4px',
            },
          }}
          imgProps={{
            onLoad: () => setImageLoading(false),
            onError: () => {
              setImageError(true);
              setImageLoading(false);
            },
          }}
        >
          {!showLogo && (imageLoading ? <StoreIcon /> : initials)}
        </Avatar>
      )}

      {showName && !loading && (
        <Box>
          <Typography
            variant={size === 'small' ? 'body2' : 'subtitle1'}
            fontWeight={600}
            noWrap
          >
            {shopName}
          </Typography>
        </Box>
      )}
    </Box>
  );

  // Wrap with tooltip if enabled
  if (tooltip && !loading) {
    return (
      <Tooltip title={shopName} arrow>
        {logoElement}
      </Tooltip>
    );
  }

  return logoElement;
};

// Export default
export default MerchantLogo;
