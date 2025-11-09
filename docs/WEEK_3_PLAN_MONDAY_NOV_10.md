# 📅 WEEK 3 - DAY 1: MONDAY, NOVEMBER 10, 2025

**Date:** Monday, November 10, 2025  
**Day:** Week 3, Day 1  
**Time:** 9:00 AM - 5:00 PM (8 hours)  
**Goal:** Complete Dynamic Ranking + Shipment Booking

---

## 🎯 TODAY'S OBJECTIVES

### **PRIMARY GOALS (MUST COMPLETE):**
1. ✅ Dynamic Courier Ranking System (3 hours)
2. ✅ Shipment Booking API (3 hours)

### **SECONDARY GOALS (IF TIME):**
3. ⏳ Testing & Documentation (2 hours)

---

## 📋 DETAILED TASK BREAKDOWN

### **TASK 1: DYNAMIC COURIER RANKING (9 AM - 12 PM)**
**Time:** 3 hours  
**Priority:** CRITICAL  
**Status:** ⏳ NOT STARTED

#### **Subtasks:**

**9:00 AM - 10:00 AM: Database Setup**
- [ ] Create `courier_ranking_scores` table
- [ ] Create `courier_ranking_history` table
- [ ] Add indexes for performance
- [ ] Test table creation

**Files to Create:**
```
database/migrations/create_courier_ranking_tables.sql
```

**SQL Schema:**
```sql
CREATE TABLE courier_ranking_scores (
  ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  postal_code VARCHAR(10),
  ranking_score DECIMAL(5,2),
  performance_score DECIMAL(5,2),
  conversion_score DECIMAL(5,2),
  activity_score DECIMAL(5,2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(courier_id, postal_code)
);

CREATE TABLE courier_ranking_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(courier_id),
  postal_code VARCHAR(10),
  ranking_score DECIMAL(5,2),
  position INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ranking_courier_postal ON courier_ranking_scores(courier_id, postal_code);
CREATE INDEX idx_ranking_score ON courier_ranking_scores(ranking_score DESC);
CREATE INDEX idx_history_courier ON courier_ranking_history(courier_id);
```

---

**10:00 AM - 11:30 AM: Ranking Calculation Function**
- [ ] Create `calculate_courier_ranking_score()` function
- [ ] Implement performance metrics (50% weight)
- [ ] Implement conversion metrics (30% weight)
- [ ] Implement activity metrics (20% weight)
- [ ] Test with sample data

**Files to Create:**
```
database/functions/calculate_courier_ranking.sql
```

**Function Logic:**
```sql
CREATE OR REPLACE FUNCTION calculate_courier_ranking_score(
  p_courier_id UUID,
  p_postal_code VARCHAR(10)
) RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_performance_score DECIMAL(5,2);
  v_conversion_score DECIMAL(5,2);
  v_activity_score DECIMAL(5,2);
  v_final_score DECIMAL(5,2);
BEGIN
  -- Performance (50%): trust_score, on_time_rate, avg_delivery_days
  -- Conversion (30%): selection_rate, position_performance
  -- Activity (20%): recent_performance, activity_level
  
  -- Calculate and return weighted score
  RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;
```

---

**11:30 AM - 12:00 PM: API Integration**
- [ ] Update `/api/couriers/ratings-by-postal` endpoint
- [ ] Replace static ORDER BY with dynamic ranking
- [ ] Add caching for performance
- [ ] Test API response

**Files to Modify:**
```
apps/api/couriers/ratings-by-postal.ts
```

**Success Criteria:**
- ✅ Tables created and indexed
- ✅ Function calculates scores correctly
- ✅ API returns ranked couriers
- ✅ Performance < 200ms

---

### **LUNCH BREAK (12:00 PM - 1:00 PM)**
- Take a real break
- Eat lunch
- Walk outside
- Don't think about code

---

### **TASK 2: SHIPMENT BOOKING API (1 PM - 4 PM)**
**Time:** 3 hours  
**Priority:** CRITICAL  
**Status:** ⏳ NOT STARTED

#### **Subtasks:**

**1:00 PM - 2:00 PM: Database Schema**
- [ ] Create `shipment_bookings` table
- [ ] Create `booking_status` enum
- [ ] Add foreign keys and constraints
- [ ] Test schema

**Files to Create:**
```
database/migrations/create_shipment_bookings.sql
```

**SQL Schema:**
```sql
CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'cancelled',
  'failed'
);

CREATE TABLE shipment_bookings (
  booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(order_id),
  courier_id UUID REFERENCES couriers(courier_id),
  tracking_number VARCHAR(100) UNIQUE,
  booking_reference VARCHAR(100),
  status booking_status DEFAULT 'pending',
  pickup_date DATE,
  delivery_date DATE,
  booking_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_booking_order ON shipment_bookings(order_id);
CREATE INDEX idx_booking_courier ON shipment_bookings(courier_id);
CREATE INDEX idx_booking_tracking ON shipment_bookings(tracking_number);
```

---

**2:00 PM - 3:30 PM: Booking API Endpoint**
- [ ] Create `/api/shipments/book` endpoint
- [ ] Implement booking logic
- [ ] Add error handling
- [ ] Add webhook support
- [ ] Test with mock data

**Files to Create:**
```
apps/api/shipments/book.ts
```

**API Structure:**
```typescript
// POST /api/shipments/book
interface BookingRequest {
  order_id: string;
  courier_id: string;
  pickup_date: string;
  delivery_date: string;
  service_level: string;
}

interface BookingResponse {
  booking_id: string;
  tracking_number: string;
  status: 'confirmed' | 'pending' | 'failed';
  estimated_delivery: string;
}
```

---

**3:30 PM - 4:00 PM: Integration Testing**
- [ ] Test booking flow end-to-end
- [ ] Test error scenarios
- [ ] Test webhook delivery
- [ ] Document API

**Test Scenarios:**
1. Successful booking
2. Courier unavailable
3. Invalid order
4. Network error
5. Webhook failure

**Success Criteria:**
- ✅ Booking API works
- ✅ Tracking number generated
- ✅ Status updates correctly
- ✅ Webhooks fire
- ✅ Error handling works

---

### **TASK 3: DOCUMENTATION (4 PM - 5 PM)**
**Time:** 1 hour  
**Priority:** MEDIUM  
**Status:** ⏳ NOT STARTED

- [ ] Document ranking algorithm
- [ ] Document booking API
- [ ] Update API documentation
- [ ] Create developer guide

**Files to Create/Update:**
```
docs/DYNAMIC_RANKING_GUIDE.md
docs/SHIPMENT_BOOKING_API.md
docs/API_REFERENCE.md (update)
```

---

## 📊 SUCCESS METRICS

### **End of Day Checklist:**
- [ ] Dynamic ranking system deployed
- [ ] Couriers ranked by performance
- [ ] Shipment booking API working
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No critical bugs

### **Quality Targets:**
- API response time: < 200ms
- Test coverage: > 80%
- Error rate: < 1%
- Documentation: Complete

---

## 🚨 BLOCKERS & RISKS

### **Potential Issues:**
1. **Database Performance**
   - Risk: Ranking calculation too slow
   - Mitigation: Add caching, optimize queries

2. **Courier API Integration**
   - Risk: External API down
   - Mitigation: Mock responses for testing

3. **Time Overrun**
   - Risk: Tasks take longer than estimated
   - Mitigation: Skip documentation if needed

---

## 📝 NOTES & REMINDERS

### **Before Starting:**
- [ ] Fresh coffee ☕
- [ ] Clear workspace
- [ ] Close distractions
- [ ] Review requirements

### **During Work:**
- [ ] Take breaks every hour
- [ ] Test as you go
- [ ] Commit frequently
- [ ] Ask for help if stuck

### **End of Day:**
- [ ] Commit all changes
- [ ] Push to GitHub
- [ ] Update progress tracker
- [ ] Plan Tuesday's work

---

## 🎯 TOMORROW (TUESDAY, NOV 11)

**Preview of Next Tasks:**
- Label Generation API (3 hours)
- Real-Time Tracking Integration (3 hours)
- Testing & Polish (2 hours)

---

**Status:** ⏳ **READY TO START MONDAY 9 AM**  
**Estimated Completion:** 90% (if all goes well)  
**Backup Plan:** Skip documentation if time runs out

**Let's crush it Monday!** 💪
