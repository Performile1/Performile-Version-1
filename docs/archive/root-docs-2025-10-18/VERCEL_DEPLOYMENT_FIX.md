# 🚨 Vercel Deployment Fix - API Timeout Issue

## Problem
```
Error: timeout of 10000ms exceeded
Endpoint: /api/auth
Status: Backend not responding
```

## Root Causes

1. **Missing Environment Variables** in Vercel
2. **Database Connection Timeout** (Supabase not responding)
3. **Cold Start** taking too long (serverless function)

---

## ✅ Fix 1: Set Environment Variables in Vercel

### Required Environment Variables:

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secrets (must be 32+ characters)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars

# Optional
NODE_ENV=production
VITE_API_URL=https://your-domain.vercel.app/api
```

### How to Add:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable
5. Select **Production**, **Preview**, and **Development**
6. Click **Save**
7. **Redeploy** your project

---

## ✅ Fix 2: Increase Serverless Function Timeout

Your `vercel.json` already has `maxDuration: 60`, but let's verify:

```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/node@3.2.0",
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

---

## ✅ Fix 3: Add Database Connection Pooling

The API is trying to connect to the database on every request. This can timeout.

### Update `api/lib/db.ts`:

```typescript
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // 10 second timeout
    });
  }
  return pool;
}
```

---

## ✅ Fix 4: Add Health Check Endpoint

Create `api/health.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasJWT: !!process.env.JWT_SECRET,
      hasSupabase: !!process.env.SUPABASE_URL,
    }
  });
}
```

Test it: `https://your-domain.vercel.app/api/health`

---

## ✅ Fix 5: Update Frontend Timeout

If backend is slow, increase frontend timeout:

### `apps/web/src/services/authService.ts`:

```typescript
const response: AxiosResponse<ApiResponse<{ user: User; tokens: AuthTokens }>> = await axios.post(
  `${API_BASE_URL}/auth`,
  { action: 'login', ...credentials },
  {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 30000, // Increase to 30 seconds
  }
);
```

---

## 🔍 Debugging Steps

### Step 1: Check Vercel Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to **Deployments**
4. Click on latest deployment
5. Go to **Functions** tab
6. Check logs for `/api/auth`

Look for:
- Database connection errors
- Missing environment variable errors
- Timeout errors

### Step 2: Test Health Endpoint

After creating `api/health.ts`, test it:

```bash
curl https://performile-platform-main.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T07:28:00.000Z",
  "env": {
    "hasDatabase": true,
    "hasJWT": true,
    "hasSupabase": true
  }
}
```

If any are `false`, that's your problem!

### Step 3: Test Auth Endpoint Directly

```bash
curl -X POST https://performile-platform-main.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@performile.com","password":"your-password"}'
```

---

## 🚀 Quick Deploy Commands

After making changes:

```bash
# Commit changes
git add .
git commit -m "Fix: Add health check and increase timeouts"
git push

# Or force redeploy in Vercel
# Go to Deployments → Click ... → Redeploy
```

---

## 📊 Common Issues

### Issue: "JWT_SECRET not configured"
**Fix:** Add JWT_SECRET to Vercel environment variables

### Issue: "Database connection failed"
**Fix:** 
- Check DATABASE_URL is correct
- Verify Supabase project is active
- Check IP allowlist in Supabase (allow all: 0.0.0.0/0)

### Issue: "timeout of 10000ms exceeded"
**Fix:**
- Increase timeout in frontend (30s)
- Add connection pooling in backend
- Check database response time

### Issue: "Cold start taking too long"
**Fix:**
- Increase memory in vercel.json (1024MB)
- Use connection pooling
- Consider using Vercel Edge Functions

---

## ✅ Checklist

- [ ] Environment variables set in Vercel
- [ ] JWT_SECRET is 32+ characters
- [ ] DATABASE_URL is correct
- [ ] Supabase IP allowlist allows Vercel
- [ ] Created health check endpoint
- [ ] Tested health endpoint
- [ ] Increased frontend timeout to 30s
- [ ] Redeployed project
- [ ] Checked Vercel function logs
- [ ] Tested login from frontend

---

## 🎯 Expected Result

After fixes:
```
✅ Health check returns 200
✅ Login completes in < 5 seconds
✅ No timeout errors
✅ Tokens generated successfully
```

---

## 📞 Still Not Working?

1. **Check Vercel Logs** - Look for specific error messages
2. **Test Database** - Connect to Supabase directly
3. **Verify Secrets** - Make sure all env vars are set
4. **Check Region** - Ensure Vercel and Supabase are in same region
5. **Contact Support** - Share Vercel function logs

---

**Last Updated:** October 18, 2025
**Priority:** CRITICAL - Backend Not Responding
