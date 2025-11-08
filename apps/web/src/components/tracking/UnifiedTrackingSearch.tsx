import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Typography,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import {
  Search,
  FilterList,
  Clear,
  Refresh,
  LocalShipping,
  CheckCircle,
  Schedule,
  Error as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface TrackingResult {
  order_id: string;
  tracking_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  delivery_address: {
    address: string;
    postal_code: string;
    city: string;
    country: string;
  };
  estimated_delivery: string;
  created_at: string;
  store: {
    store_id: string;
    store_name: string;
  };
  courier: {
    courier_id: string;
    courier_name: string;
    courier_code: string;
    logo_url: string;
    tracking_url: string | null;
  };
  last_event: {
    timestamp: string;
    description: string;
    location: string;
  } | null;
}

interface SearchFilters {
  query: string;
  courier: string;
  status: string;
  store_id: string;
  date_from: string;
  date_to: string;
}

export const UnifiedTrackingSearch: React.FC = () => {
  const { token } = useAuthStore();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    courier: '',
    status: '',
    store_id: '',
    date_from: '',
    date_to: ''
  });
  const [results, setResults] = useState<TrackingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  // Load couriers and stores on mount
  useEffect(() => {
    loadCouriers();
    loadStores();
  }, []);

  const loadCouriers = async () => {
    try {
      const response = await axios.get('/api/couriers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCouriers(response.data.couriers || []);
    } catch (error) {
      console.error('Failed to load couriers:', error);
    }
  };

  const loadStores = async () => {
    try {
      const response = await axios.get('/api/stores', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const handleSearch = async (newPage = 1) => {
    setLoading(true);
    setPage(newPage);

    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('q', filters.query);
      if (filters.courier) params.append('courier', filters.courier);
      if (filters.status) params.append('status', filters.status);
      if (filters.store_id) params.append('store_id', filters.store_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('page', newPage.toString());
      params.append('per_page', '20');

      const response = await axios.get(`/api/tracking/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(response.data.results);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.total_pages);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.error || 'Failed to search tracking');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      courier: '',
      status: '',
      store_id: '',
      date_from: '',
      date_to: ''
    });
    setResults([]);
    setPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle color="success" />;
      case 'in_transit':
      case 'out_for_delivery':
        return <LocalShipping color="primary" />;
      case 'exception':
      case 'returned':
        return <ErrorIcon color="error" />;
      default:
        return <Schedule color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'in_transit':
      case 'out_for_delivery':
        return 'primary';
      case 'exception':
      case 'returned':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Search Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Search Tracking
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Search across all couriers, stores, and orders
        </Typography>

        <Grid container spacing={2}>
          {/* Search Query */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Tracking number, order ID, customer email..."
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          {/* Courier Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Courier</InputLabel>
              <Select
                value={filters.courier}
                onChange={(e) => setFilters({ ...filters, courier: e.target.value })}
                label="Courier"
              >
                <MenuItem value="">All Couriers</MenuItem>
                {couriers.map((courier) => (
                  <MenuItem key={courier.courier_id} value={courier.courier_code.toLowerCase()}>
                    {courier.courier_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="picked_up">Picked Up</MenuItem>
                <MenuItem value="in_transit">In Transit</MenuItem>
                <MenuItem value="out_for_delivery">Out for Delivery</MenuItem>
                <MenuItem value="delivered">Delivered</MenuItem>
                <MenuItem value="exception">Exception</MenuItem>
                <MenuItem value="returned">Returned</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Store Filter */}
          {stores.length > 1 && (
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Store</InputLabel>
                <Select
                  value={filters.store_id}
                  onChange={(e) => setFilters({ ...filters, store_id: e.target.value })}
                  label="Store"
                >
                  <MenuItem value="">All Stores</MenuItem>
                  {stores.map((store) => (
                    <MenuItem key={store.store_id} value={store.store_id}>
                      {store.store_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={() => handleSearch()}
                disabled={loading}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => handleSearch(page)}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : results.length > 0 ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {total} results
          </Typography>

          {results.map((result) => (
            <Paper key={result.order_id} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                {/* Courier Logo */}
                <Grid item>
                  <Avatar
                    src={result.courier.logo_url}
                    alt={result.courier.courier_name}
                    sx={{ width: 48, height: 48 }}
                  >
                    <LocalShipping />
                  </Avatar>
                </Grid>

                {/* Tracking Info */}
                <Grid item xs>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6">
                      {result.courier.courier_name}
                    </Typography>
                    <Chip
                      label={result.tracking_number}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={getStatusIcon(result.status)}
                      label={result.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={getStatusColor(result.status) as any}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {result.customer_name} • {result.store.store_name}
                  </Typography>

                  {result.last_event && (
                    <Typography variant="body2" color="text.secondary">
                      📍 {result.last_event.description} • {result.last_event.location} •{' '}
                      {formatDate(result.last_event.timestamp)}
                    </Typography>
                  )}

                  {result.estimated_delivery && (
                    <Typography variant="body2" color="text.secondary">
                      📅 ETA: {formatDate(result.estimated_delivery)}
                    </Typography>
                  )}
                </Grid>

                {/* Actions */}
                <Grid item>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {result.courier.tracking_url && (
                      <Tooltip title="Track on courier website">
                        <IconButton
                          size="small"
                          onClick={() => window.open(result.courier.tracking_url!, '_blank')}
                        >
                          <LocalShipping />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => window.location.href = `/orders/${result.order_id}`}
                    >
                      View Details
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
              <Button
                disabled={page === 1}
                onClick={() => handleSearch(page - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ py: 1, px: 2 }}>
                Page {page} of {totalPages}
              </Typography>
              <Button
                disabled={page === totalPages}
                onClick={() => handleSearch(page + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">
          No tracking results found. Try adjusting your search filters.
        </Alert>
      )}
    </Box>
  );
};
