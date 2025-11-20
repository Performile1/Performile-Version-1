# 📦 PRICING API DOCUMENTATION

**Date:** November 19, 2025  
**Version:** 1.0  
**Status:** Ready for Testing

---

## 🎯 OVERVIEW

The Pricing API calculates shipping costs based on:
- Courier base pricing
- Weight-based tiers
- Distance-based tiers
- Postal code zones
- Surcharges (fuel, remote area, insurance, etc.)

---

## 🔗 ENDPOINTS

### **1. Calculate Single Courier Price**

**Endpoint:** `POST /api/couriers/calculate-shipping-price`

**Description:** Calculate shipping price for a specific courier

**Request Body:**
```json
{
  "courier_id": "uuid",
  "service_level": "standard",
  "weight": 5.0,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003",
  "surcharges": ["fuel", "insurance"]
}
```

**Parameters:**
- `courier_id` (required): UUID of the courier
- `service_level` (required): "standard", "express", or "same_day"
- `weight` (required): Weight in kg (must be > 0)
- `distance` (required): Distance in km (must be >= 0)
- `from_postal` (required): Origin postal code
- `to_postal` (required): Destination postal code
- `surcharges` (optional): Array of surcharge types to apply

**Response (Success):**
```json
{
  "success": true,
  "pricing": {
    "courier_id": "uuid",
    "courier_name": "PostNord",
    "service_level": "standard",
    "base_price": 49.00,
    "weight_cost": 10.00,
    "distance_cost": 20.00,
    "zone_multiplier": 1.0,
    "zone_name": "Oslo Region",
    "is_remote_area": false,
    "subtotal": 79.00,
    "surcharge_total": 6.72,
    "surcharge_percentage": 8.5,
    "final_price": 85.72,
    "currency": "NOK",
    "weight_kg": 5.0,
    "distance_km": 100,
    "from_postal": "0150",
    "to_postal": "5003",
    "calculated_at": "2025-11-19T21:30:00Z"
  },
  "valid_until": "2025-11-20T21:30:00Z"
}
```

**Response (Error):**
```json
{
  "error": "No pricing found for this courier/service",
  "details": {
    "courier_id": "uuid",
    "service_level": "standard"
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing fields, invalid values)
- `404` - Courier not found or no pricing available
- `500` - Server error

---

### **2. Compare Prices Across Couriers**

**Endpoint:** `POST /api/couriers/compare-shipping-prices`

**Description:** Get prices from all active couriers for comparison

**Request Body:**
```json
{
  "service_level": "standard",
  "weight": 5.0,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003",
  "surcharges": ["fuel"],
  "merchant_id": "uuid"
}
```

**Parameters:**
- `service_level` (required): "standard", "express", or "same_day"
- `weight` (required): Weight in kg (must be > 0)
- `distance` (required): Distance in km (must be >= 0)
- `from_postal` (required): Origin postal code
- `to_postal` (required): Destination postal code
- `surcharges` (optional): Array of surcharge types to apply
- `merchant_id` (optional): Filter to merchant's selected couriers only

**Response (Success):**
```json
{
  "success": true,
  "total_couriers": 3,
  "service_level": "standard",
  "shipment_details": {
    "weight_kg": 5.0,
    "distance_km": 100,
    "from_postal": "0150",
    "to_postal": "5003"
  },
  "prices": [
    {
      "courier_id": "uuid-1",
      "courier_name": "PostNord",
      "logo_url": "https://...",
      "trust_score": 92,
      "service_level": "standard",
      "final_price": 85.72,
      "base_price": 49.00,
      "surcharge_total": 6.72,
      "zone_name": "Oslo Region",
      "is_remote_area": false,
      "currency": "NOK",
      "rank": 1,
      "is_cheapest": true,
      "price_difference_from_cheapest": 0,
      "breakdown": { /* full pricing breakdown */ }
    },
    {
      "courier_id": "uuid-2",
      "courier_name": "Bring",
      "logo_url": "https://...",
      "trust_score": 88,
      "service_level": "standard",
      "final_price": 92.50,
      "base_price": 55.00,
      "surcharge_total": 7.50,
      "zone_name": "Standard Zone",
      "is_remote_area": false,
      "currency": "NOK",
      "rank": 2,
      "is_cheapest": false,
      "price_difference_from_cheapest": 6.78,
      "breakdown": { /* full pricing breakdown */ }
    }
  ],
  "cheapest": { /* first item from prices array */ },
  "most_expensive": { /* last item from prices array */ },
  "price_range": {
    "min": 85.72,
    "max": 92.50,
    "difference": 6.78
  },
  "calculated_at": "2025-11-19T21:30:00Z",
  "valid_until": "2025-11-20T21:30:00Z"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `404` - No active couriers found
- `500` - Server error

---

## 🧪 TESTING

### **Test 1: Basic Calculation**

```bash
curl -X POST https://your-domain.vercel.app/api/couriers/calculate-shipping-price \
  -H "Content-Type: application/json" \
  -d '{
    "courier_id": "YOUR_COURIER_ID",
    "service_level": "standard",
    "weight": 5.0,
    "distance": 50,
    "from_postal": "0150",
    "to_postal": "0250",
    "surcharges": []
  }'
```

**Expected Result:**
- Status: 200
- Final price: ~79 NOK (base 49 + weight 10 + distance 20)

---

### **Test 2: With Fuel Surcharge**

```bash
curl -X POST https://your-domain.vercel.app/api/couriers/calculate-shipping-price \
  -H "Content-Type: application/json" \
  -d '{
    "courier_id": "YOUR_COURIER_ID",
    "service_level": "standard",
    "weight": 5.0,
    "distance": 50,
    "from_postal": "0150",
    "to_postal": "0250",
    "surcharges": ["fuel"]
  }'
```

**Expected Result:**
- Status: 200
- Final price: ~85.72 NOK (79 + 8.5% fuel surcharge)

---

### **Test 3: Remote Area**

```bash
curl -X POST https://your-domain.vercel.app/api/couriers/calculate-shipping-price \
  -H "Content-Type: application/json" \
  -d '{
    "courier_id": "YOUR_COURIER_ID",
    "service_level": "standard",
    "weight": 10.0,
    "distance": 500,
    "from_postal": "0150",
    "to_postal": "9000",
    "surcharges": ["fuel"]
  }'
```

**Expected Result:**
- Status: 200
- Zone multiplier: 1.5 (Northern Norway)
- Remote area surcharge: +25 NOK
- Higher final price due to zone and distance

---

### **Test 4: Compare Prices**

```bash
curl -X POST https://your-domain.vercel.app/api/couriers/compare-shipping-prices \
  -H "Content-Type: application/json" \
  -d '{
    "service_level": "standard",
    "weight": 5.0,
    "distance": 100,
    "from_postal": "0150",
    "to_postal": "5003",
    "surcharges": ["fuel"]
  }'
```

**Expected Result:**
- Status: 200
- Multiple couriers returned
- Sorted by price (cheapest first)
- Rank and price differences calculated

---

## 📊 PRICING BREAKDOWN

### **Calculation Formula:**

```
1. Base Price (from courier_pricing table)
2. + Weight Cost (from pricing_weight_tiers or price_per_kg)
3. + Distance Cost (from pricing_distance_tiers or price_per_km)
4. × Zone Multiplier (from pricing_zones based on destination)
5. = Subtotal
6. + Fixed Surcharges (from pricing_surcharges)
7. + Percentage Surcharges (applied to subtotal)
8. = Final Price
9. Apply Min/Max Constraints
```

### **Example Calculation:**

**Input:**
- Courier: PostNord
- Service: Standard
- Weight: 5 kg
- Distance: 100 km
- From: 0150 (Oslo)
- To: 5003 (Bergen)
- Surcharges: fuel (8.5%)

**Calculation:**
1. Base Price: 49.00 NOK
2. Weight Cost: 10.00 NOK (tier: 2-5kg)
3. Distance Cost: 40.00 NOK (tier: 50-100km)
4. Zone Multiplier: 1.1 (Bergen region)
5. Subtotal: (49 + 10 + 40) × 1.1 = 108.90 NOK
6. Fuel Surcharge: 108.90 × 8.5% = 9.26 NOK
7. Final Price: 108.90 + 9.26 = 118.16 NOK

---

## 🔧 DATABASE SCHEMA

### **Tables Used:**

1. **courier_pricing** - Base pricing by service level
2. **pricing_zones** - Postal code zone multipliers
3. **pricing_surcharges** - Additional fees
4. **pricing_weight_tiers** - Weight-based pricing
5. **pricing_distance_tiers** - Distance-based pricing

### **Function:**

- `calculate_shipping_price()` - Main pricing calculation function

---

## 🚨 ERROR HANDLING

### **Common Errors:**

**1. Courier Not Found**
```json
{
  "error": "Courier not found: <courier_id>"
}
```
**Solution:** Verify courier_id exists in couriers table

**2. No Pricing Found**
```json
{
  "error": "No pricing found for courier PostNord with service level standard"
}
```
**Solution:** Add pricing data for this courier/service combination

**3. Invalid Weight**
```json
{
  "error": "Weight must be greater than 0"
}
```
**Solution:** Provide valid weight value (> 0)

**4. Invalid Service Level**
```json
{
  "error": "Invalid service_level. Must be: standard, express, or same_day"
}
```
**Solution:** Use one of the three valid service levels

---

## 📝 NOTES

### **Pricing Validity:**
- Prices are valid for 24 hours
- Recalculate for orders placed after expiry
- Use `valid_until` timestamp to check

### **Currency:**
- Currently hardcoded to NOK
- Future: Dynamic based on courier/region

### **Performance:**
- Single calculation: ~50-100ms
- Compare prices (3 couriers): ~150-300ms
- Cached in database for repeated queries

### **Sample Data:**
- PostNord pricing included
- Add more couriers via SQL inserts
- Use admin panel (future) for pricing management

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Deploy pricing tables to Supabase
- [ ] Deploy pricing function to Supabase
- [ ] Deploy API endpoints to Vercel
- [ ] Test with Postman/curl
- [ ] Add sample data for all couriers
- [ ] Update frontend to use new APIs
- [ ] Monitor API performance
- [ ] Set up error logging

---

**Status:** 📋 **READY FOR TESTING**  
**Next:** Deploy to production and test with real data
