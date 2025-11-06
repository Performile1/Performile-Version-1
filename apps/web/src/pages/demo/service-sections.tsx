/**
 * Service Sections Demo Page
 * Week 2 Day 4 - Service Sections UI Demo
 * 
 * Demonstrates the ServiceSections component with sample data
 * Created: November 6, 2025
 */

import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Alert } from '@mui/material';
import { ServiceSections } from '../../components/checkout/ServiceSections';

// Sample courier data
const sampleCouriers = [
  // Express couriers
  {
    id: 'dhl-express-1',
    courierCode: 'dhl',
    courierName: 'DHL Express',
    serviceName: 'Express Worldwide',
    price: 15.99,
    currency: 'USD',
    estimatedDays: 1,
    rating: 4.8,
    deliveryMethod: 'home' as const,
    speed: 'express' as const,
    badges: ['same_day', 'next_day'] as ('same_day' | 'next_day' | 'weekend')[]
  },
  {
    id: 'fedex-priority-1',
    courierCode: 'fedex',
    courierName: 'FedEx',
    serviceName: 'Priority Overnight',
    price: 18.50,
    currency: 'USD',
    estimatedDays: 1,
    rating: 4.7,
    deliveryMethod: 'home' as const,
    speed: 'express' as const,
    badges: ['next_day'] as ('same_day' | 'next_day' | 'weekend')[]
  },
  {
    id: 'ups-express-1',
    courierCode: 'ups',
    courierName: 'UPS',
    serviceName: 'Express Saver',
    price: 16.75,
    currency: 'USD',
    estimatedDays: 1,
    rating: 4.6,
    deliveryMethod: 'home' as const,
    speed: 'express' as const,
    badges: ['next_day'] as ('same_day' | 'next_day' | 'weekend')[]
  },
  
  // Standard couriers
  {
    id: 'postnord-standard-1',
    courierCode: 'postnord',
    courierName: 'PostNord',
    serviceName: 'Standard Delivery',
    price: 8.99,
    currency: 'USD',
    estimatedDays: 3,
    rating: 4.3,
    deliveryMethod: 'home' as const,
    speed: 'standard' as const
  },
  {
    id: 'bring-standard-1',
    courierCode: 'bring',
    courierName: 'Bring',
    serviceName: 'Parcel Standard',
    price: 9.50,
    currency: 'USD',
    estimatedDays: 3,
    rating: 4.4,
    deliveryMethod: 'parcel_shop' as const,
    speed: 'standard' as const
  },
  {
    id: 'budbee-standard-1',
    courierCode: 'budbee',
    courierName: 'Budbee',
    serviceName: 'Home Delivery',
    price: 7.99,
    currency: 'USD',
    estimatedDays: 2,
    rating: 4.5,
    deliveryMethod: 'home' as const,
    speed: 'standard' as const,
    badges: ['weekend'] as ('same_day' | 'next_day' | 'weekend')[]
  },
  {
    id: 'instabox-standard-1',
    courierCode: 'instabox',
    courierName: 'Instabox',
    serviceName: 'Locker Delivery',
    price: 6.99,
    currency: 'USD',
    estimatedDays: 2,
    rating: 4.6,
    deliveryMethod: 'locker' as const,
    speed: 'standard' as const
  },
  
  // Economy couriers
  {
    id: 'posten-economy-1',
    courierCode: 'posten',
    courierName: 'Posten',
    serviceName: 'Economy Mail',
    price: 5.99,
    currency: 'USD',
    estimatedDays: 5,
    rating: 4.1,
    deliveryMethod: 'home' as const,
    speed: 'economy' as const
  },
  {
    id: 'schenker-economy-1',
    courierCode: 'schenker',
    courierName: 'Schenker',
    serviceName: 'Economy Parcel',
    price: 6.50,
    currency: 'USD',
    estimatedDays: 5,
    rating: 4.0,
    deliveryMethod: 'parcel_shop' as const,
    speed: 'economy' as const
  }
];

export default function ServiceSectionsDemo() {
  const [selectedCourier, setSelectedCourier] = useState<string>();

  const selectedCourierData = sampleCouriers.find(c => c.id === selectedCourier);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Service Sections UI Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This component allows customers to browse courier options grouped by speed or delivery method.
      </Typography>

      {/* Selected Courier Info */}
      {selectedCourierData && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            Selected: {selectedCourierData.courierName} - {selectedCourierData.serviceName}
          </Typography>
          <Typography variant="body2">
            Price: {selectedCourierData.currency} {selectedCourierData.price.toFixed(2)} • 
            Delivery: {selectedCourierData.estimatedDays} days • 
            Rating: {selectedCourierData.rating}/5
          </Typography>
        </Alert>
      )}

      {/* Service Sections Component */}
      <ServiceSections
        couriers={sampleCouriers}
        selectedCourierId={selectedCourier}
        onSelect={setSelectedCourier}
        showGroupToggle={true}
      />

      {/* Info Box */}
      <Paper sx={{ mt: 3, p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Features
        </Typography>
        <Typography variant="body2" component="div">
          <ul>
            <li>Group by Speed (Express, Standard, Economy)</li>
            <li>Group by Delivery Method (Home, Parcel Shop, Locker)</li>
            <li>Special badges (Same Day, Next Day, Weekend)</li>
            <li>Courier ratings and pricing</li>
            <li>Responsive design</li>
            <li>Toggle between grouping modes</li>
          </ul>
        </Typography>
      </Paper>

      {/* Stats */}
      <Paper sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          Sample Data Stats
        </Typography>
        <Typography variant="body2">
          • Total Couriers: {sampleCouriers.length}<br />
          • Express: {sampleCouriers.filter(c => c.speed === 'express').length}<br />
          • Standard: {sampleCouriers.filter(c => c.speed === 'standard').length}<br />
          • Economy: {sampleCouriers.filter(c => c.speed === 'economy').length}<br />
          • Home Delivery: {sampleCouriers.filter(c => c.deliveryMethod === 'home').length}<br />
          • Parcel Shop: {sampleCouriers.filter(c => c.deliveryMethod === 'parcel_shop').length}<br />
          • Locker: {sampleCouriers.filter(c => c.deliveryMethod === 'locker').length}
        </Typography>
      </Paper>
    </Container>
  );
}
