/**
 * ApiKeysManagement Component
 * Manage API keys for external access to Performile platform
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider,
  Link,
} from '@mui/material';
import {
  Add,
  Delete,
  ContentCopy,
  Refresh,
  Visibility,
  VisibilityOff,
  Code,
  Info,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ApiKey {
  api_key_id: string;
  user_id: string;
  shop_id?: string;
  key_name: string;
  api_key: string;
  api_key_prefix: string;
  permissions: Record<string, string[]>;
  rate_limit_per_hour: number;
  is_active: boolean;
  last_used_at?: string;
  total_requests: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

const AVAILABLE_PERMISSIONS = [
  {
    resource: 'orders',
    actions: ['read', 'write', 'delete'],
    description: 'Access to order management',
  },
  {
    resource: 'tracking',
    actions: ['read', 'write'],
    description: 'Access to tracking information',
  },
  {
    resource: 'reviews',
    actions: ['read', 'write'],
    description: 'Access to reviews and ratings',
  },
  {
    resource: 'claims',
    actions: ['read', 'write'],
    description: 'Access to claims management',
  },
  {
    resource: 'analytics',
    actions: ['read'],
    description: 'Access to analytics data',
  },
];

export const ApiKeysManagement: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [keyDisplayDialog, setKeyDisplayDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    key_name: '',
    permissions: {} as Record<string, string[]>,
    rate_limit_per_hour: 1000,
    expires_in_days: 365,
  });

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const response = await apiClient.get('/week3-integrations/api-keys');
      return response.data.data as ApiKey[];
    },
  });

  // Generate API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/week3-integrations/api-keys', data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewApiKey(data.data.api_key);
      setKeyDisplayDialog(true);
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate API key');
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/week3-integrations/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to revoke API key');
    },
  });

  // Regenerate API key mutation
  const regenerateKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/week3-integrations/api-keys/${id}/regenerate`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewApiKey(data.data.api_key);
      setKeyDisplayDialog(true);
      toast.success('API key regenerated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to regenerate API key');
    },
  });

  const resetForm = () => {
    setFormData({
      key_name: '',
      permissions: {},
      rate_limit_per_hour: 1000,
      expires_in_days: 365,
    });
  };

  const handleAdd = () => {
    setAddDialogOpen(true);
    resetForm();
  };

  const handleRevoke = (id: string) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      revokeKeyMutation.mutate(id);
    }
  };

  const handleRegenerate = (id: string) => {
    if (window.confirm('Are you sure you want to regenerate this API key? The old key will stop working immediately.')) {
      regenerateKeyMutation.mutate(id);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const togglePermission = (resource: string, action: string) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions[resource] || [];
      const newPermissions = currentPermissions.includes(action)
        ? currentPermissions.filter(a => a !== action)
        : [...currentPermissions, action];
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [resource]: newPermissions,
        },
      };
    });
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const getStatusColor = (apiKey: ApiKey): 'success' | 'error' | 'warning' | 'default' => {
    if (!apiKey.is_active) return 'default';
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) return 'error';
    if (apiKey.expires_at) {
      const daysUntilExpiry = Math.floor((new Date(apiKey.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 7) return 'warning';
    }
    return 'success';
  };

  if (isLoading) {
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
            API Keys
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage API keys for external access to your Performile data
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Code />}
            component={Link}
            href="/docs/api"
            target="_blank"
          >
            API Documentation
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
          >
            Generate API Key
          </Button>
        </Stack>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          API keys allow external applications to access your Performile data securely.
          Keep your API keys secret and never share them publicly. You can revoke or regenerate keys at any time.
        </Typography>
      </Alert>

      {/* API Keys List */}
      {apiKeys && apiKeys.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>API Key</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Rate Limit</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.api_key_id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {apiKey.key_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(apiKey.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontFamily="monospace">
                        {showKeys[apiKey.api_key_id]
                          ? apiKey.api_key
                          : `${apiKey.api_key_prefix}${'*'.repeat(32)}`}
                      </Typography>
                      <Tooltip title={showKeys[apiKey.api_key_id] ? 'Hide' : 'Show'}>
                        <IconButton
                          size="small"
                          onClick={() => toggleShowKey(apiKey.api_key_id)}
                        >
                          {showKeys[apiKey.api_key_id] ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyKey(apiKey.api_key)}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {Object.entries(apiKey.permissions).slice(0, 2).map(([resource, actions]) => (
                        <Chip
                          key={resource}
                          label={`${resource}: ${(actions as string[]).join(', ')}`}
                          size="small"
                        />
                      ))}
                      {Object.keys(apiKey.permissions).length > 2 && (
                        <Chip
                          label={`+${Object.keys(apiKey.permissions).length - 2} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {apiKey.total_requests} requests
                      </Typography>
                      {apiKey.last_used_at && (
                        <Typography variant="caption" color="text.secondary">
                          Last used {new Date(apiKey.last_used_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {apiKey.rate_limit_per_hour}/hour
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {apiKey.expires_at
                        ? new Date(apiKey.expires_at).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={apiKey.is_active ? 'Active' : 'Inactive'}
                      color={getStatusColor(apiKey)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Regenerate">
                        <IconButton
                          size="small"
                          onClick={() => handleRegenerate(apiKey.api_key_id)}
                          disabled={regenerateKeyMutation.isPending}
                        >
                          <Refresh />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Revoke">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRevoke(apiKey.api_key_id)}
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
                No API keys generated
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate your first API key to start using the Performile API
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Generate API Key
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Generate API Key Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generate API Key</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Key Name"
                  value={formData.key_name}
                  onChange={(e) => setFormData({ ...formData, key_name: e.target.value })}
                  placeholder="Production API Key"
                  helperText="A descriptive name to identify this API key"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rate Limit (per hour)"
                  type="number"
                  value={formData.rate_limit_per_hour}
                  onChange={(e) => setFormData({ ...formData, rate_limit_per_hour: parseInt(e.target.value) })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Expires In (days)"
                  type="number"
                  value={formData.expires_in_days}
                  onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                  helperText="0 = never expires"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider>
                  <Chip label="Permissions" size="small" />
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select which resources and actions this API key can access
                </Typography>
                <Grid container spacing={2}>
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <Grid item xs={12} key={perm.resource}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body2" fontWeight="medium" gutterBottom>
                            {perm.resource.charAt(0).toUpperCase() + perm.resource.slice(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                            {perm.description}
                          </Typography>
                          <FormGroup row>
                            {perm.actions.map((action) => (
                              <FormControlLabel
                                key={action}
                                control={
                                  <Checkbox
                                    checked={formData.permissions[perm.resource]?.includes(action) || false}
                                    onChange={() => togglePermission(perm.resource, action)}
                                  />
                                }
                                label={action}
                              />
                            ))}
                          </FormGroup>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => generateKeyMutation.mutate(formData)}
            disabled={
              !formData.key_name ||
              Object.keys(formData.permissions).length === 0 ||
              generateKeyMutation.isPending
            }
          >
            Generate API Key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Display New API Key Dialog */}
      <Dialog
        open={keyDisplayDialog}
        onClose={() => setKeyDisplayDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningIcon color="warning" />
            API Key Generated
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Important:</strong> Copy this API key now. You won't be able to see it again!
            </Typography>
          </Alert>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              value={newApiKey}
              InputProps={{
                readOnly: true,
                sx: { fontFamily: 'monospace', fontSize: '0.875rem' },
              }}
            />
            <Tooltip title="Copy">
              <IconButton onClick={() => handleCopyKey(newApiKey)}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setKeyDisplayDialog(false)}>
            I've Saved My API Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
