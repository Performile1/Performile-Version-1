# 🔧 AI CHAT TROUBLESHOOTING GUIDE

**Created:** October 21, 2025  
**Status:** Active Debugging

---

## 🐛 CURRENT ISSUE: 500 ERROR

### **Symptoms:**
- Chat widget appears ✅
- Chat opens ✅
- User sends message ✅
- Error: "I apologize, but I encountered an error" ❌
- Console: `/api/chat:1 Failed to load resource: 500`

### **Root Cause:**
API endpoint was using `fetch()` which may not be available in Vercel Node.js runtime.

### **Fix Applied:**
1. ✅ Replaced `fetch` with `axios`
2. ✅ Added detailed error logging
3. ✅ Improved error handling
4. ✅ Committed and pushed
5. ⏳ Waiting for Vercel deployment

---

## 🔍 DEBUGGING STEPS TAKEN

### **Step 1: Identified 404 → 500 Progress**
- **404 Error:** API endpoint not found
- **Fixed:** Moved `apps/api/chat.ts` to `api/chat.ts`
- **Result:** 500 error (API found, but failing)

### **Step 2: Analyzed API Code**
- **Issue:** Using `fetch()` instead of `axios`
- **Issue:** Limited error logging
- **Fix:** Replaced with `axios` and added logging

### **Step 3: Enhanced Error Handling**
- Added specific error messages for:
  - Missing API key
  - Invalid API key (401)
  - Rate limits (429)
  - General failures

---

## 📊 HOW TO CHECK VERCEL LOGS

### **Method 1: Vercel Dashboard**

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **"Functions"** tab
4. Find `/api/chat`
5. Click to view logs

**Look for:**
```
✅ "OpenAI API key not configured" → Add key
✅ "Invalid OpenAI API key" → Check key format
✅ "OpenAI rate limit exceeded" → Wait or upgrade
✅ Other errors → Share with developer
```

### **Method 2: Real-time Logs**

1. Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click latest deployment
4. Click **"View Function Logs"**
5. Try chat again
6. Watch logs appear in real-time

---

## ✅ FIXES APPLIED

### **Fix 1: API Endpoint Location**
```bash
# Moved from wrong location
apps/api/chat.ts → api/chat.ts

# Why: Vercel looks for functions in /api directory
```

### **Fix 2: Replace fetch with axios**
```typescript
// BEFORE (fetch - may not work in Vercel)
const response = await fetch(OPENAI_API_URL, {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({ ... })
});

// AFTER (axios - works in Vercel)
const response = await axios.post(
  OPENAI_API_URL,
  { ... },
  { headers: { ... } }
);
```

### **Fix 3: Better Error Logging**
```typescript
// Added detailed logging
console.error('OpenAI API error:', {
  message: error.message,
  status: error.response?.status,
  data: error.response?.data,
});
```

---

## 🧪 TESTING CHECKLIST

After deployment completes (2-3 minutes):

- [ ] Hard refresh: `Ctrl + Shift + R`
- [ ] Open chat widget
- [ ] Send test message: "What is Performile?"
- [ ] Check for AI response
- [ ] Check console for errors
- [ ] Check Vercel function logs

---

## 🎯 EXPECTED RESULTS

### **Success:**
```
✅ Chat opens
✅ User sends: "What is Performile?"
✅ AI responds with platform information
✅ No console errors
✅ Vercel logs show 200 status
```

### **If Still Failing:**

**Check 1: API Key**
```bash
# Verify in Vercel Dashboard
Settings → Environment Variables
Name: OPENAI_API_KEY
Value: sk-proj-...
Environments: Production, Preview, Development
```

**Check 2: OpenAI Account**
- Go to https://platform.openai.com/usage
- Verify you have credits
- Check for rate limits

**Check 3: Vercel Logs**
- Look for specific error message
- Share with developer for help

---

## 🔐 COMMON ISSUES & SOLUTIONS

### **Issue 1: "OpenAI API key not configured"**

**Solution:**
1. Add `OPENAI_API_KEY` to Vercel
2. Redeploy
3. Wait 2-3 minutes

### **Issue 2: "Invalid OpenAI API key"**

**Solution:**
1. Verify key format: `sk-proj-...`
2. Check key is not revoked
3. Create new key if needed

### **Issue 3: "OpenAI rate limit exceeded"**

**Solution:**
1. Wait 1 minute
2. Or upgrade OpenAI plan
3. Or reduce usage

### **Issue 4: "Failed to get AI response"**

**Solution:**
1. Check Vercel function logs
2. Verify OpenAI status: https://status.openai.com/
3. Check network connectivity

---

## 📝 DEPLOYMENT TIMELINE

**1:07 PM** - User added OpenAI API key to Vercel  
**1:13 PM** - First test: 404 error (API not found)  
**1:19 PM** - Fixed location: 500 error (API found, failing)  
**1:30 PM** - User shared screenshot showing error  
**1:35 PM** - Fixed fetch → axios, added logging  
**1:36 PM** - Pushed to GitHub  
**1:38 PM** - ⏳ Waiting for Vercel deployment

---

## 🚀 NEXT STEPS

1. **Wait 2-3 minutes** for Vercel to deploy
2. **Hard refresh** your site: `Ctrl + Shift + R`
3. **Test chat** with: "What is Performile?"
4. **Check Vercel logs** if still failing
5. **Share error message** if needed

---

## 💡 TIPS FOR FUTURE

### **Prevent 500 Errors:**
- Always use `axios` for HTTP requests in Vercel
- Add detailed error logging
- Test locally before deploying
- Monitor Vercel function logs

### **Debug Faster:**
- Check Vercel logs first
- Use real-time log viewer
- Add console.error() for debugging
- Test with simple messages first

### **Monitor Costs:**
- Set OpenAI usage limits
- Enable billing alerts
- Track API calls
- Optimize prompts

---

## 📞 SUPPORT

**If chat still doesn't work:**

1. Check Vercel function logs
2. Share the error message
3. Verify OpenAI API key is valid
4. Check OpenAI account status

**Documentation:**
- Setup Guide: `AI_CHAT_SETUP_GUIDE.md`
- Quick Start: `AI_CHAT_QUICK_START.md`
- This Guide: `AI_CHAT_TROUBLESHOOTING.md`

---

**Last Updated:** October 21, 2025, 1:36 PM  
**Status:** Fixes deployed, waiting for Vercel  
**ETA:** 2-3 minutes until live
