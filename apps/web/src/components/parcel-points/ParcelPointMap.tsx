/**
 * Parcel Point Map Component
 * Week 4 Phase 7 - Map Integration
 * 
 * Interactive map displaying parcel points with search and filters
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search,
  MyLocation,
  FilterList,
  Store,
  Lock,
  Room,
  DirectionsWalk,
  Schedule,
  Phone,
  Info
} from '@mui/icons-material';

interface ParcelPoint {
  parcel_point_id: string;
  courier_name: string;
  point_name: string;
  point_type: 'parcel_shop' | 'parcel_locker' | 'service_point';
  street_address: string;
  postal_code: string;
  city: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  facilities: string[];
  hours_type: string;
  total_compartments?: number;
  available_compartments?: number;
}

interface ParcelPointMapProps {
  onLocationSelect?: (point: ParcelPoint) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export const ParcelPointMap: React.FC<ParcelPointMapProps> = ({
  onLocationSelect,
  initialCenter = { lat: 59.3293, lng: 18.0686 }, // Stockholm
  initialZoom = 12
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pointType, setPointType] = useState<string>('all');
  const [parcelPoints, setParcelPoints] = useState<ParcelPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<ParcelPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user's current location
  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          searchNearbyPoints(location.lat, location.lng);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Unable to get your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  // Search nearby parcel points
  const searchNearbyPoints = async (lat: number, lng: number, radius: number = 5) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        action: 'nearby',
        latitude: lat.toString(),
        longitude: lng.toString(),
        radius_km: radius.toString()
      });

      if (pointType !== 'all') {
        params.append('point_type', pointType);
      }

      const response = await fetch(`/api/parcel-points?${params}`);
      const data = await response.json();

      if (data.success) {
        setParcelPoints(data.data);
      } else {
        setError('Failed to load parcel points');
      }
    } catch (err) {
      setError('Error loading parcel points');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Search by city/postal code
  const searchByQuery = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        city: searchQuery
      });

      if (pointType !== 'all') {
        params.append('point_type', pointType);
      }

      const response = await fetch(`/api/parcel-points?${params}`);
      const data = await response.json();

      if (data.success) {
        setParcelPoints(data.data);
      } else {
        setError('No results found');
      }
    } catch (err) {
      setError('Error searching parcel points');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for point type
  const getPointIcon = (type: string) => {
    switch (type) {
      case 'parcel_shop':
        return <Store />;
      case 'parcel_locker':
        return <Lock />;
      default:
        return <Room />;
    }
  };

  // Get color for point type
  const getPointColor = (type: string): string => {
    switch (type) {
      case 'parcel_shop':
        return '#2196f3'; // Blue
      case 'parcel_locker':
        return '#4caf50'; // Green
      default:
        return '#ff9800'; // Orange
    }
  };

  // Handle point selection
  const handlePointSelect = (point: ParcelPoint) => {
    setSelectedPoint(point);
    if (onLocationSelect) {
      onLocationSelect(point);
    }
  };

  return (
    <Box display="flex" gap={2} height="600px">
      {/* Sidebar */}
      <Paper sx={{ width: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Search Controls */}
        <Box p={2}>
          <Typography variant="h6" gutterBottom>
            Find Parcel Points
          </Typography>

          {/* Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by city or postal code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchByQuery()}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Button size="small" onClick={searchByQuery}>
                    Search
                  </Button>
                </InputAdornment>
              )
            }}
          />

          {/* Location Button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={<MyLocation />}
            onClick={getUserLocation}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Use My Location
          </Button>

          {/* Point Type Filter */}
          <ToggleButtonGroup
            value={pointType}
            exclusive
            onChange={(_, newType) => newType && setPointType(newType)}
            fullWidth
            size="small"
          >
            <ToggleButton value="all">
              All
            </ToggleButton>
            <ToggleButton value="parcel_shop">
              <Store sx={{ mr: 0.5 }} /> Shop
            </ToggleButton>
            <ToggleButton value="parcel_locker">
              <Lock sx={{ mr: 0.5 }} /> Locker
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* Error Message */}
        {error && (
          <Box p={2}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Results List */}
        <Box flexGrow={1} overflow="auto">
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : parcelPoints.length === 0 ? (
            <Box p={3} textAlign="center">
              <Room sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Search for parcel points or use your location
              </Typography>
            </Box>
          ) : (
            <List>
              {parcelPoints.map((point) => (
                <React.Fragment key={point.parcel_point_id}>
                  <ListItem
                    button
                    selected={selectedPoint?.parcel_point_id === point.parcel_point_id}
                    onClick={() => handlePointSelect(point)}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: getPointColor(point.point_type),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}
                      >
                        {getPointIcon(point.point_type)}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
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
                        <Box mt={1}>
                          <Typography variant="caption" display="block">
                            {point.street_address}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            {point.postal_code} {point.city}
                          </Typography>
                          {point.distance_km !== undefined && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <DirectionsWalk sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {point.distance_km.toFixed(2)} km away
                              </Typography>
                            </Box>
                          )}
                          {point.hours_type && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                              <Schedule sx={{ fontSize: 14 }} />
                              <Typography variant="caption">
                                {point.hours_type}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>

        {/* Results Count */}
        {parcelPoints.length > 0 && (
          <Box p={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="text.secondary">
              Found {parcelPoints.length} parcel point{parcelPoints.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Map Container */}
      <Card sx={{ flexGrow: 1 }}>
        <CardContent sx={{ height: '100%', p: 0 }}>
          {/* Placeholder for actual map integration */}
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              position: 'relative'
            }}
          >
            {/* Map placeholder */}
            <Room sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Interactive Map View
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
              Integrate with Google Maps or Mapbox to display parcel points on an interactive map
            </Typography>

            {/* Selected Point Info Overlay */}
            {selectedPoint && (
              <Paper
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: 16,
                  right: 16,
                  p: 2,
                  maxWidth: 400
                }}
                elevation={3}
              >
                <Box display="flex" alignItems="start" gap={2}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: getPointColor(selectedPoint.point_type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0
                    }}
                  >
                    {getPointIcon(selectedPoint.point_type)}
                  </Box>
                  <Box flexGrow={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {selectedPoint.point_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPoint.street_address}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedPoint.postal_code} {selectedPoint.city}
                    </Typography>
                    {selectedPoint.distance_km !== undefined && (
                      <Typography variant="caption" display="block" mt={1}>
                        <DirectionsWalk sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                        {selectedPoint.distance_km.toFixed(2)} km away
                      </Typography>
                    )}
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      {selectedPoint.facilities?.slice(0, 3).map((facility) => (
                        <Chip
                          key={facility}
                          label={facility.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
                <Box display="flex" gap={1} mt={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Info />}
                    fullWidth
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                  >
                    Select
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Map Legend */}
            <Paper
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                p: 2
              }}
              elevation={2}
            >
              <Typography variant="caption" fontWeight="bold" display="block" mb={1}>
                Legend
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: '#2196f3'
                    }}
                  />
                  <Typography variant="caption">Parcel Shop</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: '#4caf50'
                    }}
                  />
                  <Typography variant="caption">Parcel Locker</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: '#ff9800'
                    }}
                  />
                  <Typography variant="caption">Service Point</Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParcelPointMap;
