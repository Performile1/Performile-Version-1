# Future Development Roadmap

**Date:** October 29, 2025  
**Version:** 1.0  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.25  
**Status:** 📋 PLANNING PHASE

---

## 🎯 OVERVIEW

This document outlines the future development roadmap for the Performile Platform, including mobile applications, TMS (Transportation Management System), and subscription-based features. All development will follow the SPEC_DRIVEN_FRAMEWORK v1.25 with strict database validation and spec-driven implementation.

---

## 📱 PHASE 1: MOBILE APPLICATIONS

### **1.1 iOS App**

**Target Users:**
- Merchants (order management, analytics)
- Consumers (order tracking, reviews)
- Couriers (delivery management, route optimization)

**Core Features:**
- User authentication (role-based)
- Real-time order tracking
- Push notifications
- Offline mode support
- Biometric authentication
- Camera for proof of delivery

**Technical Stack:**
- **Framework:** React Native or Swift (native)
- **State Management:** Redux Toolkit
- **API:** Existing Performile REST API
- **Push Notifications:** Firebase Cloud Messaging
- **Maps:** Apple Maps / Google Maps
- **Storage:** AsyncStorage / Realm

**Subscription Tiers:**
- **Free:** Basic tracking, limited orders
- **Pro:** Unlimited orders, advanced analytics
- **Enterprise:** Custom features, API access

**SPEC_DRIVEN_FRAMEWORK Compliance:**
- ✅ RULE #1: Validate existing `users`, `orders`, `subscriptions` tables
- ✅ RULE #6: Create mobile app spec before development
- ✅ RULE #8: No breaking changes to existing API
- ✅ New tables needed: `mobile_devices`, `push_tokens`, `app_sessions`

---

### **1.2 Android App**

**Target Users:**
- Merchants (order management, analytics)
- Consumers (order tracking, reviews)
- Couriers (delivery management, route optimization)

**Core Features:**
- Same as iOS (feature parity)
- Android-specific: Widget support
- Material Design 3
- Google Wallet integration

**Technical Stack:**
- **Framework:** React Native (shared codebase with iOS)
- **Alternative:** Kotlin (native)
- **State Management:** Redux Toolkit
- **API:** Existing Performile REST API
- **Push Notifications:** Firebase Cloud Messaging
- **Maps:** Google Maps
- **Storage:** AsyncStorage / Realm

**Subscription Tiers:**
- Same as iOS (cross-platform subscriptions)

**SPEC_DRIVEN_FRAMEWORK Compliance:**
- ✅ RULE #1: Validate existing tables (same as iOS)
- ✅ RULE #6: Create Android-specific spec
- ✅ RULE #8: Shared API with iOS
- ✅ Platform-specific tables: `android_devices`, `google_play_subscriptions`

---

## 🚚 PHASE 2: TMS (Transportation Management System)

### **2.1 TMS Overview**

**Purpose:** Complete delivery management system for couriers and logistics companies

**Target Users:**
- Couriers (individual drivers)
- Delivery Staff (warehouse, dispatch)
- Fleet Managers (admin, analytics)
- Merchants (integration)

---

### **2.2 Courier Module**

#### **Personal Information Management**

**Features:**
- Profile management (name, photo, contact)
- Document uploads (license, insurance, certifications)
- Background check status
- Ratings and reviews
- Earnings tracking
- Tax information

**Database Tables Needed:**
```sql
-- Validate first (RULE #1)
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('couriers', 'courier_profiles', 'courier_documents');

-- New tables (if not exist)
CREATE TABLE courier_profiles (
  courier_id UUID PRIMARY KEY REFERENCES couriers(courier_id),
  profile_photo_url TEXT,
  license_number TEXT,
  license_expiry DATE,
  insurance_policy TEXT,
  insurance_expiry DATE,
  background_check_status TEXT,
  background_check_date DATE,
  tax_id TEXT,
  bank_account_info JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courier_documents (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  document_type TEXT, -- 'license', 'insurance', 'certification'
  document_url TEXT,
  expiry_date DATE,
  verification_status TEXT, -- 'pending', 'approved', 'rejected'
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

#### **Vehicle Management**

**Features:**
- Multiple vehicle support
- Vehicle details (make, model, year, plate)
- Vehicle photos
- Insurance tracking
- Maintenance schedule
- Fuel tracking
- Capacity management

**Database Tables Needed:**
```sql
-- Validate first (RULE #1)
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%vehicle%';

-- New tables
CREATE TABLE courier_vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  vehicle_type TEXT, -- 'car', 'van', 'truck', 'motorcycle', 'bicycle'
  make TEXT,
  model TEXT,
  year INTEGER,
  license_plate TEXT UNIQUE,
  color TEXT,
  vin TEXT,
  capacity_weight_kg DECIMAL,
  capacity_volume_m3 DECIMAL,
  insurance_policy TEXT,
  insurance_expiry DATE,
  registration_expiry DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle_photos (
  photo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES courier_vehicles(vehicle_id),
  photo_url TEXT,
  photo_type TEXT, -- 'front', 'back', 'side', 'interior'
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle_maintenance (
  maintenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES courier_vehicles(vehicle_id),
  maintenance_type TEXT, -- 'oil_change', 'tire_rotation', 'inspection'
  maintenance_date DATE,
  next_maintenance_date DATE,
  cost DECIMAL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **2.3 Delivery App (Handheld Scanner)**

#### **Core Features**

**1. Barcode/QR Code Scanning**
- Package scanning for pickup
- Package scanning for delivery
- Signature capture
- Photo proof of delivery
- GPS location tagging

**2. Route Optimization**
- Real-time route calculation
- Traffic-aware routing
- Multi-stop optimization
- Turn-by-turn navigation
- ETA updates

**3. Delivery Management**
- Delivery list (sorted by route)
- Package details
- Customer contact info
- Delivery instructions
- Failed delivery reasons

**4. Consumer Data Access**
- Customer name and address
- Phone number (masked)
- Delivery preferences
- Special instructions
- Delivery history

**Technical Stack:**
- **Platform:** iOS + Android (React Native)
- **Scanner:** react-native-camera / expo-barcode-scanner
- **Maps:** Google Maps API / Apple Maps
- **Routing:** Google Directions API / Mapbox
- **Offline:** Realm Database
- **Sync:** Background sync when online

**Database Tables Needed:**
```sql
-- Validate first (RULE #1)
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('deliveries', 'delivery_scans', 'delivery_routes');

-- New tables
CREATE TABLE delivery_scans (
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id),
  courier_id UUID REFERENCES couriers(courier_id),
  scan_type TEXT, -- 'pickup', 'delivery', 'failed'
  barcode TEXT,
  scan_location GEOGRAPHY(POINT),
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  signature_url TEXT,
  photo_url TEXT,
  notes TEXT
);

CREATE TABLE delivery_routes (
  route_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  route_date DATE,
  route_status TEXT, -- 'planned', 'in_progress', 'completed'
  total_stops INTEGER,
  completed_stops INTEGER,
  total_distance_km DECIMAL,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  route_geometry GEOGRAPHY(LINESTRING),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE route_stops (
  stop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES delivery_routes(route_id),
  order_id UUID REFERENCES orders(order_id),
  stop_sequence INTEGER,
  stop_type TEXT, -- 'pickup', 'delivery'
  stop_location GEOGRAPHY(POINT),
  estimated_arrival TIMESTAMP,
  actual_arrival TIMESTAMP,
  stop_status TEXT, -- 'pending', 'completed', 'failed'
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **2.4 Delivery Staff Module**

#### **Roles:**
- **Warehouse Staff:** Package sorting, scanning, loading
- **Dispatch:** Route planning, courier assignment
- **Fleet Manager:** Vehicle management, courier oversight
- **Admin:** System configuration, reporting

#### **Features:**

**Warehouse Management:**
- Inbound package scanning
- Package sorting by route
- Loading verification
- Inventory tracking
- Damaged package reporting

**Dispatch Console:**
- Real-time courier tracking
- Route assignment
- Load balancing
- Emergency reassignment
- Communication hub

**Fleet Management:**
- Courier performance metrics
- Vehicle utilization
- Maintenance scheduling
- Fuel cost tracking
- Compliance monitoring

**Database Tables Needed:**
```sql
-- Validate first (RULE #1)
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%staff%' OR table_name LIKE '%warehouse%';

-- New tables
CREATE TABLE delivery_staff (
  staff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  staff_role TEXT, -- 'warehouse', 'dispatch', 'fleet_manager', 'admin'
  warehouse_id UUID,
  permissions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE warehouses (
  warehouse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_name TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT,
  location GEOGRAPHY(POINT),
  capacity INTEGER,
  operating_hours JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE package_scans (
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id),
  staff_id UUID REFERENCES delivery_staff(staff_id),
  warehouse_id UUID REFERENCES warehouses(warehouse_id),
  scan_type TEXT, -- 'inbound', 'sorted', 'loaded', 'damaged'
  scan_timestamp TIMESTAMP DEFAULT NOW(),
  barcode TEXT,
  notes TEXT
);

CREATE TABLE courier_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  route_id UUID REFERENCES delivery_routes(route_id),
  assigned_by UUID REFERENCES delivery_staff(staff_id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  assignment_status TEXT, -- 'assigned', 'accepted', 'rejected', 'completed'
  notes TEXT
);
```

---

## 💳 PHASE 3: SUBSCRIPTION & USER LIMITS

### **3.1 Subscription Tiers**

#### **Merchant Subscriptions**

**Free Tier:**
- Up to 50 orders/month
- Basic analytics
- Email support
- 1 store
- Standard API rate limits

**Pro Tier ($49/month):**
- Up to 500 orders/month
- Advanced analytics
- Priority support
- 3 stores
- Shopify integration
- Higher API rate limits

**Enterprise Tier ($199/month):**
- Unlimited orders
- Custom analytics
- Dedicated support
- Unlimited stores
- All integrations
- Custom API limits
- White-label options

#### **Consumer Subscriptions**

**Free Tier:**
- Order tracking
- Basic reviews
- Standard notifications

**Premium Tier ($4.99/month):**
- Priority support
- Extended tracking history
- No ads
- Early access to features

#### **Courier Subscriptions**

**Free Tier:**
- Up to 20 deliveries/month
- Basic route optimization
- Standard commission (20%)

**Pro Tier ($29/month):**
- Up to 200 deliveries/month
- Advanced route optimization
- Reduced commission (15%)
- Priority assignments
- Earnings analytics

**Enterprise Tier ($99/month):**
- Unlimited deliveries
- AI route optimization
- Lowest commission (10%)
- Fleet management tools
- API access

### **3.2 Implementation**

**Database Tables Needed:**
```sql
-- Validate first (RULE #1)
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%subscription%';

-- Check existing subscription_plans table
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'subscription_plans';

-- New tables (if needed)
CREATE TABLE user_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  plan_id UUID REFERENCES subscription_plans(subscription_plan_id),
  subscription_status TEXT, -- 'active', 'cancelled', 'expired', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_limits (
  limit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  limit_type TEXT, -- 'orders', 'api_calls', 'stores', 'deliveries'
  limit_value INTEGER,
  current_usage INTEGER DEFAULT 0,
  reset_period TEXT, -- 'monthly', 'daily', 'yearly'
  last_reset TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE usage_tracking (
  tracking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(user_id),
  usage_type TEXT,
  usage_count INTEGER DEFAULT 1,
  tracked_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ SPEC_DRIVEN_FRAMEWORK COMPLIANCE

### **Development Process for Each Feature**

#### **Step 1: Database Validation (RULE #1)**
```sql
-- Before starting ANY feature, run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for existing related tables
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%feature_keyword%';

-- Check columns in related tables
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('related_table1', 'related_table2');
```

#### **Step 2: Create Feature Spec (RULE #6)**
```markdown
# Feature Spec: [Feature Name]

## Database Changes
- [ ] Validated existing tables
- [ ] No duplicate tables found
- [ ] New tables needed: [list]
- [ ] Foreign keys validated

## API Endpoints
- [ ] GET /api/[resource]
- [ ] POST /api/[resource]
- [ ] PUT /api/[resource]/:id
- [ ] DELETE /api/[resource]/:id

## Frontend Components
- [ ] [ComponentName].tsx
- [ ] [ComponentName]List.tsx
- [ ] [ComponentName]Details.tsx

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

## Documentation
- [ ] API documentation
- [ ] User guide
- [ ] Developer guide
```

#### **Step 3: Get Approval (RULE #7)**
- Submit spec for review
- Wait for approval
- Do NOT start coding before approval

#### **Step 4: Implementation (RULE #8)**
- Follow spec exactly
- No breaking changes
- Backward compatible
- Test thoroughly

---

## 📋 IMPLEMENTATION PRIORITY

### **Phase 1: Foundation (Q1 2026)**
1. ✅ Complete current platform issues
2. ✅ Implement subscription system
3. ✅ Add usage limits and tracking
4. ✅ Payment integration (Stripe)

### **Phase 2: TMS Core (Q2 2026)**
1. Courier profile management
2. Vehicle management
3. Basic route optimization
4. Delivery scanning (web version)

### **Phase 3: Mobile Apps (Q3 2026)**
1. iOS app (MVP)
2. Android app (MVP)
3. Push notifications
4. Offline mode

### **Phase 4: TMS Advanced (Q4 2026)**
1. Delivery staff module
2. Warehouse management
3. Dispatch console
4. Fleet management

### **Phase 5: AI & Optimization (2027)**
1. AI route optimization
2. Predictive analytics
3. Demand forecasting
4. Dynamic pricing

---

## 🎯 CURRENT FOCUS: ADDRESS EXISTING ISSUES

### **Before Starting New Development:**

**Priority 1: Fix Current Issues** 🔴
1. Complete Shopify app setup (25 min)
2. Implement 3 Shopify fixes (2-3 hours)
3. Test all existing features
4. Document any bugs found

**Priority 2: Database Audit** 🟡
1. Run full database validation
2. Identify duplicate tables
3. Document table usage
4. Clean up unused tables

**Priority 3: Subscription System** 🟢
1. Seed subscription_plans data
2. Implement subscription management
3. Add usage tracking
4. Test payment flow

---

## 💡 BEST PRACTICES & RECOMMENDATIONS

### **Mobile Development**

**Recommendation: React Native**
- ✅ Single codebase for iOS + Android
- ✅ Faster development
- ✅ Shared business logic
- ✅ Easier maintenance
- ✅ Cost-effective

**Alternative: Native (Swift + Kotlin)**
- ✅ Better performance
- ✅ Platform-specific features
- ❌ Double development time
- ❌ Higher cost

### **TMS Development**

**Recommendation: Modular Approach**
1. Start with courier module (highest ROI)
2. Add delivery app (enables operations)
3. Build warehouse module (scales operations)
4. Add fleet management (enterprise feature)

### **Subscription Implementation**

**Recommendation: Stripe**
- ✅ Industry standard
- ✅ Easy integration
- ✅ Supports all payment methods
- ✅ Built-in subscription management
- ✅ Excellent documentation

### **Database Design**

**Best Practices:**
1. Always validate before creating tables
2. Use UUIDs for primary keys
3. Add created_at and updated_at to all tables
4. Use JSONB for flexible data
5. Add indexes for foreign keys
6. Use GEOGRAPHY for location data

---

## 📊 ESTIMATED TIMELINE & RESOURCES

### **Mobile Apps (iOS + Android)**
- **Timeline:** 4-6 months
- **Team:** 2 developers (1 iOS, 1 Android) OR 1 React Native developer
- **Cost:** $80,000 - $120,000

### **TMS System**
- **Timeline:** 6-9 months
- **Team:** 2-3 full-stack developers
- **Cost:** $120,000 - $180,000

### **Subscription System**
- **Timeline:** 2-3 weeks
- **Team:** 1 full-stack developer
- **Cost:** $8,000 - $12,000

### **Total Project**
- **Timeline:** 12-18 months
- **Team:** 3-4 developers
- **Cost:** $200,000 - $300,000

---

## ✅ NEXT STEPS

### **Immediate (This Week)**
1. Review and approve this roadmap
2. Prioritize features
3. Complete current platform issues
4. Run database audit

### **Short-term (This Month)**
1. Implement subscription system
2. Add usage limits
3. Test payment flow
4. Document APIs

### **Medium-term (Next Quarter)**
1. Start TMS courier module
2. Begin mobile app planning
3. Hire additional developers
4. Set up CI/CD for mobile

---

**Status:** 📋 AWAITING APPROVAL  
**Next Action:** Review and prioritize features  
**Framework Compliance:** ✅ 100% SPEC_DRIVEN_FRAMEWORK v1.25

---

**Created:** October 29, 2025  
**Last Updated:** October 29, 2025  
**Version:** 1.0
