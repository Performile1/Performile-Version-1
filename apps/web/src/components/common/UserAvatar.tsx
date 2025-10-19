import React, { useState } from 'react';
import { Avatar, Tooltip } from '@mui/material';

interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'circular' | 'rounded' | 'square';
  tooltip?: boolean;
  type?: 'courier' | 'merchant' | 'consumer' | 'user';
}

/**
 * Generate a consistent color based on a string (name)
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
 * Get initials from name
 * For consumers: First letter of first name + first letter of last name
 * For others: First letter of name (or first two letters if single word)
 */
const getInitials = (name: string, type: string): string => {
  if (!name) return '?';
  
  const trimmedName = name.trim();
  
  if (type === 'consumer') {
    // For consumers, use first letter of first and last name
    const parts = trimmedName.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    // If only one name, use first two letters
    return trimmedName.substring(0, 2).toUpperCase();
  }
  
  // For courier/merchant/user, use first letter
  return trimmedName.charAt(0).toUpperCase();
};

/**
 * UserAvatar Component
 * 
 * Displays user avatar with fallback to colored circle with initials
 * - Couriers: First letter of courier name
 * - Merchants: First letter of merchant/store name
 * - Consumers: First letter of first name + first letter of last name
 * 
 * @param name - Full name (e.g., 'DHL Express', 'John Doe', 'My Store')
 * @param imageUrl - Optional image URL
 * @param size - Size variant: small (32px), medium (48px), large (64px), xlarge (80px)
 * @param variant - Avatar shape: circular, rounded, square
 * @param tooltip - Whether to show tooltip on hover
 * @param type - Type of user: courier, merchant, consumer, user
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imageUrl,
  size = 'medium',
  variant = 'circular',
  tooltip = true,
  type = 'user',
}) => {
  const [imageError, setImageError] = useState(false);
  
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
  const initials = getInitials(name, type);
  const backgroundColor = stringToColor(name);

  const avatarElement = (
    <Avatar
      src={!imageError && imageUrl ? imageUrl : undefined}
      alt={`${name} avatar`}
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
      {initials}
    </Avatar>
  );

  if (tooltip) {
    return (
      <Tooltip title={name} arrow>
        {avatarElement}
      </Tooltip>
    );
  }

  return avatarElement;
};

export default UserAvatar;
