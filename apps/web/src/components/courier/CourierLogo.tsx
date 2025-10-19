import React, { useState } from 'react';
import { Box, Avatar, Typography, Tooltip } from '@mui/material';
import { LocalShipping } from '@mui/icons-material';

interface CourierLogoProps {
  courierCode: string;
  courierName: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showName?: boolean;
  variant?: 'circular' | 'rounded' | 'square';
  tooltip?: boolean;
}

/**
 * Generate a consistent color based on courier name
 * Uses a hash function to ensure same name always gets same color
 */
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate HSL color with good saturation and lightness for readability
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (Math.abs(hash) % 20); // 65-85%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

/**
 * Normalize courier code to handle variants
 * E.g., "DHL Express", "DHL Freight", "DHL eCommerce" all use "dhl" logo
 * 
 * @param courierCode - Original courier code or name
 * @param courierName - Full courier name for additional context
 * @returns Normalized courier code for logo lookup
 */
const normalizeCourierCode = (courierCode: string, courierName: string): string => {
  const code = courierCode.toLowerCase();
  const name = courierName.toLowerCase();
  
  // DHL variants: DHL Express, DHL Freight, DHL eCommerce, DHL Supply Chain, etc.
  if (code.includes('dhl') || name.includes('dhl')) {
    return 'dhl';
  }
  
  // FedEx variants: FedEx Express, FedEx Ground, FedEx Freight, FedEx International
  if (code.includes('fedex') || name.includes('fedex')) {
    return 'fedex';
  }
  
  // UPS variants: UPS Express, UPS Ground, UPS Freight, UPS Mail Innovations
  if (code.includes('ups') || name.includes('ups')) {
    return 'ups';
  }
  
  // TNT (now part of FedEx)
  if (code.includes('tnt') || name.includes('tnt')) {
    return 'tnt';
  }
  
  // DPD variants: DPD Classic, DPD Express, DPD Direct
  if (code.includes('dpd') || name.includes('dpd')) {
    return 'dpd';
  }
  
  // GLS variants: GLS Express, GLS Parcel
  if (code.includes('gls') || name.includes('gls')) {
    return 'gls';
  }
  
  // Hermes/Evri variants
  if (code.includes('hermes') || name.includes('hermes') || code.includes('evri') || name.includes('evri')) {
    return 'hermes';
  }
  
  // PostNL variants
  if (code.includes('postnl') || name.includes('postnl')) {
    return 'postnl';
  }
  
  // Default: return original code
  return code;
};

/**
 * CourierLogo Component
 * 
 * Displays courier logo from public/courier-logos/ folder
 * Falls back to first letter avatar if logo not found
 * Automatically handles courier variants (e.g., DHL Express, DHL Freight use same logo)
 * 
 * @param courierCode - Courier code (e.g., 'dhl', 'fedex')
 * @param courierName - Full courier name (e.g., 'DHL Express')
 * @param size - Size variant: small (32px), medium (48px), large (64px), xlarge (80px)
 * @param showName - Whether to display courier name next to logo
 * @param variant - Avatar shape: circular, rounded, square
 * @param tooltip - Whether to show tooltip on hover
 */
export const CourierLogo: React.FC<CourierLogoProps> = ({
  courierCode,
  courierName,
  size = 'medium',
  showName = false,
  variant = 'circular',
  tooltip = true,
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Normalize courier code to handle variants (DHL Express, DHL Freight, etc.)
  const normalizedCode = normalizeCourierCode(courierCode, courierName);
  const logoPath = `/courier-logos/${normalizedCode}_logo.jpeg`;
  
  const sizes = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80,
  };

  const borderRadius = {
    circular: '50%',
    rounded: '8px',
    square: '0px',
  };

  const avatarSize = sizes[size];
  const backgroundColor = stringToColor(courierName);

  const avatarElement = (
    <Avatar
      src={!imageError ? logoPath : undefined}
      alt={`${courierName} logo`}
      sx={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: borderRadius[variant],
        bgcolor: backgroundColor,
        color: '#ffffff',
        fontSize: avatarSize / 2.5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      imgProps={{
        onError: () => {
          // Set error state to prevent further attempts and console errors
          setImageError(true);
        },
      }}
    >
      {courierName.charAt(0).toUpperCase()}
    </Avatar>
  );

  const content = (
    <Box 
      display="flex" 
      alignItems="center" 
      gap={showName ? 1.5 : 0}
      sx={{
        cursor: tooltip ? 'pointer' : 'default',
      }}
    >
      {avatarElement}
      {showName && (
        <Typography 
          variant={size === 'small' ? 'body2' : 'body1'}
          fontWeight={500}
          noWrap
        >
          {courierName}
        </Typography>
      )}
    </Box>
  );

  if (tooltip && !showName) {
    return (
      <Tooltip title={courierName} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

/**
 * Helper function to get courier logo URL
 * @param courierCode - Courier code
 * @returns Logo URL path
 */
export const getCourierLogoUrl = (courierCode: string): string => {
  return `/courier-logos/${courierCode.toLowerCase()}_logo.jpeg`;
};

/**
 * Helper function to check if courier has logo
 * @param courierCode - Courier code
 * @returns Promise<boolean>
 */
export const courierHasLogo = async (courierCode: string): Promise<boolean> => {
  try {
    const response = await fetch(getCourierLogoUrl(courierCode), { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
