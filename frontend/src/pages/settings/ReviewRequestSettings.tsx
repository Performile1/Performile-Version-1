import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Slider,
  Chip,
  FormGroup,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotifIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface ReviewSettings {
  auto_request_enabled: boolean;
  days_after_delivery: number;
  max_requests_per_order: number;
  reminder_interval_days: number;
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  custom_message: string;
  custom_subject: string;
  include_incentive: boolean;
  incentive_text: string;
  min_order_value: number;
  only_successful_deliveries: boolean;
  exclude_low_ratings: boolean;
}

export const ReviewRequestSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ReviewSettings>({
    auto_request_enabled: true,
    days_after_delivery: 2,
    max_requests_per_order: 3,
    reminder_interval_days: 7,
    email_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    custom_message: '',
    custom_subject: '',
    include_incentive: false,
    incentive_text: '',
    min_order_value: 0,
    only_successful_deliveries: true,
    exclude_low_ratings: false,
  });

  // Fetch settings
  const { data: settingsData } = useQuery({
    queryKey: ['review-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/review-requests/settings');
      return response.data;
    },
  });

  // Update settings when data is fetched
  React.useEffect(() => {
    if (settingsData?.data) {
      setSettings(settingsData.data);
    }
  }, [settingsData]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: ReviewSettings) => {
      const response = await apiClient.put('/review-requests/settings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-settings'] });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleChange = (field: keyof ReviewSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Review Request Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Configure automated review requests to collect feedback from your customers
      </Typography>

      {saveSettingsMutation.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Automation Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Automation
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.auto_request_enabled}
                    onChange={(e) => handleChange('auto_request_enabled', e.target.checked)}
                  />
                }
                label="Enable automatic review requests"
              />

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Days after delivery: {settings.days_after_delivery}
                </Typography>
                <Slider
                  value={settings.days_after_delivery}
                  onChange={(_, value) => handleChange('days_after_delivery', value)}
                  min={0}
                  max={30}
                  marks={[
                    { value: 0, label: 'Immediate' },
                    { value: 7, label: '1 week' },
                    { value: 14, label: '2 weeks' },
                    { value: 30, label: '1 month' },
                  ]}
                  disabled={!settings.auto_request_enabled}
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Maximum reminders per order: {settings.max_requests_per_order}
                </Typography>
                <Slider
                  value={settings.max_requests_per_order}
                  onChange={(_, value) => handleChange('max_requests_per_order', value)}
                  min={1}
                  max={5}
                  marks
                  disabled={!settings.auto_request_enabled}
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Reminder interval (days): {settings.reminder_interval_days}
                </Typography>
                <Slider
                  value={settings.reminder_interval_days}
                  onChange={(_, value) => handleChange('reminder_interval_days', value)}
                  min={1}
                  max={30}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 7, label: '7' },
                    { value: 14, label: '14' },
                    { value: 30, label: '30' },
                  ]}
                  disabled={!settings.auto_request_enabled}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Channel Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Channels
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email_enabled}
                      onChange={(e) => handleChange('email_enabled', e.target.checked)}
                      icon={<EmailIcon />}
                      checkedIcon={<EmailIcon />}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      Email notifications
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.sms_enabled}
                      onChange={(e) => handleChange('sms_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SmsIcon fontSize="small" />
                      SMS notifications
                      <Chip label="Premium" size="small" color="primary" />
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.in_app_enabled}
                      onChange={(e) => handleChange('in_app_enabled', e.target.checked)}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotifIcon fontSize="small" />
                      In-app notifications
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Targeting
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Minimum order value"
                type="number"
                value={settings.min_order_value}
                onChange={(e) => handleChange('min_order_value', parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MoneyIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Only request reviews for orders above this value"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.only_successful_deliveries}
                    onChange={(e) => handleChange('only_successful_deliveries', e.target.checked)}
                  />
                }
                label="Only successful deliveries"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.exclude_low_ratings}
                    onChange={(e) => handleChange('exclude_low_ratings', e.target.checked)}
                  />
                }
                label="Exclude customers with previous low ratings (< 3 stars)"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Customization */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Message Customization
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Custom subject line"
                    value={settings.custom_subject}
                    onChange={(e) => handleChange('custom_subject', e.target.value)}
                    placeholder="How was your delivery experience?"
                    helperText="Leave empty to use default"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Custom message"
                    value={settings.custom_message}
                    onChange={(e) => handleChange('custom_message', e.target.value)}
                    placeholder="Hi {customer_name}, we'd love to hear about your recent delivery experience..."
                    helperText="Available variables: {customer_name}, {order_id}, {delivery_date}"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.include_incentive}
                        onChange={(e) => handleChange('include_incentive', e.target.checked)}
                      />
                    }
                    label="Include incentive offer"
                  />
                </Grid>

                {settings.include_incentive && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Incentive text"
                      value={settings.incentive_text}
                      onChange={(e) => handleChange('incentive_text', e.target.value)}
                      placeholder="Leave a review and get 10% off your next order!"
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};
