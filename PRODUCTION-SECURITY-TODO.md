# 🔒 PRODUCTION SECURITY CHECKLIST

## ⚠️ CRITICAL - DO BEFORE PRODUCTION DEPLOYMENT

### 1. **Authentication & Tokens**

#### ❌ REMOVE: Insecure Token Storage
**File:** `frontend/src/store/authStore.ts` (Line 168)
```typescript
// CURRENT (INSECURE):
tokens: state.tokens, // Store tokens for API calls

// CHANGE TO (SECURE):
// tokens: state.tokens, // DO NOT store in localStorage - use httpOnly cookies
```

#### ✅ IMPLEMENT: HttpOnly Cookies
- [ ] Move JWT tokens to httpOnly cookies (prevents XSS attacks)
- [ ] Update auth API to set cookies instead of returning tokens
- [ ] Remove token storage from localStorage
- [ ] Update apiClient to use cookies automatically

**Implementation:**
```typescript
// In auth API:
res.setHeader('Set-Cookie', [
  `accessToken=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
  `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`
]);
```

---

### 2. **Environment Variables**

#### ❌ REMOVE: Fallback Secrets
**Files to update:**
- `frontend/api/auth.ts`
- `frontend/api/admin/analytics.ts`
- `frontend/api/admin/users.ts`
- `frontend/api/admin/reviews.ts`
- All other API files

```typescript
// CURRENT (INSECURE):
const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

// CHANGE TO (SECURE):
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

#### ✅ VERIFY: All Environment Variables Set
- [ ] `JWT_SECRET` - Strong random string (min 32 chars)
- [ ] `JWT_REFRESH_SECRET` - Different from JWT_SECRET
- [ ] `DATABASE_URL` - Production database connection
- [ ] `NODE_ENV=production`

---

### 3. **Database Security**

#### ❌ REMOVE: Debug/Test Data
- [ ] Delete all demo/test users
- [ ] Remove seed data scripts from production
- [ ] Delete debug endpoints (`/api/debug/*`)

**Run in production database:**
```sql
-- Remove test users
DELETE FROM Users WHERE email IN (
  'admin@performile.com',
  'merchant@performile.com', 
  'courier@performile.com'
);

-- Remove demo data
DELETE FROM LeadDownloads;
DELETE FROM LeadsMarketplace WHERE merchant_id IN (SELECT user_id FROM Users WHERE email LIKE '%@performile.com');
```

#### ✅ ENABLE: Row Level Security (RLS)
- [ ] Enable RLS on all tables
- [ ] Create proper RLS policies
- [ ] Remove `disable-rls.sql` from production

**Run:**
```sql
-- Enable RLS on all tables
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE Reviews ENABLE ROW LEVEL SECURITY;
-- ... (all tables)
```

---

### 4. **API Security**

#### ❌ REMOVE: Debug Endpoints
Delete these files:
- [ ] `frontend/api/debug/token.ts`
- [ ] Any other debug endpoints

#### ✅ ADD: Rate Limiting
```typescript
// Add to all API endpoints
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

#### ✅ ADD: Input Validation
- [ ] Validate all user inputs
- [ ] Sanitize SQL inputs (prevent SQL injection)
- [ ] Validate file uploads
- [ ] Check request size limits

---

### 5. **CORS & Headers**

#### ✅ CONFIGURE: Strict CORS
```typescript
// In vercel.json or API config
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://yourdomain.com" },
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
      ]
    }
  ]
}
```

---

### 6. **Password & Authentication**

#### ✅ VERIFY: Strong Password Requirements
- [ ] Minimum 12 characters (currently 8)
- [ ] Require uppercase, lowercase, numbers, special chars
- [ ] Implement password strength meter
- [ ] Add password breach checking (HaveIBeenPwned API)

#### ✅ ADD: Multi-Factor Authentication (MFA)
- [ ] Implement TOTP (Google Authenticator)
- [ ] SMS backup codes
- [ ] Recovery codes

---

### 7. **Logging & Monitoring**

#### ❌ REMOVE: Console.log in Production
Search and remove all:
```typescript
console.log('Admin analytics response:', response.data);
console.log('Analytics Data:', analyticsData);
// etc.
```

#### ✅ ADD: Proper Logging
- [ ] Use structured logging (Winston, Pino)
- [ ] Log to external service (Datadog, Sentry)
- [ ] Never log sensitive data (passwords, tokens, PII)
- [ ] Set up error monitoring

---

### 8. **Data Privacy (GDPR Compliance)**

#### ✅ IMPLEMENT:
- [ ] Cookie consent banner
- [ ] Privacy policy page
- [ ] Terms of service
- [ ] Data export functionality (user can download their data)
- [ ] Data deletion functionality (right to be forgotten)
- [ ] Anonymize analytics data

---

### 9. **SSL/TLS**

#### ✅ VERIFY:
- [ ] HTTPS enabled on all domains
- [ ] Valid SSL certificate
- [ ] Redirect HTTP to HTTPS
- [ ] HSTS header enabled
- [ ] TLS 1.2 minimum

---

### 10. **File Uploads (If Applicable)**

#### ✅ SECURE:
- [ ] Validate file types
- [ ] Scan for malware
- [ ] Limit file sizes
- [ ] Store in separate bucket (not web root)
- [ ] Generate random filenames
- [ ] Set proper content-type headers

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### Code Review
- [ ] Remove all TODO comments
- [ ] Remove all console.log statements
- [ ] Remove debug code
- [ ] Remove test/demo data
- [ ] Update all placeholder text

### Security Scan
- [ ] Run `npm audit` and fix all vulnerabilities
- [ ] Run security scanner (Snyk, SonarQube)
- [ ] Check for exposed secrets (git-secrets)
- [ ] Verify no API keys in code

### Testing
- [ ] Test all authentication flows
- [ ] Test authorization (role-based access)
- [ ] Test rate limiting
- [ ] Penetration testing
- [ ] Load testing

### Documentation
- [ ] Update README with production setup
- [ ] Document all environment variables
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures

---

## 🚨 IMMEDIATE ACTIONS (Before Going Live)

1. **Change all default passwords**
2. **Rotate all API keys and secrets**
3. **Enable RLS on database**
4. **Switch to httpOnly cookies**
5. **Remove debug endpoints**
6. **Enable rate limiting**
7. **Set up monitoring and alerts**
8. **Configure backups**
9. **Set up SSL/HTTPS**
10. **Review and test all security measures**

---

## 📞 Security Incident Response Plan

### If Security Breach Detected:
1. **Immediately** rotate all secrets and API keys
2. **Invalidate** all active sessions/tokens
3. **Notify** affected users
4. **Document** the incident
5. **Fix** the vulnerability
6. **Review** logs for extent of breach
7. **Report** to authorities if required (GDPR)

---

## 🔗 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [GDPR Compliance](https://gdpr.eu/)
- [Vercel Security](https://vercel.com/docs/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

## ⏰ REMINDER

**DO NOT DEPLOY TO PRODUCTION UNTIL ALL ITEMS ARE COMPLETED!**

Current Status: 🔴 **NOT PRODUCTION READY**
- Tokens stored in localStorage (XSS vulnerable)
- Debug endpoints exposed
- Fallback secrets in code
- Demo data in database
- RLS disabled

**When ready, update status to:** 🟢 **PRODUCTION READY**
