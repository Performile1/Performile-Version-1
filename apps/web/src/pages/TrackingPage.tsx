import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Schedule,
  LocationOn,
  Refresh,
  Search,
} from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UnifiedTrackingSearch } from '../components/tracking/UnifiedTrackingSearch';

interface TrackingEvent {
  eventTime: string;
  status: string;
  statusDescription: string;
  location?: {
    name?: string;
    city?: string;
    country?: string;
  };
}

interface TrackingData {
  trackingNumber: string;
  courier: string;
  status: string;
  currentLocation?: any;
  estimatedDelivery?: string;
  actualDelivery?: string;
  events: TrackingEvent[];
}

export const TrackingPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      toast.error('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/api/tracking/${trackingNumber.trim()}`);
      setTrackingData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tracking information');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!trackingData) return;
    
    setLoading(true);
    try {
      await axios.post('/api/tracking/refresh', {
        trackingNumber: trackingData.trackingNumber,
        courier: trackingData.courier,
      });
      await handleTrack();
      toast.success('Tracking information refreshed');
    } catch (err) {
      toast.error('Failed to refresh tracking');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      delivered: 'success',
      out_for_delivery: 'info',
      in_transit: 'primary',
      picked_up: 'default',
      failed_delivery: 'error',
      exception: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle />;
    if (status === 'out_for_delivery') return <LocalShipping />;
    return <Schedule />;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        📦 Track Your Shipments
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Track shipments across all couriers in one place
      </Typography>

      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab icon={<Search />} label="Quick Track" />
        <Tab icon={<LocalShipping />} label="Advanced Search" />
      </Tabs>

      {tabValue === 0 ? (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Track by Number
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter your tracking number to see real-time delivery status
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
            <TextField
              fullWidth
              label="Tracking Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              placeholder="Enter tracking number"
            />
            <Button
              variant="contained"
              onClick={handleTrack}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Track'}
            </Button>
          </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {trackingData && (
          <>
            {/* Status Header */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {trackingData.courier}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trackingData.trackingNumber}
                    </Typography>
                  </Box>
                  <Chip
                    icon={getStatusIcon(trackingData.status)}
                    label={trackingData.status.replace(/_/g, ' ').toUpperCase()}
                    color={getStatusColor(trackingData.status) as any}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {trackingData.estimatedDelivery && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Schedule color="action" />
                    <Typography variant="body2">
                      Estimated Delivery: {new Date(trackingData.estimatedDelivery).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {trackingData.actualDelivery && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CheckCircle color="success" />
                    <Typography variant="body2">
                      Delivered: {new Date(trackingData.actualDelivery).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {trackingData.currentLocation && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="action" />
                    <Typography variant="body2">
                      Current Location: {trackingData.currentLocation.name || 'In Transit'}
                    </Typography>
                  </Box>
                )}

                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  Refresh
                </Button>
              </CardContent>
            </Card>

            {/* Tracking Events */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tracking History
                </Typography>

                <Stepper orientation="vertical">
                  {(trackingData.events || []).map((event, index) => (
                    <Step key={index} active={true} completed={index > 0}>
                      <StepLabel>
                        <Typography variant="subtitle2">
                          {event.statusDescription}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(event.eventTime).toLocaleString()}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        {event.location && (
                          <Typography variant="body2" color="text.secondary">
                            📍 {event.location.name || event.location.city}
                            {event.location.country && `, ${event.location.country}`}
                          </Typography>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>

                {(!trackingData.events || trackingData.events.length === 0) && (
                  <Alert severity="info">
                    No tracking events available yet
                  </Alert>
                )}
              </CardContent>
            </Card>
          </>
        )}

          {!trackingData && !error && !loading && (
            <Alert severity="info">
              Enter a tracking number above to see delivery status
            </Alert>
          )}
        </Paper>
      ) : (
        <UnifiedTrackingSearch />
      )}
    </Container>
  );
};
