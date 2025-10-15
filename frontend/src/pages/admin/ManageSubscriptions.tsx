import React, { useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Tab,
  Tabs,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  AttachMoney,
  People,
  TrendingUp
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  user_role: string;
  price_monthly: number;
  price_yearly: number;
  features_json: any;
  limits_json: any;
  is_active: boolean;
  active_subscribers?: number;
  monthly_revenue?: number;
}

interface Addon {
  addon_id: string;
  addon_name: string;
  addon_type: string;
  user_role: string;
  price: number;
  billing_cycle: string;
  description: string;
  is_active: boolean;
}

export const ManageSubscriptions: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch subscription plans from API
  const { data: plansData, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['admin', 'subscription-plans'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/subscription-plans');
      return response.data;
    }
  });

  // Fetch active subscriptions for statistics
  const { data: subscriptionsData, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: async () => {
      const response = await apiClient.get('/api/admin/subscriptions');
      return response.data;
    }
  });

  // Separate plans by role
  const merchantPlans: SubscriptionPlan[] = plansData?.data?.filter((p: SubscriptionPlan) => p.user_role === 'merchant') || [];
  const courierPlans: SubscriptionPlan[] = plansData?.data?.filter((p: SubscriptionPlan) => p.user_role === 'courier') || [];

  // Calculate statistics from subscriptions data
  const totalSubscribers = subscriptionsData?.data?.length || 0;
  const monthlyRevenue = subscriptionsData?.data?.reduce((sum: number, sub: any) => {
    const plan = plansData?.data?.find((p: SubscriptionPlan) => p.plan_id === sub.plan_id);
    return sum + (plan?.price_monthly || 0);
  }, 0) || 0;

  // Calculate subscriber count per plan
  const planSubscriberCounts = subscriptionsData?.data?.reduce((acc: any, sub: any) => {
    acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1;
    return acc;
  }, {}) || {};

  // Add subscriber counts and revenue to plans
  const enrichedMerchantPlans = merchantPlans.map(plan => ({
    ...plan,
    active_subscribers: planSubscriberCounts[plan.plan_id] || 0,
    monthly_revenue: (planSubscriberCounts[plan.plan_id] || 0) * plan.price_monthly
  }));

  const enrichedCourierPlans = courierPlans.map(plan => ({
    ...plan,
    active_subscribers: planSubscriberCounts[plan.plan_id] || 0,
    monthly_revenue: (planSubscriberCounts[plan.plan_id] || 0) * plan.price_monthly
  }));

  // Addons - keep empty for now (can be added later)
  const addons: Addon[] = [];

  // Mutation for updating plan
  const updatePlanMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const response = await apiClient.put('/api/admin/subscription-plans-v2', plan);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      setEditDialogOpen(false);
    }
  });

  // Mutation for creating plan
  const createPlanMutation = useMutation({
    mutationFn: async (plan: Partial<SubscriptionPlan>) => {
      const response = await apiClient.post('/api/admin/subscription-plans-v2', plan);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
      setEditDialogOpen(false);
    }
  });

  // Mutation for deleting plan
  const deletePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiClient.delete(`/api/admin/subscription-plans-v2?plan_id=${planId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscription-plans'] });
    }
  });

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleNewPlan = () => {
    setSelectedPlan({
      plan_id: '',
      plan_name: '',
      user_role: 'merchant',
      price_monthly: 0,
      price_yearly: 0,
      features_json: {},
      limits_json: {},
      is_active: true
    });
    setEditDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!selectedPlan) return;

    if (selectedPlan.plan_id) {
      // Update existing plan
      updatePlanMutation.mutate(selectedPlan);
    } else {
      // Create new plan
      createPlanMutation.mutate(selectedPlan);
    }
  };

  const handleDeletePlan = (planId: string) => {
    if (confirm('Are you sure you want to delete this plan? This cannot be undone.')) {
      deletePlanMutation.mutate(planId);
    }
  };

  const renderPlanTable = (plans: SubscriptionPlan[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Plan Name</TableCell>
            <TableCell>Monthly Price</TableCell>
            <TableCell>Yearly Price</TableCell>
            <TableCell>Limits</TableCell>
            <TableCell>Subscribers</TableCell>
            <TableCell>Revenue</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.plan_id}>
              <TableCell>{plan.plan_name}</TableCell>
              <TableCell>${plan.price_monthly}</TableCell>
              <TableCell>${plan.price_yearly}</TableCell>
              <TableCell>
                {plan.limits_json.couriers === -1 ? 'Unlimited' : plan.limits_json.couriers} couriers,{' '}
                {plan.limits_json.markets === -1 ? 'Unlimited' : plan.limits_json.markets} markets
              </TableCell>
              <TableCell>
                <Chip label={plan.active_subscribers} color="primary" size="small" />
              </TableCell>
              <TableCell>${plan.monthly_revenue?.toFixed(2)}</TableCell>
              <TableCell>
                <Chip 
                  label={plan.is_active ? 'Active' : 'Inactive'} 
                  color={plan.is_active ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => handleEditPlan(plan)}>
                  <Edit />
                </IconButton>
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleDeletePlan(plan.plan_id)}
                  disabled={deletePlanMutation.isPending}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Show loading state
  if (plansLoading || subscriptionsLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show error state
  if (plansError) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">
            Failed to load subscription plans. Please try again.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Subscription Management
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={handleNewPlan}
          >
            New Plan
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Total Subscribers
                    </Typography>
                    <Typography variant="h4">
                      {totalSubscribers}
                    </Typography>
                  </Box>
                  <People color="primary" sx={{ fontSize: 48 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Monthly Revenue
                    </Typography>
                    <Typography variant="h4">
                      ${monthlyRevenue.toFixed(2)}
                    </Typography>
                  </Box>
                  <AttachMoney color="success" sx={{ fontSize: 48 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      Active Plans
                    </Typography>
                    <Typography variant="h4">
                      {(merchantPlans.length + courierPlans.length)}
                    </Typography>
                  </Box>
                  <TrendingUp color="info" sx={{ fontSize: 48 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Merchant Plans" />
            <Tab label="Courier Plans" />
            <Tab label="Add-ons" />
          </Tabs>
        </Paper>

        {/* Merchant Plans Tab */}
        <TabPanel value={activeTab} index={0}>
          {enrichedMerchantPlans.length > 0 ? (
            renderPlanTable(enrichedMerchantPlans)
          ) : (
            <Alert severity="info">No merchant plans found.</Alert>
          )}
        </TabPanel>

        {/* Courier Plans Tab */}
        <TabPanel value={activeTab} index={1}>
          {enrichedCourierPlans.length > 0 ? (
            renderPlanTable(enrichedCourierPlans)
          ) : (
            <Alert severity="info">No courier plans found.</Alert>
          )}
        </TabPanel>

        {/* Add-ons Tab */}
        <TabPanel value={activeTab} index={2}>
          {addons.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Add-on Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Billing</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {addons.map((addon) => (
                    <TableRow key={addon.addon_id}>
                      <TableCell>{addon.addon_name}</TableCell>
                      <TableCell>
                        <Chip label={addon.addon_type} size="small" />
                      </TableCell>
                      <TableCell>{addon.user_role}</TableCell>
                      <TableCell>${addon.price}</TableCell>
                      <TableCell>{addon.billing_cycle}</TableCell>
                      <TableCell>
                        <Chip 
                          label={addon.is_active ? 'Active' : 'Inactive'} 
                          color={addon.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No add-ons configured yet. Add-ons allow users to purchase additional features beyond their subscription plan.
            </Alert>
          )}
        </TabPanel>

        {/* Edit/Create Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {selectedPlan?.plan_id ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plan Name"
                  value={selectedPlan?.plan_name || ''}
                  onChange={(e) => setSelectedPlan(prev => prev ? {...prev, plan_name: e.target.value} : null)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Monthly Price"
                  type="number"
                  value={selectedPlan?.price_monthly || 0}
                  onChange={(e) => setSelectedPlan(prev => prev ? {...prev, price_monthly: parseFloat(e.target.value)} : null)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Yearly Price"
                  type="number"
                  value={selectedPlan?.price_yearly || 0}
                  onChange={(e) => setSelectedPlan(prev => prev ? {...prev, price_yearly: parseFloat(e.target.value)} : null)}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Courier Limit"
                  type="number"
                  value={selectedPlan?.limits_json.couriers || 0}
                  helperText="-1 for unlimited"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Market Limit"
                  type="number"
                  value={selectedPlan?.limits_json.markets || 0}
                  helperText="-1 for unlimited"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEditDialogOpen(false)}
              disabled={updatePlanMutation.isPending || createPlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePlan} 
              variant="contained"
              disabled={updatePlanMutation.isPending || createPlanMutation.isPending}
            >
              {updatePlanMutation.isPending || createPlanMutation.isPending ? (
                <CircularProgress size={24} />
              ) : (
                selectedPlan?.plan_id ? 'Save Changes' : 'Create Plan'
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};
