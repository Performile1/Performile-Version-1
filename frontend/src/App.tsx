import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';
import { AuthPage } from '@/pages/AuthPage';
import { Dashboard } from '@/pages/Dashboard';
import { TrustScores } from '@/pages/TrustScores';
import { ManageCarriers } from '@/pages/admin/ManageCarriers';
import { ManageStores } from '@/pages/admin/ManageStores';
import { ManageMerchants } from '@/pages/admin/ManageMerchants';
import { ManageCouriers } from '@/pages/admin/ManageCouriers';
import { ReviewBuilder } from '@/pages/admin/ReviewBuilder';
import SubscriptionManagement from '@/pages/admin/SubscriptionManagement';
import { CourierDirectory } from '@/pages/courier/CourierDirectory';
import { CourierCheckoutAnalytics } from '@/pages/courier/CourierCheckoutAnalytics';
import { MerchantCheckoutAnalytics } from '@/pages/merchant/MerchantCheckoutAnalytics';
import { TeamManagement } from '@/pages/team/TeamManagement';
import { AcceptInvitation } from '@/pages/team/AcceptInvitation';
import { Analytics } from './pages/Analytics';
import { ReviewRequestSettings } from './pages/settings/ReviewRequestSettings';
import { CourierPreferences } from './pages/settings/CourierPreferences';
import { PluginSetup } from './pages/integrations/PluginSetup';
import { TrackingPage } from './pages/TrackingPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { MessagingCenter } from './components/messaging/MessagingCenter';
import Settings from './pages/Settings';
import Orders from './pages/Orders';
import ServiceRatingForm from './components/rating/ServiceRatingForm';
import { SentryTestButton } from './components/debug/SentryTestButton';
import { PublicReview } from './pages/PublicReview';
import Pricing from './pages/Pricing';
import SubscriptionPlans from './pages/SubscriptionPlans';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import ResetPassword from './pages/ResetPassword';
import BillingPortal from './pages/BillingPortal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      light: '#8fa5f3',
      dark: '#4c63d2',
    },
    secondary: {
      main: '#764ba2',
      light: '#9575cd',
      dark: '#512da8',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.user_role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const App: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <AuthPage />
              }
            />
            <Route path="/review/:token" element={<PublicReview />} />
            <Route path="/track/:trackingNumber?" element={<TrackingPage />} />
            {(user?.user_role === 'merchant' || user?.user_role === 'consumer' || user?.user_role === 'admin') && (
              <Route path="/trustscores" element={<TrustScores />} />
            )}
            <Route path="/subscription/plans" element={<SubscriptionPlans />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
              path="/claims"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <ClaimsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trustscores"
              element={
                <ProtectedRoute>
                  {user?.user_role === 'courier' ? (
                    <Navigate to="/courier/checkout-analytics" replace />
                  ) : (
                    <TrustScores />
                  )}
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stores"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <ManageMerchants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/couriers"
              element={
                <ProtectedRoute requiredRoles={['admin', 'courier']}>
                  {/* Show anonymized directory for couriers, full management for admin */}
                  {/* This will be handled by checking user role in the component */}
                  <CourierDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courier/checkout-analytics"
              element={
                <ProtectedRoute requiredRoles={['courier', 'admin']}>
                  <CourierCheckoutAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/merchant/checkout-analytics"
              element={
                <ProtectedRoute requiredRoles={['merchant', 'admin']}>
                  <MerchantCheckoutAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <div>Users Page - Coming Soon</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/carriers"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <ManageCarriers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stores"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <ManageStores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/merchants"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <ManageMerchants />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/couriers"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <ManageCouriers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reviews"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <ReviewBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/subscriptions"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <SubscriptionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagingCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/review-requests"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant', 'courier']}>
                  <ReviewRequestSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant', 'courier']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant', 'courier']}>
                  <BillingPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rate/:token"
              element={<ServiceRatingForm />}
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant', 'courier']}>
                  <TeamManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invite/:token"
              element={<AcceptInvitation />}
            />
            <Route
              path="/integrations/ecommerce"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <PluginSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/email-templates"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <div>Email Templates - Coming Soon</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/courier-preferences"
              element={
                <ProtectedRoute requiredRoles={['merchant']}>
                  <CourierPreferences />
                </ProtectedRoute>
              }
            />

            {/* Default Redirects */}
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        <SentryTestButton />
        <SessionExpiredModal />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
