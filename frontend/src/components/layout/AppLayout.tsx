import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Avatar,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Menu as MenuIcon,
  Dashboard,
  Assessment,
  LocalShipping,
  MyLocation,
  Gavel,
  People,
  Group,
  Settings,
  Logout,
  AccountCircle,
  Search,
  Message,
  Business,
  DirectionsCar,
  Star,
  Subscriptions,
  Email,
  ShoppingCart,
  CreditCard,
  ShoppingBag,
  RateReview,
  Storefront,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { NavigationMenu } from './NavigationMenu';
import GlobalSearch from '@/components/common/GlobalSearch';
import NotificationSystem from '@/components/common/NotificationSystem';

const DRAWER_WIDTH = 280;

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: Dashboard,
      roles: ['admin', 'merchant', 'courier', 'consumer'],
    },
    {
      label: 'Trust Scores',
      path: '/trustscores',
      icon: Assessment,
      roles: ['admin', 'merchant', 'consumer'], // Removed 'courier'
    },
    {
      label: 'Orders',
      path: '/orders',
      icon: LocalShipping,
      roles: ['admin', 'merchant', 'courier', 'consumer'],
    },
    {
      label: 'Track Shipment',
      path: '/tracking',
      icon: MyLocation,
      roles: ['admin', 'merchant', 'courier', 'consumer'],
    },
    {
      label: 'Claims',
      path: '/claims',
      icon: Gavel,
      roles: ['admin', 'merchant'],
    },
    {
      label: 'Users',
      path: '/users',
      icon: People,
      roles: ['admin'],
    },
    {
      label: 'Manage Merchants',
      path: '/admin/merchants',
      icon: Business,
      roles: ['admin'],
    },
    {
      label: 'Manage Couriers',
      path: '/admin/couriers',
      icon: DirectionsCar,
      roles: ['admin'],
    },
    {
      label: 'Review Builder',
      path: '/admin/reviews',
      icon: Star,
      roles: ['admin'],
    },
    {
      label: 'Subscriptions',
      path: '/admin/subscriptions',
      icon: Subscriptions,
      roles: ['admin'],
    },
    {
      label: 'Team',
      path: '/team',
      icon: Group,
      roles: ['admin', 'merchant', 'courier'],
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: Assessment,
      roles: ['admin', 'merchant', 'courier'],
    },
    {
      label: 'E-commerce',
      path: '/integrations/ecommerce',
      icon: ShoppingCart,
      roles: ['admin', 'merchant'],
    },
    {
      label: 'Email Templates',
      path: '/settings/email-templates',
      icon: Email,
      roles: ['admin', 'merchant'],
    },
    {
      label: 'Courier Preferences',
      path: '/settings/courier-preferences',
      icon: DirectionsCar,
      roles: ['merchant'],
    },
    {
      label: 'My Subscription',
      path: '/subscription',
      icon: CreditCard,
      roles: ['merchant', 'courier'],
    },
    {
      label: 'Courier Directory',
      path: '/courier-directory',
      icon: DirectionsCar,
      roles: ['merchant'],
    },
    {
      label: 'Checkout Analytics',
      path: '/courier/checkout-analytics',
      icon: Storefront,
      roles: ['courier', 'admin'],
    },
    {
      label: 'Checkout Analytics',
      path: '/merchant/checkout-analytics',
      icon: Storefront,
      roles: ['merchant', 'admin'],
    },
    {
      label: 'Marketplace',
      path: '/marketplace',
      icon: ShoppingBag,
      roles: ['courier'],
    },
    {
      label: 'My Reviews',
      path: '/my-reviews',
      icon: RateReview,
      roles: ['consumer'],
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['admin', 'merchant', 'courier', 'consumer'],
    },
  ];

  const drawer = (
    <Box sx={{ height: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2, bgcolor: 'white' }}>
        <Box
          component="img"
          src="/logo.png"
          alt="Performile Logo"
          sx={{
            height: 40,
            width: 40,
            objectFit: 'contain',
          }}
        />
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: '#333' }}>
          Performile
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'transparent' }} />
      <Box sx={{ bgcolor: '#667eea', height: 'calc(100% - 64px)' }}>
        <NavigationMenu
          items={navigationItems}
          currentPath={location.pathname}
          userRole={user?.user_role || 'consumer'}
          onItemClick={() => isMobile && setMobileOpen(false)}
        />
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'white',
          color: '#666',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: '#666' }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#333' }}>
            {navigationItems.find(item => item.path === location.pathname)?.label || 'Performile'}
          </Typography>

          {/* Global Search - Desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, mr: 2, maxWidth: 400, flexGrow: 1 }}>
            <GlobalSearch 
              placeholder="Search orders, couriers, stores..."
              onClose={() => setSearchOpen(false)}
              autoFocus={false}
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Search Icon - Mobile */}
            <IconButton
              onClick={() => setSearchOpen(true)}
              sx={{ display: { xs: 'flex', md: 'none' }, color: '#666' }}
            >
              <Search />
            </IconButton>

            {/* Messages Icon */}
            <IconButton
              onClick={() => navigate('/messages')}
              sx={{ 
                display: { xs: 'none', sm: 'flex' }, 
                color: '#666',
                '&:hover': { color: '#667eea' }
              }}
            >
              <Message />
            </IconButton>

            {/* Notification System */}
            <NotificationSystem maxVisible={50} />

            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: '#666' }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              sx={{ color: '#666' }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: '#667eea' }}>
                {user?.first_name?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Search Modal */}
      {searchOpen && isMobile && (
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
              autoFocus={true}
              placeholder="Search orders, couriers, stores..."
            />
          </Box>
        </Box>
      )}

      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <Avatar />
          Profile
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <Settings fontSize="small" sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <Logout fontSize="small" sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="navigation menu"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};
