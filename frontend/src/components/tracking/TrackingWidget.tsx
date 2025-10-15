import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  LocalShipping,
  CheckCircle,
  Warning,
  TrendingUp,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/apiClient';

interface TrackingSummary {
  total: number;
  outForDelivery: number;
  inTransit: number;
  delivered: number;
  exceptions: number;
  recentUpdates: Array<{
    orderId: string;
    trackingNumber: string;
    status: string;
    timestamp: string;
  }>;
}

export const TrackingWidget: React.FC = () => {
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrackingSummary();
    const interval = setInterval(fetchTrackingSummary, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingSummary = async () => {
    try {
      const response = await apiClient.get('/tracking/summary');
      setSummary(response.data.data);
    } catch (error) {
      console.error('Error fetching tracking summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            📦 Active Shipments
          </Typography>
          <Chip label={summary.total} color="primary" />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip
            icon={<LocalShipping />}
            label={`Out for Delivery: ${summary.outForDelivery}`}
            color="info"
            variant="outlined"
          />
          <Chip
            icon={<TrendingUp />}
            label={`In Transit: ${summary.inTransit}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<CheckCircle />}
            label={`Delivered: ${summary.delivered}`}
            color="success"
            variant="outlined"
          />
          {summary.exceptions > 0 && (
            <Chip
              icon={<Warning />}
              label={`Exceptions: ${summary.exceptions}`}
              color="error"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Recent Updates
        </Typography>

        <List dense>
          {summary.recentUpdates.slice(0, 5).map((update, index) => (
            <ListItem
              key={index}
              sx={{
                bgcolor: 'grey.50',
                borderRadius: 1,
                mb: 1,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'grey.100' },
              }}
              onClick={() => navigate(`/track/${update.trackingNumber}`)}
            >
              <ListItemText
                primary={`Order #${update.orderId.slice(0, 8)}`}
                secondary={`${update.status.replace(/_/g, ' ')} • ${new Date(update.timestamp).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>

        <Button
          fullWidth
          variant="outlined"
          onClick={() => navigate('/orders')}
          sx={{ mt: 2 }}
        >
          View All Shipments
        </Button>
      </CardContent>
    </Card>
  );
};
