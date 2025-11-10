# Courier Pricing Calculation Logic

**Updated:** November 10, 2025  
**Source:** `database/migrations/2025-11-10_courier_pricing_functions.sql`

---

## Function Overview
| Function | Purpose | Key Tables | Output |
| --- | --- | --- | --- |
| `calculate_volumetric_weight` | Computes volumetric/chargeable weight based on courier-specific divisor rules. | `courier_volumetric_rules` | `actual_weight`, `volumetric_weight`, `chargeable_weight`, `calculation_method` |
| `calculate_surcharges` | Aggregates applicable surcharges by weight, distance, zone, and service filters. | `courier_surcharge_rules` | One row per surcharge (type, name, amount, calculation method) |
| `calculate_courier_base_price` | Orchestrates base price, tier costs, zone multiplier, and surcharges for a single courier. | `courier_base_prices`, `courier_weight_pricing`, `courier_distance_pricing`, `postal_code_zones`, `courier_surcharge_rules` | Full pricing breakdown JSON + totals |
| `compare_courier_prices` | Wrapper returning base totals for multiple couriers (used prior to markup). | All of the above | Table of totals per courier |

## Calculation Flow (`calculate_courier_base_price`)
1. **Volumetric vs. Actual Weight**  
   - Calls `calculate_volumetric_weight`.  
   - Courier rule controls whether chargeable weight is volumetric or actual.

2. **Base Price Lookup**  
   - Latest active row from `courier_base_prices` filtered by `service_type` and effective dates.

3. **Weight Tier Pricing**  
   - Pulls the tier where `min_weight <= chargeable_weight < max_weight`.  
   - Supports `fixed_price` or `price_per_kg`.

4. **Distance Tier Pricing**  
   - Same pattern using `courier_distance_pricing` when `distance > 0`.

5. **Zone Multiplier**  
   - `postal_code_zones` entry with longest matching `postal_code_pattern` determines multiplier (default `1.0`).

6. **Surcharge Aggregation**  
   - Invokes `calculate_surcharges`, then aggregates into JSON array + total (handles fixed, percentage, per-kg, per-km).

7. **Totals**  
   - `subtotal = (base + weight_cost + distance_cost) × zone_multiplier`.  
   - `total_base_price = subtotal + total_surcharges`.

8. **Breakdown JSON**  
   - `calculation_breakdown` contains before/after zone amounts, surcharge total, and currency.

## Percentage Fuel Surcharges
- Sample data now seeds `amount_type = 'percentage'` for PostNord (12%) and Bring (10%).  
- Result: surcharge scales with subtotal instead of fixed addition, e.g. 329 SEK subtotal × 12% = 39.48 SEK.

## Edge Cases & Fallbacks
- **Missing base price:** returns zeros but preserves chargeable weight fields for error handling upstream.  
- **No volumetric rule:** defaults to actual weight.  
- **No matching tiers:** weight/distance costs fall back to 0.  
- **Null postal codes:** zone multiplier stays 1.0.

## Performance Notes
- All primary lookups leverage indexes defined in `2025-11-10_courier_pricing_system.sql`.  
- Functions are `STABLE`, allowing PostgreSQL to cache results per transaction.  
- Expect sub-50 ms execution under production data volume.

## API Integration
| API | Uses | Notes |
| --- | --- | --- |
| `POST /api/couriers/get-base-price` | Calls `calculate_courier_base_price` directly. | Returns raw totals for UI calculators. |
| `POST /api/couriers/calculate-price` | Calls `calculate_courier_base_price` → `calculate_final_price` (markup). | Rate limited via `pricing` bucket. |
| `POST /api/couriers/compare-prices` | Calls `calculate_courier_base_price` per courier → optional markup. | Filters couriers with missing data and sorts results. |

See `docs/COURIER_PRICING_API.md` and `docs/daily/2025-11-10/API_TESTING_GUIDE.md` for request/response samples and QA scenarios.
