# Role-Based Settings Guide

## Overview

Performile implements **role-specific settings pages** to ensure proper data separation and provide tailored experiences for each user type. Each role has its own dedicated settings page with relevant sections.

**Last Updated:** October 12, 2025

---

## 🏢 Merchant Settings

**Access:** `/settings` (for merchants only)  
**File:** `MerchantSettings.tsx`

### Sections (12 tabs)

| # | Section | Icon | Description | Subscription |
|---|---------|------|-------------|--------------|
| 1 | **Shops** | 🏪 | Manage multiple shops and locations | Free: 1, Pro: 3, Enterprise: ∞ |
| 2 | **Couriers** | 🚚 | Select couriers for checkout | Free: 2, Starter: 5, Pro: 20, Enterprise: ∞ |
| 3 | **Tracking Page** | 📍 | Customize branded tracking page | All tiers |
| 4 | **Rating Settings** | ⭐ | Configure automated review requests | All tiers |
| 5 | **Email Templates** | 📧 | Customize email communications | All tiers |
| 6 | **Returns** | 📦 | Manage returns and RMAs | Professional+ |
| 7 | **Payments** | 💳 | Subscription and billing management | All tiers |
| 8 | **Notifications** | 🔔 | Email/SMS/Push preferences | All tiers |
| 9 | **API & Integrations** | 🔌 | API keys, webhooks, integrations | Professional+ |
| 10 | **General** | ⚙️ | Profile and business information | All tiers |
| 11 | **Security** | 🔒 | Password, 2FA, session management | All tiers |
| 12 | **Preferences** | 🌍 | Language, timezone, currency, theme | All tiers |

### Key Features
- **Multi-shop management** with subscription limits
- **Courier selection** with 44+ courier logos
- **Branded tracking page** with custom domain support
- **Automated review system** with customizable templates
- **Email template editor** with variables
- **Return management** (Professional+)
- **API access** (Professional+)

### Data Visibility
- **Own shops only** - Cannot see other merchants' shops
- **Selected couriers only** - Only see couriers they've chosen
- **Own orders only** - Cannot see other merchants' orders
- **Own analytics only** - Shop-specific performance data

---

## 🚚 Courier Settings

**Access:** `/courier-settings` (for couriers only)  
**File:** `CourierSettings.tsx`

### Sections (12 tabs)

| # | Section | Icon | Description | Subscription |
|---|---------|------|-------------|--------------|
| 1 | **Company Profile** | 🏢 | Courier company information | All tiers |
| 2 | **Fleet & Vehicles** | 🚛 | Manage vehicles and drivers | Fleet plan only |
| 3 | **Team Members** | 👥 | Manage delivery team | Free: 1, Individual: 1, Pro: 3, Fleet: ∞ |
| 4 | **Performance** | ⭐ | View TrustScore and metrics | All tiers |
| 5 | **Lead Marketplace** | 📈 | Browse and purchase leads | All tiers |
| 6 | **Analytics** | 📊 | Detailed performance analytics | Professional+ |
| 7 | **Payments** | 💳 | Subscription and earnings | All tiers |
| 8 | **Notifications** | 🔔 | Delivery and order notifications | All tiers |
| 9 | **API & Integrations** | 🔌 | API access for fleet management | Fleet plan only |
| 10 | **General** | ⚙️ | Company profile and contact info | All tiers |
| 11 | **Security** | 🔒 | Account security settings | All tiers |
| 12 | **Preferences** | 🌍 | Language, timezone, currency | All tiers |

### Key Features
- **Company profile** with logo, description, service areas
- **Fleet management** (Fleet plan) - vehicles, drivers, routes
- **Team member management** with role-based permissions
- **Performance dashboard** - TrustScore, ratings, delivery stats
- **Lead marketplace** - Browse and purchase merchant leads
- **Advanced analytics** (Professional+) - detailed insights
- **API access** (Fleet plan) - integrate with fleet management systems

### Data Visibility
- **Own deliveries only** - Cannot see other couriers' deliveries
- **Own performance only** - TrustScore and ratings for own company
- **Available leads** - Can see leads in their service areas
- **Own team only** - Cannot see other couriers' team members

---

## 👤 Consumer Settings

**Access:** `/consumer-settings` (for consumers only)  
**File:** `ConsumerSettings.tsx`

### Sections (9 tabs)

| # | Section | Icon | Description |
|---|---------|------|-------------|
| 1 | **Profile** | 👤 | Personal information and photo |
| 2 | **Addresses** | 📍 | Saved delivery addresses |
| 3 | **Payment Methods** | 💳 | Saved credit cards and payment info |
| 4 | **Order Preferences** | 🛍️ | Default delivery preferences |
| 5 | **Favorites** | ❤️ | Favorite shops and couriers |
| 6 | **Notifications** | 🔔 | Order and delivery notifications |
| 7 | **Security** | 🔒 | Password and account security |
| 8 | **Privacy** | 🔐 | Data sharing and privacy settings |
| 9 | **Preferences** | 🌍 | Language, timezone, theme |

### Key Features
- **Profile management** - name, email, phone, photo
- **Address book** - multiple delivery addresses with labels
- **Payment methods** - saved cards, default payment
- **Order preferences** - preferred delivery times, special instructions
- **Favorites** - save favorite shops and couriers
- **Notification preferences** - order updates, delivery alerts
- **Privacy controls** - data sharing, marketing preferences

### Data Visibility
- **Own orders only** - Cannot see other consumers' orders
- **Own addresses only** - Private address book
- **Own payment methods only** - Secure payment information
- **Own reviews only** - Reviews they've submitted

---

## 👨‍💼 Admin Settings

**Access:** `/admin-settings` (for admins only)  
**File:** `AdminSettings.tsx`

### Sections (12 tabs)

| # | Section | Icon | Description |
|---|---------|------|-------------|
| 1 | **Platform Overview** | 📊 | System health, stats, metrics |
| 2 | **User Management** | 👥 | Manage all users across roles |
| 3 | **Merchant Management** | 🏪 | Manage merchants, shops, subscriptions |
| 4 | **Courier Management** | 🚚 | Manage couriers, verify companies |
| 5 | **Subscriptions & Billing** | 💰 | Manage plans, pricing, billing |
| 6 | **Platform Analytics** | 📈 | System-wide analytics and reports |
| 7 | **Email System** | 📧 | Email templates, delivery, logs |
| 8 | **Notifications** | 🔔 | System notifications and alerts |
| 9 | **Security & Access** | 🔒 | Access control, permissions, audit logs |
| 10 | **Database** | 💾 | Database management, backups, migrations |
| 11 | **System Settings** | ⚙️ | Platform configuration, feature flags |
| 12 | **Logs & Monitoring** | 🐛 | Error logs, performance monitoring |

### Key Features
- **Platform dashboard** - real-time system health
- **User management** - CRUD operations for all users
- **Merchant oversight** - manage shops, subscriptions, disputes
- **Courier verification** - approve/reject courier applications
- **Subscription management** - create plans, set pricing, manage billing
- **System analytics** - revenue, growth, user engagement
- **Email system** - manage templates, view delivery logs
- **Security controls** - access logs, permission management
- **Database tools** - backups, migrations, query logs
- **System configuration** - feature flags, API limits, maintenance mode

### Data Visibility
- **Full platform access** - Can see all data across all roles
- **User data** - All users, merchants, couriers, consumers
- **Financial data** - All subscriptions, payments, revenue
- **System data** - Logs, errors, performance metrics
- **Audit trails** - All actions taken by all users

---

## Data Separation Matrix

| Data Type | Merchant | Courier | Consumer | Admin |
|-----------|----------|---------|----------|-------|
| **Own Profile** | ✅ | ✅ | ✅ | ✅ |
| **Other Profiles** | ❌ | ❌ | ❌ | ✅ |
| **Own Orders** | ✅ | ✅ | ✅ | ✅ |
| **All Orders** | ❌ | ❌ | ❌ | ✅ |
| **Own Shops** | ✅ | ❌ | ❌ | ✅ |
| **All Shops** | ❌ | ❌ | ❌ | ✅ |
| **Selected Couriers** | ✅ | ❌ | ❌ | ✅ |
| **All Couriers** | ❌ | ❌ | ✅ (browse) | ✅ |
| **Own Performance** | ✅ | ✅ | ❌ | ✅ |
| **All Performance** | ❌ | ❌ | ❌ | ✅ |
| **Own Analytics** | ✅ | ✅ | ❌ | ✅ |
| **Platform Analytics** | ❌ | ❌ | ❌ | ✅ |
| **Subscription Info** | ✅ (own) | ✅ (own) | ❌ | ✅ (all) |
| **Payment Methods** | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (all) |
| **System Logs** | ❌ | ❌ | ❌ | ✅ |
| **Database Access** | ❌ | ❌ | ❌ | ✅ |

---

## Role-Based Routing

### Implementation

```typescript
// App.tsx or routes.tsx
import { useAuthStore } from '@/store/authStore';
import MerchantSettings from '@/pages/MerchantSettings';
import CourierSettings from '@/pages/CourierSettings';
import ConsumerSettings from '@/pages/ConsumerSettings';
import AdminSettings from '@/pages/AdminSettings';

function SettingsRouter() {
  const { user } = useAuthStore();
  
  switch (user?.user_role) {
    case 'merchant':
      return <MerchantSettings />;
    case 'courier':
      return <CourierSettings />;
    case 'consumer':
      return <ConsumerSettings />;
    case 'admin':
      return <AdminSettings />;
    default:
      return <Navigate to="/login" />;
  }
}

// In your routes
<Route path="/settings" element={<SettingsRouter />} />
```

### URL Structure

- **Merchants:** `/settings` → `MerchantSettings`
- **Couriers:** `/settings` → `CourierSettings`
- **Consumers:** `/settings` → `ConsumerSettings`
- **Admins:** `/settings` → `AdminSettings`

Same URL, different content based on role!

### Deep Linking

All roles support hash-based navigation:

```
/settings#shops          (Merchant)
/settings#fleet          (Courier)
/settings#addresses      (Consumer)
/settings#users          (Admin)
```

---

## Access Control

### Backend API Protection

```typescript
// Example: Merchant-only endpoint
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req.headers.authorization);
  
  if (!user || user.role !== 'merchant') {
    return res.status(403).json({ error: 'Merchants only' });
  }
  
  // Proceed with merchant-specific logic
}
```

### Frontend Component Protection

```typescript
// Example: Role-based component rendering
{user?.user_role === 'merchant' && (
  <MerchantOnlyFeature />
)}

{user?.user_role === 'admin' && (
  <AdminOnlyFeature />
)}
```

### Subscription-Based Access

```typescript
// Example: Feature gating by subscription tier
<SubscriptionGate
  subscriptionInfo={subscriptionInfo}
  requiredTier="professional"
  featureName="Advanced Analytics"
>
  <AdvancedAnalytics />
</SubscriptionGate>
```

---

## Security Best Practices

### 1. **Server-Side Validation**
- Always validate user role on the backend
- Never trust client-side role checks alone
- Verify user owns the data they're accessing

### 2. **Data Filtering**
- Filter queries by user_id or merchant_id
- Use database Row Level Security (RLS)
- Never expose data from other users

### 3. **API Endpoints**
- Separate endpoints per role when needed
- Use role-based middleware
- Log all access attempts

### 4. **Frontend Protection**
- Hide UI elements for unauthorized features
- Show upgrade prompts for subscription limits
- Gracefully handle permission errors

---

## Testing Checklist

### Per Role Testing

- [ ] **Merchant**
  - [ ] Can only see own shops
  - [ ] Can only see selected couriers
  - [ ] Can only see own orders
  - [ ] Subscription limits enforced
  - [ ] Cannot access admin features

- [ ] **Courier**
  - [ ] Can only see own deliveries
  - [ ] Can only see own team members
  - [ ] Can only see own performance data
  - [ ] Cannot see other couriers' data
  - [ ] Cannot access admin features

- [ ] **Consumer**
  - [ ] Can only see own orders
  - [ ] Can only see own addresses
  - [ ] Can only see own payment methods
  - [ ] Cannot see merchant/courier data
  - [ ] Cannot access admin features

- [ ] **Admin**
  - [ ] Can see all data across all roles
  - [ ] Can manage users, merchants, couriers
  - [ ] Can access system settings
  - [ ] Can view logs and analytics
  - [ ] Cannot be restricted by subscription limits

---

## Migration Guide

### From Single Settings Page

If you currently have a single `Settings.tsx` file:

1. **Backup existing settings:**
   ```bash
   cp Settings.tsx Settings.backup.tsx
   ```

2. **Create role-specific pages:**
   - `MerchantSettings.tsx`
   - `CourierSettings.tsx`
   - `ConsumerSettings.tsx`
   - `AdminSettings.tsx`

3. **Update routing:**
   ```typescript
   <Route path="/settings" element={<SettingsRouter />} />
   ```

4. **Migrate existing components:**
   - Move merchant-specific components to `/components/settings/merchant/`
   - Move courier-specific components to `/components/settings/courier/`
   - Move consumer-specific components to `/components/settings/consumer/`
   - Move admin-specific components to `/components/settings/admin/`

5. **Test thoroughly:**
   - Test with each role
   - Verify data separation
   - Check subscription limits
   - Test deep linking

---

## Future Enhancements

### Planned Features

1. **Role Switching** (for admins)
   - View platform as merchant/courier/consumer
   - Test features without separate accounts

2. **Audit Logging**
   - Track all settings changes
   - Who changed what and when
   - Rollback capability

3. **Settings Import/Export**
   - Export settings as JSON
   - Import settings from file
   - Clone settings to new account

4. **Settings Templates**
   - Pre-configured settings for common use cases
   - Industry-specific templates
   - Best practice recommendations

5. **Settings Search**
   - Search across all settings
   - Quick navigation to specific settings
   - Keyboard shortcuts

---

## Support

### Common Issues

**Q: User sees wrong settings page**  
A: Check user role in database, verify JWT token contains correct role

**Q: Settings not saving**  
A: Check API endpoint permissions, verify user has access to update

**Q: Subscription limits not enforced**  
A: Verify subscription info is being fetched, check database triggers

**Q: Deep linking not working**  
A: Ensure hash navigation is implemented in useEffect

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Maintained by:** Performile Development Team
