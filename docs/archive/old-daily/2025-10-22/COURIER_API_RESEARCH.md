# 🚚 COURIER API RESEARCH - OCTOBER 22, 2025

**Purpose:** Document findings from courier API investigation  
**Status:** 🔄 IN PROGRESS  
**Date:** October 22, 2025

---

## 📊 OVERVIEW

| Courier | Account Status | Auth Method | Tracking API | Booking API | Priority |
|---------|---------------|-------------|--------------|-------------|----------|
| PostNord | ⏳ Pending | API Key | ✅ Yes | ✅ Yes | 🔴 HIGH |
| Bring | ⏳ Pending | - | - | - | 🔴 HIGH |
| DHL Express | ⏳ Pending | - | - | - | 🟡 MEDIUM |
| UPS | ⏳ Pending | - | - | - | 🟡 MEDIUM |
| FedEx | ⏳ Pending | - | - | - | 🟡 MEDIUM |

---

## 🇸🇪 POSTNORD API

### **Account Registration**
- **Portal:** https://developer.postnord.com/
- **Registration Date:** October 22, 2025, 11:30 AM
- **Status:** ⏳ Pending approval
- **Approval Time:** TBD (typically 24-48 hours)
- **Account Type:** Developer Account
- **Contact:** kundintegration.se@postnord.com (24h response on weekdays)

### **Authentication**
- **Method:** API Key (Bearer token)
- **API Key Location:** Environment variable POSTNORD_API_KEY
- **Token Refresh:** Not required (static API key)
- **Rate Limits:** TBD (need to check documentation) 

### **Tracking API**
- **Base URL:** https://api2.postnord.com/rest
- **API Version:** v1 (default), v5 available
- **Endpoint:** `/business/v1/shipment/trackandtrace/findByIdentifier.json`
- **Method:** GET
- **Test Tracking Number:** 84971563697SE
- **Request Format:**
```bash
GET /business/v1/shipment/trackandtrace/findByIdentifier.json?id=84971563697SE
Headers:
  apikey: YOUR_API_KEY
  Accept: application/json
  locale: en
```
- **Response Format:**
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
- **Tracking Number Format:** Alphanumeric with country code (e.g., 84971563697SE)
- **Status Codes Available:** Multiple event statuses in events array
- **Real-time Updates:** ✅ Yes

### **Booking API**
- **Endpoint:** shipment-v3-booking-sao
- **Available:** ✅ Yes
- **Requirements:** API key, EDI data validation 

### **Label Generation**
- **Endpoint:** Part of Booking API
- **Format:** PDF, ZPL (likely)
- **Available:** ✅ Yes (via Booking API) 

### **Rate Calculation**
- **Endpoint:** GetTransitTimeInformation
- **Available:** ✅ Yes
- **Parameters Needed:** dateOfDeparture, serviceGroupCode, fromAddressPostalCode, fromAddressCountryCode, toAddressPostalCode, toAddressCountryCode, serviceCode 

### **Webhooks**
- **Available:** ❓ Unknown (need to check documentation)
- **Events:** TBD
- **Setup Process:** TBD 

### **Documentation Quality**
- **Rating:** ⭐⭐⭐⭐ (4/5 stars)
- **Examples:** ✅ Good - Test tracking numbers provided
- **Completeness:** ⚠️ Portal requires JavaScript, some docs hard to access
- **Notes:** Developer portal is modern but requires account access for full docs 

### **Integration Complexity**
- **Estimated Time:** 1-2 days for tracking, 2-3 days for full integration
- **Difficulty:** Medium
- **Dependencies:** API key, understanding of EDI data format for booking 

### **Costs**
- **Free Tier:** ❓ Unknown (need to check with PostNord)
- **Paid Plans:** Likely usage-based
- **Per-Request Cost:** TBD

### **Notes & Observations**
- ✅ PostNord is the largest Nordic courier (Sweden, Denmark, Norway, Finland)
- ✅ Modern REST API with JSON responses
- ✅ Good Ruby gem example available (apoex/postnord on GitHub)
- ⚠️ Moving from EDI file flow to API (deadline was May 2, 2024)
- ✅ 24-hour support response time on weekdays
- 📧 Contact: kundintegration.se@postnord.com
- 🔗 API Endpoint: https://api2.postnord.com/rest
- ✅ Multiple API versions available (v1, v3, v5)

---

## 🇳🇴 BRING API

### **Account Registration**
- **Portal:** https://developer.bring.com/
- **Registration Date:** 
- **Status:** ⏳ Pending approval
- **Approval Time:** 
- **Account Type:** 

### **Authentication**
- **Method:** 
- **API Key Location:** 
- **Token Refresh:** 
- **Rate Limits:** 

### **Tracking API**
- **Endpoint:** 
- **Method:** 
- **Request Format:**
```json
{
  // Add example request
}
```
- **Response Format:**
```json
{
  // Add example response
}
```
- **Tracking Number Format:** 
- **Status Codes Available:** 
- **Real-time Updates:** 

### **Booking API**
- **Endpoint:** 
- **Available:** 
- **Requirements:** 

### **Pickup Scheduling**
- **Endpoint:** 
- **Available:** 
- **Process:** 

### **Shipping Guide (Rates)**
- **Endpoint:** 
- **Available:** 
- **Parameters:** 

### **Label Generation**
- **Endpoint:** 
- **Format:** 
- **Available:** 

### **Webhooks**
- **Available:** 
- **Events:** 
- **Setup:** 

### **Documentation Quality**
- **Rating:** ⭐⭐⭐⭐⭐
- **Examples:** 
- **Completeness:** 
- **Notes:** 

### **Integration Complexity**
- **Estimated Time:** 
- **Difficulty:** 
- **Dependencies:** 

### **Costs**
- **Free Tier:** 
- **Paid Plans:** 
- **Per-Request Cost:** 

### **Notes & Observations**
- 
- 
- 

---

## 🌍 DHL EXPRESS API

### **Account Registration**
- **Portal:** https://developer.dhl.com/
- **Registration Date:** 
- **Status:** ⏳ Pending approval
- **Approval Time:** 
- **Account Type:** 

### **Authentication**
- **Method:** 
- **API Key:** 
- **Rate Limits:** 

### **Tracking API**
- **Endpoint:** 
- **Method:** 
- **Documentation:** 
- **Real-time:** 

### **Rating API**
- **Endpoint:** 
- **Available:** 
- **Parameters:** 

### **Shipping API**
- **Endpoint:** 
- **Available:** 
- **Label Format:** 

### **Documentation Quality**
- **Rating:** ⭐⭐⭐⭐⭐
- **Notes:** 

### **Integration Complexity**
- **Estimated Time:** 
- **Difficulty:** 

### **Costs**
- **Free Tier:** 
- **Pricing:** 

### **Notes & Observations**
- 
- 

---

## 🌍 UPS API

### **Account Registration**
- **Portal:** https://www.ups.com/upsdeveloperkit
- **Registration Date:** 
- **Status:** ⏳ Pending approval
- **Approval Time:** 

### **Authentication**
- **Method:** 
- **Credentials:** 
- **Rate Limits:** 

### **Tracking API**
- **Endpoint:** 
- **Documentation:** 
- **Real-time:** 

### **Rating API**
- **Endpoint:** 
- **Available:** 

### **Shipping API**
- **Endpoint:** 
- **Available:** 

### **Documentation Quality**
- **Rating:** ⭐⭐⭐⭐⭐
- **Notes:** 

### **Integration Complexity**
- **Estimated Time:** 
- **Difficulty:** 

### **Costs**
- **Free Tier:** 
- **Pricing:** 

### **Notes & Observations**
- 
- 

---

## 🌍 FEDEX API

### **Account Registration**
- **Portal:** https://developer.fedex.com/
- **Registration Date:** 
- **Status:** ⏳ Pending approval
- **Approval Time:** 

### **Authentication**
- **Method:** 
- **Credentials:** 
- **Rate Limits:** 

### **Tracking API**
- **Endpoint:** 
- **Documentation:** 
- **Real-time:** 

### **Rate API**
- **Endpoint:** 
- **Available:** 

### **Ship API**
- **Endpoint:** 
- **Available:** 

### **Documentation Quality**
- **Rating:** ⭐⭐⭐⭐⭐
- **Notes:** 

### **Integration Complexity**
- **Estimated Time:** 
- **Difficulty:** 

### **Costs**
- **Free Tier:** 
- **Pricing:** 

### **Notes & Observations**
- 
- 

---

## 📊 COMPARISON MATRIX

### **Feature Availability**

| Feature | PostNord | Bring | DHL | UPS | FedEx |
|---------|----------|-------|-----|-----|-------|
| Tracking API | - | - | - | - | - |
| Real-time Tracking | - | - | - | - | - |
| Booking API | - | - | - | - | - |
| Label Generation | - | - | - | - | - |
| Rate Calculation | - | - | - | - | - |
| Webhooks | - | - | - | - | - |
| Pickup Scheduling | - | - | - | - | - |

### **Integration Difficulty**

| Courier | Difficulty | Time Estimate | Priority |
|---------|-----------|---------------|----------|
| PostNord | - | - | 🔴 HIGH |
| Bring | - | - | 🔴 HIGH |
| DHL Express | - | - | 🟡 MEDIUM |
| UPS | - | - | 🟡 MEDIUM |
| FedEx | - | - | 🟡 MEDIUM |

### **Documentation Quality**

| Courier | Rating | Examples | Completeness |
|---------|--------|----------|--------------|
| PostNord | - | - | - |
| Bring | - | - | - |
| DHL Express | - | - | - |
| UPS | - | - | - |
| FedEx | - | - | - |

---

## 🎯 INTEGRATION ROADMAP

### **Phase 1: Core Tracking (Week 2)**
1. **PostNord** (2 days)
   - Tracking API
   - Status mapping
   - Webhook integration
   
2. **Bring** (2 days)
   - Tracking API
   - Status mapping
   - Webhook integration

3. **DHL/UPS/FedEx** (1 day)
   - Basic tracking only

### **Phase 2: Advanced Features (Week 3)**
- Label generation
- Rate calculation
- Booking API
- Pickup scheduling

### **Phase 3: Optimization (Week 4)**
- Webhook optimization
- Caching strategy
- Error handling
- Rate limiting

---

## 🚨 BLOCKERS & CHALLENGES

### **Identified Blockers:**
1. 
2. 
3. 

### **Technical Challenges:**
1. 
2. 
3. 

### **Business Challenges:**
1. 
2. 
3. 

---

## 💡 KEY INSIGHTS

### **What Works Well:**
- 
- 
- 

### **What's Difficult:**
- 
- 
- 

### **Surprises:**
- 
- 
- 

### **Recommendations:**
- 
- 
- 

---

## 📝 NEXT STEPS

### **Tomorrow (Oct 23):**
- [ ] Start PostNord integration
- [ ] Build tracking API wrapper
- [ ] Test with real tracking numbers
- [ ] Document integration

### **This Week:**
- [ ] Complete PostNord integration
- [ ] Complete Bring integration
- [ ] Basic DHL/UPS/FedEx tracking

---

## 📚 RESOURCES

### **PostNord:**
- Developer Portal: https://developer.postnord.com/
- Documentation: 
- Support: 

### **Bring:**
- Developer Portal: https://developer.bring.com/
- Documentation: 
- Support: 

### **DHL:**
- Developer Portal: https://developer.dhl.com/
- Documentation: 
- Support: 

### **UPS:**
- Developer Portal: https://www.ups.com/upsdeveloperkit
- Documentation: 
- Support: 

### **FedEx:**
- Developer Portal: https://developer.fedex.com/
- Documentation: 
- Support: 

---

**Last Updated:** October 22, 2025, 10:30 AM  
**Status:** 🔄 IN PROGRESS  
**Next Update:** End of day

---

## 📊 PROGRESS LOG

**10:30 AM** - Started courier API investigation  
**10:30 AM** - Creating API accounts...

---

*Fill in this document as you research each courier API*
