import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Switch,
  Button,
  Alert,
  Divider,
  Grid,
  FormControlLabel,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

interface SystemSettings {
  email: EmailSettings;
  api: ApiSettings;
  security: SecuritySettings;
  features: FeatureSettings;
  maintenance: MaintenanceSettings;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  from_email: string;
  from_name: string;
  smtp_username?: string;
}

interface ApiSettings {
  rate_limit_per_hour: number;
  max_request_size_mb: number;
  enable_cors: boolean;
  api_version: string;
}

interface SecuritySettings {
  session_timeout_minutes: number;
  max_login_attempts: number;
  require_2fa: boolean;
  password_min_length: number;
  enable_ip_whitelist: boolean;
}

interface FeatureSettings {
  enable_notifications: boolean;
  enable_email_notifications: boolean;
  enable_proximity_matching: boolean;
  enable_realtime_updates: boolean;
  enable_advanced_analytics: boolean;
}

interface MaintenanceSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  scheduled_maintenance?: string;
}

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(null);
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings');
      return response.data.data as SystemSettings;
    },
  });

  // Initialize local settings when data loads
  React.useEffect(() => {
    if (settings && !localSettings) {
      setLocalSettings(settings);
    }
  }, [settings, localSettings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { category: string; settings: any }) => {
      return apiClient.put('/admin/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setHasChanges(false);
    },
  });

  // Reset settings mutation
  const resetMutation = useMutation({
    mutationFn: async (category?: string) => {
      return apiClient.post('/admin/settings/reset', { category });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setHasChanges(false);
    },
  });

  // Backup settings mutation
  const backupMutation = useMutation({
    mutationFn: async () => {
      return apiClient.get('/admin/settings/backup');
    },
  });

  const handleChange = (category: keyof SystemSettings, key: string, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;

    const categories: (keyof SystemSettings)[] = ['email', 'api', 'security', 'features', 'maintenance'];
    const category = categories[activeTab];

    await updateMutation.mutateAsync({
      category,
      settings: localSettings[category],
    });
  };

  const handleReset = async () => {
    const categories: (keyof SystemSettings)[] = ['email', 'api', 'security', 'features', 'maintenance'];
    const category = categories[activeTab];
    await resetMutation.mutateAsync(category);
    refetch();
  };

  const handleBackup = async () => {
    const result = await backupMutation.mutateAsync();
    const backup = result.data.data;
    
    // Download backup as JSON file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settings-backup-${backup.backup_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load system settings. Please try again later.
        </Alert>
      </Box>
    );
  }

  if (!localSettings) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            ⚙️ System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure platform-wide settings and features
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={handleBackup}
            disabled={backupMutation.isPending}
          >
            Backup
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <strong>Note:</strong> Settings are currently managed via environment variables. 
        Changes require server restart to take effect. Database persistence is pending approval.
      </Alert>

      {(updateMutation.isSuccess || resetMutation.isSuccess) && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => {
          updateMutation.reset();
          resetMutation.reset();
        }}>
          Settings updated successfully! Changes will take effect after server restart.
        </Alert>
      )}

      {(updateMutation.isError || resetMutation.isError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to update settings. Please try again.
        </Alert>
      )}

      <Card>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="📧 Email" />
          <Tab label="🔌 API" />
          <Tab label="🔒 Security" />
          <Tab label="✨ Features" />
          <Tab label="🔧 Maintenance" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {/* Email Configuration Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Email Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure SMTP settings for outgoing emails
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={localSettings.email.smtp_host}
                  onChange={(e) => handleChange('email', 'smtp_host', e.target.value)}
                  helperText="e.g., smtp.sendgrid.net"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="SMTP Port"
                  value={localSettings.email.smtp_port}
                  onChange={(e) => handleChange('email', 'smtp_port', parseInt(e.target.value))}
                  helperText="Common ports: 587 (TLS), 465 (SSL), 25"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Email"
                  type="email"
                  value={localSettings.email.from_email}
                  onChange={(e) => handleChange('email', 'from_email', e.target.value)}
                  helperText="Email address for outgoing messages"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="From Name"
                  value={localSettings.email.from_name}
                  onChange={(e) => handleChange('email', 'from_name', e.target.value)}
                  helperText="Display name for outgoing messages"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.email.smtp_secure}
                      onChange={(e) => handleChange('email', 'smtp_secure', e.target.checked)}
                    />
                  }
                  label="Use Secure Connection (TLS/SSL)"
                />
              </Grid>
            </Grid>
          )}

          {/* API Settings Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  API Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure API behavior and limits
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rate Limit (per hour)"
                  value={localSettings.api.rate_limit_per_hour}
                  onChange={(e) => handleChange('api', 'rate_limit_per_hour', parseInt(e.target.value))}
                  helperText="Maximum requests per hour per user"
                  inputProps={{ min: 10, max: 100000 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Request Size (MB)"
                  value={localSettings.api.max_request_size_mb}
                  onChange={(e) => handleChange('api', 'max_request_size_mb', parseInt(e.target.value))}
                  helperText="Maximum size for API requests"
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Version"
                  value={localSettings.api.api_version}
                  onChange={(e) => handleChange('api', 'api_version', e.target.value)}
                  helperText="Current API version"
                  disabled
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.api.enable_cors}
                      onChange={(e) => handleChange('api', 'enable_cors', e.target.checked)}
                    />
                  }
                  label="Enable CORS (Cross-Origin Resource Sharing)"
                />
              </Grid>
            </Grid>
          )}

          {/* Security Settings Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Security Configuration
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure authentication and security settings
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  value={localSettings.security.session_timeout_minutes}
                  onChange={(e) => handleChange('security', 'session_timeout_minutes', parseInt(e.target.value))}
                  helperText="Auto-logout after inactivity"
                  inputProps={{ min: 5, max: 1440 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Login Attempts"
                  value={localSettings.security.max_login_attempts}
                  onChange={(e) => handleChange('security', 'max_login_attempts', parseInt(e.target.value))}
                  helperText="Lock account after failed attempts"
                  inputProps={{ min: 3, max: 10 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Password Min Length"
                  value={localSettings.security.password_min_length}
                  onChange={(e) => handleChange('security', 'password_min_length', parseInt(e.target.value))}
                  helperText="Minimum password length"
                  inputProps={{ min: 8, max: 128 }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.security.require_2fa}
                      onChange={(e) => handleChange('security', 'require_2fa', e.target.checked)}
                    />
                  }
                  label="Require Two-Factor Authentication (2FA)"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.security.enable_ip_whitelist}
                      onChange={(e) => handleChange('security', 'enable_ip_whitelist', e.target.checked)}
                    />
                  }
                  label="Enable IP Whitelist"
                />
              </Grid>
            </Grid>
          )}

          {/* Features Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Feature Toggles
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Enable or disable platform features
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Notifications System</Typography>
                      <Typography variant="body2" color="text.secondary">
                        In-app notification system
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small" 
                        sx={{ display: localSettings.features.enable_notifications ? 'flex' : 'none' }}
                      />
                      <Switch
                        checked={localSettings.features.enable_notifications}
                        onChange={(e) => handleChange('features', 'enable_notifications', e.target.checked)}
                      />
                    </Box>
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Email Notifications</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Send email notifications to users
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label="Coming Soon" 
                        color="warning" 
                        size="small"
                      />
                      <Switch
                        checked={localSettings.features.enable_email_notifications}
                        onChange={(e) => handleChange('features', 'enable_email_notifications', e.target.checked)}
                      />
                    </Box>
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Proximity Matching</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Match orders with nearby couriers
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label="Coming Soon" 
                        color="warning" 
                        size="small"
                      />
                      <Switch
                        checked={localSettings.features.enable_proximity_matching}
                        onChange={(e) => handleChange('features', 'enable_proximity_matching', e.target.checked)}
                      />
                    </Box>
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Real-time Updates</Typography>
                      <Typography variant="body2" color="text.secondary">
                        WebSocket-based live updates
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label="Coming Soon" 
                        color="warning" 
                        size="small"
                      />
                      <Switch
                        checked={localSettings.features.enable_realtime_updates}
                        onChange={(e) => handleChange('features', 'enable_realtime_updates', e.target.checked)}
                      />
                    </Box>
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1">Advanced Analytics</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Advanced reporting and insights
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label="Beta" 
                        color="info" 
                        size="small"
                      />
                      <Switch
                        checked={localSettings.features.enable_advanced_analytics}
                        onChange={(e) => handleChange('features', 'enable_advanced_analytics', e.target.checked)}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Maintenance Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Maintenance Mode
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Configure maintenance mode and scheduled downtime
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <strong>Warning:</strong> Enabling maintenance mode will prevent users from accessing the platform.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings.maintenance.maintenance_mode}
                      onChange={(e) => handleChange('maintenance', 'maintenance_mode', e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1">
                        Enable Maintenance Mode
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Users will see a maintenance page
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Maintenance Message"
                  value={localSettings.maintenance.maintenance_message}
                  onChange={(e) => handleChange('maintenance', 'maintenance_message', e.target.value)}
                  helperText="Message to display to users during maintenance"
                  placeholder="We're performing scheduled maintenance. We'll be back soon!"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Scheduled Maintenance"
                  value={localSettings.maintenance.scheduled_maintenance || ''}
                  onChange={(e) => handleChange('maintenance', 'scheduled_maintenance', e.target.value)}
                  helperText="Schedule future maintenance (optional)"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
              disabled={resetMutation.isPending}
            >
              Reset to Default
            </Button>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setLocalSettings(settings);
                  setHasChanges(false);
                }}
                disabled={!hasChanges}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemSettings;
