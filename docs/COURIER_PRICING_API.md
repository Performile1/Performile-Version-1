# Courier Pricing API Reference

**Updated:** November 10, 2025  
**Scope:** `/api/couriers/get-base-price`, `/api/couriers/calculate-price`, `/api/couriers/compare-prices`

---

## Overview
These endpoints expose the courier pricing system for merchant and checkout flows. All handlers execute server-side RPC calls to the Supabase database functions defined in `2025-11-10_courier_pricing_functions.sql` and respect row-level security via the service role key.

- **Authentication:** Service role key only (Vercel serverless).  
- **Rate limiting:** `pricing` bucket (`60 req / minute / IP`).  
- **Timeout target:** < 300 ms per request under normal load.

---

## 1. `POST /api/couriers/get-base-price`
Returns the raw courier base price breakdown before merchant markup.

### Request
```json
{
  "courier_id": "uuid",
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
**Required:** `courier_id`, `service_type`, `actual_weight` (> 0). Dimensions and distance are optional; absent values skip volumetric and distance pricing.

### Response (200)
```json
{
  "courier": {
    "courier_id": "bb056015-f469-4a1a-9b16-251cdc8250a4",
    "courier_name": "PostNord",
    "logo_url": null
  },
  "service_type": "express",
  "pricing": {
    "base_price": 89,
    "weight_cost": 60,
    "distance_cost": 180,
    "zone_multiplier": 1,
    "subtotal": 329,
    "surcharges": [
      { "type": "fuel", "name": "Fuel Surcharge", "amount": 39.48, "method": "percentage" }
    ],
    "total_surcharges": 39.48,
    "total_base_price": 368.48,
    "currency": "SEK"
  },
  "weight_details": {
    "actual_weight": 5,
    "volumetric_weight": 5,
    "chargeable_weight": 5,
    "dimensions_provided": true
  },
  "shipment_details": {
    "distance": 100,
    "from_postal": "0150",
    "to_postal": "5003"
  },
  "calculation_breakdown": {
    "base_price": 89,
    "weight_cost": 60,
    "distance_cost": 180,
    "before_zone": 329,
    "zone_multiplier": 1,
    "after_zone": 329,
    "surcharges": 39.48,
    "total": 368.48,
    "currency": "SEK"
  }
}
```

### Errors
- `400` — Missing required fields or invalid service type.  
- `404` — Courier not found or no active pricing rows.  
- `429` — Rate limit exceeded (pricing bucket).  
- `500` — RPC failure (Supabase error message returned in `message`).

---

## 2. `POST /api/couriers/calculate-price`
Returns the customer-facing price after applying merchant markup.

### Request
Extends `get-base-price` payload with `merchant_id`.

```json
{
  "merchant_id": "52d41af0-1f46-403e-be14-4381bf7081e4",
  "courier_id": "bb056015-f469-4a1a-9b16-251cdc8250a4",
  "service_type": "express",
  "actual_weight": 5,
  "distance": 100,
  "from_postal": "0150",
  "to_postal": "5003"
}
```

### Response (200)
```json
{
  "courier": { "courier_id": "...", "courier_name": "PostNord", "logo_url": null },
  "service_type": "express",
  "base_pricing": {
    "base_price": 89,
    "weight_cost": 60,
    "distance_cost": 180,
    "subtotal": 329,
    "zone_multiplier": 1,
    "surcharges": [ { "type": "fuel", "amount": 39.48, "method": "percentage" } ],
    "total_surcharges": 39.48,
    "total_base_price": 368.48,
    "currency": "SEK"
  },
  "merchant_markup": {
    "margin_type": "percentage",
    "margin_value": 15,
    "margin_amount": 55.27,
    "has_markup": true
  },
  "final_pricing": {
    "before_markup": 368.48,
    "markup_amount": 55.27,
    "after_markup": 423.75,
    "rounded_price": 425,
    "currency": "SEK"
  },
  "weight_details": { "actual_weight": 5, "volumetric_weight": 5, "chargeable_weight": 5 },
  "shipment_details": { "distance": 100, "from_postal": "0150", "to_postal": "5003" },
  "calculation_breakdown": {
    "base_calculation": { ... },
    "merchant_markup": { ... }
  }
}
```

### Error considerations
- `calculate_final_price` RPC returns empty set when the merchant has no custom markup; handler falls back to base price.
- Standard error codes mirror `get-base-price` with the addition of `404` for missing merchant when pulling couriers.

---

## 3. `POST /api/couriers/compare-prices`
Compares multiple couriers—including merchant markup—and sorts results.

### Request
```json
{
  "merchant_id": "52d41af0-1f46-403e-be14-4381bf7081e4",
  "service_type": "express",
  "actual_weight": 5,
  "distance": 100,
  "courier_ids": ["bb056015-f469-4a1a-9b16-251cdc8250a4"],
  "sort_by": "price"
}
```
If `courier_ids` is omitted, all active couriers linked to the merchant are fetched from `merchant_couriers`.

### Response (200)
```json
{
  "shipment_details": {
    "service_type": "express",
    "actual_weight": 5,
    "distance": 100,
    "from_postal": "0150",
    "to_postal": "5003",
    "dimensions_provided": true
  },
  "comparison": {
    "total_couriers": 3,
    "sorted_by": "price",
    "cheapest": {
      "courier_id": "bb056015-f469-4a1a-9b16-251cdc8250a4",
      "courier_name": "PostNord",
      "rounded_price": 425,
      "recommended": true
    },
    "price_range": {
      "min": 425,
      "max": 650,
      "difference": 225,
      "currency": "SEK"
    }
  },
  "couriers": [
    {
      "courier_id": "bb056015-f469-4a1a-9b16-251cdc8250a4",
      "courier_name": "PostNord",
      "base_price": 368.48,
      "merchant_markup": 55.27,
      "final_price": 423.75,
      "rounded_price": 425,
      "currency": "SEK",
      "chargeable_weight": 5,
      "trust_score": 92,
      "ranking_score": 8.5,
      "surcharges": [ { "type": "fuel", "amount": 39.48, "method": "percentage" } ],
      "total_surcharges": 39.48,
      "calculation_breakdown": { ... }
    }
  ]
}
```

### Error considerations
- `404` if the merchant has no active couriers or every calculation fails.  
- `500` wraps RPC issues per courier; failed calculations are dropped from comparison.  
- Sorting supports `price` (default), `trust_score`, and `ranking` (descending).

---

## Rate Limiting Headers
All three endpoints surface rate limit values when the request succeeds or fails:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1731265237
```
If the limit is exceeded, the response is `429` with a `retryAfter` (seconds) field.

---

## Testing
See `docs/daily/2025-11-10/API_TESTING_GUIDE.md` for exhaustive Postman/curl examples that align with the current seed data (fuel surcharge = percentage).

---

## Change Log
- **2025-11-10:** Initial documentation, updated for percentage fuel surcharges and pricing rate limiting.
