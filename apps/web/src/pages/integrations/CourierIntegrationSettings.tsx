/**
 * CourierIntegrationSettings Component
 * Manage courier API credentials and integrations
 * 
 * Week 3 Phase 3: Frontend UI
 * Created: October 19, 2025
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  Info,
  Visibility,
  VisibilityOff,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { CourierLogo } from '@/components/courier/CourierLogo';
import { IntegrationStatusBadge } from '@/components/courier/IntegrationStatusBadge';
import toast from 'react-hot-toast';

interface CourierCredential {
  credential_id: string;
  courier_name: string;
  courier_code?: string;
  api_key?: string;
  api_secret?: string;
  client_id?: string;
  client_secret?: string;
  base_url?: string;
  api_version?: string;
  rate_limit_per_minute?: number;
  is_active: boolean;
  last_used?: string;
  total_requests?: number;
  failed_requests?: number;
  created_at: string;
  updated_at: string;
}

interface AvailableCourier {
  courier_id: string;
  courier_name: string;
  courier_code: string;
  api_endpoint?: string;
  service_types: string[];
  coverage_countries: string[];
  has_credentials: boolean;
}

export const CourierIntegrationSettings: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<CourierCredential | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    courier_name: '',
    api_key: '',
    api_secret: '',
    client_id: '',
    client_secret: '',
    base_url: '',
    api_version: '',
    rate_limit_per_minute: 60,
  });

  // Fetch available couriers
  const { data: availableCouriers, isLoading: loadingCouriers } = useQuery({
    queryKey: ['available-couriers'],
    queryFn: async () => {
      const response = await apiClient.get('/couriers');
      return response.data.data as AvailableCourier[];
    },
  });

  // Fetch courier credentials
  const { data: credentials, isLoading: loadingCredentials } = useQuery({
    queryKey: ['courier-credentials'],
    queryFn: async () => {
      const response = await apiClient.get('/week3-integrations/courier-credentials');
      return response.data.data as CourierCredential[];
    },
  });

  // Add credential mutation
  const addCredentialMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/week3-integrations/courier-credentials', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courier-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['available-couriers'] });
      toast.success('Courier credentials added successfully');
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add credentials');
    },
  });

  // Update credential mutation
  const updateCredentialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiClient.put(`/week3-integrations/courier-credentials/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courier-credentials'] });
      toast.success('Credentials updated successfully');
      setEditDialogOpen(false);
      setSelectedCredential(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update credentials');
    },
  });

  // Delete credential mutation
  const deleteCredentialMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/week3-integrations/courier-credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courier-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['available-couriers'] });
      toast.success('Credentials deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete credentials');
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/week3-integrations/courier-credentials/${id}/test`);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error('Connection test failed: ' + data.message);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Connection test failed');
    },
  });

  const resetForm = () => {
    setFormData({
      courier_name: '',
      api_key: '',
      api_secret: '',
      client_id: '',
      client_secret: '',
      base_url: '',
      api_version: '',
      rate_limit_per_minute: 60,
    });
  };

  const handleAdd = () => {
    setAddDialogOpen(true);
    resetForm();
  };

  const handleEdit = (credential: CourierCredential) => {
    setSelectedCredential(credential);
    setFormData({
      courier_name: credential.courier_name,
      api_key: credential.api_key || '',
      api_secret: credential.api_secret || '',
      client_id: credential.client_id || '',
      client_secret: credential.client_secret || '',
      base_url: credential.base_url || '',
      api_version: credential.api_version || '',
      rate_limit_per_minute: credential.rate_limit_per_minute || 60,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete these credentials?')) {
      deleteCredentialMutation.mutate(id);
    }
  };

  const handleTestConnection = (id: string) => {
    testConnectionMutation.mutate(id);
  };

  const toggleShowSecret = (credentialId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };

  const getStatusColor = (credential: CourierCredential): 'success' | 'error' | 'warning' | 'default' => {
    if (!credential.is_active) return 'default';
    if (credential.failed_requests && credential.total_requests) {
      const failureRate = credential.failed_requests / credential.total_requests;
      if (failureRate > 0.1) return 'error';
      if (failureRate > 0.05) return 'warning';
    }
    return 'success';
  };

  const getStatusIcon = (credential: CourierCredential) => {
    const status = getStatusColor(credential);
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Info color="disabled" />;
    }
  };

  if (loadingCouriers || loadingCredentials) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Courier Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage API credentials for courier integrations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add Credentials
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Connect your courier accounts to enable automated tracking, shipping label generation, and real-time updates.
          Your API credentials are encrypted and stored securely.
        </Typography>
      </Alert>

      {/* Credentials List */}
      {credentials && credentials.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Courier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>API Usage</TableCell>
                <TableCell>Rate Limit</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {credentials.map((credential) => (
                <TableRow key={credential.credential_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <CourierLogo
                        courierCode={credential.courier_code || credential.courier_name}
                        courierName={credential.courier_name}
                        size="medium"
                        variant="rounded"
                      />
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {credential.courier_name}
                        </Typography>
                        {credential.api_version && (
                          <Typography variant="caption" color="text.secondary">
                            API v{credential.api_version}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(credential)}
                      <Chip
                        label={credential.is_active ? 'Active' : 'Inactive'}
                        color={getStatusColor(credential)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {credential.total_requests || 0} requests
                      </Typography>
                      {credential.failed_requests && credential.failed_requests > 0 && (
                        <Typography variant="caption" color="error">
                          {credential.failed_requests} failed
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {credential.rate_limit_per_minute || 60}/min
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {credential.last_used
                        ? new Date(credential.last_used).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Test Connection">
                        <IconButton
                          size="small"
                          onClick={() => handleTestConnection(credential.credential_id)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(credential)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(credential.credential_id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No courier integrations configured
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first courier integration to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Add Credentials
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={addDialogOpen || editDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedCredential(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? 'Edit Courier Credentials' : 'Add Courier Credentials'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Courier</InputLabel>
                  <Select
                    value={formData.courier_name}
                    label="Courier"
                    onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
                    disabled={editDialogOpen}
                  >
                    {availableCouriers?.map((courier) => (
                      <MenuItem key={courier.courier_id} value={courier.courier_name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <CourierLogo
                            courierCode={courier.courier_code}
                            courierName={courier.courier_name}
                            size="small"
                            variant="rounded"
                          />
                          {courier.courier_name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider>
                  <Chip label="API Credentials" size="small" />
                </Divider>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Key"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  type={showSecrets['api_key'] ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        size="small"
                        onClick={() => toggleShowSecret('api_key')}
                      >
                        {showSecrets['api_key'] ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Secret"
                  value={formData.api_secret}
                  onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                  type={showSecrets['api_secret'] ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        size="small"
                        onClick={() => toggleShowSecret('api_secret')}
                      >
                        {showSecrets['api_secret'] ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client ID (OAuth2)"
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Client Secret (OAuth2)"
                  value={formData.client_secret}
                  onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                  type={showSecrets['client_secret'] ? 'text' : 'password'}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        size="small"
                        onClick={() => toggleShowSecret('client_secret')}
                      >
                        {showSecrets['client_secret'] ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider>
                  <Chip label="Configuration" size="small" />
                </Divider>
              </Grid>

              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Base URL"
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="https://api.courier.com"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="API Version"
                  value={formData.api_version}
                  onChange={(e) => setFormData({ ...formData, api_version: e.target.value })}
                  placeholder="v1"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rate Limit (requests per minute)"
                  type="number"
                  value={formData.rate_limit_per_minute}
                  onChange={(e) => setFormData({ ...formData, rate_limit_per_minute: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              setSelectedCredential(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editDialogOpen && selectedCredential) {
                updateCredentialMutation.mutate({
                  id: selectedCredential.credential_id,
                  data: formData,
                });
              } else {
                addCredentialMutation.mutate(formData);
              }
            }}
            disabled={
              !formData.courier_name ||
              (!formData.api_key && !formData.client_id) ||
              addCredentialMutation.isPending ||
              updateCredentialMutation.isPending
            }
          >
            {editDialogOpen ? 'Update' : 'Add'} Credentials
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
