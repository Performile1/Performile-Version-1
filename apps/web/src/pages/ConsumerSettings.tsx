import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  Person as ProfileIcon,
  LocationOn as AddressIcon,
  Payment as PaymentIcon,
  ShoppingBag as OrdersIcon,
  Favorite as FavoritesIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Language as LanguageIcon,
  PrivacyTip as PrivacyIcon,
} from '@mui/icons-material';

// Import sub-components
// TODO: Create these components
// import { ConsumerProfileSettings } from '@/components/settings/consumer/ConsumerProfileSettings';
// import { ConsumerAddressSettings } from '@/components/settings/consumer/ConsumerAddressSettings';
// import { ConsumerPaymentSettings } from '@/components/settings/consumer/ConsumerPaymentSettings';
// import { ConsumerOrderSettings } from '@/components/settings/consumer/ConsumerOrderSettings';
// import { ConsumerFavoritesSettings } from '@/components/settings/consumer/ConsumerFavoritesSettings';
// import { ConsumerNotificationSettings } from '@/components/settings/consumer/ConsumerNotificationSettings';
// import { ConsumerSecuritySettings } from '@/components/settings/consumer/ConsumerSecuritySettings';
// import { ConsumerPrivacySettings } from '@/components/settings/consumer/ConsumerPrivacySettings';
// import { ConsumerPreferencesSettings } from '@/components/settings/consumer/ConsumerPreferencesSettings';

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
      id={`consumer-settings-tabpanel-${index}`}
      aria-labelledby={`consumer-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ConsumerSettings: React.FC = () => {
  const { user: _user } = useAuthStore(); // Prefix with _ to indicate intentionally unused
  const [tabValue, setTabValue] = useState(0);

  // Get tab from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const tabMap: Record<string, number> = {
      'profile': 0,
      'addresses': 1,
      'payment': 2,
      'orders': 3,
      'favorites': 4,
      'notifications': 5,
      'security': 6,
      'privacy': 7,
      'preferences': 8,
    };
    
    if (hash && tabMap[hash] !== undefined) {
      setTabValue(tabMap[hash]);
    }
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update URL hash
    const tabNames = [
      'profile', 'addresses', 'payment', 'orders', 'favorites',
      'notifications', 'security', 'privacy', 'preferences'
    ];
    window.location.hash = tabNames[newValue];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Account Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your profile, addresses, payment methods, and preferences
        </Typography>
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
            icon={<ProfileIcon />} 
            label="Profile" 
            iconPosition="start"
          />
          <Tab 
            icon={<AddressIcon />} 
            label="Addresses" 
            iconPosition="start"
          />
          <Tab 
            icon={<PaymentIcon />} 
            label="Payment Methods" 
            iconPosition="start"
          />
          <Tab 
            icon={<OrdersIcon />} 
            label="Order Preferences" 
            iconPosition="start"
          />
          <Tab 
            icon={<FavoritesIcon />} 
            label="Favorites" 
            iconPosition="start"
          />
          <Tab 
            icon={<NotificationIcon />} 
            label="Notifications" 
            iconPosition="start"
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="Security" 
            iconPosition="start"
          />
          <Tab 
            icon={<PrivacyIcon />} 
            label="Privacy" 
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
        <Typography>Profile Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography>Address Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography>Payment Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography>Order Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Typography>Favorites Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <Typography>Notification Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <Typography>Security Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <Typography>Privacy Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        <Typography>Preferences Settings - Coming Soon</Typography>
      </TabPanel>
    </Container>
  );
};

export default ConsumerSettings;
