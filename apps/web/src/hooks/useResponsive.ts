import { useTheme, useMediaQuery } from '@mui/material';
import { useMemo } from 'react';

interface ResponsiveValues {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallScreen: boolean;
  isLargeScreen: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const useResponsive = (): ResponsiveValues => {
  const theme = useTheme();
  
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
 
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const breakpoint = useMemo(() => {
    if (isXs) return 'xs';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    return 'xl';
  }, [isXs, isSm, isMd, isLg]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    breakpoint,
  };
};

// Utility hook for responsive values
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}): T | undefined => {
  const { breakpoint } = useResponsive();
  
  return useMemo(() => {
    // Return the value for current breakpoint or fall back to smaller breakpoints
    switch (breakpoint) {
      case 'xl':
        return values.xl ?? values.lg ?? values.md ?? values.sm ?? values.xs;
      case 'lg':
        return values.lg ?? values.md ?? values.sm ?? values.xs;
      case 'md':
        return values.md ?? values.sm ?? values.xs;
      case 'sm':
        return values.sm ?? values.xs;
      case 'xs':
      default:
        return values.xs;
    }
  }, [breakpoint, values]);
};

export default useResponsive;
