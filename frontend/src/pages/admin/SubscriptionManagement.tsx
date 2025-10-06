import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  user_type: 'merchant' | 'courier';
  tier: 1 | 2 | 3;
  monthly_price: number;
  annual_price?: number;
  max_orders_per_month?: number;
  max_emails_per_month?: number;
  max_sms_per_month?: number;
  max_push_notifications_per_month?: number;
  max_couriers?: number;
  max_team_members?: number;
  max_shops?: number;
  description?: string;
  features: Record<string, boolean>;
  is_popular: boolean;
  is_active: boolean;
  is_visible: boolean;
  display_order: number;
}

const SubscriptionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'merchant' | 'courier'>('merchant');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/admin/subscriptions?user_type=${activeTab}&include_inactive=true`);
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    }
  });

  const plans = plansData?.plans || [];

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (plan: Partial<SubscriptionPlan>) => {
      const url = plan.plan_id 
        ? `/api/admin/subscriptions?plan_id=${plan.plan_id}`
        : '/api/admin/subscriptions';
      
      const response = await fetch(url, {
        method: plan.plan_id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });

      if (!response.ok) throw new Error('Failed to save plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setDialogOpen(false);
      setEditingPlan(null);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await fetch(`/api/admin/subscriptions?plan_id=${planId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    }
  });

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan({
      plan_id: 0,
      plan_name: '',
      plan_slug: '',
      user_type: activeTab,
      tier: 1,
      monthly_price: 0,
      features: {},
      is_popular: false,
      is_active: true,
      is_visible: true,
      display_order: 0
    } as SubscriptionPlan);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingPlan) {
      saveMutation.mutate(editingPlan);
    }
  };

  const handleDelete = (planId: number) => {
    if (confirm('Are you sure you want to deactivate this plan?')) {
      deleteMutation.mutate(planId);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Subscription Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Create Plan
        </Button>
      </Box>

      {/* Tabs for Merchant/Courier */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Merchant Plans" value="merchant" />
          <Tab label="Courier Plans" value="courier" />
        </Tabs>
      </Paper>

      {/* Plans Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {plans.map((plan: SubscriptionPlan) => (
          <Grid item xs={12} md={4} key={plan.plan_id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">{plan.plan_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tier {plan.tier}
                    </Typography>
                  </Box>
                  <Box>
                    {plan.is_popular && (
                      <Chip label="Popular" color="primary" size="small" sx={{ mb: 1 }} />
                    )}
                    {!plan.is_active && (
                      <Chip label="Inactive" color="error" size="small" />
                    )}
                  </Box>
                </Box>

                <Typography variant="h4" sx={{ mb: 2 }}>
                  ${plan.monthly_price}
                  <Typography component="span" variant="body2" color="text.secondary">
                    /month
                  </Typography>
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    • Orders: {plan.max_orders_per_month || 'Unlimited'}/month
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Emails: {plan.max_emails_per_month || 'Unlimited'}/month
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • SMS: {plan.max_sms_per_month || 'None'}/month
                  </Typography>
                  {plan.user_type === 'merchant' && (
                    <Typography variant="body2" color="text.secondary">
                      • Couriers: {plan.max_couriers || 'Unlimited'}
                    </Typography>
                  )}
                  {plan.user_type === 'courier' && (
                    <Typography variant="body2" color="text.secondary">
                      • Team: {plan.max_team_members || 'Unlimited'}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(plan)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDelete(plan.plan_id)}
                  >
                    Deactivate
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Table View */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plan Name</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Emails</TableCell>
              <TableCell>SMS</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan: SubscriptionPlan) => (
              <TableRow key={plan.plan_id}>
                <TableCell>
                  {plan.plan_name}
                  {plan.is_popular && (
                    <Chip label="Popular" size="small" color="primary" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>Tier {plan.tier}</TableCell>
                <TableCell>${plan.monthly_price}/mo</TableCell>
                <TableCell>{plan.max_orders_per_month || '∞'}</TableCell>
                <TableCell>{plan.max_emails_per_month || '∞'}</TableCell>
                <TableCell>{plan.max_sms_per_month || '0'}</TableCell>
                <TableCell>
                  <Chip
                    label={plan.is_active ? 'Active' : 'Inactive'}
                    color={plan.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(plan)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(plan.plan_id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPlan?.plan_id ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Plan Name"
              value={editingPlan?.plan_name || ''}
              onChange={(e) => setEditingPlan({ ...editingPlan!, plan_name: e.target.value })}
              fullWidth
            />

            <TextField
              label="Plan Slug"
              value={editingPlan?.plan_slug || ''}
              onChange={(e) => setEditingPlan({ ...editingPlan!, plan_slug: e.target.value })}
              helperText="URL-friendly identifier (e.g., merchant-starter)"
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>User Type</InputLabel>
                  <Select
                    value={editingPlan?.user_type || 'merchant'}
                    onChange={(e) => setEditingPlan({ ...editingPlan!, user_type: e.target.value as any })}
                  >
                    <MenuItem value="merchant">Merchant</MenuItem>
                    <MenuItem value="courier">Courier</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Tier</InputLabel>
                  <Select
                    value={editingPlan?.tier || 1}
                    onChange={(e) => setEditingPlan({ ...editingPlan!, tier: e.target.value as any })}
                  >
                    <MenuItem value={1}>Tier 1 (Starter)</MenuItem>
                    <MenuItem value={2}>Tier 2 (Professional)</MenuItem>
                    <MenuItem value={3}>Tier 3 (Enterprise)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Monthly Price"
                  type="number"
                  value={editingPlan?.monthly_price || 0}
                  onChange={(e) => setEditingPlan({ ...editingPlan!, monthly_price: parseFloat(e.target.value) })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Annual Price (Optional)"
                  type="number"
                  value={editingPlan?.annual_price || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan!, annual_price: parseFloat(e.target.value) || undefined })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Usage Limits (Leave empty for unlimited)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Max Orders/Month"
                  type="number"
                  value={editingPlan?.max_orders_per_month || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan!, max_orders_per_month: parseInt(e.target.value) || undefined })}
                  placeholder="Unlimited"
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Max Emails/Month"
                  type="number"
                  value={editingPlan?.max_emails_per_month || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan!, max_emails_per_month: parseInt(e.target.value) || undefined })}
                  placeholder="Unlimited"
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Max SMS/Month"
                  type="number"
                  value={editingPlan?.max_sms_per_month || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan!, max_sms_per_month: parseInt(e.target.value) || undefined })}
                  placeholder="0"
                  fullWidth
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Max Push Notifications/Month"
                  type="number"
                  value={editingPlan?.max_push_notifications_per_month || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan!, max_push_notifications_per_month: parseInt(e.target.value) || undefined })}
                  placeholder="Unlimited"
                  fullWidth
                />
              </Grid>

              {editingPlan?.user_type === 'merchant' && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      label="Max Couriers"
                      type="number"
                      value={editingPlan?.max_couriers || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan!, max_couriers: parseInt(e.target.value) || undefined })}
                      placeholder="Unlimited"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      label="Max Shops"
                      type="number"
                      value={editingPlan?.max_shops || ''}
                      onChange={(e) => setEditingPlan({ ...editingPlan!, max_shops: parseInt(e.target.value) || undefined })}
                      placeholder="Unlimited"
                      fullWidth
                    />
                  </Grid>
                </>
              )}

              {editingPlan?.user_type === 'courier' && (
                <Grid item xs={6}>
                  <TextField
                    label="Max Team Members"
                    type="number"
                    value={editingPlan?.max_team_members || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan!, max_team_members: parseInt(e.target.value) || undefined })}
                    placeholder="Unlimited"
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>

            <TextField
              label="Description"
              value={editingPlan?.description || ''}
              onChange={(e) => setEditingPlan({ ...editingPlan!, description: e.target.value })}
              multiline
              rows={2}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editingPlan?.is_popular || false}
                    onChange={(e) => setEditingPlan({ ...editingPlan!, is_popular: e.target.checked })}
                  />
                }
                label="Mark as Popular"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editingPlan?.is_active !== false}
                    onChange={(e) => setEditingPlan({ ...editingPlan!, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editingPlan?.is_visible !== false}
                    onChange={(e) => setEditingPlan({ ...editingPlan!, is_visible: e.target.checked })}
                  />
                }
                label="Visible to Users"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManagement;
