# COURIER CREDENTIALS TEST - November 5, 2025

**Time:** 10:21 AM  
**Status:** Dev server running ✅  
**URL:** http://localhost:3000  
**Duration:** 15 minutes

---

## 🎯 TEST OBJECTIVE

Verify that the Courier Credentials feature built yesterday is working correctly before building checkout on top of it.

---

## 📋 TEST STEPS

### **1. Login (2 min)**
- [ ] Navigate to http://localhost:3000
- [ ] Login as: `merchant@performile.com`
- [ ] Password: [your merchant password]
- [ ] Verify successful login

### **2. Navigate to Courier Settings (1 min)**
- [ ] Click on "Settings" in navigation
- [ ] Click on "Couriers" tab
- [ ] Verify page loads without errors
- [ ] Verify courier list displays

### **3. Test Add Credentials (5 min)**
- [ ] Find a courier (e.g., DPD, PostNord, Bring)
- [ ] Click "Configure" or credentials icon
- [ ] Verify credentials modal opens
- [ ] Fill in test credentials:
  - API Key: `test_api_key_123`
  - API Secret: `test_secret_456`
  - Username: `test_user`
  - Password: `test_pass`
- [ ] Click "Test Connection"
- [ ] Verify test response (may fail - that's OK)
- [ ] Click "Save"
- [ ] Verify credentials saved
- [ ] Verify status changes to ✅ configured

### **4. Test View Credentials (2 min)**
- [ ] Click credentials icon again
- [ ] Verify saved credentials display (masked)
- [ ] Verify "Last Updated" shows timestamp
- [ ] Close modal

### **5. Test Update Credentials (2 min)**
- [ ] Open credentials modal again
- [ ] Update API Key to: `updated_key_789`
- [ ] Click "Save"
- [ ] Verify update successful
- [ ] Verify "Last Updated" timestamp changed

### **6. Test Delete Credentials (2 min)**
- [ ] Open credentials modal
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] Verify credentials removed
- [ ] Verify status changes to ⚠️ not configured

### **7. Verify Database (1 min)**
- [ ] Check Supabase dashboard
- [ ] Verify `courier_api_credentials` table has entries
- [ ] Verify RLS policies working (only merchant's credentials visible)

---

## ✅ SUCCESS CRITERIA

### **Must Work:**
- ✅ Modal opens and closes
- ✅ Credentials can be saved
- ✅ Status indicator updates (✅/⚠️)
- ✅ Credentials can be viewed (masked)
- ✅ Credentials can be updated
- ✅ Credentials can be deleted

### **Nice to Have:**
- ⏳ Test connection works (may fail with test credentials)
- ⏳ Encryption working (verify in database)
- ⏳ Timestamps accurate

---

## 🐛 KNOWN ISSUES TO CHECK

### **From Yesterday's Implementation:**
1. **Modal not opening?**
   - Check console for errors
   - Verify courier_id is being passed

2. **Save not working?**
   - Check network tab for API call
   - Verify `/api/merchant/courier-credentials` endpoint
   - Check Supabase RLS policies

3. **Status not updating?**
   - Verify trigger on `courier_api_credentials` table
   - Check `merchant_courier_selections.credentials_configured` column

4. **Credentials not displaying?**
   - Verify view `vw_merchant_courier_credentials`
   - Check RLS policies on view

---

## 🔧 QUICK FIXES

### **If Modal Won't Open:**
```typescript
// Check MerchantCourierSettings.tsx line ~200
const handleOpenCredentialsModal = (courier: Courier) => {
  console.log('Opening modal for courier:', courier.courier_id);
  setSelectedCourier(courier);
  setCredentialsModalOpen(true);
};
```

### **If Save Fails:**
```typescript
// Check API endpoint: api/merchant/courier-credentials.ts
// Verify Supabase client initialized
// Check RLS policies allow INSERT
```

### **If Status Not Updating:**
```sql
-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'courier_api_credentials';

-- Manually update if needed
UPDATE merchant_courier_selections 
SET credentials_configured = true 
WHERE merchant_id = '[merchant_id]' 
AND courier_id = '[courier_id]';
```

---

## 📊 TEST RESULTS

### **Test Run 1 (10:21 AM):**
- [ ] Login: ___
- [ ] Navigation: ___
- [ ] Add Credentials: ___
- [ ] View Credentials: ___
- [ ] Update Credentials: ___
- [ ] Delete Credentials: ___
- [ ] Database Verification: ___

**Overall Status:** ⏳ PENDING

**Issues Found:**
1. ___
2. ___
3. ___

**Time Taken:** ___ minutes

---

## 🎯 NEXT STEPS

### **If All Tests Pass:**
✅ Move to Pricing Settings UI implementation  
✅ Confidence: HIGH - feature is solid

### **If Minor Issues:**
⚠️ Fix issues (15-30 min)  
⚠️ Re-test  
⚠️ Then move to Pricing Settings

### **If Major Issues:**
🚨 Stop and debug  
🚨 Review yesterday's implementation  
🚨 Fix root cause before proceeding

---

## 💡 TESTING TIPS

1. **Keep Console Open:** Watch for errors
2. **Check Network Tab:** Verify API calls
3. **Use Supabase Dashboard:** Verify data saved
4. **Test Mobile:** Check responsive design
5. **Test Different Couriers:** Verify works for all

---

## 📝 NOTES

**Remember:**
- This is a CRITICAL test - checkout depends on this
- Don't skip steps - verify everything works
- Document any issues found
- Fix issues before moving forward

**Why This Matters:**
- Checkout will use these credentials
- Pricing depends on courier configuration
- Can't build on broken foundation

---

*Created: November 5, 2025, 10:21 AM*  
*Purpose: Verify courier credentials feature*  
*Duration: 15 minutes*  
*Status: Ready to test 🧪*
