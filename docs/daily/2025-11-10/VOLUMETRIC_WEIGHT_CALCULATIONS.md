# 📦 VOLUMETRIC WEIGHT CALCULATIONS

**Date:** November 10, 2025  
**Purpose:** Document courier-specific volumetric weight formulas

---

## 🎯 WHAT IS VOLUMETRIC WEIGHT?

Volumetric weight (also called dimensional weight) is a pricing technique used by couriers to account for package size, not just weight. Large but light packages take up space in delivery vehicles, so couriers charge based on whichever is greater: actual weight or volumetric weight.

---

## 📊 COURIER-SPECIFIC FORMULAS

### **ALL NORDIC COURIERS (Road/Rail Transport)** ⭐

**PostNord, Bring, DHL all use the same formula for road/rail transport:**

**Formula:**
```
Volumetric Weight = Volume (m³) × 280 kg
```

**Steps:**
1. Convert dimensions to meters
2. Calculate volume: L × W × H (in meters)
3. Multiply volume by 280 kg

**Example:**
```
Package: 50cm × 50cm × 50cm
Convert to meters: 0.5m × 0.5m × 0.5m
Volume: 0.5 × 0.5 × 0.5 = 0.125 m³
Volumetric weight: 0.125 × 280 = 35 kg

If actual weight = 10 kg
Chargeable weight = 35 kg (higher of the two)
```

**In our system:**
- We use cm as input
- Divisor = 3571 (calculated as 1,000,000 / 280)
- Formula: (L × W × H in cm) / 3571 = volumetric weight in kg

**Verification:**
```
50cm × 50cm × 50cm = 125,000 cm³
125,000 / 3571 = 35 kg ✅
```

---

### **Why All Use Same Formula?**

**Road/Rail Transport Standard:**
- All Nordic couriers use trucks and trains
- Volume (m³) × 280 kg is the industry standard for ground transport
- Different from air freight which uses divisor 5000 or 6000
- Reflects actual space constraints in trucks/trains

---

## 🔧 IMPLEMENTATION IN DATABASE

### **Table: courier_volumetric_rules**

```sql
courier_id | service_type | volumetric_divisor | measurement_unit | applies_when
-----------|--------------|-------------------|------------------|------------------
PostNord   | express      | 3571              | cm               | if_greater_than_actual
PostNord   | standard     | 3571              | cm               | if_greater_than_actual
PostNord   | economy      | 3571              | cm               | if_greater_than_actual
Bring      | express      | 3571              | cm               | if_greater_than_actual
Bring      | standard     | 3571              | cm               | if_greater_than_actual
DHL        | express      | 3571              | cm               | if_greater_than_actual
```

**All use divisor 3571 for road/rail transport!**

---

## 📐 CALCULATION FUNCTION

### **calculate_volumetric_weight()**

```sql
SELECT * FROM calculate_volumetric_weight(
    courier_id,
    service_type,
    length_cm,
    width_cm,
    height_cm,
    actual_weight_kg
);
```

**Returns:**
- `actual_weight` - Package's actual weight
- `volumetric_weight` - Calculated volumetric weight
- `chargeable_weight` - Higher of the two (what courier charges)
- `calculation_method` - How it was determined

---

## 🧮 EXAMPLES

### **Example 1: PostNord Light Package**
```
Dimensions: 60cm × 40cm × 30cm
Actual weight: 5 kg

Volume: 60 × 40 × 30 = 72,000 cm³
Volumetric weight: 72,000 / 3571 = 20.16 kg
Chargeable weight: 20.16 kg (volumetric is higher)

Price based on: 20.16 kg ✅
```

### **Example 2: PostNord Heavy Package**
```
Dimensions: 30cm × 20cm × 20cm
Actual weight: 15 kg

Volume: 30 × 20 × 20 = 12,000 cm³
Volumetric weight: 12,000 / 3571 = 3.36 kg
Chargeable weight: 15 kg (actual is higher)

Price based on: 15 kg ✅
```

### **Example 3: Bring Package**
```
Dimensions: 50cm × 50cm × 50cm
Actual weight: 8 kg

Volume: 50 × 50 × 50 = 125,000 cm³
Volumetric weight: 125,000 / 3571 = 35 kg
Chargeable weight: 35 kg (volumetric is higher)

Price based on: 35 kg ✅
```

---

## 🎯 WHY THIS FORMULA?

### **Road/Rail Transport: Volume × 280 kg**
- Industry standard for ground transport in Europe
- Reflects actual space constraints in trucks and trains
- All Nordic couriers use this for domestic/regional shipments
- Based on typical cargo density in road transport

### **Air Freight: Different Formula**
- Air freight uses divisor 5000 or 6000
- Based on 200 kg/m³ or 167 kg/m³ density
- Not applicable to our Nordic ground couriers
- Would only apply to international air shipments

---

## 📊 COMPARISON TABLE

| Package Size | Actual Weight | Volumetric Weight (All) | Chargeable Weight | Notes |
|--------------|---------------|------------------------|-------------------|-------|
| 50×50×50 cm  | 10 kg         | 35 kg                  | 35 kg             | Volumetric higher |
| 40×30×20 cm  | 5 kg          | 6.72 kg                | 6.72 kg           | Volumetric higher |
| 30×20×10 cm  | 3 kg          | 1.68 kg                | 3 kg              | Actual higher |
| 100×50×50 cm | 15 kg         | 70 kg                  | 70 kg             | Volumetric much higher |
| 20×20×20 cm  | 8 kg          | 2.24 kg                | 8 kg              | Actual higher |

**Key Insight:** All Nordic couriers use the same formula for road/rail transport!

---

## ✅ IMPLEMENTATION CHECKLIST

- ✅ All Nordic couriers use divisor 3571 (Volume × 280 formula)
- ✅ Road/rail transport standard applied consistently
- ✅ Function calculates both weights
- ✅ Function returns higher of the two
- ✅ All measurements in cm for consistency
- ✅ Documentation explains formulas

---

## 🔗 REFERENCES

**Nordic Road/Rail Transport Standard:**
- Formula: Volume (m³) × 280 kg
- Divisor: 3571 when using cm
- Used by: PostNord, Bring, DHL, and other ground couriers
- Chargeable weight: Greater of actual or volumetric

**Air Freight (Different):**
- Formula: (L × W × H in cm) / 5000 or 6000
- Based on 200 kg/m³ or 167 kg/m³ density
- Used by: International air couriers
- Not applicable to Nordic ground transport

---

## 🎯 NEXT STEPS

When adding new couriers:
1. **Check transport type:** Road/Rail or Air?
2. **Road/Rail:** Use divisor 3571 (Volume × 280)
3. **Air Freight:** Use divisor 5000 or 6000
4. Add to `courier_volumetric_rules` table
5. Test with example packages
6. Document in this file

**Common divisors by transport type:**
- **3571** = Road/Rail transport (Volume × 280) ⭐ Nordic standard
- **5000** = Air freight standard (200 kg/m³)
- **6000** = Air freight economy (167 kg/m³)
- **4000** = Express air freight (250 kg/m³)
