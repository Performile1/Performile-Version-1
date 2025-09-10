import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Avatar,
  Chip,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Store,
  Email,
  Phone,
  LocationOn,
  Business,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';

interface EcommerceStore {
  store_id: string;
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  website_url?: string;
  business_type: string;
  is_active: boolean;
  created_at: string;
  total_orders?: number;
  owner_name: string;
}

interface StoreFormData {
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  website_url?: string;
  business_type: string;
  is_active: boolean;
  owner_name: string;
}

const schema = yup.object({
  store_name: yup.string().required('Store name is required').max(255),
  store_description: yup.string().required('Description is required').max(1000),
  contact_email: yup.string().email('Invalid email').required('Email is required'),
  contact_phone: yup.string().required('Phone is required'),
  address: yup.string().required('Address is required'),
  website_url: yup.string().url('Invalid URL').notRequired(),
  business_type: yup.string().required('Business type is required'),
  is_active: yup.boolean().required(),
  owner_name: yup.string().required('Owner name is required').max(255),
});

const businessTypes = [
  'Retail',
  'Wholesale',
  'Manufacturing',
  'E-commerce',
  'Marketplace',
  'Dropshipping',
  'Subscription',
  'Other',
];

export const ManageStores: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<EcommerceStore | null>(null);
  const queryClient = useQueryClient();

  const { data: stores } = useQuery(
    'admin-stores',
    async () => {
      const response = await apiClient.get('/admin/stores');
      return response.data.data;
    }
  );

  const createStoreMutation = useMutation(
    async (data: StoreFormData) => {
      const response = await apiClient.post('/admin/stores', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-stores');
        setDialogOpen(false);
        reset();
        toast.success('Store created successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create store');
      },
    }
  );

  const updateStoreMutation = useMutation(
    async ({ id, data }: { id: string; data: StoreFormData }) => {
      const response = await apiClient.put(`/admin/stores/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-stores');
        setDialogOpen(false);
        setEditingStore(null);
        reset();
        toast.success('Store updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update store');
      },
    }
  );

  const deleteStoreMutation = useMutation(
    async (id: string) => {
      const response = await apiClient.delete(`/admin/stores/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-stores');
        toast.success('Store deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete store');
      },
    }
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      store_name: '',
      store_description: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      website_url: '',
      business_type: '',
      is_active: true,
      owner_name: '',
    },
  });

  const handleOpenDialog = (store?: EcommerceStore) => {
    if (store) {
      setEditingStore(store);
      setValue('store_name', store.store_name);
      setValue('store_description', store.store_description);
      setValue('contact_email', store.contact_email);
      setValue('contact_phone', store.contact_phone);
      setValue('address', store.address);
      setValue('website_url', store.website_url || '');
      setValue('business_type', store.business_type);
      setValue('is_active', store.is_active);
      setValue('owner_name', store.owner_name);
    } else {
      setEditingStore(null);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStore(null);
    reset();
  };

  const onSubmit = (data: StoreFormData) => {
    if (editingStore) {
      updateStoreMutation.mutate({ id: editingStore.store_id, data });
    } else {
      createStoreMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      deleteStoreMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage E-commerce Stores
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Store
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Store</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Business Type</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stores?.map((store: EcommerceStore) => (
              <TableRow key={store.store_id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                      <Store />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {store.store_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {store.store_description.length > 50
                          ? `${store.store_description.slice(0, 50)}...`
                          : store.store_description}
                      </Typography>
                      {store.website_url && (
                        <Typography variant="caption" display="block" color="primary">
                          {store.website_url}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Business sx={{ fontSize: 16, mr: 1 }} />
                    <Typography variant="body2">{store.owner_name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Email sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="body2">{store.contact_email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Phone sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="body2">{store.contact_phone}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {store.address}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={store.business_type} size="small" color="info" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {store.total_orders?.toLocaleString() || '0'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={store.is_active ? 'Active' : 'Inactive'}
                    color={store.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(store)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(store.store_id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStore ? 'Edit Store' : 'Add New Store'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="store_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Store Name"
                      error={!!errors.store_name}
                      helperText={errors.store_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="owner_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Owner Name"
                      error={!!errors.owner_name}
                      helperText={errors.owner_name?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="store_description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Store Description"
                      multiline
                      rows={3}
                      error={!!errors.store_description}
                      helperText={errors.store_description?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="contact_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Email"
                      type="email"
                      error={!!errors.contact_email}
                      helperText={errors.contact_email?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="contact_phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Contact Phone"
                      error={!!errors.contact_phone}
                      helperText={errors.contact_phone?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Business Address"
                      multiline
                      rows={2}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="website_url"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Website URL (Optional)"
                      placeholder="https://example.com"
                      error={!!errors.website_url}
                      helperText={errors.website_url?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="business_type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.business_type}>
                      <InputLabel>Business Type</InputLabel>
                      <Select {...field} label="Business Type">
                        {businessTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.business_type && (
                        <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                          {errors.business_type.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="is_active"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} checked={field.value} />}
                      label="Active"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit(onSubmit as any)}
            variant="contained"
            disabled={createStoreMutation.isLoading || updateStoreMutation.isLoading}
          >
            {editingStore ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
