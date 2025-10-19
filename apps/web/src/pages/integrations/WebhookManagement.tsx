/**
 * WebhookManagement Component
 * Manage incoming webhooks for order and tracking updates
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  ContentCopy,
  Refresh,
  Visibility,
  VisibilityOff,
  Code,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Webhook {
  webhook_id: string;
  user_id: string;
  shop_id?: string;
  webhook_url: string;
  webhook_secret: string;
  event_types: string[];
  is_active: boolean;
  last_triggered_at?: string;
  total_deliveries: number;
  failed_deliveries: number;
  created_at: string;
  updated_at: string;
}

const AVAILABLE_EVENTS = [
  { value: 'order.created', label: 'Order Created', description: 'Triggered when a new order is created' },
  { value: 'order.updated', label: 'Order Updated', description: 'Triggered when an order is updated' },
  { value: 'order.cancelled', label: 'Order Cancelled', description: 'Triggered when an order is cancelled' },
  { value: 'tracking.updated', label: 'Tracking Updated', description: 'Triggered when tracking status changes' },
  { value: 'tracking.delivered', label: 'Tracking Delivered', description: 'Triggered when package is delivered' },
  { value: 'review.created', label: 'Review Created', description: 'Triggered when a review is submitted' },
  { value: 'claim.created', label: 'Claim Created', description: 'Triggered when a claim is filed' },
  { value: 'claim.updated', label: 'Claim Updated', description: 'Triggered when claim status changes' },
];

export const WebhookManagement: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    webhook_url: '',
    event_types: [] as string[],
  });

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const response = await apiClient.get('/week3-integrations/webhooks');
      return response.data.data as Webhook[];
    },
  });

  // Add webhook mutation
  const addWebhookMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiClient.post('/week3-integrations/webhooks', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook created successfully');
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create webhook');
    },
  });

  // Update webhook mutation
  const updateWebhookMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiClient.put(`/week3-integrations/webhooks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook updated successfully');
      setEditDialogOpen(false);
      setSelectedWebhook(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update webhook');
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/week3-integrations/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete webhook');
    },
  });

  // Test webhook mutation
  const testWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/week3-integrations/webhooks/${id}/test`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test webhook sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test webhook');
    },
  });

  const resetForm = () => {
    setFormData({
      webhook_url: '',
      event_types: [],
    });
  };

  const handleAdd = () => {
    setAddDialogOpen(true);
    resetForm();
  };

  const handleEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setFormData({
      webhook_url: webhook.webhook_url,
      event_types: webhook.event_types,
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      deleteWebhookMutation.mutate(id);
    }
  };

  const handleTest = (id: string) => {
    testWebhookMutation.mutate(id);
  };

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Webhook secret copied to clipboard');
  };

  const handleCopyUrl = (webhookId: string) => {
    const url = `${window.location.origin}/api/week3-integrations/webhooks/receive/${webhookId}`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard');
  };

  const toggleEventType = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      event_types: prev.event_types.includes(eventType)
        ? prev.event_types.filter(e => e !== eventType)
        : [...prev.event_types, eventType],
    }));
  };

  const getStatusColor = (webhook: Webhook): 'success' | 'error' | 'warning' | 'default' => {
    if (!webhook.is_active) return 'default';
    if (webhook.failed_deliveries > 0 && webhook.total_deliveries > 0) {
      const failureRate = webhook.failed_deliveries / webhook.total_deliveries;
      if (failureRate > 0.1) return 'error';
      if (failureRate > 0.05) return 'warning';
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
            Webhook Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Receive real-time updates for orders, tracking, and more
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Create Webhook
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Webhooks allow you to receive real-time notifications when events occur in your Performile account.
          Configure which events you want to receive and where to send them.
        </Typography>
      </Alert>

      {/* Webhooks List */}
      {webhooks && webhooks.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Webhook URL</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Deliveries</TableCell>
                <TableCell>Last Triggered</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.webhook_id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {webhook.webhook_url}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {webhook.webhook_id.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {webhook.event_types.slice(0, 2).map((event) => (
                        <Chip key={event} label={event} size="small" />
                      ))}
                      {webhook.event_types.length > 2 && (
                        <Chip label={`+${webhook.event_types.length - 2} more`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={webhook.is_active ? 'Active' : 'Inactive'}
                      color={getStatusColor(webhook)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {webhook.total_deliveries} total
                      </Typography>
                      {webhook.failed_deliveries > 0 && (
                        <Typography variant="caption" color="error">
                          {webhook.failed_deliveries} failed
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {webhook.last_triggered_at
                        ? new Date(webhook.last_triggered_at).toLocaleDateString()
                        : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Test Webhook">
                        <IconButton
                          size="small"
                          onClick={() => handleTest(webhook.webhook_id)}
                          disabled={testWebhookMutation.isPending}
                        >
                          <PlayArrow />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy URL">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUrl(webhook.webhook_id)}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(webhook)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(webhook.webhook_id)}
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
                No webhooks configured
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first webhook to receive real-time updates
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
              >
                Create Webhook
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
          setSelectedWebhook(null);
          resetForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editDialogOpen ? 'Edit Webhook' : 'Create Webhook'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Webhook URL"
                  value={formData.webhook_url}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://your-domain.com/webhooks/performile"
                  helperText="The URL where webhook events will be sent"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider>
                  <Chip label="Event Types" size="small" />
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select which events should trigger this webhook
                </Typography>
                <FormGroup>
                  <Grid container spacing={2}>
                    {AVAILABLE_EVENTS.map((event) => (
                      <Grid item xs={12} md={6} key={event.value}>
                        <Card variant="outlined">
                          <CardContent sx={{ py: 1.5 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formData.event_types.includes(event.value)}
                                  onChange={() => toggleEventType(event.value)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {event.label}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {event.description}
                                  </Typography>
                                </Box>
                              }
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </FormGroup>
              </Grid>

              {editDialogOpen && selectedWebhook && (
                <Grid item xs={12}>
                  <Divider>
                    <Chip label="Webhook Details" size="small" />
                  </Divider>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Webhook Secret:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        fullWidth
                        value={selectedWebhook.webhook_secret}
                        type={showSecret ? 'text' : 'password'}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <IconButton
                              size="small"
                              onClick={() => setShowSecret(!showSecret)}
                            >
                              {showSecret ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          ),
                        }}
                      />
                      <Tooltip title="Copy Secret">
                        <IconButton
                          onClick={() => handleCopySecret(selectedWebhook.webhook_secret)}
                        >
                          <ContentCopy />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="caption">
                        Use this secret to verify webhook signatures. Keep it secure and never share it publicly.
                      </Typography>
                    </Alert>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
              setSelectedWebhook(null);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (editDialogOpen && selectedWebhook) {
                updateWebhookMutation.mutate({
                  id: selectedWebhook.webhook_id,
                  data: formData,
                });
              } else {
                addWebhookMutation.mutate(formData);
              }
            }}
            disabled={
              !formData.webhook_url ||
              formData.event_types.length === 0 ||
              addWebhookMutation.isPending ||
              updateWebhookMutation.isPending
            }
          >
            {editDialogOpen ? 'Update' : 'Create'} Webhook
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
