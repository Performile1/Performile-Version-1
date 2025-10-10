import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  // Password strength calculator
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strengths: PasswordStrength[] = [
      { score: 0, label: 'Very Weak', color: '#f44336' },
      { score: 1, label: 'Weak', color: '#ff9800' },
      { score: 2, label: 'Fair', color: '#ffc107' },
      { score: 3, label: 'Good', color: '#8bc34a' },
      { score: 4, label: 'Strong', color: '#4caf50' },
      { score: 5, label: 'Very Strong', color: '#2e7d32' },
    ];

    return strengths[score];
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiClient.put('/auth/change-password', data);
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to change password';
      setError(message);
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Please choose a stronger password');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const isFormValid = 
    currentPassword && 
    newPassword && 
    confirmPassword && 
    newPassword === confirmPassword &&
    newPassword.length >= 8 &&
    passwordStrength.score >= 2;

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Lock sx={{ fontSize: 24 }} />
          <Typography variant="h5">Change Password</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Keep your account secure by using a strong, unique password
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Current Password */}
            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* New Password */}
            <Box>
              <TextField
                fullWidth
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                helperText="At least 8 characters with uppercase, lowercase, numbers, and symbols"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <Box sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Password Strength:
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ color: passwordStrength.color, fontWeight: 'bold' }}
                    >
                      {passwordStrength.label}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(passwordStrength.score / 5) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: passwordStrength.color,
                      },
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Confirm Password */}
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={confirmPassword !== '' && newPassword !== confirmPassword}
              helperText={
                confirmPassword !== '' && newPassword !== confirmPassword
                  ? 'Passwords do not match'
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Requirements */}
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Password Requirements:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {[
                  { met: newPassword.length >= 8, text: 'At least 8 characters' },
                  { met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword), text: 'Uppercase and lowercase letters' },
                  { met: /\d/.test(newPassword), text: 'At least one number' },
                  { met: /[^a-zA-Z0-9]/.test(newPassword), text: 'At least one special character' },
                ].map((req, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle 
                      sx={{ 
                        fontSize: 16, 
                        color: req.met ? 'success.main' : 'text.disabled' 
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ color: req.met ? 'text.primary' : 'text.secondary' }}
                    >
                      {req.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!isFormValid || changePasswordMutation.isPending}
              sx={{ mt: 1 }}
            >
              {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
