# 🚚 COMPLETE COURIER API INTEGRATION MATRIX

**Date:** October 22, 2025  
**Purpose:** Comprehensive step-by-step guide for integrating ALL Nordic courier APIs  
**Status:** 🔄 IN PROGRESS

---

## 📊 COURIER PRIORITY LIST

### **Tier 1: MUST HAVE** (Week 2-3)
1. 🇸🇪 **PostNord** - Nordic leader (Sweden, Denmark, Norway, Finland)
2. 🇳🇴 **Bring** - Norway leader (Posten Norge)
3. 🇸🇪 **Budbee** - Urban delivery specialist
4. 🇸🇪 **Instabox** - Parcel locker network

### **Tier 2: SHOULD HAVE** (Week 4-5)
5. 🌍 **DHL Express** - International leader
6. 🇸🇪 **DB Schenker** - Logistics & freight
7. 🇸🇪 **Earlybird** - Same-day delivery
8. 🇸🇪 **Airmee** - Urban last-mile

---

## 🎯 API CATEGORIES TO INTEGRATE

### **Core APIs (Priority 1):**
1. ✅ **Tracking API** - Real-time shipment tracking
2. ✅ **Booking API** - Create shipments
3. ✅ **Print/Label API** - Generate shipping labels
4. ✅ **Claims API** - Handle damage/loss claims

### **Essential APIs (Priority 2):**
5. ✅ **Rate/Quote API** - Get shipping rates
6. ✅ **Pickup API** - Schedule courier pickups
7. ✅ **Webhook API** - Real-time status updates
8. ✅ **Service Points API** - Find parcel lockers/pickup points

### **Advanced APIs (Priority 3):**
9. ✅ **Address Validation API** - Verify delivery addresses
10. ✅ **Transit Time API** - Estimate delivery times
11. ✅ **TA Sync API** - Transport Administrator integration (EDI/API)
12. ✅ **Returns API** - Handle return shipments

---

## 📋 COMPLETE API MATRIX

| Courier | Tracking | Booking | Label | Claims | Rate | Pickup | Webhook | Points | TA Sync | Priority |
|---------|----------|---------|-------|--------|------|--------|---------|--------|---------|----------|
| **PostNord** | ✅ | ✅ | ✅ | ❓ | ✅ | ❓ | ❓ | ✅ | ✅ | 🔴 HIGH |
| **Bring** | - | - | - | - | - | - | - | - | - | 🔴 HIGH |
| **Budbee** | - | - | - | - | - | - | - | - | - | 🔴 HIGH |
| **Instabox** | - | - | - | - | - | - | - | - | - | 🔴 HIGH |
| **DHL Express** | - | - | - | - | - | - | - | - | - | 🟡 MEDIUM |
| **DB Schenker** | - | - | - | - | - | - | - | - | - | 🟡 MEDIUM |
| **Earlybird** | - | - | - | - | - | - | - | - | - | 🟢 LOW |
| **Airmee** | - | - | - | - | - | - | - | - | - | 🟢 LOW |

---

## 🇸🇪 1. POSTNORD (Sweden, Denmark, Norway, Finland)

### **Company Info**
- **Website:** https://www.postnord.com/
- **Developer Portal:** https://developer.postnord.com/
- **Market:** Nordic region (SE, DK, NO, FI)
- **Type:** National postal service
- **Contact:** kundintegration.se@postnord.com

### **Account Setup**
- [ ] Register at https://developer.postnord.com/
- [ ] Request API access
- [ ] Wait for approval (24-48 hours)
- [ ] Receive API key
- [ ] Test with sandbox environment

### **API 1: Tracking API** ✅
- **Status:** ✅ Available
- **Endpoint:** `https://api2.postnord.com/rest/business/v1/shipment/trackandtrace/findByIdentifier.json`
- **Method:** GET
- **Auth:** API Key (header: `apikey`)
- **Test Number:** 84971563697SE
- **Request:**
```bash
GET /business/v1/shipment/trackandtrace/findByIdentifier.json?id=84971563697SE
Headers:
  apikey: YOUR_API_KEY
  Accept: application/json
```
- **Response:**
```json
{
  "TrackingInformationResponse": {
    "shipments": [{
      "shipmentId": "84971563697SE",
      "deliveryDate": "2024-04-05",
      "events": []
    }]
  }
}
```
- **Integration Time:** 1-2 days
- **Difficulty:** Medium

### **API 2: Booking API** ✅
- **Status:** ✅ Available
- **Endpoint:** shipment-v3-booking-sao
- **Method:** POST
- **Auth:** API Key
- **Features:** Create shipments, validate EDI data
- **Integration Time:** 2-3 days
- **Difficulty:** Medium-Hard

### **API 3: Print/Label API** ✅
- **Status:** ✅ Available (via Booking API)
- **Format:** PDF, ZPL
- **Integration Time:** 1 day (after booking API)
- **Difficulty:** Easy

### **API 4: Claims API** ❓
- **Status:** ❓ Unknown
- **Action:** Contact PostNord support
- **Alternative:** Manual claims process

### **API 5: Rate/Quote API** ✅
- **Status:** ✅ Available
- **Endpoint:** GetTransitTimeInformation
- **Method:** POST
- **Parameters:** Postal codes, service code, date
- **Integration Time:** 1 day
- **Difficulty:** Easy

### **API 6: Pickup API** ❓
- **Status:** ❓ Unknown
- **Action:** Check documentation

### **API 7: Webhook API** ❓
- **Status:** ❓ Unknown
- **Action:** Check documentation
- **Alternative:** Polling tracking API

### **API 8: Service Points API** ✅
- **Status:** ✅ Available (likely)
- **Action:** Check parcel point documentation

### **API 9: TA Sync API** ✅
- **Status:** ✅ Available
- **Method:** EDI → API migration (completed May 2024)
- **Format:** API-based EDI data exchange
- **Integration Time:** 3-4 days
- **Difficulty:** Hard

### **PostNord Integration Roadmap**
**Week 1:**
- [ ] Day 1-2: Tracking API
- [ ] Day 3-4: Rate/Quote API
- [ ] Day 5: Service Points API

**Week 2:**
- [ ] Day 1-3: Booking API
- [ ] Day 4: Print/Label API
- [ ] Day 5: Testing

**Week 3:**
- [ ] Day 1-3: TA Sync API
- [ ] Day 4-5: Webhooks (if available)

---

## 🇳🇴 2. BRING (Norway - Posten Norge)

### **Company Info**
- **Website:** https://www.bring.com/
- **Developer Portal:** https://developer.bring.com/
- **Market:** Norway (primary), Nordic region
- **Type:** National postal service
- **Contact:** TBD

### **Account Setup**
- [ ] Register at https://developer.bring.com/
- [ ] Request API access
- [ ] Wait for approval
- [ ] Receive API credentials
- [ ] Test with sandbox

### **API 1: Tracking API**
- **Status:** ❓ To be researched
- **Endpoint:** TBD
- **Method:** TBD
- **Auth:** TBD
- **Integration Time:** TBD
- **Difficulty:** TBD

### **API 2: Booking API**
- **Status:** ❓ To be researched
- **Endpoint:** TBD
- **Integration Time:** TBD

### **API 3: Print/Label API**
- **Status:** ❓ To be researched
- **Format:** TBD

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API** (Shipping Guide)
- **Status:** ❓ To be researched
- **Known:** Bring has "Shipping Guide API"

### **API 6: Pickup API**
- **Status:** ❓ To be researched
- **Known:** Bring offers pickup scheduling

### **API 7: Webhook API**
- **Status:** ❓ To be researched

### **API 8: Service Points API**
- **Status:** ❓ To be researched
- **Known:** Bring has extensive parcel shop network

### **API 9: TA Sync API**
- **Status:** ❓ To be researched

### **Bring Integration Roadmap**
**Week 2:**
- [ ] Day 1-2: Tracking API
- [ ] Day 3-4: Booking API
- [ ] Day 5: Rate/Quote API

---

## 🇸🇪 3. BUDBEE (Sweden - Urban Delivery)

### **Company Info**
- **Website:** https://www.budbee.com/
- **Developer Portal:** TBD
- **Market:** Sweden, Finland, Netherlands, Belgium
- **Type:** Urban delivery specialist
- **Specialty:** Home delivery, evening delivery
- **Contact:** TBD

### **Account Setup**
- [ ] Find developer portal
- [ ] Register for API access
- [ ] Request credentials
- [ ] Test environment setup

### **API 1: Tracking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (core feature)

### **API 2: Booking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 3: Print/Label API**
- **Status:** ❓ To be researched

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API**
- **Status:** ❓ To be researched

### **API 6: Pickup API**
- **Status:** ❓ To be researched

### **API 7: Webhook API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (real-time updates important)

### **API 8: Service Points API**
- **Status:** ❓ To be researched
- **Note:** Budbee focuses on home delivery, may not have service points

### **API 9: TA Sync API**
- **Status:** ❓ To be researched

### **Budbee Integration Roadmap**
**Week 3:**
- [ ] Day 1-2: Research & account setup
- [ ] Day 3-4: Tracking API
- [ ] Day 5: Booking API

---

## 🇸🇪 4. INSTABOX (Sweden - Parcel Lockers)

### **Company Info**
- **Website:** https://www.instabox.se/
- **Developer Portal:** TBD
- **Market:** Sweden, Norway
- **Type:** Parcel locker network
- **Specialty:** Automated parcel lockers
- **Contact:** TBD

### **Account Setup**
- [ ] Find developer portal
- [ ] Register for API access
- [ ] Request credentials
- [ ] Test environment setup

### **API 1: Tracking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 2: Booking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 3: Print/Label API**
- **Status:** ❓ To be researched

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API**
- **Status:** ❓ To be researched

### **API 6: Pickup API**
- **Status:** ❓ To be researched
- **Note:** May not be relevant for locker-based delivery

### **API 7: Webhook API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (locker status updates)

### **API 8: Service Points API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 CRITICAL (core feature - locker locations)

### **API 9: TA Sync API**
- **Status:** ❓ To be researched

### **Instabox Integration Roadmap**
**Week 3:**
- [ ] Day 1-2: Research & account setup
- [ ] Day 3: Service Points API (critical)
- [ ] Day 4: Tracking API
- [ ] Day 5: Booking API

---

## 🌍 5. DHL EXPRESS (International)

### **Company Info**
- **Website:** https://www.dhl.com/
- **Developer Portal:** https://developer.dhl.com/
- **Market:** Global (220+ countries)
- **Type:** International express courier
- **Contact:** TBD

### **Account Setup**
- [ ] Register at https://developer.dhl.com/
- [ ] Request API access
- [ ] Receive credentials
- [ ] Test environment setup

### **API 1: Tracking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 2: Booking API** (Shipping API)
- **Status:** ❓ To be researched

### **API 3: Print/Label API**
- **Status:** ❓ To be researched

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API** (Rating API)
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (international rates important)

### **API 6: Pickup API**
- **Status:** ❓ To be researched

### **API 7: Webhook API**
- **Status:** ❓ To be researched

### **API 8: Service Points API**
- **Status:** ❓ To be researched

### **API 9: TA Sync API**
- **Status:** ❓ To be researched

### **DHL Integration Roadmap**
**Week 4:**
- [ ] Day 1-2: Tracking API
- [ ] Day 3: Rate/Quote API
- [ ] Day 4-5: Booking API

---

## 🇸🇪 6. DB SCHENKER (Sweden - Logistics)

### **Company Info**
- **Website:** https://www.dbschenker.com/
- **Developer Portal:** TBD
- **Market:** Global logistics
- **Type:** Freight & logistics
- **Specialty:** B2B, large shipments
- **Contact:** TBD

### **Account Setup**
- [ ] Find developer portal
- [ ] Register for API access
- [ ] Request credentials
- [ ] Test environment setup

### **API 1: Tracking API**
- **Status:** ❓ To be researched

### **API 2: Booking API**
- **Status:** ❓ To be researched

### **API 3: Print/Label API**
- **Status:** ❓ To be researched

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API**
- **Status:** ❓ To be researched

### **API 6: Pickup API**
- **Status:** ❓ To be researched

### **API 7: Webhook API**
- **Status:** ❓ To be researched

### **API 8: Service Points API**
- **Status:** ❓ To be researched

### **API 9: TA Sync API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (B2B integration important)

### **Schenker Integration Roadmap**
**Week 5:**
- [ ] Day 1-2: Research & account setup
- [ ] Day 3-4: Tracking API
- [ ] Day 5: Booking API

---

## 🇸🇪 7. EARLYBIRD (Sweden - Same-Day Delivery)

### **Company Info**
- **Website:** https://www.earlybird.se/
- **Developer Portal:** TBD
- **Market:** Sweden (Stockholm, Gothenburg, Malmö)
- **Type:** Same-day delivery
- **Specialty:** Express urban delivery
- **Contact:** TBD

### **Account Setup**
- [ ] Find developer portal or contact sales
- [ ] Register for API access
- [ ] Request credentials
- [ ] Test environment setup

### **API 1: Tracking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (real-time tracking critical)

### **API 2: Booking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 3: Print/Label API**
- **Status:** ❓ To be researched

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API**
- **Status:** ❓ To be researched

### **API 6: Pickup API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH (same-day pickup scheduling)

### **API 7: Webhook API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 CRITICAL (real-time updates essential)

### **API 8: Service Points API**
- **Status:** ❓ To be researched
- **Note:** May not be relevant for direct delivery

### **API 9: TA Sync API**
- **Status:** ❓ To be researched

### **Earlybird Integration Roadmap**
**Week 6:**
- [ ] Day 1: Research & account setup
- [ ] Day 2-3: Tracking API + Webhooks
- [ ] Day 4-5: Booking API + Pickup API

---

## 🇸🇪 8. AIRMEE (Sweden - Urban Last-Mile)

### **Company Info**
- **Website:** https://www.airmee.com/
- **Developer Portal:** TBD
- **Market:** Sweden (Stockholm, Gothenburg, Malmö)
- **Type:** Urban last-mile delivery
- **Specialty:** Same-day, scheduled delivery
- **Contact:** TBD

### **Account Setup**
- [ ] Find developer portal or contact sales
- [ ] Register for API access
- [ ] Request credentials
- [ ] Test environment setup

### **API 1: Tracking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 2: Booking API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 3: Print/Label API**
- **Status:** ❓ To be researched

### **API 4: Claims API**
- **Status:** ❓ To be researched

### **API 5: Rate/Quote API**
- **Status:** ❓ To be researched

### **API 6: Pickup API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 7: Webhook API**
- **Status:** ❓ To be researched
- **Priority:** 🔴 HIGH

### **API 8: Service Points API**
- **Status:** ❓ To be researched

### **API 9: TA Sync API**
- **Status:** ❓ To be researched

### **Airmee Integration Roadmap**
**Week 6:**
- [ ] Day 1: Research & account setup
- [ ] Day 2-3: Tracking API
- [ ] Day 4-5: Booking API

---

## 🎯 OVERALL INTEGRATION TIMELINE

### **Week 1: Research & Setup** (Oct 22-28)
- [ ] Create all courier API accounts
- [ ] Research all APIs
- [ ] Complete this matrix
- [ ] Prioritize integrations

### **Week 2: PostNord Integration** (Oct 29 - Nov 4)
- [ ] Tracking API
- [ ] Rate/Quote API
- [ ] Service Points API
- [ ] Booking API
- [ ] Label API

### **Week 3: Bring Integration** (Nov 5-11)
- [ ] Tracking API
- [ ] Booking API
- [ ] Rate/Quote API
- [ ] Service Points API

### **Week 4: Budbee + Instabox** (Nov 12-18)
- [ ] Budbee: Tracking + Booking
- [ ] Instabox: Service Points + Tracking + Booking

### **Week 5: DHL + Schenker** (Nov 19-25)
- [ ] DHL: Tracking + Rate/Quote
- [ ] Schenker: Tracking + Booking

### **Week 6: Earlybird + Airmee** (Nov 26 - Dec 2)
- [ ] Earlybird: Tracking + Booking + Webhooks
- [ ] Airmee: Tracking + Booking

---

## 📊 API IMPLEMENTATION CHECKLIST

For each courier and each API, complete:

### **Research Phase:**
- [ ] Find developer portal
- [ ] Review documentation
- [ ] Understand authentication
- [ ] Note rate limits
- [ ] Get test credentials
- [ ] Find test data (tracking numbers, etc.)

### **Development Phase:**
- [ ] Create service class
- [ ] Implement authentication
- [ ] Build API wrapper
- [ ] Add error handling
- [ ] Add response parsing
- [ ] Add logging
- [ ] Write unit tests

### **Integration Phase:**
- [ ] Connect to database
- [ ] Map statuses
- [ ] Store tracking events
- [ ] Update orders
- [ ] Add to admin panel
- [ ] Add to merchant dashboard

### **Testing Phase:**
- [ ] Test with sandbox data
- [ ] Test with real data
- [ ] Test error scenarios
- [ ] Test rate limits
- [ ] Performance testing
- [ ] User acceptance testing

### **Deployment Phase:**
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Document for users

---

## 🔑 KEY QUESTIONS TO ANSWER FOR EACH COURIER

1. **Authentication:**
   - API key, OAuth, or other?
   - How to refresh tokens?
   - Rate limits?

2. **Tracking:**
   - Real-time or delayed?
   - Webhook support?
   - Status codes available?

3. **Booking:**
   - Required fields?
   - Validation rules?
   - Label generation included?

4. **Costs:**
   - Free tier available?
   - Per-request costs?
   - Volume discounts?

5. **Support:**
   - Documentation quality?
   - Support channels?
   - Response time?

6. **TA Sync:**
   - EDI support?
   - API-based sync?
   - Real-time or batch?

---

## 📝 NEXT ACTIONS

**Today (Oct 22):**
- [x] Complete PostNord research
- [ ] Research Bring API
- [ ] Research Budbee API
- [ ] Research Instabox API
- [ ] Research DHL API
- [ ] Research Schenker API
- [ ] Research Earlybird API
- [ ] Research Airmee API

**Tomorrow (Oct 23):**
- [ ] Start PostNord integration
- [ ] Build tracking API wrapper
- [ ] Test with real tracking numbers

**This Week:**
- [ ] Complete PostNord integration
- [ ] Start Bring integration

---

**Created:** October 22, 2025, 11:35 AM  
**Last Updated:** October 22, 2025, 11:35 AM  
**Status:** 🔄 IN PROGRESS  
**Completion:** 12.5% (1/8 couriers researched)

---

# 🎯 THIS IS YOUR COMPLETE ROADMAP TO COURIER INTEGRATION!
