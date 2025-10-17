import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface NotificationPreferences {
  preference_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  preferences: {
    [key: string]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const notificationTypes = [
  { key: 'new_order', label: 'New Order', description: 'When you receive a new order' },
  { key: 'order_status', label: 'Order Status', description: 'When order status changes' },
  { key: 'delivery_update', label: 'Delivery Update', description: 'When delivery status changes' },
  { key: 'payment_received', label: 'Payment Received', description: 'When payment is confirmed' },
  { key: 'new_review', label: 'New Review', description: 'When you receive a new review' },
  { key: 'proximity_match', label: 'Proximity Match', description: 'When a nearby courier is found' },
  { key: 'system_alert', label: 'System Alert', description: 'Important system notifications' },
];

export const NotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch preferences
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/preferences');
      return response.data.data as NotificationPreferences;
    },
  });

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences | null>(null);

  // Initialize local state when data loads
  React.useEffect(() => {
    if (preferences && !localPreferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<NotificationPreferences>) => {
      await apiClient.put('/notifications/preferences', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences saved successfully');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Failed to save preferences');
    },
  });

  const handleChannelToggle = (channel: 'email_enabled' | 'push_enabled' | 'sms_enabled') => {
    if (!localPreferences) return;
    setLocalPreferences({
      ...localPreferences,
      [channel]: !localPreferences[channel],
    });
    setHasChanges(true);
  };

  const handleTypeToggle = (type: string, channel: 'email' | 'push' | 'sms') => {
    if (!localPreferences) return;
    setLocalPreferences({
      ...localPreferences,
      preferences: {
        ...localPreferences.preferences,
        [type]: {
          ...localPreferences.preferences[type],
          [channel]: !localPreferences.preferences[type]?.[channel],
        },
      },
    });
    setHasChanges(true);
  };

  const handleQuietHoursToggle = () => {
    if (!localPreferences) return;
    setLocalPreferences({
      ...localPreferences,
      quiet_hours_enabled: !localPreferences.quiet_hours_enabled,
    });
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    if (!localPreferences) return;
    setLocalPreferences({
      ...localPreferences,
      [field]: value,
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!localPreferences) return;
    updateMutation.mutate(localPreferences);
  };

  const handleReset = () => {
    if (preferences) {
      setLocalPreferences(preferences);
      setHasChanges(false);
    }
  };

  if (isLoading || !localPreferences) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load preferences. Please try again.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ⚙️ Notification Preferences
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage how and when you receive notifications
      </Typography>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification Channels
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enable or disable notification channels globally
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.email_enabled}
                  onChange={() => handleChannelToggle('email_enabled')}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.push_enabled}
                  onChange={() => handleChannelToggle('push_enabled')}
                />
              }
              label="Push Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.sms_enabled}
                  onChange={() => handleChannelToggle('sms_enabled')}
                />
              }
              label="SMS Notifications"
            />
          </FormGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Notification Types
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customize notifications for each event type
          </Typography>

          {notificationTypes.map((type) => (
            <Accordion key={type.key}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    {type.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPreferences.preferences[type.key]?.email || false}
                        onChange={() => handleTypeToggle(type.key, 'email')}
                        disabled={!localPreferences.email_enabled}
                      />
                    }
                    label="Email"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPreferences.preferences[type.key]?.push || false}
                        onChange={() => handleTypeToggle(type.key, 'push')}
                        disabled={!localPreferences.push_enabled}
                      />
                    }
                    label="Push"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={localPreferences.preferences[type.key]?.sms || false}
                        onChange={() => handleTypeToggle(type.key, 'sms')}
                        disabled={!localPreferences.sms_enabled}
                      />
                    }
                    label="SMS"
                  />
                </FormGroup>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quiet Hours
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mute notifications during specific hours
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={localPreferences.quiet_hours_enabled}
                onChange={handleQuietHoursToggle}
              />
            }
            label="Enable Quiet Hours"
            sx={{ mb: 2 }}
          />

          {localPreferences.quiet_hours_enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={localPreferences.quiet_hours_start || '22:00'}
                  onChange={(e) => handleQuietHoursChange('quiet_hours_start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={localPreferences.quiet_hours_end || '08:00'}
                  onChange={(e) => handleQuietHoursChange('quiet_hours_end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleReset}
          disabled={!hasChanges || updateMutation.isPending}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationPreferences;
