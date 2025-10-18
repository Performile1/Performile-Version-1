# 📱 Mobile Login Troubleshooting Guide

## 🔍 Quick Diagnostics

### Step 1: Enable Mobile Debug Console

On your phone, add `?debug=true` to the URL:
```
https://performile-platform-main.vercel.app/?debug=true
```

This will show a floating debug button. Tap it to see:
- Console logs
- Network requests
- Storage (localStorage)
- Errors

### Step 2: Check What Error You're Getting

Common mobile login errors:

#### Error 1: "timeout of 30000ms exceeded"
**Cause:** Slow mobile connection
**Fix:** 
- Try on WiFi instead of mobile data
- Wait longer (mobile connections are slower)

#### Error 2: "Network Error"
**Cause:** CORS or connection issue
**Fix:**
- Check if you can access: `https://performile-platform-main.vercel.app/api/health`
- If that fails, backend is down

#### Error 3: "Invalid credentials"
**Cause:** Wrong email/password
**Fix:**
- Double-check credentials
- Try on desktop first to verify they work

#### Error 4: Blank screen / No response
**Cause:** JavaScript error or caching
**Fix:**
- Clear browser cache
- Try incognito/private mode
- Force refresh

---

## 🧪 Testing Steps

### Test 1: Can you reach the API?

On your phone browser, go to:
```
https://performile-platform-main.vercel.app/api/health
```

**Expected:** JSON response with `"status": "healthy"`

**If you get an error:** Backend is not accessible from mobile network

### Test 2: Check localStorage

With debug console open (`?debug=true`):
1. Tap debug button
2. Go to "Storage" tab
3. Check "Local Storage"
4. Look for:
   - `performile-auth`
   - `performile_tokens`

**If empty:** Tokens aren't being saved
**If present but login fails:** Tokens might be expired

### Test 3: Try Different Browser

- **Android:** Try Chrome, Firefox, Samsung Internet
- **iOS:** Try Safari, Chrome, Firefox

Sometimes one browser works better than others.

### Test 4: Check Network Tab

With debug console:
1. Tap debug button
2. Go to "Network" tab
3. Try to login
4. Check the `/api/auth` request
5. Look at:
   - Status code (should be 200)
   - Response body
   - Request headers

---

## 🔧 Common Fixes

### Fix 1: Clear Mobile Browser Cache

**Android Chrome:**
1. Settings → Privacy → Clear browsing data
2. Select "Cached images and files"
3. Click "Clear data"

**iOS Safari:**
1. Settings → Safari → Clear History and Website Data
2. Confirm

### Fix 2: Force Refresh

**Android:**
- Pull down to refresh
- Or: Menu → Settings → Site settings → Clear & reset

**iOS:**
- Pull down to refresh
- Or: Hold refresh button → "Reload Without Content Blockers"

### Fix 3: Use Incognito/Private Mode

**Android Chrome:**
- Menu (⋮) → New incognito tab

**iOS Safari:**
- Tabs button → Private

This bypasses all caching and extensions.

### Fix 4: Check Mobile Data vs WiFi

- Try on WiFi if you're on mobile data
- Try on mobile data if you're on WiFi
- Some networks block certain connections

---

## 🐛 Debug Mode Instructions

After adding `?debug=true` to URL:

### View Console Logs:
1. Tap floating debug button (bottom right)
2. Tap "Console" tab
3. Try to login
4. Look for errors in red

### View Network Requests:
1. Debug button → "Network" tab
2. Try to login
3. Find `/api/auth` request
4. Tap it to see details

### View Storage:
1. Debug button → "Storage" tab
2. Expand "Local Storage"
3. Check for tokens

### Copy Logs:
1. Debug button → "Console" tab
2. Long press on a log
3. Select "Copy"
4. Send to yourself for review

---

## 📊 What to Check

### 1. Token Expiration

If you logged in on desktop hours ago, tokens might be expired.

**Solution:** Clear storage and login fresh on mobile

### 2. Multiple Devices

There's NO limit on devices - you can be logged in on:
- Desktop
- Phone
- Tablet
- Multiple browsers

Each gets its own tokens.

### 3. Mobile View Issues

The app is responsive and should work on mobile. If layout is broken:
- Try landscape mode
- Zoom out (pinch)
- Check if specific buttons are hidden

### 4. Slow Connection

Mobile networks are slower. The timeout is 30 seconds, but:
- First load might take longer
- Cold start on serverless can add 5-10 seconds
- Be patient!

---

## 🚨 Emergency Workaround

If mobile browser won't work, try:

### Option 1: Desktop Mode

**Android Chrome:**
- Menu (⋮) → Desktop site ✓

**iOS Safari:**
- AA button → Request Desktop Website

### Option 2: Different URL

Try accessing via IP (if you know your server IP):
```
http://YOUR-IP:3000
```

### Option 3: Local Development

If you have the code locally:
```bash
npm run dev
```

Then access from phone using your computer's local IP:
```
http://192.168.1.X:5173
```

---

## 📝 Information to Collect

If still not working, collect this info:

1. **Phone Details:**
   - Device: (iPhone 12, Samsung S21, etc.)
   - OS: (iOS 17, Android 13, etc.)
   - Browser: (Safari, Chrome, etc.)

2. **Error Message:**
   - Exact error from console
   - Screenshot if possible

3. **Network:**
   - WiFi or Mobile Data?
   - Can you access other websites?

4. **What You See:**
   - Blank screen?
   - Login button not working?
   - Error message displayed?

5. **Console Logs:**
   - Copy from debug console
   - Look for errors in red

---

## ✅ Success Indicators

Login is working when you see:

```
[AuthStore] === LOGIN STARTED ===
[AuthStore] Login response received
[AuthStore] Login successful, setting tokens
[AuthStore] Tokens manually saved to localStorage
```

And you're redirected to the dashboard.

---

## 🎯 Most Likely Issues

Based on common mobile problems:

1. **Cache (80%)** - Clear cache fixes most issues
2. **Network (10%)** - Slow connection or firewall
3. **Tokens (5%)** - Expired tokens from previous session
4. **Browser (5%)** - Specific browser compatibility

**Try clearing cache first!**

---

## 📞 Next Steps

1. Add `?debug=true` to URL
2. Try to login
3. Check console for errors
4. Share the error message

Then we can pinpoint the exact issue!
