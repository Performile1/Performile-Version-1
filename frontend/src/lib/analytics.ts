import posthog from 'posthog-js';

// Initialize PostHog
export const initAnalytics = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('⚠️ PostHog API key not configured. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      autocapture: false, // Disable automatic capture to reduce errors
      capture_pageview: false, // Manual page view tracking
      capture_pageleave: false,
      
      // Disable session recording in production to avoid errors
      disable_session_recording: true,
      
      // Reduce network requests
      persistence: 'localStorage',
      
      // Error handling
      on_xhr_error: (failedRequest) => {
        console.warn('PostHog request failed:', failedRequest);
      },
      
      // Performance
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.debug();
        }
        console.log('✅ PostHog analytics initialized');
      },
    });
  } catch (error) {
    console.error('❌ Failed to initialize PostHog:', error);
    // Don't throw - allow app to continue without analytics
  }
};

// Helper to check if PostHog is available
const isPostHogAvailable = (): boolean => {
  try {
    return posthog && posthog.__loaded === true;
  } catch {
    return false;
  }
};

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    if (isPostHogAvailable()) {
      posthog.capture(eventName, properties);
    }
  } catch (error) {
    console.warn('Failed to track event:', eventName, error);
  }
};

// Identify user
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  try {
    if (isPostHogAvailable()) {
      posthog.identify(userId, properties);
    }
  } catch (error) {
    console.warn('Failed to identify user:', error);
  }
};

// Reset user (on logout)
export const resetUser = () => {
  try {
    if (isPostHogAvailable()) {
      posthog.reset();
    }
  } catch (error) {
    console.warn('Failed to reset user:', error);
  }
};

// Track page view
export const trackPageView = (pageName?: string) => {
  try {
    if (isPostHogAvailable()) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_name: pageName,
      });
    }
  } catch (error) {
    console.warn('Failed to track page view:', error);
  }
};

// Feature flags
export const isFeatureEnabled = (flagKey: string): boolean => {
  try {
    if (isPostHogAvailable()) {
      return posthog.isFeatureEnabled(flagKey) || false;
    }
  } catch (error) {
    console.warn('Failed to check feature flag:', flagKey, error);
  }
  return false;
};

// Common event tracking helpers
export const analytics = {
  // Auth events
  signup: (userId: string, userRole: string) => {
    trackEvent('user_signup', { user_role: userRole });
    identifyUser(userId, { role: userRole });
  },

  login: (userId: string, userRole: string) => {
    trackEvent('user_login', { user_role: userRole });
    identifyUser(userId, { role: userRole });
  },

  logout: () => {
    trackEvent('user_logout');
    resetUser();
  },

  // Order events
  orderCreated: (orderId: string, value?: number) => {
    trackEvent('order_created', { order_id: orderId, value });
  },

  orderCompleted: (orderId: string, value?: number) => {
    trackEvent('order_completed', { order_id: orderId, value });
  },

  // Review events
  reviewSubmitted: (reviewId: string, rating: number) => {
    trackEvent('review_submitted', { review_id: reviewId, rating });
  },

  reviewRequestSent: (orderId: string) => {
    trackEvent('review_request_sent', { order_id: orderId });
  },

  // Subscription events
  subscriptionStarted: (planId: string, planName: string, price: number) => {
    trackEvent('subscription_started', {
      plan_id: planId,
      plan_name: planName,
      price,
    });
  },

  subscriptionUpgraded: (oldPlan: string, newPlan: string) => {
    trackEvent('subscription_upgraded', {
      old_plan: oldPlan,
      new_plan: newPlan,
    });
  },

  subscriptionCancelled: (planId: string, reason?: string) => {
    trackEvent('subscription_cancelled', {
      plan_id: planId,
      reason,
    });
  },

  // Team events
  teamMemberInvited: (email: string, role: string) => {
    trackEvent('team_member_invited', { email, role });
  },

  teamMemberJoined: (userId: string, role: string) => {
    trackEvent('team_member_joined', { user_id: userId, role });
  },

  // Marketplace events
  courierViewed: (courierId: string) => {
    trackEvent('courier_viewed', { courier_id: courierId });
  },

  courierContacted: (courierId: string) => {
    trackEvent('courier_contacted', { courier_id: courierId });
  },

  // Integration events
  integrationConnected: (platform: string) => {
    trackEvent('integration_connected', { platform });
  },

  integrationDisconnected: (platform: string) => {
    trackEvent('integration_disconnected', { platform });
  },

  // Error tracking (complement to Sentry)
  errorOccurred: (errorType: string, errorMessage: string) => {
    trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    });
  },
};

export default posthog;
