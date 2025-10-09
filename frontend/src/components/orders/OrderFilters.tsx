import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Collapse,
  IconButton,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import {
  FilterList,
  Clear,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface OrderFilterValues {
  search: string;
  statuses: string[];
  couriers: string[];
  stores: string[];
  countries: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
}

interface OrderFiltersProps {
  filters: OrderFilterValues;
  onFilterChange: (filters: OrderFilterValues) => void;
  couriers: Array<{ courier_id: string; courier_name: string }>;
  stores: Array<{ store_id: string; store_name: string }>;
  countries: string[];
}

const statusOptions = [
  { value: 'pending', label: 'Pending', color: '#ff9800' },
  { value: 'confirmed', label: 'Confirmed', color: '#2196f3' },
  { value: 'picked_up', label: 'Picked Up', color: '#9c27b0' },
  { value: 'in_transit', label: 'In Transit', color: '#ff5722' },
  { value: 'delivered', label: 'Delivered', color: '#4caf50' },
  { value: 'cancelled', label: 'Cancelled', color: '#f44336' },
  { value: 'failed', label: 'Failed', color: '#795548' },
];

const datePresets = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export const OrderFilters: React.FC<OrderFiltersProps> = ({
  filters,
  onFilterChange,
  couriers,
  stores,
  countries,
}) => {
  const [expanded, setExpanded] = useState(true);

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFilterChange({ ...filters, statuses: newStatuses });
  };

  const handleCourierChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFilterChange({ 
      ...filters, 
      couriers: typeof value === 'string' ? value.split(',') : value 
    });
  };

  const handleStoreChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFilterChange({ 
      ...filters, 
      stores: typeof value === 'string' ? value.split(',') : value 
    });
  };

  const handleCountryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    onFilterChange({ 
      ...filters, 
      countries: typeof value === 'string' ? value.split(',') : value 
    });
  };

  const handleDatePreset = (days: number) => {
    const today = new Date();
    const fromDate = days === 0 ? today : new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
    onFilterChange({
      ...filters,
      dateFrom: fromDate,
      dateTo: today,
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      statuses: [],
      couriers: [],
      stores: [],
      countries: [],
      dateFrom: null,
      dateTo: null,
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.statuses.length > 0 ||
    filters.couriers.length > 0 ||
    filters.stores.length > 0 ||
    filters.countries.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  const activeFilterCount = 
    (filters.search ? 1 : 0) +
    filters.statuses.length +
    filters.couriers.length +
    filters.stores.length +
    filters.countries.length +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterList />
            <Typography variant="h6">
              Filters
              {activeFilterCount > 0 && (
                <Chip 
                  label={activeFilterCount} 
                  size="small" 
                  color="primary" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            )}
            <IconButton
              size="small"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={expanded}>
          <Grid container spacing={2}>
            {/* Search */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search by tracking number, order number, customer..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </Grid>

            {/* Date Range Presets */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    size="small"
                    variant={
                      filters.dateFrom &&
                      filters.dateTo &&
                      Math.abs(filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24) === preset.days
                        ? 'contained'
                        : 'outlined'
                    }
                    onClick={() => handleDatePreset(preset.days)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </Box>
            </Grid>

            {/* Date From */}
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="From Date"
                  value={filters.dateFrom}
                  onChange={(date) => onFilterChange({ ...filters, dateFrom: date })}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Date To */}
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="To Date"
                  value={filters.dateTo}
                  onChange={(date) => onFilterChange({ ...filters, dateTo: date })}
                  slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                />
              </LocalizationProvider>
            </Grid>

            {/* Courier Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Couriers</InputLabel>
                <Select
                  multiple
                  value={filters.couriers}
                  onChange={handleCourierChange}
                  label="Couriers"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const courier = couriers.find(c => c.courier_id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={courier?.courier_name || value} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {couriers.map((courier) => (
                    <MenuItem key={courier.courier_id} value={courier.courier_id}>
                      {courier.courier_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Store Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Stores</InputLabel>
                <Select
                  multiple
                  value={filters.stores}
                  onChange={handleStoreChange}
                  label="Stores"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const store = stores.find(s => s.store_id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={store?.store_name || value} 
                            size="small" 
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {stores.map((store) => (
                    <MenuItem key={store.store_id} value={store.store_id}>
                      {store.store_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Status Filter */}
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {statusOptions.map((status) => (
                    <Chip
                      key={status.value}
                      label={status.label}
                      onClick={() => handleStatusToggle(status.value)}
                      color={filters.statuses.includes(status.value) ? 'primary' : 'default'}
                      variant={filters.statuses.includes(status.value) ? 'filled' : 'outlined'}
                      sx={{
                        borderColor: status.color,
                        ...(filters.statuses.includes(status.value) && {
                          backgroundColor: status.color,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: status.color,
                            opacity: 0.9,
                          },
                        }),
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Country Filter */}
            {countries.length > 0 && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Countries</InputLabel>
                  <Select
                    multiple
                    value={filters.countries}
                    onChange={handleCountryChange}
                    label="Countries"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};
