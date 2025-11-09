# 🔐 C2C PAYMENT AUTHENTICATION STRATEGY

**Date:** November 9, 2025  
**Status:** CRITICAL SECURITY REQUIREMENT  
**Purpose:** Identity verification for C2C payments to prevent fraud

---

## 🎯 OVERVIEW

**Problem:** C2C shipments involve peer-to-peer transactions that require strong identity verification to prevent:
- Fraud
- Identity theft
- Payment disputes
- Scams
- Money laundering

**Solution:** Multi-layered authentication using Nordic eID solutions

---

## 🔒 AUTHENTICATION FLOW FOR C2C PAYMENTS

```
User initiates C2C shipment
  ↓
System checks user verification status
  ↓
┌─────────────────────────────────────┐
│ Is user identity verified?          │
├─────────────────────────────────────┤
│ NO → Require identity verification  │
│ YES → Proceed to payment            │
└─────────────────────────────────────┘
  ↓
User selects verification method:
  • 🇸🇪 BankID (Sweden)
  • 🇳🇴 BankID (Norway)
  • 🌍 Freja eID (All Nordic)
  • 🇳🇴 Siros Foundation (Norway)
  ↓
User completes verification
  ↓
Identity stored securely
  ↓
User proceeds to payment (Vipps/Swish)
  ↓
Payment completed
  ↓
Shipment created
```

---

## 🔐 AUTHENTICATION METHODS

### **1. BANKID (SWEDEN)** 🇸🇪

**Overview:**
- **Users:** 8M+ in Sweden
- **Coverage:** Sweden (primary)
- **Trust Level:** Government-backed
- **Use Case:** Swedish C2C transactions

**Integration:**
```typescript
POST /api/auth/bankid/initiate
{
  "personalNumber": "YYYYMMDDXXXX",  // Optional
  "endUserIp": "192.168.1.1",
  "requirement": {
    "cardReader": "class1",
    "certificatePolicies": ["1.2.752.78.1.5"]
  }
}

Response:
{
  "orderRef": "131daac9-16c6-4618-beb0-365768f37288",
  "autoStartToken": "7c40b5c9-fa74-49cf-b98c-bfe651f9a7c6",
  "qrStartToken": "67df3917-fa0d-44e5-b327-edcc928297f8",
  "qrStartSecret": "d28db9a7-4cde-429e-a983-359be676944c"
}
```

**Verification Data Received:**
- Personal number (YYYYMMDDXXXX)
- Full name
- Age
- Verified identity

**Database Storage:**
```sql
ALTER TABLE users ADD COLUMN bankid_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN bankid_personal_number VARCHAR(20);
ALTER TABLE users ADD COLUMN bankid_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN bankid_name VARCHAR(255);
```

---

### **2. BANKID (NORWAY)** 🇳🇴

**Overview:**
- **Users:** 4M+ in Norway
- **Coverage:** Norway (primary)
- **Trust Level:** Government-backed
- **Use Case:** Norwegian C2C transactions

**Integration:**
```typescript
POST /api/auth/bankid-no/initiate
{
  "ssn": "DDMMYYXXXXX",  // Optional
  "redirectUrl": "https://performile.com/verify/callback"
}

Response:
{
  "sessionId": "abc123",
  "redirectUrl": "https://bankid.no/auth?session=abc123"
}
```

**Verification Data Received:**
- National ID number (fødselsnummer)
- Full name
- Date of birth
- Verified identity

**Database Storage:**
```sql
ALTER TABLE users ADD COLUMN bankid_no_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN bankid_no_ssn VARCHAR(20);
ALTER TABLE users ADD COLUMN bankid_no_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN bankid_no_name VARCHAR(255);
```

---

### **3. FREJA eID** 🌍

**Overview:**
- **Users:** Cross-Nordic
- **Coverage:** Sweden, Norway, Denmark, Finland
- **Trust Level:** High (eIDAS compliant)
- **Use Case:** Cross-border C2C, users without BankID

**Integration:**
```typescript
POST /api/auth/freja/initiate
{
  "userInfoType": "SSN",  // or EMAIL, PHONE
  "minRegistrationLevel": "EXTENDED",
  "attributesToReturn": ["BASIC_USER_INFO", "SSN", "DATE_OF_BIRTH"]
}

Response:
{
  "authRef": "123456789",
  "qrCode": "data:image/png;base64,..."
}
```

**Verification Data Received:**
- Personal number (if available)
- Full name
- Email
- Phone number
- Date of birth

**Database Storage:**
```sql
ALTER TABLE users ADD COLUMN freja_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN freja_reference VARCHAR(255);
ALTER TABLE users ADD COLUMN freja_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN freja_name VARCHAR(255);
ALTER TABLE users ADD COLUMN freja_ssn VARCHAR(20);
```

---

### **4. SIROS FOUNDATION (NORWAY)** 🇳🇴

**Overview:**
- **Purpose:** Fraud prevention and identity verification
- **Coverage:** Norway
- **Trust Level:** Industry-backed
- **Use Case:** Additional fraud check layer

**What is Siros:**
- Norwegian foundation for fraud prevention
- Shared database of fraud cases
- Real-time fraud checks
- Industry collaboration

**Integration:**
```typescript
POST /api/fraud-check/siros
{
  "personalNumber": "DDMMYYXXXXX",
  "name": "John Doe",
  "phone": "+4712345678",
  "email": "john@example.com",
  "transactionType": "c2c_shipment",
  "amount": 150
}

Response:
{
  "riskLevel": "LOW",  // LOW, MEDIUM, HIGH
  "fraudIndicators": [],
  "recommendation": "APPROVE",
  "sirosReference": "SR-123456"
}
```

**Checks Performed:**
- Identity verification
- Fraud history
- Blacklist check
- Risk scoring
- Pattern analysis

**Database Storage:**
```sql
CREATE TABLE siros_checks (
  check_id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  order_id UUID REFERENCES orders(order_id),
  risk_level VARCHAR(20),
  recommendation VARCHAR(20),
  siros_reference VARCHAR(255),
  fraud_indicators JSONB,
  checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_siros_checks_user_id ON siros_checks(user_id);
CREATE INDEX idx_siros_checks_risk_level ON siros_checks(risk_level);
```

---

## 🔄 COMPLETE C2C PAYMENT FLOW WITH AUTHENTICATION

### **Step-by-Step Process:**

```
1. USER INITIATES C2C SHIPMENT
   ↓
   User: "I want to ship from Oslo to Stockholm"
   System: Calculates price (€150)

2. IDENTITY VERIFICATION CHECK
   ↓
   System checks: Is user verified?
   
   IF NOT VERIFIED:
   ↓
   Show verification options:
   • BankID (Sweden/Norway)
   • Freja eID (All Nordic)
   
   User selects verification method
   ↓
   User completes verification
   ↓
   Identity data stored
   ↓
   User marked as verified

3. FRAUD CHECK (NORWAY ONLY)
   ↓
   IF Norway + High value (>€100):
   ↓
   System calls Siros Foundation API
   ↓
   Risk assessment performed
   ↓
   IF HIGH RISK:
     → Manual review required
     → User notified
   IF LOW/MEDIUM RISK:
     → Proceed to payment

4. PAYMENT PROCESSING
   ↓
   User selects payment method:
   • Vipps (Norway)
   • Swish (Sweden)
   ↓
   Payment request created
   ↓
   User approves on phone
   ↓
   Payment confirmed

5. SHIPMENT CREATION
   ↓
   Shipment label generated
   ↓
   Courier notified
   ↓
   User receives confirmation
```

---

## 💾 DATABASE SCHEMA

### **User Verification Table:**
```sql
CREATE TABLE user_verifications (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  verification_method VARCHAR(50) NOT NULL,  -- 'bankid_se', 'bankid_no', 'freja'
  verification_level VARCHAR(20) NOT NULL,   -- 'basic', 'extended', 'qualified'
  personal_number VARCHAR(20),
  full_name VARCHAR(255),
  date_of_birth DATE,
  country VARCHAR(2),
  verified_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  verification_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_verifications_user_id ON user_verifications(user_id);
CREATE INDEX idx_user_verifications_method ON user_verifications(verification_method);
CREATE INDEX idx_user_verifications_verified_at ON user_verifications(verified_at);
```

### **Fraud Checks Table:**
```sql
CREATE TABLE fraud_checks (
  check_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id),
  order_id UUID REFERENCES orders(order_id),
  check_type VARCHAR(50) NOT NULL,  -- 'siros', 'manual', 'automated'
  risk_level VARCHAR(20),           -- 'LOW', 'MEDIUM', 'HIGH'
  risk_score INTEGER,               -- 0-100
  recommendation VARCHAR(20),       -- 'APPROVE', 'REVIEW', 'REJECT'
  fraud_indicators JSONB,
  external_reference VARCHAR(255),  -- Siros reference
  checked_by VARCHAR(50),           -- 'system' or admin user_id
  checked_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_fraud_checks_user_id ON fraud_checks(user_id);
CREATE INDEX idx_fraud_checks_order_id ON fraud_checks(order_id);
CREATE INDEX idx_fraud_checks_risk_level ON fraud_checks(risk_level);
CREATE INDEX idx_fraud_checks_checked_at ON fraud_checks(checked_at);
```

### **User Verification Status:**
```sql
-- Add to users table
ALTER TABLE users ADD COLUMN is_identity_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN verification_method VARCHAR(50);
ALTER TABLE users ADD COLUMN verification_level VARCHAR(20);
ALTER TABLE users ADD COLUMN verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN verification_expires_at TIMESTAMP;

CREATE INDEX idx_users_identity_verified ON users(is_identity_verified);
```

---

## 🔐 SECURITY REQUIREMENTS

### **For C2C Payments:**

**Mandatory Verification:**
- ✅ First C2C shipment: ALWAYS require verification
- ✅ High-value shipments (>€100): ALWAYS require verification
- ✅ Suspicious patterns: ALWAYS require verification

**Optional Verification:**
- ⚠️ Low-value shipments (<€50): Optional if user has history
- ⚠️ Repeat users: Optional if verified within 12 months

**Fraud Checks:**
- ✅ Norway: Siros Foundation check for >€100
- ✅ All countries: Automated pattern detection
- ✅ Manual review: For high-risk cases

---

## 📊 VERIFICATION LEVELS

### **Level 1: Basic (Email/Phone)**
**Requirements:**
- Email verification
- Phone verification
- No identity document

**Allowed:**
- Low-value C2C (<€50)
- Returns

**Limitations:**
- Max €50 per transaction
- Max €200 per month

---

### **Level 2: Extended (eID)**
**Requirements:**
- BankID or Freja eID
- Identity verified
- Personal number confirmed

**Allowed:**
- All C2C shipments
- All returns
- No transaction limits

**Benefits:**
- ✅ Higher trust score
- ✅ Priority support
- ✅ Lower fees

---

### **Level 3: Qualified (Enhanced)**
**Requirements:**
- Extended verification
- Siros Foundation check passed
- Business verification (if applicable)

**Allowed:**
- High-value shipments (>€500)
- International shipments
- Business C2C

**Benefits:**
- ✅ Highest trust score
- ✅ VIP support
- ✅ Lowest fees
- ✅ Extended insurance

---

## 🎯 IMPLEMENTATION PLAN

### **Phase 1: Q1 2026 (CRITICAL)**
**Priority:** 🔴 HIGH

**Implement:**
1. BankID (Sweden) integration
2. BankID (Norway) integration
3. Basic verification flow
4. Database schema

**Timeline:** 4-6 weeks  
**Investment:** €20K-€30K

---

### **Phase 2: Q1 2026**
**Priority:** 🔴 HIGH

**Implement:**
1. Freja eID integration
2. Siros Foundation integration
3. Fraud detection rules
4. Risk scoring system

**Timeline:** 3-4 weeks  
**Investment:** €15K-€25K

---

### **Phase 3: Q2 2026**
**Priority:** 🟡 MEDIUM

**Implement:**
1. Advanced fraud detection
2. Machine learning risk models
3. Manual review dashboard
4. Verification expiry handling

**Timeline:** 4-6 weeks  
**Investment:** €25K-€35K

---

## 🔄 API ENDPOINTS

### **Verification Endpoints:**
```typescript
// Initiate BankID verification
POST /api/verification/bankid/initiate
POST /api/verification/bankid/collect
POST /api/verification/bankid/cancel

// Initiate Freja eID verification
POST /api/verification/freja/initiate
GET /api/verification/freja/status
POST /api/verification/freja/cancel

// Check verification status
GET /api/verification/status/:userId

// Fraud check
POST /api/fraud-check/siros
GET /api/fraud-check/status/:orderId
```

### **C2C Payment with Verification:**
```typescript
// Create C2C shipment (with verification check)
POST /api/c2c/create-shipment
{
  "from": {...},
  "to": {...},
  "package": {...}
}

Response:
{
  "requiresVerification": true,
  "verificationMethods": ["bankid_se", "freja"],
  "shipmentId": "uuid",
  "estimatedCost": 150
}

// Complete verification and proceed to payment
POST /api/c2c/verify-and-pay
{
  "shipmentId": "uuid",
  "verificationToken": "token-from-verification",
  "paymentMethod": "vipps"
}
```

---

## 💡 BUSINESS BENEFITS

### **Fraud Prevention:**
- ✅ Reduce fraud by 95%+
- ✅ Prevent identity theft
- ✅ Protect legitimate users
- ✅ Lower chargeback rates

### **Trust & Safety:**
- ✅ Build user confidence
- ✅ Comply with regulations
- ✅ Industry best practices
- ✅ Insurance requirements

### **Competitive Advantage:**
- ✅ Most secure C2C platform
- ✅ Regulatory compliance
- ✅ Premium positioning
- ✅ Enterprise customers

### **Cost Savings:**
- ✅ Reduce fraud losses
- ✅ Lower insurance premiums
- ✅ Fewer disputes
- ✅ Less manual review

**Estimated Savings:** €200K-€500K annually

---

## 📋 COMPLIANCE

### **GDPR:**
- ✅ Lawful basis: Legitimate interest (fraud prevention)
- ✅ Data minimization: Only necessary data
- ✅ Purpose limitation: Identity verification only
- ✅ Storage limitation: Delete after 12 months
- ✅ User rights: Access, deletion, portability

### **PSD2 (Payment Services Directive):**
- ✅ Strong Customer Authentication (SCA)
- ✅ Two-factor authentication
- ✅ Transaction monitoring
- ✅ Fraud prevention

### **AML (Anti-Money Laundering):**
- ✅ Know Your Customer (KYC)
- ✅ Transaction monitoring
- ✅ Suspicious activity reporting
- ✅ Record keeping

---

## ✅ SUCCESS METRICS

### **Security:**
- Fraud rate: < 0.1%
- False positive rate: < 5%
- Verification success rate: > 95%
- User satisfaction: > 90%

### **Performance:**
- Verification time: < 2 minutes
- API response time: < 500ms
- Uptime: > 99.9%

### **Business:**
- Fraud losses: < €10K annually
- Insurance savings: > €50K annually
- User trust score: > 4.5/5
- Regulatory compliance: 100%

---

**STATUS:** 📋 STRATEGY COMPLETE  
**PRIORITY:** 🔴 CRITICAL for C2C launch  
**INVESTMENT:** €60K-€90K  
**ROI:** €200K-€500K savings annually  
**TIMELINE:** Q1 2026 (4-6 weeks)

---

**Last Updated:** November 9, 2025, 2:55 PM
