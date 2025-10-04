# 🔒 Production Security Implementation Plan

## ✅ Completed Steps

### Step 1: HttpOnly Cookies ✓
- [x] Auth API sets httpOnly cookies
- [x] apiClient reads from cookies
- [x] Secure flag for production
- [x] SameSite=Strict protection

**Commit:** `41568b1`

---

## 🚧 Next Steps (In Order)

### Step 2: Remove Fallback Secrets & Add Validation
**Priority:** 🔴 CRITICAL

Files to update:
- [ ] `frontend/api/auth.ts`
- [ ] `frontend/api/admin/analytics.ts`  
- [ ] `frontend/api/admin/users.ts`
- [ ] `frontend/api/admin/reviews.ts`
- [ ] `frontend/api/marketplace/leads.ts`
- [ ] `frontend/api/marketplace/competitor-data.ts`
- [ ] `frontend/api/trustscore/dashboard.ts`

**Action:** Replace all instances of:
```typescript
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
```

With:
```typescript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('CRITICAL: JWT_SECRET not configured');
  return res.status(500).json({ message: 'Server configuration error' });
}
```

---

### Step 3: Remove Debug Endpoints
**Priority:** 🔴 CRITICAL

Delete files:
- [ ] `frontend/api/debug/token.ts`
- [ ] Any other debug endpoints

---

### Step 4: Remove Console.log Statements
**Priority:** 🟡 HIGH

Search and remove from:
- [ ] `frontend/src/pages/Analytics.tsx`
- [ ] `frontend/api/admin/analytics.ts`
- [ ] All other API files

Replace with proper logging (if needed):
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info');
}
```

---

### Step 5: Update Auth Store (Remove Token Persistence)
**Priority:** 🟡 HIGH

File: `frontend/src/store/authStore.ts`

Change line 168:
```typescript
// FROM:
tokens: state.tokens,

// TO:
// tokens: state.tokens, // Tokens now in httpOnly cookies
```

---

### Step 6: Add Rate Limiting
**Priority:** 🟡 MEDIUM

Create: `frontend/middleware/rateLimit.ts`
```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';

const requests = new Map<string, number[]>();

export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: VercelRequest, res: VercelResponse, next: () => void) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    const requestTimes = requests.get(ip as string) || [];
    const recentRequests = requestTimes.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ message: 'Too many requests' });
    }
    
    recentRequests.push(now);
    requests.set(ip as string, recentRequests);
    next();
  };
}
```

---

### Step 7: Enable Row Level Security (RLS)
**Priority:** 🟡 HIGH

Create: `database/enable-rls-production.sql`
```sql
-- Enable RLS on all tables
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE Stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE Couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE LeadsMarketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE LeadDownloads ENABLE ROW LEVEL SECURITY;

-- Create policies (example for Users table)
CREATE POLICY users_select_own ON Users
  FOR SELECT USING (user_id = current_setting('app.user_id')::UUID);

CREATE POLICY users_update_own ON Users
  FOR UPDATE USING (user_id = current_setting('app.user_id')::UUID);
```

---

### Step 8: Configure CORS & Security Headers
**Priority:** 🟡 HIGH

Update: `vercel.json`
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://yourdomain.com"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

---

### Step 9: Input Validation & Sanitization
**Priority:** 🟡 MEDIUM

Install: `npm install validator express-validator`

Create: `frontend/utils/validation.ts`
```typescript
import validator from 'validator';

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email);
};

export const sanitizeInput = (input: string): string => {
  return validator.escape(input);
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 12) errors.push('Password must be at least 12 characters');
  if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Must contain number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Must contain special character');
  
  return { valid: errors.length === 0, errors };
};
```

---

### Step 10: Environment Variables Validation
**Priority:** 🔴 CRITICAL

Create: `frontend/utils/env.ts`
```typescript
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV'
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
}
```

---

## 📋 Final Checklist Before Production

- [ ] All fallback secrets removed
- [ ] Debug endpoints deleted
- [ ] Console.log statements removed
- [ ] HttpOnly cookies implemented
- [ ] Rate limiting added
- [ ] RLS enabled
- [ ] CORS configured
- [ ] Input validation added
- [ ] Environment variables validated
- [ ] Security headers set
- [ ] npm audit clean
- [ ] Penetration testing done
- [ ] SSL/HTTPS verified
- [ ] Backup system configured
- [ ] Monitoring/logging set up

---

## 🚀 Deployment Steps

1. **Pre-deployment:**
   ```bash
   npm audit fix
   npm run build
   npm run test
   ```

2. **Set environment variables in Vercel:**
   - JWT_SECRET (min 32 chars)
   - JWT_REFRESH_SECRET (different from JWT_SECRET)
   - DATABASE_URL (production)
   - NODE_ENV=production

3. **Database migration:**
   ```bash
   # Run in production database
   psql $DATABASE_URL < database/enable-rls-production.sql
   ```

4. **Deploy:**
   ```bash
   git push origin main
   vercel --prod
   ```

5. **Post-deployment verification:**
   - [ ] Test login/logout
   - [ ] Verify cookies are httpOnly
   - [ ] Check security headers
   - [ ] Test rate limiting
   - [ ] Verify RLS policies

---

## 📊 Current Status

**Overall Progress:** 10% Complete

✅ Step 1: HttpOnly Cookies  
⬜ Step 2: Remove Fallback Secrets  
⬜ Step 3: Remove Debug Endpoints  
⬜ Step 4: Remove Console.log  
⬜ Step 5: Update Auth Store  
⬜ Step 6: Add Rate Limiting  
⬜ Step 7: Enable RLS  
⬜ Step 8: Configure CORS  
⬜ Step 9: Input Validation  
⬜ Step 10: Env Validation  

**Status:** 🔴 NOT PRODUCTION READY

When all steps complete: 🟢 PRODUCTION READY
