import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { PASSWORD_REQUIREMENTS } from './types';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = React.useMemo(() => {
    if (!password) return { score: 0, message: '', color: 'error' };
    
    const requirements = {
      minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const total = Object.keys(requirements).length;
    const percentage = (score / total) * 100;

    let message = '';
    let color: 'error' | 'warning' | 'info' | 'success' = 'error';

    if (score <= 1) {
      message = 'Very Weak';
      color = 'error';
    } else if (score <= 2) {
      message = 'Weak';
      color = 'error';
    } else if (score <= 3) {
      message = 'Fair';
      color = 'warning';
    } else if (score < total) {
      message = 'Good';
      color = 'info';
    } else {
      message = 'Strong';
      color = 'success';
    }

    return { score, message, color, percentage };
  }, [password]);

  if (!password) return null;

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password Strength: {strength.message}
        </Typography>
        <Typography variant="caption" color={`${strength.color}.main`}>
          {Math.round(strength.percentage || 0)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength.percentage || 0}
        color={strength.color as any}
        sx={{
          height: 4,
          borderRadius: 2,
          '& .MuiLinearProgress-bar': {
            transition: 'transform 0.2s ease-in-out',
          },
        }}
      />
      <Box sx={{ mt: 1, mb: 2 }}>
        <Typography variant="caption" color="text.secondary" component="div">
          Your password should contain:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 0.5, mb: 0 }}>
          <Typography component="li" variant="caption" color={password.length >= PASSWORD_REQUIREMENTS.minLength ? 'success.main' : 'text.secondary'}>
            At least {PASSWORD_REQUIREMENTS.minLength} characters
          </Typography>
          <Typography component="li" variant="caption" color={/[A-Z]/.test(password) ? 'success.main' : 'text.secondary'}>
            At least one uppercase letter
          </Typography>
          <Typography component="li" variant="caption" color={/[a-z]/.test(password) ? 'success.main' : 'text.secondary'}>
            At least one lowercase letter
          </Typography>
          <Typography component="li" variant="caption" color={/\d/.test(password) ? 'success.main' : 'text.secondary'}>
            At least one number
          </Typography>
          <Typography 
            component="li" 
            variant="caption" 
            color={new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password) 
              ? 'success.main' 
              : 'text.secondary'}
          >
            At least one special character (!@#$%^&* etc.)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
