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
  Dashboard as PlatformIcon,
  People as UsersIcon,
  Business as MerchantsIcon,
  LocalShipping as CouriersIcon,
  AttachMoney as SubscriptionsIcon,
  Assessment as AnalyticsIcon,
  Email as EmailIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
  Storage as DatabaseIcon,
  Settings as SystemIcon,
  BugReport as LogsIcon,
} from '@mui/icons-material';

// Import Week 4 Service Analytics
import ServiceAnalytics from './admin/ServiceAnalytics';

// Import sub-components
import { AdminSubscriptionsSettings } from '../components/settings/admin/AdminSubscriptionsSettings';
// TODO: Create these components
// import { AdminPlatformSettings } from '@/components/settings/admin/AdminPlatformSettings';
// import { AdminUsersSettings } from '@/components/settings/admin/AdminUsersSettings';
// import { AdminMerchantsSettings } from '@/components/settings/admin/AdminMerchantsSettings';
// import { AdminCouriersSettings } from '@/components/settings/admin/AdminCouriersSettings';
// import { AdminAnalyticsSettings } from '@/components/settings/admin/AdminAnalyticsSettings';
// import { AdminEmailSettings } from '@/components/settings/admin/AdminEmailSettings';
// import { AdminNotificationSettings } from '@/components/settings/admin/AdminNotificationSettings';
// import { AdminSecuritySettings } from '@/components/settings/admin/AdminSecuritySettings';
// import { AdminDatabaseSettings } from '@/components/settings/admin/AdminDatabaseSettings';
// import { AdminSystemSettings } from '@/components/settings/admin/AdminSystemSettings';
// import { AdminLogsSettings } from '@/components/settings/admin/AdminLogsSettings';

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
      id={`admin-settings-tabpanel-${index}`}
      aria-labelledby={`admin-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminSettings: React.FC = () => {
  const { user: _user } = useAuthStore(); // Prefix with _ to indicate intentionally unused
  const [tabValue, setTabValue] = useState(0);
  const [platformStats, setPlatformStats] = useState<any>(null);

  // Get tab from URL hash if present
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const tabMap: Record<string, number> = {
      'platform': 0,
      'users': 1,
      'merchants': 2,
      'couriers': 3,
      'subscriptions': 4,
      'analytics': 5,
      'email': 6,
      'notifications': 7,
      'security': 8,
      'database': 9,
      'system': 10,
      'logs': 11,
    };
    
    if (hash && tabMap[hash] !== undefined) {
      setTabValue(tabMap[hash]);
    }
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update URL hash
    const tabNames = [
      'platform', 'users', 'merchants', 'couriers', 'subscriptions', 'analytics',
      'email', 'notifications', 'security', 'database', 'system', 'logs'
    ];
    window.location.hash = tabNames[newValue];
  };

  // Fetch platform stats
  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/platform-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setPlatformStats(data.stats);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  };

  const totalUsers = platformStats?.total_users || 0;
  const totalMerchants = platformStats?.total_merchants || 0;
  const totalCouriers = platformStats?.total_couriers || 0;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom>
              Admin Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Platform administration and system configuration
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={`${totalUsers} Users`} color="primary" />
            <Chip label={`${totalMerchants} Merchants`} color="secondary" />
            <Chip label={`${totalCouriers} Couriers`} color="success" />
          </Box>
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
            icon={<PlatformIcon />} 
            label="Platform Overview" 
            iconPosition="start"
          />
          <Tab 
            icon={<UsersIcon />} 
            label="User Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<MerchantsIcon />} 
            label="Merchant Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<CouriersIcon />} 
            label="Courier Management" 
            iconPosition="start"
          />
          <Tab 
            icon={<SubscriptionsIcon />} 
            label="Subscriptions & Billing" 
            iconPosition="start"
          />
          <Tab 
            icon={<AnalyticsIcon />} 
            label="Platform Analytics" 
            iconPosition="start"
          />
          <Tab 
            icon={<EmailIcon />} 
            label="Email System" 
            iconPosition="start"
          />
          <Tab 
            icon={<NotificationIcon />} 
            label="Notifications" 
            iconPosition="start"
          />
          <Tab 
            icon={<SecurityIcon />} 
            label="Security & Access" 
            iconPosition="start"
          />
          <Tab 
            icon={<DatabaseIcon />} 
            label="Database" 
            iconPosition="start"
          />
          <Tab 
            icon={<SystemIcon />} 
            label="System Settings" 
            iconPosition="start"
          />
          <Tab 
            icon={<LogsIcon />} 
            label="Logs & Monitoring" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <Typography>Platform Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography>Users Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography>Merchants Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography>Couriers Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <AdminSubscriptionsSettings platformStats={platformStats} />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <ServiceAnalytics />
      </TabPanel>

      <TabPanel value={tabValue} index={6}>
        <Typography>Email Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={7}>
        <Typography>Notification Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={8}>
        <Typography>Security Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={9}>
        <Typography>Database Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={10}>
        <Typography>System Settings - Coming Soon</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={11}>
        <Typography>Logs Settings - Coming Soon</Typography>
      </TabPanel>
    </Container>
  );
};

export default AdminSettings;
