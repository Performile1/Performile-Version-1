# Sentry Setup Guide

## ✅ What's Already Done

The Sentry SDK is already installed and configured in the codebase:
- ✅ `@sentry/react` installed
- ✅ Configuration file created (`frontend/src/config/sentry.ts`)
- ✅ Initialized in `main.tsx`
- ✅ Error tracking helpers created
- ✅ User context tracking

## 🎯 What You Need to Do

### Step 1: Get Your Sentry DSN

1. Go to [https://sentry.io](https://sentry.io)
2. Sign in (or create free account)
3. Create a new project:
   - Platform: **React**
   - Project name: **performile-frontend**
4. Copy the **DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### Step 2: Add DSN to Environment Variables

**For Local Development:**

Create/update `.env.local` in the `frontend` directory:
```env
VITE_SENTRY_DSN=https://your-dsn-here@xxxxx.ingest.sentry.io/xxxxx
```

**For Vercel Production:**

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `VITE_SENTRY_DSN`
   - **Value:** Your DSN from Sentry
   - **Environment:** Production, Preview, Development

### Step 3: Test Sentry

**Local Test:**
```bash
cd frontend
npm run dev
```

Open browser console - you should see:
```
✅ Sentry initialized successfully
```

**Trigger a Test Error:**

Add this to any page temporarily:
```typescript
<button onClick={() => {
  throw new Error('Test Sentry Error!');
}}>
  Test Sentry
</button>
```

Click the button → Check Sentry dashboard for the error.

### Step 4: Deploy to Production

```bash
git push origin main
```

Vercel will automatically deploy with Sentry enabled.

## 📊 What Sentry Will Track

### Automatic Tracking:
- ✅ JavaScript errors
- ✅ Unhandled promise rejections
- ✅ API errors
- ✅ Performance metrics
- ✅ User sessions (with replay)
- ✅ Network requests
- ✅ Component errors

### Manual Tracking (Already Integrated):
```typescript
import { captureError, setSentryUser } from '@/config/sentry';

// Capture custom errors
try {
  // your code
} catch (error) {
  captureError(error, { context: 'additional info' });
}

// Set user context (already in auth store)
setSentryUser({
  id: user.user_id,
  email: user.email,
  username: user.first_name
});
```

## 🎛️ Sentry Dashboard Features

Once configured, you'll see:

1. **Issues** - All errors with stack traces
2. **Performance** - Slow API calls and page loads
3. **Replays** - Video-like session recordings
4. **Releases** - Track errors by deployment
5. **Alerts** - Get notified of critical errors

## 🔧 Configuration Details

**Current Settings:**
- **Sample Rate (Dev):** 100% of transactions
- **Sample Rate (Prod):** 10% of transactions
- **Replay (Dev):** 100% of sessions
- **Replay (Prod):** 10% of sessions, 100% on error
- **Environment:** Automatically set (development/production)

**Ignored Errors:**
- Browser extension errors
- Network errors (non-critical)
- Pusher connection errors
- Info/warning level events (in production)

## 🚀 Next Steps

1. **Get DSN** from Sentry
2. **Add to `.env.local`** for testing
3. **Add to Vercel** for production
4. **Test locally** - trigger an error
5. **Deploy** - push to main
6. **Monitor** - check Sentry dashboard

## 📞 Troubleshooting

**Issue:** "Sentry DSN not configured" warning
- **Fix:** Add `VITE_SENTRY_DSN` to your environment variables

**Issue:** No errors showing in Sentry
- **Fix:** Make sure DSN is correct and environment variables are set

**Issue:** Too many events
- **Fix:** Adjust sample rates in `frontend/src/config/sentry.ts`

## 🎉 Benefits

Once configured, you'll get:
- ✅ Real-time error notifications
- ✅ Detailed stack traces
- ✅ User session replays
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Error trends and analytics

---

**Total Setup Time:** 5 minutes  
**Cost:** Free tier (up to 5,000 errors/month)
