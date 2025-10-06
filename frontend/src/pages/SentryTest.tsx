import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Stack,
  Divider
} from '@mui/material';
import { BugReport, Error as ErrorIcon, Warning, Info } from '@mui/icons-material';
import { captureError } from '@/config/sentry';
import * as Sentry from '@sentry/react';

export const SentryTest: React.FC = () => {
  const [lastError, setLastError] = useState<string>('');

  const testJavaScriptError = () => {
    try {
      throw new Error('Test JavaScript Error - This is a test!');
    } catch (error) {
      setLastError('JavaScript Error thrown');
      throw error; // Re-throw to let Sentry catch it
    }
  };

  const testAsyncError = async () => {
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Test Async Error - Promise rejection!'));
        }, 100);
      });
    } catch (error) {
      setLastError('Async Error thrown');
      throw error;
    }
  };

  const testManualCapture = () => {
    const error = new Error('Test Manual Capture - Using captureError helper');
    captureError(error, {
      context: 'Sentry Test Page',
      timestamp: new Date().toISOString(),
      userAction: 'Manual test button clicked'
    });
    setLastError('Manual error captured');
  };

  const testWithUserContext = () => {
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@performile.com',
      username: 'Test User'
    });
    
    const error = new Error('Test Error with User Context');
    Sentry.captureException(error, {
      tags: {
        test_type: 'user_context',
        environment: 'test'
      },
      extra: {
        message: 'This error includes user context'
      }
    });
    setLastError('Error with user context captured');
  };

  const testAPIError = () => {
    fetch('https://api.example.com/nonexistent-endpoint')
      .then(response => {
        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      })
      .catch(error => {
        captureError(error, {
          context: 'API Test',
          endpoint: 'https://api.example.com/nonexistent-endpoint'
        });
        setLastError('API error captured');
      });
  };

  const testBreadcrumbs = () => {
    // Add custom breadcrumbs
    Sentry.addBreadcrumb({
      category: 'test',
      message: 'User clicked test button',
      level: 'info',
    });

    Sentry.addBreadcrumb({
      category: 'test',
      message: 'Preparing to throw error',
      level: 'warning',
    });

    const error = new Error('Test Error with Breadcrumbs');
    Sentry.captureException(error);
    setLastError('Error with breadcrumbs captured');
  };

  const testPerformance = () => {
    const transaction = Sentry.startTransaction({
      name: 'Test Performance Transaction',
      op: 'test',
    });

    // Simulate some work
    const span = transaction.startChild({
      op: 'test.operation',
      description: 'Simulated slow operation',
    });

    setTimeout(() => {
      span.finish();
      transaction.finish();
      setLastError('Performance transaction captured');
    }, 2000);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🐛 Sentry Error Tracking Test Page
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test different types of errors to verify Sentry integration
        </Typography>
      </Box>

      {lastError && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setLastError('')}>
          <strong>Success!</strong> {lastError}. Check your Sentry dashboard!
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> After clicking any button, check your Sentry dashboard at{' '}
          <a href="https://sentry.io" target="_blank" rel="noopener noreferrer">
            sentry.io
          </a>
          {' '}to see the captured errors.
        </Typography>
      </Alert>

      <Stack spacing={3}>
        {/* Basic Errors */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              Basic Error Tests
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="error"
                startIcon={<BugReport />}
                onClick={testJavaScriptError}
                fullWidth
              >
                Test JavaScript Error
              </Button>
              <Typography variant="caption" color="text.secondary">
                Throws a standard JavaScript error that Sentry will catch automatically
              </Typography>

              <Button
                variant="contained"
                color="error"
                startIcon={<BugReport />}
                onClick={testAsyncError}
                fullWidth
              >
                Test Async Error
              </Button>
              <Typography variant="caption" color="text.secondary">
                Tests promise rejection handling
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Manual Capture */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning color="warning" />
              Manual Capture Tests
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="warning"
                startIcon={<BugReport />}
                onClick={testManualCapture}
                fullWidth
              >
                Test Manual Capture
              </Button>
              <Typography variant="caption" color="text.secondary">
                Uses the captureError helper with custom context
              </Typography>

              <Button
                variant="contained"
                color="warning"
                startIcon={<BugReport />}
                onClick={testWithUserContext}
                fullWidth
              >
                Test with User Context
              </Button>
              <Typography variant="caption" color="text.secondary">
                Captures error with user information attached
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Advanced Tests */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="info" />
              Advanced Tests
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="info"
                startIcon={<BugReport />}
                onClick={testAPIError}
                fullWidth
              >
                Test API Error
              </Button>
              <Typography variant="caption" color="text.secondary">
                Simulates a failed API request
              </Typography>

              <Button
                variant="contained"
                color="info"
                startIcon={<BugReport />}
                onClick={testBreadcrumbs}
                fullWidth
              >
                Test with Breadcrumbs
              </Button>
              <Typography variant="caption" color="text.secondary">
                Captures error with breadcrumb trail of user actions
              </Typography>

              <Button
                variant="contained"
                color="info"
                startIcon={<BugReport />}
                onClick={testPerformance}
                fullWidth
              >
                Test Performance Tracking
              </Button>
              <Typography variant="caption" color="text.secondary">
                Creates a performance transaction (check Performance tab in Sentry)
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Alert severity="warning" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>⚠️ Development Note:</strong> This page is for testing only. 
          Remove or restrict access before production deployment.
        </Typography>
      </Alert>
    </Container>
  );
};
