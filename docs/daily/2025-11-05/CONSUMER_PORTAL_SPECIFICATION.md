# CONSUMER PORTAL SPECIFICATION

**Date:** November 5, 2025, 6:26 PM  
**Priority:** HIGH - Post-Purchase Experience  
**Timeline:** Week 4-5

---

## 🎯 CONSUMER PORTAL OVERVIEW

### **Purpose:**
After purchase, consumers need to:
- Track their orders
- Submit claims for damaged/lost packages
- Rate and review courier performance
- Initiate returns
- Create C2C (consumer-to-consumer) shipments

### **Access:**
- Email link after purchase
- SMS link with tracking number
- QR code on receipt
- Direct URL: `performile.com/track/[order-id]`

**NO LOGIN REQUIRED** - Magic link authentication

---

## 📋 CONSUMER PORTAL FEATURES

### **1. ORDER TRACKING** 🚚

**Purpose:** Real-time package tracking

**Features:**
```
Order Tracking Page
├── Order Summary
│   ├── Order number
│   ├── Merchant name
│   ├── Order date
│   ├── Delivery address
│   └── Estimated delivery
│
├── Tracking Timeline
│   ├── ✅ Order Placed (Nov 5, 10:30 AM)
│   ├── ✅ Picked Up (Nov 5, 2:15 PM)
│   ├── 🚚 In Transit (Nov 5, 6:00 PM) ← Current
│   ├── ⏳ Out for Delivery (Expected Nov 6, 8:00 AM)
│   └── ⏳ Delivered (Expected Nov 6, 12:00 PM)
│
├── Live Map
│   └── Current package location (if available)
│
├── Courier Information
│   ├── Courier: DHL Express
│   ├── Tracking #: 1234567890
│   ├── Driver: John D. (if available)
│   └── Contact: +47 123 45 678
│
└── Actions
    ├── [Report Issue]
    ├── [Contact Courier]
    └── [Rate Delivery] (after delivery)
```

**Database:**
```sql
-- Already exists in orders table
SELECT 
    order_id,
    tracking_number,
    courier_id,
    delivery_status,
    estimated_delivery,
    actual_delivery,
    delivery_address
FROM orders
WHERE order_id = $1;
```

---

### **2. CLAIMS MANAGEMENT** 📝

**Purpose:** Submit and track claims for issues

**Claim Types:**
- Package damaged
- Package lost
- Late delivery
- Wrong item
- Missing items
- Other issues

**Claims Flow:**
```
Submit Claim
├── 1. Select Issue Type
│   └── [Damaged] [Lost] [Late] [Wrong Item] [Missing]
│
├── 2. Provide Details
│   ├── Description (text area)
│   ├── Upload Photos (up to 5)
│   ├── Expected vs Received
│   └── Preferred Resolution
│       └── [Refund] [Replacement] [Compensation]
│
├── 3. Submit
│   └── Claim created with unique ID
│
└── 4. Track Claim
    ├── Status: Under Review
    ├── Expected Response: 2-3 business days
    └── Updates via email/SMS
```

**Database Schema:**
```sql
CREATE TABLE consumer_claims (
    claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id),
    consumer_email VARCHAR(255) NOT NULL,
    consumer_phone VARCHAR(50),
    claim_type VARCHAR(50) NOT NULL, -- damaged, lost, late, wrong_item, missing
    description TEXT NOT NULL,
    photos JSONB, -- Array of photo URLs
    preferred_resolution VARCHAR(50), -- refund, replacement, compensation
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, approved, rejected, resolved
    merchant_response TEXT,
    courier_response TEXT,
    resolution_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_consumer_claims_order ON consumer_claims(order_id);
CREATE INDEX idx_consumer_claims_status ON consumer_claims(status);
CREATE INDEX idx_consumer_claims_email ON consumer_claims(consumer_email);
```

---

### **3. RATINGS & REVIEWS** ⭐

**Purpose:** Rate courier performance after delivery

**Rating Flow:**
```
Rate Your Delivery
├── Overall Rating (1-5 stars)
│   └── ⭐⭐⭐⭐⭐
│
├── Detailed Ratings
│   ├── Delivery Speed: ⭐⭐⭐⭐⭐
│   ├── Package Condition: ⭐⭐⭐⭐⭐
│   ├── Driver Professionalism: ⭐⭐⭐⭐⭐
│   └── Communication: ⭐⭐⭐⭐⭐
│
├── Written Review (optional)
│   └── [Text area - 500 chars max]
│
├── Photos (optional)
│   └── Upload delivery photos
│
└── Submit
    └── Review published after moderation
```

**Database Schema:**
```sql
CREATE TABLE consumer_reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id),
    courier_id UUID REFERENCES couriers(courier_id),
    consumer_email VARCHAR(255) NOT NULL,
    consumer_name VARCHAR(255), -- Optional, can be anonymous
    
    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    speed_rating INTEGER CHECK (speed_rating BETWEEN 1 AND 5),
    condition_rating INTEGER CHECK (condition_rating BETWEEN 1 AND 5),
    professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    
    -- Review content
    review_text TEXT,
    photos JSONB, -- Array of photo URLs
    
    -- Metadata
    verified_purchase BOOLEAN DEFAULT true,
    helpful_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    moderation_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consumer_reviews_courier ON consumer_reviews(courier_id);
CREATE INDEX idx_consumer_reviews_order ON consumer_reviews(order_id);
CREATE INDEX idx_consumer_reviews_status ON consumer_reviews(status);
CREATE INDEX idx_consumer_reviews_rating ON consumer_reviews(overall_rating);
```

---

### **4. RETURNS MANAGEMENT** 🔄

**Purpose:** Initiate and track return shipments

**Return Flow:**
```
Initiate Return
├── 1. Select Order
│   └── Show orders from last 30 days
│
├── 2. Select Items to Return
│   ├── Item 1: Blue Shirt (Size M) ☑
│   ├── Item 2: Black Pants (Size L) ☐
│   └── Quantity: [1 ▼]
│
├── 3. Return Reason
│   ├── [Wrong Size ▼]
│   ├── [Defective]
│   ├── [Changed Mind]
│   ├── [Wrong Item]
│   └── [Other]
│
├── 4. Return Method
│   ├── ○ Pickup from Home (Free)
│   │   └── Select date: [Nov 7 ▼]
│   └── ○ Drop at Parcel Shop
│       └── Find nearest location
│
├── 5. Generate Return Label
│   └── [Download PDF] [Email to Me]
│
└── 6. Track Return
    ├── Label Created
    ├── Package Picked Up
    ├── In Transit
    ├── Received by Merchant
    └── Refund Processed
```

**Database Schema:**
```sql
CREATE TABLE consumer_returns (
    return_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(order_id),
    consumer_email VARCHAR(255) NOT NULL,
    
    -- Return details
    items_returned JSONB NOT NULL, -- Array of {item_id, quantity, reason}
    return_reason VARCHAR(100) NOT NULL,
    return_method VARCHAR(50) NOT NULL, -- pickup, drop_off
    
    -- Pickup details (if applicable)
    pickup_date DATE,
    pickup_time_slot VARCHAR(50),
    pickup_address JSONB,
    
    -- Return shipping
    return_courier_id UUID REFERENCES couriers(courier_id),
    return_tracking_number VARCHAR(255),
    return_label_url TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'initiated', -- initiated, label_created, picked_up, in_transit, received, refund_processed
    merchant_approved BOOLEAN,
    refund_amount DECIMAL(10,2),
    refund_status VARCHAR(50), -- pending, processed, completed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_consumer_returns_order ON consumer_returns(order_id);
CREATE INDEX idx_consumer_returns_status ON consumer_returns(status);
CREATE INDEX idx_consumer_returns_email ON consumer_returns(consumer_email);
```

---

### **5. C2C SHIPMENTS** 📦

**Purpose:** Create consumer-to-consumer shipments (sell on marketplace, send gifts)

**C2C Flow:**
```
Create Shipment
├── 1. Sender Information
│   ├── Name: [____________]
│   ├── Email: [____________]
│   ├── Phone: [____________]
│   └── Address: [____________]
│
├── 2. Recipient Information
│   ├── Name: [____________]
│   ├── Email: [____________]
│   ├── Phone: [____________]
│   └── Address: [____________]
│
├── 3. Package Details
│   ├── Weight: [___] kg
│   ├── Dimensions: [L] x [W] x [H] cm
│   ├── Value: [___] (for insurance)
│   └── Contents: [____________]
│
├── 4. Select Courier
│   ├── ○ DHL - Tomorrow - $12.99 ⭐⭐⭐⭐⭐
│   ├── ○ UPS - 2-3 days - $9.99 ⭐⭐⭐⭐☆
│   └── ○ PostNord - 3-4 days - $7.99 ⭐⭐⭐⭐☆
│
├── 5. Additional Services
│   ├── ☐ Insurance ($2.00)
│   ├── ☐ Signature Required ($1.50)
│   └── ☐ SMS Notifications ($0.50)
│
├── 6. Payment
│   └── [Pay with Klarna/Card]
│
└── 7. Generate Label
    ├── [Download PDF]
    ├── [Email to Me]
    └── Track shipment
```

**Database Schema:**
```sql
CREATE TABLE c2c_shipments (
    shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Sender
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(50),
    sender_address JSONB NOT NULL,
    
    -- Recipient
    recipient_name VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    recipient_address JSONB NOT NULL,
    
    -- Package details
    weight_kg DECIMAL(10,2) NOT NULL,
    dimensions_cm JSONB, -- {length, width, height}
    declared_value DECIMAL(10,2),
    contents_description TEXT,
    
    -- Courier selection
    courier_id UUID REFERENCES couriers(courier_id),
    service_type VARCHAR(50), -- express, standard, economy
    tracking_number VARCHAR(255),
    
    -- Additional services
    insurance_enabled BOOLEAN DEFAULT false,
    signature_required BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Pricing
    base_price DECIMAL(10,2) NOT NULL,
    insurance_fee DECIMAL(10,2) DEFAULT 0,
    additional_fees DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    
    -- Shipping
    label_url TEXT,
    status VARCHAR(50) DEFAULT 'created', -- created, label_generated, picked_up, in_transit, delivered
    estimated_delivery DATE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_c2c_shipments_sender ON c2c_shipments(sender_email);
CREATE INDEX idx_c2c_shipments_courier ON c2c_shipments(courier_id);
CREATE INDEX idx_c2c_shipments_status ON c2c_shipments(status);
CREATE INDEX idx_c2c_shipments_tracking ON c2c_shipments(tracking_number);
```

---

## 🎨 CONSUMER PORTAL UI

### **Landing Page (Magic Link):**

```
┌─────────────────────────────────────────┐
│ Performile - Your Delivery Dashboard   │
├─────────────────────────────────────────┤
│                                         │
│ Welcome, John!                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📦 Active Orders (2)                │ │
│ │                                     │ │
│ │ Order #12345 - DHL                  │ │
│ │ Out for Delivery - Arrives today    │ │
│ │ [Track] [Report Issue]              │ │
│ │                                     │ │
│ │ Order #12344 - UPS                  │ │
│ │ Delivered - Nov 3                   │ │
│ │ [Rate Delivery] [Return]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Quick Actions                       │ │
│ │ [Track Package] [Submit Claim]      │ │
│ │ [Initiate Return] [Send Package]    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📋 My Claims (1)                    │ │
│ │ Claim #C789 - Under Review          │ │
│ │ [View Details]                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📱 MOBILE-FIRST DESIGN

**Features:**
- Responsive design
- Touch-friendly buttons
- Camera integration for photos
- GPS for location
- Push notifications
- QR code scanner

---

## 🔔 NOTIFICATIONS

### **Email Notifications:**
- Order shipped
- Out for delivery
- Delivered
- Claim status update
- Return label ready
- Refund processed

### **SMS Notifications:**
- Delivery today (morning)
- Driver 30 min away
- Delivered (with photo)
- Issue detected

### **Push Notifications (PWA):**
- Real-time tracking updates
- Delivery alerts
- Claim responses

---

## 🔐 AUTHENTICATION

### **Magic Link (No Password):**

```
Access Your Orders
├── Enter Email: [john@example.com]
├── [Send Magic Link]
└── Check your email for secure access link
```

**Security:**
- Magic link expires in 15 minutes
- One-time use only
- IP address verification
- Device fingerprinting

---

## 📊 CONSUMER ANALYTICS

### **Track Consumer Behavior:**
```sql
CREATE TABLE consumer_portal_analytics (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consumer_email VARCHAR(255),
    event_type VARCHAR(50), -- page_view, track_order, submit_claim, rate_delivery, create_return
    event_data JSONB,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Metrics:**
- Portal usage rate
- Claim submission rate
- Review completion rate
- Return initiation rate
- C2C shipment creation rate

---

## 🎯 API ENDPOINTS

### **Consumer Portal APIs:**

```
POST /api/consumer/magic-link
  → Send magic link to email

GET /api/consumer/orders
  → Get consumer's orders

GET /api/consumer/orders/:orderId/tracking
  → Get tracking details

POST /api/consumer/claims
  → Submit new claim

GET /api/consumer/claims
  → Get consumer's claims

POST /api/consumer/reviews
  → Submit courier review

POST /api/consumer/returns
  → Initiate return

GET /api/consumer/returns/:returnId
  → Get return status

POST /api/consumer/c2c-shipments
  → Create C2C shipment

GET /api/consumer/c2c-shipments/:shipmentId
  → Get shipment details
```

---

## 📅 IMPLEMENTATION TIMELINE

### **Week 4 (Nov 18-22):**

**Day 1: Database & Backend**
- Create consumer portal tables
- Build magic link authentication
- Create API endpoints

**Day 2: Order Tracking**
- Tracking page UI
- Real-time updates
- Map integration

**Day 3: Claims & Reviews**
- Claims submission form
- Review submission form
- Photo upload

**Day 4: Returns & C2C**
- Returns flow
- C2C shipment creation
- Label generation

**Day 5: Testing & Polish**
- Mobile testing
- Email/SMS notifications
- Documentation

---

## 💰 REVENUE OPPORTUNITIES

### **C2C Shipments:**
- Commission: 10-15% on each shipment
- Additional services: Insurance, signature
- Volume discounts for frequent senders

### **Premium Features:**
- Priority support: $2.99/month
- Extended tracking: $1.99/month
- Faster claims processing: $4.99/month

---

## 🎯 SUCCESS METRICS

### **Engagement:**
- Portal access rate: >60%
- Review completion rate: >40%
- Claim resolution time: <48 hours
- Return completion rate: >80%

### **Satisfaction:**
- Consumer satisfaction: >4.5/5
- Portal usability: >4.7/5
- Support response time: <2 hours

---

## ✅ SUMMARY

### **Consumer Portal Features:**
1. ✅ Order Tracking (real-time)
2. ✅ Claims Management (submit & track)
3. ✅ Ratings & Reviews (rate couriers)
4. ✅ Returns Management (initiate & track)
5. ✅ C2C Shipments (create shipments)

### **Key Benefits:**
- **Transparency:** Real-time tracking
- **Empowerment:** Submit claims easily
- **Trust:** Rate and review couriers
- **Convenience:** Easy returns
- **Revenue:** C2C shipments

---

**Status:** 📋 SPECIFICATION COMPLETE  
**Priority:** HIGH - Post-purchase experience  
**Timeline:** Week 4 implementation  
**Impact:** Complete consumer experience + C2C revenue stream
