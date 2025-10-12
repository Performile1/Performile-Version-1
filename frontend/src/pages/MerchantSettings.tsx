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
  Store as StoreIcon,
  LocalShipping as CourierIcon,
  TrackChanges as TrackingIcon,
  Star as RatingIcon,
  Email as EmailIcon,
  Assignment as ReturnIcon,
  Payment as PaymentIcon,
  Notifications as NotificationIcon,
  Api as ApiIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';

// Import sub-components
import { ShopsSettings } from '@/components/settings/merchant/ShopsSettings';
import { CouriersSettings } from '@/components/settings/merchant/CouriersSettings';
import { TrackingPageSettings } from '@/components/settings/merchant/TrackingPageSettings';
import { RatingSettings } from '@/components/settings/merchant/RatingSettings';
import { EmailTemplatesSettings } from '@/components/settings/merchant/EmailTemplatesSettings';
import { ReturnsSettings } from '@/components/settings/merchant/ReturnsSettings';
import { PaymentSettings } from '@/components/settings/merchant/PaymentSettings';
import { NotificationSettings } from '@/components/settings/merchant/NotificationSettings';
import { APISettings } from '@/components/settings/merchant/APISettings';
import { GeneralSettings } from '@/components/settings/merchant/GeneralSettings';
import { SecuritySettings } from '@/components/settings/merchant/SecuritySettings';
import { PreferencesSettings } from '@/components/settings/merchant/PreferencesSettings';

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
      id={`merchant-settings-tabpanel-${index}`}
      aria-labelledby={`merchant-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const MerchantSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);

  // Get tab from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const tabMap: Record<string, number> = {
      'shops': 0,
      'couriers': 1,
      'tracking': 2,
      'ratings': 3,
      'emails': 4,
      'returns': 5,
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
      'shops', 'couriers', 'tracking', 'ratings', 'emails', 'returns',
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
      const response = await fetch('/api/couriers/merchant-preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get_subscription_info' }),
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
              Merchant Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your shops, couriers, tracking, and all merchant preferences
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
            icon={<StoreIcon />} 
            label="Shops" 
            iconPosition="start"
          />
          <Tab 
            icon={<CourierIcon />} 
            label="Couriers" 
            iconPosition="start"
          />
          <Tab 
            icon={<TrackingIcon />} 
            label="Tracking Page" 
            iconPosition="start"
          />
          <Tab 
            icon={<RatingIcon />} 
            label="Rating Settings" 
            iconPosition="start"
          />
          <Tab 
            icon={<EmailIcon />} 
            label="Email Templates" 
            iconPosition="start"
          />
          <Tab 
            icon={<ReturnIcon />} 
            label="Returns" 
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
            disabled={tier < 2} // Professional+ feature
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
        <ShopsSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <CouriersSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TrackingPageSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <RatingSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <EmailTemplatesSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <ReturnsSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <PaymentSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <NotificationSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        <APISettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <GeneralSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={10}>
        <SecuritySettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>

      <TabPanel value={tabValue} index={11}>
        <PreferencesSettings subscriptionInfo={subscriptionInfo} />
      </TabPanel>
    </Container>
  );
};

export default MerchantSettings;
