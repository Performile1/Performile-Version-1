import React from 'react';
import { Button } from '@mui/material';
import { BugReport } from '@mui/icons-material';
import * as Sentry from '@sentry/react';

/**
 * Test button to verify Sentry error tracking
 * Only visible in development mode
 * Remove this component before production launch
 */
export const SentryTestButton: React.FC = () => {
  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const testCaptureException = () => {
    try {
      throw new Error('Manually captured test error');
    } catch (error) {
      Sentry.captureException(error, {
        extra: {
          testType: 'manual capture',
          timestamp: new Date().toISOString(),
        },
      });
      alert('Error captured and sent to Sentry! Check your Sentry dashboard.');
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Button
        variant="contained"
        color="error"
        startIcon={<BugReport />}
        onClick={testCaptureException}
        size="small"
      >
        Test Sentry
      </Button>
    </div>
  );
};
