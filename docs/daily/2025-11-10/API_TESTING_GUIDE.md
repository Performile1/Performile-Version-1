# 🧪 COURIER PRICING API - TESTING GUIDE

**Date:** November 10, 2025  
**Purpose:** Test all 3 new pricing API endpoints

---

## 📋 ENDPOINTS CREATED

1. **`POST /api/couriers/get-base-price`** - Get courier's base price
2. **`POST /api/couriers/calculate-price`** - Get final price with merchant markup
3. **`POST /api/couriers/compare-prices`** - Compare all couriers

---

## 🧪 TEST 1: Get Base Price

### **Endpoint:**
```
POST /api/couriers/get-base-price
```

### **Request Body:**
```json
{
  "courier_id": "YOUR_POSTNORD_UUID",
  "service_type": "express",
  "actual_weight": 5.0,
  "length_cm": 40,
  "width_cm": 30,
  "height_cm": 20,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003"
}
```

### **Expected Response:**
```json
{
  "courier": {
    "courier_id": "uuid",
    "courier_name": "PostNord",
    "logo_url": "..."
  },
  "service_type": "express",
  "pricing": {
    "base_price": 89.00,
    "weight_cost": 60.00,
    "distance_cost": 250.00,
    "zone_multiplier": 1.0,
    "subtotal": 399.00,
    "surcharges": [
      {
        "type": "fuel",
        "name": "Fuel Surcharge",
        "amount": 15.00,
        "method": "fixed"
      }
    ],
    "total_surcharges": 15.00,
    "total_base_price": 414.00,
    "currency": "SEK"
  },
  "weight_details": {
    "actual_weight": 5.0,
    "volumetric_weight": 6.72,
    "chargeable_weight": 6.72,
    "dimensions_provided": true
  },
  "shipment_details": {
    "distance": 100,
    "from_postal": "0150",
    "to_postal": "5003"
  },
  "calculation_breakdown": {
    "base_price": 89.00,
    "weight_cost": 60.00,
    "distance_cost": 250.00,
    "before_zone": 399.00,
    "zone_multiplier": 1.0,
    "after_zone": 399.00,
    "surcharges": 15.00,
    "total": 414.00,
    "currency": "SEK"
  }
}
```

### **Test Cases:**

#### **Test 1.1: Light but bulky package**
```json
{
  "courier_id": "POSTNORD_UUID",
  "service_type": "express",
  "actual_weight": 3.0,
  "length_cm": 50,
  "width_cm": 50,
  "height_cm": 50,
  "distance": 50,
  "from_postal": "0150",
  "to_postal": "0160"
}
```
**Expected:** Volumetric weight (35 kg) > Actual weight (3 kg)  
**Charged on:** 35 kg

#### **Test 1.2: Heavy but small package**
```json
{
  "courier_id": "POSTNORD_UUID",
  "service_type": "standard",
  "actual_weight": 15.0,
  "length_cm": 30,
  "width_cm": 20,
  "height_cm": 20,
  "distance": 200,
  "from_postal": "0150",
  "to_postal": "5003"
}
```
**Expected:** Actual weight (15 kg) > Volumetric weight (3.36 kg)  
**Charged on:** 15 kg

#### **Test 1.3: Remote area (Northern Norway)**
```json
{
  "courier_id": "POSTNORD_UUID",
  "service_type": "express",
  "actual_weight": 5.0,
  "distance": 500,
  "from_postal": "0150",
  "to_postal": "9000"
}
```
**Expected:** Zone multiplier 1.3 (Tromsø)  
**Surcharge:** Remote area fee applies

---

## 🧪 TEST 2: Calculate Final Price (with Merchant Markup)

### **Endpoint:**
```
POST /api/couriers/calculate-price
```

### **Request Body:**
```json
{
  "merchant_id": "YOUR_MERCHANT_UUID",
  "courier_id": "YOUR_POSTNORD_UUID",
  "service_type": "express",
  "actual_weight": 5.0,
  "length_cm": 40,
  "width_cm": 30,
  "height_cm": 20,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003"
}
```

### **Expected Response:**
```json
{
  "courier": {
    "courier_id": "uuid",
    "courier_name": "PostNord",
    "logo_url": "..."
  },
  "service_type": "express",
  "base_pricing": {
    "base_price": 89.00,
    "weight_cost": 60.00,
    "distance_cost": 250.00,
    "zone_multiplier": 1.0,
    "surcharges": [...],
    "total_surcharges": 15.00,
    "subtotal": 399.00,
    "total_base_price": 414.00,
    "currency": "SEK"
  },
  "merchant_markup": {
    "margin_type": "percentage",
    "margin_value": 15.00,
    "margin_amount": 62.10,
    "has_markup": true
  },
  "final_pricing": {
    "before_markup": 414.00,
    "markup_amount": 62.10,
    "after_markup": 476.10,
    "rounded_price": 480.00,
    "currency": "SEK"
  },
  "weight_details": {
    "actual_weight": 5.0,
    "volumetric_weight": 6.72,
    "chargeable_weight": 6.72
  },
  "shipment_details": {
    "distance": 100,
    "from_postal": "0150",
    "to_postal": "5003"
  },
  "calculation_breakdown": {
    "base_calculation": {...},
    "merchant_markup": {...}
  }
}
```

### **Test Cases:**

#### **Test 2.1: Merchant with 15% markup**
**Setup:** Merchant has 15% margin in `merchant_pricing_settings`  
**Expected:** Final price = Base price × 1.15

#### **Test 2.2: Merchant with no markup**
**Setup:** Merchant has no pricing settings  
**Expected:** Final price = Base price (no markup)

#### **Test 2.3: Merchant with fixed markup**
**Setup:** Merchant has 50 SEK fixed margin  
**Expected:** Final price = Base price + 50 SEK

---

## 🧪 TEST 3: Compare Prices

### **Endpoint:**
```
POST /api/couriers/compare-prices
```

### **Request Body:**
```json
{
  "merchant_id": "YOUR_MERCHANT_UUID",
  "service_type": "express",
  "actual_weight": 5.0,
  "length_cm": 40,
  "width_cm": 30,
  "height_cm": 20,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003",
  "sort_by": "price"
}
```

### **Expected Response:**
```json
{
  "shipment_details": {
    "service_type": "express",
    "actual_weight": 5.0,
    "distance": 100,
    "from_postal": "0150",
    "to_postal": "5003",
    "dimensions_provided": true
  },
  "comparison": {
    "total_couriers": 3,
    "sorted_by": "price",
    "cheapest": {
      "courier_name": "PostNord",
      "rounded_price": 480.00
    },
    "most_expensive": {
      "courier_name": "DHL",
      "rounded_price": 650.00
    },
    "price_range": {
      "min": 480.00,
      "max": 650.00,
      "difference": 170.00,
      "currency": "SEK"
    }
  },
  "couriers": [
    {
      "courier_id": "uuid",
      "courier_name": "PostNord",
      "logo_url": "...",
      "service_type": "express",
      "base_price": 414.00,
      "merchant_markup": 62.10,
      "final_price": 476.10,
      "rounded_price": 480.00,
      "currency": "SEK",
      "chargeable_weight": 6.72,
      "trust_score": 92,
      "ranking_score": 8.5,
      "recommended": true,
      "surcharges": [...],
      "total_surcharges": 15.00,
      "calculation_breakdown": {...}
    },
    {
      "courier_name": "Bring",
      "rounded_price": 520.00,
      "recommended": false
    },
    {
      "courier_name": "DHL",
      "rounded_price": 650.00,
      "recommended": false
    }
  ]
}
```

### **Test Cases:**

#### **Test 3.1: Sort by price (default)**
```json
{
  "sort_by": "price"
}
```
**Expected:** Cheapest courier first

#### **Test 3.2: Sort by trust score**
```json
{
  "sort_by": "trust_score"
}
```
**Expected:** Highest trust score first

#### **Test 3.3: Sort by ranking**
```json
{
  "sort_by": "ranking"
}
```
**Expected:** Best ranking score first

#### **Test 3.4: Specific couriers only**
```json
{
  "courier_ids": ["POSTNORD_UUID", "BRING_UUID"]
}
```
**Expected:** Only compare PostNord and Bring

---

## 🔧 SETUP REQUIRED BEFORE TESTING

### **1. Get Courier UUIDs**
```sql
SELECT courier_id, courier_name FROM couriers 
WHERE courier_name IN ('PostNord', 'Bring', 'DHL');
```

### **2. Get Merchant UUID**
```sql
SELECT user_id, email FROM users 
WHERE role = 'merchant' 
LIMIT 1;
```

### **3. Setup Merchant Pricing (Optional)**
```sql
-- Add 15% markup for testing
INSERT INTO merchant_pricing_settings (
    merchant_id,
    default_margin_type,
    default_margin_value,
    round_prices,
    round_to,
    currency
) VALUES (
    'YOUR_MERCHANT_UUID',
    'percentage',
    15.00,
    true,
    5.00,
    'SEK'
);
```

### **4. Link Merchant to Couriers**
```sql
-- Make sure merchant has active couriers
INSERT INTO merchant_couriers (merchant_id, courier_id, is_active)
SELECT 'YOUR_MERCHANT_UUID', courier_id, true
FROM couriers
WHERE courier_name IN ('PostNord', 'Bring', 'DHL');
```

---

## 📊 EXPECTED CALCULATION EXAMPLES

### **Example 1: PostNord Express, 5kg, 100km**

```
1. Base price: 89 SEK
2. Weight cost: 5kg × 12 SEK/kg = 60 SEK
3. Distance cost: 100km × 2.50 SEK/km = 250 SEK
4. Subtotal: 89 + 60 + 250 = 399 SEK
5. Zone multiplier: 1.0 (Bergen normal zone)
6. After zone: 399 × 1.0 = 399 SEK
7. Fuel surcharge: 15 SEK
8. Total base: 399 + 15 = 414 SEK
9. Merchant markup (15%): 414 × 0.15 = 62.10 SEK
10. Final price: 414 + 62.10 = 476.10 SEK
11. Rounded (to 5 SEK): 480 SEK
```

### **Example 2: Volumetric Weight Calculation**

```
Package: 50cm × 50cm × 50cm
Actual weight: 3 kg

Volume: 50 × 50 × 50 = 125,000 cm³
Volumetric weight: 125,000 / 3571 = 35 kg
Chargeable weight: MAX(3, 35) = 35 kg

Price based on: 35 kg (not 3 kg!)
```

---

## ✅ SUCCESS CRITERIA

### **All Tests Pass If:**
- ✅ Base price calculated correctly
- ✅ Volumetric weight applied when > actual weight
- ✅ Zone multipliers applied correctly
- ✅ Surcharges added properly
- ✅ Merchant markup calculated correctly
- ✅ Prices rounded as configured
- ✅ Compare returns all couriers sorted correctly
- ✅ Recommended courier marked appropriately

---

## 🐛 COMMON ISSUES & FIXES

### **Issue 1: "No pricing data found"**
**Cause:** No base prices in database  
**Fix:** Run sample data SQL again

### **Issue 2: "Courier not found"**
**Cause:** Invalid courier UUID  
**Fix:** Check courier_id from database

### **Issue 3: Volumetric weight = actual weight**
**Cause:** No dimensions provided  
**Fix:** Include length_cm, width_cm, height_cm

### **Issue 4: No merchant markup applied**
**Cause:** No merchant pricing settings  
**Fix:** Insert merchant_pricing_settings record

### **Issue 5: Compare returns empty**
**Cause:** Merchant has no active couriers  
**Fix:** Insert merchant_couriers records

---

## 🎯 NEXT STEPS AFTER TESTING

1. ✅ Verify all calculations are correct
2. ✅ Test edge cases (0 distance, no dimensions, etc.)
3. ✅ Test with different currencies (SEK vs NOK)
4. ✅ Test remote areas (Tromsø, Svalbard)
5. ✅ Test with different service types
6. ✅ Document any issues found
7. ✅ Create integration tests
8. ✅ Update API documentation

---

## 📝 TESTING CHECKLIST

- [ ] Test 1.1: Light but bulky package
- [ ] Test 1.2: Heavy but small package
- [ ] Test 1.3: Remote area delivery
- [ ] Test 2.1: With merchant markup
- [ ] Test 2.2: Without merchant markup
- [ ] Test 2.3: Fixed markup
- [ ] Test 3.1: Sort by price
- [ ] Test 3.2: Sort by trust score
- [ ] Test 3.3: Sort by ranking
- [ ] Test 3.4: Specific couriers only
- [ ] Edge case: No dimensions
- [ ] Edge case: Zero distance
- [ ] Edge case: Invalid courier
- [ ] Edge case: Invalid service type

---

## 🚀 READY TO TEST!

Use Postman, Insomnia, or curl to test these endpoints.

**Base URL:** `https://your-domain.com` or `http://localhost:3000`
