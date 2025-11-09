/**
 * Public Header Component
 * Week 2 Day 4 - Public Pages Navigation
 * 
 * Unified header for all public pages (landing, subscription plans, knowledge base, etc.)
 * Updated: November 9, 2025 - Matches landing page navigation
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        bgcolor: 'white', 
        color: 'text.primary',
        boxShadow: 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          <img 
            src="/logo.png" 
            alt="Performile" 
            style={{ height: 40, marginRight: 12 }} 
          />
        </Box>

        {/* Navigation */}
        <Stack direction="row" spacing={2} alignItems="center">
          <Button 
            color="inherit" 
            onClick={() => navigate('/subscription/plans')}
          >
            Pricing
          </Button>
          <Button 
            color="inherit" 
            onClick={() => navigate('/knowledge-base')}
          >
            Knowledge Base
          </Button>
          {!user ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
              <Button 
                variant="contained" 
                onClick={() => navigate('/my-subscription')}
              >
                My Subscription
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default PublicHeader;
