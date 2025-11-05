# MULTI-CURRENCY & GEOLOCATION PLAN

**Date:** November 5, 2025  
**Priority:** HIGH  
**Status:** Planning Phase

---

## 🎯 OBJECTIVES

1. **Detect customer location** automatically
2. **Display prices in local currency**
3. **Support multiple currencies** (USD, EUR, NOK, GBP, etc.)
4. **Store base currency** (USD) in database
5. **Convert on-the-fly** using exchange rates

---

## 💰 CURRENT PRICING (USD - Base Currency)

### **Merchant Plans:**
- **Starter:** FREE
- **Professional:** $29/month or $290/year
- **Enterprise:** $99/month or $990/year

### **Courier Plans:**
- **Basic:** FREE
- **Professional:** $19/month or $190/year
- **Fleet:** $59/month or $590/year

---

## 🌍 PHASE 1: GEOLOCATION (IMMEDIATE)

### **Goal:** Detect where customer is from

### **Option 1: IP Geolocation (Recommended)**

**Service:** ipapi.co (Free tier: 1,000 requests/day)

**Implementation:**
```typescript
// Frontend: apps/web/src/services/geolocation.ts
export async function detectUserLocation() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_code, // 'US', 'NO', 'GB', etc.
      currency: data.currency,     // 'USD', 'NOK', 'GBP', etc.
      timezone: data.timezone,
      city: data.city
    };
  } catch (error) {
    // Fallback to USD
    return { country: 'US', currency: 'USD' };
  }
}
```

**Alternatives:**
- **ipgeolocation.io** (Free: 1,000 requests/day)
- **ip-api.com** (Free: 45 requests/minute)
- **Cloudflare** (if using Cloudflare, free with headers)

### **Option 2: Browser API**

```typescript
// Get timezone from browser
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// 'America/New_York' → USD
// 'Europe/Oslo' → NOK
// 'Europe/London' → GBP
```

**Pros:** Free, no API calls  
**Cons:** Less accurate, user can change timezone

### **Option 3: Ask User**

```typescript
// Show country selector on first visit
<CountrySelector 
  onSelect={(country) => {
    localStorage.setItem('preferred_country', country);
    localStorage.setItem('preferred_currency', getCurrency(country));
  }}
/>
```

**Pros:** Most accurate  
**Cons:** Extra step for user

---

## 💱 PHASE 2: CURRENCY CONVERSION

### **Goal:** Show prices in local currency

### **Database Schema:**

```sql
-- Add currency column to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'USD';

-- Create exchange_rates table
CREATE TABLE exchange_rates (
  rate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Create index
CREATE INDEX idx_exchange_rates_currencies 
ON exchange_rates(from_currency, to_currency);

-- Insert initial rates (example)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('USD', 'USD', 1.000000),
('USD', 'EUR', 0.920000),
('USD', 'NOK', 10.500000),
('USD', 'GBP', 0.790000),
('USD', 'SEK', 10.200000),
('USD', 'DKK', 6.850000);
```

### **Exchange Rate API:**

**Option 1: exchangerate-api.com** (Recommended)
- Free tier: 1,500 requests/month
- Updates daily
- Reliable

```typescript
async function updateExchangeRates() {
  const response = await fetch(
    'https://api.exchangerate-api.com/v4/latest/USD'
  );
  const data = await response.json();
  
  // Store in database
  await supabase.from('exchange_rates').upsert([
    { from_currency: 'USD', to_currency: 'EUR', rate: data.rates.EUR },
    { from_currency: 'USD', to_currency: 'NOK', rate: data.rates.NOK },
    { from_currency: 'USD', to_currency: 'GBP', rate: data.rates.GBP },
    // ... more currencies
  ]);
}
```

**Option 2: fixer.io**
- Free tier: 100 requests/month
- More currencies
- Requires API key

**Option 3: Hardcoded Rates**
- Update manually once per month
- No API costs
- Less accurate

---

## 🎨 PHASE 3: FRONTEND DISPLAY

### **Currency Formatter:**

```typescript
// apps/web/src/utils/currency.ts
export function formatPrice(
  amount: number, 
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Usage:
formatPrice(29, 'USD')  // "$29"
formatPrice(29, 'EUR')  // "€29"
formatPrice(29, 'NOK')  // "NOK 29" or "kr 29"
```

### **Price Conversion Hook:**

```typescript
// apps/web/src/hooks/useCurrency.ts
export function useCurrency() {
  const [currency, setCurrency] = useState('USD');
  const [rates, setRates] = useState({});

  useEffect(() => {
    // Detect user location
    detectUserLocation().then(location => {
      setCurrency(location.currency);
    });

    // Fetch exchange rates
    fetchExchangeRates().then(setRates);
  }, []);

  const convertPrice = (usdPrice: number) => {
    const rate = rates[currency] || 1;
    return usdPrice * rate;
  };

  return { currency, convertPrice, formatPrice };
}
```

### **Updated SubscriptionSelector:**

```typescript
const { currency, convertPrice, formatPrice } = useCurrency();

// In render:
<Typography variant="h3">
  {formatPrice(convertPrice(plan.monthly_price), currency)}
</Typography>
<Typography variant="caption">
  /month
</Typography>
```

---

## 🗺️ SUPPORTED CURRENCIES (Phase 1)

### **Priority 1 (Launch):**
- 🇺🇸 **USD** - United States Dollar (base)
- 🇪🇺 **EUR** - Euro
- 🇳🇴 **NOK** - Norwegian Krone
- 🇬🇧 **GBP** - British Pound

### **Priority 2 (Q1 2026):**
- 🇸🇪 **SEK** - Swedish Krona
- 🇩🇰 **DKK** - Danish Krone
- 🇨🇦 **CAD** - Canadian Dollar
- 🇦🇺 **AUD** - Australian Dollar

### **Priority 3 (Q2 2026):**
- 🇯🇵 **JPY** - Japanese Yen
- 🇨🇭 **CHF** - Swiss Franc
- 🇵🇱 **PLN** - Polish Zloty
- More as needed...

---

## 🔧 IMPLEMENTATION PLAN

### **Week 1: Geolocation**
- [ ] Add IP geolocation service
- [ ] Detect user country/currency
- [ ] Store in localStorage
- [ ] Add currency selector UI
- [ ] Test with VPN

### **Week 2: Database**
- [ ] Add base_currency column
- [ ] Create exchange_rates table
- [ ] Set up exchange rate API
- [ ] Create cron job to update rates daily
- [ ] Add API endpoint to get rates

### **Week 3: Frontend**
- [ ] Create currency formatter
- [ ] Create useCurrency hook
- [ ] Update SubscriptionSelector
- [ ] Update Pricing page
- [ ] Update all price displays

### **Week 4: Testing**
- [ ] Test all currencies
- [ ] Test conversion accuracy
- [ ] Test edge cases (free plans)
- [ ] Test annual pricing
- [ ] User acceptance testing

---

## 💡 USER EXPERIENCE

### **First Visit:**
1. Detect location automatically
2. Show prices in local currency
3. Display currency selector in header
4. User can change currency anytime

### **Currency Selector UI:**
```
┌─────────────────────────────┐
│ 🌍 USD ▼                    │
├─────────────────────────────┤
│ 🇺🇸 USD - US Dollar         │
│ 🇪🇺 EUR - Euro              │
│ 🇳🇴 NOK - Norwegian Krone   │
│ 🇬🇧 GBP - British Pound     │
└─────────────────────────────┘
```

### **Price Display:**
```
Professional Plan
$29/month or $290/year
(Prices in USD)

[Change Currency ▼]
```

---

## 🎯 PRICING EXAMPLES

### **Professional Merchant ($29 USD):**
- **USD:** $29/month
- **EUR:** €27/month
- **NOK:** 305 kr/month
- **GBP:** £23/month

### **Professional Courier ($19 USD):**
- **USD:** $19/month
- **EUR:** €17/month
- **NOK:** 200 kr/month
- **GBP:** £15/month

---

## ⚠️ IMPORTANT CONSIDERATIONS

### **1. Stripe Integration**
- Stripe supports multi-currency
- Need to create price objects for each currency
- Or use dynamic pricing

### **2. Tax Handling**
- VAT in EU (varies by country)
- Sales tax in US (varies by state)
- Need tax calculation service (Stripe Tax)

### **3. Rounding**
- Round to local currency conventions
- EUR: €26.99 (ends in .99)
- NOK: 299 kr (round to nearest 10)
- JPY: ¥2,900 (no decimals)

### **4. Legal**
- Display currency clearly
- Show exchange rate if converting
- Terms must specify base currency
- Refunds in original currency

---

## 📊 COST ESTIMATE

### **Services:**
- **IP Geolocation:** Free (1,000/day)
- **Exchange Rates:** Free (1,500/month)
- **Stripe Multi-Currency:** Included
- **Total:** $0/month (within free tiers)

### **Development:**
- **Geolocation:** 4 hours
- **Database:** 2 hours
- **Frontend:** 8 hours
- **Testing:** 4 hours
- **Total:** 18 hours (~$1,800 at $100/hour)

---

## ✅ QUICK WIN (This Week)

### **Minimal Implementation:**

1. **Add currency display** (no conversion yet)
   ```typescript
   <Typography>
     ${plan.monthly_price} USD
   </Typography>
   ```

2. **Add currency selector** (manual)
   ```typescript
   <Select value={currency} onChange={setCurrency}>
     <MenuItem value="USD">🇺🇸 USD</MenuItem>
     <MenuItem value="EUR">🇪🇺 EUR</MenuItem>
     <MenuItem value="NOK">🇳🇴 NOK</MenuItem>
   </Select>
   ```

3. **Show "Prices in USD"** disclaimer
   ```typescript
   <Typography variant="caption">
     All prices displayed in USD. 
     Multi-currency support coming soon.
   </Typography>
   ```

---

## 🚀 RECOMMENDED APPROACH

### **Phase 1 (This Week):**
- ✅ Use USD as base currency
- ✅ Display "Prices in USD" clearly
- ✅ Add manual currency selector (display only)
- ⏳ Plan for multi-currency

### **Phase 2 (Next Sprint):**
- Add IP geolocation
- Add exchange rates table
- Implement currency conversion
- Test with real users

### **Phase 3 (Future):**
- Add more currencies
- Integrate with Stripe multi-currency
- Add tax calculation
- Localize entire platform

---

**Status:** ✅ USD pricing updated  
**Next:** Run INSERT_SUBSCRIPTION_PLANS.sql with USD prices  
**Future:** Implement multi-currency support
