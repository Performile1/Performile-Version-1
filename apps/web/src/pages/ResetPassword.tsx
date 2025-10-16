import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  LinearProgress,
  Container,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  CheckCircle,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing reset token');
        setValidatingToken(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        if (response.ok) {
          setTokenValid(true);
        } else {
          setError('This reset link has expired or is invalid');
        }
      } catch (error) {
        setError('Failed to validate reset token');
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Password is too weak. Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to reset password');
      }
    } catch (error) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Validating reset link...
            </Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!tokenValid) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', m: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Alert severity="error">
              <Typography variant="body1" gutterBottom>
                {error || 'Invalid or expired reset link'}
              </Typography>
              <Typography variant="body2">
                Please request a new password reset link.
              </Typography>
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/auth')}
              sx={{ mt: 3 }}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

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
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Lock sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4">Reset Password</Typography>
            </Box>

            {success ? (
              <Alert severity="success">
                <Typography variant="body1" gutterBottom>
                  Password reset successful!
                </Typography>
                <Typography variant="body2">
                  Redirecting you to login...
                </Typography>
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Please enter your new password
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                      disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
                      fullWidth
                    >
                      {loading ? 'Resetting Password...' : 'Reset Password'}
                    </Button>

                    <Button
                      variant="text"
                      onClick={() => navigate('/auth')}
                      fullWidth
                    >
                      Back to Login
                    </Button>
                  </Box>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ResetPassword;
