# 🔍 DATABASE AUDIT - BEFORE COURIER PRICING WORK

**Date:** November 10, 2025, 8:05 AM  
**Purpose:** Validate what pricing/courier tables exist BEFORE starting today's work  
**Rule:** RULE #1 - Database validation before every sprint

---

## ❓ USER'S CRITICAL QUESTIONS:

1. **"We have subscription plans already"** - TRUE ✅
2. **"Which calculation function are you talking about?"** - Found: `calculate_final_price()` ✅
3. **"We have a lot of API endpoints"** - Need to check what exists ✅
4. **"Should we do a database audit?"** - YES! Doing it now ✅

---

## ✅ WHAT ALREADY EXISTS

### **PRICING TABLES (Found 2):**

#### **1. merchant_pricing_settings** ✅
**Location:** `database/CREATE_PRICING_SETTINGS_TABLES.sql`  
**Created:** November 5, 2025  
**Purpose:** Merchant's global pricing margins

**Columns:**
- `setting_id` UUID
- `merchant_id` UUID (FK to users)
- `default_margin_type` VARCHAR (percentage/fixed)
- `default_margin_value` DECIMAL
- `round_prices` BOOLEAN
- `round_to` DECIMAL
- `min_delivery_price` DECIMAL
- `max_delivery_price` DECIMAL
- `show_original_price` BOOLEAN
- `show_savings` BOOLEAN
- `currency` VARCHAR(3)

**What it does:** Stores merchant's markup settings (e.g., add 15% to courier prices)

---

#### **2. courier_service_margins** ✅
**Location:** `database/CREATE_PRICING_SETTINGS_TABLES.sql`  
**Created:** November 5, 2025  
**Purpose:** Per-courier, per-service pricing margins

**Columns:**
- `margin_id` UUID
- `merchant_id` UUID
- `courier_id` UUID
- `service_type` VARCHAR (express/standard/economy/etc.)
- `margin_type` VARCHAR (percentage/fixed)
- `margin_value` DECIMAL
- `fixed_price` DECIMAL (override)
- `is_active` BOOLEAN

**What it does:** Allows merchant to set different margins per courier/service

---

### **PRICING FUNCTION (Found 1):**

#### **calculate_final_price()** ✅
**Location:** `database/CREATE_PRICING_SETTINGS_TABLES.sql`  
**Created:** November 5, 2025  
**Purpose:** Calculate final price with merchant's margins

**Input:**
- `p_merchant_id` UUID
- `p_courier_id` UUID
- `p_service_type` VARCHAR
- `p_base_price` DECIMAL

**Output:**
- `base_price` - Original courier price
- `margin_type` - percentage or fixed
- `margin_value` - The margin amount
- `margin_amount` - Calculated margin
- `final_price` - Base + margin
- `rounded_price` - Final rounded price

**What it does:** Takes courier's base price, applies merchant's markup, rounds it

---

### **SUBSCRIPTION TABLES (Already Exist):**

#### **subscription_plans** ✅
**Purpose:** Platform subscription tiers (Free, Starter, Professional, Enterprise)

#### **user_subscriptions** ✅
**Purpose:** User's active subscription

---

## ❌ WHAT'S MISSING (What we need to build today)

### **COURIER BASE PRICING TABLES (0 exist):**

We have merchant MARGINS but NOT courier BASE PRICES!

**Missing:**
1. **Courier base prices** - What PostNord/Bring/DHL actually charge
2. **Weight tiers** - Price per kg ranges
3. **Distance tiers** - Price per km ranges
4. **Zone pricing** - Postal code zones with multipliers
5. **Surcharges** - Fuel, insurance, remote area fees

**This is what we need to build today!**

---

## 🎯 WHAT WE ACTUALLY NEED TO BUILD

### **The Problem:**
- ✅ We have merchant MARKUP system (add 15% to courier price)
- ❌ We DON'T have courier BASE PRICES (what couriers charge)

### **The Solution (Today's Work):**

Build courier base pricing system so we can:
1. Get courier's base price (e.g., PostNord charges 89 NOK)
2. Apply merchant's margin (add 15% = 102.35 NOK)
3. Round it (round to 5 NOK = 105 NOK)
4. Show to customer (105 NOK)

---

## 📋 REVISED TODAY'S TASKS

### **Task 1: Courier Base Pricing Tables**

**Need to create:**

1. **courier_base_prices** - Base prices per courier/service
   - courier_id, service_type, base_price, currency
   
2. **courier_weight_pricing** - Price per weight range
   - courier_id, min_weight, max_weight, price_per_kg
   
3. **courier_distance_pricing** - Price per distance range
   - courier_id, min_distance, max_distance, price_per_km
   
4. **postal_code_zones** - Zone multipliers
   - zone_name, postal_code_pattern, multiplier
   
5. **courier_surcharges** - Extra fees
   - courier_id, surcharge_type, amount, applies_to

---

### **Task 2: Courier Price Calculation Function**

**Need to create:**

```sql
CREATE FUNCTION calculate_courier_base_price(
    p_courier_id UUID,
    p_service_type VARCHAR,
    p_weight DECIMAL,
    p_distance DECIMAL,
    p_from_postal VARCHAR,
    p_to_postal VARCHAR
)
RETURNS TABLE (
    base_price DECIMAL,
    weight_cost DECIMAL,
    distance_cost DECIMAL,
    zone_multiplier DECIMAL,
    surcharges DECIMAL,
    total_base_price DECIMAL
)
```

**This is DIFFERENT from `calculate_final_price()`:**
- `calculate_courier_base_price()` - Gets courier's actual price
- `calculate_final_price()` - Adds merchant's markup to that price

---

### **Task 3: API Endpoints**

**Need to create:**

1. **`/api/couriers/get-base-price`** - Get courier's base price
   - Input: courier, service, weight, distance, postal codes
   - Output: Courier's base price breakdown
   
2. **`/api/couriers/calculate-price`** - Get final price with merchant markup
   - Input: Same + merchant_id
   - Output: Base price + merchant markup = final price
   
3. **`/api/couriers/compare-prices`** - Compare all couriers
   - Input: shipment details + merchant_id
   - Output: Array of all couriers with final prices

---

## 🔍 API ENDPOINT AUDIT

Let me check what courier pricing APIs already exist...

**Need to search:**
- `api/couriers/` folder
- Look for pricing-related endpoints

---

## ✅ CONCLUSION

### **What Exists:**
- ✅ Merchant margin system (markup on top of courier prices)
- ✅ Margin calculation function
- ✅ Subscription plans

### **What's Missing (Today's Work):**
- ❌ Courier base pricing tables (what couriers actually charge)
- ❌ Courier base price calculation function
- ❌ API endpoints to get courier prices

### **The Flow:**
```
1. Courier Base Price (NEW - build today)
   ↓
2. Merchant Margin (EXISTS - built Nov 5)
   ↓
3. Final Price to Customer
```

---

## 🎯 REVISED PLAN FOR TODAY

**9:00-11:00 AM:** Create 5 courier base pricing tables  
**11:00 AM-12:00 PM:** Create `calculate_courier_base_price()` function  
**12:00-1:00 PM:** Lunch  
**1:00-3:30 PM:** Create 3 API endpoints  
**3:30-5:00 PM:** Testing & documentation

**This makes sense now!**

---

## 📝 NEXT STEP

Before we start coding, let's check:
1. What courier pricing APIs already exist?
2. Do we have any sample courier data?
3. What courier tables exist?

**Should I continue with the API endpoint audit?**
