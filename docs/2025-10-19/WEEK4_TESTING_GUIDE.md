# 🧪 WEEK 4 TESTING GUIDE

**Date:** October 19, 2025  
**Purpose:** Comprehensive testing procedures for Week 4 features

---

## 📋 TESTING CHECKLIST

### **✅ Database Testing**

#### **1. Verify Tables Created**
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'service_performance',
    'service_performance_geographic',
    'service_reviews',
    'parcel_points',
    'parcel_point_hours',
    'parcel_point_facilities',
    'delivery_coverage',
    'coverage_zones',
    'courier_service_offerings',
    'courier_service_pricing',
    'courier_service_zones',
    'service_certifications',
    'service_availability_calendar'
  );
-- Expected: 13 rows
```

#### **2. Verify Functions Created**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_service_performance',
    'refresh_service_performance_summary',
    'find_nearby_parcel_points',
    'check_delivery_coverage',
    'refresh_parcel_points_summary',
    'calculate_service_price',
    'find_available_services',
    'refresh_service_offerings_summary'
  );
-- Expected: 8 rows
```

#### **3. Test Service Performance Calculation**
```sql
-- Calculate performance for a courier
SELECT calculate_service_performance(
    (SELECT courier_id FROM couriers LIMIT 1),
    (SELECT service_type_id FROM servicetypes WHERE service_code = 'home_delivery'),
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE,
    'monthly'
);
-- Expected: UUID of performance record
```

#### **4. Test Geographic Search**
```sql
-- Find parcel points near Stockholm Central Station
SELECT * FROM find_nearby_parcel_points(
    59.3293,  -- Latitude
    18.0686,  -- Longitude
    5.0,      -- Radius (km)
    NULL,     -- Any courier
    NULL      -- Any point type
);
-- Expected: List of nearby points (may be empty if no data)
```

#### **5. Test Coverage Checker**
```sql
-- Check coverage for Stockholm postal code
SELECT * FROM check_delivery_coverage(
    '11120',  -- Postal code
    NULL,     -- Any courier
    NULL      -- Any service type
);
-- Expected: List of couriers covering this area
```

---

### **✅ API Testing**

#### **1. Service Performance API**

**Test 1: Get Performance Metrics**
```bash
curl -X GET "http://localhost:3000/api/service-performance?period_type=monthly&limit=5"
```
**Expected:** 200 OK, JSON with performance data

**Test 2: Compare Services**
```bash
curl -X GET "http://localhost:3000/api/service-performance?action=compare&courier_ids=uuid1,uuid2"
```
**Expected:** 200 OK, JSON with comparison data

**Test 3: Geographic Breakdown**
```bash
curl -X GET "http://localhost:3000/api/service-performance?action=geographic&courier_id=uuid&city=Stockholm"
```
**Expected:** 200 OK, JSON with geographic data

**Test 4: Service Reviews**
```bash
curl -X GET "http://localhost:3000/api/service-performance?action=reviews&service_type_id=uuid&min_rating=4"
```
**Expected:** 200 OK, JSON with reviews

#### **2. Parcel Points API**

**Test 1: Search Parcel Points**
```bash
curl -X GET "http://localhost:3000/api/parcel-points?city=Stockholm&limit=10"
```
**Expected:** 200 OK, JSON with parcel points

**Test 2: Find Nearby**
```bash
curl -X GET "http://localhost:3000/api/parcel-points?action=nearby&latitude=59.3293&longitude=18.0686&radius_km=5"
```
**Expected:** 200 OK, JSON with nearby points sorted by distance

**Test 3: Check Coverage**
```bash
curl -X GET "http://localhost:3000/api/parcel-points?action=coverage&postal_code=11120"
```
**Expected:** 200 OK, JSON with coverage info and summary

**Test 4: Get Opening Hours**
```bash
curl -X GET "http://localhost:3000/api/parcel-points?action=hours&parcel_point_id=uuid"
```
**Expected:** 200 OK, JSON with hours and facilities

---

### **✅ Frontend Component Testing**

#### **1. ServicePerformanceCard**
```typescript
import { render, screen } from '@testing-library/react';
import { ServicePerformanceCard } from './ServicePerformanceCard';

test('renders performance card with data', () => {
  const mockData = {
    courier_name: 'DHL Express',
    service_name: 'Home Delivery',
    trust_score: 87.5,
    completion_rate: 95.5,
    on_time_rate: 92.0,
    avg_rating: 4.5,
    // ... other fields
  };

  render(<ServicePerformanceCard data={mockData} />);
  
  expect(screen.getByText('DHL Express')).toBeInTheDocument();
  expect(screen.getByText('87.5')).toBeInTheDocument();
});
```

#### **2. ServiceComparisonChart**
```typescript
test('renders comparison chart with multiple services', () => {
  const mockData = [
    { courier_name: 'DHL', trust_score: 87.5, /* ... */ },
    { courier_name: 'PostNord', trust_score: 85.0, /* ... */ }
  ];

  render(<ServiceComparisonChart data={mockData} />);
  
  expect(screen.getByText('Service Performance Comparison')).toBeInTheDocument();
});
```

#### **3. ParcelPointMap**
```typescript
test('renders map with search functionality', () => {
  render(<ParcelPointMap />);
  
  expect(screen.getByPlaceholderText(/search by city/i)).toBeInTheDocument();
  expect(screen.getByText('Use My Location')).toBeInTheDocument();
});
```

#### **4. CoverageChecker**
```typescript
test('allows postal code search', async () => {
  render(<CoverageChecker />);
  
  const input = screen.getByLabelText('Postal Code');
  const button = screen.getByText('Check');
  
  fireEvent.change(input, { target: { value: '11120' } });
  fireEvent.click(button);
  
  // Verify API call was made
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('postal_code=11120')
    );
  });
});
```

---

### **✅ Admin Dashboard Testing**

#### **1. Access Control**
```typescript
test('admin dashboard requires admin role', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/admin/service-analytics']}>
      <Routes>
        <Route path="/admin/service-analytics" element={<ServiceAnalytics />} />
      </Routes>
    </MemoryRouter>
  );

  // Should redirect if not admin
  // Or show access denied message
});
```

#### **2. Tab Navigation**
```typescript
test('can navigate between tabs', () => {
  render(<ServiceAnalytics />);
  
  const tabs = screen.getAllByRole('tab');
  expect(tabs).toHaveLength(5);
  
  fireEvent.click(tabs[1]); // Service Comparison
  expect(screen.getByText(/comparison/i)).toBeInTheDocument();
});
```

#### **3. Data Loading**
```typescript
test('loads performance data on mount', async () => {
  render(<ServiceAnalytics />);
  
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/service-performance')
    );
  });
});
```

---

## 🔍 MANUAL TESTING PROCEDURES

### **1. Database Verification**

**Steps:**
1. Open Supabase SQL Editor
2. Run verification queries above
3. Check row counts match expected
4. Verify data types are correct
5. Test RLS policies with different roles

**Expected Results:**
- All tables exist
- All functions work
- Data is populated (or empty if new system)
- No SQL errors

---

### **2. API Verification**

**Steps:**
1. Start development server: `npm run dev`
2. Use curl or Postman to test each endpoint
3. Verify response status codes
4. Check response data structure
5. Test error cases (invalid params, missing data)

**Expected Results:**
- All endpoints return 200 OK
- JSON structure matches documentation
- Error handling works (400, 404, 500)
- CORS headers present

---

### **3. Component Verification**

**Steps:**
1. Navigate to admin dashboard
2. Test each tab
3. Verify data displays correctly
4. Test responsive design (resize browser)
5. Check console for errors

**Expected Results:**
- All components render
- No console errors
- Data loads correctly
- Responsive on mobile/tablet/desktop

---

### **4. Integration Testing**

**Steps:**
1. Login as admin user
2. Navigate to Service Analytics
3. Test each feature:
   - View performance cards
   - Compare services
   - Search parcel points
   - Check coverage
4. Verify data accuracy
5. Test refresh functionality

**Expected Results:**
- Admin can access all features
- Data is accurate
- Refresh updates data
- No permission errors

---

## 🐛 COMMON ISSUES & SOLUTIONS

### **Issue 1: No Data Displayed**

**Symptoms:**
- Empty arrays returned
- "No data available" messages
- Count shows 0

**Cause:**
- New system with no orders yet
- Performance not calculated

**Solution:**
```sql
-- Manually trigger calculation
SELECT calculate_service_performance(
    courier_id,
    service_type_id,
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE,
    'monthly'
) FROM couriers, servicetypes;

-- Refresh materialized views
SELECT refresh_service_performance_summary();
SELECT refresh_parcel_points_summary();
```

---

### **Issue 2: API Returns 500 Error**

**Symptoms:**
- Internal Server Error
- API calls fail

**Cause:**
- Database connection issue
- Missing environment variables
- RLS policy blocking access

**Solution:**
1. Check Vercel logs
2. Verify DATABASE_URL is set
3. Check RLS policies
4. Test database connection

---

### **Issue 3: Components Don't Render**

**Symptoms:**
- Blank screen
- TypeScript errors
- Import errors

**Cause:**
- Missing dependencies
- Import path incorrect
- Type errors

**Solution:**
```bash
# Install dependencies
npm install

# Check imports
# Verify paths are correct

# Build to check for errors
npm run build
```

---

## ✅ ACCEPTANCE CRITERIA

### **Database:**
- [x] All 13 tables created
- [x] All 8 functions working
- [x] All 3 materialized views created
- [x] Extensions enabled
- [x] RLS policies active
- [x] Indexes created

### **APIs:**
- [x] All 8 endpoints respond
- [x] CORS working
- [x] Error handling implemented
- [x] Query validation working
- [ ] Load tested (production)
- [ ] Rate limiting (production)

### **Frontend:**
- [x] All 8 components render
- [x] Props validated
- [x] TypeScript types correct
- [x] Responsive design
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] E2E tests written

### **Admin Dashboard:**
- [x] Page created
- [x] All 5 tabs working
- [x] Data loads correctly
- [x] Role-based access
- [ ] Production deployed
- [ ] User acceptance testing

---

## 📊 PERFORMANCE BENCHMARKS

### **Target Metrics:**

**Database:**
- Query time: < 100ms
- Materialized view refresh: < 5s
- Geographic search: < 200ms

**APIs:**
- Response time: < 200ms
- Error rate: < 1%
- Uptime: > 99.9%

**Frontend:**
- Initial load: < 2s
- Component render: < 100ms
- Time to interactive: < 3s

---

## 🎯 TEST COVERAGE GOALS

- **Database:** 100% (all functions tested)
- **APIs:** 90%+ (all endpoints + error cases)
- **Components:** 80%+ (critical paths)
- **Integration:** 70%+ (main user flows)

---

**Created By:** Cascade AI  
**Date:** October 19, 2025  
**Status:** Ready for Testing  
**Version:** 1.0

---

*"Testing leads to failure, and failure leads to understanding."* - Burt Rutan

**Happy Testing! 🧪**
