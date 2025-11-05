# SUBSCRIPTION PLANS - PRICING & FEATURES

**Date:** November 5, 2025  
**Status:** Ready to Deploy  
**Currency:** NOK (Norwegian Krone)

---

## 💼 MERCHANT PLANS

### **1. Starter (Free)**

**Price:** 0 NOK/month

**Features:**
- ✅ 100 orders per month
- ✅ 500 emails per month
- ✅ Up to 3 couriers
- ✅ 1 shop/location
- ✅ Unlimited push notifications
- ✅ Basic analytics
- ✅ Email support
- ✅ 14-day trial

**Best For:** Small businesses getting started with delivery management

---

### **2. Professional (Most Popular)** ⭐

**Price:** 299 NOK/month or 2,990 NOK/year (save 598 NOK)

**Features:**
- ✅ 1,000 orders per month
- ✅ 5,000 emails per month
- ✅ 500 SMS per month
- ✅ Up to 10 couriers
- ✅ Up to 5 shops/locations
- ✅ Unlimited push notifications
- ✅ Custom email templates
- ✅ Advanced analytics
- ✅ Priority support
- ✅ 14-day trial

**Best For:** Growing businesses with multiple locations

---

### **3. Enterprise**

**Price:** 999 NOK/month or 9,990 NOK/year (save 1,998 NOK)

**Features:**
- ✅ **Unlimited orders**
- ✅ **Unlimited emails**
- ✅ 2,000 SMS per month
- ✅ **Unlimited couriers**
- ✅ **Unlimited shops**
- ✅ Unlimited push notifications
- ✅ White-label options
- ✅ Dedicated account manager
- ✅ API access
- ✅ Custom integrations
- ✅ 14-day trial

**Best For:** Large enterprises with unlimited needs

---

## 🚚 COURIER PLANS

### **1. Basic (Free)**

**Price:** 0 NOK/month

**Features:**
- ✅ 50 orders per month
- ✅ 200 emails per month
- ✅ Unlimited push notifications
- ✅ Basic analytics
- ✅ Email support
- ✅ 14-day trial

**Best For:** Independent couriers starting out

---

### **2. Professional (Most Popular)** ⭐

**Price:** 199 NOK/month or 1,990 NOK/year (save 398 NOK)

**Features:**
- ✅ 500 orders per month
- ✅ 2,000 emails per month
- ✅ 300 SMS per month
- ✅ Unlimited push notifications
- ✅ Custom email templates
- ✅ Advanced analytics
- ✅ Priority support
- ✅ 14-day trial

**Best For:** Established courier services with growing demand

---

### **3. Fleet**

**Price:** 599 NOK/month or 5,990 NOK/year (save 1,198 NOK)

**Features:**
- ✅ **Unlimited orders**
- ✅ **Unlimited emails**
- ✅ 1,000 SMS per month
- ✅ Unlimited push notifications
- ✅ White-label options
- ✅ Dedicated account manager
- ✅ API access
- ✅ Custom integrations
- ✅ 14-day trial

**Best For:** Courier fleets and logistics companies

---

## 💰 PRICING COMPARISON

### **Merchant Plans:**

| Feature | Starter (Free) | Professional (299 NOK) | Enterprise (999 NOK) |
|---------|----------------|------------------------|----------------------|
| Orders/month | 100 | 1,000 | Unlimited |
| Emails/month | 500 | 5,000 | Unlimited |
| SMS/month | 0 | 500 | 2,000 |
| Couriers | 3 | 10 | Unlimited |
| Shops | 1 | 5 | Unlimited |
| Custom Templates | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Dedicated Manager | ❌ | ❌ | ✅ |

### **Courier Plans:**

| Feature | Basic (Free) | Professional (199 NOK) | Fleet (599 NOK) |
|---------|--------------|------------------------|-----------------|
| Orders/month | 50 | 500 | Unlimited |
| Emails/month | 200 | 2,000 | Unlimited |
| SMS/month | 0 | 300 | 1,000 |
| Custom Templates | ❌ | ✅ | ✅ |
| Advanced Analytics | ❌ | ✅ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Dedicated Manager | ❌ | ❌ | ✅ |

---

## 💡 KEY BENEFITS

### **All Plans Include:**
- ✅ 14-day free trial
- ✅ No credit card required for trial
- ✅ Cancel anytime
- ✅ Unlimited push notifications
- ✅ Email support
- ✅ Regular updates

### **Annual Savings:**
- Professional Merchant: Save 598 NOK/year (~17%)
- Enterprise Merchant: Save 1,998 NOK/year (~17%)
- Professional Courier: Save 398 NOK/year (~17%)
- Fleet Courier: Save 1,198 NOK/year (~17%)

---

## 🎯 RECOMMENDED PLANS

### **For Merchants:**
- **Just Starting:** Starter (Free)
- **Growing Business:** Professional ⭐ (Most Popular)
- **Large Enterprise:** Enterprise

### **For Couriers:**
- **Independent Driver:** Basic (Free)
- **Small Fleet:** Professional ⭐ (Most Popular)
- **Large Fleet:** Fleet

---

## 📊 REVENUE PROJECTIONS

### **Target Distribution (Year 1):**

**Merchants:**
- 60% Starter (Free) = 300 users
- 30% Professional = 150 users × 299 NOK = 44,850 NOK/month
- 10% Enterprise = 50 users × 999 NOK = 49,950 NOK/month
- **Total Merchant MRR:** 94,800 NOK/month

**Couriers:**
- 70% Basic (Free) = 140 users
- 25% Professional = 50 users × 199 NOK = 9,950 NOK/month
- 5% Fleet = 10 users × 599 NOK = 5,990 NOK/month
- **Total Courier MRR:** 15,940 NOK/month

**Combined MRR:** 110,740 NOK/month (~$10,500 USD)  
**Annual Revenue:** 1,328,880 NOK/year (~$126,000 USD)

---

## 🚀 DEPLOYMENT INSTRUCTIONS

### **1. Run SQL Script:**
```sql
-- In Supabase SQL Editor
-- File: database/INSERT_SUBSCRIPTION_PLANS.sql
```

### **2. Verify Data:**
```sql
SELECT plan_name, user_type, monthly_price, annual_price 
FROM subscription_plans 
ORDER BY user_type, tier;
```

### **3. Test Registration:**
1. Go to registration page
2. Select "Merchant" or "Courier"
3. Verify plans show with prices
4. Select a plan
5. Complete registration

---

## ✅ EXPECTED RESULT

After running the SQL script, users will see:

**Merchant Plans:**
- Starter: **0 NOK/month**
- Professional: **299 NOK/month** or 2,990 NOK/year ⭐
- Enterprise: **999 NOK/month** or 9,990 NOK/year

**Courier Plans:**
- Basic: **0 NOK/month**
- Professional: **199 NOK/month** or 1,990 NOK/year ⭐
- Fleet: **599 NOK/month** or 5,990 NOK/year

---

## 📝 NOTES

- Prices in NOK (Norwegian Krone)
- 1 USD ≈ 10.5 NOK (approximate)
- Annual plans save ~17% (2 months free)
- All plans include 14-day free trial
- Professional tier marked as "Most Popular"
- Free tiers have usage limits to encourage upgrades

---

**Status:** ✅ Ready to deploy  
**Next Step:** Run INSERT_SUBSCRIPTION_PLANS.sql in Supabase
