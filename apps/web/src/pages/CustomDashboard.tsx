/**
 * CUSTOM DASHBOARD PAGE
 * Customizable dashboard with drag-and-drop widgets
 * Created: October 21, 2025
 */

import React from 'react';
import { Box, Container } from '@mui/material';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';

export const CustomDashboard: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <CustomizableDashboard />
    </Container>
  );
};

export default CustomDashboard;
