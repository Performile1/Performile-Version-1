# TMS Development Specification

**Date:** October 30, 2025  
**Version:** 1.0  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.25  
**Status:** 📋 SPECIFICATION PHASE

---

## 🎯 OVERVIEW

### **What is TMS?**

**TMS (Transportation Management System)** - Complete delivery management platform for couriers and logistics companies.

### **Target Users:**
- Couriers (drivers)
- Delivery Personnel (individual delivery staff)
- Warehouse Staff (warehouse operations)
- Team Leaders (Warehouse & Delivery)
- Dispatchers
- Fleet Managers
- Merchants
- Consumers

**Business Value:**
- Complete delivery lifecycle management
- Real-time tracking
- Route optimization
- Reduced costs
- Improved efficiency

---

## 📋 IMPLEMENTATION PHASES

### **Phase 1: Courier Profiles (Week 1-2)**

**Database Tables:**
1. `courier_profiles` - Personal info, license, insurance
2. `courier_documents` - Document uploads & verification

**API Endpoints:**
- GET /api/courier/profile
- PUT /api/courier/profile
- POST /api/courier/documents/upload
- GET /api/courier/documents
- DELETE /api/courier/documents/:id
- POST /api/admin/courier/documents/:id/verify

**Frontend:**
- CourierProfilePage.tsx
- CourierDocumentUpload.tsx
- CourierDocumentList.tsx
- AdminDocumentVerification.tsx

**Time:** 10 days

---

### **Phase 2: Vehicle Management (Week 3)**

**Database Tables:**
1. `courier_vehicles` - Vehicle info, registration
2. `vehicle_maintenance` - Maintenance records
3. `vehicle_photos` - Vehicle images

**API Endpoints:**
- GET /api/courier/vehicles
- POST /api/courier/vehicles
- PUT /api/courier/vehicles/:id
- DELETE /api/courier/vehicles/:id
- POST /api/courier/vehicles/:id/maintenance
- GET /api/courier/vehicles/:id/maintenance
- POST /api/courier/vehicles/:id/photos

**Frontend:**
- VehicleManagementPage.tsx
- VehicleForm.tsx
- MaintenanceSchedule.tsx
- VehiclePhotoGallery.tsx

**Time:** 7 days

---

### **Phase 3: Delivery App & Scanning (Week 4-5)**

**Database Tables:**
1. `delivery_scans` - Package scans with GPS & proof

**Mobile App Features:**
- Login & authentication
- Today's deliveries
- Barcode/QR scanner
- Signature capture
- Photo capture
- GPS location
- Offline mode

**Time:** 10 days

---

### **Phase 4: Route Optimization (Week 6-7)**

**Database Tables:**
1. `delivery_routes` - Route planning
2. `route_stops` - Individual stops
3. `courier_assignments` - Route assignments

**Features:**
- Route optimization algorithms
- Multiple optimization strategies
- Real-time updates
- Traffic integration
- Time window constraints

**Time:** 14 days

---

### **Phase 5: Warehouse & Staff (Week 8-9)**

**Database Tables:**
1. `delivery_staff` - Staff management (enhanced)
2. `warehouses` - Warehouse locations
3. `package_scans` - Warehouse scanning
4. `team_leaders` - Team leader management
5. `staff_shifts` - Shift scheduling

**Features:**
- Staff management
- Warehouse operations
- Package tracking
- Inventory management
- Team leader oversight
- Shift scheduling
- Performance tracking

**Time:** 10 days

---

## 📊 DATABASE SCHEMA SUMMARY

### **Tables to Create: 14**

1. courier_profiles
2. courier_documents
3. courier_vehicles
4. vehicle_maintenance
5. vehicle_photos
6. delivery_scans
7. delivery_routes
8. route_stops
9. courier_assignments
10. delivery_staff (enhanced)
11. warehouses
12. package_scans
13. team_leaders
14. staff_shifts

### **Estimated Objects:**
- Tables: 14
- Indexes: 70+
- RLS Policies: 42+
- Functions: 12+

---

## 🔧 TECHNICAL REQUIREMENTS

### **Backend:**
- Supabase PostgreSQL
- RLS policies for security
- File storage for documents/photos
- Real-time subscriptions

### **Frontend:**
- React + TypeScript
- Material-UI components
- React Query for data fetching
- Zustand for state management

### **Mobile:**
- React Native
- Expo for development
- Camera access
- GPS/Location services
- Offline storage (AsyncStorage)
- Barcode scanner

---

## ⏰ TIMELINE

**Total Duration:** 9 weeks (2.25 months)

**Week 1-2:** Courier Profiles  
**Week 3:** Vehicle Management  
**Week 4-5:** Delivery App  
**Week 6-7:** Route Optimization  
**Week 8-9:** Warehouse, Staff & Team Leaders

**Buffer:** 2 weeks for testing & refinement

**Total:** 11 weeks (2.75 months)

---

## 📱 MOBILE APPS TIMELINE

**Total Duration:** 14 weeks (3.5 months)

**Week 1-2:** Core Infrastructure  
**Week 3-4:** Merchant & Consumer Apps  
**Week 5-6:** Courier & Delivery Personnel Apps  
**Week 7-8:** Warehouse Staff Apps  
**Week 9-10:** Team Leader Apps  
**Week 11-12:** Dispatcher & Fleet Manager Apps  
**Week 13-14:** Testing & Polish

**Total:** 14 weeks (3.5 months)

---

## 💰 COST ESTIMATE

**TMS Development:**
- Backend: 50 hours × $100 = $5,000
- Frontend Web: 70 hours × $100 = $7,000
- Testing: 20 hours × $100 = $2,000
- **TMS Total:** $14,000

**Mobile Apps Development:**
- Infrastructure: 80 hours × $100 = $8,000
- Merchant/Consumer: 100 hours × $100 = $10,000
- Courier/Delivery: 120 hours × $100 = $12,000
- Warehouse: 80 hours × $100 = $8,000
- Team Leaders: 60 hours × $100 = $6,000
- Management: 60 hours × $100 = $6,000
- Testing: 40 hours × $100 = $4,000
- **Mobile Total:** $54,000

**Grand Total Development:** $68,000

**Infrastructure:**
- Supabase: $25/month
- Vercel: $20/month
- File Storage: $10/month
- Push Notifications: $50/month
- App Analytics: $30/month
- **Total:** $135/month

**Maintenance:**
- TMS: $1,000/month
- Mobile Apps: $3,000/month
- **Total:** $4,000/month

---

## 🎯 SUCCESS CRITERIA

### **Phase 1:**
- ✅ Courier can create/edit profile
- ✅ Courier can upload documents
- ✅ Admin can verify documents
- ✅ Profile completion tracking

### **Phase 2:**
- ✅ Courier can add vehicles
- ✅ Maintenance tracking works
- ✅ Vehicle photos uploadable
- ✅ Insurance expiry alerts

### **Phase 3:**
- ✅ Mobile app functional
- ✅ Barcode scanning works
- ✅ Proof of delivery captured
- ✅ Offline mode works

### **Phase 4:**
- ✅ Routes optimized
- ✅ Multiple stops handled
- ✅ Real-time updates
- ✅ Navigation integrated

### **Phase 5:**
- ✅ Staff management works
- ✅ Warehouse scanning functional
- ✅ Package tracking accurate
- ✅ Inventory updated

---

## 📋 NEXT STEPS

### **Before Starting:**
1. ✅ Complete current issues (table naming, routes)
2. ✅ Run database validation
3. ✅ Get approval for TMS spec
4. ✅ Set up development environment

### **Day 1:**
1. Create courier_profiles table
2. Create courier_documents table
3. Add RLS policies
4. Create indexes

### **Day 2:**
1. Build profile API endpoints
2. Test with Postman
3. Document API

### **Day 3:**
1. Build CourierProfilePage component
2. Add form validation
3. Test profile creation

### **Day 4:**
1. Build document upload component
2. Integrate file storage
3. Test document upload

### **Day 5:**
1. Build admin verification page
2. Test verification flow
3. End-to-end testing

---

## 🔒 SECURITY CONSIDERATIONS

### **RLS Policies:**
- Couriers can only see own data
- Admins can see all data
- Staff can see assigned data
- Merchants can see related data

### **File Storage:**
- Secure file URLs
- Access control
- Expiry dates
- Virus scanning

### **Data Privacy:**
- GDPR compliant
- Data encryption
- Audit logs
- Right to deletion

---

## 📊 MONITORING & ANALYTICS

### **Metrics to Track:**
- Profile completion rate
- Document verification time
- Vehicle utilization
- Route efficiency
- Delivery success rate
- App usage statistics

### **Dashboards:**
- Admin dashboard
- Fleet manager dashboard
- Courier dashboard
- Performance analytics

---

## 🚀 FUTURE ENHANCEMENTS

### **Phase 6: Advanced Features**
- AI route optimization
- Predictive maintenance
- Real-time traffic integration
- Customer communication
- Automated dispatching

### **Phase 7: Integration**
- Third-party courier APIs
- Telematics integration
- Fuel card integration
- Accounting software integration

---

**Status:** 📋 READY FOR APPROVAL  
**Next:** GET APPROVAL → START PHASE 1  
**Framework:** ✅ SPEC_DRIVEN_FRAMEWORK v1.25
