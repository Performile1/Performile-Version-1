import * as Sentry from '@sentry/react';

export const initSentry = () => {
  // Only initialize Sentry in production
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 0.1, // 10% of transactions
      
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/frontend-two-swart-31\.vercel\.app/,
        /^https:\/\/.*\.vercel\.app/
      ],
      
      // Capture Replay for 10% of all sessions,
      // plus 100% of sessions with an error
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Additional options
      environment: import.meta.env.MODE,
      enabled: true,
      
      // Ignore common errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Facebook
        'fb_xd_fragment',
        // Network errors
        'NetworkError',
        'Network request failed',
        // Pusher connection errors (non-critical)
        'Pusher',
      ],
      
      // Before sending to Sentry
      beforeSend(event, hint) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          console.log('Sentry event (dev mode):', event);
          return null;
        }
        
        // Filter out non-error events
        if (event.level === 'info' || event.level === 'warning') {
          return null;
        }
        
        return event;
      },
    });
  }
};

// Helper to manually capture errors
export const captureError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error captured:', error, context);
  }
};

// Helper to set user context
export const setSentryUser = (user: { id: string; email?: string; username?: string }) => {
  if (import.meta.env.PROD) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
};

// Helper to clear user context (on logout)
export const clearSentryUser = () => {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
};
