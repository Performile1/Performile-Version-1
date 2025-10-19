import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Container, Typography, Paper, Stack, Card, CardContent, Alert, Collapse } from '@mui/material';
import { ErrorOutline, Refresh, Home, BugReport, ExpandMore, ExpandLess, SearchOff } from '@mui/icons-material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Report to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
    window.location.href = '/';
  };

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  getErrorMessage = (error: Error): string => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'Failed to load application resources. This might be due to a network issue or an app update.';
    }
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You do not have permission to access this resource.';
    }
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return 'Server error occurred. Please try again later.';
    }
    return 'An unexpected error occurred. Please try refreshing the page.';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;
      const errorMessage = error ? this.getErrorMessage(error) : 'An unknown error occurred';

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 500, width: '100%', mx: 'auto' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3} alignItems="center">
                {/* Performile Logo */}
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src="/Performile-lastmile performance index.ico"
                    alt="Performile Logo"
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'contain',
                    }}
                  />
                </Box>

                {/* Error Icon - Magnifying Glass with X */}
                <Box
                  sx={{
                    position: 'relative',
                    width: 120,
                    height: 120,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SearchOff
                    sx={{
                      fontSize: 60,
                      color: 'white',
                    }}
                  />
                </Box>

                {/* Error Title */}
                <Typography variant="h5" component="h2" textAlign="center" fontWeight="bold">
                  Oops! Something went wrong
                </Typography>

                {/* User-friendly error message */}
                <Alert severity="error" sx={{ width: '100%' }}>
                  {errorMessage}
                </Alert>

                {/* Retry information */}
                {retryCount > 0 && (
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Retry attempt: {retryCount} of {this.maxRetries}
                  </Typography>
                )}

                {/* Action buttons */}
                <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent="center">
                  {canRetry && (
                    <Button
                      variant="contained"
                      startIcon={<Refresh />}
                      onClick={this.handleRetry}
                      color="primary"
                    >
                      Try Again
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<Home />}
                    onClick={this.handleGoHome}
                  >
                    Go to Dashboard
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => window.location.reload()}
                    startIcon={<Refresh />}
                  >
                    Refresh Page
                  </Button>
                </Stack>

                {/* Technical details toggle */}
                {import.meta.env.DEV && (
                  <>
                    <Button
                      variant="text"
                      startIcon={<BugReport />}
                      endIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
                      onClick={this.toggleDetails}
                      size="small"
                    >
                      Technical Details
                    </Button>

                    <Collapse in={this.state.showDetails} sx={{ width: '100%' }}>
                      <Card variant="outlined" sx={{ mt: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            Error Details:
                          </Typography>
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              backgroundColor: 'grey.100',
                              p: 1,
                              borderRadius: 1,
                              maxHeight: 200,
                              overflow: 'auto',
                            }}
                          >
                            {error?.toString()}
                          </Typography>
                          
                          {errorInfo && (
                            <>
                              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                                Component Stack:
                              </Typography>
                              <Typography
                                variant="body2"
                                component="pre"
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  backgroundColor: 'grey.100',
                                  p: 1,
                                  borderRadius: 1,
                                  maxHeight: 200,
                                  overflow: 'auto',
                                }}
                              >
                                {errorInfo.componentStack}
                              </Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Collapse>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    Sentry?: any;
  }
}
