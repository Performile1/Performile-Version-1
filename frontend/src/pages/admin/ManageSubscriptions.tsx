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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Tab,
  Tabs,
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

interface TabPanelProps {
  children?: React.Node;
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
  
  // Mock data - would come from API
  const merchantPlans: SubscriptionPlan[] = [
    {
      plan_id: '1',
      plan_name: 'Merchant Tier 1',
      user_role: 'merchant',
      price_monthly: 29.00,
      price_yearly: 290.00,
      features_json: { features: ['2 couriers', '2 markets', 'Lead marketplace'] },
      limits_json: { couriers: 2, markets: 2 },
      is_active: true,
      active_subscribers: 45,
      monthly_revenue: 1305.00
    },
    {
      plan_id: '2',
      plan_name: 'Merchant Tier 2',
      user_role: 'merchant',
      price_monthly: 79.00,
      price_yearly: 790.00,
      features_json: { features: ['4 couriers', '4 markets', 'Data export'] },
      limits_json: { couriers: 4, markets: 4 },
      is_active: true,
      active_subscribers: 28,
      monthly_revenue: 2212.00
    },
    {
      plan_id: '3',
      plan_name: 'Merchant Tier 3',
      user_role: 'merchant',
      price_monthly: 199.00,
      price_yearly: 1990.00,
      features_json: { features: ['Unlimited', 'Postal codes', 'API access'] },
      limits_json: { couriers: -1, markets: -1 },
      is_active: true,
      active_subscribers: 12,
      monthly_revenue: 2388.00
    }
  ];

  const courierPlans: SubscriptionPlan[] = [
    {
      plan_id: '4',
      plan_name: 'Courier Tier 1',
      user_role: 'courier',
      price_monthly: 19.00,
      price_yearly: 190.00,
      features_json: { features: ['1 market', 'Performance dashboard'] },
      limits_json: { markets: 1 },
      is_active: true,
      active_subscribers: 67,
      monthly_revenue: 1273.00
    },
    {
      plan_id: '5',
      plan_name: 'Courier Tier 2',
      user_role: 'courier',
      price_monthly: 49.00,
      price_yearly: 490.00,
      features_json: { features: ['4 markets', 'Data export'] },
      limits_json: { markets: 4 },
      is_active: true,
      active_subscribers: 34,
      monthly_revenue: 1666.00
    },
    {
      plan_id: '6',
      plan_name: 'Courier Tier 3',
      user_role: 'courier',
      price_monthly: 99.00,
      price_yearly: 990.00,
      features_json: { features: ['Unlimited markets', 'API access'] },
      limits_json: { markets: -1 },
      is_active: true,
      active_subscribers: 15,
      monthly_revenue: 1485.00
    }
  ];

  const addons: Addon[] = [
    {
      addon_id: '1',
      addon_name: 'Extra Market Access',
      addon_type: 'market',
      user_role: 'merchant',
      price: 15.00,
      billing_cycle: 'monthly',
      description: 'Add 1 additional market',
      is_active: true
    },
    {
      addon_id: '2',
      addon_name: 'Postal Code Deep Dive',
      addon_type: 'postal_code',
      user_role: 'courier',
      price: 20.00,
      billing_cycle: 'monthly',
      description: 'Unlock postal code analytics',
      is_active: true
    }
  ];

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setEditDialogOpen(true);
  };

  const handleSavePlan = () => {
    // API call to save plan
    console.log('Saving plan:', selectedPlan);
    setEditDialogOpen(false);
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
                <IconButton size="small" color="error">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Subscription Management
          </Typography>
          <Button variant="contained" startIcon={<Add />}>
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
                      201
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
                      $10,329
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
                      Growth Rate
                    </Typography>
                    <Typography variant="h4">
                      +12.5%
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
          {renderPlanTable(merchantPlans)}
        </TabPanel>

        {/* Courier Plans Tab */}
        <TabPanel value={activeTab} index={1}>
          {renderPlanTable(courierPlans)}
        </TabPanel>

        {/* Add-ons Tab */}
        <TabPanel value={activeTab} index={2}>
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
        </TabPanel>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
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
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePlan} variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};
