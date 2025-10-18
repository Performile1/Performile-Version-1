import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import {
  CloudDone,
  CloudOff,
  Settings,
  Error as ErrorIcon,
  Pause,
  CheckCircle,
} from '@mui/icons-material';

export type IntegrationStatus = 
  | 'not_configured' 
  | 'configured' 
  | 'active' 
  | 'error' 
  | 'paused'
  | 'manual';

interface IntegrationStatusBadgeProps {
  status: IntegrationStatus;
  hasApiIntegration?: boolean;
  size?: 'small' | 'medium';
  showIcon?: boolean;
  lastSyncAt?: string | null;
}

/**
 * IntegrationStatusBadge Component
 * 
 * Displays the integration status of a courier with appropriate color and icon
 * 
 * @param status - Integration status
 * @param hasApiIntegration - Whether courier has API integration capability
 * @param size - Badge size
 * @param showIcon - Whether to show status icon
 * @param lastSyncAt - Last sync timestamp (ISO string)
 */
export const IntegrationStatusBadge: React.FC<IntegrationStatusBadgeProps> = ({
  status,
  hasApiIntegration = false,
  size = 'small',
  showIcon = true,
  lastSyncAt,
}) => {
  // If no API integration, show manual badge
  if (!hasApiIntegration) {
    return (
      <Tooltip title="Manual tracking - No API integration" arrow>
        <Chip 
          label="Manual" 
          size={size}
          variant="outlined"
          sx={{ 
            borderColor: 'grey.400',
            color: 'text.secondary',
          }}
        />
      </Tooltip>
    );
  }

  const statusConfig: Record<IntegrationStatus, {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    icon: React.ReactElement;
    tooltip: string;
  }> = {
    not_configured: {
      label: 'Not Configured',
      color: 'default',
      icon: <Settings fontSize="small" />,
      tooltip: 'API credentials not configured',
    },
    configured: {
      label: 'Configured',
      color: 'info',
      icon: <Settings fontSize="small" />,
      tooltip: 'API configured but not active',
    },
    active: {
      label: 'Active',
      color: 'success',
      icon: <CloudDone fontSize="small" />,
      tooltip: lastSyncAt 
        ? `Active - Last sync: ${new Date(lastSyncAt).toLocaleString()}` 
        : 'Active - Syncing automatically',
    },
    error: {
      label: 'Error',
      color: 'error',
      icon: <ErrorIcon fontSize="small" />,
      tooltip: 'Integration error - Check logs',
    },
    paused: {
      label: 'Paused',
      color: 'warning',
      icon: <Pause fontSize="small" />,
      tooltip: 'Integration paused',
    },
    manual: {
      label: 'Manual',
      color: 'default',
      icon: <CloudOff fontSize="small" />,
      tooltip: 'Manual tracking',
    },
  };

  const config = statusConfig[status];

  return (
    <Tooltip title={config.tooltip} arrow>
      <Chip 
        label={config.label} 
        color={config.color} 
        size={size}
        icon={showIcon ? config.icon : undefined}
        sx={{
          fontWeight: 500,
          ...(status === 'active' && {
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.8 },
            },
          }),
        }}
      />
    </Tooltip>
  );
};

/**
 * Helper function to determine integration status from courier data
 */
export const getIntegrationStatus = (courier: {
  has_api_integration?: boolean;
  integration_status?: string;
}): IntegrationStatus => {
  if (!courier.has_api_integration) {
    return 'manual';
  }
  
  return (courier.integration_status as IntegrationStatus) || 'not_configured';
};
