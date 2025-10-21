# 🚀 Stripe Product Setup Guide

**Database-Driven Sync** - Your database is the source of truth!

This script reads your `subscription_plans` table and syncs to Stripe automatically.

---

## 📋 HOW IT WORKS

✅ **Reads from YOUR database** - No hardcoded plans  
✅ **Syncs automatically** - Creates/updates products  
✅ **Handles price changes** - Archives old, creates new  
✅ **Two-way sync** - Database ↔ Stripe

---

## 🚀 QUICK START (Recommended)

### **Prerequisites**

1. Stripe account created
2. API keys obtained
3. Node.js installed
4. Database connection string

### **Step 1: Install Dependencies**

```bash
npm install stripe pg
```

### **Step 2: Set Environment Variables**

```bash
# Test mode (for development)
export STRIPE_SECRET_KEY=sk_test_your_key_here
export DATABASE_URL=postgresql://user:pass@host:5432/database

# Or create a .env file:
echo "STRIPE_SECRET_KEY=sk_test_your_key_here" > .env
echo "DATABASE_URL=postgresql://user:pass@host:5432/database" >> .env
```

### **Step 3: Run the Sync Script**

```bash
node scripts/sync-stripe-products.js
```

**This will:**
- Read your subscription plans from database
- Create products in Stripe
- Create monthly & yearly prices
- Update database with Stripe IDs

### **What It Does**

The script will:
1. ✅ Query your `subscription_plans` table
2. ✅ Create products in Stripe for each plan
3. ✅ Create monthly & yearly prices
4. ✅ Update database with Stripe IDs
5. ✅ Display summary

**Your Plans:**
- Merchant: Starter ($29), Professional ($79), Enterprise ($199)
- Courier: Basic ($19), Pro ($49), Premium ($99), Enterprise ($199)

### **Expected Output**

```
🚀 Starting Stripe product creation...

📦 Creating product: Merchant Starter...
✅ Product created: prod_ABC123
✅ Monthly price created: price_1ABC123 ($29/month)
✅ Yearly price created: price_2ABC123 ($290/year)
💾 Updating database for merchant-starter...
✅ Database updated for: Merchant Starter

[... repeats for all 7 products ...]

================================================================================
🎉 ALL PRODUCTS CREATED SUCCESSFULLY!
================================================================================

📋 SUMMARY:

merchant-starter:
  Product ID: prod_ABC123
  Monthly Price ID: price_1ABC123
  Yearly Price ID: price_2ABC123

[... etc ...]

✅ Database has been updated with all Stripe IDs

🔗 View your products: https://dashboard.stripe.com/test/products
```

---

## 📋 OPTION 2: Manual Creation + SQL Update

If you prefer to create products manually in Stripe Dashboard:

### **Step 1: Create Products in Stripe**

Go to https://dashboard.stripe.com/test/products and create each product:

**Merchant Plans:**
1. Merchant Starter - $29/month or $290/year
2. Merchant Growth - $79/month or $790/year
3. Merchant Enterprise - $199/month or $1,990/year

**Courier Plans:**
4. Courier Individual - $19/month or $190/year
5. Courier Professional - $49/month or $490/year
6. Courier Fleet - $99/month or $990/year
7. Courier Enterprise - $249/month or $2,490/year

### **Step 2: Copy IDs**

For each product, copy:
- Product ID (prod_xxx)
- Monthly Price ID (price_xxx)
- Yearly Price ID (price_xxx)

### **Step 3: Update Database**

Edit `database/migrations/2025-10-21_add_stripe_price_ids.sql` and replace the XXXXXXXXXXXXXXXX placeholders with your actual IDs, then run it in Supabase.

---

## 🔍 Verify Setup

After running either option, verify in Supabase:

```sql
SELECT 
    plan_name,
    plan_slug,
    monthly_price,
    annual_price,
    stripe_product_id,
    stripe_price_id_monthly,
    stripe_price_id_yearly
FROM subscription_plans
ORDER BY user_type, tier;
```

All rows should have Stripe IDs populated.

---

## 🎯 Products Created

| Plan | Monthly | Yearly | Savings |
|------|---------|--------|---------|
| **Merchant Starter** | $29 | $290 | $58 (17%) |
| **Merchant Growth** | $79 | $790 | $158 (17%) |
| **Merchant Enterprise** | $199 | $1,990 | $398 (17%) |
| **Courier Individual** | $19 | $190 | $38 (17%) |
| **Courier Professional** | $49 | $490 | $98 (17%) |
| **Courier Fleet** | $99 | $990 | $198 (17%) |
| **Courier Enterprise** | $249 | $2,490 | $498 (17%) |

---

## 🔄 Update Products Later

If you need to update products (prices, descriptions, etc.):

### **Option A: Via Script**
Modify `scripts/create-stripe-products.js` and run again (it will create new products)

### **Option B: Via Stripe Dashboard**
1. Go to https://dashboard.stripe.com/test/products
2. Edit the product
3. Create new price (don't delete old ones - existing subscriptions use them)
4. Update database with new price ID

---

## 🚨 Important Notes

### **Test vs Live Mode**

- **Test mode:** Use `sk_test_xxx` keys for development
- **Live mode:** Use `sk_live_xxx` keys for production

**Always test in test mode first!**

### **Price Changes**

- You cannot modify existing prices in Stripe
- Create new prices and update your database
- Old subscriptions continue using old prices
- New subscriptions use new prices

### **Product Metadata**

The script stores useful metadata:
- `slug` - Your internal plan identifier
- `features` - List of plan features (JSON)
- `billing_period` - monthly or yearly

---

## 🐛 Troubleshooting

### **Error: "No such product"**
- Check your Stripe API key is correct
- Verify you're in the right mode (test/live)

### **Error: "Database connection failed"**
- Check DATABASE_URL is correct
- Verify database is accessible
- Check firewall/network settings

### **Error: "Plan not found in database"**
- Run subscription plans migration first
- Check plan_slug matches exactly

### **Products created but database not updated**
- Run the SQL update script manually
- Check database permissions

---

## 📞 Support

**Stripe Documentation:**
- Products: https://stripe.com/docs/api/products
- Prices: https://stripe.com/docs/api/prices
- Subscriptions: https://stripe.com/docs/billing/subscriptions

**Stripe Dashboard:**
- Test: https://dashboard.stripe.com/test
- Live: https://dashboard.stripe.com

---

## ✅ Checklist

Before running the script:
- [ ] Stripe account created
- [ ] API keys obtained (test mode)
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install stripe pg`)
- [ ] Environment variables set
- [ ] Database accessible
- [ ] Subscription plans exist in database

After running the script:
- [ ] All 7 products created in Stripe
- [ ] All 14 prices created (7 monthly + 7 yearly)
- [ ] Database updated with Stripe IDs
- [ ] Verified in Stripe Dashboard
- [ ] Verified in database

---

**Ready to create products? Run the script!** 🚀

```bash
node scripts/create-stripe-products.js
```
