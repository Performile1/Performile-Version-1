# REGISTRATION ISSUES - TROUBLESHOOTING

**Date:** November 5, 2025, 1:25 PM  
**Issues:** 
1. No pricing showing on registration
2. 400 Bad Request error on registration submit

---

## 🐛 ISSUE 1: NO PRICING SHOWING

### **Cause:**
The `subscription_plans` table in Supabase is **empty** or has no data.

### **Solution:**
Run the SQL script to insert subscription plans.

### **Steps:**

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste SQL Script**
   - Open: `database/INSERT_SUBSCRIPTION_PLANS.sql`
   - Copy entire contents
   - Paste into Supabase SQL Editor

4. **Run the Script**
   - Click "Run" button
   - Wait for success message
   - Should see: "Successfully inserted 6 subscription plans"

5. **Verify Data**
   ```sql
   SELECT plan_name, user_type, monthly_price, annual_price 
   FROM subscription_plans 
   ORDER BY user_type, tier;
   ```

### **Expected Result:**
```
plan_name    | user_type | monthly_price | annual_price
-------------|-----------|---------------|-------------
Starter      | merchant  | 0.00          | 0.00
Professional | merchant  | 29.00         | 290.00
Enterprise   | merchant  | 99.00         | 990.00
Basic        | courier   | 0.00          | 0.00
Professional | courier   | 19.00         | 190.00
Fleet        | courier   | 59.00         | 590.00
```

---

## 🐛 ISSUE 2: 400 BAD REQUEST ON REGISTRATION

### **Error:**
```
POST https://performile-platform-main.vercel.app/api/auth 400 (Bad Request)
```

### **Possible Causes:**

#### **Cause 1: Missing Required Fields**
The auth API requires:
- `action` (must be 'register')
- `email`
- `password`
- `user_role` (merchant/courier/consumer)

#### **Cause 2: Invalid Email Format**
Email must be valid format: `user@example.com`

#### **Cause 3: Password Too Short**
Password must be at least 8 characters

#### **Cause 4: User Already Exists**
Email already registered (returns 409, not 400)

### **Debug Steps:**

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Network tab
   - Find the `/api/auth` request
   - Click on it
   - Check "Payload" to see what was sent
   - Check "Response" to see error message

2. **Check Request Payload**
   Should look like:
   ```json
   {
     "action": "register",
     "email": "test@example.com",
     "password": "password123",
     "user_role": "merchant",
     "first_name": "John",
     "last_name": "Doe",
     "phone": "+1234567890"
   }
   ```

3. **Check Response**
   Will show specific error:
   ```json
   {
     "message": "Email and password are required"
   }
   ```
   or
   ```json
   {
     "message": "Password must be at least 8 characters"
   }
   ```

### **Common Fixes:**

#### **Fix 1: Ensure All Fields Are Filled**
Check that registration form has:
- ✅ Email field (filled)
- ✅ Password field (filled, 8+ chars)
- ✅ Role selected (merchant/courier)
- ✅ First name (optional but recommended)
- ✅ Last name (optional but recommended)

#### **Fix 2: Check Form Validation**
The form should validate before submitting:
```typescript
if (!email || !password) {
  toast.error('Email and password required');
  return;
}

if (password.length < 8) {
  toast.error('Password must be at least 8 characters');
  return;
}

if (!userRole) {
  toast.error('Please select account type');
  return;
}
```

#### **Fix 3: Check API Request**
Verify the request is formatted correctly:
```typescript
const response = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'register',  // ← Must be present
    email,
    password,
    user_role: userRole, // ← Must be present
    first_name,
    last_name,
    phone
  })
});
```

---

## 🔍 DEBUGGING CHECKLIST

### **For Pricing Issue:**
- [ ] Supabase project is accessible
- [ ] SQL script ran successfully
- [ ] 6 plans exist in database
- [ ] Plans have `is_active = true`
- [ ] Plans have `is_visible = true`
- [ ] API endpoint `/api/public/subscription-plans` works
- [ ] Browser console shows no errors
- [ ] Hard refresh page (Ctrl+Shift+R)

### **For Registration Issue:**
- [ ] Email field is filled
- [ ] Password is 8+ characters
- [ ] User role is selected
- [ ] Network tab shows request payload
- [ ] Response shows specific error message
- [ ] Database connection is working
- [ ] Environment variables are set

---

## 🧪 MANUAL TESTING

### **Test 1: Check API Directly**

**Test Subscription Plans API:**
```bash
curl https://performile-platform-main.vercel.app/api/public/subscription-plans
```

**Expected Response:**
```json
{
  "success": true,
  "plans": [
    {
      "plan_id": 1,
      "plan_name": "Starter",
      "user_type": "merchant",
      "monthly_price": 0,
      ...
    }
  ]
}
```

**Test Registration API:**
```bash
curl -X POST https://performile-platform-main.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register",
    "email": "test@example.com",
    "password": "password123",
    "user_role": "merchant",
    "first_name": "Test",
    "last_name": "User"
  }'
```

---

## 🚀 QUICK FIX STEPS

### **Step 1: Fix Pricing (5 minutes)**
1. Open Supabase SQL Editor
2. Run `INSERT_SUBSCRIPTION_PLANS.sql`
3. Verify 6 plans inserted
4. Refresh registration page
5. Should see pricing

### **Step 2: Fix Registration (10 minutes)**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to register
4. Check request payload
5. Check response error
6. Fix based on error message

---

## 📝 COMMON ERROR MESSAGES

| Error Message | Cause | Fix |
|---------------|-------|-----|
| "Action is required" | Missing `action` field | Add `action: 'register'` |
| "Email and password are required" | Missing email or password | Fill both fields |
| "Password must be at least 8 characters" | Password too short | Use 8+ character password |
| "User already exists" | Email already registered | Use different email or login |
| "Invalid credentials" | Wrong password on login | Check password |
| "Account is deactivated" | User account disabled | Contact admin |

---

## 🆘 IF STILL NOT WORKING

### **Check Environment Variables:**

In Vercel dashboard, verify these are set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (32+ characters)
- `JWT_REFRESH_SECRET` (32+ characters)
- `DATABASE_URL` (if using connection pooling)

### **Check Supabase:**
- Project is not paused
- Database is accessible
- RLS policies allow inserts
- Tables exist

### **Check Vercel:**
- Latest deployment succeeded
- No build errors
- Functions are deployed
- Logs show no errors

---

## ✅ SUCCESS CRITERIA

- [ ] Registration page shows 6 subscription plans
- [ ] Plans show correct pricing (FREE, $29, $99, etc.)
- [ ] Can select a plan
- [ ] Can fill registration form
- [ ] Can submit registration
- [ ] Registration succeeds (201 status)
- [ ] User is created in database
- [ ] Receives JWT tokens
- [ ] Redirected to dashboard

---

**Next Step:** Run the SQL script in Supabase to fix pricing issue first!
