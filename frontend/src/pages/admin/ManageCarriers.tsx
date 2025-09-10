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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Phone,
  Email,
  LocalShipping,
  Star
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { apiClient } from '@/services/apiClient';
import toast from 'react-hot-toast';

interface Carrier {
  courier_id: string;
  courier_name: string;
  contact_email: string;
  contact_phone: string;
  service_areas: string[];
  is_active: boolean;
  trust_score?: number;
  total_orders?: number;
  created_at: string;
}

interface CarrierFormData {
  courier_name: string;
  contact_email: string;
  contact_phone: string;
  service_areas: string;
  is_active: boolean;
}

const schema = yup.object({
  courier_name: yup.string().required('Carrier name is required').max(255),
  contact_email: yup.string().email('Invalid email').required('Email is required'),
  contact_phone: yup.string().required('Phone is required'),
  service_areas: yup.string().required('Service areas are required'),
  is_active: yup.boolean().required(),
});

export const ManageCarriers: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const queryClient = useQueryClient();

  const { data: carriers = [] } = useQuery<Carrier[]>(
    'admin-carriers',
    async () => {
      const response = await apiClient.get<{ data: Carrier[] }>('/admin/carriers');
      return response.data.data;
    }
  );

  const createCarrierMutation = useMutation(
    async (data: CarrierFormData) => {
      const payload = {
        ...data,
        service_areas: data.service_areas.split(',').map(area => area.trim()),
      };
      const response = await apiClient.post('/admin/carriers', payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-carriers');
        setDialogOpen(false);
        reset();
        toast.success('Carrier created successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create carrier');
      },
    }
  );

  const updateCarrierMutation = useMutation(
    async ({ id, data }: { id: string; data: CarrierFormData }) => {
      const payload = {
        ...data,
        service_areas: data.service_areas.split(',').map(area => area.trim()),
      };
      const response = await apiClient.put(`/admin/carriers/${id}`, payload);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-carriers');
        setDialogOpen(false);
        setEditingCarrier(null);
        reset();
        toast.success('Carrier updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update carrier');
      },
    }
  );

  const deleteCarrierMutation = useMutation(
    async (id: string) => {
      const response = await apiClient.delete(`/admin/carriers/${id}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-carriers');
        toast.success('Carrier deleted successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete carrier');
      },
    }
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CarrierFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      courier_name: '',
      contact_email: '',
      contact_phone: '',
      service_areas: '',
      is_active: true,
    },
  });

  const handleOpenDialog = (carrier?: Carrier) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setValue('courier_name', carrier.courier_name);
      setValue('contact_email', carrier.contact_email);
      setValue('contact_phone', carrier.contact_phone);
      setValue('service_areas', carrier.service_areas.join(', '));
      setValue('is_active', carrier.is_active);
    } else {
      setEditingCarrier(null);
      reset();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCarrier(null);
    reset();
  };

  const onSubmit = (data: CarrierFormData) => {
    if (editingCarrier) {
      updateCarrierMutation.mutate({ id: editingCarrier.courier_id, data });
    } else {
      createCarrierMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this carrier?')) {
      deleteCarrierMutation.mutate(id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Manage Carriers
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Carrier
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Carrier</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Service Areas</TableCell>
              <TableCell>Trust Score</TableCell>
              <TableCell>Orders</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(carriers || []).map((carrier: Carrier) => (
              <TableRow key={carrier.courier_id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <LocalShipping />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {carrier.courier_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {carrier.courier_id.slice(0, 8)}...
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Email sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="body2">{carrier.contact_email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="body2">{carrier.contact_phone}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {carrier.service_areas.slice(0, 3).map((area, index) => (
                      <Chip key={index} label={area} size="small" />
                    ))}
                    {carrier.service_areas.length > 3 && (
                      <Chip label={`+${carrier.service_areas.length - 3} more`} size="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="body2">
                      {carrier.trust_score?.toFixed(1) || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {carrier.total_orders?.toLocaleString() || '0'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={carrier.is_active ? 'Active' : 'Inactive'}
                    color={carrier.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(carrier)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(carrier.courier_id)}
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
          {editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="courier_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Carrier Name"
                      error={!!errors.courier_name}
                      helperText={errors.courier_name?.message}
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
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12}>
                <Controller
                  name="service_areas"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Service Areas"
                      placeholder="Enter areas separated by commas (e.g., New York, Los Angeles, Chicago)"
                      multiline
                      rows={2}
                      error={!!errors.service_areas}
                      helperText={errors.service_areas?.message || 'Separate multiple areas with commas'}
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
            onClick={handleSubmit(onSubmit)}
            variant="contained"
            disabled={createCarrierMutation.isLoading || updateCarrierMutation.isLoading}
          >
            {editingCarrier ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
