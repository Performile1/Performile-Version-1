# 🔴 Database Connection Timeout Fix

## Problem Identified
```
Error: Connection terminated due to connection timeout
```

Vercel serverless functions can't connect to your Supabase database using the pooler connection string.

---

## 🔧 Solution: Update DATABASE_URL in Vercel

### Current (Not Working):
```
DATABASE_URL=postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres
```

This uses **Transaction Mode Pooler** (port 6543) which has connection limits that don't work well with serverless.

### Option 1: Use Direct Connection (Recommended)

**Change to port 5432:**
```
DATABASE_URL=postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17%21@aws-1-eu-north-1.pooler.supabase.com:5432/postgres
```

### Option 2: Use Session Mode Pooler

**Change to port 6543 with pgbouncer:**
```
DATABASE_URL=postgresql://postgres.ukeikwsmpofydmelrslq:M3nv4df4n17%21@aws-1-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Option 3: Use Supabase Direct Connection (Best for Serverless)

Get your direct connection string from Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project: **ukeikwsmpofydmelrslq**
3. Go to **Settings** → **Database**
4. Find **Connection string** → **Direct connection**
5. Copy the string (should look like):

```
postgresql://postgres:[YOUR-PASSWORD]@db.ukeikwsmpofydmelrslq.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with: `M3nv4df4n17!` (URL encode as `M3nv4df4n17%21`)

**Final string:**
```
DATABASE_URL=postgresql://postgres:M3nv4df4n17%21@db.ukeikwsmpofydmelrslq.supabase.co:5432/postgres
```

---

## 🚀 How to Update in Vercel

1. Go to https://vercel.com/dashboard
2. Select **performile-platform-main**
3. Go to **Settings** → **Environment Variables**
4. Find `DATABASE_URL`
5. Click **Edit**
6. Replace with new connection string (Option 3 recommended)
7. Click **Save**
8. Go to **Deployments** → Click **...** → **Redeploy**

---

## ✅ Verify Fix

### 1. Check Vercel Logs

After redeployment:
1. Go to **Deployments**
2. Click on latest deployment
3. Go to **Functions** tab
4. Click on `/api/auth`
5. Look for:
   ```
   [DB] New client connected to database ✅
   ```

### 2. Test Health Endpoint

```bash
curl https://performile-platform-main.vercel.app/api/health
```

Should return `200 OK`

### 3. Test Login

```bash
curl -X POST https://performile-platform-main.vercel.app/api/auth \
  -H "Content-Type: application/json" \
  -d '{"action":"login","email":"admin@performile.com","password":"Admin123!"}'
```

Should return tokens!

---

## 🔍 Understanding the Issue

### Why Pooler Connection Failed:

**Transaction Mode (port 6543):**
- Designed for connection pooling
- Has connection limits
- Doesn't work well with serverless (many concurrent connections)
- Vercel creates new connections for each request

**Direct Connection (port 5432):**
- Direct to database
- No pooling layer
- Works better with serverless
- Our code handles pooling (max: 1 connection)

### Supabase Connection Modes:

| Mode | Port | Use Case | Serverless? |
|------|------|----------|-------------|
| Direct | 5432 | Direct DB access | ✅ Best |
| Session Pooler | 6543 | Long-lived connections | ⚠️ Limited |
| Transaction Pooler | 6543 | Short transactions | ❌ Not recommended |

---

## 🛡️ Security Note

Your password contains special characters (`!`). Make sure it's URL-encoded:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

Your current encoding is correct: `M3nv4df4n17%21` ✅

---

## 📊 Code Changes Made

Updated `api/lib/db.ts`:
- ✅ Increased `connectionTimeoutMillis` to 20 seconds
- ✅ Added `keepAlive: true` for better connection stability
- ✅ Always use SSL (required for Supabase)
- ✅ Better error handling

---

## 🎯 Summary

**Root Cause:** Pooler connection string doesn't work with Vercel serverless

**Fix:** Use direct connection (port 5432)

**Steps:**
1. Get direct connection string from Supabase
2. Update DATABASE_URL in Vercel
3. Redeploy
4. Test login

**ETA:** 5 minutes
**Priority:** CRITICAL - Blocking all API calls

---

## 📞 Still Not Working?

### Check Supabase Settings:

1. **IP Allowlist:**
   - Go to Supabase → Settings → Database
   - Check "Connection Pooling" section
   - Ensure IP restrictions allow Vercel
   - Or disable IP restrictions (allow all: `0.0.0.0/0`)

2. **Database Status:**
   - Verify database is running
   - Check for any paused/suspended status
   - Ensure you're on correct project

3. **Password:**
   - Verify password is correct
   - Try resetting database password if needed
   - Update connection string with new password

---

**Last Updated:** October 18, 2025
**Status:** Code fixed, awaiting DATABASE_URL update in Vercel
