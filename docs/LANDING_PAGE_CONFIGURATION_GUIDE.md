# LANDING PAGE CONFIGURATION GUIDE

**Quick setup guide for the new landing page components**

---

## 🔧 REQUIRED CONFIGURATIONS

### **1. Google Analytics (REQUIRED)**

**File:** `apps/web/src/pages/LandingPage.tsx`

**Line 74:** Replace placeholder with your GA4 Measurement ID

```tsx
// BEFORE:
<GoogleAnalytics measurementId="G-XXXXXXXXXX" />

// AFTER:
<GoogleAnalytics measurementId="G-YOUR-ACTUAL-ID" />
```

**How to get your GA4 ID:**
1. Go to https://analytics.google.com
2. Create a new GA4 property
3. Copy the Measurement ID (format: G-XXXXXXXXXX)
4. Replace in the code above

---

### **2. App Store Links (REQUIRED WHEN APPS ARE PUBLISHED)**

**File:** `apps/web/src/components/landing/AppStoreLinks.tsx`

**Lines 10-11:** Update with actual app URLs

```tsx
// BEFORE:
const APP_STORE_URL = 'https://apps.apple.com/app/performile/id123456789';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.performile.app';

// AFTER (when apps are published):
const APP_STORE_URL = 'https://apps.apple.com/app/performile/id[YOUR_ACTUAL_ID]';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.performile.[YOUR_PACKAGE]';
```

**Note:** Until apps are published, these links will go to placeholder URLs. Update them when your apps are live.

---

### **3. Demo Video URL (OPTIONAL)**

**File:** `apps/web/src/components/landing/DemoVideo.tsx`

**Line 22:** Replace with your actual video URL

```tsx
// BEFORE:
window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');

// AFTER:
window.open('https://www.youtube.com/watch?v=YOUR_VIDEO_ID', '_blank');
```

**Alternative:** Embed video directly instead of opening in new tab:
```tsx
<iframe
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  className="absolute inset-0 w-full h-full"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

---

## 📝 OPTIONAL CUSTOMIZATIONS

### **4. Update Testimonials with Real Customers**

**File:** `apps/web/src/components/landing/Testimonials.tsx`

**Lines 6-46:** Replace with actual customer testimonials

```tsx
const testimonials = [
  {
    name: 'Your Customer Name',
    role: 'Their Job Title',
    company: 'Their Company',
    rating: 5,
    text: 'Their actual testimonial quote...',
    avatar: 'XX', // Initials
  },
  // Add more...
];
```

---

### **5. Update Case Studies with Real Data**

**File:** `apps/web/src/components/landing/CaseStudies.tsx`

**Lines 6-70:** Replace with actual case study data

```tsx
const caseStudies = [
  {
    company: 'Real Company Name',
    industry: 'Their Industry',
    logo: 'XX',
    challenge: 'Actual challenge they faced...',
    solution: 'How Performile solved it...',
    results: [
      { metric: 'Metric Name', value: 'Actual %', icon: Icon },
      // Add actual metrics...
    ],
    testimonial: 'Real quote from customer...',
    author: 'Real Name, Real Title',
    color: 'from-blue-500 to-indigo-600',
  },
];
```

---

### **6. Update Blog Posts**

**File:** `apps/web/src/components/landing/BlogSection.tsx`

**Lines 6-30:** Add your actual blog posts

```tsx
const posts = [
  {
    title: 'Your Blog Post Title',
    excerpt: 'Brief description...',
    category: 'Category Name',
    date: 'Nov 9, 2025',
    readTime: '5 min read',
    image: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    icon: Icon,
  },
];
```

---

### **7. Update Partner Logos**

**File:** `apps/web/src/components/landing/PartnerLogos.tsx`

**Lines 4-7:** Add/remove courier partners

```tsx
const partners = [
  'Bring', 'PostNord', 'DHL', 'Budbee', 
  'Your Courier', 'Another Courier', // Add more
];
```

**Optional:** Replace text with actual logo images:
```tsx
<img 
  src="/logos/partner-name.png" 
  alt="Partner Name"
  className="h-12 opacity-60 hover:opacity-100 transition-opacity"
/>
```

---

### **8. Customize Coverage Map**

**File:** `apps/web/src/components/landing/CoverageMap.tsx`

**Lines 26-31:** Update coverage data

```tsx
const regions = [
  { 
    name: 'Norway', 
    coverage: 98, // Update with actual %
    cities: 'Oslo, Bergen, Trondheim, Stavanger', 
    couriers: 8 // Update with actual count
  },
  // Update other countries...
];
```

---

### **9. Update Pricing Comparison**

**File:** `apps/web/src/components/landing/PricingComparison.tsx`

**Lines 6-60:** Update competitor data and pricing

```tsx
const competitors = [
  {
    name: 'Competitor Name',
    price: '€XXX/mo',
    features: [
      { text: 'Feature name', available: true/false },
      // Update features...
    ],
    savings: '€XX/mo',
    highlight: true, // Only for Performile
  },
];
```

---

### **10. Customize ROI Calculator Defaults**

**File:** `apps/web/src/components/landing/ROICalculator.tsx`

**Lines 6-11:** Update default values

```tsx
const [inputs, setInputs] = useState({
  monthlyOrders: 1000,      // Change default
  avgOrderValue: 50,        // Change default
  currentShippingCost: 8,   // Change default
  currentProcessingTime: 5, // Change default (minutes)
});
```

---

## 🎨 STYLING CUSTOMIZATIONS

### **Change Color Scheme**

All components use Tailwind CSS classes. To change colors globally:

**Primary Blue:**
- `bg-blue-600` → `bg-[your-color]-600`
- `text-blue-600` → `text-[your-color]-600`
- `from-blue-500` → `from-[your-color]-500`

**Example colors:** `purple`, `green`, `indigo`, `red`, `yellow`, `pink`

---

### **Change Fonts**

Update in your Tailwind config or add custom fonts:

```css
/* In your global CSS */
@import url('https://fonts.googleapis.com/css2?family=Your+Font&display=swap');

body {
  font-family: 'Your Font', sans-serif;
}
```

---

## 📊 ANALYTICS EVENTS

### **Track Custom Events**

Use the helper functions from `GoogleAnalytics.tsx`:

```tsx
import { trackEvent, trackButtonClick, trackFormSubmit } from '../components/analytics/GoogleAnalytics';

// Track button click
trackButtonClick('Start Free Trial', 'Hero Section');

// Track form submission
trackFormSubmit('Newsletter Signup');

// Track custom event
trackEvent('video_play', 'Engagement', 'Demo Video', 1);
```

---

## 🔒 ENVIRONMENT VARIABLES (OPTIONAL)

Create `.env` file for sensitive data:

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_APP_STORE_URL=https://apps.apple.com/...
VITE_PLAY_STORE_URL=https://play.google.com/...
```

Then use in code:
```tsx
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
```

---

## ✅ CONFIGURATION CHECKLIST

Before going live, ensure:

- [ ] Google Analytics ID updated
- [ ] App Store URLs updated (when apps published)
- [ ] Demo video URL updated
- [ ] Real testimonials added
- [ ] Real case studies added
- [ ] Blog posts added
- [ ] Partner logos updated
- [ ] Coverage data accurate
- [ ] Pricing comparison accurate
- [ ] All placeholder text replaced
- [ ] All images optimized
- [ ] Analytics tracking tested
- [ ] Mobile responsive tested
- [ ] All links work

---

## 🚀 QUICK START

**Minimum required changes to go live:**

1. Update Google Analytics ID (Line 74 in LandingPage.tsx)
2. Test that all sections render correctly
3. Deploy!

**Everything else can be updated incrementally as you get real data.**

---

## 📞 SUPPORT

If you need help with configuration:
1. Check component comments in code
2. Review this guide
3. Test in development first
4. Deploy to staging before production

---

**Last Updated:** November 9, 2025
