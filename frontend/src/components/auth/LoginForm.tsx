import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { LoginCredentials } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
});

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      const success = await login(data);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Login failed. Please try again.',
      });
    }
  };

  const handleForgotPassword = async () => {
    setResetError('');
    
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }

    setSendingReset(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (response.ok) {
        setResetSent(true);
      } else {
        const data = await response.json();
        setResetError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      setResetError('Failed to send reset email. Please try again.');
    } finally {
      setSendingReset(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
    setResetError('');
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Logo and Brand */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Performile Logo"
            sx={{
              width: 100,
              height: 100,
              mb: 2,
              objectFit: 'contain',
            }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              mb: 1,
            }}
          >
            Performile
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ fontStyle: 'italic', mb: 2 }}
          >
            Elevate Every Delivery
          </Typography>
        </Box>

        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 1 }}>
          Sign In
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Welcome back to your dashboard
        </Typography>

        {errors.root && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.root.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('email')}
            fullWidth
            label="Email Address"
            type="email"
            autoComplete="email"
            autoFocus
            error={!!errors.email}
            helperText={errors.email?.message}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            {...register('password')}
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => setShowForgotPassword(true)}
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onSwitchToRegister}
              sx={{ textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </Box>
        </Box>
      </CardContent>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onClose={handleCloseForgotPassword} maxWidth="sm" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetSent ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Password reset instructions have been sent to <strong>{resetEmail}</strong>.
                Please check your inbox and follow the link to reset your password.
              </Typography>
            </Alert>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                Enter your email address and we'll send you instructions to reset your password.
              </Typography>
              
              {resetError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseForgotPassword}>
            {resetSent ? 'Close' : 'Cancel'}
          </Button>
          {!resetSent && (
            <Button 
              variant="contained" 
              onClick={handleForgotPassword}
              disabled={sendingReset}
            >
              {sendingReset ? 'Sending...' : 'Send Reset Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  );
};
