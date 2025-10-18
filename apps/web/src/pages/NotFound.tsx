import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
} from '@mui/material';
import { SearchOff, Home, ArrowBack } from '@mui/icons-material';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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
        <Card
          sx={{
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center">
              {/* 404 Icon */}
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SearchOff sx={{ fontSize: 50, color: 'white' }} />
              </Box>

              {/* 404 Text */}
              <Typography
                variant="h1"
                component="h1"
                fontWeight="bold"
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '4rem', sm: '6rem' },
                }}
              >
                404
              </Typography>

              {/* Title */}
              <Typography
                variant="h4"
                component="h2"
                textAlign="center"
                fontWeight="bold"
                color="text.primary"
              >
                Page Not Found
              </Typography>

              {/* Message */}
              <Typography
                variant="body1"
                textAlign="center"
                color="text.secondary"
                sx={{ px: 2 }}
              >
                The page you're looking for doesn't exist or has been moved.
              </Typography>

              {/* Actions */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ width: '100%', mt: 2 }}
              >
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<Home />}
                  onClick={handleGoHome}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
                    },
                  }}
                >
                  Go Home
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<ArrowBack />}
                  onClick={handleGoBack}
                  sx={{
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5568d3',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                  }}
                >
                  Go Back
                </Button>
              </Stack>

              {/* Help Text */}
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
                  If you believe this is an error, please contact support.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default NotFound;
