import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
} from '@mui/material';
import {
  Business as CompanyIcon,
  LocalShipping as FleetIcon,
  People as TeamIcon,
  Star as PerformanceIcon,
  TrendingUp as LeadsIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Api as ApiIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  Assessment as AnalyticsIcon,
} from '@mui/icons-material';

// Import sub-components
// TODO: Create these components
// import { CourierCompanySettings } from '@/components/settings/courier/CourierCompanySettings';
// import { CourierFleetSettings } from '@/components/settings/courier/CourierFleetSettings';
// import { CourierTeamSettings } from '@/components/settings/courier/CourierTeamSettings';
// import { CourierPerformanceSettings } from '@/components/settings/courier/CourierPerformanceSettings';
// import { CourierLeadsSettings } from '@/components/settings/courier/CourierLeadsSettings';
// import { CourierPaymentSettings } from '@/components/settings/courier/CourierPaymentSettings';
// import { CourierNotificationSettings } from '@/components/settings/courier/CourierNotificationSettings';
// import { CourierAPISettings } from '@/components/settings/courier/CourierAPISettings';
// import { CourierAnalyticsSettings } from '@/components/settings/courier/CourierAnalyticsSettings';
// import { CourierGeneralSettings } from '@/components/settings/courier/CourierGeneralSettings';
// import { CourierSecuritySettings} from '@/components/settings/courier/CourierSecuritySettings';
// import { CourierPreferencesSettings } from '@/components/settings/courier/CourierPreferencesSettings';

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
      id={`courier-settings-tabpanel-${index}`}
      aria-labelledby={`courier-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const CourierSettings: React.FC = () => {
  const { user: _user } = useAuthStore(); // Prefix with _ to indicate intentionally unused
  const [tabValue, setTabValue] = useState(0);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  // Get tab from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const tabMap: Record<string, number> = {
      'company': 0,
      'fleet': 1,
      'team': 2,
      'performance': 3,
      'leads': 4,
      'analytics': 5,
      'payments': 6,
      'notifications': 7,
      'api': 8,
      'general': 9,
      'security': 10,
      'preferences': 11,
    };
    
    if (hash && tabMap[hash] !== undefined) {
      setTabValue(tabMap[hash]);
    }
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update URL hash
    const tabNames = [
      'company', 'fleet', 'team', 'performance', 'leads', 'analytics',
      'payments', 'notifications', 'api', 'general', 'security', 'preferences'
    ];
    window.location.hash = tabNames[newValue];
  };

  // Fetch subscription info
  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/couriers/subscription-info', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setSubscriptionInfo(data.data);
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  const planName = subscriptionInfo?.subscription?.plan_name || 'Free';
  const tier = subscriptionInfo?.subscription?.tier || 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Courier Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your courier company, fleet, team, and performance settings
            </Typography>
          </Box>
          <Chip 
            label={`${planName} Plan`}
            color={tier >= 2 ? 'primary' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 72,
              textTransform: 'none',
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab 
            icon={<CompanyIcon />} 
            label="Company Profile" 
            iconPosition="start"
          />
          <Tab 
            icon={<FleetIcon />} 
            label="Fleet & Vehicles" 
            iconPosition="start"
            disabled={tier < 3} // Fleet plan feature
          />
          <Tab 
            icon={<TeamIcon />} 
            label="Team Members" 
            iconPosition="start"
          />
          <Tab 
            icon={<PerformanceIcon />} 
            label="Performance" 
            iconPosition="start"
          />
          <Tab 
            icon={<LeadsIcon />} 
            label="Lead Marketplace" 
            iconPosition="start"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Analytics" 
            iconPosition="start"
            disabled={tier < 2} // Professional+ feature
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Payments" 
            iconPosition="start"
          />
          <Tab 
            icon={<NotificationIcon />} 
            label="Notifications" 
            iconPosition="start"
          />
          <Tab 
            icon={<ApiIcon />} 
            label="API & Integrations" 
            iconPosition="start"
            disabled={tier < 3} // Fleet plan feature
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="General" 
            iconPosition="start"
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="Security" 
            iconPosition="start"
          />
          <Tab 
            icon={<LanguageIcon />} 
            label="Preferences" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Typography>Company Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography>Fleet Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography>Team Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography>Performance Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Typography>Leads Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Typography>Analytics Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <Typography>Payment Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <Typography>Notification Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        <Typography>API Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <Typography>General Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={10}>
        <Typography>Security Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={11}>
        <Typography>Preferences Settings - Coming Soon</Typography>
      </TabPanel>
    </Container>
  );
};

export default CourierSettings;
