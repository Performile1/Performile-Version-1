# POSTNORD DELIVERY OPTIONS API

**Date:** November 8, 2025  
**API Version:** 3.4.3  
**Base URL:** https://api2.postnord.com/rest/shipment

---

## 🎯 WHAT IT DOES

**The "Holy Grail" API for checkout integration!**

This single API gives you **EVERYTHING** you need for checkout:
- ✅ Available delivery options (home, parcel locker, service point)
- ✅ Accurate delivery time estimates
- ✅ Service codes for booking
- ✅ Service point locations with addresses
- ✅ Opening hours for each location
- ✅ Sustainability info (fossil-free, eco-labeled)
- ✅ Checkout-ready text (titles, descriptions)
- ✅ Distance from customer address

**This replaces multiple APIs!**

---

## 🚀 WHY THIS IS AMAZING

### **Instead of calling 3+ APIs:**
1. ❌ Service Points API (find locations)
2. ❌ Transit Time API (calculate delivery time)
3. ❌ Shipping Guide API (get rates)

### **You call ONE API:**
1. ✅ **Delivery Options API** - Gets everything!

---

## 📍 ENDPOINT

```
POST /v1/deliveryoptions/bywarehouse
```

**Full URL:**
```
https://api2.postnord.com/rest/shipment/v1/deliveryoptions/bywarehouse?apikey=YOUR_KEY
```

---

## 📦 REQUEST STRUCTURE

### **Minimal Request:**

```json
{
  "warehouses": [
    {
      "id": "warehouse1",
      "address": {
        "postCode": "17173",
        "street": "Terminalvägen 24",
        "city": "Solna",
        "countryCode": "SE"
      },
      "orderHandling": {
        "timeOfLatestOrder": "2025-11-08T15:00:00+01:00"
      }
    }
  ],
  "customer": {
    "customerKey": "performile"
  },
  "recipient": {
    "address": {
      "postCode": "41104",
      "countryCode": "SE"
    }
  }
}
```

---

## 🎨 RESPONSE STRUCTURE

### **What You Get:**

```json
{
  "warehouseToDeliveryOptions": [
    {
      "warehouse": { /* your warehouse */ },
      "deliveryOptions": [
        {
          "type": "home",
          "defaultOption": {
            "bookingInstructions": {
              "deliveryOptionId": "abc123",
              "serviceCode": "17",
              "additionalServiceCodes": []
            },
            "descriptiveTexts": {
              "checkout": {
                "title": "Home delivery",
                "briefDescription": "Nordic Swan Ecolabelled delivery to your home.",
                "fullDescription": "SATURDAY DELIVERY to over 2 million households...",
                "friendlyDeliveryInfo": "Wednesday ~ 08:00-13:00"
              }
            },
            "deliveryTime": {
              "date": {
                "earliest": "2025-11-13T08:00:00+01:00",
                "latest": "2025-11-13T13:00:00+01:00"
              }
            },
            "sustainability": {
              "fossilFree": false,
              "nordicSwanEcoLabel": true
            }
          }
        },
        {
          "type": "parcel-locker",
          "additionalOptions": [
            {
              "bookingInstructions": {
                "deliveryOptionId": "xyz789",
                "serviceCode": "19",
                "additionalServiceCodes": ["A7"],
                "servicePointId": "2559827"
              },
              "descriptiveTexts": {
                "checkout": {
                  "title": "Collect at parcel locker",
                  "briefDescription": "Nordic Swan Ecolabelled delivery to a parcel locker near you.",
                  "friendlyDeliveryInfo": "Paketbox Thomsons Väg (Tomorrow ~ 15:00)"
                }
              },
              "deliveryTime": {
                "date": {
                  "latest": "2025-11-09T15:00:00+01:00"
                }
              },
              "sustainability": {
                "fossilFree": true,
                "nordicSwanEcoLabel": true
              },
              "location": {
                "name": "Paketbox Thomsons Väg",
                "distanceFromRecipientAddress": 413,
                "address": {
                  "countryCode": "SE",
                  "postCode": "21372",
                  "city": "MALMÖ",
                  "streetName": "Thomsons Väg",
                  "streetNumber": "28C"
                },
                "coordinate": {
                  "latitude": 55.58683291,
                  "longitude": 13.0548913
                },
                "openingHours": {
                  "regular": {
                    "monday": {
                      "open": true,
                      "timeRanges": [
                        {
                          "from": "00:00",
                          "to": "23:59"
                        }
                      ]
                    }
                  }
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🎯 DELIVERY TYPES

### **Supported Types:**

| Type | Description | Sweden | Nordics | Europe |
|------|-------------|--------|---------|--------|
| **home** | Home delivery | ✅ | ✅ | ✅ |
| **parcel-locker** | Parcel locker | ✅ | ✅ | ❌ |
| **service-point** | Service point | ✅ | ✅ | ✅ |
| **mailbox** | Mailbox/door | ✅ | ❌ | ❌ |
| **express-mailbox** | Fast mailbox | ✅ | ❌ | ❌ |
| **home-small** | Small parcel | ✅ | ❌ | ❌ |
| **pallet** | Pallet delivery | ✅ | ✅ | ✅ |
| **groupage** | Groupage | ✅ | ✅ | ❌ |
| **parcel-b2b** | Business parcel | ✅ | ✅ | ✅ |
| **pallet-b2b** | Business pallet | ✅ | ✅ | ✅ |
| **groupage-b2b** | Business groupage | ✅ | ✅ | ❌ |

---

## 💡 USE CASES FOR PERFORMILE

### **Week 3 - Checkout Integration:**

**1. Get All Delivery Options:**
```typescript
const response = await fetch(
  'https://api2.postnord.com/rest/shipment/v1/deliveryoptions/bywarehouse?apikey=' + API_KEY,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': 'en'
    },
    body: JSON.stringify({
      warehouses: [{
        id: 'main_warehouse',
        address: {
          postCode: merchantPostalCode,
          city: merchantCity,
          street: merchantStreet,
          countryCode: 'SE'
        },
        orderHandling: {
          timeOfLatestOrder: new Date().toISOString()
        }
      }],
      customer: {
        customerKey: 'performile'
      },
      recipient: {
        address: {
          postCode: customerPostalCode,
          countryCode: 'SE'
        }
      }
    })
  }
);

const data = await response.json();
```

**2. Display in Checkout:**
```tsx
// React component for checkout
<DeliveryOptions>
  {data.warehouseToDeliveryOptions[0].deliveryOptions.map(option => (
    <DeliveryOption key={option.type}>
      <h3>{option.defaultOption.descriptiveTexts.checkout.title}</h3>
      <p>{option.defaultOption.descriptiveTexts.checkout.briefDescription}</p>
      <p>{option.defaultOption.descriptiveTexts.checkout.friendlyDeliveryInfo}</p>
      
      {option.defaultOption.sustainability.fossilFree && (
        <Badge>🌱 Fossil Free</Badge>
      )}
      
      {option.defaultOption.sustainability.nordicSwanEcoLabel && (
        <Badge>🦢 Nordic Swan Ecolabelled</Badge>
      )}
      
      {option.additionalOptions?.map(additional => (
        <ServicePoint key={additional.location.name}>
          <p>{additional.location.name}</p>
          <p>{additional.location.distanceFromRecipientAddress}m away</p>
        </ServicePoint>
      ))}
    </DeliveryOption>
  ))}
</DeliveryOptions>
```

**3. Store Booking Instructions:**
```typescript
// Save for later booking
const bookingData = {
  deliveryOptionId: option.bookingInstructions.deliveryOptionId,
  serviceCode: option.bookingInstructions.serviceCode,
  additionalServiceCodes: option.bookingInstructions.additionalServiceCodes,
  servicePointId: option.bookingInstructions.servicePointId
};

// Store in database
await db.orders.update({
  where: { orderId },
  data: {
    postnord_delivery_option_id: bookingData.deliveryOptionId,
    postnord_service_code: bookingData.serviceCode,
    postnord_service_point_id: bookingData.servicePointId
  }
});
```

---

## 🔧 ORDER HANDLING OPTIONS

### **Three Ways to Calculate Delivery Time:**

**Option 1: Time of Latest Order** (Cutoff time)
```json
{
  "orderHandling": {
    "timeOfLatestOrder": "2025-11-08T15:00:00+01:00"
  }
}
```
**Use when:** You have a daily cutoff time for orders

---

**Option 2: Hand Over Time** (Exact pickup time)
```json
{
  "orderHandling": {
    "handOverTime": "2025-11-09T10:00:00+01:00"
  }
}
```
**Use when:** You know exactly when PostNord will pick up

---

**Option 3: Days Until Ready** (Processing time)
```json
{
  "orderHandling": {
    "daysUntilOrderIsReady": "1-2"
  }
}
```
**Use when:** You need time to process/pack orders

---

## 🎨 CHECKOUT TEXT EXAMPLES

### **What You Get:**

**Title:**
- "Home delivery"
- "Collect at parcel locker"
- "Collect at Service point"

**Brief Description:**
- "Nordic Swan Ecolabelled delivery to your home."
- "Delivery to a parcel locker near you and opened via PostNord App."

**Full Description:**
- "SATURDAY DELIVERY to over 2 million households in Sweden. You will be notified via sms/email..."

**Friendly Delivery Info:**
- "Wednesday ~ 08:00-13:00"
- "Paketbox Thomsons Väg (Tomorrow ~ 15:00)"
- "1-3 days"

---

## 📊 RESPONSE TIME

**Performance:**
- **Goal:** 99/100 calls < 300ms (99th percentile)
- **Availability:** 99.5% successful responses

---

## 🎯 IMPLEMENTATION PRIORITY

### **For Today (Saturday):**
❌ **DON'T implement** - Focus on tracking APIs

### **For Week 3 (Checkout):**
✅ **DO implement** - This is THE checkout API

---

## 💻 IMPLEMENTATION PLAN (Week 3)

### **Step 1: Create API Client**
```typescript
// utils/postnord-delivery-options.ts
export async function getDeliveryOptions(params: {
  warehousePostalCode: string;
  warehouseCity: string;
  warehouseStreet: string;
  customerPostalCode: string;
  cutoffTime?: string;
}) {
  const response = await fetch(
    `https://api2.postnord.com/rest/shipment/v1/deliveryoptions/bywarehouse?apikey=${POSTNORD_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en'
      },
      body: JSON.stringify({
        warehouses: [{
          id: 'main',
          address: {
            postCode: params.warehousePostalCode,
            city: params.warehouseCity,
            street: params.warehouseStreet,
            countryCode: 'SE'
          },
          orderHandling: {
            timeOfLatestOrder: params.cutoffTime || new Date().toISOString()
          }
        }],
        customer: {
          customerKey: 'performile'
        },
        recipient: {
          address: {
            postCode: params.customerPostalCode,
            countryCode: 'SE'
          }
        }
      })
    }
  );
  
  return response.json();
}
```

### **Step 2: Create API Endpoint**
```typescript
// api/checkout/delivery-options.ts
import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { getDeliveryOptions } from '../../utils/postnord-delivery-options';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { merchantId, customerPostalCode } = req.body;

    // Get merchant warehouse address
    const { data: merchant } = await supabase
      .from('merchants')
      .select('warehouse_postal_code, warehouse_city, warehouse_street')
      .eq('merchant_id', merchantId)
      .single();

    // Get delivery options
    const options = await getDeliveryOptions({
      warehousePostalCode: merchant.warehouse_postal_code,
      warehouseCity: merchant.warehouse_city,
      warehouseStreet: merchant.warehouse_street,
      customerPostalCode
    });

    return res.status(200).json(options);
  } catch (error) {
    console.error('Error getting delivery options:', error);
    return res.status(500).json({ error: 'Failed to get delivery options' });
  }
}
```

### **Step 3: Use in Checkout**
```tsx
// components/checkout/DeliveryOptions.tsx
import { useState, useEffect } from 'react';

export function DeliveryOptions({ merchantId, customerPostalCode }) {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOptions() {
      const response = await fetch('/api/checkout/delivery-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, customerPostalCode })
      });
      
      const data = await response.json();
      setOptions(data);
      setLoading(false);
    }
    
    fetchOptions();
  }, [merchantId, customerPostalCode]);

  if (loading) return <div>Loading delivery options...</div>;

  return (
    <div className="delivery-options">
      {options.warehouseToDeliveryOptions[0].deliveryOptions.map(option => (
        <DeliveryOption key={option.type} option={option} />
      ))}
    </div>
  );
}
```

---

## 🗄️ DATABASE SCHEMA (Week 3)

```sql
-- Store delivery options for orders
CREATE TABLE order_delivery_options (
  option_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(order_id),
  
  -- PostNord booking data
  delivery_option_id VARCHAR(32) NOT NULL, -- From API
  service_code VARCHAR(10) NOT NULL,
  additional_service_codes TEXT[], -- Array of codes
  service_point_id VARCHAR(50), -- If applicable
  
  -- Delivery details
  delivery_type VARCHAR(50) NOT NULL, -- home, parcel-locker, etc
  delivery_time_earliest TIMESTAMPTZ,
  delivery_time_latest TIMESTAMPTZ,
  
  -- Display text
  title VARCHAR(200),
  description TEXT,
  friendly_delivery_info VARCHAR(200),
  
  -- Sustainability
  fossil_free BOOLEAN DEFAULT false,
  nordic_swan_ecolabel BOOLEAN DEFAULT false,
  
  -- Location (if applicable)
  location_name VARCHAR(200),
  location_address JSONB,
  location_distance_meters INTEGER,
  location_coordinates JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_delivery_options_order_id 
  ON order_delivery_options(order_id);
```

---

## ✅ SUMMARY

**What:** Complete checkout delivery options API  
**When:** Week 3 (checkout integration)  
**Priority:** 🔴 **CRITICAL** for Week 3  
**Replaces:** Service Points API + Transit Time API + Shipping Guide API

**Benefits:**
- ✅ One API call instead of 3+
- ✅ Checkout-ready text (no formatting needed)
- ✅ Accurate delivery times
- ✅ Service point locations included
- ✅ Booking instructions included
- ✅ Sustainability info included

---

**Status:** 📝 Documented for Week 3  
**Priority:** 🔴 CRITICAL (Week 3 only)  
**Today's Focus:** 🟢 Tracking APIs (already documented)

---

**This is THE API for Week 3 checkout! Save this for next week! 🚀**
