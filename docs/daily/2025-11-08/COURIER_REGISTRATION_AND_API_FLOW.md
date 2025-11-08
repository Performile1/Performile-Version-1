# 🚚 COURIER REGISTRATION & API CREDENTIAL FLOW

**Date:** November 8, 2025, 11:12 PM
**Priority:** HIGH - Security & UX Critical
**Status:** DESIGN DECISION NEEDED

---

## 🤔 **The Question**

> "Should we create a PostNord user and test login as if some other courier did register? If someone did create a user that way, how could we set a flow for them to add their API?"

---

## 🎯 **Current Architecture Analysis**

### **What Exists Now:**

1. ✅ **Registration Form** (`RegisterForm.tsx`)
   - Supports 3 roles: Consumer, Merchant, **Courier**
   - Users can register as "Courier" role
   - Creates user account in `users` table

2. ✅ **Couriers Table**
   - Stores courier company information
   - Has `user_id` column linking to users table
   - Stores company details (name, logo, contact, etc.)

3. ✅ **Courier API Credentials Table**
   - Stores API keys per courier
   - Links to `courier_id`
   - Has RLS policies for security

### **What's Missing:**

❌ **Onboarding flow for courier users after registration**
❌ **Courier dashboard to add their API credentials**
❌ **Courier company profile setup**
❌ **Link between user account → courier company**

---

## 🚨 **CRITICAL SECURITY ISSUE**

### **Current Problem:**

```
User registers as "Courier" role
    ↓
User account created in users table
    ↓
❌ NO courier_id exists yet!
    ↓
❌ User can't add API credentials (no courier_id)
    ↓
❌ User stuck - can't do anything!
```

### **Why This Is Bad:**

1. **Broken User Experience** - Courier registers but can't use the platform
2. **Security Gap** - No validation that user is legitimate courier
3. **Data Inconsistency** - User with courier role but no courier record
4. **API Credential Orphans** - Can't link credentials without courier_id

---

## ✅ **SOLUTION: TWO APPROACHES**

---

## 🎯 **APPROACH A: AUTO-CREATE COURIER RECORD (RECOMMENDED)**

### **Flow:**

```
1. User registers with role="courier"
   ↓
2. Create user account in users table
   ↓
3. AUTOMATICALLY create courier record in couriers table
   ↓
4. Link courier.user_id = user.user_id
   ↓
5. Redirect to Courier Onboarding
   ↓
6. User completes company profile
   ↓
7. User adds API credentials
   ↓
8. ✅ Courier is ready!
```

### **Implementation:**

**1. Modify Registration API** (`api/auth/register.ts`):

```typescript
// After creating user account
if (user_role === 'courier') {
  // Auto-create courier record
  const { data: courier } = await supabase
    .from('couriers')
    .insert({
      user_id: newUser.id,
      courier_name: `${first_name} ${last_name} Courier`, // Temporary name
      contact_email: email,
      contact_phone: phone,
      is_active: false, // Not active until profile complete
      onboarding_completed: false
    })
    .select()
    .single();
    
  // Return courier_id with user data
  return {
    user: newUser,
    courier_id: courier.courier_id,
    needs_onboarding: true
  };
}
```

**2. Create Courier Onboarding Page** (`CourierOnboarding.tsx`):

```tsx
// apps/web/src/pages/courier/CourierOnboarding.tsx

export const CourierOnboarding = () => {
  const [step, setStep] = useState(1);
  
  return (
    <Box>
      <Typography variant="h4">Welcome to Performile!</Typography>
      <Typography>Let's set up your courier company profile</Typography>
      
      <Stepper activeStep={step}>
        <Step>Company Information</Step>
        <Step>Service Details</Step>
        <Step>API Credentials</Step>
        <Step>Review & Activate</Step>
      </Stepper>
      
      {step === 1 && <CompanyInfoForm />}
      {step === 2 && <ServiceDetailsForm />}
      {step === 3 && <APICredentialsForm />}
      {step === 4 && <ReviewAndActivate />}
    </Box>
  );
};
```

**3. Company Information Form:**

```tsx
<TextField
  label="Company Name"
  name="courier_name"
  required
  helperText="Your official courier company name"
/>
<TextField
  label="Company Logo URL"
  name="logo_url"
/>
<TextField
  label="Website"
  name="website_url"
/>
<TextField
  label="Description"
  name="description"
  multiline
  rows={4}
/>
```

**4. API Credentials Form:**

```tsx
<Typography variant="h6">Add Your API Credentials</Typography>
<Typography variant="body2" color="text.secondary">
  These credentials allow Performile to integrate with your tracking system.
  Your credentials are encrypted and secure.
</Typography>

<TextField
  label="Customer Number"
  name="customer_number"
  required
/>
<TextField
  label="API Key"
  name="api_key"
  type="password"
  required
/>
<Button onClick={testConnection}>Test Connection</Button>
```

**5. Redirect After Registration:**

```typescript
// In RegisterForm.tsx after successful registration
if (role === 'courier' && data.needs_onboarding) {
  navigate('/courier/onboarding');
} else if (role === 'courier') {
  navigate('/courier/dashboard');
} else if (role === 'merchant') {
  navigate('/merchant/dashboard');
} else {
  navigate('/consumer/dashboard');
}
```

### **Benefits:**

✅ **Seamless UX** - User guided through setup
✅ **No orphaned accounts** - Always have courier_id
✅ **Secure** - Credentials added during onboarding
✅ **Complete profile** - All info collected upfront
✅ **Validation** - Can verify company legitimacy

### **Drawbacks:**

⚠️ **Requires new onboarding flow** (2-3 hours dev time)
⚠️ **More complex registration** (but better UX)

---

## 🎯 **APPROACH B: MANUAL COURIER SETUP (SIMPLER)**

### **Flow:**

```
1. User registers with role="courier"
   ↓
2. Create user account in users table
   ↓
3. Redirect to Courier Dashboard
   ↓
4. Show "Complete Your Profile" banner
   ↓
5. User clicks "Set Up Company Profile"
   ↓
6. User fills company info + API credentials
   ↓
7. Create courier record + credentials
   ↓
8. ✅ Courier is ready!
```

### **Implementation:**

**1. Courier Dashboard with Setup Banner:**

```tsx
// apps/web/src/pages/courier/CourierDashboard.tsx

export const CourierDashboard = () => {
  const { user } = useAuthStore();
  const [courier, setCourier] = useState(null);
  
  useEffect(() => {
    // Check if courier record exists
    const checkCourier = async () => {
      const { data } = await supabase
        .from('couriers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setCourier(data);
    };
    checkCourier();
  }, []);
  
  if (!courier) {
    return (
      <Box>
        <Alert severity="warning">
          <AlertTitle>Complete Your Profile</AlertTitle>
          You need to set up your courier company profile before you can use the platform.
          <Button onClick={() => navigate('/courier/setup')}>
            Set Up Now
          </Button>
        </Alert>
      </Box>
    );
  }
  
  return <CourierDashboardContent courier={courier} />;
};
```

**2. Courier Setup Page:**

```tsx
// apps/web/src/pages/courier/CourierSetup.tsx

export const CourierSetup = () => {
  const { user } = useAuthStore();
  
  const handleSubmit = async (data) => {
    // 1. Create courier record
    const { data: courier } = await supabase
      .from('couriers')
      .insert({
        user_id: user.id,
        courier_name: data.company_name,
        contact_email: data.email,
        contact_phone: data.phone,
        logo_url: data.logo_url,
        description: data.description,
        is_active: true
      })
      .select()
      .single();
    
    // 2. Add API credentials
    await supabase
      .from('courier_api_credentials')
      .insert({
        courier_id: courier.courier_id,
        customer_number: data.customer_number,
        api_key: data.api_key,
        // ... other fields
      });
    
    // 3. Redirect to dashboard
    navigate('/courier/dashboard');
  };
  
  return <CourierSetupForm onSubmit={handleSubmit} />;
};
```

### **Benefits:**

✅ **Simpler implementation** (1 hour dev time)
✅ **Less code to maintain**
✅ **Flexible** - User can skip and come back later

### **Drawbacks:**

⚠️ **User might skip setup** - Incomplete profiles
⚠️ **Less guided** - User might be confused
⚠️ **Potential orphaned accounts** - Users who never complete setup

---

## 🎯 **RECOMMENDED APPROACH**

### **✅ APPROACH A (Auto-Create + Onboarding)**

**Why:**
1. **Better UX** - Guided, professional onboarding
2. **Complete profiles** - All info collected upfront
3. **No orphans** - Every courier user has courier_id
4. **Security** - Can validate company legitimacy
5. **Professional** - Makes platform look polished

**Implementation Time:** 2-3 hours
**Complexity:** Medium
**User Experience:** ⭐⭐⭐⭐⭐

---

## 📋 **IMPLEMENTATION CHECKLIST**

### **Phase 1: Database (15 min)**

- [ ] Add `onboarding_completed` column to couriers table
- [ ] Add `onboarding_step` column (INTEGER, default 0)
- [ ] Add `profile_completed_at` column (TIMESTAMP)

```sql
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP WITH TIME ZONE;
```

### **Phase 2: Registration API (30 min)**

- [ ] Modify `api/auth/register.ts`
- [ ] Auto-create courier record for courier role
- [ ] Return `courier_id` and `needs_onboarding` flag
- [ ] Set `onboarding_completed = false`

### **Phase 3: Onboarding UI (1.5 hours)**

- [ ] Create `CourierOnboarding.tsx` page
- [ ] Create `CompanyInfoForm.tsx` component
- [ ] Create `ServiceDetailsForm.tsx` component
- [ ] Create `APICredentialsForm.tsx` component
- [ ] Create `ReviewAndActivate.tsx` component
- [ ] Add stepper navigation
- [ ] Add form validation
- [ ] Add API integration

### **Phase 4: Routing (15 min)**

- [ ] Add `/courier/onboarding` route
- [ ] Redirect after registration based on role
- [ ] Protect courier dashboard (require onboarding complete)

### **Phase 5: Testing (30 min)**

- [ ] Test courier registration
- [ ] Test onboarding flow
- [ ] Test API credential addition
- [ ] Test dashboard access
- [ ] Test with PostNord test user

---

## 🧪 **TEST SCENARIO: PostNord User**

### **Step 1: Create Test Courier User**

```sql
-- Create test courier user in Supabase Auth
-- Email: postnord-courier@test.com
-- Password: TestPassword123!
-- Role: courier

-- This will auto-create courier record via registration API
```

### **Step 2: Login as PostNord Courier**

```typescript
// In Playwright test or manual test
await login('postnord-courier@test.com', 'TestPassword123!');

// Should redirect to /courier/onboarding
expect(page.url()).toContain('/courier/onboarding');
```

### **Step 3: Complete Onboarding**

```typescript
// Step 1: Company Info
await page.fill('input[name="courier_name"]', 'PostNord Test Courier');
await page.fill('input[name="description"]', 'PostNord delivery service');
await page.click('button:has-text("Next")');

// Step 2: Service Details
await page.selectOption('select[name="service_types"]', ['home_delivery', 'parcel_shop']);
await page.click('button:has-text("Next")');

// Step 3: API Credentials
await page.fill('input[name="customer_number"]', 'POSTNORD123');
await page.fill('input[name="api_key"]', 'test-api-key-postnord');
await page.click('button:has-text("Test Connection")');
await page.waitForSelector('text=Connection successful');
await page.click('button:has-text("Next")');

// Step 4: Review & Activate
await page.click('button:has-text("Activate My Account")');

// Should redirect to courier dashboard
expect(page.url()).toContain('/courier/dashboard');
```

### **Step 4: Verify Courier Can Access Dashboard**

```typescript
// Courier dashboard should show:
// - Company name: PostNord Test Courier
// - API status: ✅ Connected
// - Orders: 0 (no orders yet)
// - Performance metrics: N/A (no data yet)
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### **1. Courier Verification**

**Problem:** Anyone can register as "courier" - how do we verify they're legitimate?

**Solutions:**

**Option A: Email Domain Verification**
```typescript
// Only allow registration from company email domains
const allowedDomains = ['postnord.com', 'bring.no', 'dhl.com'];
const emailDomain = email.split('@')[1];

if (role === 'courier' && !allowedDomains.includes(emailDomain)) {
  throw new Error('Please use your company email address');
}
```

**Option B: Manual Approval**
```typescript
// Set courier as inactive until admin approves
await supabase.from('couriers').insert({
  user_id: newUser.id,
  is_active: false, // Admin must approve
  approval_status: 'pending'
});

// Send notification to admin
await sendAdminNotification({
  type: 'new_courier_registration',
  courier_id: courier.courier_id,
  company_name: courier_name
});
```

**Option C: API Key Validation**
```typescript
// Verify API credentials during onboarding
const isValid = await validateCourierAPIKey(courier_name, api_key);

if (!isValid) {
  throw new Error('Invalid API credentials. Please check and try again.');
}

// Only activate if API key is valid
await supabase.from('couriers').update({
  is_active: true,
  api_verified_at: new Date()
}).eq('courier_id', courier_id);
```

**✅ RECOMMENDED: Combination of B + C**
- Require manual admin approval
- Validate API credentials during onboarding
- Only activate after both checks pass

### **2. RLS Policies for Courier Onboarding**

```sql
-- Courier can only create their own courier record
CREATE POLICY courier_insert_own ON couriers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'courier'
  AND user_id = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM couriers WHERE user_id = auth.uid()
  ) -- Prevent duplicate courier records
);

-- Courier can only update their own courier record
CREATE POLICY courier_update_own ON couriers
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'courier'
  AND user_id = auth.uid()
);
```

---

## 📊 **COMPARISON TABLE**

| Feature | Approach A (Auto-Create) | Approach B (Manual Setup) |
|---------|-------------------------|--------------------------|
| **UX Quality** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good |
| **Dev Time** | 2-3 hours | 1 hour |
| **Complexity** | Medium | Low |
| **Orphaned Accounts** | ❌ None | ⚠️ Possible |
| **Complete Profiles** | ✅ Always | ⚠️ Sometimes |
| **Professional Feel** | ✅ Very | ⚠️ Moderate |
| **Security** | ✅ Better | ⚠️ Good |
| **Maintenance** | Medium | Low |

---

## 🎯 **FINAL RECOMMENDATION**

### **✅ IMPLEMENT APPROACH A**

**Reasons:**
1. **Better for launch** - Professional onboarding experience
2. **Prevents issues** - No orphaned accounts or incomplete profiles
3. **Scalable** - Easy to add more steps later
4. **Security** - Can add verification steps
5. **Worth the time** - 2-3 hours investment pays off

### **Implementation Order:**
1. **Tonight:** Create database columns (15 min)
2. **Tomorrow Morning:** Modify registration API (30 min)
3. **Tomorrow Afternoon:** Build onboarding UI (1.5 hours)
4. **Tomorrow Evening:** Test with PostNord user (30 min)

**Total Time:** ~3 hours
**Launch Impact:** HIGH - Professional courier onboarding

---

## 📝 **NEXT STEPS**

1. ✅ **Approve this approach** (you decide)
2. 🔧 **Run database migration** (add onboarding columns)
3. 🔧 **Modify registration API** (auto-create courier record)
4. 🔧 **Build onboarding UI** (4-step wizard)
5. 🧪 **Create PostNord test user** (test the flow)
6. ✅ **Deploy and verify**

---

**Decision needed:** Which approach do you prefer?
- **A:** Auto-create + Onboarding (recommended)
- **B:** Manual setup (simpler)
- **C:** Hybrid (auto-create but optional onboarding)

Let me know and I'll start implementing! 🚀
