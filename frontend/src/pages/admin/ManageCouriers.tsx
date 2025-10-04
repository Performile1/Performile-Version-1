import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Alert,
  Rating,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  LocalShipping as CourierIcon,
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface Courier {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
  last_login: string;
  trust_score: number;
  total_deliveries: number;
  successful_deliveries: number;
  avg_rating: number;
  total_reviews: number;
  leads_downloaded: number;
  competitor_data_purchased: number;
  revenue_generated: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ManageCouriers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch couriers data
  const { data: couriersData, isLoading } = useQuery({
    queryKey: ['admin-couriers', filterStatus],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', {
        params: { role: 'courier', status: filterStatus }
      });
      return response.data;
    }
  });

  const couriers: Courier[] = couriersData?.data || [];

  const filteredCouriers = couriers.filter(courier =>
    courier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${courier.first_name} ${courier.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, courier: Courier) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourier(courier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleViewDetails = () => {
    setDetailsOpen(true);
    handleMenuClose();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'success';
      case 'tier2': return 'primary';
      case 'tier1': return 'default';
      default: return 'default';
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'Premium';
      case 'tier2': return 'Professional';
      case 'tier1': return 'Basic';
      default: return tier;
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 50) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Courier Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage courier accounts, performance, and activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Couriers
                  </Typography>
                  <Typography variant="h4">
                    {couriers.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CourierIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Couriers
                  </Typography>
                  <Typography variant="h4">
                    {couriers.filter(c => c.is_active).length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <ActiveIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg Trust Score
                  </Typography>
                  <Typography variant="h4">
                    {couriers.length > 0 
                      ? (couriers.reduce((sum, c) => sum + c.trust_score, 0) / couriers.length).toFixed(1)
                      : '0.0'}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <StarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Deliveries
                  </Typography>
                  <Typography variant="h4">
                    {couriers.reduce((sum, c) => sum + c.total_deliveries, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search couriers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={filterStatus === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('all')}
                  size="small"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('active')}
                  size="small"
                  color="success"
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'inactive' ? 'contained' : 'outlined'}
                  onClick={() => setFilterStatus('inactive')}
                  size="small"
                  color="error"
                >
                  Inactive
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Couriers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Courier</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell align="center">Trust Score</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="center">Deliveries</TableCell>
                <TableCell align="center">Success Rate</TableCell>
                <TableCell align="center">Leads</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Loading couriers...
                  </TableCell>
                </TableRow>
              ) : filteredCouriers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No couriers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCouriers.map((courier) => (
                  <TableRow key={courier.user_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {courier.first_name?.[0]}{courier.last_name?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {courier.first_name} {courier.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {courier.user_id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" />
                          {courier.email}
                        </Typography>
                        {courier.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            {courier.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTierLabel(courier.subscription_tier)}
                        color={getTierColor(courier.subscription_tier)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={courier.trust_score.toFixed(1)}
                        color={getTrustScoreColor(courier.trust_score)}
                        size="small"
                        icon={<StarIcon />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Rating value={courier.avg_rating} readOnly size="small" precision={0.1} />
                        <Typography variant="caption" color="text.secondary">
                          ({courier.total_reviews} reviews)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {courier.total_deliveries}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" fontWeight="medium" gutterBottom>
                          {courier.total_deliveries > 0 
                            ? Math.round((courier.successful_deliveries / courier.total_deliveries) * 100)
                            : 0}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={courier.total_deliveries > 0 
                            ? (courier.successful_deliveries / courier.total_deliveries) * 100
                            : 0}
                          color={courier.successful_deliveries / courier.total_deliveries >= 0.9 ? 'success' : 'primary'}
                        />
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {courier.leads_downloaded}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={courier.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={courier.is_active ? 'Active' : 'Inactive'}
                        color={courier.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, courier)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <EmailIcon fontSize="small" sx={{ mr: 1 }} />
          Send Email
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
          Export Data
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Courier Details: {selectedCourier?.first_name} {selectedCourier?.last_name}
        </DialogTitle>
        <DialogContent>
          {selectedCourier && (
            <Box>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Overview" />
                <Tab label="Performance" />
                <Tab label="Activity" />
                <Tab label="Revenue" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" gutterBottom>{selectedCourier.email}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" gutterBottom>{selectedCourier.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Subscription</Typography>
                    <Chip label={getTierLabel(selectedCourier.subscription_tier)} color={getTierColor(selectedCourier.subscription_tier)} size="small" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedCourier.is_active ? 'Active' : 'Inactive'} color={selectedCourier.is_active ? 'success' : 'default'} size="small" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                    <Typography variant="body1">{new Date(selectedCourier.created_at).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                    <Typography variant="body1">{selectedCourier.last_login ? new Date(selectedCourier.last_login).toLocaleDateString() : 'Never'}</Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4" color={getTrustScoreColor(selectedCourier.trust_score)}>{selectedCourier.trust_score.toFixed(1)}</Typography>
                        <Typography variant="body2" color="text.secondary">Trust Score</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h4">{selectedCourier.avg_rating.toFixed(1)}</Typography>
                          <StarIcon color="warning" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">Average Rating</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedCourier.total_deliveries}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Deliveries</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4" color="success.main">
                          {selectedCourier.total_deliveries > 0 
                            ? Math.round((selectedCourier.successful_deliveries / selectedCourier.total_deliveries) * 100)
                            : 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedCourier.leads_downloaded}</Typography>
                        <Typography variant="body2" color="text.secondary">Leads Downloaded</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedCourier.competitor_data_purchased}</Typography>
                        <Typography variant="body2" color="text.secondary">Data Purchased</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>Activity timeline will be displayed here</Alert>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      ${selectedCourier.revenue_generated.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue Generated
                    </Typography>
                  </CardContent>
                </Card>
              </TabPanel>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
