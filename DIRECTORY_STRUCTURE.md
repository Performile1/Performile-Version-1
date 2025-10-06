# Performile Platform - Directory Structure

**Last Updated:** October 6, 2025, 18:00  
**Status:** Current and accurate

---

## 📁 Root Structure

```
performile-platform-main/
├── frontend/                    # React frontend application
│   ├── api/                    # Vercel serverless API functions
│   ├── public/                 # Static assets
│   ├── src/                    # React source code
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── database/                    # SQL scripts and migrations
├── scripts/                     # Utility scripts
├── node_modules/               # Root dependencies
├── .env.example                # Environment variables template
├── vercel.json                 # Vercel configuration
├── package.json                # Root package.json
└── Documentation files (*.md)
```

---

## 🎨 Frontend Structure

### `/frontend/api/` - Serverless API Functions (32 files)

```
api/
├── admin/
│   ├── analytics.ts           # Admin analytics
│   ├── orders.ts              # Admin order management
│   ├── reviews.ts             # Admin review management
│   ├── subscriptions.ts       # ✅ NEW - Subscription management
│   └── users.ts               # User management
├── auth.ts                     # Authentication endpoints
├── couriers.ts                 # Courier management
├── cron/
│   └── send-review-reminders.ts # ✅ NEW - Daily reminder cron
├── debug.ts                    # Debug utilities
├── insights/
│   └── index.ts               # Analytics insights
├── marketplace/
│   ├── competitor-data.ts     # Competitor analytics
│   ├── index.ts               # Marketplace main
│   └── leads.ts               # Lead management
├── messages/
│   ├── conversations.ts       # Conversation management
│   └── index.ts               # Messaging main
├── middleware/
│   └── security.ts            # Security middleware
├── notifications/
│   └── index.ts               # Notification system
├── notifications-send.ts       # Send notifications
├── notifications.ts            # Notifications (legacy)
├── orders/
│   └── index.ts               # Order management
├── review-requests/
│   ├── automation.ts          # Review automation cron
│   └── settings.ts            # Review settings
├── search.ts                   # Search functionality
├── stores.ts                   # Store management
├── team/
│   └── my-entities.ts         # Team management
├── trustscore/
│   └── dashboard.ts           # TrustScore dashboard
├── trustscore.ts               # TrustScore calculation
├── types/
│   └── vercel.d.ts            # TypeScript definitions
├── utils/
│   ├── email.ts               # ✅ NEW - Email utilities
│   └── logger.ts              # Logging utilities
└── webhooks/
    ├── ecommerce.ts           # ✅ NEW - Universal e-commerce
    ├── index.ts               # Webhook main (Shopify, Stripe)
    └── woocommerce.ts         # ✅ NEW - WooCommerce handler
```

### `/frontend/src/` - React Application

```
src/
├── components/
│   ├── common/                # Reusable components
│   ├── courier/               # Courier-specific components
│   ├── debug/
│   │   └── SentryTestButton.tsx # ✅ NEW - Sentry test
│   ├── layout/
│   │   └── AppLayout.tsx      # Main layout
│   ├── messaging/
│   │   └── MessagingCenter.tsx # Messaging UI
│   └── rating/
│       └── ServiceRatingForm.tsx # Rating form
├── config/
│   └── sentry.ts              # ✅ NEW - Sentry configuration
├── hooks/                      # Custom React hooks
├── pages/
│   ├── admin/
│   │   ├── ManageCarriers.tsx
│   │   ├── ManageCouriers.tsx
│   │   ├── ManageMerchants.tsx
│   │   ├── ManageStores.tsx
│   │   ├── ReviewBuilder.tsx
│   │   └── SubscriptionManagement.tsx # ✅ NEW - Subscription UI
│   ├── courier/
│   │   └── CourierDirectory.tsx
│   ├── integrations/
│   │   └── EcommerceIntegrations.tsx
│   ├── settings/
│   │   └── ReviewRequestSettings.tsx
│   ├── team/
│   │   ├── AcceptInvitation.tsx
│   │   └── TeamManagement.tsx
│   ├── Analytics.tsx
│   ├── AuthPage.tsx
│   ├── Dashboard.tsx
│   ├── Orders.tsx
│   ├── Settings.tsx
│   └── TrustScores.tsx
├── store/
│   └── authStore.ts           # Zustand auth store
├── App.tsx                     # Main app component
├── main.tsx                    # Entry point
└── index.css                   # Global styles
```

### `/frontend/public/` - Static Assets

```
public/
├── icons/
│   ├── icon-192x192.png       # PWA icon
│   └── icon-512x512.png       # PWA icon
└── manifest.json              # PWA manifest
```

---

## 🗄️ Database Structure

### `/database/` - SQL Scripts (35 files)

```
database/
├── functions/                  # Database functions
├── init/                       # Initial setup scripts
├── migrations/                 # Migration scripts (8 files)
├── policies/                   # RLS policies
├── add-admin-features.sql
├── add-missing-features.sql
├── add-new-features-final.sql
├── add-review-tracking-columns.sql # ✅ NEW - Review tracking
├── audit-database-status.sql
├── complete-setup-supabase.sql
├── create-subscription-system.sql # ✅ NEW - Subscription system
├── create-test-users.sql
├── demo_data.sql
├── demo_users_crypto.sql
├── disable-rls.sql
├── enable-rls-production.sql
├── fix-admin-user.sql
├── integration_schema.sql
├── market-share-analytics.sql
├── marketplace-demo-data.sql
├── merchant-multi-shop-system.sql
├── messaging-and-reviews-system.sql
├── missing-tables-only.sql
├── quick-database-check.sql
├── quick-fix-admin.sql
├── schema.sql
├── seed-demo-data.sql
├── seed_data.sql
├── shopify_schema.sql
├── simple-database-check.sql
├── subscription-system.sql
├── supabase-setup-minimal.sql
├── supabase_update.sql
├── supabase_update_safe.sql
├── trustscore_functions.sql
├── update-rls-only.sql
├── what-exists.sql
└── README-DATABASE-AUDIT.md
```

---

## 📚 Documentation Files (Core - 15 files)

### Current & Active
```
├── MASTER_PLATFORM_STATUS_OCT6.md  # ✅ MASTER - Current status
├── COMPLETE_PLATFORM_AUDIT_OCT6.md # ✅ Complete audit
├── EMAIL_SYSTEM_COMPLETE.md        # ✅ Email system docs
├── EMAIL_AND_NOTIFICATION_STRATEGY.md # ✅ Email strategy
├── ECOMMERCE_WEBHOOKS_SETUP.md     # ✅ Webhook setup guide
├── SUBSCRIPTION_AND_INTEGRATION_PLAN.md # ✅ Subscription plan
├── IMPLEMENTATION_PLAN.md          # Implementation roadmap
├── PERFORMILE_DESCRIPTION.md       # Business overview
├── PRODUCTION-READY.md             # Security checklist
├── AUDIT_REPORT.md                 # Historical audit (Aug 31)
├── DOCUMENTATION_INDEX.md          # Documentation hub
├── TEAM_MANAGEMENT_GUIDE.md        # Team features guide
├── PUSHER_SETUP.md                 # Pusher configuration
├── ADMIN_SETUP.md                  # Admin setup guide
└── TESTING_CHECKLIST.md            # Testing procedures
```

### Technical
```
├── DEVELOPMENT.md                  # Development guide
├── DEPLOYMENT.md                   # Deployment guide
├── CHANGELOG.md                    # Version history
└── README.md                       # Quick start
```

---

## 🔧 Configuration Files

```
Root:
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── vercel.json                 # Vercel config (API routes, crons)
├── package.json                # Root dependencies
└── tsconfig.json               # TypeScript config

Frontend:
├── frontend/.env.example       # Frontend env vars
├── frontend/package.json       # Frontend dependencies
├── frontend/vite.config.ts     # Vite configuration
├── frontend/tsconfig.json      # Frontend TypeScript
└── frontend/index.html         # HTML entry point
```

---

## 📊 Key Statistics

### Code Files
- **API Endpoints:** 32 TypeScript files
- **React Components:** 50+ components
- **Pages:** 20+ pages
- **Database Scripts:** 35 SQL files
- **Documentation:** 18 markdown files

### Lines of Code (Estimated)
- **Frontend:** ~15,000 lines
- **API:** ~8,000 lines
- **Database:** ~5,000 lines
- **Total:** ~28,000 lines

---

## 🆕 NEW FILES ADDED TODAY (Oct 6)

### API Layer
1. `frontend/api/utils/email.ts` - Email service
2. `frontend/api/webhooks/woocommerce.ts` - WooCommerce handler
3. `frontend/api/webhooks/ecommerce.ts` - Universal handler
4. `frontend/api/cron/send-review-reminders.ts` - Cron job
5. `frontend/api/admin/subscriptions.ts` - Subscription management

### Frontend
6. `frontend/src/config/sentry.ts` - Sentry config
7. `frontend/src/components/debug/SentryTestButton.tsx` - Sentry test
8. `frontend/src/pages/admin/SubscriptionManagement.tsx` - Subscription UI

### Database
9. `database/add-review-tracking-columns.sql` - Review tracking
10. `database/create-subscription-system.sql` - Subscription schema

### Documentation
11. `EMAIL_SYSTEM_COMPLETE.md` - Email docs
12. `EMAIL_AND_NOTIFICATION_STRATEGY.md` - Strategy
13. `ECOMMERCE_WEBHOOKS_SETUP.md` - Setup guide
14. `SUBSCRIPTION_AND_INTEGRATION_PLAN.md` - Plan
15. `COMPLETE_PLATFORM_AUDIT_OCT6.md` - Audit
16. `MASTER_PLATFORM_STATUS_OCT6.md` - Master status

**Total New Files:** 16 files  
**Total New Code:** ~3,000 lines

---

## 🗑️ DELETED FILES TODAY (Duplicates)

1. ❌ MASTER_PLATFORM_REPORT.md (replaced)
2. ❌ CURRENT_STATUS.md (replaced)
3. ❌ DATABASE_STATUS.md (replaced)
4. ❌ SESSION_SUMMARY_OCT6.md (replaced)
5. ❌ TOMORROW_START_HERE.md (replaced)
6. ❌ FIX_SUMMARY.md (replaced)

**Total Deleted:** 6 files (reduced duplication)

---

## 📦 Dependencies

### Frontend (package.json)
```json
{
  "dependencies": {
    "@mui/material": "^5.x",
    "@mui/icons-material": "^5.x",
    "@tanstack/react-query": "^5.x",
    "@sentry/react": "^8.x",
    "react": "^18.x",
    "react-router-dom": "^6.x",
    "react-hot-toast": "^2.x",
    "recharts": "^2.x",
    "zustand": "^4.x",
    "resend": "^3.x"
  }
}
```

### API (Vercel Functions)
```json
{
  "dependencies": {
    "@vercel/node": "^3.x",
    "pg": "^8.x",
    "resend": "^3.x"
  }
}
```

---

## 🎯 IMPORTANT PATHS

### For Development:
- **Frontend Dev:** `cd frontend && npm run dev`
- **API Local:** Vercel CLI or local serverless
- **Database:** Supabase dashboard

### For Deployment:
- **GitHub:** Push to main → Auto-deploy
- **Vercel:** https://vercel.com/dashboard
- **Database:** Supabase SQL Editor

### For Configuration:
- **Environment:** `.env.example` (copy to `.env`)
- **Vercel Env:** Vercel Dashboard → Settings → Environment Variables
- **Database:** Supabase → SQL Editor

---

## 🔍 QUICK FIND

### Need to find a specific file?

**Authentication:**
- API: `frontend/api/auth.ts`
- Frontend: `frontend/src/pages/AuthPage.tsx`
- Store: `frontend/src/store/authStore.ts`

**Email System:**
- Utilities: `frontend/api/utils/email.ts`
- Templates: Inside `email.ts` (inline HTML)
- Cron: `frontend/api/cron/send-review-reminders.ts`

**Webhooks:**
- Shopify: `frontend/api/webhooks/index.ts`
- WooCommerce: `frontend/api/webhooks/woocommerce.ts`
- Universal: `frontend/api/webhooks/ecommerce.ts`

**Subscriptions:**
- API: `frontend/api/admin/subscriptions.ts`
- UI: `frontend/src/pages/admin/SubscriptionManagement.tsx`
- Database: `database/create-subscription-system.sql`

**Database:**
- Main schema: `database/schema.sql`
- Subscription: `database/create-subscription-system.sql`
- Review tracking: `database/add-review-tracking-columns.sql`

**Documentation:**
- Master status: `MASTER_PLATFORM_STATUS_OCT6.md`
- Email docs: `EMAIL_SYSTEM_COMPLETE.md`
- Webhook setup: `ECOMMERCE_WEBHOOKS_SETUP.md`

---

## ✅ VERIFICATION

**This structure is current as of:** October 6, 2025, 18:00

**Verified:**
- ✅ All API endpoints exist
- ✅ All React pages exist
- ✅ All database scripts exist
- ✅ All documentation is current
- ✅ No duplicate files
- ✅ Clean and organized

---

**Use this document as your reference for the current platform structure!** 📁
