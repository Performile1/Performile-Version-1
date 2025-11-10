# CHECKOUT ANALYTICS INTEGRATION GUIDE

**Date:** November 10, 2025  
**For:** Frontend Developers  
**Time to Integrate:** 30 minutes

---

## 🎯 QUICK START

Add 2 API calls to your checkout flow to enable dynamic courier ranking.

---

## 📋 STEP 1: LOG COURIER DISPLAY

**When:** After displaying courier options to customer  
**Where:** Checkout page, after fetching available couriers

### **Code Example:**

```typescript
// After fetching couriers from /api/couriers/available
const logCourierDisplay = async (
  sessionId: string,
  merchantId: string,
  couriers: Courier[],
  orderContext: OrderContext,
  deliveryLocation: DeliveryLocation
) => {
  try {
    const response = await fetch('/api/checkout/log-courier-display', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_session_id: sessionId,
        merchant_id: merchantId,
        couriers: couriers.map((courier, index) => ({
          courier_id: courier.id,
          position_shown: index + 1,
          trust_score: courier.trust_score,
          price: courier.price,
          delivery_time_hours: courier.estimated_delivery_hours,
          distance_km: courier.distance_km
        })),
        order_context: {
          order_value: orderContext.total,
          items_count: orderContext.items.length,
          package_weight_kg: orderContext.total_weight
        },
        delivery_location: {
          postal_code: deliveryLocation.postal_code,
          city: deliveryLocation.city,
          country: deliveryLocation.country
        }
      })
    });

    if (!response.ok) {
      console.error('Failed to log courier display:', await response.text());
    }
  } catch (error) {
    console.error('Error logging courier display:', error);
    // Don't block checkout on analytics failure
  }
};

// Usage in checkout component
useEffect(() => {
  if (availableCouriers.length > 0) {
    const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCheckoutSessionId(sessionId);
    
    logCourierDisplay(
      sessionId,
      merchantId,
      availableCouriers,
      orderContext,
      deliveryLocation
    );
  }
}, [availableCouriers]);
```

---

## 📋 STEP 2: LOG COURIER SELECTION

**When:** When customer selects a courier  
**Where:** Checkout page, on courier selection

### **Code Example:**

```typescript
const logCourierSelection = async (
  sessionId: string,
  selectedCourierId: string
) => {
  try {
    const response = await fetch('/api/checkout/log-courier-selection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_session_id: sessionId,
        selected_courier_id: selectedCourierId
      })
    });

    if (!response.ok) {
      console.error('Failed to log courier selection:', await response.text());
    }
  } catch (error) {
    console.error('Error logging courier selection:', error);
    // Don't block checkout on analytics failure
  }
};

// Usage in courier selection handler
const handleCourierSelect = (courierId: string) => {
  setSelectedCourier(courierId);
  
  if (checkoutSessionId) {
    logCourierSelection(checkoutSessionId, courierId);
  }
};
```

---

## 🔧 COMPLETE INTEGRATION EXAMPLE

### **TypeScript Types:**

```typescript
interface Courier {
  id: string;
  name: string;
  trust_score: number;
  price: number;
  estimated_delivery_hours: number;
  distance_km?: number;
}

interface OrderContext {
  total: number;
  items: CartItem[];
  total_weight: number;
}

interface DeliveryLocation {
  postal_code: string;
  city: string;
  country: string;
}
```

### **React Component:**

```typescript
import { useState, useEffect } from 'react';

export const CheckoutPage = () => {
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>('');
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  
  const merchantId = 'your-merchant-id';
  const orderContext = {
    total: 1250.00,
    items: cartItems,
    total_weight: 5.0
  };
  const deliveryLocation = {
    postal_code: '0150',
    city: 'Oslo',
    country: 'NO'
  };

  // Fetch available couriers
  useEffect(() => {
    const fetchCouriers = async () => {
      const response = await fetch(
        `/api/couriers/available?postal_code=${deliveryLocation.postal_code}`
      );
      const data = await response.json();
      setAvailableCouriers(data.couriers || []);
    };

    fetchCouriers();
  }, [deliveryLocation.postal_code]);

  // Log courier display when couriers are loaded
  useEffect(() => {
    if (availableCouriers.length > 0 && !checkoutSessionId) {
      const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCheckoutSessionId(sessionId);
      
      logCourierDisplay(
        sessionId,
        merchantId,
        availableCouriers,
        orderContext,
        deliveryLocation
      );
    }
  }, [availableCouriers]);

  // Handle courier selection
  const handleCourierSelect = (courierId: string) => {
    setSelectedCourier(courierId);
    
    if (checkoutSessionId) {
      logCourierSelection(checkoutSessionId, courierId);
    }
  };

  return (
    <div>
      <h2>Select Delivery Option</h2>
      {availableCouriers.map((courier, index) => (
        <CourierCard
          key={courier.id}
          courier={courier}
          position={index + 1}
          isSelected={selectedCourier === courier.id}
          onSelect={() => handleCourierSelect(courier.id)}
        />
      ))}
    </div>
  );
};

// Helper functions (from Step 1 and Step 2)
const logCourierDisplay = async (...) => { /* See Step 1 */ };
const logCourierSelection = async (...) => { /* See Step 2 */ };
```

---

## 🎨 SHOPIFY INTEGRATION

### **Checkout Extension:**

```typescript
// In your Shopify checkout extension
import { useEffect } from 'react';
import { useExtensionApi } from '@shopify/checkout-ui-extensions-react';

export const CourierSelector = () => {
  const { sessionToken, shop } = useExtensionApi();
  
  useEffect(() => {
    const logDisplay = async () => {
      const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await fetch('https://your-api.vercel.app/api/checkout/log-courier-display', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkout_session_id: sessionId,
          merchant_id: shop.id,
          couriers: displayedCouriers,
          // ... rest of data
        })
      });
    };
    
    logDisplay();
  }, [displayedCouriers]);
  
  // ... rest of component
};
```

---

## 🚨 ERROR HANDLING

### **Best Practices:**

```typescript
const logCourierDisplay = async (...) => {
  try {
    const response = await fetch('/api/checkout/log-courier-display', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific errors
      if (response.status === 409) {
        console.warn('Checkout session already logged');
        return; // Already logged, continue
      }
      
      if (response.status === 400) {
        console.error('Invalid data:', error);
        // Log to monitoring service
      }
      
      throw new Error(error.message);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to log courier display:', error);
    // Don't block checkout - analytics is non-critical
    // But do log to monitoring service
    logToMonitoring('checkout_analytics_error', error);
  }
};
```

---

## ✅ VALIDATION

### **Session ID Format:**

```typescript
// CORRECT: checkout_timestamp_random
const sessionId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// WRONG: Don't use these
const badId1 = 'session_123';  // ❌ Must start with 'checkout_'
const badId2 = Date.now().toString();  // ❌ Not unique enough
const badId3 = crypto.randomUUID();  // ❌ Wrong format
```

### **Required Fields:**

```typescript
// Minimum required for log-courier-display
{
  checkout_session_id: string,  // Required
  merchant_id: string,           // Required
  couriers: [                    // Required, min 1
    {
      courier_id: string,        // Required
      position_shown: number     // Optional (auto-calculated)
    }
  ]
}

// Minimum required for log-courier-selection
{
  checkout_session_id: string,   // Required
  selected_courier_id: string    // Required
}
```

---

## 🧪 TESTING

### **Test in Development:**

```typescript
// 1. Enable console logging
const logCourierDisplay = async (...) => {
  console.log('Logging courier display:', {
    sessionId,
    courierCount: couriers.length
  });
  
  const response = await fetch(...);
  console.log('Response:', await response.json());
};

// 2. Test with mock data
const testCheckoutAnalytics = async () => {
  const sessionId = `checkout_${Date.now()}_test`;
  
  // Log display
  await logCourierDisplay(
    sessionId,
    'test-merchant-id',
    mockCouriers,
    mockOrderContext,
    mockDeliveryLocation
  );
  
  // Log selection
  await logCourierSelection(sessionId, mockCouriers[0].id);
  
  console.log('✅ Test complete');
};
```

### **Verify in Database:**

```sql
-- Check logged displays
SELECT * FROM checkout_courier_analytics 
WHERE checkout_session_id LIKE 'checkout_%test%'
ORDER BY created_at DESC;

-- Check selection rates
SELECT 
  courier_id,
  COUNT(*) as displays,
  SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) as selections,
  ROUND(100.0 * SUM(CASE WHEN was_selected THEN 1 ELSE 0 END) / COUNT(*), 2) as selection_rate
FROM checkout_courier_analytics
GROUP BY courier_id;
```

---

## 📊 MONITORING

### **Key Metrics to Track:**

```typescript
// Add to your analytics service
const trackCheckoutAnalytics = {
  displayLogged: (sessionId: string, courierCount: number) => {
    analytics.track('Checkout: Couriers Displayed', {
      session_id: sessionId,
      courier_count: courierCount
    });
  },
  
  selectionLogged: (sessionId: string, courierId: string, position: number) => {
    analytics.track('Checkout: Courier Selected', {
      session_id: sessionId,
      courier_id: courierId,
      position: position
    });
  },
  
  analyticsError: (error: Error, context: string) => {
    analytics.track('Checkout: Analytics Error', {
      error: error.message,
      context: context
    });
  }
};
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Add API calls to checkout flow
- [ ] Test with real checkout data
- [ ] Verify session IDs are unique
- [ ] Check error handling works
- [ ] Monitor API response times
- [ ] Verify data in database
- [ ] Check cron job is running
- [ ] Monitor ranking updates

---

## 💡 TIPS

1. **Session ID:** Generate once per checkout, reuse for both calls
2. **Non-blocking:** Don't wait for API responses, fire and forget
3. **Error handling:** Log errors but don't block checkout
4. **Testing:** Use `checkout_*_test` session IDs for testing
5. **Performance:** APIs are fast (<100ms), but still async
6. **Privacy:** No PII is logged (only postal code, not full address)

---

## 🆘 TROUBLESHOOTING

### **Problem: 409 Conflict Error**
**Cause:** Session ID already logged  
**Solution:** Generate new session ID or ignore error

### **Problem: 404 Not Found (selection API)**
**Cause:** Display not logged first  
**Solution:** Always call log-courier-display before log-courier-selection

### **Problem: 400 Invalid Courier**
**Cause:** Selected courier wasn't displayed  
**Solution:** Only allow selection of displayed couriers

### **Problem: Analytics not updating rankings**
**Cause:** Cron job not running  
**Solution:** Check Vercel cron configuration and CRON_SECRET

---

## 📚 RELATED DOCS

- `CHECKOUT_ANALYTICS_IMPLEMENTATION.md` - Full technical spec
- `DYNAMIC_COURIER_RANKING_SPEC.md` - Ranking algorithm details
- API docs: `/api/checkout/log-courier-display`
- API docs: `/api/checkout/log-courier-selection`

---

**Questions?** Check the main implementation doc or contact the platform team.

**Status:** ✅ READY TO INTEGRATE
