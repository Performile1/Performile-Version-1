import posthog from 'posthog-js';

// Initialize PostHog
export const initAnalytics = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('PostHog API key not configured. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      autocapture: true, // Automatically capture clicks, page views, etc.
      capture_pageview: true,
      capture_pageleave: true,
      
      // Session recording
      session_recording: {
        recordCrossOriginIframes: false,
        maskAllInputs: true, // Mask sensitive inputs
        maskTextSelector: '.sensitive', // Mask elements with this class
      },
      
      // Performance
      loaded: (posthog) => {
        if (import.meta.env.DEV) {
          posthog.debug();
        }
      },
    });

    console.log('✅ PostHog analytics initialized');
  } catch (error) {
    console.error('❌ Failed to initialize PostHog:', error);
  }
};

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
};

// Identify user
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (posthog.__loaded) {
    posthog.identify(userId, properties);
  }
};

// Reset user (on logout)
export const resetUser = () => {
  if (posthog.__loaded) {
    posthog.reset();
  }
};

// Track page view
export const trackPageView = (pageName?: string) => {
  if (posthog.__loaded) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
    });
  }
};

// Feature flags
export const isFeatureEnabled = (flagKey: string): boolean => {
  if (posthog.__loaded) {
    return posthog.isFeatureEnabled(flagKey) || false;
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
