# 🧪 Week 4 Testing Guide

**Date:** October 23, 2025, 9:12 AM  
**Purpose:** Test all Week 4 features (Service Performance & Parcel Points)  
**Time:** 1.5 hours  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.21

---

## 📋 TESTING CHECKLIST

### Service Performance APIs (30 min)
- [ ] Test Summary Action
- [ ] Test Details Action
- [ ] Test Geographic Action
- [ ] Test Trends Action

### Parcel Points APIs (30 min)
- [ ] Test Search Action
- [ ] Test Details Action
- [ ] Test Coverage Action
- [ ] Test Nearby Action

### Frontend Components (30 min)
- [ ] ServicePerformanceCard
- [ ] ServiceComparisonChart
- [ ] GeographicHeatmap
- [ ] ServiceReviewsList
- [ ] ParcelPointMap
- [ ] ParcelPointDetails
- [ ] CoverageChecker

---

## 🎯 PART 1: Service Performance APIs (30 min)

### API Endpoint
```
GET /api/service-performance
```

### Test 1.1: Summary Action ⏱️ 5 min

**Request:**
```bash
GET /api/service-performance?action=summary&courierId=1
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courier_id": 1,
    "courier_name": "PostNord",
    "services": [
      {
        "service_type": "Home Delivery",
        "total_deliveries": 150,
        "on_time_rate": 94.5,
        "avg_rating": 4.2,
        "trust_score": 87
      },
      {
        "service_type": "Parcel Shop",
        "total_deliveries": 200,
        "on_time_rate": 96.8,
        "avg_rating": 4.5,
        "trust_score": 92
      },
      {
        "service_type": "Parcel Locker",
        "total_deliveries": 100,
        "on_time_rate": 98.2,
        "avg_rating": 4.7,
        "trust_score": 95
      }
    ]
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Response has success: true
- ✅ Data contains courier info
- ✅ Services array has 3 service types
- ✅ Each service has metrics (deliveries, rates, scores)

---

### Test 1.2: Details Action ⏱️ 5 min

**Request:**
```bash
GET /api/service-performance?action=details&courierId=1&serviceType=Home
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courier_id": 1,
    "service_type": "Home Delivery",
    "performance": {
      "total_deliveries": 150,
      "on_time_deliveries": 142,
      "on_time_rate": 94.67,
      "avg_delivery_time_hours": 26.5,
      "avg_rating": 4.2,
      "total_reviews": 89,
      "trust_score": 87
    },
    "breakdown": {
      "excellent": 45,
      "good": 38,
      "average": 6,
      "poor": 0
    },
    "recent_reviews": [
      {
        "rating": 5,
        "comment": "Fast delivery!",
        "created_at": "2025-10-20"
      }
    ]
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Detailed performance metrics
- ✅ Breakdown by quality
- ✅ Recent reviews included

---

### Test 1.3: Geographic Action ⏱️ 10 min

**Request:**
```bash
GET /api/service-performance?action=geographic&courierId=1
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courier_id": 1,
    "regions": [
      {
        "region": "Stockholm",
        "postal_code_prefix": "1",
        "total_deliveries": 500,
        "on_time_rate": 95.2,
        "avg_rating": 4.3,
        "trust_score": 89
      },
      {
        "region": "Gothenburg",
        "postal_code_prefix": "4",
        "total_deliveries": 300,
        "on_time_rate": 93.8,
        "avg_rating": 4.1,
        "trust_score": 85
      }
    ]
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Regions array present
- ✅ Each region has performance data
- ✅ Geographic breakdown makes sense

---

### Test 1.4: Trends Action ⏱️ 10 min

**Request:**
```bash
GET /api/service-performance?action=trends&courierId=1&period=30
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "courier_id": 1,
    "period_days": 30,
    "trends": [
      {
        "date": "2025-10-01",
        "deliveries": 15,
        "on_time_rate": 93.3,
        "avg_rating": 4.2
      },
      {
        "date": "2025-10-02",
        "deliveries": 18,
        "on_time_rate": 94.4,
        "avg_rating": 4.3
      }
      // ... more days
    ],
    "summary": {
      "total_deliveries": 450,
      "avg_on_time_rate": 94.5,
      "avg_rating": 4.2,
      "trend": "improving"
    }
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Trends array with daily data
- ✅ Summary statistics
- ✅ Trend direction (improving/stable/declining)

---

## 🗺️ PART 2: Parcel Points APIs (30 min)

### API Endpoint
```
GET /api/parcel-points
```

### Test 2.1: Search Action ⏱️ 5 min

**Request:**
```bash
GET /api/parcel-points?action=search&postalCode=12345
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "postal_code": "12345",
    "total_points": 8,
    "points": [
      {
        "point_id": 1,
        "name": "ICA Supermarket",
        "address": "Main Street 123",
        "facility_type": "Supermarket",
        "distance_km": 0.5,
        "is_open_now": true,
        "services": ["pickup", "dropoff"]
      },
      {
        "point_id": 2,
        "name": "Circle K Gas Station",
        "address": "Highway 45",
        "facility_type": "Gas Station",
        "distance_km": 1.2,
        "is_open_now": true,
        "services": ["pickup"]
      }
      // ... more points
    ]
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Points array present
- ✅ Each point has complete info
- ✅ Distance calculated
- ✅ Open/closed status

---

### Test 2.2: Details Action ⏱️ 5 min

**Request:**
```bash
GET /api/parcel-points?action=details&pointId=1
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "point_id": 1,
    "name": "ICA Supermarket",
    "address": "Main Street 123",
    "postal_code": "12345",
    "city": "Stockholm",
    "latitude": 59.3293,
    "longitude": 18.0686,
    "facility_type": "Supermarket",
    "services": ["pickup", "dropoff"],
    "opening_hours": [
      {
        "day": "Monday",
        "open_time": "08:00",
        "close_time": "20:00"
      },
      {
        "day": "Tuesday",
        "open_time": "08:00",
        "close_time": "20:00"
      }
      // ... more days
    ],
    "facilities": ["parking", "wheelchair_access", "restroom"],
    "courier_services": [
      {
        "courier_name": "PostNord",
        "services": ["pickup", "dropoff"]
      },
      {
        "courier_name": "DHL",
        "services": ["pickup"]
      }
    ]
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Complete point details
- ✅ Opening hours for all days
- ✅ Facilities list
- ✅ Courier services available

---

### Test 2.3: Coverage Action ⏱️ 10 min

**Request:**
```bash
GET /api/parcel-points?action=coverage&postalCode=12345
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "postal_code": "12345",
    "is_covered": true,
    "coverage_details": {
      "total_points": 8,
      "by_facility_type": {
        "Supermarket": 3,
        "Gas Station": 2,
        "Convenience Store": 2,
        "Post Office": 1
      },
      "by_courier": {
        "PostNord": 6,
        "DHL": 4,
        "Bring": 3
      },
      "services_available": ["pickup", "dropoff", "24/7_locker"]
    },
    "nearest_point": {
      "point_id": 1,
      "name": "ICA Supermarket",
      "distance_km": 0.5
    }
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Coverage status (true/false)
- ✅ Breakdown by facility type
- ✅ Breakdown by courier
- ✅ Nearest point info

---

### Test 2.4: Nearby Action ⏱️ 10 min

**Request:**
```bash
GET /api/parcel-points?action=nearby&lat=59.3293&lng=18.0686&radius=5
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "center": {
      "latitude": 59.3293,
      "longitude": 18.0686
    },
    "radius_km": 5,
    "total_points": 15,
    "points": [
      {
        "point_id": 1,
        "name": "ICA Supermarket",
        "address": "Main Street 123",
        "distance_km": 0.5,
        "bearing": "NE",
        "facility_type": "Supermarket",
        "is_open_now": true
      }
      // ... more points sorted by distance
    ]
  }
}
```

**What to Check:**
- ✅ Status code is 200
- ✅ Points sorted by distance
- ✅ Distance calculated correctly
- ✅ All points within radius
- ✅ Bearing/direction included

---

## 🎨 PART 3: Frontend Components (30 min)

### Test 3.1: ServicePerformanceCard ⏱️ 5 min

**Component:** `apps/web/src/components/service-performance/ServicePerformanceCard.tsx`

**Test Steps:**
1. Navigate to courier dashboard
2. Look for service performance cards
3. Verify data displays correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Shows service type (Home/Shop/Locker)
- ✅ Displays metrics (deliveries, on-time rate, rating)
- ✅ Shows trust score
- ✅ Visual indicators (colors, icons) work
- ✅ Responsive on mobile

---

### Test 3.2: ServiceComparisonChart ⏱️ 5 min

**Component:** `apps/web/src/components/service-performance/ServiceComparisonChart.tsx`

**Test Steps:**
1. Navigate to analytics page
2. Look for service comparison chart
3. Verify chart displays correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Chart displays all 3 service types
- ✅ Bars/lines show correct data
- ✅ Legend is clear
- ✅ Tooltips work on hover
- ✅ Responsive on mobile

---

### Test 3.3: GeographicHeatmap ⏱️ 5 min

**Component:** `apps/web/src/components/service-performance/GeographicHeatmap.tsx`

**Test Steps:**
1. Navigate to geographic performance page
2. Look for heatmap
3. Verify map displays correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Map loads correctly
- ✅ Regions colored by performance
- ✅ Tooltips show region data
- ✅ Legend explains colors
- ✅ Zoom/pan works

---

### Test 3.4: ServiceReviewsList ⏱️ 5 min

**Component:** `apps/web/src/components/service-performance/ServiceReviewsList.tsx`

**Test Steps:**
1. Navigate to service details page
2. Look for reviews list
3. Verify reviews display correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Reviews display in list
- ✅ Shows rating, comment, date
- ✅ Pagination works
- ✅ Filter by service type works
- ✅ Sort options work

---

### Test 3.5: ParcelPointMap ⏱️ 5 min

**Component:** `apps/web/src/components/parcel-points/ParcelPointMap.tsx`

**Test Steps:**
1. Navigate to parcel points page
2. Look for map with markers
3. Verify map displays correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Map loads with markers
- ✅ Markers show parcel points
- ✅ Click marker shows popup
- ✅ Popup has point details
- ✅ Map controls work (zoom, pan)

---

### Test 3.6: ParcelPointDetails ⏱️ 3 min

**Component:** `apps/web/src/components/parcel-points/ParcelPointDetails.tsx`

**Test Steps:**
1. Click on a parcel point
2. Look for details panel/modal
3. Verify details display correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Shows complete point info
- ✅ Opening hours display correctly
- ✅ Facilities list shows
- ✅ Courier services listed
- ✅ Get directions button works

---

### Test 3.7: CoverageChecker ⏱️ 2 min

**Component:** `apps/web/src/components/parcel-points/CoverageChecker.tsx`

**Test Steps:**
1. Navigate to coverage checker
2. Enter postal code
3. Verify results display correctly

**What to Check:**
- ✅ Component renders without errors
- ✅ Input field works
- ✅ Search button triggers check
- ✅ Results show coverage status
- ✅ Shows nearest points
- ✅ Error handling for invalid codes

---

## 📊 TESTING SUMMARY

### Expected Results:

**APIs:**
- ✅ All 8 API actions return 200 OK
- ✅ Response data structure matches expected
- ✅ No server errors (500)
- ✅ No authentication errors (401)
- ✅ Response times < 500ms

**Components:**
- ✅ All 7 components render without errors
- ✅ Data displays correctly
- ✅ Interactive elements work
- ✅ Responsive on mobile
- ✅ No console errors

### If Tests Fail:

**API Errors:**
- Check if backend is running
- Check if database has data
- Check API endpoint paths
- Check authentication tokens

**Component Errors:**
- Check browser console for errors
- Check if API calls are working
- Check if data structure matches
- Check component props

---

## ✅ COMPLETION CHECKLIST

After testing, verify:
- [ ] All API endpoints tested
- [ ] All components tested
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Mobile responsive works
- [ ] Documentation updated

---

**Document Type:** Testing Guide  
**Version:** 1.0  
**Date:** October 23, 2025, 9:12 AM  
**Framework:** SPEC_DRIVEN_FRAMEWORK v1.21  
**Status:** Ready for Testing

---

*Let's test Week 4 features! 🧪*
