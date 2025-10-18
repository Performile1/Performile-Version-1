import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { LockOutlined, Login } from '@mui/icons-material';

interface NotLoggedInModalProps {
  isOpen: boolean;
  onClose?: () => void;
  message?: string;
}

export const NotLoggedInModal: React.FC<NotLoggedInModalProps> = ({
  isOpen,
  onClose,
  message = 'You need to be logged in to access this page.',
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose?.();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose?.();
    navigate('/register');
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Card
        sx={{
          maxWidth: 450,
          width: '90%',
          mx: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3} alignItems="center">
            {/* Icon */}
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockOutlined sx={{ fontSize: 40, color: 'white' }} />
            </Box>

            {/* Title */}
            <Typography
              variant="h5"
              component="h2"
              textAlign="center"
              fontWeight="bold"
              color="text.primary"
            >
              Authentication Required
            </Typography>

            {/* Message */}
            <Typography
              variant="body1"
              textAlign="center"
              color="text.secondary"
              sx={{ px: 2 }}
            >
              {message}
            </Typography>

            {/* Actions */}
            <Stack spacing={2} sx={{ width: '100%', mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<Login />}
                onClick={handleLogin}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                  },
                }}
              >
                Log In
              </Button>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleRegister}
                sx={{
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5568d3',
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  },
                }}
              >
                Create Account
              </Button>
            </Stack>

            {/* Info */}
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                <strong>Note:</strong> Your session may have expired or you haven't logged in yet.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotLoggedInModal;
