import React from 'react';
import {
  Box,
  CircularProgress,
  LinearProgress,
  Skeleton,
  Typography,
  Stack,
} from '@mui/material';

interface LoadingSpinnerProps {
  variant?: 'circular' | 'linear' | 'skeleton' | 'dots';
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  variant = 'circular',
  size = 'medium',
  message,
  fullScreen = false,
  overlay = false,
}) => {
  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 64;
      default:
        return 40;
    }
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'linear':
        return <LinearProgress sx={{ width: '100%', maxWidth: 300 }} />;
      
      case 'skeleton':
        return (
          <Stack spacing={1} sx={{ width: '100%', maxWidth: 300 }}>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={60} />
          </Stack>
        );
      
      case 'dots':
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((index) => (
              <Box
                key={index}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  animation: 'pulse 1.4s ease-in-out infinite both',
                  animationDelay: `${index * 0.16}s`,
                  '@keyframes pulse': {
                    '0%, 80%, 100%': {
                      transform: 'scale(0)',
                    },
                    '40%': {
                      transform: 'scale(1)',
                    },
                  },
                }}
              />
            ))}
          </Box>
        );
      
      default:
        return <CircularProgress size={getSizeValue()} />;
    }
  };

  const content = (
    <Stack spacing={2} alignItems="center">
      {renderSpinner()}
      {message && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          {message}
        </Typography>
      )}
    </Stack>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: overlay ? 'rgba(255, 255, 255, 0.8)' : 'background.default',
          zIndex: 9999,
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      {content}
    </Box>
  );
};

export default LoadingSpinner;
