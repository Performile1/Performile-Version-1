import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';
import { NotLoggedInModal } from '@/components/auth/NotLoggedInModal';
import { AuthPage } from '@/pages/AuthPage';
import { NotFound } from '@/pages/NotFound';
import { Dashboard } from '@/pages/Dashboard';
import { TrustScores } from '@/pages/TrustScores';
import { ManageCarriers } from '@/pages/admin/ManageCarriers';
import { ManageStores } from '@/pages/admin/ManageStores';
import { ManageMerchants } from '@/pages/admin/ManageMerchants';
import { ManageCouriers } from '@/pages/admin/ManageCouriers';
import { ReviewBuilder } from '@/pages/admin/ReviewBuilder';
import SubscriptionManagement from '@/pages/admin/SubscriptionManagement';
import SystemSettings from '@/pages/admin/SystemSettings';
import RoleManagement from '@/pages/admin/RoleManagement';
import FeatureFlagsSettings from '@/pages/admin/FeatureFlagsSettings';
import { CourierDirectory } from '@/pages/courier/CourierDirectory';
import { CourierCheckoutAnalytics } from '@/pages/courier/CourierCheckoutAnalytics';
import { MerchantCheckoutAnalytics } from '@/pages/merchant/MerchantCheckoutAnalytics';
import { TeamManagement } from '@/pages/team/TeamManagement';
import { AcceptInvitation } from '@/pages/team/AcceptInvitation';
import { Analytics } from './pages/Analytics';
import AdminAnalytics from './pages/analytics/AdminAnalytics';
import MerchantAnalytics from './pages/analytics/MerchantAnalytics';
import CourierAnalytics from './pages/analytics/CourierAnalytics';
import { ReviewRequestSettings } from './pages/settings/ReviewRequestSettings';
import { CourierPreferences } from './pages/settings/CourierPreferences';
import ProximitySettings from './pages/settings/ProximitySettings';
import NotificationPreferences from './pages/settings/NotificationPreferences';
import NotificationCenter from './pages/notifications/NotificationCenter';
import { PluginSetup } from './pages/integrations/PluginSetup';
import { CourierIntegrationSettings } from './pages/integrations/CourierIntegrationSettings';
import { WebhookManagement } from './pages/integrations/WebhookManagement';
import { ApiKeysManagement } from './pages/integrations/ApiKeysManagement';
import { IntegrationDashboard } from './pages/integrations/IntegrationDashboard';
import { TrackingPage } from './pages/TrackingPage';
import { ClaimsPage } from './pages/ClaimsPage';
import { MessagingCenter } from './components/messaging/MessagingCenter';
import Settings from './pages/Settings';
import Orders from './pages/Orders';
import ServiceRatingForm from './components/rating/ServiceRatingForm';
import { SentryTestButton } from './components/debug/SentryTestButton';
import { PublicReview } from './pages/PublicReview';
import Pricing from './pages/Pricing';
import { AIChatWidget } from './components/chat/AIChatWidget';
import SubscriptionPlans from './pages/SubscriptionPlans';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import MySubscription from './pages/MySubscription';
import ResetPassword from './pages/ResetPassword';
import BillingPortal from './pages/BillingPortal';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Info from './pages/Info';
import { ComingSoon } from './components/ComingSoon';
import { CheckoutDemo } from './pages/CheckoutDemo';
import LandingPage from './pages/LandingPage';
import KnowledgeBase from './pages/KnowledgeBase';
import ConsumerDashboard from './pages/consumer/Dashboard';
import ConsumerOrders from './pages/consumer/Orders';
import C2CCreate from './pages/consumer/C2CCreate';

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
  const { isAuthenticated, user, validateStoredToken } = useAuthStore();
  const [showNotLoggedIn, setShowNotLoggedIn] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(true);

  // Validate tokens on app load
  React.useEffect(() => {
    const validateTokens = async () => {
      try {
        console.log('[App] Validating stored tokens on load...');
        await validateStoredToken();
      } catch (error) {
        console.error('[App] Token validation failed:', error);
      } finally {
        setIsValidating(false);
      }
    };

    validateTokens();
  }, []); // Run once on mount

  // Proactive token refresh - check every 50 minutes
  React.useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    console.log('[App] Setting up proactive token refresh (every 50 minutes)');
    
    const refreshInterval = setInterval(async () => {
      console.log('[App] Proactive token refresh triggered');
      try {
        await validateStoredToken();
      } catch (error) {
        console.error('[App] Proactive token refresh failed:', error);
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      console.log('[App] Clearing token refresh interval');
      clearInterval(refreshInterval);
    };
  }, [isAuthenticated, validateStoredToken]);

  // Listen for authentication errors
  React.useEffect(() => {
    const handleAuthError = () => {
      if (!isAuthenticated && !isValidating) {
        setShowNotLoggedIn(true);
      }
    };

    // You can add event listeners here if needed
    // For now, we'll rely on the SessionExpiredModal for 401 errors

    return () => {
      // Cleanup
    };
  }, [isAuthenticated, isValidating]);

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
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/info" element={<Info />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
            <Route path="/checkout-demo" element={<CheckoutDemo />} />
            <Route path="/review/:token" element={<PublicReview />} />
            <Route path="/track/:trackingNumber?" element={<TrackingPage />} />
            {/* Public subscription plans page (for non-logged-in users) */}
            <Route path="/subscription/plans" element={<SubscriptionPlans />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            {/* My Subscription - for logged-in merchants and couriers */}
            <Route
              path="/my-subscription"
              element={
                <ProtectedRoute requiredRoles={['merchant', 'courier']}>
                  <MySubscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trustscores"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant', 'consumer']}>
                  <TrustScores />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant', 'courier', 'consumer']}>
                  <TrackingPage />
                </ProtectedRoute>
              }
            />
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
            {/* Consumer Routes */}
            <Route
              path="/consumer/dashboard"
              element={
                <ProtectedRoute requiredRoles={['consumer']}>
                  <ConsumerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consumer/orders"
              element={
                <ProtectedRoute requiredRoles={['consumer']}>
                  <ConsumerOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/consumer/c2c/create"
              element={
                <ProtectedRoute requiredRoles={['consumer']}>
                  <C2CCreate />
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
              path="/admin/system-settings"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <SystemSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/role-management"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/feature-flags"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <FeatureFlagsSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/service-performance"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Navigate to="/settings#analytics" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/service-analytics"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <Navigate to="/settings#analytics" replace />
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
              path="/analytics/admin"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/merchant"
              element={
                <ProtectedRoute requiredRoles={['merchant']}>
                  <MerchantAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/courier"
              element={
                <ProtectedRoute requiredRoles={['courier']}>
                  <CourierAnalytics />
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
            {/* Coming Soon Features */}
            <Route
              path="/parcel-points"
              element={
                <ProtectedRoute requiredRoles={['merchant', 'courier']}>
                  <ComingSoon 
                    featureName="Parcel Points"
                    description="Find and manage parcel pickup and drop-off locations. Search by postal code, view coverage maps, and get detailed information about each location."
                    estimatedDate="Q1 2026"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coverage-checker"
              element={
                <ProtectedRoute requiredRoles={['merchant', 'courier']}>
                  <ComingSoon 
                    featureName="Coverage Checker"
                    description="Check delivery coverage for any postal code or address. View service availability, delivery times, and pricing for different courier services."
                    estimatedDate="Q1 2026"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/marketplace"
              element={
                <ProtectedRoute requiredRoles={['courier']}>
                  <ComingSoon 
                    featureName="Marketplace"
                    description="Browse and bid on delivery jobs from merchants. Expand your business by finding new opportunities in your service area."
                    estimatedDate="Q2 2026"
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <IntegrationDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/couriers"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <CourierIntegrationSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/webhooks"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <WebhookManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/integrations/api-keys"
              element={
                <ProtectedRoute requiredRoles={['admin', 'merchant']}>
                  <ApiKeysManagement />
                </ProtectedRoute>
              }
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
            <Route
              path="/settings/proximity"
              element={
                <ProtectedRoute requiredRoles={['merchant', 'courier']}>
                  <ProximitySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/notifications"
              element={
                <ProtectedRoute>
                  <NotificationPreferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationCenter />
                </ProtectedRoute>
              }
            />

            {/* Default Redirects */}
            <Route
              path="/"
              element={
                <Navigate to={isAuthenticated ? "/dashboard" : "/home"} replace />
              }
            />
            
            {/* 404 Not Found - Must be last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Only show session modal on protected routes (when user is authenticated) */}
          {isAuthenticated && <SessionExpiredModal />}
          <NotLoggedInModal 
            isOpen={showNotLoggedIn} 
            onClose={() => setShowNotLoggedIn(false)}
          />
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
        <AIChatWidget position="bottom-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
