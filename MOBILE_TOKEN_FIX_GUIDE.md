# Mobile Token Issue - Fix Guide

## 🔴 Problem Identified

Your tokens have **EXPIRED**! 

### Token Expiration Analysis:
```
Access Token Expiration: October 18, 2025 at 12:12 AM
Current Time: October 18, 2025 at 9:15 AM
Status: EXPIRED 9 HOURS AGO ❌
```

The token refresh mechanism wasn't running automatically on app load, causing expired tokens to remain in storage.

---

## ✅ Fixes Applied

### 1. **Automatic Token Validation on App Load**
**File:** `apps/web/src/App.tsx`

**What Changed:**
- Added `validateStoredToken()` call on app mount
- Checks if tokens are expired when app loads
- Automatically refreshes tokens if they're expired or expiring soon (< 5 minutes)
- Clears auth and redirects to login if refresh fails

**Code:**
```typescript
React.useEffect(() => {
  const validateTokens = async () => {
    try {
      console.log('[App] Validating stored tokens on load...');
      await validateStoredToken();
    } catch (error) {
      console.error('[App] Token validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  validateTokens();
}, []); // Run once on mount
```

### 2. **Enhanced Token Validation Logic**
**File:** `apps/web/src/store/authStore.ts`

**What Changed:**
- Better logging to see token expiration status
- Shows user-friendly error messages when tokens expire
- Automatically attempts refresh before clearing auth
- Logs exact expiration time for debugging

**Debug Output:**
```
[AuthStore] Token validation: {
  exp: 1760775160,
  now: 1760804100,
  expired: true,
  expiresInMinutes: -482  // Negative = expired
}
```

---

## 🔧 Immediate Actions Required

### Step 1: Clear Your Browser Storage (Computer & Phone)

**On Computer:**
1. Open DevTools (F12)
2. Go to Application tab → Storage
3. Clear these items:
   - `performile-auth`
   - `performile_tokens`
4. Refresh the page

**On Phone:**
1. Open browser settings
2. Clear site data for your app
3. Or use browser DevTools if available

### Step 2: Login Again

After clearing storage:
1. Go to login page
2. Enter credentials
3. New tokens will be generated
4. Tokens will now auto-refresh when they expire

### Step 3: Verify Token Refresh Works

**Check Console Logs:**
```
[App] Validating stored tokens on load...
[AuthStore] Token validation: { expired: false, expiresInMinutes: 55 }
[AuthStore] Token is still valid
```

**If Token Expires:**
```
[AuthStore] Token expired or expiring soon, attempting refresh
[AuthStore] Token refreshed successfully
```

---

## 📱 Mobile-Specific Configuration

### Environment Variables

Make sure your mobile build has the correct API URL:

**For Production/Mobile:**
```env
VITE_API_URL=https://your-production-domain.com/api
```

**For Local Testing:**
```env
VITE_API_URL=http://192.168.1.X:3000/api  # Your computer's local IP
```

### Check API Accessibility

**Test from mobile browser:**
```
https://your-domain.com/api/health
```

Should return a 200 response. If not:
- Check firewall settings
- Verify CORS configuration
- Ensure SSL certificate is valid

---

## 🐛 Debugging Token Issues

### Check Token Status in Console

Open browser console and run:
```javascript
// Check stored tokens
const auth = JSON.parse(localStorage.getItem('performile-auth'));
console.log('Tokens:', auth?.state?.tokens);

// Decode access token
const token = auth?.state?.tokens?.accessToken;
if (token) {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  const now = Math.floor(Date.now() / 1000);
  console.log('Token expires:', new Date(payload.exp * 1000));
  console.log('Expired:', payload.exp < now);
  console.log('Minutes until expiry:', Math.floor((payload.exp - now) / 60));
}
```

### Expected Token Lifetimes

Based on your tokens:
- **Access Token:** 1 hour (3600 seconds)
- **Refresh Token:** 7 days (604800 seconds)

### Token Refresh Triggers

Tokens will auto-refresh when:
1. **On app load** - if expired or expiring in < 5 minutes
2. **On 401 error** - if API returns unauthorized
3. **User activity** - every 5 minutes if user is active

---

## 🔒 Security Best Practices

### Current Implementation (Temporary)
- Tokens stored in localStorage
- Both access and refresh tokens in storage
- Works but not ideal for production

### Recommended for Production
1. **HttpOnly Cookies** for refresh tokens
2. **Memory only** for access tokens
3. **Secure flag** on all cookies
4. **SameSite=Strict** for CSRF protection

### Migration Path
```typescript
// Future implementation
{
  name: 'performile-auth',
  partialize: (state) => ({
    user: state.user,
    // tokens: state.tokens, // REMOVE - use HttpOnly cookies
    isAuthenticated: state.isAuthenticated,
  }),
}
```

---

## 📊 Monitoring Token Health

### Add to Your Dashboard

Create a token status indicator:
```typescript
const TokenStatus = () => {
  const { tokens } = useAuthStore();
  const [status, setStatus] = useState('checking');
  
  useEffect(() => {
    if (!tokens?.accessToken) {
      setStatus('no-token');
      return;
    }
    
    try {
      const decoded = jwtDecode(tokens.accessToken);
      const now = Math.floor(Date.now() / 1000);
      const minutesLeft = Math.floor((decoded.exp - now) / 60);
      
      if (minutesLeft < 0) setStatus('expired');
      else if (minutesLeft < 5) setStatus('expiring-soon');
      else setStatus('valid');
    } catch {
      setStatus('invalid');
    }
  }, [tokens]);
  
  return <Badge color={status === 'valid' ? 'success' : 'error'} />;
};
```

---

## 🧪 Testing Checklist

### Desktop Testing
- [ ] Login with fresh credentials
- [ ] Check console for token validation logs
- [ ] Wait 1 hour, verify auto-refresh works
- [ ] Close browser, reopen, verify tokens still valid
- [ ] Manually expire token, verify redirect to login

### Mobile Testing
- [ ] Clear browser data
- [ ] Login on mobile
- [ ] Check if tokens persist after app close
- [ ] Test with phone locked for 1+ hour
- [ ] Verify auto-refresh on app reopen
- [ ] Test with airplane mode (should show offline message)

---

## 🚨 Common Issues & Solutions

### Issue: "Token refresh failed"
**Cause:** Refresh token also expired (7 days)
**Solution:** Login again to get new tokens

### Issue: "Invalid session" on mobile
**Cause:** localStorage not accessible or cleared
**Solution:** 
- Check browser privacy settings
- Disable "Clear data on exit"
- Use standard browser (not private mode)

### Issue: Constant re-login required
**Cause:** Token refresh endpoint not working
**Solution:**
- Check backend `/api/auth` endpoint
- Verify refresh token is being sent
- Check server logs for errors

### Issue: 404 on all API calls
**Cause:** Wrong API URL or CORS issue
**Solution:**
- Verify `VITE_API_URL` is set correctly
- Check CORS allows your mobile domain
- Test API endpoint directly in browser

---

## 📝 Next Steps

1. **Immediate:** Clear storage and login again
2. **Short-term:** Monitor console logs for token refresh
3. **Medium-term:** Implement HttpOnly cookies
4. **Long-term:** Add token health monitoring to UI

---

## 🔗 Related Files

- `apps/web/src/App.tsx` - Token validation on load
- `apps/web/src/store/authStore.ts` - Token management
- `apps/web/src/services/apiClient.ts` - Token refresh interceptor
- `apps/web/src/services/authService.ts` - Auth API calls

---

## 💡 Pro Tips

1. **Development:** Set longer token expiry for testing
2. **Production:** Use short-lived tokens (15-30 min)
3. **Mobile:** Consider biometric re-authentication
4. **Monitoring:** Log token refresh events to analytics
5. **UX:** Show countdown when token expiring soon

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No more 404/401 errors on mobile
- ✅ Console shows "Token is still valid" on app load
- ✅ Auto-refresh happens before expiry
- ✅ Seamless experience across sessions
- ✅ Clear error message if login required

---

**Last Updated:** October 18, 2025
**Status:** Fixed - Awaiting Testing
