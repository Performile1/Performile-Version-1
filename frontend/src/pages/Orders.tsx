import React, { useState } from 'react';
import {
  Box,
  Card,
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
  Link,
  Menu,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  MoreVert,
  FileDownload,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';
import { exportOrdersToCSV } from '@/utils/exportToCSV';
import { OrderFilters, OrderFilterValues } from '@/components/orders/OrderFilters';
import { BulkActionsBar } from '@/components/orders/BulkActionsBar';
import { OrderDetailsDrawer } from '@/components/orders/OrderDetailsDrawer';

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
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Advanced filters state
  const [filters, setFilters] = useState<OrderFilterValues>({
    search: '',
    statuses: [],
    couriers: [],
    stores: [],
    countries: [],
    dateFrom: null,
    dateTo: null,
  });

  // Bulk selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Quick view drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerOrder, setDrawerOrder] = useState<Order | null>(null);

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
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['orders', page, rowsPerPage, filters, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        ...(filters.search && { search: filters.search }),
        sort_by: sortBy,
        sort_order: sortOrder,
        _t: Date.now().toString(), // Cache buster
      });

      // Add status filters
      filters.statuses.forEach(status => {
        params.append('status[]', status);
      });

      // Add courier filters
      filters.couriers.forEach(courier => {
        params.append('courier_id[]', courier);
      });

      // Add store filters
      filters.stores.forEach(store => {
        params.append('store_id[]', store);
      });

      // Add country filters
      filters.countries.forEach(country => {
        params.append('country[]', country);
      });

      // Add date filters
      if (filters.dateFrom) {
        params.append('date_from', filters.dateFrom.toISOString().split('T')[0]);
      }
      if (filters.dateTo) {
        params.append('date_to', filters.dateTo.toISOString().split('T')[0]);
      }

      const response = await apiClient.get(`/orders?${params}`);
      return response.data.orders || [];
    },
    placeholderData: keepPreviousData,
    staleTime: 0, // Disable stale time to force fresh data
    cacheTime: 0, // Disable cache completely
  });

  // Get unique countries from orders for filter
  const uniqueCountries = Array.from(new Set(orders.map((order: Order) => order.country).filter(Boolean))) as string[];

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Fetch stores and couriers for form dropdowns
  const { data: stores = [] } = useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const response = await apiClient.get('/stores');
      return response.data.data || response.data.stores || [];
    }
  });

  const { data: couriers = [] } = useQuery({
    queryKey: ['couriers'],
    queryFn: async () => {
      const response = await apiClient.get('/couriers');
      return response.data.data || response.data.couriers || [];
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: OrderFormData) => {
      const response = await apiClient.post('/orders', orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, orderData }: { orderId: string; orderData: Partial<OrderFormData> }) => {
      const response = await apiClient.put(`/orders/${orderId}`, orderData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order updated successfully');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order');
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.delete(`/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order deleted successfully');
      setAnchorEl(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    },
  });

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

  const handleExport = () => {
    try {
      if (!orders || orders.length === 0) {
        toast.error('No orders to export');
        return;
      }
      
      // Export current filtered/searched orders
      exportOrdersToCSV(orders);
      toast.success(`Exported ${orders.length} orders successfully`);
    } catch (error) {
      toast.error('Failed to export orders');
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allOrderIds = new Set<string>(orders.map((order: Order) => order.order_id));
      setSelectedOrders(allOrderIds);
    } else {
      setSelectedOrders(new Set<string>());
    }
  };

  const handleSelectOne = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleBulkUpdateStatus = async (status: string) => {
    try {
      const orderIds = Array.from(selectedOrders);
      await apiClient.post('/orders/bulk-update', {
        order_ids: orderIds,
        status: status,
      });
      toast.success(`Updated ${orderIds.length} orders to ${status}`);
      setSelectedOrders(new Set());
      refetch();
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  const handleBulkExport = () => {
    const selectedOrdersData = orders.filter((order: Order) => 
      selectedOrders.has(order.order_id)
    );
    exportOrdersToCSV(selectedOrdersData);
    toast.success(`Exported ${selectedOrdersData.length} orders`);
  };

  const handleBulkDelete = async () => {
    try {
      const orderIds = Array.from(selectedOrders);
      await apiClient.post('/orders/bulk-delete', {
        order_ids: orderIds,
      });
      toast.success(`Deleted ${orderIds.length} orders`);
      setSelectedOrders(new Set());
      refetch();
    } catch (error) {
      toast.error('Failed to delete orders');
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
        <Button variant="contained" onClick={() => refetch()}>
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

      {/* Advanced Filters */}
      <OrderFilters
        filters={filters}
        onFilterChange={setFilters}
        couriers={couriers}
        stores={stores}
        countries={uniqueCountries}
      />

      {/* Orders Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedOrders.size > 0 && selectedOrders.size < orders.length}
                    checked={orders.length > 0 && selectedOrders.size === orders.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('tracking_number')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Tracking Number
                    {sortBy === 'tracking_number' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('order_number')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Order Number
                    {sortBy === 'order_number' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('store_name')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Store
                    {sortBy === 'store_name' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('courier_name')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Courier
                    {sortBy === 'courier_name' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('order_status')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Status
                    {sortBy === 'order_status' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('order_date')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Order Date
                    {sortBy === 'order_date' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell 
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('delivery_date')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Delivery Date
                    {sortBy === 'delivery_date' && (
                      sortOrder === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>Location</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order: Order) => (
                <TableRow 
                  key={order.order_id} 
                  hover
                  selected={selectedOrders.has(order.order_id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedOrders.has(order.order_id)}
                      onChange={() => handleSelectOne(order.order_id)}
                    />
                  </TableCell>
                  <TableCell>
                    {order.tracking_number ? (
                      <Link
                        href={`/track/${order.tracking_number}`}
                        sx={{
                          fontFamily: 'monospace',
                          textDecoration: 'none',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {order.tracking_number}
                      </Link>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
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
                      onClick={() => {
                        setDrawerOrder(order);
                        setDrawerOpen(true);
                      }}
                      size="small"
                      title="Quick View"
                    >
                      <Visibility />
                    </IconButton>
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
            disabled={createOrderMutation.isPending || updateOrderMutation.isPending}
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

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedOrders.size}
        onUpdateStatus={handleBulkUpdateStatus}
        onExport={handleBulkExport}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedOrders(new Set())}
      />

      {/* Quick View Drawer */}
      <OrderDetailsDrawer
        open={drawerOpen}
        order={drawerOrder}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerOrder(null);
        }}
        onViewFull={(orderId) => {
          // Navigate to full order details page if it exists
          window.location.href = `/orders/${orderId}`;
        }}
      />
    </Box>
  );
};

export default Orders;
