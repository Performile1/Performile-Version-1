import React, { useState } from 'react';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Typography,
  Divider,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  Receipt,
  LocalShipping,
  Store,
  Analytics,
  Person,
  Menu,
  Close,
  Logout,
  Settings,
  Help,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import GlobalSearch from '@/components/common/GlobalSearch';

interface MobileNavigationProps {
}

const MobileNavigation: React.FC<MobileNavigationProps> = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout } = useAuthStore();

  // Bottom navigation items based on user role
  const getBottomNavItems = () => {
    const commonItems = [
      { label: 'Dashboard', value: '/dashboard', icon: <Dashboard /> },
      { label: 'Orders', value: '/orders', icon: <Receipt /> },
    ];

    switch (user?.user_role) {
      case 'admin':
        return [
          ...commonItems,
          { label: 'Couriers', value: '/trustscores', icon: <LocalShipping /> },
          { label: 'Analytics', value: '/analytics', icon: <Analytics /> },
        ];
      case 'merchant':
        return [
          ...commonItems,
          { label: 'Stores', value: '/stores', icon: <Store /> },
          { label: 'Analytics', value: '/analytics', icon: <Analytics /> },
        ];
      case 'courier':
        return [
          ...commonItems,
          { label: 'Profile', value: '/profile', icon: <Person /> },
          { label: 'Analytics', value: '/analytics', icon: <Analytics /> },
        ];
      default:
        return commonItems;
    }
  };

  // Drawer menu items
  const getDrawerItems = () => {
    const items = [
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
      { label: 'Orders', path: '/orders', icon: <Receipt /> },
    ];

    switch (user?.user_role) {
      case 'admin':
        items.push(
          { label: 'Trust Scores', path: '/trustscores', icon: <LocalShipping /> },
          { label: 'Analytics', path: '/analytics', icon: <Analytics /> },
          { label: 'Users', path: '/users', icon: <Person /> },
          { label: 'Stores', path: '/stores', icon: <Store /> }
        );
        break;
      case 'merchant':
        items.push(
          { label: 'My Stores', path: '/stores', icon: <Store /> },
          { label: 'Analytics', path: '/analytics', icon: <Analytics /> },
          { label: 'Profile', path: '/profile', icon: <Person /> }
        );
        break;
      case 'courier':
        items.push(
          { label: 'My Profile', path: '/profile', icon: <Person /> },
          { label: 'Analytics', path: '/analytics', icon: <Analytics /> }
        );
        break;
    }

    return items;
  };

  const handleBottomNavChange = (_: React.SyntheticEvent, newValue: string) => {
    navigate(newValue);
  };

  const handleDrawerItemClick = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setDrawerOpen(false);
  };

  const getCurrentValue = () => {
    const bottomNavItems = getBottomNavItems();
    const currentItem = bottomNavItems.find(item => 
      location.pathname.startsWith(item.value)
    );
    return currentItem?.value || '/dashboard';
  };

  if (!isMobile) {
    return null; // Only show on mobile
  }

  return (
    <>
      {/* Top Mobile Header */}
      <Paper
        elevation={1}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          sx={{ mr: 1 }}
        >
          <Menu />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Performile
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            onClick={() => setSearchOpen(true)}
            size="small"
          >
            <Dashboard />
          </IconButton>

          <Avatar
            sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
            onClick={() => setDrawerOpen(true)}
          >
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
        </Box>
      </Paper>

      {/* Global Search Modal */}
      {searchOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            zIndex: theme.zIndex.modal,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            pt: 8,
            px: 2,
          }}
          onClick={() => setSearchOpen(false)}
        >
          <Box
            sx={{ width: '100%', maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlobalSearch
              onClose={() => setSearchOpen(false)}
              autoFocus
              placeholder="Search orders, couriers, stores..."
            />
          </Box>
        </Box>
      )}

      {/* Side Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: 'background.paper',
          },
        }}
      >
        {/* Drawer Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" noWrap>
                {user?.first_name} {user?.last_name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {user?.user_role}
              </Typography>
            </Box>
          </Box>
          <IconButton
            color="inherit"
            onClick={() => setDrawerOpen(false)}
            size="small"
          >
            <Close />
          </IconButton>
        </Box>

        {/* Navigation Items */}
        <List sx={{ flexGrow: 1 }}>
          {getDrawerItems().map((item) => (
            <ListItem
              key={item.path}
              button
              onClick={() => handleDrawerItemClick(item.path)}
              selected={location.pathname.startsWith(item.path)}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>

        <Divider />

        {/* Bottom Actions */}
        <List>
          <ListItem button onClick={() => handleDrawerItemClick('/settings')}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button onClick={() => handleDrawerItemClick('/help')}>
            <ListItemIcon>
              <Help />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItem>
          <ListItem button onClick={handleLogout}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          display: { xs: 'block', md: 'none' },
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getCurrentValue()}
          onChange={handleBottomNavChange}
          showLabels
          sx={{
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          {getBottomNavItems().map((item) => (
            <BottomNavigationAction
              key={item.value}
              label={item.label}
              value={item.value}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>

      {/* Spacer for fixed positioning */}
      <Box sx={{ height: { xs: 56, md: 0 }, display: { xs: 'block', md: 'none' } }} />
      <Box sx={{ height: { xs: 56, md: 0 }, display: { xs: 'block', md: 'none' } }} />
    </>
  );
};

export default MobileNavigation;
