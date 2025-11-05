# SERVICE SECTIONS UI SPECIFICATION

**Date:** November 6, 2025  
**Priority:** P1 - HIGH  
**Estimated Time:** 2.5 hours  
**Status:** Ready for Implementation

---

## 🎯 OBJECTIVE

Create customizable service section UI components for checkout that allow merchants to organize couriers by speed, delivery method, and other criteria.

---

## 📋 DATABASE VALIDATION (COMPLETED)

**Validated Tables:**
- ✅ `courier_services` table exists
- ✅ Service data available
- ✅ Courier data linked

**Service Types:**
- Speed: Express, Standard, Economy
- Method: Home Delivery, Parcel Shop, Locker
- Special: Same Day, Next Day, Weekend

---

## 🎨 UI DESIGN

### **Layout Options:**

**Option 1: Tabs (Recommended)**
```
┌─────────────────────────────────────────┐
│ [Express] [Standard] [Economy]          │
├─────────────────────────────────────────┤
│                                         │
│  ⚡ DHL Express - $15.99               │
│  ⚡ FedEx Priority - $18.50            │
│  ⚡ UPS Express - $16.75               │
│                                         │
└─────────────────────────────────────────┘
```

**Option 2: Accordion**
```
┌─────────────────────────────────────────┐
│ ▼ Express Delivery (3 options)         │
│   ⚡ DHL Express - $15.99              │
│   ⚡ FedEx Priority - $18.50           │
│   ⚡ UPS Express - $16.75              │
│                                         │
│ ▶ Standard Delivery (5 options)        │
│                                         │
│ ▶ Economy Delivery (2 options)         │
└─────────────────────────────────────────┘
```

**Option 3: Grid (Simple)**
```
┌─────────────────────────────────────────┐
│ Express                                 │
│ ⚡ DHL Express - $15.99                │
│ ⚡ FedEx Priority - $18.50             │
│                                         │
│ Standard                                │
│ 📦 PostNord - $8.99                    │
│ 📦 Bring - $9.50                       │
│                                         │
│ Economy                                 │
│ 🚚 Posten - $5.99                      │
└─────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTATION PLAN

### **Part 1: Icon Library (30 min)**

**File:** `apps/web/src/components/icons/DeliveryIcons.tsx`

```typescript
import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

// Express/Fast delivery icon
export const ExpressIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
  </SvgIcon>
);

// Standard delivery icon
export const StandardIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
  </SvgIcon>
);

// Economy delivery icon
export const EconomyIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M18 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zm1.5-9H17V12h4.46L19.5 9.5zM6 18.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM20 8l3 4v5h-2c0 1.66-1.34 3-3 3s-3-1.34-3-3H9c0 1.66-1.34 3-3 3s-3-1.34-3-3H1V6c0-1.1.9-2 2-2h14v4h3z" />
  </SvgIcon>
);

// Home delivery icon
export const HomeDeliveryIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </SvgIcon>
);

// Parcel shop icon
export const ParcelShopIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
  </SvgIcon>
);

// Locker icon
export const LockerIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </SvgIcon>
);

// Service badge icons
export const SameDayIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </SvgIcon>
);

export const NextDayIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props}>
    <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
  </SvgIcon>
);
```

---

### **Part 2: Service Section Component (1.5 hours)**

**File:** `apps/web/src/components/checkout/ServiceSections.tsx`

```typescript
import React, { useState } from 'react';
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
  Divider
} from '@mui/material';
import {
  ExpressIcon,
  StandardIcon,
  EconomyIcon,
  HomeDeliveryIcon,
  ParcelShopIcon,
  LockerIcon,
  SameDayIcon,
  NextDayIcon
} from '../icons/DeliveryIcons';

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
  groupBy: 'speed' | 'method';
}

export const ServiceSections: React.FC<ServiceSectionsProps> = ({
  couriers,
  selectedCourierId,
  onSelect,
  groupBy = 'speed'
}) => {
  const [activeTab, setActiveTab] = useState(0);

  // Group couriers by speed or method
  const groupedCouriers = React.useMemo(() => {
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
    { label: 'Express', icon: <ExpressIcon />, key: 'express' },
    { label: 'Standard', icon: <StandardIcon />, key: 'standard' },
    { label: 'Economy', icon: <EconomyIcon />, key: 'economy' }
  ];

  const methodTabs = [
    { label: 'Home', icon: <HomeDeliveryIcon />, key: 'home' },
    { label: 'Parcel Shop', icon: <ParcelShopIcon />, key: 'parcel_shop' },
    { label: 'Locker', icon: <LockerIcon />, key: 'locker' }
  ];

  const tabs = groupBy === 'speed' ? speedTabs : methodTabs;
  const currentKey = tabs[activeTab].key;
  const currentCouriers = groupedCouriers[currentKey] || [];

  const renderBadge = (badge: string) => {
    switch (badge) {
      case 'same_day':
        return (
          <Chip
            icon={<SameDayIcon />}
            label="Same Day"
            size="small"
            color="error"
            sx={{ ml: 1 }}
          />
        );
      case 'next_day':
        return (
          <Chip
            icon={<NextDayIcon />}
            label="Next Day"
            size="small"
            color="warning"
            sx={{ ml: 1 }}
          />
        );
      case 'weekend':
        return (
          <Chip
            label="Weekend"
            size="small"
            color="info"
            sx={{ ml: 1 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Select Delivery Service
        </Typography>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={tab.key}
              icon={tab.icon}
              label={`${tab.label} (${groupedCouriers[tab.key]?.length || 0})`}
              iconPosition="start"
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
                No {tabs[activeTab].label.toLowerCase()} delivery options available
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
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        {courier.courierName[0]}
                      </Avatar>

                      {/* Courier Info */}
                      <Box flex={1}>
                        <Box display="flex" alignItems="center">
                          <Typography variant="subtitle1">
                            {courier.courierName}
                          </Typography>
                          {courier.badges?.map(badge => renderBadge(badge))}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {courier.serviceName} • {courier.estimatedDays} days
                        </Typography>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            ⭐ {courier.rating.toFixed(1)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price */}
                      <Box textAlign="right">
                        <Typography variant="h6">
                          {courier.currency} {courier.price.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{
                    width: '100%',
                    m: 0,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              </React.Fragment>
            ))
          )}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
```

---

### **Part 3: Integration (30 min)**

**File:** `apps/web/src/pages/checkout/index.tsx`

```typescript
import { ServiceSections } from '@/components/checkout/ServiceSections';

// In checkout page
const [selectedCourier, setSelectedCourier] = useState<string>();
const [groupBy, setGroupBy] = useState<'speed' | 'method'>('speed');

// Fetch couriers from API
const couriers = [
  {
    id: '1',
    courierCode: 'dhl',
    courierName: 'DHL Express',
    serviceName: 'Express Worldwide',
    price: 15.99,
    currency: 'USD',
    estimatedDays: 1,
    rating: 4.8,
    deliveryMethod: 'home',
    speed: 'express',
    badges: ['same_day', 'next_day']
  },
  // ... more couriers
];

return (
  <Box>
    {/* Group By Toggle */}
    <ToggleButtonGroup
      value={groupBy}
      exclusive
      onChange={(_, value) => value && setGroupBy(value)}
      sx={{ mb: 2 }}
    >
      <ToggleButton value="speed">
        Group by Speed
      </ToggleButton>
      <ToggleButton value="method">
        Group by Method
      </ToggleButton>
    </ToggleButtonGroup>

    {/* Service Sections */}
    <ServiceSections
      couriers={couriers}
      selectedCourierId={selectedCourier}
      onSelect={setSelectedCourier}
      groupBy={groupBy}
    />
  </Box>
);
```

---

## 🎨 STYLING

**Theme Colors:**
```typescript
express: {
  primary: '#FF5722', // Red-Orange
  icon: '⚡'
},
standard: {
  primary: '#2196F3', // Blue
  icon: '📦'
},
economy: {
  primary: '#4CAF50', // Green
  icon: '🚚'
}
```

**Badges:**
- Same Day: Red chip with clock icon
- Next Day: Orange chip with calendar icon
- Weekend: Blue chip

---

## 🧪 TESTING

### **Test Case 1: Speed Grouping**
```
1. Load checkout with 10 couriers
2. Group by speed
3. Verify: Express tab shows fast couriers
4. Verify: Standard tab shows medium couriers
5. Verify: Economy tab shows cheap couriers
```

### **Test Case 2: Method Grouping**
```
1. Load checkout with 10 couriers
2. Group by method
3. Verify: Home tab shows home delivery
4. Verify: Parcel Shop tab shows pickup points
5. Verify: Locker tab shows locker delivery
```

### **Test Case 3: Selection**
```
1. Select a courier in Express tab
2. Switch to Standard tab
3. Verify: Selection persists
4. Select different courier
5. Verify: New selection active
```

---

## ✅ SUCCESS CRITERIA

**UI:**
- ✅ Tabs display correctly
- ✅ Icons show for each section
- ✅ Couriers grouped properly
- ✅ Selection works
- ✅ Responsive design

**UX:**
- ✅ Easy to switch between groups
- ✅ Clear visual hierarchy
- ✅ Fast performance
- ✅ Accessible (keyboard navigation)

**Business:**
- ✅ Merchants can customize grouping
- ✅ Consumers see organized options
- ✅ Improves conversion

---

## 📋 CHECKLIST

**Icons:**
- [ ] Create DeliveryIcons.tsx
- [ ] Add all 8 icons
- [ ] Test icon rendering

**Component:**
- [ ] Create ServiceSections.tsx
- [ ] Implement tabs
- [ ] Implement grouping logic
- [ ] Add courier cards
- [ ] Add selection logic
- [ ] Style component

**Integration:**
- [ ] Add to checkout page
- [ ] Add group toggle
- [ ] Test with real data
- [ ] Verify responsive

**Testing:**
- [ ] Test speed grouping
- [ ] Test method grouping
- [ ] Test selection
- [ ] Test empty states

---

## 🎯 ESTIMATED TIME

**Total: 2.5 hours**
- Icon library: 30 min
- Service sections component: 1.5 hours
- Integration: 30 min

---

## ✅ READY TO IMPLEMENT

**Status:** All prerequisites met  
**Blocker:** None  
**Dependencies:** Courier data available  
**Risk:** Low - UI component only

**GO/NO-GO:** ✅ GO - Ready to implement!
