# Performile Platform - Data Sources

**Last Updated:** October 7, 2025, 21:17  
**Status:** All pages use real database data via API endpoints

---

## 📊 **DATA SOURCE SUMMARY**

### ✅ **ALL PAGES USE REAL DATABASE DATA**

Every page in the platform fetches live data from PostgreSQL via API endpoints. **No mock data is used.**

---

## 🗄️ **DATA SOURCES BY PAGE**

### **1. Dashboard** ✅ Real Data
- **API:** `GET /api/trustscore/dashboard`
- **Database Tables:** 
  - `users` (couriers, merchants)
  - `orders`
  - `reviews`
  - `trustscores`
- **Data:**
  - Total couriers
  - Average TrustScore
  - Total orders processed
  - Total reviews
  - Top performing couriers
- **Refresh:** Every 30 seconds

---

### **2. TrustScores** ✅ Real Data
- **API:** `GET /api/trustscore?search={term}`
- **Database Tables:**
  - `trustscores`
  - `users` (couriers)
  - `reviews`
- **Data:**
  - Courier TrustScores (0-100)
  - Performance metrics
  - Review counts
  - Historical trends
- **Refresh:** Every 60 seconds

---

### **3. Analytics** ✅ Real Data
- **API:** 
  - Admin: `GET /api/admin/analytics`
  - Merchant: `GET /api/analytics/merchant`
  - Courier: `GET /api/analytics/courier`
- **Database Tables:**
  - `orders`
  - `reviews`
  - `trustscores`
  - `deliveries`
- **Data:**
  - Delivery performance trends
  - Revenue analytics
  - Customer satisfaction
  - Courier performance
  - Time-series data
- **Refresh:** On demand

---

### **4. Merchant Management** ✅ Real Data
- **API:** `GET /api/admin/users?role=merchant&status={status}`
- **Database Tables:**
  - `users` (role='merchant')
  - `subscriptions`
  - `orders`
- **Data:**
  - All merchant accounts
  - Subscription status
  - Order counts
  - Account details
- **Actions:** Create, update, suspend, delete

---

### **5. Courier Management** ✅ Real Data
- **API:** `GET /api/admin/users?role=courier&status={status}`
- **Database Tables:**
  - `users` (role='courier')
  - `trustscores`
  - `reviews`
  - `orders`
- **Data:**
  - All courier accounts
  - TrustScores
  - Performance metrics
  - Verification status
- **Actions:** Approve, suspend, update

---

### **6. Orders** ✅ Real Data
- **API:** 
  - Admin: `GET /api/admin/orders`
  - Merchant: `GET /api/orders`
  - Courier: `GET /api/orders`
- **Database Tables:**
  - `orders`
  - `users` (merchants, couriers)
  - `tracking_data`
- **Data:**
  - All orders with full details
  - Tracking information
  - Status updates
  - Delivery history
- **Refresh:** Real-time updates

---

### **7. Tracking System** ✅ Real Data
- **API:** 
  - `GET /api/tracking/{trackingNumber}`
  - `GET /api/tracking/summary`
- **Database Tables:**
  - `tracking_data`
  - `tracking_events`
  - `orders`
- **Data:**
  - Real-time tracking from courier APIs
  - Event timeline
  - Delivery status
  - Location updates
- **Source:** Live courier APIs (PostNord, DHL, Bring, Budbee)

---

### **8. Claims Management** ✅ Real Data
- **API:** 
  - `GET /api/claims`
  - `POST /api/claims`
  - `POST /api/claims/submit`
- **Database Tables:**
  - `claims`
  - `claim_timeline`
  - `claim_templates`
  - `claim_documents`
- **Data:**
  - All filed claims
  - Claim status
  - Timeline events
  - Documents
- **Actions:** Create, update, submit, track

---

### **9. Reviews** ✅ Real Data
- **API:** `GET /api/reviews`
- **Database Tables:**
  - `reviews`
  - `users` (couriers, consumers)
  - `orders`
- **Data:**
  - All reviews and ratings
  - Review text
  - Ratings (1-5 stars)
  - Timestamps
- **Source:** Customer submissions + automated requests

---

### **10. Subscriptions** ✅ Real Data
- **API:** `GET /api/admin/subscriptions`
- **Database Tables:**
  - `subscriptions`
  - `subscription_plans`
  - `users`
  - `stripe_customers`
- **Data:**
  - Active subscriptions
  - Plan details
  - Billing information
  - Usage limits
- **Integration:** Stripe API

---

### **11. Team Management** ✅ Real Data
- **API:** 
  - `GET /api/team`
  - `POST /api/team/invite`
- **Database Tables:**
  - `team_members`
  - `team_invitations`
  - `users`
- **Data:**
  - Team members
  - Roles and permissions
  - Invitation status
- **Actions:** Invite, remove, update roles

---

### **12. Messaging** ✅ Real Data
- **API:** `GET /api/messages/conversations`
- **Database Tables:**
  - `conversations`
  - `conversation_participants`
  - `messages`
- **Data:**
  - Conversations
  - Messages
  - Participants
  - Read status
- **Real-time:** Pusher WebSocket integration

---

## 🔄 **DATA FLOW**

```
User Action
    ↓
React Component
    ↓
React Query (useQuery/useMutation)
    ↓
API Client (axios)
    ↓
Vercel Serverless Function
    ↓
PostgreSQL Database
    ↓
Return Data
    ↓
React Query Cache
    ↓
UI Update
```

---

## 📈 **DATA REFRESH RATES**

| Page | Refresh Interval | Method |
|------|-----------------|--------|
| Dashboard | 30 seconds | Auto-refresh |
| TrustScores | 60 seconds | Auto-refresh |
| Analytics | On demand | Manual refresh |
| Orders | Real-time | WebSocket + polling |
| Tracking | 5 minutes | Cached API calls |
| Claims | On demand | Manual refresh |
| Reviews | On demand | Manual refresh |

---

## 🎯 **DATA CONSISTENCY**

### **Single Source of Truth:**
- All data comes from PostgreSQL database
- No duplicate data sources
- No mock data anywhere

### **Cache Strategy:**
- React Query handles client-side caching
- 5-minute cache for tracking data
- Instant invalidation on mutations

### **Real-time Updates:**
- WebSocket for messages
- Polling for orders
- Auto-refresh for dashboards

---

## 🔐 **DATA SECURITY**

### **Access Control:**
- Role-based API endpoints
- JWT authentication on all requests
- User-specific data filtering

### **Data Isolation:**
- Merchants see only their data
- Couriers see only assigned orders
- Admins see everything

---

## ✅ **VERIFICATION**

**To verify all data is real:**

1. Check any page source code - all use `apiClient.get()` or `axios.get()`
2. Open browser DevTools → Network tab
3. See actual API calls to `/api/*` endpoints
4. Check database - all tables have real data
5. No `mockData` or `dummyData` variables anywhere

---

**CONFIRMED: 100% of platform data comes from real database via API endpoints.** ✅

