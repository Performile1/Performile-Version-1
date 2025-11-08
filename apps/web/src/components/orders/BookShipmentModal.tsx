import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Link,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  Store,
  Home,
  CheckCircle,
  Download,
  Print,
} from '@mui/icons-material';
import { CourierLogo } from '../courier/CourierLogo';
import { apiClient } from '@/services/apiClient';
import { toast } from 'react-hot-toast';

interface BookShipmentModalProps {
  open: boolean;
  order: any;
  onClose: () => void;
  onSuccess: (trackingNumber: string, labelUrl: string) => void;
  preSelectedCourier?: string; // From checkout
  preSelectedService?: string; // From checkout
}

const steps = ['Select Courier', 'Confirm Details', 'Book & Label'];

export const BookShipmentModal: React.FC<BookShipmentModalProps> = ({
  open,
  order,
  onClose,
  onSuccess,
  preSelectedCourier,
  preSelectedService,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState(preSelectedCourier || order?.courier_id || '');
  const [serviceType, setServiceType] = useState(preSelectedService || order?.level_of_service || 'home_delivery');
  const [courierChanged, setCourierChanged] = useState(false);
  const [serviceChanged, setServiceChanged] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [packageDetails, setPackageDetails] = useState({
    weight: 1.0,
    length: 30,
    width: 20,
    height: 10,
    value: 500,
  });
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Mock couriers - replace with actual data
  const couriers = [
    { id: '1', name: 'PostNord', code: 'POSTNORD', services: ['home_delivery', 'parcel_shop', 'parcel_locker'] },
    { id: '2', name: 'Bring', code: 'BRING', services: ['home_delivery', 'parcel_shop'] },
    { id: '3', name: 'Budbee', code: 'BUDBEE', services: ['home_delivery'] },
    { id: '4', name: 'DHL', code: 'DHL', services: ['home_delivery', 'express'] },
  ];

  const serviceTypes = {
    home_delivery: { label: 'Home Delivery', icon: <Home /> },
    parcel_shop: { label: 'Parcel Shop', icon: <Store /> },
    parcel_locker: { label: 'Parcel Locker', icon: <LocalShipping /> },
    express: { label: 'Express', icon: <LocalShipping /> },
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleBookShipment = async () => {
    setLoading(true);
    try {
      // Check if courier or service changed from checkout selection
      const hasChanges = courierChanged || serviceChanged;

      const response = await apiClient.post('/shipments/book', {
        order_id: order.order_id,
        courier_id: selectedCourier,
        service_type: serviceType,
        send_notifications: sendNotifications && hasChanges, // Only if changed
        pickup_address: {
          name: order.store_name,
          street: order.store_address,
          postal_code: order.store_postal_code,
          city: order.store_city,
          country: order.store_country || 'NO',
        },
        delivery_address: {
          name: order.customer_name,
          street: order.delivery_address,
          postal_code: order.postal_code,
          city: order.city,
          country: order.country || 'NO',
        },
        package_details: packageDetails,
      });

      setBookingResult(response.data);
      handleNext();
      
      // Show appropriate success message
      if (hasChanges && sendNotifications) {
        toast.success('Shipment booked! Notifications sent to customer and webshop.');
      } else {
        toast.success('Shipment booked successfully!');
      }
      
      // Call onSuccess callback
      if (response.data.tracking_number && response.data.label_url) {
        onSuccess(response.data.tracking_number, response.data.label_url);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to book shipment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedCourier('');
    setServiceType('home_delivery');
    setBookingResult(null);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            {/* Show pre-selected info from checkout */}
            {(preSelectedCourier || preSelectedService) && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Selected at Checkout:
                </Typography>
                <Typography variant="body2">
                  {preSelectedCourier && `Courier: ${couriers.find(c => c.id === preSelectedCourier)?.name || 'Selected'}`}
                  {preSelectedCourier && preSelectedService && ' • '}
                  {preSelectedService && `Service: ${serviceTypes[preSelectedService as keyof typeof serviceTypes]?.label || preSelectedService}`}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  You can change these selections below. Customer will be notified of changes.
                </Typography>
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a courier and service type for this shipment
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Courier</InputLabel>
              <Select
                value={selectedCourier}
                onChange={(e) => {
                  setSelectedCourier(e.target.value);
                  if (preSelectedCourier && e.target.value !== preSelectedCourier) {
                    setCourierChanged(true);
                  }
                }}
                label="Courier"
              >
                {couriers.map((courier) => (
                  <MenuItem key={courier.id} value={courier.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CourierLogo
                        courierCode={courier.code}
                        courierName={courier.name}
                        size="small"
                        showName={false}
                      />
                      {courier.name}
                      {preSelectedCourier === courier.id && (
                        <Chip label="From Checkout" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedCourier && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Service Type</InputLabel>
                <Select
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value);
                    if (preSelectedService && e.target.value !== preSelectedService) {
                      setServiceChanged(true);
                    }
                  }}
                  label="Service Type"
                >
                  {couriers
                    .find((c) => c.id === selectedCourier)
                    ?.services.map((service) => (
                      <MenuItem key={service} value={service}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {serviceTypes[service as keyof typeof serviceTypes]?.icon}
                          {serviceTypes[service as keyof typeof serviceTypes]?.label}
                          {preSelectedService === service && (
                            <Chip label="From Checkout" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            {/* Show warning if changes were made */}
            {(courierChanged || serviceChanged) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Changes Detected
                </Typography>
                <Typography variant="body2">
                  {courierChanged && 'Courier has been changed. '}
                  {serviceChanged && 'Service type has been changed. '}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Notifications will be sent to customer and webshop about these changes.
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <FormControl>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        checked={sendNotifications}
                        onChange={(e) => setSendNotifications(e.target.checked)}
                      />
                      <Typography variant="body2">
                        Send notifications about changes
                      </Typography>
                    </Box>
                  </FormControl>
                </Box>
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Confirm addresses and package details
            </Typography>

            <Grid container spacing={2}>
              {/* Pickup Address */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Pickup Address
                    </Typography>
                    <Typography variant="body2">
                      {order.store_name}<br />
                      {order.store_address}<br />
                      {order.store_postal_code} {order.store_city}<br />
                      {order.store_country || 'Norway'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Delivery Address */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Delivery Address
                    </Typography>
                    <Typography variant="body2">
                      {order.customer_name}<br />
                      {order.delivery_address}<br />
                      {order.postal_code} {order.city}<br />
                      {order.country || 'Norway'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Package Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Package Details
                </Typography>
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Weight (kg)"
                  type="number"
                  value={packageDetails.weight}
                  onChange={(e) =>
                    setPackageDetails({ ...packageDetails, weight: parseFloat(e.target.value) })
                  }
                  inputProps={{ step: 0.1, min: 0.1 }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Length (cm)"
                  type="number"
                  value={packageDetails.length}
                  onChange={(e) =>
                    setPackageDetails({ ...packageDetails, length: parseInt(e.target.value) })
                  }
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Width (cm)"
                  type="number"
                  value={packageDetails.width}
                  onChange={(e) =>
                    setPackageDetails({ ...packageDetails, width: parseInt(e.target.value) })
                  }
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Height (cm)"
                  type="number"
                  value={packageDetails.height}
                  onChange={(e) =>
                    setPackageDetails({ ...packageDetails, height: parseInt(e.target.value) })
                  }
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Package Value (NOK)"
                  type="number"
                  value={packageDetails.value}
                  onChange={(e) =>
                    setPackageDetails({ ...packageDetails, value: parseFloat(e.target.value) })
                  }
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="body1">Booking shipment...</Typography>
                <Typography variant="body2" color="text.secondary">
                  This may take a few seconds
                </Typography>
              </Box>
            ) : bookingResult ? (
              <Box>
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
                  Shipment booked successfully!
                </Alert>

                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Tracking Number
                        </Typography>
                        <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>
                          {bookingResult.tracking_number}
                        </Typography>
                      </Grid>

                      {bookingResult.estimated_delivery && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Estimated Delivery
                          </Typography>
                          <Typography variant="body1">
                            {new Date(bookingResult.estimated_delivery).toLocaleDateString()}
                          </Typography>
                        </Grid>
                      )}

                      {bookingResult.label_url && (
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="outlined"
                              startIcon={<Download />}
                              href={bookingResult.label_url}
                              target="_blank"
                              fullWidth
                            >
                              Download Label
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<Print />}
                              onClick={() => window.print()}
                              fullWidth
                            >
                              Print Label
                            </Button>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>

                <Alert severity="info">
                  The tracking number has been added to the order. You can now track the shipment
                  in real-time.
                </Alert>
              </Box>
            ) : null}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShipping />
          Book Shipment
        </Box>
        <Typography variant="body2" color="text.secondary">
          Order: {order?.order_number || order?.order_id}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {bookingResult ? 'Close' : 'Cancel'}
        </Button>
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack}>Back</Button>
        )}
        {activeStep === 0 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!selectedCourier}
          >
            Next
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={handleBookShipment}
            disabled={loading}
          >
            Book Shipment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
