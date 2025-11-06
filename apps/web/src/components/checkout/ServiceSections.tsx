/**
 * Service Sections Component
 * Week 2 Day 4 - Service Sections UI
 * 
 * Displays courier options grouped by speed or delivery method
 * Created: November 6, 2025
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Avatar,
  Divider,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  Zap,
  Package,
  Truck,
  Home,
  Store,
  Lock,
  Clock,
  Calendar,
  Star
} from 'lucide-react';

interface CourierOption {
  id: string;
  courierCode: string;
  courierName: string;
  serviceName: string;
  price: number;
  currency: string;
  estimatedDays: number;
  rating: number;
  deliveryMethod: 'home' | 'parcel_shop' | 'locker';
  speed: 'express' | 'standard' | 'economy';
  badges?: ('same_day' | 'next_day' | 'weekend')[];
}

interface ServiceSectionsProps {
  couriers: CourierOption[];
  selectedCourierId?: string;
  onSelect: (courierId: string) => void;
  groupBy?: 'speed' | 'method';
  showGroupToggle?: boolean;
}

export const ServiceSections: React.FC<ServiceSectionsProps> = ({
  couriers,
  selectedCourierId,
  onSelect,
  groupBy: initialGroupBy = 'speed',
  showGroupToggle = true
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [groupBy, setGroupBy] = useState<'speed' | 'method'>(initialGroupBy);

  // Group couriers by speed or method
  const groupedCouriers = useMemo(() => {
    if (groupBy === 'speed') {
      return {
        express: couriers.filter(c => c.speed === 'express'),
        standard: couriers.filter(c => c.speed === 'standard'),
        economy: couriers.filter(c => c.speed === 'economy')
      };
    } else {
      return {
        home: couriers.filter(c => c.deliveryMethod === 'home'),
        parcel_shop: couriers.filter(c => c.deliveryMethod === 'parcel_shop'),
        locker: couriers.filter(c => c.deliveryMethod === 'locker')
      };
    }
  }, [couriers, groupBy]);

  const speedTabs = [
    { 
      label: 'Express', 
      icon: <Zap size={20} />, 
      key: 'express',
      color: '#FF5722'
    },
    { 
      label: 'Standard', 
      icon: <Package size={20} />, 
      key: 'standard',
      color: '#2196F3'
    },
    { 
      label: 'Economy', 
      icon: <Truck size={20} />, 
      key: 'economy',
      color: '#4CAF50'
    }
  ];

  const methodTabs = [
    { 
      label: 'Home Delivery', 
      icon: <Home size={20} />, 
      key: 'home',
      color: '#9C27B0'
    },
    { 
      label: 'Parcel Shop', 
      icon: <Store size={20} />, 
      key: 'parcel_shop',
      color: '#FF9800'
    },
    { 
      label: 'Locker', 
      icon: <Lock size={20} />, 
      key: 'locker',
      color: '#607D8B'
    }
  ];

  const tabs = groupBy === 'speed' ? speedTabs : methodTabs;
  const currentKey = tabs[activeTab]?.key;
  const currentCouriers = groupedCouriers[currentKey] || [];

  const renderBadge = (badge: string) => {
    switch (badge) {
      case 'same_day':
        return (
          <Chip
            icon={<Clock size={14} />}
            label="Same Day"
            size="small"
            color="error"
            sx={{ ml: 1, height: 24 }}
          />
        );
      case 'next_day':
        return (
          <Chip
            icon={<Calendar size={14} />}
            label="Next Day"
            size="small"
            color="warning"
            sx={{ ml: 1, height: 24 }}
          />
        );
      case 'weekend':
        return (
          <Chip
            label="Weekend"
            size="small"
            color="info"
            sx={{ ml: 1, height: 24 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Select Delivery Service
          </Typography>

          {/* Group By Toggle */}
          {showGroupToggle && (
            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(_, value) => {
                if (value) {
                  setGroupBy(value);
                  setActiveTab(0); // Reset to first tab when switching
                }
              }}
              size="small"
            >
              <ToggleButton value="speed">
                <Zap size={16} style={{ marginRight: 4 }} />
                Speed
              </ToggleButton>
              <ToggleButton value="method">
                <Home size={16} style={{ marginRight: 4 }} />
                Method
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ 
            mb: 2,
            '& .MuiTab-root': {
              minHeight: 64
            }
          }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.key}
              icon={tab.icon}
              label={`${tab.label} (${groupedCouriers[tab.key]?.length || 0})`}
              iconPosition="start"
              sx={{
                '&.Mui-selected': {
                  color: tab.color
                }
              }}
            />
          ))}
        </Tabs>

        {/* Courier Options */}
        <RadioGroup
          value={selectedCourierId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {currentCouriers.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary">
                No {tabs[activeTab]?.label.toLowerCase()} delivery options available
              </Typography>
            </Box>
          ) : (
            currentCouriers.map((courier, index) => (
              <React.Fragment key={courier.id}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <FormControlLabel
                  value={courier.id}
                  control={<Radio />}
                  label={
                    <Box display="flex" alignItems="center" width="100%" py={1}>
                      {/* Courier Logo */}
                      <Avatar
                        src={`/courier-logos/${courier.courierCode}_logo.jpeg`}
                        alt={courier.courierName}
                        sx={{ width: 48, height: 48, mr: 2 }}
                      >
                        {courier.courierName[0]}
                      </Avatar>

                      {/* Courier Info */}
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {courier.courierName}
                          </Typography>
                          {courier.badges?.map(badge => renderBadge(badge))}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {courier.serviceName} • {courier.estimatedDays} {courier.estimatedDays === 1 ? 'day' : 'days'}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <Star size={14} fill="#FFC107" color="#FFC107" />
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            {courier.rating.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price */}
                      <Box textAlign="right" ml={2}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {courier.currency} {courier.price.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{
                    width: '100%',
                    m: 0,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    },
                    '& .MuiFormControlLabel-label': {
                      width: '100%'
                    }
                  }}
                />
              </React.Fragment>
            ))
          )}
        </RadioGroup>

        {/* Summary */}
        {currentCouriers.length > 0 && (
          <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
            <Typography variant="caption" color="text.secondary">
              Showing {currentCouriers.length} {tabs[activeTab]?.label.toLowerCase()} option{currentCouriers.length !== 1 ? 's' : ''}
              {selectedCourierId && ` • 1 selected`}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceSections;
