import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Link,
} from '@mui/material';
import {
  Close,
  OpenInNew,
  LocalShipping,
  Store,
  Person,
  LocationOn,
  CalendarToday,
} from '@mui/icons-material';

interface Order {
  order_id: string;
  tracking_number: string;
  order_number?: string;
  store_name?: string;
  courier_name?: string;
  consumer_email?: string;
  order_status: string;
  order_date: string;
  delivery_date?: string;
  estimated_delivery?: string;
  level_of_service?: string;
  type_of_delivery?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  delivery_address?: string;
  created_at: string;
  updated_at: string;
}

interface OrderDetailsDrawerProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onViewFull?: (orderId: string) => void;
}

const statusColors: Record<string, string> = {
  pending: '#ff9800',
  confirmed: '#2196f3',
  picked_up: '#9c27b0',
  in_transit: '#ff5722',
  delivered: '#4caf50',
  cancelled: '#f44336',
  failed: '#795548',
};

export const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  open,
  order,
  onClose,
  onViewFull,
}) => {
  if (!order) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 450 } }
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Order Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Status */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Chip
            label={order.order_status.replace('_', ' ').toUpperCase()}
            sx={{
              backgroundColor: statusColors[order.order_status] || '#gray',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              px: 2,
              py: 2.5,
            }}
          />
        </Box>

        {/* Tracking Number */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Tracking Number
          </Typography>
          <Link
            href={`/track/${order.tracking_number}`}
            sx={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              color: 'primary.main',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            {order.tracking_number}
          </Link>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Order Information */}
        <List dense>
          {order.order_number && (
            <ListItem>
              <ListItemText
                primary="Order Number"
                secondary={order.order_number}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          )}

          <ListItem>
            <ListItemIcon>
              <LocalShipping color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Courier"
              secondary={order.courier_name || 'Not assigned'}
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
            />
          </ListItem>

          {order.store_name && (
            <ListItem>
              <ListItemIcon>
                <Store color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Store"
                secondary={order.store_name}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          )}

          {order.consumer_email && (
            <ListItem>
              <ListItemIcon>
                <Person color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Customer"
                secondary={order.consumer_email}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          )}

          {(order.delivery_address || order.city || order.country) && (
            <ListItem>
              <ListItemIcon>
                <LocationOn color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Delivery Location"
                secondary={
                  order.delivery_address ||
                  [order.city, order.postal_code, order.country].filter(Boolean).join(', ')
                }
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          )}

          <ListItem>
            <ListItemIcon>
              <CalendarToday color="action" />
            </ListItemIcon>
            <ListItemText
              primary="Order Date"
              secondary={formatDate(order.order_date)}
              primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
              secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
            />
          </ListItem>

          {order.delivery_date && (
            <ListItem>
              <ListItemIcon>
                <CalendarToday color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Delivery Date"
                secondary={formatDate(order.delivery_date)}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          )}

          {order.estimated_delivery && (
            <ListItem>
              <ListItemText
                primary="Estimated Delivery"
                secondary={formatDate(order.estimated_delivery)}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          )}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Additional Info */}
        {(order.level_of_service || order.type_of_delivery) && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Service Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {order.level_of_service && (
                <Chip label={order.level_of_service} size="small" variant="outlined" />
              )}
              {order.type_of_delivery && (
                <Chip label={order.type_of_delivery} size="small" variant="outlined" />
              )}
            </Box>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          {onViewFull && (
            <Button
              fullWidth
              variant="contained"
              endIcon={<OpenInNew />}
              onClick={() => onViewFull(order.order_id)}
            >
              View Full Details
            </Button>
          )}
          <Button
            fullWidth
            variant="outlined"
            onClick={onClose}
          >
            Close
          </Button>
        </Box>

        {/* Timestamps */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Created: {formatDate(order.created_at)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Updated: {formatDate(order.updated_at)}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};
