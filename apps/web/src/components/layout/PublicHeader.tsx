/**
 * Public Header Component
 * Week 2 Day 4 - Public Pages Navigation
 * 
 * Simple header for public pages (subscription plans, landing, etc.)
 * Created: November 6, 2025
 */

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        background: 'transparent',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
          {/* Logo */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/')}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                letterSpacing: '-0.5px'
              }}
            >
              Performile
            </Typography>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {!user ? (
              <>
                <Button
                  color="inherit"
                  onClick={() => navigate('/subscription-plans')}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Pricing
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{ 
                    background: 'white',
                    color: '#667eea',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Get Started
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  onClick={() => navigate('/dashboard')}
                  sx={{ 
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/my-subscription')}
                  sx={{ 
                    background: 'white',
                    color: '#667eea',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  My Subscription
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default PublicHeader;
