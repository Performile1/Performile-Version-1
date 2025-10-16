import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import MerchantSettings from '@/pages/MerchantSettings';
import CourierSettings from '@/pages/CourierSettings';
import ConsumerSettings from '@/pages/ConsumerSettings';
import AdminSettings from '@/pages/AdminSettings';
import { CircularProgress, Box } from '@mui/material';

/**
 * RoleBasedSettingsRouter
 * 
 * Automatically routes users to their role-specific settings page.
 * Same URL (/settings) but different content based on user role.
 * 
 * Usage:
 * <Route path="/settings" element={<RoleBasedSettingsRouter />} />
 */
export const RoleBasedSettingsRouter: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Check if user is loaded
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route to role-specific settings page
  switch (user.user_role) {
    case 'merchant':
      return <MerchantSettings />;
    
    case 'courier':
      return <CourierSettings />;
    
    case 'consumer':
      return <ConsumerSettings />;
    
    case 'admin':
      return <AdminSettings />;
    
    default:
      // Unknown role, redirect to dashboard
      console.error('Unknown user role:', user.user_role);
      return <Navigate to="/dashboard" replace />;
  }
};

export default RoleBasedSettingsRouter;
