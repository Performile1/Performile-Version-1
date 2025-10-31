# Mobile Apps Specification - iOS & Android

**Date:** October 30, 2025  
**Version:** 1.0  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.25  
**Status:** 📋 SPECIFICATION PHASE

---

## 🎯 OVERVIEW

### **Universal Mobile App for All User Types**

**One App - Multiple Roles:**
- Merchants
- Couriers
- Consumers
- Delivery Personnel
- Warehouse Staff
- Team Leaders (Warehouse & Delivery)
- Dispatchers
- Fleet Managers
- Admins

**Platforms:**
- iOS (iPhone & iPad)
- Android (Phone & Tablet)

**Technology:**
- React Native (shared codebase)
- Expo for development
- TypeScript for type safety

---

## 👥 USER ROLES & FEATURES

### **1. MERCHANT APP**

**Dashboard:**
- Order overview
- Sales analytics
- Courier performance
- Real-time notifications

**Order Management:**
- Create new orders
- View order history
- Track deliveries
- Bulk order import

**Courier Selection:**
- Browse available couriers
- Compare prices & ratings
- Book deliveries
- Manage preferences

**Analytics:**
- Sales reports
- Delivery performance
- Customer satisfaction
- Cost analysis

**Store Management:**
- Update store info
- Manage locations
- Set delivery zones
- Operating hours

**Notifications:**
- Order updates
- Delivery confirmations
- Payment notifications
- System alerts

---

### **2. COURIER APP**

**Today's Deliveries:**
- Assigned routes
- Delivery list
- Navigation
- Real-time updates

**Package Scanning:**
- Barcode scanner
- Manual entry
- Bulk scanning

**Proof of Delivery:**
- Signature capture (digital signature pad)
- Photo capture (package at door)
- Recipient information (name, relation)
- GPS location (automatic)
- PIN code verification (optional)
- Timestamp (automatic)

**Delivery Status Options:**
- ✅ **Delivered** - Successful delivery
- ❌ **Failed Delivery** - Customer not home, wrong address, etc.
- ⚠️ **Partial Delivery** - Some items delivered
- 🔄 **Return to Sender** - Package returned
- 🔔 **Delivery Attempted** - Left notice
- 📦 **Damaged Package** - Package damaged in transit

**Failure Reasons:**
- Customer not home
- Wrong address
- Access denied
- Customer refused
- Damaged package
- Other (with notes)

**Route Navigation:**
- Turn-by-turn directions
- Traffic updates
- Multiple stops
- Optimized routing

**Earnings:**
- Daily earnings
- Weekly summary
- Payment history
- Invoice generation

**Vehicle Management:**
- Vehicle info
- Maintenance schedule
- Fuel tracking
- Inspection reminders

**Profile:**
- Personal info
- Documents upload
- License & insurance
- Bank details

---

### **3. CONSUMER APP**

**Order Tracking:**
- **Real-time tracking** - See courier on map
- **Live map** - Courier moves in real-time
- **Delivery ETA** - Updated based on location
- **Courier info** - Name, photo, rating, vehicle
- **Route progress** - Stops completed vs remaining
- **Distance to you** - Live distance calculation
- **Traffic conditions** - Current traffic status
- **Notifications** - Approaching, arrived, delivered

**Order History:**
- Past orders
- Receipts
- Reorder
- Favorites

**Reviews:**
- Rate deliveries
- Write reviews
- View courier ratings
- TrustScore

**Notifications:**
- Order updates
- Delivery alerts
- Promotions
- Support messages

**Profile:**
- Delivery addresses
- Payment methods
- Preferences
- Order history

---

### **4. DELIVERY PERSONNEL APP**

**Daily Tasks:**
- Assigned deliveries
- Route overview
- Task checklist
- Break schedule

**Package Handling:**
- Scan packages
- Load verification
- Damage reporting
- Return processing

**Route Execution:**
- Navigation
- Stop sequence
- Customer communication
- Delivery confirmation

**Performance:**
- Daily stats
- Completion rate
- On-time delivery
- Customer ratings

**Communication:**
- Team chat
- Dispatcher contact
- Customer messages
- Emergency support

**Time Tracking:**
- Clock in/out
- Break tracking
- Overtime
- Timesheet

---

### **5. WAREHOUSE STAFF APP**

**Package Processing:**
- Inbound scanning
- Sorting
- Outbound scanning
- Inventory tracking

**Warehouse Operations:**
- Receiving shipments
- Quality checks
- Storage assignment
- Loading trucks

**Inventory Management:**
- Stock levels
- Location tracking
- Cycle counting
- Discrepancy reporting

**Task Management:**
- Daily assignments
- Priority tasks
- Completion tracking
- Performance metrics

**Equipment:**
- Scanner management
- Printer status
- Equipment checkout
- Maintenance requests

**Safety:**
- Incident reporting
- Safety checklists
- Training records
- Emergency procedures

---

### **6. TEAM LEADER APP (Warehouse)**

**Team Management:**
- Staff overview
- Shift scheduling
- Task assignment
- Performance monitoring

**Operations Dashboard:**
- Warehouse metrics
- Productivity stats
- Quality metrics
- Issue tracking

**Staff Performance:**
- Individual stats
- Team performance
- Training needs
- Recognition

**Inventory Oversight:**
- Stock levels
- Discrepancies
- Reorder alerts
- Audit reports

**Quality Control:**
- Inspection results
- Error tracking
- Corrective actions
- Compliance

**Reporting:**
- Daily reports
- Incident reports
- Performance reports
- Management updates

---

### **7. TEAM LEADER APP (Delivery)**

**Route Management:**
- Route planning
- Driver assignment
- Route optimization
- Real-time monitoring

**Team Oversight:**
- Driver locations
- Delivery status
- Performance metrics
- Issue resolution

**Performance Monitoring:**
- On-time delivery
- Customer satisfaction
- Efficiency metrics
- Problem areas

**Communication:**
- Team coordination
- Driver support
- Customer escalations
- Management updates

**Resource Management:**
- Vehicle allocation
- Fuel management
- Maintenance scheduling
- Equipment tracking

**Reporting:**
- Daily summaries
- Performance reports
- Incident reports
- Improvement recommendations

---

### **8. DISPATCHER APP**

**Route Planning:**
- Create routes
- Assign drivers
- Optimize routes
- Schedule deliveries

**Real-time Monitoring:**
- Driver locations
- Delivery status
- Traffic conditions
- Issue alerts

**Communication Hub:**
- Driver coordination
- Customer updates
- Team messaging
- Emergency response

**Problem Resolution:**
- Delivery issues
- Route changes
- Customer complaints
- Emergency situations

**Resource Allocation:**
- Driver availability
- Vehicle capacity
- Time windows
- Priority handling

**Analytics:**
- Route efficiency
- Driver performance
- Customer satisfaction
- Operational metrics

---

### **9. FLEET MANAGER APP**

**Fleet Overview:**
- Vehicle status
- Driver assignments
- Maintenance schedule
- Utilization metrics

**Vehicle Management:**
- Vehicle inventory
- Maintenance tracking
- Fuel consumption
- Cost analysis

**Driver Management:**
- Driver roster
- Performance metrics
- Training records
- Compliance tracking

**Analytics:**
- Fleet efficiency
- Cost per delivery
- Vehicle utilization
- Maintenance costs

**Planning:**
- Capacity planning
- Route optimization
- Resource allocation
- Budget management

**Compliance:**
- Vehicle inspections
- Driver licenses
- Insurance tracking
- Safety records

---

### **10. ADMIN APP**

**System Overview:**
- Platform metrics
- User statistics
- Order volume
- Revenue tracking

**User Management:**
- User accounts
- Role assignment
- Access control
- Account verification

**Operations:**
- Order management
- Issue resolution
- System settings
- Feature toggles

**Analytics:**
- Platform performance
- User engagement
- Revenue analytics
- Growth metrics

**Support:**
- User support
- Issue tracking
- Feedback management
- System health

---

## 📱 CORE FEATURES (ALL APPS)

### **Authentication:**
- Email/password login
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- PIN code
- Two-factor authentication
- Session management
- Auto-logout

### **Notifications:**
- Push notifications
- In-app notifications
- Email notifications
- SMS notifications (optional)
- Notification preferences
- Do not disturb mode

### **Offline Mode:**
- Cache critical data
- Queue actions
- Sync when online
- Conflict resolution
- Local storage
- Background sync

### **Camera:**
- Barcode scanning
- QR code scanning
- Photo capture
- Document scanning
- Signature capture
- Video recording (optional)

### **Location & GPS Tracking:**
- **Real-time GPS tracking** (10-30 second updates)
- **Background location tracking** (even when app closed)
- **Live delivery map** with courier position
- **Route visualization** with polylines
- **Geofencing** (automatic arrival detection)
- **Location history** tracking
- **Distance calculation** and ETA
- **Map integration** (Apple Maps, Google Maps, Mapbox)
- **Traffic overlay** for route optimization
- **Battery optimization** for extended tracking

### **Communication:**
- In-app chat
- Push-to-talk (optional)
- Phone integration
- Email integration
- SMS integration
- Emergency contact

### **File Management:**
- Document upload
- Photo upload
- PDF generation
- File preview
- Cloud storage
- Local cache

---

## 🗄️ DATABASE ADDITIONS

### **Table: mobile_devices**

```sql
CREATE TABLE IF NOT EXISTS mobile_devices (
  device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Device Information
  device_type VARCHAR(50) NOT NULL, -- ios, android
  device_model VARCHAR(100),
  device_os_version VARCHAR(50),
  app_version VARCHAR(50),
  
  -- Push Notifications
  push_token TEXT,
  push_enabled BOOLEAN DEFAULT TRUE,
  
  -- Device Settings
  biometric_enabled BOOLEAN DEFAULT FALSE,
  location_enabled BOOLEAN DEFAULT FALSE,
  camera_enabled BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_active_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_device_type CHECK (device_type IN ('ios', 'android'))
);

-- Indexes
CREATE INDEX idx_mobile_devices_user_id ON mobile_devices(user_id);
CREATE INDEX idx_mobile_devices_type ON mobile_devices(device_type);
CREATE INDEX idx_mobile_devices_active ON mobile_devices(is_active);
CREATE INDEX idx_mobile_devices_push_token ON mobile_devices(push_token);
```

---

### **Table: app_sessions**

```sql
CREATE TABLE IF NOT EXISTS app_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  device_id UUID REFERENCES mobile_devices(device_id) ON DELETE CASCADE,
  
  -- Session Information
  session_token TEXT NOT NULL,
  refresh_token TEXT,
  
  -- Session Details
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_app_sessions_user_id ON app_sessions(user_id);
CREATE INDEX idx_app_sessions_device_id ON app_sessions(device_id);
CREATE INDEX idx_app_sessions_token ON app_sessions(session_token);
CREATE INDEX idx_app_sessions_active ON app_sessions(is_active);
```

---

### **Enhanced: delivery_staff table**

```sql
-- Add team_leader_id column to existing delivery_staff table
ALTER TABLE delivery_staff 
ADD COLUMN IF NOT EXISTS team_leader_id UUID REFERENCES delivery_staff(staff_id),
ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(warehouse_id),
ADD COLUMN IF NOT EXISTS shift_schedule JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);

-- Add index
CREATE INDEX IF NOT EXISTS idx_delivery_staff_team_leader ON delivery_staff(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_delivery_staff_warehouse ON delivery_staff(warehouse_id);
```

---

### **Table: team_leaders**

```sql
CREATE TABLE IF NOT EXISTS team_leaders (
  leader_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES delivery_staff(staff_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Leader Information
  leader_type VARCHAR(50) NOT NULL, -- warehouse_leader, delivery_leader
  department VARCHAR(100),
  
  -- Team
  team_name VARCHAR(200),
  team_size INTEGER DEFAULT 0,
  
  -- Authority
  can_approve_overtime BOOLEAN DEFAULT FALSE,
  can_assign_tasks BOOLEAN DEFAULT TRUE,
  can_modify_schedules BOOLEAN DEFAULT TRUE,
  max_approval_amount DECIMAL(10,2),
  
  -- Performance
  team_performance_score DECIMAL(5,2),
  leadership_rating DECIMAL(3,2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  appointed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_leader_type CHECK (leader_type IN ('warehouse_leader', 'delivery_leader', 'both')),
  CONSTRAINT unique_staff_leader UNIQUE(staff_id)
);

-- Indexes
CREATE INDEX idx_team_leaders_staff_id ON team_leaders(staff_id);
CREATE INDEX idx_team_leaders_user_id ON team_leaders(user_id);
CREATE INDEX idx_team_leaders_type ON team_leaders(leader_type);
CREATE INDEX idx_team_leaders_active ON team_leaders(is_active);
```

---

### **Table: staff_shifts**

```sql
CREATE TABLE IF NOT EXISTS staff_shifts (
  shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES delivery_staff(staff_id) ON DELETE CASCADE,
  team_leader_id UUID REFERENCES team_leaders(leader_id),
  
  -- Shift Information
  shift_date DATE NOT NULL,
  shift_type VARCHAR(50) NOT NULL, -- morning, afternoon, evening, night
  
  -- Timing
  scheduled_start_time TIME NOT NULL,
  scheduled_end_time TIME NOT NULL,
  actual_start_time TIME,
  actual_end_time TIME,
  
  -- Break
  break_duration_minutes INTEGER DEFAULT 30,
  break_taken_minutes INTEGER,
  
  -- Status
  shift_status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, no_show
  
  -- Location
  warehouse_id UUID REFERENCES warehouses(warehouse_id),
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_shift_type CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'split')),
  CONSTRAINT valid_shift_status CHECK (shift_status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'))
);

-- Indexes
CREATE INDEX idx_staff_shifts_staff_id ON staff_shifts(staff_id);
CREATE INDEX idx_staff_shifts_team_leader_id ON staff_shifts(team_leader_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(shift_date);
CREATE INDEX idx_staff_shifts_status ON staff_shifts(shift_status);
CREATE INDEX idx_staff_shifts_warehouse_id ON staff_shifts(warehouse_id);
```

---

## ⏰ IMPLEMENTATION TIMELINE

### **Phase 1: Core Mobile Infrastructure (Week 1-2)**
- React Native setup
- Authentication system
- Push notifications
- Offline mode
- Camera integration
- Location services

### **Phase 2: Merchant & Consumer Apps (Week 3-4)**
- Merchant dashboard
- Order management
- Consumer tracking
- Reviews & ratings

### **Phase 3: Courier & Delivery Personnel (Week 5-6)**
- Delivery app
- Package scanning
- Route navigation
- Proof of delivery

### **Phase 4: Warehouse Staff (Week 7-8)**
- Warehouse operations
- Package processing
- Inventory management
- Task management

### **Phase 5: Team Leaders & Management (Week 9-10)**
- Team management
- Performance monitoring
- Reporting
- Analytics

### **Phase 6: Dispatcher & Fleet Manager (Week 11-12)**
- Route planning
- Real-time monitoring
- Fleet management
- Analytics

### **Phase 7: Testing & Polish (Week 13-14)**
- End-to-end testing
- Performance optimization
- Bug fixes
- App store submission

**Total:** 14 weeks (3.5 months)

---

## 💰 COST ESTIMATE

**Development:**
- Mobile infrastructure: 80 hours × $100 = $8,000
- Merchant/Consumer apps: 100 hours × $100 = $10,000
- Courier/Delivery apps: 120 hours × $100 = $12,000
- Warehouse apps: 80 hours × $100 = $8,000
- Team Leader apps: 60 hours × $100 = $6,000
- Management apps: 60 hours × $100 = $6,000
- Testing & Polish: 40 hours × $100 = $4,000
- **Total Development:** $54,000

**Infrastructure:**
- Apple Developer Account: $99/year
- Google Play Developer: $25 one-time
- Push Notification Service: $50/month
- App Analytics: $30/month
- **Total Infrastructure:** ~$1,000/year

**Maintenance:**
- Monthly updates: 20 hours × $100 = $2,000/month
- Bug fixes: 10 hours × $100 = $1,000/month
- **Total Maintenance:** $3,000/month

---

## 🎯 SUCCESS CRITERIA

### **Phase 1:**
- ✅ Authentication works on iOS & Android
- ✅ Push notifications delivered
- ✅ Offline mode functional
- ✅ Camera & location working

### **Phase 2:**
- ✅ Merchants can create orders
- ✅ Consumers can track deliveries
- ✅ Reviews can be submitted
- ✅ Real-time updates working

### **Phase 3:**
- ✅ Couriers can scan packages
- ✅ Navigation integrated
- ✅ Proof of delivery captured
- ✅ Earnings tracked

### **Phase 4:**
- ✅ Warehouse scanning works
- ✅ Inventory updated
- ✅ Tasks assigned
- ✅ Performance tracked

### **Phase 5:**
- ✅ Team leaders can manage staff
- ✅ Performance monitored
- ✅ Reports generated
- ✅ Communication working

### **Phase 6:**
- ✅ Routes optimized
- ✅ Real-time tracking
- ✅ Fleet managed
- ✅ Analytics available

---

## 📊 NEW DATABASE TABLES SUMMARY

**Mobile Apps Tables:**
1. mobile_devices
2. app_sessions

**Staff Management Tables:**
3. team_leaders
4. staff_shifts

**Enhanced Tables:**
- delivery_staff (add columns)

**Total New:** 4 tables  
**Total Enhanced:** 1 table

---

**Status:** ✅ SPECIFICATION COMPLETE  
**Next:** GET APPROVAL → START DEVELOPMENT  
**Framework:** ✅ SPEC_DRIVEN_FRAMEWORK v1.25
