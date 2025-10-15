import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import {
  Add,
  Visibility,
  Send,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/apiClient';

const claimTypes = [
  { value: 'damaged', label: 'Package Damaged' },
  { value: 'lost', label: 'Package Lost' },
  { value: 'delayed', label: 'Delayed Delivery' },
  { value: 'missing_items', label: 'Missing Items' },
  { value: 'wrong_delivery', label: 'Wrong Delivery Address' },
  { value: 'other', label: 'Other' },
];

const statusColors: Record<string, string> = {
  draft: '#9e9e9e',
  submitted: '#2196f3',
  under_review: '#ff9800',
  approved: '#4caf50',
  rejected: '#f44336',
  paid: '#00c853',
  closed: '#757575',
};

export const ClaimsPage: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    tracking_number: '',
    courier: '',
    claim_type: 'damaged',
    incident_date: new Date().toISOString().split('T')[0],
    incident_description: '',
    incident_location: '',
    claimed_amount: '',
    declared_value: '',
  });

  // Fetch claims
  const { data: claimsData, isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const response = await axios.get('/api/claims');
      return response.data.data;
    },
  });

  // Create claim mutation
  const createClaimMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/api/claims', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      setOpenDialog(false);
      resetForm();
      toast.success('Claim created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create claim');
    },
  });

  // Submit claim mutation
  const submitClaimMutation = useMutation({
    mutationFn: async (claim_id: string) => {
      const response = await axios.post('/api/claims/submit', { claim_id });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast.success('Claim submitted to courier');
      if (data.instructions) {
        toast(data.instructions, { duration: 5000 });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit claim');
    },
  });

  const resetForm = () => {
    setFormData({
      tracking_number: '',
      courier: '',
      claim_type: 'damaged',
      incident_date: new Date().toISOString().split('T')[0],
      incident_description: '',
      incident_location: '',
      claimed_amount: '',
      declared_value: '',
    });
  };

  const handleSubmit = () => {
    createClaimMutation.mutate({
      ...formData,
      claimed_amount: parseFloat(formData.claimed_amount),
      declared_value: formData.declared_value ? parseFloat(formData.declared_value) : undefined,
    });
  };

  const handleViewClaim = (claim: any) => {
    setSelectedClaim(claim);
    setViewDialog(true);
  };

  const handleSubmitClaim = (claim_id: string) => {
    if (confirm('Are you sure you want to submit this claim to the courier?')) {
      submitClaimMutation.mutate(claim_id);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Claims Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          File New Claim
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Claims
              </Typography>
              <Typography variant="h4">
                {claimsData?.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4">
                {claimsData?.filter((c: any) => ['submitted', 'under_review'].includes(c.claim_status)).length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4">
                {claimsData?.filter((c: any) => c.claim_status === 'approved').length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Claimed
              </Typography>
              <Typography variant="h4">
                ${claimsData?.reduce((sum: number, c: any) => sum + (c.claimed_amount || 0), 0).toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Claims Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Claim #</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Courier</TableCell>
                <TableCell>Tracking</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">Loading...</TableCell>
                </TableRow>
              ) : claimsData?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No claims found. File your first claim to get started.
                  </TableCell>
                </TableRow>
              ) : (
                claimsData?.map((claim: any) => (
                  <TableRow key={claim.claim_id} hover>
                    <TableCell>{claim.claim_number || claim.claim_id.slice(0, 8)}</TableCell>
                    <TableCell>{claim.claim_type.replace('_', ' ')}</TableCell>
                    <TableCell>{claim.courier}</TableCell>
                    <TableCell>{claim.tracking_number || '-'}</TableCell>
                    <TableCell>${claim.claimed_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={claim.claim_status.replace('_', ' ')}
                        sx={{
                          backgroundColor: statusColors[claim.claim_status],
                          color: 'white',
                        }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(claim.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleViewClaim(claim)}>
                        <Visibility />
                      </IconButton>
                      {claim.claim_status === 'draft' && (
                        <>
                          <IconButton size="small" color="primary" onClick={() => handleSubmitClaim(claim.claim_id)}>
                            <Send />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Claim Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>File New Claim</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tracking Number"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Courier"
                value={formData.courier}
                onChange={(e) => setFormData({ ...formData, courier: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Claim Type"
                value={formData.claim_type}
                onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })}
                required
              >
                {claimTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Incident Date"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Incident Description"
                value={formData.incident_description}
                onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })}
                required
                placeholder="Describe what happened in detail..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Claimed Amount"
                value={formData.claimed_amount}
                onChange={(e) => setFormData({ ...formData, claimed_amount: e.target.value })}
                required
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Declared Value (Optional)"
                value={formData.declared_value}
                onChange={(e) => setFormData({ ...formData, declared_value: e.target.value })}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                You can upload photos and documents after creating the claim.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={createClaimMutation.isPending}
          >
            Create Claim
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Claim Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Claim Details</DialogTitle>
        <DialogContent>
          {selectedClaim && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">Claim #{selectedClaim.claim_number || selectedClaim.claim_id.slice(0, 8)}</Typography>
                  <Chip
                    label={selectedClaim.claim_status.replace('_', ' ')}
                    sx={{
                      backgroundColor: statusColors[selectedClaim.claim_status],
                      color: 'white',
                      mt: 1
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography>{selectedClaim.claim_type.replace('_', ' ')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Courier</Typography>
                  <Typography>{selectedClaim.courier}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Tracking Number</Typography>
                  <Typography>{selectedClaim.tracking_number || '-'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Claimed Amount</Typography>
                  <Typography>${selectedClaim.claimed_amount.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Incident Description</Typography>
                  <Typography>{selectedClaim.incident_description}</Typography>
                </Grid>
                {selectedClaim.timeline && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Timeline</Typography>
                    <Stepper orientation="vertical">
                      {selectedClaim.timeline.map((event: any, index: number) => (
                        <Step key={event.timeline_id} active completed={index > 0}>
                          <StepLabel>
                            <Typography variant="subtitle2">{event.event_description}</Typography>
                            <Typography variant="caption">{new Date(event.created_at).toLocaleString()}</Typography>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
