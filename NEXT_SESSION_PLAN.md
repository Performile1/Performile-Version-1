# 🚀 Next Session Plan - E-commerce Plugin Integration

**Priority:** HIGH  
**Estimated Time:** 2-3 hours  
**Goal:** Integrate checkout analytics tracking into Shopify plugin

---

## 📋 **Current State Analysis**

### **✅ What We Have:**

1. **Shopify Plugin** (`apps/shopify/performile-delivery/`)
   - ✅ Checkout UI extension working
   - ✅ Displays top-rated couriers
   - ✅ Fetches courier ratings by postal code
   - ✅ Saves courier selection to order attributes
   - ✅ Shows trust scores, reviews, delivery time

2. **Backend API** (`backend/src/routes/shopify.ts`)
   - ✅ Webhook handlers (fulfillment created/updated)
   - ✅ Store registration endpoint
   - ✅ Analytics endpoint
   - ✅ Authentication middleware

3. **Checkout Analytics API** (Just built!)
   - ✅ `POST /api/courier/checkout-analytics/track`
   - ✅ Accepts position, trust score, price, order details
   - ✅ Stores in `courier_checkout_positions` table

### **❌ What's Missing:**

1. **Tracking Call** - Shopify plugin doesn't call `/track` endpoint
2. **Position Data** - Plugin doesn't record which position courier was shown
3. **Selection Tracking** - Plugin doesn't track if courier was selected
4. **Order Details** - Plugin doesn't send order value, items, weight
5. **Session ID** - No unique checkout session identifier

---

## 🎯 **Implementation Plan**

### **Phase 1: Add Tracking to Shopify Plugin** (1 hour)

#### **Step 1: Modify Checkout.jsx**

**Location:** `apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx`

**Changes Needed:**

1. **Generate Session ID**
   ```javascript
   const [sessionId] = useState(() => `checkout_${Date.now()}_${Math.random()}`);
   ```

2. **Track Courier Display**
   ```javascript
   const trackCourierDisplay = async (courier, position, totalCouriers) => {
     try {
       await fetch('https://your-api.com/api/courier/checkout-analytics/track', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           merchantId: settings.merchant_id,
           courierId: courier.courier_id,
           checkoutSessionId: sessionId,
           positionShown: position,
           totalCouriersShown: totalCouriers,
           wasSelected: false, // Will update on selection
           trustScoreAtTime: courier.trust_score,
           priceAtTime: courier.price || 0,
           deliveryTimeEstimate: courier.delivery_hours || 48,
           distanceKm: courier.distance_km || 0,
           orderValue: cart.total || 0,
           itemsCount: cart.items.length || 0,
           packageWeightKg: cart.total_weight || 0,
           deliveryPostalCode: shippingAddress.zip,
           deliveryCity: shippingAddress.city,
           deliveryCountry: shippingAddress.country,
         }),
       });
     } catch (error) {
       console.error('Failed to track courier display:', error);
     }
   };
   ```

3. **Track on Display**
   ```javascript
   useEffect(() => {
     if (couriers.length > 0) {
       couriers.forEach((courier, index) => {
         trackCourierDisplay(courier, index + 1, couriers.length);
       });
     }
   }, [couriers]);
   ```

4. **Update on Selection**
   ```javascript
   const handleCourierSelect = async (courier, position) => {
     setSelectedCourier(courier.courier_id);
     
     // Track selection
     await fetch('https://your-api.com/api/courier/checkout-analytics/track', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         merchantId: settings.merchant_id,
         courierId: courier.courier_id,
         checkoutSessionId: sessionId,
         positionShown: position,
         totalCouriersShown: couriers.length,
         wasSelected: true, // ✅ Selected!
         // ... rest of data
       }),
     });
     
     // Save to order attributes
     await applyAttributeChange({
       type: 'updateAttribute',
       key: 'performile_courier_id',
       value: courier.courier_id,
     });
   };
   ```

#### **Step 2: Add Cart/Order Data Access**

**Shopify provides:**
- `useCartLines()` - Get cart items
- `useTotalAmount()` - Get order total
- `useShippingAddress()` - Already using this

**Update imports:**
```javascript
import {
  useCartLines,
  useTotalAmount,
  useShippingAddress,
  // ... existing imports
} from '@shopify/ui-extensions-react/checkout';
```

**Calculate order details:**
```javascript
const cartLines = useCartLines();
const totalAmount = useTotalAmount();

const orderValue = totalAmount?.amount || 0;
const itemsCount = cartLines.length;
const packageWeight = cartLines.reduce((sum, line) => {
  return sum + (line.merchandise.weight?.value || 0) * line.quantity;
}, 0);
```

---

### **Phase 2: Backend Enhancements** (30 minutes)

#### **Step 1: Add CORS for Shopify**

**Location:** `backend/src/middleware/security.ts`

```typescript
const corsOptions = {
  origin: [
    'https://your-store.myshopify.com',
    'https://*.shopify.com', // Allow all Shopify domains
    // ... existing origins
  ],
  credentials: true,
};
```

#### **Step 2: Make Track Endpoint Public**

**Location:** `backend/src/routes/courier-checkout-analytics.ts`

```typescript
// Move track endpoint BEFORE authenticateToken middleware
router.post('/track', async (req: Request, res: Response) => {
  // No auth required - called from public checkout
  // Validate merchant_id exists
  // ... existing code
});
```

#### **Step 3: Add API Key Authentication (Optional)**

```typescript
router.post('/track', validateApiKey, async (req: Request, res: Response) => {
  // Validate API key from merchant settings
});
```

---

### **Phase 3: Testing** (30 minutes)

#### **Test Checklist:**

1. **Display Tracking**
   - [ ] Open Shopify checkout
   - [ ] Verify couriers are displayed
   - [ ] Check database for position records
   - [ ] Verify all 3 couriers tracked

2. **Selection Tracking**
   - [ ] Click on a courier
   - [ ] Verify `was_selected = true` in database
   - [ ] Check position matches display order

3. **Order Data**
   - [ ] Verify order value is correct
   - [ ] Check items count matches cart
   - [ ] Validate weight calculation

4. **Geographic Data**
   - [ ] Verify postal code saved
   - [ ] Check city and country

5. **Session Tracking**
   - [ ] Multiple checkouts = different session IDs
   - [ ] Same checkout = same session ID

---

### **Phase 4: WooCommerce Plugin** (1 hour)

**Similar implementation for WooCommerce:**

1. Create WooCommerce plugin directory
2. Add checkout block/widget
3. Display courier ratings
4. Track positions and selections
5. Send to same `/track` endpoint

---

## 📊 **Expected Data Flow**

```
Customer enters checkout
    ↓
Plugin fetches top 3 couriers
    ↓
Plugin calls /track for each courier (position 1, 2, 3)
    ↓
Data saved to courier_checkout_positions
    ↓
Customer selects courier #2
    ↓
Plugin calls /track again (was_selected = true)
    ↓
Order completes
    ↓
Daily aggregation runs
    ↓
Courier sees analytics in dashboard
```

---

## 🔧 **Code Files to Modify**

### **Frontend (Shopify Plugin):**
1. `apps/shopify/performile-delivery/extensions/checkout-ui/src/Checkout.jsx`
   - Add session ID generation
   - Add tracking function
   - Add cart data hooks
   - Track on display
   - Track on selection

### **Backend:**
2. `backend/src/routes/courier-checkout-analytics.ts`
   - Move `/track` before auth middleware
   - Add API key validation (optional)

3. `backend/src/middleware/security.ts`
   - Add Shopify domains to CORS

4. `backend/src/controllers/shopifyController.ts`
   - Add merchant_id to settings

---

## 🎯 **Success Criteria**

✅ **Tracking Works:**
- Every courier display creates a record
- Position numbers are correct (1, 2, 3)
- Selection updates `was_selected` field

✅ **Data Complete:**
- Order value captured
- Items count captured
- Package weight captured
- Delivery address captured

✅ **Dashboard Shows Data:**
- Courier sees their positions
- Charts display correctly
- Top merchants table populated

✅ **Performance:**
- Tracking doesn't slow checkout
- Async calls don't block UI
- Error handling prevents crashes

---

## 📝 **Testing Script**

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Start Shopify plugin dev
cd apps/shopify/performile-delivery
shopify app dev

# 3. Open test store checkout
# Add items to cart
# Proceed to checkout
# Enter shipping address

# 4. Check database
psql -d performile -c "SELECT * FROM courier_checkout_positions ORDER BY created_at DESC LIMIT 10;"

# 5. Select a courier
# Check database again for was_selected = true

# 6. View dashboard
# Navigate to /courier/checkout-analytics
# Verify data appears
```

---

## 🚨 **Potential Issues & Solutions**

### **Issue 1: CORS Errors**
**Solution:** Add Shopify domains to CORS whitelist

### **Issue 2: No merchant_id in settings**
**Solution:** Add merchant_id to plugin configuration

### **Issue 3: Cart data not available**
**Solution:** Use Shopify hooks or fallback to 0

### **Issue 4: Tracking fails silently**
**Solution:** Add error logging and retry logic

### **Issue 5: Duplicate tracking**
**Solution:** Use session ID + courier ID to prevent duplicates

---

## 📈 **Metrics to Track**

After implementation, monitor:

1. **Tracking Success Rate**
   - % of checkouts with position data
   - % of selections tracked

2. **Data Quality**
   - % with order value
   - % with package weight
   - % with complete address

3. **Performance**
   - API response time
   - Checkout load time impact
   - Database query performance

4. **Business Impact**
   - Couriers using analytics
   - Premium feature conversions
   - Merchant satisfaction

---

## 🎉 **Deliverables**

After this session, you'll have:

1. ✅ Shopify plugin tracking checkout positions
2. ✅ Complete order data captured
3. ✅ Real data flowing to dashboard
4. ✅ Couriers seeing their performance
5. ✅ Foundation for WooCommerce plugin

---

## 🔜 **Future Sessions**

### **Session 3: Premium Features** (2 hours)
- Stripe payment integration
- Premium access management
- Merchant insights detail page
- Email notifications

### **Session 4: Market Insights** (3 hours)
- Market segments table
- Anonymized data aggregation
- Benchmarking calculations
- Market insights tab frontend

### **Session 5: Enhancements** (2 hours)
- Export functionality (CSV/PDF)
- Email reports
- Position alerts
- Mobile optimization

---

**Ready to integrate! Let's make the data flow! 🚀**
