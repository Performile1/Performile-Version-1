# 🎨 WHITE-LABEL REQUIREMENTS

**Date:** November 9, 2025, 12:42 AM
**Status:** Official Requirement

---

## 🎯 **CORE PRINCIPLE**

**Merchants and Couriers can white-label everything, BUT:**
- ✅ "Powered by Performile" text ALWAYS visible
- ✅ Performile logo ALWAYS in lower corner
- ✅ Non-removable, non-customizable

**Why:** Brand awareness, trust, and marketing

---

## 📋 **WHITE-LABEL CAPABILITIES**

### **What Merchants/Couriers CAN Customize:**

**1. Colors & Branding:**
- Primary color
- Secondary color
- Accent colors
- Font family
- Button styles
- Border radius

**2. Content:**
- Company name
- Company logo (main)
- Welcome messages
- Email templates
- Notification text

**3. Domain:**
- Custom domain (tracking.merchantname.com)
- Custom subdomain (merchantname.performile.com)

**4. Features:**
- Show/hide TrustScore
- Show/hide reviews
- Show/hide courier options
- Enable/disable consumer choice

---

## 🚫 **WHAT CANNOT BE CUSTOMIZED**

### **Always Present (Non-Removable):**

**1. "Powered by Performile" Text:**
```
Location: Lower right corner
Size: Small (12px)
Color: Gray (#666666)
Format: "Powered by Performile"
Link: https://performile.com
```

**2. Performile Logo:**
```
Location: Lower left corner
Size: 24px × 24px
Opacity: 0.6 (60%)
Link: https://performile.com
```

**3. Legal Links:**
```
Location: Footer
Links: Privacy Policy, Terms of Service
Required: Yes
Customizable: No
```

---

## 🎨 **VISUAL EXAMPLES**

### **Merchant Tracking Page:**

```
┌─────────────────────────────────────────────┐
│  [Merchant Logo]        Track Your Order    │
│                                              │
│  Order #12345                                │
│  Status: In Transit                          │
│  ETA: Tomorrow 14:00-17:00                  │
│                                              │
│  [Tracking Timeline - Merchant Colors]      │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ [P] Powered by Performile            │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
   ↑                                        ↑
   Performile Logo                "Powered by"
   (lower left)                   (lower right)
```

### **Consumer Checkout Widget:**

```
┌─────────────────────────────────────────────┐
│  Choose Delivery Method                     │
│                                              │
│  ○ PostNord - Home Delivery                 │
│     ⭐ 92/100 | 49 SEK | 1-2 days          │
│                                              │
│  ○ PostNord - Parcel Locker                 │
│     ⭐ 92/100 | 39 SEK | Pick up 24/7      │
│                                              │
│  [Merchant's Primary Color Button]          │
│                                              │
│  [P]                  Powered by Performile │
└─────────────────────────────────────────────┘
```

### **Mobile App (Consumer):**

```
┌─────────────────────────┐
│  [Merchant Name]        │
│                         │
│  Your Orders            │
│  ├─ Active (3)         │
│  ├─ Delivered (45)     │
│  └─ C2C Shipments (2)  │
│                         │
│  [Content Area]         │
│                         │
│                         │
│  [P] Powered by         │
│      Performile         │
└─────────────────────────┘
```

---

## 💻 **IMPLEMENTATION**

### **1. CSS/HTML Structure:**

```html
<!-- Every white-labeled page -->
<div class="performile-branding">
  <!-- Lower left: Logo -->
  <a href="https://performile.com" target="_blank" class="performile-logo">
    <img src="/assets/performile-logo-small.svg" alt="Performile" />
  </a>
  
  <!-- Lower right: Text -->
  <a href="https://performile.com" target="_blank" class="performile-powered">
    Powered by Performile
  </a>
</div>

<style>
.performile-branding {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: transparent;
  z-index: 9999; /* Always on top */
  pointer-events: none; /* Don't block clicks */
}

.performile-logo,
.performile-powered {
  pointer-events: auto; /* Allow clicks on links */
}

.performile-logo img {
  width: 24px;
  height: 24px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.performile-logo:hover img {
  opacity: 1;
}

.performile-powered {
  font-size: 12px;
  color: #666666;
  text-decoration: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: color 0.2s;
}

.performile-powered:hover {
  color: #333333;
  text-decoration: underline;
}

/* Prevent removal via CSS */
.performile-branding {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}
</style>
```

---

### **2. React Component:**

```typescript
// components/PerformileBranding.tsx
import React from 'react';

interface PerformileBrandingProps {
  variant?: 'light' | 'dark';
}

export const PerformileBranding: React.FC<PerformileBrandingProps> = ({ 
  variant = 'light' 
}) => {
  return (
    <div className={`performile-branding performile-branding--${variant}`}>
      <a 
        href="https://performile.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="performile-logo"
        aria-label="Performile"
      >
        <img 
          src="/assets/performile-logo-small.svg" 
          alt="Performile Logo" 
          width={24}
          height={24}
        />
      </a>
      
      <a 
        href="https://performile.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="performile-powered"
      >
        Powered by Performile
      </a>
    </div>
  );
};

// ALWAYS include in white-labeled pages
export default PerformileBranding;
```

---

### **3. Checkout Widget:**

```javascript
// Embedded in merchant checkout
PerformileCheckout.init({
  merchantId: 'merchant_xxx',
  
  // Merchant can customize these
  theme: {
    primaryColor: '#FF6B6B',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '8px'
  },
  
  // Performile branding (NON-CUSTOMIZABLE)
  branding: {
    showPoweredBy: true,      // ALWAYS true, cannot be changed
    showLogo: true,            // ALWAYS true, cannot be changed
    removable: false,          // ALWAYS false
    customizable: false        // ALWAYS false
  }
});

// Widget automatically includes branding
// Merchant CANNOT remove or hide it
```

---

### **4. Mobile App:**

```typescript
// App.tsx
import PerformileBranding from './components/PerformileBranding';

function App() {
  return (
    <SafeAreaView>
      {/* Merchant's content */}
      <MerchantContent />
      
      {/* Performile branding - ALWAYS PRESENT */}
      <PerformileBranding variant="light" />
    </SafeAreaView>
  );
}
```

---

## 🔒 **ENFORCEMENT**

### **Backend Validation:**

```typescript
// API endpoint to update white-label settings
POST /api/merchant/white-label

// Server-side validation
function validateWhiteLabelSettings(settings: WhiteLabelSettings) {
  // ALWAYS enforce Performile branding
  settings.branding = {
    showPoweredBy: true,      // Force to true
    showLogo: true,            // Force to true
    removable: false,          // Force to false
    customizable: false        // Force to false
  };
  
  // Merchant can customize colors, fonts, etc.
  return settings;
}
```

### **Frontend Protection:**

```typescript
// Prevent CSS overrides
const style = document.createElement('style');
style.innerHTML = `
  .performile-branding {
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
  }
`;
document.head.appendChild(style);

// Prevent JavaScript removal
Object.defineProperty(window, 'performileBranding', {
  value: true,
  writable: false,
  configurable: false
});
```

---

## 📋 **WHITE-LABEL TIERS**

### **Free Tier:**
- ✅ Basic white-labeling (colors, fonts)
- ✅ Performile branding (required)
- ❌ Custom domain
- ❌ Remove "Powered by" (not allowed)

### **Professional Tier ($29/month):**
- ✅ Full white-labeling (colors, fonts, logo)
- ✅ Performile branding (required)
- ✅ Custom subdomain (merchant.performile.com)
- ❌ Remove "Powered by" (not allowed)

### **Enterprise Tier ($99/month):**
- ✅ Full white-labeling
- ✅ Performile branding (required)
- ✅ Custom domain (tracking.merchant.com)
- ✅ Smaller branding (but still present)
- ❌ Remove "Powered by" (not allowed)

**Note:** Even Enterprise tier MUST show Performile branding

---

## 🎯 **BUSINESS RATIONALE**

### **Why Always Show Branding:**

**1. Marketing & Growth:**
- Free advertising
- Brand awareness
- Viral growth
- Trust signal

**2. Legal Protection:**
- Clear service provider
- Liability clarity
- Terms of service link
- Privacy policy link

**3. Competitive Advantage:**
- Shows platform power
- Builds credibility
- Network effects
- Industry standard (Shopify, Stripe, etc. do this)

---

## 📊 **EXAMPLES FROM OTHER PLATFORMS**

### **Shopify:**
- "Powered by Shopify" on all stores
- Small logo in footer
- Non-removable (even on Enterprise)

### **Stripe:**
- "Powered by Stripe" on checkout
- Logo in payment form
- Required for compliance

### **Mailchimp:**
- "Sent via Mailchimp" in emails
- Logo in footer
- Free tier requirement

**Performile follows industry standard!**

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Frontend:**
- [ ] Create PerformileBranding component
- [ ] Add to all white-labeled pages
- [ ] Add to checkout widget
- [ ] Add to mobile app
- [ ] Add CSS protection
- [ ] Add JavaScript protection

### **Backend:**
- [ ] Enforce branding in API
- [ ] Validate white-label settings
- [ ] Prevent branding removal
- [ ] Add to terms of service

### **Design:**
- [ ] Create logo variants (light/dark)
- [ ] Design "Powered by" text
- [ ] Create placement guidelines
- [ ] Test on all screen sizes

### **Legal:**
- [ ] Update terms of service
- [ ] Update merchant agreement
- [ ] Update courier agreement
- [ ] Add to privacy policy

---

## 🎨 **DESIGN ASSETS NEEDED**

### **Logos:**
1. `performile-logo-small.svg` (24×24px)
2. `performile-logo-small-dark.svg` (for dark backgrounds)
3. `performile-logo-small-light.svg` (for light backgrounds)

### **Text:**
1. "Powered by Performile" (standard)
2. "Powered by Performile" (dark mode)
3. Translations (if needed)

---

## 📝 **TERMS OF SERVICE UPDATE**

**Add to merchant/courier agreements:**

> "All white-labeled implementations must display 'Powered by Performile' branding and the Performile logo in the lower corners of all customer-facing interfaces. This branding is non-removable and non-customizable. Attempts to remove or hide this branding will result in immediate service suspension."

---

## 🚀 **ROLLOUT PLAN**

### **Phase 1 (This Week):**
- [ ] Create branding component
- [ ] Add to tracking pages
- [ ] Add to checkout widget
- [ ] Update documentation

### **Phase 2 (Next Week):**
- [ ] Add to mobile app
- [ ] Implement protection
- [ ] Update terms of service
- [ ] Notify existing merchants

### **Phase 3 (Week 3):**
- [ ] Enforce on all pages
- [ ] Monitor compliance
- [ ] Handle exceptions
- [ ] Measure impact

---

## ✅ **SUMMARY**

**White-Label Policy:**
- ✅ Merchants/Couriers can customize colors, fonts, logos, domains
- ✅ Performile branding ALWAYS visible (logo + "Powered by")
- ✅ Non-removable, non-customizable
- ✅ Industry standard practice
- ✅ Required for all tiers (Free, Professional, Enterprise)

**Benefits:**
- Marketing & brand awareness
- Legal protection
- Trust signal
- Viral growth
- Competitive advantage

**Implementation:**
- React component
- CSS protection
- JavaScript protection
- Backend enforcement
- Terms of service update

---

**REQUIREMENT DOCUMENTED - READY FOR IMPLEMENTATION** ✅

**File:** `docs/daily/2025-11-08/WHITE_LABEL_REQUIREMENTS.md`
