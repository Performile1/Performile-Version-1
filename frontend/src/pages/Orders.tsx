import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Skeleton,
  Alert,
  Fab,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  Refresh,
  FileDownload,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface Order {
  order_id: string;
  tracking_number: string;
  order_number?: string;
  store_name?: string;
  courier_name?: string;
  consumer_email?: string;
  order_status: 'pending' | 'confirmed' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
  order_date: string;
  delivery_date?: string;
  estimated_delivery?: string;
  level_of_service?: string;
  type_of_delivery?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

interface OrderFormData {
  tracking_number: string;
  order_number: string;
  store_id: string;
  courier_id: string;
  consumer_id?: string;
  order_status: string;
  level_of_service: string;
  type_of_delivery: string;
  postal_code: string;
  city: string;
  country: string;
  estimated_delivery?: string;
}

const statusColors = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  picked_up: '#9c27b0',
  in_transit: '#ff5722',
  delivered: '#4caf50',
  cancelled: '#f44336',
  failed: '#795548',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

const Orders: React.FC = () => {
  const queryClient = useQueryClient();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    tracking_number: '',
    order_number: '',
    store_id: '',
    courier_id: '',
    consumer_id: '',
    order_status: 'pending',
    level_of_service: '',
    type_of_delivery: '',
    postal_code: '',
    city: '',
    country: '',
    estimated_delivery: '',
  });

  // Fetch orders
  const { data: orders = [], isLoading, error, refetch } = useQuery(
    ['orders', page, rowsPerPage, searchTerm, statusFilter, dateFilter],
    async () => {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFilter !== 'all' && { date_filter: dateFilter }),
      });
      
      const response = await apiClient.get(`/orders?${params}`);
      return response.data.orders || [];
    },
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
    }
  );

  // Fetch stores and couriers for form dropdowns
  const { data: stores = [] } = useQuery('stores', async () => {
    const response = await apiClient.get('/stores');
    return response.data.stores || [];
  });

  const { data: couriers = [] } = useQuery('couriers', async () => {
    const response = await apiClient.get('/couriers');
    return response.data.couriers || [];
  });

  // Create order mutation
  const createOrderMutation = useMutation(
    async (orderData: OrderFormData) => {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order created successfully');
        handleCloseDialog();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create order');
      },
    }
  );

  // Update order mutation
  const updateOrderMutation = useMutation(
    async ({ orderId, orderData }: { orderId: string; orderData: Partial<OrderFormData> }) => {
      const response = await apiClient.put(`/orders/${orderId}`, orderData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order updated successfully');
        handleCloseDialog();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update order');
      },
    }
  );

  // Delete order mutation
  const deleteOrderMutation = useMutation(
    async (orderId: string) => {
      await apiClient.delete(`/orders/${orderId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders');
        toast.success('Order deleted successfully');
        setAnchorEl(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete order');
      },
    }
  );

  // Event handlers
  const handleOpenDialog = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        tracking_number: order.tracking_number,
        order_number: order.order_number || '',
        store_id: '', // Will need to fetch from API
        courier_id: '', // Will need to fetch from API
        consumer_id: '',
        order_status: order.order_status,
        level_of_service: order.level_of_service || '',
        type_of_delivery: order.type_of_delivery || '',
        postal_code: order.postal_code || '',
        city: order.city || '',
        country: order.country || '',
        estimated_delivery: order.estimated_delivery || '',
      });
    } else {
      setEditingOrder(null);
      setFormData({
        tracking_number: '',
        order_number: '',
        store_id: '',
        courier_id: '',
        consumer_id: '',
        order_status: 'pending',
        level_of_service: '',
        type_of_delivery: '',
        postal_code: '',
        city: '',
        country: '',
        estimated_delivery: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrder(null);
  };

  const handleSubmit = () => {
    if (editingOrder) {
      updateOrderMutation.mutate({
        orderId: editingOrder.order_id,
        orderData: formData,
      });
    } else {
      createOrderMutation.mutate(formData);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, order: Order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrder(order);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrder(null);
  };

  const handleDelete = () => {
    if (selectedOrder) {
      deleteOrderMutation.mutate(selectedOrder.order_id);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get('/orders/export', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Orders exported successfully');
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={100} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load orders. Please try again.
        </Alert>
        <Button variant="contained" onClick={() => refetch()} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Orders Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownload />}
            onClick={handleExport}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            New Order
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="picked_up">Picked Up</MenuItem>
                  <MenuItem value="in_transit">In Transit</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date Range"
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tracking Number</TableCell>
                <TableCell>Order Number</TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Courier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Delivery Date</TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order: Order) => (
                <TableRow key={order.order_id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {order.tracking_number}
                    </Typography>
                  </TableCell>
                  <TableCell>{order.order_number || '-'}</TableCell>
                  <TableCell>{order.store_name || '-'}</TableCell>
                  <TableCell>{order.courier_name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabels[order.order_status]}
                      sx={{
                        backgroundColor: statusColors[order.order_status],
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(order.order_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {order.delivery_date
                      ? new Date(order.delivery_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {order.city && order.country
                      ? `${order.city}, ${order.country}`
                      : order.postal_code || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, order)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedOrder) handleOpenDialog(selectedOrder);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          // Handle view details
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOrder ? 'Edit Order' : 'Create New Order'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tracking Number"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Order Number"
                value={formData.order_number}
                onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Store</InputLabel>
                <Select
                  value={formData.store_id}
                  label="Store"
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                >
                  {stores.map((store: any) => (
                    <MenuItem key={store.store_id} value={store.store_id}>
                      {store.store_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Courier</InputLabel>
                <Select
                  value={formData.courier_id}
                  label="Courier"
                  onChange={(e) => setFormData({ ...formData, courier_id: e.target.value })}
                >
                  {couriers.map((courier: any) => (
                    <MenuItem key={courier.courier_id} value={courier.courier_id}>
                      {courier.courier_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.order_status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, order_status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="picked_up">Picked Up</MenuItem>
                  <MenuItem value="in_transit">In Transit</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Level of Service"
                value={formData.level_of_service}
                onChange={(e) => setFormData({ ...formData, level_of_service: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="3-letter code (e.g., USA)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Estimated Delivery"
                type="datetime-local"
                value={formData.estimated_delivery}
                onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createOrderMutation.isLoading || updateOrderMutation.isLoading}
          >
            {editingOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add order"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
        onClick={() => handleOpenDialog()}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Orders;
