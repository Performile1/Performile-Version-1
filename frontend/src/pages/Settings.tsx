import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Chip,
  IconButton,
  InputAdornment,
  Grid,
  Avatar,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import {
  Person as UserIcon,
  Notifications as BellIcon,
  Security as ShieldIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company: string;
    website: string;
    bio: string;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    weeklyReports: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team';
    dataSharing: boolean;
    analyticsTracking: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    theme: 'light' | 'dark' | 'auto';
    dateFormat: string;
  };
}

const Settings: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({
    profile: {
      firstName: user?.first_name || '',
      lastName: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company: '',
      website: '',
      bio: ''
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      weeklyReports: true,
      marketingEmails: false
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analyticsTracking: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      theme: 'light',
      dateFormat: 'MM/DD/YYYY'
    }
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<UserIcon />} label="Profile" iconPosition="start" />
          <Tab icon={<BellIcon />} label="Notifications" iconPosition="start" />
          <Tab icon={<ShieldIcon />} label="Privacy" iconPosition="start" />
          <Tab icon={<PaletteIcon />} label="Preferences" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Profile Settings */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <UserIcon sx={{ fontSize: 24 }} />
              <Typography variant="h5">Profile Information</Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80 }}>
                <UserIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Button variant="outlined" startIcon={<UploadIcon />}>
                  Upload Photo
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  JPG, PNG up to 5MB
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={settings.profile.firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, firstName: e.target.value }
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={settings.profile.lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, lastName: e.target.value }
                    }))
                  }
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={settings.profile.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, email: e.target.value }
                }))
              }
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={settings.profile.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, phone: e.target.value }
                    }))
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={settings.profile.company}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setSettings(prev => ({
                      ...prev,
                      profile: { ...prev.profile, company: e.target.value }
                    }))
                  }
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Website"
              value={settings.profile.website}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, website: e.target.value }
                }))
              }
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={3}
              placeholder="Tell us about yourself..."
              value={settings.profile.bio}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setSettings(prev => ({
                  ...prev,
                  profile: { ...prev.profile, bio: e.target.value }
                }))
              }
              sx={{ mb: 3 }}
            />

            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSaveProfile}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Notification Settings */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <BellIcon sx={{ fontSize: 24 }} />
              <Typography variant="h5">Notification Preferences</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>Email Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive notifications via email
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.smsNotifications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, smsNotifications: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>SMS Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive notifications via SMS
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>Push Notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive push notifications in browser
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, weeklyReports: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>Weekly Reports</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive weekly performance reports
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.marketingEmails}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, marketingEmails: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>Marketing Emails</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive marketing and promotional emails
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSaveNotifications}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Notifications'}
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Privacy Settings */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <ShieldIcon sx={{ fontSize: 24 }} />
              <Typography variant="h5">Privacy & Security</Typography>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Profile Visibility</InputLabel>
              <Select
                value={settings.privacy.profileVisibility}
                label="Profile Visibility"
                onChange={(e: SelectChangeEvent) => 
                  setSettings(prev => ({
                    ...prev,
                    privacy: { ...prev.privacy, profileVisibility: e.target.value as 'public' | 'private' | 'team' }
                  }))
                }
              >
                <MenuItem value="public">Public</MenuItem>
                <MenuItem value="team">Team Only</MenuItem>
                <MenuItem value="private">Private</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, dataSharing: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>Data Sharing</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Share anonymized data for platform improvements
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.analyticsTracking}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, analyticsTracking: e.target.checked }
                      }))
                    }
                  />
                }
                label={
                  <Box>
                    <Typography>Analytics Tracking</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allow analytics tracking for better experience
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>Password & Security</Typography>
            
            <TextField
              fullWidth
              label="Current Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter current password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="New Password"
              type="password"
              placeholder="Enter new password"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              sx={{ mb: 3 }}
            />

            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSavePrivacy}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Preferences */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <PaletteIcon sx={{ fontSize: 24 }} />
              <Typography variant="h5">Preferences</Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={settings.preferences.language}
                    label="Language"
                    onChange={(e: SelectChangeEvent) => 
                      setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, language: e.target.value }
                      }))
                    }
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                    <MenuItem value="it">Italian</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={settings.preferences.timezone}
                    label="Timezone"
                    onChange={(e: SelectChangeEvent) => 
                      setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, timezone: e.target.value }
                      }))
                    }
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                    <MenuItem value="Europe/London">London</MenuItem>
                    <MenuItem value="Europe/Paris">Paris</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={settings.preferences.currency}
                    label="Currency"
                    onChange={(e: SelectChangeEvent) => 
                      setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, currency: e.target.value }
                      }))
                    }
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="CAD">CAD ($)</MenuItem>
                    <MenuItem value="AUD">AUD ($)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={settings.preferences.theme}
                    label="Theme"
                    onChange={(e: SelectChangeEvent) => 
                      setSettings(prev => ({
                        ...prev,
                        preferences: { ...prev.preferences, theme: e.target.value as 'light' | 'dark' | 'auto' }
                      }))
                    }
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="auto">Auto</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Date Format</InputLabel>
              <Select
                value={settings.preferences.dateFormat}
                label="Date Format"
                onChange={(e: SelectChangeEvent) => 
                  setSettings(prev => ({
                    ...prev,
                    preferences: { ...prev.preferences, dateFormat: e.target.value }
                  }))
                }
              >
                <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mb: 2 }}>Account Status</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Chip label="Active" color="success" variant="outlined" />
              <Typography variant="body2" color="text.secondary">
                Account created on {new Date().toLocaleDateString()}
              </Typography>
            </Box>

            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSavePreferences}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default Settings;
