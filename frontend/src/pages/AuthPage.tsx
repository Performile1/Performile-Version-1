import React, { useState, useEffect } from 'react';
import { Box, Container, Fade } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { EnhancedRegisterFormV2 } from '@/components/auth/EnhancedRegisterFormV2';

export const AuthPage: React.FC = () => {
  const location = useLocation();
  // Check if we're on the login page (default to login if not on /register)
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Update form based on current path
    setIsLogin(location.pathname !== '/register');
  }, [location.pathname]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Box>
            {isLogin ? (
              <LoginForm onSwitchToRegister={() => navigate('/register')} />
            ) : (
              <EnhancedRegisterFormV2 onSwitchToLogin={() => navigate('/login')} />
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};
