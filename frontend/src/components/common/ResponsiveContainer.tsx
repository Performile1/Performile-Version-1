import React from 'react';
import {
  Container,
  ContainerProps,
} from '@mui/material';

interface ResponsiveContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  children: React.ReactNode;
  mobilePadding?: boolean;
  fullHeight?: boolean;
  centerContent?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  mobilePadding = true,
  fullHeight = false,
  centerContent = false,
  maxWidth = 'lg',
  sx,
  ...props
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        px: {
          xs: mobilePadding ? 2 : 0,
          sm: mobilePadding ? 3 : 0,
          md: 4,
        },
        py: {
          xs: 2,
          md: 3,
        },
        mt: {
          xs: 7, // Account for mobile header
          md: 0,
        },
        mb: {
          xs: 7, // Account for bottom navigation
          md: 0,
        },
        minHeight: fullHeight ? {
          xs: 'calc(100vh - 112px)', // Mobile with header and bottom nav
          md: '100vh',
        } : 'auto',
        display: centerContent ? 'flex' : 'block',
        flexDirection: centerContent ? 'column' : 'row',
        justifyContent: centerContent ? 'center' : 'flex-start',
        alignItems: centerContent ? 'center' : 'stretch',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

export default ResponsiveContainer;
