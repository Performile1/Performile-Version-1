import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Stepper, Step, StepLabel, StepContent, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

interface OrderTrackingProps {
  trackingNumber: string;
  courier: string;
  onRefresh?: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ trackingNumber, courier, onRefresh }) => {
  const [trackingData, setTrackingData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchTracking();
  }, [trackingNumber]);

  const fetchTracking = async () => {
    try {
      const response = await fetch(`/api/tracking/${trackingNumber}`);
      const data = await response.json();
      if (data.success) {
        setTrackingData(data.data);
      }
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading tracking...</Typography>;
  if (!trackingData) return <Typography>No tracking data available</Typography>;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Tracking Information</Typography>
          <Chip label={trackingData.status.replace(/_/g, ' ')} color="primary" />
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {courier} • {trackingNumber}
        </Typography>
        <Stepper orientation="vertical" sx={{ mt: 2 }}>
          {trackingData.events?.map((event: any, index: number) => (
            <Step key={index} active completed={index > 0}>
              <StepLabel>
                <Typography variant="subtitle2">{event.statusDescription}</Typography>
                <Typography variant="caption">{new Date(event.eventTime).toLocaleString()}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {event.location?.name || event.location?.city}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        {onRefresh && (
          <Button startIcon={<Refresh />} onClick={onRefresh} sx={{ mt: 2 }}>
            Refresh
          </Button>
        )}
      </CardContent>
    </Card>
  );
};