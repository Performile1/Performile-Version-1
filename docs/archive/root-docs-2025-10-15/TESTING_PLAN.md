# Performile v1.11 - Testing Plan

## Current Status
**Test Coverage:** 60% (manual testing only)  
**Automated Tests:** 0%  
**Goal:** 80% coverage with automated tests

---

## Testing Strategy

### Phase 1: Unit Tests (API Endpoints)
**Priority:** HIGH  
**Timeline:** 3 days  
**Coverage Target:** 70%

#### Tools
- **Framework:** Jest + Supertest
- **Mocking:** jest-mock
- **Database:** Test database or mocked queries

#### Endpoints to Test (Priority Order)

**Critical (Must Test):**
1. `/api/auth/login` - Authentication
2. `/api/auth/register` - User creation
3. `/api/orders` - Role-based filtering
4. `/api/trustscore/dashboard` - Dashboard metrics
5. `/api/courier/dashboard` - Courier data
6. `/api/subscriptions/current` - Subscription status

**High Priority:**
7. `/api/postal-codes/search` - Postal code lookup
8. `/api/postal-codes/radius` - Radius search
9. `/api/courier/analytics` - Performance metrics
10. `/api/tracking/summary` - Tracking data

**Medium Priority:**
11. All other GET endpoints
12. POST/PUT/DELETE endpoints

#### Test Template
```typescript
describe('GET /api/orders', () => {
  it('should return orders filtered by courier role', async () => {
    const token = generateTestToken({ role: 'courier', userId: 'test-courier-id' });
    const response = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(5); // Courier's orders only
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app).get('/api/orders');
    expect(response.status).toBe(401);
  });
});
```

---

### Phase 2: Integration Tests
**Priority:** HIGH  
**Timeline:** 2 days  
**Coverage Target:** Key user flows

#### User Flows to Test

**1. Courier Registration & Dashboard Flow**
```
1. Register as courier
2. Login
3. View dashboard (should show 0 orders initially)
4. Assign order to courier
5. Refresh dashboard (should show 1 order)
```

**2. Merchant Order Management Flow**
```
1. Login as merchant
2. View orders (should see only their store's orders)
3. Create new order
4. Assign courier
5. Track order status
```

**3. Admin Analytics Flow**
```
1. Login as admin
2. View platform-wide dashboard
3. Check all users' data visible
4. Verify metrics calculations
```

**4. Postal Code Proximity Flow**
```
1. Search postal code (not in cache)
2. Verify API fetch + cache
3. Search same postal code (should be cached)
4. Radius search
5. Verify nearby postal codes returned
```

---

### Phase 3: E2E Tests
**Priority:** MEDIUM  
**Timeline:** 2 days  
**Tool:** Playwright

#### Critical Paths

**1. Complete Order Lifecycle**
```
Merchant creates order → 
Assigns courier → 
Courier accepts → 
Updates tracking → 
Delivers → 
Customer reviews
```

**2. Subscription Management**
```
User views plans → 
Selects plan → 
Enters payment → 
Subscription active → 
View features → 
Upgrade plan
```

---

### Phase 4: Performance Tests
**Priority:** MEDIUM  
**Timeline:** 1 day  
**Tool:** k6 or Artillery

#### Load Tests

**1. API Endpoint Performance**
- Target: < 200ms response time
- Load: 100 concurrent users
- Duration: 5 minutes

**2. Database Query Performance**
- Orders list: < 100ms
- Dashboard metrics: < 200ms
- Radius search: < 150ms

**3. Postal Code API**
- Cache hit: < 10ms
- Cache miss (API call): < 500ms

---

### Phase 5: Security Tests
**Priority:** HIGH  
**Timeline:** 1 day

#### Tests

**1. Authentication**
- [ ] Invalid JWT rejected
- [ ] Expired JWT rejected
- [ ] Role-based access enforced
- [ ] SQL injection prevented
- [ ] XSS prevented

**2. Authorization**
- [ ] Courier cannot see other courier's orders
- [ ] Merchant cannot see other merchant's data
- [ ] Non-admin cannot access admin endpoints

**3. Input Validation**
- [ ] Malformed requests rejected
- [ ] SQL injection attempts blocked
- [ ] File upload validation

---

## Test Data Strategy

### Test Database
**Approach:** Separate test database with seed data

**Seed Data:**
- 4 test users (admin, merchant, courier, consumer)
- 2 stores
- 11 couriers
- 20 orders
- 50 postal codes

**Reset Strategy:** 
- Reset database before each test suite
- Use transactions for individual tests

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Run unit tests
        run: npm test
      - name: Run integration tests
        run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## Success Metrics

### Coverage Targets
- **Unit Tests:** 70% code coverage
- **Integration Tests:** All critical flows covered
- **E2E Tests:** 5 critical paths automated
- **Performance:** All endpoints < 200ms
- **Security:** All OWASP Top 10 tested

### Timeline
- **Week 1:** Unit tests (Phase 1)
- **Week 2:** Integration + E2E tests (Phase 2-3)
- **Week 3:** Performance + Security tests (Phase 4-5)

---

## Next Steps

1. ✅ Set up Jest + Supertest
2. ✅ Create test database
3. ✅ Write first 10 unit tests
4. ✅ Set up CI/CD pipeline
5. ✅ Achieve 70% coverage
