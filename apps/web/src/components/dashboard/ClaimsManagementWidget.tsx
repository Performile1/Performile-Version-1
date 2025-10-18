/**
 * ClaimsManagementWidget Component
 * Displays and manages claims with status updates
 * 
 * Phase: Dashboard Analytics Enhancement - Phase 1.4
 * Created: October 18, 2025, 6:56 PM
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  Pagination,
} from '@mui/material';
import {
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  Search,
  FilterList,
  MoreVert,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ClaimsManagementWidgetProps {
  entityType: 'courier' | 'merchant';
  entityId?: string;
  subscriptionTier?: string;
}

interface Claim {
  claim_id: string;
  order_id: string;
  claim_type: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  claim_amount: number;
  created_at: string;
  resolved_at?: string;
  courier_name?: string;
  merchant_name?: string;
}

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  open: 'warning',
  in_review: 'info',
  approved: 'success',
  declined: 'error',
  closed: 'default',
};

const STATUS_ICONS: Record<string, string> = {
  open: '🟡',
  in_review: '🔵',
  approved: '🟢',
  declined: '🔴',
  closed: '⚫',
};

export const ClaimsManagementWidget: React.FC<ClaimsManagementWidgetProps> = ({
  entityType,
  entityId,
  subscriptionTier = 'tier1',
}) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Determine limits based on subscription tier
  const getClaimLimit = () => {
    switch (subscriptionTier) {
      case 'tier1':
        return 10;
      case 'tier2':
        return 50;
      case 'tier3':
        return 1000;
      default:
        return 10;
    }
  };

  const claimLimit = getClaimLimit();
  const pageSize = 10;

  // Fetch claims
  const { data: claimsData, isLoading, error } = useQuery({
    queryKey: ['claims', entityType, entityId || user?.user_id, statusFilter, searchQuery, page],
    queryFn: async () => {
      const response = await apiClient.get('/claims', {
        params: {
          entity_type: entityType,
          entity_id: entityId || user?.user_id,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          page,
          limit: pageSize,
        },
      });
      return response.data;
    },
    enabled: !!user,
  });

  const claims = claimsData?.data || [];
  const totalClaims = claimsData?.total || 0;
  const totalPages = Math.ceil(totalClaims / pageSize);

  // Update claim mutation
  const updateClaimMutation = useMutation({
    mutationFn: async ({ claimId, status, notes }: { claimId: string; status: string; notes?: string }) => {
      const response = await apiClient.put(`/claims/${claimId}`, {
        status,
        resolution_notes: notes,
        resolved_at: ['approved', 'declined', 'closed'].includes(status) ? new Date().toISOString() : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['claims-trends'] });
      toast.success('Claim updated successfully');
      setUpdateDialogOpen(false);
      setDetailsDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update claim');
    },
  });

  const handleViewDetails = (claim: Claim) => {
    setSelectedClaim(claim);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (claim: Claim) => {
    setSelectedClaim(claim);
    setNewStatus(claim.status);
    setResolutionNotes('');
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = () => {
    if (selectedClaim) {
      updateClaimMutation.mutate({
        claimId: selectedClaim.claim_id,
        status: newStatus,
        notes: resolutionNotes,
      });
    }
  };

  const canManageClaims = subscriptionTier !== 'tier1';

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Failed to load claims. Please try again later.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          {/* Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Claims Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage claims (showing {Math.min(totalClaims, claimLimit)} of {totalClaims})
            </Typography>
          </Box>

          {/* Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search by order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="open">🟡 Open</MenuItem>
                <MenuItem value="in_review">🔵 In Review</MenuItem>
                <MenuItem value="approved">🟢 Approved</MenuItem>
                <MenuItem value="declined">🔴 Declined</MenuItem>
                <MenuItem value="closed">⚫ Closed</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Claims Table */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {claims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No claims found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.slice(0, claimLimit).map((claim: Claim) => (
                    <TableRow key={claim.claim_id} hover>
                      <TableCell>
                        <Chip
                          label={`${STATUS_ICONS[claim.status]} ${claim.status.replace('_', ' ')}`}
                          color={STATUS_COLORS[claim.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {claim.order_id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={claim.claim_type} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {claim.title}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          ${claim.claim_amount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(claim.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(claim)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canManageClaims && claim.status !== 'closed' && (
                          <Tooltip title="Update Status">
                            <IconButton size="small" onClick={() => handleUpdateStatus(claim)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}

          {/* Tier Limit Notice */}
          {totalClaims > claimLimit && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Showing {claimLimit} of {totalClaims} claims.</strong>{' '}
                {subscriptionTier === 'tier1' && 'Upgrade to Pro to view up to 50 claims.'}
                {subscriptionTier === 'tier2' && 'Upgrade to Enterprise for unlimited claims.'}
              </Typography>
            </Alert>
          )}

          {/* View-Only Notice */}
          {!canManageClaims && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>View-only mode.</strong> Upgrade to Pro or Enterprise to update claim statuses.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Claim Details</DialogTitle>
        <DialogContent>
          {selectedClaim && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip
                  label={`${STATUS_ICONS[selectedClaim.status]} ${selectedClaim.status.replace('_', ' ')}`}
                  color={STATUS_COLORS[selectedClaim.status]}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Order ID</Typography>
                <Typography variant="body2" fontFamily="monospace">{selectedClaim.order_id}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body2">{selectedClaim.claim_type}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Title</Typography>
                <Typography variant="body2">{selectedClaim.title}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{selectedClaim.description}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Claim Amount</Typography>
                <Typography variant="body2" fontWeight="bold">${selectedClaim.claim_amount}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2">
                  {new Date(selectedClaim.created_at).toLocaleString()}
                </Typography>
              </Box>
              {selectedClaim.resolved_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Resolved</Typography>
                  <Typography variant="body2">
                    {new Date(selectedClaim.resolved_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {canManageClaims && selectedClaim?.status !== 'closed' && (
            <Button onClick={() => {
              setDetailsDialogOpen(false);
              handleUpdateStatus(selectedClaim);
            }}>
              Update Status
            </Button>
          )}
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onClose={() => setUpdateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Claim Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <MenuItem value="open">🟡 Open</MenuItem>
                <MenuItem value="in_review">🔵 In Review</MenuItem>
                <MenuItem value="approved">🟢 Approved</MenuItem>
                <MenuItem value="declined">🔴 Declined</MenuItem>
                <MenuItem value="closed">⚫ Closed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Resolution Notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add notes about this status change..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUpdateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitUpdate} 
            variant="contained"
            disabled={updateClaimMutation.isPending}
          >
            {updateClaimMutation.isPending ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ClaimsManagementWidget;
