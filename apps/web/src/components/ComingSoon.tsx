import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Construction, ArrowBack } from '@mui/icons-material';

interface ComingSoonProps {
  featureName: string;
  description?: string;
  estimatedDate?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  featureName,
  description,
  estimatedDate
}) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: 2,
            maxWidth: 600,
            width: '100%'
          }}
        >
          <Construction 
            sx={{ 
              fontSize: 80, 
              color: 'primary.main',
              mb: 3
            }} 
          />
          
          <Typography variant="h3" gutterBottom fontWeight={600}>
            {featureName}
          </Typography>
          
          <Typography 
            variant="h5" 
            color="text.secondary"
            gutterBottom
            sx={{ mb: 3 }}
          >
            Coming Soon
          </Typography>
          
          {description && (
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.7 }}
            >
              {description}
            </Typography>
          )}
          
          {estimatedDate && (
            <Typography 
              variant="body2" 
              color="primary.main"
              fontWeight={500}
              sx={{ mb: 4 }}
            >
              📅 Estimated Launch: {estimatedDate}
            </Typography>
          )}
          
          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default ComingSoon;
