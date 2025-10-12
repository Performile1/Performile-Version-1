import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import { Edit, Save, Cancel, Add } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface SubscriptionPlan {
  plan_id: number;
  plan_name: string;
  plan_slug: string;
  user_type: 'merchant' | 'courier';
  tier: number;
  monthly_price: number;
  annual_price: number;
  max_orders_per_month: number | null;
  max_emails_per_month: number | null;
  max_sms_per_month: number | null;
  max_push_notifications_per_month: number | null;
  max_couriers: number | null;
  max_team_members: number | null;
  max_shops: number | null;
  description: string;
  features: any;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
}

interface AdminSubscriptionsSettingsProps {
  platformStats: any;
}

export const AdminSubscriptionsSettings: React.FC<AdminSubscriptionsSettingsProps> = ({ platformStats }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState<'merchant' | 'courier'>('merchant');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/subscription-plans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(response.data.plans);
    } catch (error: any) {
      toast.error('Failed to load subscription plans');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/admin/subscription-plans', editingPlan, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Plan updated successfully');
      setDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (error: any) {
      toast.error('Failed to update plan');
      console.error(error);
    }
  };

  const handleChange = (field: keyof SubscriptionPlan, value: any) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, [field]: value });
  };

  const filteredPlans = plans.filter(p => p.user_type === userTypeFilter);

  const getTierBadge = (tier: number) => {
    const colors: any = { 1: 'default', 2: 'primary', 3: 'secondary' };
    const labels = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };
    return <Chip label={labels[tier as keyof typeof labels]} color={colors[tier]} size="small" />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>Subscription Plans Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage pricing, limits, and features for Merchant and Courier subscription tiers
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={userTypeFilter} onChange={(e, v) => setUserTypeFilter(v)}>
          <Tab label="Merchant Plans" value="merchant" />
          <Tab label="Courier Plans" value="courier" />
        </Tabs>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tier</TableCell>
              <TableCell>Plan Name</TableCell>
              <TableCell>Monthly Price</TableCell>
              <TableCell>Annual Price</TableCell>
              <TableCell>Max Orders/Month</TableCell>
              {userTypeFilter === 'merchant' ? (
                <>
                  <TableCell>Max Shops</TableCell>
                  <TableCell>Max Couriers</TableCell>
                </>
              ) : (
                <TableCell>Max Team Members</TableCell>
              )}
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPlans.map((plan) => (
              <TableRow key={plan.plan_id}>
                <TableCell>{getTierBadge(plan.tier)}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>{plan.plan_name}</Typography>
                  {plan.is_popular && <Chip label="Popular" color="success" size="small" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>${plan.monthly_price.toFixed(2)}</TableCell>
                <TableCell>${plan.annual_price.toFixed(2)}</TableCell>
                <TableCell>{plan.max_orders_per_month ?? '∞'}</TableCell>
                {userTypeFilter === 'merchant' ? (
                  <>
                    <TableCell>{plan.max_shops ?? '∞'}</TableCell>
                    <TableCell>{plan.max_couriers ?? '∞'}</TableCell>
                  </>
                ) : (
                  <TableCell>{plan.max_team_members ?? '∞'}</TableCell>
                )}
                <TableCell>
                  <Chip 
                    label={plan.is_active ? 'Active' : 'Inactive'} 
                    color={plan.is_active ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleEdit(plan)} color="primary">
                    <Edit fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Subscription Plan: {editingPlan?.plan_name}</DialogTitle>
        <DialogContent>
          {editingPlan && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Editing <strong>{editingPlan.user_type === 'merchant' ? 'Merchant' : 'Courier'}</strong> plan - Tier {editingPlan.tier}
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plan Name"
                  value={editingPlan.plan_name}
                  onChange={(e) => handleChange('plan_name', e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editingPlan.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monthly Price"
                  type="number"
                  value={editingPlan.monthly_price}
                  onChange={(e) => handleChange('monthly_price', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Annual Price"
                  type="number"
                  value={editingPlan.annual_price}
                  onChange={(e) => handleChange('annual_price', parseFloat(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Usage Limits (leave empty for unlimited)</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Orders per Month"
                  type="number"
                  value={editingPlan.max_orders_per_month ?? ''}
                  onChange={(e) => handleChange('max_orders_per_month', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Emails per Month"
                  type="number"
                  value={editingPlan.max_emails_per_month ?? ''}
                  onChange={(e) => handleChange('max_emails_per_month', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
              </Grid>

              {editingPlan.user_type === 'merchant' ? (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Shops"
                      type="number"
                      value={editingPlan.max_shops ?? ''}
                      onChange={(e) => handleChange('max_shops', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Unlimited"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Couriers"
                      type="number"
                      value={editingPlan.max_couriers ?? ''}
                      onChange={(e) => handleChange('max_couriers', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Unlimited"
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Team Members"
                    type="number"
                    value={editingPlan.max_team_members ?? ''}
                    onChange={(e) => handleChange('max_team_members', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Unlimited"
                  />
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max SMS per Month"
                  type="number"
                  value={editingPlan.max_sms_per_month ?? ''}
                  onChange={(e) => handleChange('max_sms_per_month', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingPlan.is_popular}
                      onChange={(e) => handleChange('is_popular', e.target.checked)}
                    />
                  }
                  label="Mark as Popular"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingPlan.is_active}
                      onChange={(e) => handleChange('is_active', e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
