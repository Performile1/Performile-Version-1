# CONSUMER APP - WEEKEND PREPARATION

**Date:** November 8-9, 2025  
**Purpose:** Prepare Consumer Delivery Tracking App (Week 4 feature)  
**Original Plan:** Week 4 (Nov 18-22)  
**Weekend Goal:** Design, plan, and potentially build basic version

---

## 🎯 CONSUMER APP OVERVIEW

### **What Is It?**
A mobile-first web app for consumers to track their deliveries after purchase.

### **Purpose:**
Post-purchase consumer experience - track packages, rate couriers, submit claims.

### **Access:**
- Magic link via email/SMS (no password)
- White-label (no Performile branding)
- Mobile-first design

---

## 📋 CONSUMER APP FEATURES (Week 4 Spec)

### **5 Core Features:**

1. **Order Tracking** 📦
   - Real-time package tracking
   - Timeline view
   - Map with courier location
   - Delivery estimates
   - Courier info

2. **Claims Management** 📝
   - Submit claims (damaged/lost/late)
   - Photo upload
   - Status tracking
   - Resolution updates

3. **Ratings & Reviews** ⭐
   - Rate courier (1-5 stars)
   - Detailed ratings (speed, care, communication)
   - Written reviews
   - Photo upload

4. **Returns Management** 🔄
   - Initiate returns
   - Generate return labels
   - Track return shipments
   - QR codes for parcel shops

5. **C2C Shipments** 📮
   - Create consumer-to-consumer shipments
   - For marketplace sales, gifts, etc.
   - Revenue opportunity (10-15% commission)

---

## 🎯 WHAT WE CAN DO THIS WEEKEND

### **Option 1: Full Preparation (Recommended)** ⭐
**Time:** 4-6 hours (Sunday afternoon/evening)  
**Deliverables:** Complete design, database schema, API specs, basic UI

### **Option 2: Design Only**
**Time:** 2-3 hours  
**Deliverables:** Wireframes, user flows, feature specs

### **Option 3: Build Basic Version** 🚀
**Time:** 8-10 hours (Sunday full day)  
**Deliverables:** Working order tracking app (Feature 1 only)

---

## 📅 RECOMMENDED: OPTION 1 - FULL PREPARATION

### **Sunday Afternoon/Evening (4-6 hours)**

---

### **TASK 1: Design Consumer App UI** (90 min)

#### **Wireframes to Create:**

**1. Landing Page (Magic Link Entry)**
```
┌─────────────────────────────────┐
│   📦 Track Your Delivery        │
│                                 │
│   Enter your tracking code:     │
│   [___________________]         │
│                                 │
│   Or use the link from email    │
│                                 │
│   [Track Package]               │
└─────────────────────────────────┘
```

**2. Order Tracking View**
```
┌─────────────────────────────────┐
│ ← Back                          │
│                                 │
│ Order #12345                    │
│ Estimated: Today, 2:00 PM       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  📍 Map View                │ │
│ │  [Courier location]         │ │
│ └─────────────────────────────┘ │
│                                 │
│ Timeline:                       │
│ ✅ Order Placed - 10:00 AM      │
│ ✅ Picked Up - 11:30 AM         │
│ 🚚 In Transit - Now             │
│ ⏳ Delivered - 2:00 PM          │
│                                 │
│ Courier: PostNord               │
│ Rating: ⭐⭐⭐⭐⭐ (4.8)         │
│                                 │
│ [Contact Support] [Rate Order]  │
└─────────────────────────────────┘
```

**3. Rate Courier View**
```
┌─────────────────────────────────┐
│ ← Back                          │
│                                 │
│ Rate Your Delivery              │
│                                 │
│ Overall Rating:                 │
│ ⭐⭐⭐⭐⭐                       │
│                                 │
│ Speed: ⭐⭐⭐⭐⭐               │
│ Care: ⭐⭐⭐⭐⭐                │
│ Communication: ⭐⭐⭐⭐⭐       │
│                                 │
│ Comments (optional):            │
│ [_________________________]     │
│ [_________________________]     │
│                                 │
│ Add Photos:                     │
│ [📷 Upload]                     │
│                                 │
│ [Submit Rating]                 │
└─────────────────────────────────┘
```

**Deliverable:** ✅ 5 wireframes (Landing, Tracking, Rating, Claims, Returns)

---

### **TASK 2: Design Database Schema** (60 min)

#### **New Tables Needed:**

**1. `consumer_tracking_sessions`**
```sql
CREATE TABLE consumer_tracking_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    magic_token VARCHAR(255) UNIQUE NOT NULL,
    consumer_email VARCHAR(255),
    consumer_phone VARCHAR(50),
    expires_at TIMESTAMPTZ NOT NULL,
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumer_sessions_token ON consumer_tracking_sessions(magic_token);
CREATE INDEX idx_consumer_sessions_order ON consumer_tracking_sessions(order_id);
```

**2. `consumer_reviews`** (Already in Week 4 spec)
```sql
CREATE TABLE consumer_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    consumer_email VARCHAR(255),
    
    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    speed_rating INTEGER CHECK (speed_rating BETWEEN 1 AND 5),
    care_rating INTEGER CHECK (care_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    
    -- Review content
    review_text TEXT,
    review_photos JSONB, -- Array of photo URLs
    
    -- Metadata
    is_verified BOOLEAN DEFAULT TRUE, -- Verified purchase
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumer_reviews_courier ON consumer_reviews(courier_id);
CREATE INDEX idx_consumer_reviews_order ON consumer_reviews(order_id);
```

**3. `consumer_claims`** (Already in Week 4 spec)
```sql
CREATE TABLE consumer_claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    consumer_email VARCHAR(255),
    
    -- Claim details
    claim_type VARCHAR(50) NOT NULL, -- 'damaged', 'lost', 'late', 'wrong_address'
    claim_description TEXT NOT NULL,
    claim_photos JSONB, -- Array of photo URLs
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'investigating', 'approved', 'rejected', 'resolved'
    resolution_notes TEXT,
    compensation_amount NUMERIC(10,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consumer_claims_order ON consumer_claims(order_id);
CREATE INDEX idx_consumer_claims_status ON consumer_claims(status);
```

**Deliverable:** ✅ 3 database schema SQL scripts ready

---

### **TASK 3: Design API Endpoints** (60 min)

#### **Consumer App APIs:**

**1. Magic Link Generation**
```
POST /api/consumer/generate-magic-link
Request: { orderId, email, phone }
Response: { magicLink, expiresAt }
```

**2. Validate Magic Link**
```
GET /api/consumer/validate-token?token={token}
Response: { valid: true, orderId, orderDetails }
```

**3. Get Order Tracking**
```
GET /api/consumer/orders/{orderId}/tracking?token={token}
Response: {
  order: { ... },
  courier: { ... },
  timeline: [ ... ],
  currentLocation: { lat, lng },
  estimatedDelivery: "2025-11-08T14:00:00Z"
}
```

**4. Submit Review**
```
POST /api/consumer/reviews
Request: {
  token,
  orderId,
  overallRating,
  speedRating,
  careRating,
  communicationRating,
  reviewText,
  photos: []
}
Response: { reviewId, success: true }
```

**5. Submit Claim**
```
POST /api/consumer/claims
Request: {
  token,
  orderId,
  claimType,
  description,
  photos: []
}
Response: { claimId, success: true }
```

**6. Get Courier Info**
```
GET /api/consumer/couriers/{courierId}/public-info
Response: {
  name,
  logo,
  rating,
  reviewCount,
  trackingUrl
}
```

**Deliverable:** ✅ 6 API endpoint specifications

---

### **TASK 4: Create Consumer App Structure** (60 min)

#### **Create New App Directory:**

```
apps/consumer/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── TrackingTimeline.tsx
│   │   ├── CourierMap.tsx
│   │   ├── RatingForm.tsx
│   │   ├── ClaimForm.tsx
│   │   └── OrderDetails.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Tracking.tsx
│   │   ├── Rate.tsx
│   │   └── Claim.tsx
│   ├── hooks/
│   │   ├── useTracking.ts
│   │   └── useMagicLink.ts
│   ├── App.tsx
│   └── index.tsx
├── package.json
├── tsconfig.json
└── README.md
```

**package.json:**
```json
{
  "name": "performile-consumer-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

**Deliverable:** ✅ Consumer app project structure created

---

### **TASK 5: Build Basic Tracking View** (90 min)

#### **Create Core Components:**

**1. `src/pages/Tracking.tsx`**
```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Package, MapPin, Clock, Star } from 'lucide-react';
import TrackingTimeline from '../components/TrackingTimeline';
import CourierMap from '../components/CourierMap';

export default function Tracking() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracking();
  }, [orderId, token]);

  const fetchTracking = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/consumer/orders/${orderId}/tracking?token=${token}`
      );
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading tracking info...</div>;
  }

  if (!order) {
    return <div className="error">Order not found</div>;
  }

  return (
    <div className="tracking-page">
      <header>
        <h1>Order #{order.order.orderNumber}</h1>
        <p className="estimate">
          <Clock size={16} />
          Estimated: {new Date(order.estimatedDelivery).toLocaleString()}
        </p>
      </header>

      <CourierMap 
        location={order.currentLocation}
        destination={order.order.deliveryAddress}
      />

      <TrackingTimeline timeline={order.timeline} />

      <div className="courier-info">
        <img src={order.courier.logo} alt={order.courier.name} />
        <div>
          <h3>{order.courier.name}</h3>
          <div className="rating">
            <Star size={16} fill="gold" />
            {order.courier.rating} ({order.courier.reviewCount} reviews)
          </div>
        </div>
      </div>

      <div className="actions">
        <button onClick={() => navigate(`/rate/${orderId}?token=${token}`)}>
          Rate Delivery
        </button>
        <button onClick={() => navigate(`/claim/${orderId}?token=${token}`)}>
          Report Issue
        </button>
      </div>
    </div>
  );
}
```

**2. `src/components/TrackingTimeline.tsx`**
```typescript
import React from 'react';
import { Check, Truck, Package, Home } from 'lucide-react';

interface TimelineEvent {
  status: string;
  timestamp: string;
  completed: boolean;
}

export default function TrackingTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  const getIcon = (status: string) => {
    switch (status) {
      case 'placed': return <Package size={20} />;
      case 'picked_up': return <Check size={20} />;
      case 'in_transit': return <Truck size={20} />;
      case 'delivered': return <Home size={20} />;
      default: return <Package size={20} />;
    }
  };

  return (
    <div className="timeline">
      {timeline.map((event, index) => (
        <div 
          key={index} 
          className={`timeline-event ${event.completed ? 'completed' : 'pending'}`}
        >
          <div className="icon">{getIcon(event.status)}</div>
          <div className="content">
            <h4>{event.status.replace('_', ' ').toUpperCase()}</h4>
            <p>{new Date(event.timestamp).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**3. `src/components/CourierMap.tsx`**
```typescript
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  lat: number;
  lng: number;
}

export default function CourierMap({ 
  location, 
  destination 
}: { 
  location: Location; 
  destination: Location;
}) {
  return (
    <MapContainer 
      center={[location.lat, location.lng]} 
      zoom={13} 
      style={{ height: '300px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <Marker position={[location.lat, location.lng]}>
        <Popup>Courier Location</Popup>
      </Marker>
      <Marker position={[destination.lat, destination.lng]}>
        <Popup>Delivery Address</Popup>
      </Marker>
    </MapContainer>
  );
}
```

**Deliverable:** ✅ Basic tracking view working

---

## 🎯 WEEKEND DELIVERABLES (Consumer App)

### **By Sunday Evening:**
- [ ] 5 wireframes designed
- [ ] 3 database tables designed
- [ ] 6 API endpoints specified
- [ ] Consumer app project structure created
- [ ] Basic tracking view built (if time allows)

---

## 📊 INTEGRATION WITH WEEKEND PLAN

### **Updated Sunday Schedule:**

**Original Sunday Plan:**
```
10:00 - 11:30  Design database schema (payment gateways)
11:30 - 1:00   Design API endpoints (payment gateways)
1:00 - 2:00    Lunch
2:00 - 3:00    Create Week 3 checklist
3:00 - 4:00    Set up development environment
4:00 - 5:00    Create API templates
5:00 - 6:00    Wrap up Week 2 docs
```

**NEW Sunday Plan (With Consumer App):**
```
10:00 - 11:30  Design database schema (payment gateways)
11:30 - 1:00   Design API endpoints (payment gateways)
1:00 - 2:00    Lunch
2:00 - 3:30    Consumer App: Design UI wireframes (90 min)
3:30 - 4:30    Consumer App: Design database schema (60 min)
4:30 - 5:30    Consumer App: Design API endpoints (60 min)
5:30 - 6:30    Consumer App: Create project structure (60 min)
6:30 - 8:00    Consumer App: Build basic tracking view (90 min) [OPTIONAL]
```

**Total Time:** 6-8 hours (4 hours consumer app + 2-4 hours payment gateways)

---

## 🚀 OPTION 3: BUILD FULL BASIC VERSION (Sunday Full Day)

### **If You Want to Go All-In (8-10 hours):**

**Sunday Schedule:**
```
10:00 - 11:30  Design UI wireframes (90 min)
11:30 - 12:30  Design database schema (60 min)
12:30 - 1:30   Lunch (60 min)
1:30 - 2:30    Design API endpoints (60 min)
2:30 - 3:30    Create project structure (60 min)
3:30 - 5:00    Build tracking view (90 min)
5:00 - 5:15    Break (15 min)
5:15 - 6:45    Build rating form (90 min)
6:45 - 8:00    Build claim form (75 min)
```

**Deliverables:**
- ✅ Complete consumer app (3 features: tracking, rating, claims)
- ✅ Database schema ready
- ✅ API endpoints ready
- ✅ Deployed to Vercel
- ✅ **READY FOR WEEK 4!**

---

## 💡 RECOMMENDATION

### **Best Approach:**

**Saturday:** Focus on payment gateway testing (as planned)

**Sunday Morning:** Payment gateway preparation (as planned)

**Sunday Afternoon/Evening:** Consumer app preparation (4-6 hours)

**Result:**
- ✅ Week 3 ready (payment gateways)
- ✅ Week 4 ready (consumer app)
- ✅ Both weeks prepared in one weekend!

---

## 🎯 CONSUMER APP BENEFITS

### **Why Build This Weekend:**

1. **Week 4 Head Start**
   - Consumer app is Week 4 (Nov 18-22)
   - Building now = Week 4 has more time for polish

2. **Testing with Real Orders**
   - Can test with Week 3 payment gateway orders
   - Real-world validation

3. **Merchant Value**
   - Show merchants the full experience
   - Better demos
   - Higher conversion

4. **Consumer Engagement**
   - Post-purchase experience ready
   - Collect reviews immediately
   - Build trust scores faster

---

## 📋 CONSUMER APP CHECKLIST

### **Design Phase:**
- [ ] Landing page wireframe
- [ ] Tracking view wireframe
- [ ] Rating form wireframe
- [ ] Claims form wireframe
- [ ] Returns view wireframe

### **Database Phase:**
- [ ] `consumer_tracking_sessions` table
- [ ] `consumer_reviews` table
- [ ] `consumer_claims` table
- [ ] RLS policies
- [ ] Indexes

### **API Phase:**
- [ ] Generate magic link endpoint
- [ ] Validate token endpoint
- [ ] Get tracking endpoint
- [ ] Submit review endpoint
- [ ] Submit claim endpoint
- [ ] Get courier info endpoint

### **Build Phase:**
- [ ] Project structure created
- [ ] Tracking page built
- [ ] Rating form built
- [ ] Claim form built
- [ ] Deployed to Vercel

---

## 🚀 DEPLOYMENT

### **Deploy Consumer App:**

```bash
cd apps/consumer
npm install
vercel

# Add environment variables
vercel env add REACT_APP_API_URL

# Deploy to production
vercel --prod
```

**URL:** `https://track.performile.com` (or similar)

---

## 🎯 SUCCESS METRICS

### **Minimum Success:**
- ✅ Wireframes designed
- ✅ Database schema ready
- ✅ API endpoints specified

### **Target Success:**
- ✅ All minimum items
- ✅ Project structure created
- ✅ Basic tracking view built

### **Stretch Success:**
- ✅ All target items
- ✅ Rating form built
- ✅ Claim form built
- ✅ Deployed to Vercel

---

## 💡 FINAL RECOMMENDATION

**Do This:**
1. ✅ Saturday: Payment gateway testing (as planned)
2. ✅ Sunday Morning: Payment gateway prep (as planned)
3. ✅ Sunday Afternoon: Consumer app design & planning (4 hours)
4. ✅ Sunday Evening: Consumer app basic build (2-4 hours) [OPTIONAL]

**Result:**
- ✅ Week 3 ready (payment gateways)
- ✅ Week 4 ready (consumer app)
- ✅ Maximum productivity
- ✅ Both weeks prepared!

---

**Ready to add consumer app to the weekend plan? 🚀**
