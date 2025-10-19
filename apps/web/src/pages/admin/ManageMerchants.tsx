import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { UserAvatar } from '@/components/common/UserAvatar';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';

interface Merchant {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  subscription_tier: string;
  created_at: string;
  last_login: string;
  store_count: number;
  leads_posted: number;
  leads_downloaded: number;
  revenue_generated: number;
  active_leads: number;
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

export const ManageMerchants: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch merchants data
  const { data: merchantsData, isLoading } = useQuery({
    queryKey: ['admin-merchants', filterStatus],
    queryFn: async () => {
      const response = await apiClient.get('/admin/users', {
        params: { role: 'merchant', status: filterStatus }
      });
      return response.data;
    }
  });

  const merchants: Merchant[] = Array.isArray(merchantsData?.data) ? merchantsData.data : [];

  const filteredMerchants = merchants.filter(merchant =>
    merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${merchant.first_name} ${merchant.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, merchant: Merchant) => {
    setAnchorEl(event.currentTarget);
    setSelectedMerchant(merchant);
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Merchant Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage merchant accounts, subscriptions, and activity
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
                    Total Merchants
                  </Typography>
                  <Typography variant="h4">
                    {merchants.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <StoreIcon />
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
                    Active Merchants
                  </Typography>
                  <Typography variant="h4">
                    {merchants.filter(m => m.is_active).length}
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
                    Total Leads Posted
                  </Typography>
                  <Typography variant="h4">
                    {merchants.reduce((sum, m) => sum + m.leads_posted, 0)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
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
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${merchants.reduce((sum, m) => sum + m.revenue_generated, 0).toLocaleString()}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <MoneyIcon />
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
                placeholder="Search merchants..."
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

      {/* Merchants Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Merchant</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell align="center">Stores</TableCell>
                <TableCell align="center">Leads Posted</TableCell>
                <TableCell align="center">Active Leads</TableCell>
                <TableCell align="center">Revenue</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Loading merchants...
                  </TableCell>
                </TableRow>
              ) : filteredMerchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No merchants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredMerchants.map((merchant) => (
                  <TableRow key={merchant.user_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UserAvatar
                          name={`${merchant.first_name} ${merchant.last_name}`}
                          size="medium"
                          type="consumer"
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {merchant.first_name} {merchant.last_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {merchant.user_id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" />
                          {merchant.email}
                        </Typography>
                        {merchant.phone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon fontSize="small" />
                            {merchant.phone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTierLabel(merchant.subscription_tier)}
                        color={getTierColor(merchant.subscription_tier)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {merchant.store_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {merchant.leads_posted}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={merchant.active_leads}
                        color={merchant.active_leads > 0 ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium" color="success.main">
                        ${merchant.revenue_generated.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={merchant.is_active ? <ActiveIcon /> : <InactiveIcon />}
                        label={merchant.is_active ? 'Active' : 'Inactive'}
                        color={merchant.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuClick(e, merchant)}
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
          Merchant Details: {selectedMerchant?.first_name} {selectedMerchant?.last_name}
        </DialogTitle>
        <DialogContent>
          {selectedMerchant && (
            <Box>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Overview" />
                <Tab label="Activity" />
                <Tab label="Leads" />
                <Tab label="Revenue" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" gutterBottom>{selectedMerchant.email}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" gutterBottom>{selectedMerchant.phone || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Subscription</Typography>
                    <Chip label={getTierLabel(selectedMerchant.subscription_tier)} color={getTierColor(selectedMerchant.subscription_tier)} size="small" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Chip label={selectedMerchant.is_active ? 'Active' : 'Inactive'} color={selectedMerchant.is_active ? 'success' : 'default'} size="small" />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                    <Typography variant="body1">{new Date(selectedMerchant.created_at).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Last Login</Typography>
                    <Typography variant="body1">{selectedMerchant.last_login ? new Date(selectedMerchant.last_login).toLocaleDateString() : 'Never'}</Typography>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Alert severity="info">Activity timeline will be displayed here</Alert>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedMerchant.leads_posted}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Leads Posted</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedMerchant.active_leads}</Typography>
                        <Typography variant="body2" color="text.secondary">Active Leads</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedMerchant.leads_downloaded}</Typography>
                        <Typography variant="body2" color="text.secondary">Total Downloads</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h4">{selectedMerchant.leads_downloaded > 0 ? Math.round((selectedMerchant.leads_downloaded / selectedMerchant.leads_posted) * 100) : 0}%</Typography>
                        <Typography variant="body2" color="text.secondary">Conversion Rate</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h3" color="success.main" gutterBottom>
                      ${selectedMerchant.revenue_generated.toLocaleString()}
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
