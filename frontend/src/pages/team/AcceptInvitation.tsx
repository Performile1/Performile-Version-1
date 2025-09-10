import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { CheckCircle, Error, Business, LocalShipping } from '@mui/icons-material';
import { useAcceptInvitation } from '@/hooks/useTeamApi';

export const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  const acceptInvitationMutation = useAcceptInvitation();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    // Decode invitation token to show details (in a real app, you'd validate this server-side)
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setInvitationDetails(decoded);
    } catch (error) {
      console.error('Failed to decode invitation token:', error);
    }
  }, [token]);

  const handleAcceptInvitation = async () => {
    if (!token) return;

    try {
      await acceptInvitationMutation.mutateAsync(token);
      setStatus('success');
      
      // Redirect to team management after 3 seconds
      setTimeout(() => {
        navigate('/team');
      }, 3000);
    } catch (error) {
      setStatus('error');
    }
  };

  const handleDecline = () => {
    navigate('/dashboard');
  };

  if (status === 'loading') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading invitation details...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (status === 'success') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Welcome to the Team!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                You have successfully joined the team. You will be redirected to the team management page shortly.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/team')}
                sx={{ mt: 2 }}
              >
                Go to Team Management
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (status === 'error' || status === 'expired') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 8 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Error color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                {status === 'expired' ? 'Invitation Expired' : 'Invalid Invitation'}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {status === 'expired' 
                  ? 'This invitation has expired. Please request a new invitation from your team administrator.'
                  : 'This invitation link is invalid or has already been used.'
                }
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                sx={{ mt: 2 }}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {invitationDetails?.entityType === 'courier' ? (
                <LocalShipping color="primary" sx={{ fontSize: 64 }} />
              ) : (
                <Business color="primary" sx={{ fontSize: 64 }} />
              )}
            </Box>

            <Typography variant="h4" align="center" gutterBottom>
              Team Invitation
            </Typography>

            <Typography variant="body1" align="center" color="text.secondary" paragraph>
              You've been invited to join a team on Performile
            </Typography>

            {invitationDetails && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Entity:</strong> {invitationDetails.entityName || 'Team'}<br />
                  <strong>Type:</strong> {invitationDetails.entityType === 'courier' ? 'Courier Company' : 'Store'}<br />
                  <strong>Role:</strong> {invitationDetails.teamRole?.charAt(0).toUpperCase() + invitationDetails.teamRole?.slice(1)}<br />
                  <strong>Invited by:</strong> {invitationDetails.invitedByName || 'Team Administrator'}
                </Typography>
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" align="center" paragraph>
              By accepting this invitation, you will gain access to the team's resources and be able to collaborate with other team members.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={handleDecline}
                disabled={acceptInvitationMutation.isPending}
              >
                Decline
              </Button>
              <Button
                variant="contained"
                onClick={handleAcceptInvitation}
                disabled={acceptInvitationMutation.isPending}
                startIcon={acceptInvitationMutation.isPending ? <CircularProgress size={20} /> : null}
              >
                {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};
