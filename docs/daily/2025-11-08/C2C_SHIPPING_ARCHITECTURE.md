# 🚀 C2C SHIPPING - COMPLETE ARCHITECTURE

**Date:** November 8, 2025, 11:35 PM
**Critical Addition:** "Performile will have accounts handling C2C shipments, prepaid by consumer, with margin on top. Labels created in platform with QR codes."

---

## 🎯 **C2C SHIPPING MODEL**

### **Key Difference from B2C:**

**B2C (Merchant Orders):**
- Merchant has own courier accounts
- Merchant pays courier directly
- Performile just integrates APIs
- No payment intermediation

**C2C (Consumer-to-Consumer):**
- **Performile has courier accounts**
- Consumer pays Performile (prepaid)
- Performile pays courier
- **Performile takes margin**
- All data stored in Performile
- Labels generated in platform
- QR codes for supported couriers

---

## 💰 **C2C PAYMENT FLOW**

```
Consumer creates C2C shipment
    ↓
Performile calculates price:
  - Courier base price: $10
  - Performile margin: 20% ($2)
  - Total to consumer: $12
    ↓
Consumer pays Performile (prepaid):
  - Stripe/Klarna/Card
  - Payment captured immediately
    ↓
Performile creates shipment with courier:
  - Uses Performile's courier account
  - Performile's API credentials
  - Courier charges Performile $10
    ↓
Performile generates label:
  - PDF label with barcode
  - QR code (if courier supports)
  - Tracking number
    ↓
Consumer receives label:
  - Download PDF
  - Print at home
  - Or show QR code at drop-off
    ↓
Package delivered
    ↓
Performile pays courier: $10
Performile keeps margin: $2
```

---

## 🗄️ **DATABASE STRUCTURE**

### **New Tables for C2C:**

```sql
-- C2C Shipments
CREATE TABLE c2c_shipments (
  shipment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id UUID NOT NULL REFERENCES users(user_id),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  
  -- Sender
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(50) NOT NULL,
  sender_address TEXT NOT NULL,
  sender_postal_code VARCHAR(20) NOT NULL,
  sender_city VARCHAR(100) NOT NULL,
  sender_country VARCHAR(2) NOT NULL,
  
  -- Recipient
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50) NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_postal_code VARCHAR(20) NOT NULL,
  recipient_city VARCHAR(100) NOT NULL,
  recipient_country VARCHAR(2) NOT NULL,
  
  -- Package
  weight DECIMAL(10,2) NOT NULL,  -- kg
  length DECIMAL(10,2),  -- cm
  width DECIMAL(10,2),   -- cm
  height DECIMAL(10,2),  -- cm
  package_type VARCHAR(50),  -- 'parcel', 'letter', 'pallet'
  
  -- Pricing
  courier_base_price DECIMAL(10,2) NOT NULL,  -- What courier charges
  performile_margin DECIMAL(10,2) NOT NULL,   -- Performile's margin
  total_price DECIMAL(10,2) NOT NULL,         -- What consumer pays
  currency VARCHAR(3) DEFAULT 'SEK',
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'paid', 'refunded'
  payment_intent_id VARCHAR(255),  -- Stripe payment intent
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Shipping
  tracking_number VARCHAR(255),
  shipment_status VARCHAR(50) DEFAULT 'created',
  label_url TEXT,  -- PDF label URL
  qr_code_data TEXT,  -- QR code data (if supported)
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notes TEXT,
  is_insured BOOLEAN DEFAULT FALSE,
  insurance_value DECIMAL(10,2)
);

-- C2C Courier Accounts (Performile's accounts with couriers)
CREATE TABLE c2c_courier_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  
  -- Performile's credentials with this courier
  customer_number VARCHAR(255) NOT NULL,
  api_key TEXT NOT NULL,
  api_secret TEXT,
  
  -- Account details
  account_name VARCHAR(255),  -- "Performile AB"
  billing_address TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_test_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C2C Pricing Rules
CREATE TABLE c2c_pricing_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES couriers(courier_id),
  
  -- Weight ranges
  weight_min DECIMAL(10,2),
  weight_max DECIMAL(10,2),
  
  -- Geographic
  from_country VARCHAR(2),
  to_country VARCHAR(2),
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  price_per_kg DECIMAL(10,2),
  performile_margin_percent DECIMAL(5,2) DEFAULT 20.00,  -- 20%
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- C2C Labels
CREATE TABLE c2c_labels (
  label_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES c2c_shipments(shipment_id),
  
  -- Label data
  label_format VARCHAR(20) DEFAULT 'PDF',  -- 'PDF', 'ZPL', 'PNG'
  label_url TEXT NOT NULL,
  label_data TEXT,  -- Base64 encoded label
  
  -- QR Code
  has_qr_code BOOLEAN DEFAULT FALSE,
  qr_code_data TEXT,  -- QR code content
  qr_code_url TEXT,   -- QR code image URL
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  printed_at TIMESTAMP WITH TIME ZONE
);

-- C2C Payments
CREATE TABLE c2c_payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES c2c_shipments(shipment_id),
  consumer_id UUID NOT NULL REFERENCES users(user_id),
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'SEK',
  payment_method VARCHAR(50),  -- 'card', 'klarna', 'swish'
  
  -- Payment provider
  provider VARCHAR(50),  -- 'stripe', 'klarna'
  provider_payment_id VARCHAR(255),
  provider_status VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'completed', 'failed', 'refunded'
  
  -- Dates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  error_message TEXT,
  refund_reason TEXT
);
```

---

## 🔄 **C2C SHIPMENT FLOW**

### **Step 1: Consumer Creates Shipment**

```typescript
// Consumer fills form:
const shipmentData = {
  sender: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+46701234567",
    address: "Storgatan 1",
    postal_code: "11122",
    city: "Stockholm",
    country: "SE"
  },
  recipient: {
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+46709876543",
    address: "Kungsgatan 10",
    postal_code: "41101",
    city: "Göteborg",
    country: "SE"
  },
  package: {
    weight: 2.5,  // kg
    length: 30,   // cm
    width: 20,
    height: 15,
    type: "parcel"
  }
};
```

### **Step 2: Performile Calculates Price**

```typescript
// api/c2c/calculate-price.ts

// 1. Find available couriers for route
const availableCouriers = await supabase
  .from('c2c_pricing_rules')
  .select('*, couriers (*)')
  .eq('from_country', 'SE')
  .eq('to_country', 'SE')
  .gte('weight_max', 2.5)
  .eq('is_active', true);

// 2. Calculate prices for each courier
const quotes = availableCouriers.map(rule => {
  const courierBasePrice = rule.base_price + (2.5 * rule.price_per_kg);
  const performileMargin = courierBasePrice * (rule.performile_margin_percent / 100);
  const totalPrice = courierBasePrice + performileMargin;
  
  return {
    courier_id: rule.courier_id,
    courier_name: rule.couriers.courier_name,
    courier_base_price: courierBasePrice,
    performile_margin: performileMargin,
    total_price: totalPrice,
    estimated_delivery: rule.couriers.estimated_delivery_days
  };
});

// 3. Return quotes to consumer
return {
  quotes: quotes.sort((a, b) => a.total_price - b.total_price)
};
```

### **Step 3: Consumer Selects Courier & Pays**

```typescript
// Consumer selects PostNord: 120 SEK
// Breakdown:
// - Courier base: 100 SEK
// - Performile margin: 20 SEK (20%)
// - Total: 120 SEK

// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 12000,  // 120 SEK in öre
  currency: 'sek',
  metadata: {
    type: 'c2c_shipment',
    courier_id: selectedCourier.courier_id
  }
});

// Consumer completes payment
// Stripe confirms payment
```

### **Step 4: Performile Creates Shipment with Courier**

```typescript
// api/c2c/create-shipment.ts

// 1. Get Performile's courier account
const { data: courierAccount } = await supabase
  .from('c2c_courier_accounts')
  .select('*')
  .eq('courier_id', selectedCourier.courier_id)
  .single();

// 2. Create shipment with courier API
const courierResponse = await fetch(`${courier.api_endpoint}/shipments`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${courierAccount.api_key}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_number: courierAccount.customer_number,
    sender: shipmentData.sender,
    recipient: shipmentData.recipient,
    package: shipmentData.package
  })
});

const { tracking_number, label_url } = await courierResponse.json();

// 3. Save shipment in Performile
const { data: shipment } = await supabase
  .from('c2c_shipments')
  .insert({
    consumer_id: user.id,
    courier_id: selectedCourier.courier_id,
    ...shipmentData,
    courier_base_price: 100,
    performile_margin: 20,
    total_price: 120,
    tracking_number: tracking_number,
    payment_status: 'paid',
    shipment_status: 'created'
  })
  .select()
  .single();
```

### **Step 5: Generate Label with QR Code**

```typescript
// api/c2c/generate-label.ts

// 1. Check if courier supports QR codes
const courierSupportsQR = ['POSTNORD', 'BRING', 'BUDBEE'].includes(
  courier.courier_code
);

if (courierSupportsQR) {
  // Generate QR code data
  const qrData = JSON.stringify({
    tracking_number: tracking_number,
    courier_code: courier.courier_code,
    shipment_id: shipment.shipment_id
  });
  
  // Generate QR code image
  const qrCodeUrl = await generateQRCode(qrData);
  
  // Create label with QR code
  const labelPDF = await createLabelPDF({
    tracking_number,
    sender: shipmentData.sender,
    recipient: shipmentData.recipient,
    qr_code_url: qrCodeUrl,
    barcode: tracking_number
  });
  
  // Save label
  await supabase.from('c2c_labels').insert({
    shipment_id: shipment.shipment_id,
    label_url: labelPDF.url,
    has_qr_code: true,
    qr_code_data: qrData,
    qr_code_url: qrCodeUrl
  });
} else {
  // Standard label without QR
  const labelPDF = await createLabelPDF({
    tracking_number,
    sender: shipmentData.sender,
    recipient: shipmentData.recipient,
    barcode: tracking_number
  });
  
  await supabase.from('c2c_labels').insert({
    shipment_id: shipment.shipment_id,
    label_url: labelPDF.url,
    has_qr_code: false
  });
}
```

### **Step 6: Consumer Downloads/Prints Label**

```typescript
// Consumer portal
<Button onClick={() => downloadLabel(shipment.shipment_id)}>
  Download Label (PDF)
</Button>

{label.has_qr_code && (
  <Box>
    <Typography>Or show QR code at drop-off:</Typography>
    <QRCodeDisplay data={label.qr_code_data} />
  </Box>
)}
```

---

## 💰 **REVENUE MODEL**

### **Performile's Margin:**

```
Example shipment:
- Courier charges Performile: 100 SEK
- Performile margin: 20% = 20 SEK
- Consumer pays: 120 SEK
- Performile profit: 20 SEK per shipment

Monthly volume:
- 1,000 C2C shipments/month
- Average margin: 20 SEK
- Monthly revenue: 20,000 SEK
- Annual revenue: 240,000 SEK

Scale:
- 10,000 shipments/month = 200,000 SEK/month = 2.4M SEK/year
- 100,000 shipments/month = 2M SEK/month = 24M SEK/year
```

### **Pricing Strategy:**

```sql
-- Different margins by courier/route
INSERT INTO c2c_pricing_rules (
  courier_id,
  from_country,
  to_country,
  weight_min,
  weight_max,
  base_price,
  price_per_kg,
  performile_margin_percent
) VALUES
-- Domestic (SE → SE): 20% margin
('postnord-id', 'SE', 'SE', 0, 5, 50, 10, 20.00),
-- Nordic (SE → NO): 25% margin
('postnord-id', 'SE', 'NO', 0, 5, 80, 15, 25.00),
-- International (SE → DE): 30% margin
('dhl-id', 'SE', 'DE', 0, 5, 150, 20, 30.00);
```

---

## 📊 **DATA OWNERSHIP**

### **All C2C Data Stored in Performile:**

```
✅ Shipment details (sender, recipient, package)
✅ Tracking events
✅ Payment records
✅ Labels and QR codes
✅ Consumer reviews
✅ Delivery confirmations
✅ Claims and returns

This data is used for:
- Consumer shipment history
- Analytics and reporting
- Courier performance tracking
- Fraud detection
- Customer support
```

### **Data Access:**

```sql
-- Consumers see only their shipments
CREATE POLICY c2c_consumer_access ON c2c_shipments
FOR SELECT USING (consumer_id = auth.uid());

-- Couriers see shipments assigned to them
CREATE POLICY c2c_courier_access ON c2c_shipments
FOR SELECT USING (
  courier_id IN (
    SELECT courier_id FROM couriers WHERE user_id = auth.uid()
  )
);

-- Admins see everything
CREATE POLICY c2c_admin_access ON c2c_shipments
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 🎯 **IMPLEMENTATION PRIORITY**

**Phase 4 (6-8 weeks from now)**

**Why not earlier:**
- Need core B2C platform working first
- Requires payment processing setup
- Requires label generation system
- Requires QR code integration
- Complex courier API integration

**Dependencies:**
1. ✅ User authentication
2. ✅ Courier management
3. ✅ Payment processing (Stripe/Klarna)
4. ❌ Label generation system
5. ❌ QR code generation
6. ❌ Courier API integration (C2C accounts)

---

## 🚀 **C2C FEATURES**

1. **Shipment Creation** - Consumer creates C2C shipment
2. **Price Calculation** - Real-time quotes from multiple couriers
3. **Payment Processing** - Prepaid via Stripe/Klarna
4. **Label Generation** - PDF labels with barcodes
5. **QR Code Support** - For PostNord, Bring, Budbee
6. **Tracking** - Real-time tracking updates
7. **Shipment History** - Consumer sees all their shipments
8. **Claims & Returns** - Handle C2C issues
9. **Reviews** - Consumer reviews courier service

---

**Document:** `docs/daily/2025-11-08/C2C_SHIPPING_ARCHITECTURE.md`

**Status:** Architecture defined, ready for Phase 4 implementation 🚀
