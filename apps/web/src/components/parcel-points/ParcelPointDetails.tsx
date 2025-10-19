/**
 * Parcel Point Details Component
 * Week 4 Phase 7 - Map Integration
 * 
 * Display detailed information about a parcel point
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Paper
} from '@mui/material';
import {
  Store,
  Lock,
  Room,
  Schedule,
  Phone,
  Email,
  DirectionsWalk,
  Accessible,
  LocalParking,
  Wifi,
  AcUnit,
  Security,
  CheckCircle,
  Cancel,
  Info
} from '@mui/icons-material';

interface OpeningHours {
  day_of_week: number;
  day_name: string;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  is_24_hours: boolean;
  notes: string | null;
}

interface Facility {
  facility_type: string;
  is_available: boolean;
  description: string | null;
}

interface ParcelPointDetailsData {
  parcel_point: {
    parcel_point_id: string;
    point_name: string;
    point_type: string;
    street_address: string;
    postal_code: string;
    city: string;
    phone: string | null;
    email: string | null;
    courier_name: string;
    is_active: boolean;
    is_temporarily_closed: boolean;
    closure_reason: string | null;
  };
  opening_hours: OpeningHours[];
  facilities: Facility[];
  status: {
    is_open_now: boolean;
    is_temporarily_closed: boolean;
    closure_reason: string | null;
    today_hours: OpeningHours | null;
  };
}

interface ParcelPointDetailsProps {
  parcelPointId: string;
}

export const ParcelPointDetails: React.FC<ParcelPointDetailsProps> = ({
  parcelPointId
}) => {
  const [data, setData] = useState<ParcelPointDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails();
  }, [parcelPointId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parcel-points?action=hours&parcel_point_id=${parcelPointId}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError('Failed to load parcel point details');
      }
    } catch (err) {
      setError('Error loading details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get facility icon
  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'wheelchair_access':
        return <Accessible />;
      case 'parking':
        return <LocalParking />;
      case 'wifi':
        return <Wifi />;
      case 'climate_controlled':
        return <AcUnit />;
      case 'security_camera':
        return <Security />;
      default:
        return <CheckCircle />;
    }
  };

  // Format facility name
  const formatFacilityName = (type: string): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error || 'No data available'}</Alert>
        </CardContent>
      </Card>
    );
  }

  const { parcel_point, opening_hours, facilities, status } = data;

  return (
    <Card>
      <CardHeader
        title={
          <Box>
            <Typography variant="h6">
              {parcel_point.point_name}
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={parcel_point.courier_name}
                color="primary"
                size="small"
              />
              <Chip
                label={parcel_point.point_type.replace('_', ' ')}
                size="small"
                variant="outlined"
              />
              {status.is_open_now && !status.is_temporarily_closed && (
                <Chip
                  label="Open Now"
                  color="success"
                  size="small"
                  icon={<CheckCircle />}
                />
              )}
              {status.is_temporarily_closed && (
                <Chip
                  label="Temporarily Closed"
                  color="error"
                  size="small"
                  icon={<Cancel />}
                />
              )}
            </Box>
          </Box>
        }
      />

      <CardContent>
        {/* Closure Notice */}
        {status.is_temporarily_closed && status.closure_reason && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {status.closure_reason}
          </Alert>
        )}

        {/* Location Info */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Location
          </Typography>
          <Box display="flex" alignItems="start" gap={1} mb={1}>
            <Room sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Box>
              <Typography variant="body2">
                {parcel_point.street_address}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {parcel_point.postal_code} {parcel_point.city}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1} mt={2}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DirectionsWalk />}
              fullWidth
            >
              Get Directions
            </Button>
          </Box>
        </Paper>

        {/* Contact Info */}
        {(parcel_point.phone || parcel_point.email) && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Contact
            </Typography>
            {parcel_point.phone && (
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Phone sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {parcel_point.phone}
                </Typography>
              </Box>
            )}
            {parcel_point.email && (
              <Box display="flex" alignItems="center" gap={1}>
                <Email sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {parcel_point.email}
                </Typography>
              </Box>
            )}
          </Paper>
        )}

        {/* Opening Hours */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              Opening Hours
            </Typography>
            {status.today_hours && (
              <Chip
                label={status.is_open_now ? 'Open Now' : 'Closed'}
                color={status.is_open_now ? 'success' : 'default'}
                size="small"
              />
            )}
          </Box>
          <List dense>
            {opening_hours.map((hours) => (
              <ListItem
                key={hours.day_of_week}
                sx={{
                  bgcolor: status.today_hours?.day_of_week === hours.day_of_week ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  mb: 0.5
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={status.today_hours?.day_of_week === hours.day_of_week ? 'bold' : 'normal'}>
                        {hours.day_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {hours.is_24_hours ? '24 Hours' :
                         hours.is_closed ? 'Closed' :
                         `${hours.opens_at} - ${hours.closes_at}`}
                      </Typography>
                    </Box>
                  }
                  secondary={hours.notes ? (
                    <Typography variant="caption" color="text.secondary">
                      {hours.notes}
                    </Typography>
                  ) : null}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Facilities */}
        {facilities.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Facilities & Amenities
            </Typography>
            <Grid container spacing={1}>
              {facilities.map((facility) => (
                <Grid item xs={6} key={facility.facility_type}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main'
                      }}
                    >
                      {getFacilityIcon(facility.facility_type)}
                    </Box>
                    <Box>
                      <Typography variant="caption" display="block">
                        {formatFacilityName(facility.facility_type)}
                      </Typography>
                      {facility.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {facility.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default ParcelPointDetails;
