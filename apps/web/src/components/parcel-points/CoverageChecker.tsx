/**
 * Coverage Checker Component
 * Week 4 Phase 7 - Map Integration
 * 
 * Check delivery coverage for a postal code
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Search,
  CheckCircle,
  Cancel,
  Home,
  Store,
  Lock,
  LocalShipping,
  Speed,
  TrendingUp
} from '@mui/icons-material';

interface CoverageData {
  courier_id: string;
  courier_name: string;
  service_type_id: string;
  service_name: string;
  is_covered: boolean;
  standard_delivery_days: number;
  home_delivery_available: boolean;
  parcel_shop_available: boolean;
  parcel_locker_available: boolean;
}

interface ParcelPoint {
  parcel_point_id: string;
  point_name: string;
  point_type: string;
  street_address: string;
  city: string;
  courier_name: string;
  latitude: number;
  longitude: number;
}

interface CoverageResponse {
  success: boolean;
  coverage: CoverageData[];
  parcel_points: ParcelPoint[];
  postal_code: string;
  summary: {
    total_couriers: number;
    home_delivery_available: number;
    parcel_shop_available: number;
    parcel_locker_available: number;
    fastest_delivery: number | null;
  };
}

export const CoverageChecker: React.FC = () => {
  const [postalCode, setPostalCode] = useState('');
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkCoverage = async () => {
    if (!postalCode.trim()) {
      setError('Please enter a postal code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parcel-points?action=coverage&postal_code=${postalCode}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError('No coverage information found for this postal code');
      }
    } catch (err) {
      setError('Error checking coverage');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkCoverage();
    }
  };

  return (
    <Card>
      <CardHeader
        title="Delivery Coverage Checker"
        subheader="Check which couriers deliver to your area"
      />

      <CardContent>
        {/* Search Input */}
        <Box display="flex" gap={2} mb={3}>
          <TextField
            fullWidth
            label="Postal Code"
            placeholder="e.g., 11120"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={checkCoverage}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            sx={{ minWidth: 120 }}
          >
            Check
          </Button>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Summary */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.light' }}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Coverage Summary for {data.postal_code}
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {data.summary.total_couriers}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Couriers Available
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {data.summary.home_delivery_available}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Home Delivery
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="info.main">
                      {data.summary.parcel_shop_available}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Parcel Shops
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {data.summary.parcel_locker_available}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Parcel Lockers
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              {data.summary.fastest_delivery && (
                <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
                  <Speed color="primary" />
                  <Typography variant="body2">
                    Fastest delivery: <strong>{data.summary.fastest_delivery} day{data.summary.fastest_delivery !== 1 ? 's' : ''}</strong>
                  </Typography>
                </Box>
              )}
            </Paper>

            {/* Courier Coverage List */}
            {data.coverage.length > 0 ? (
              <Paper variant="outlined" sx={{ mb: 3 }}>
                <Box p={2} bgcolor="grey.50">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Available Couriers
                  </Typography>
                </Box>
                <List>
                  {data.coverage.map((courier, index) => (
                    <React.Fragment key={courier.courier_id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemIcon>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          >
                            {courier.courier_name.charAt(0)}
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {courier.courier_name}
                              </Typography>
                              <Chip
                                label={`${courier.standard_delivery_days} day${courier.standard_delivery_days !== 1 ? 's' : ''}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                              {courier.home_delivery_available && (
                                <Chip
                                  icon={<Home />}
                                  label="Home Delivery"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                              )}
                              {courier.parcel_shop_available && (
                                <Chip
                                  icon={<Store />}
                                  label="Parcel Shop"
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                />
                              )}
                              {courier.parcel_locker_available && (
                                <Chip
                                  icon={<Lock />}
                                  label="Parcel Locker"
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            ) : (
              <Alert severity="warning" sx={{ mb: 3 }}>
                No couriers currently deliver to this postal code
              </Alert>
            )}

            {/* Nearby Parcel Points */}
            {data.parcel_points.length > 0 && (
              <Paper variant="outlined">
                <Box p={2} bgcolor="grey.50">
                  <Typography variant="subtitle2" fontWeight="bold">
                    Nearby Parcel Points ({data.parcel_points.length})
                  </Typography>
                </Box>
                <List>
                  {data.parcel_points.map((point, index) => (
                    <React.Fragment key={point.parcel_point_id}>
                      {index > 0 && <Divider />}
                      <ListItem>
                        <ListItemIcon>
                          {point.point_type === 'parcel_shop' ? <Store color="info" /> :
                           point.point_type === 'parcel_locker' ? <Lock color="success" /> :
                           <LocalShipping color="primary" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="subtitle2">
                                {point.point_name}
                              </Typography>
                              <Chip
                                label={point.courier_name}
                                size="small"
                                sx={{ mt: 0.5 }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box mt={0.5}>
                              <Typography variant="caption" display="block">
                                {point.street_address}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {point.city}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            )}
          </>
        )}

        {/* Initial State */}
        {!data && !loading && !error && (
          <Box textAlign="center" py={4}>
            <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Enter a postal code to check delivery coverage
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CoverageChecker;
