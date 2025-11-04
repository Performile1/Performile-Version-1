# CHECKOUT CUSTOMIZATION SPECIFICATION - November 4, 2025

**Date:** November 4, 2025, 4:35 PM  
**Purpose:** Customizable checkout text and icons for merchants and couriers  
**Priority:** HIGH - Enhances brand identity

---

## 🎯 FEATURES OVERVIEW

### **1. Custom Checkout Text**
- Merchants can customize all checkout text
- Couriers can customize service descriptions
- Multi-language support
- Preview before save

### **2. Delivery Method Icons**
- Home Delivery: Van, Bike, Walking
- Parcel Shop
- Parcel Locker
- Click and Collect

### **3. Service Badge Icons**
- Environmentally Friendly
- Economy
- Express
- Same Day
- Signature Required
- Insurance Included

### **4. Custom Logo Upload**
- Courier logos
- Merchant branding
- Service-specific icons
- Badge customization

---

## 💾 DATABASE SCHEMA

### **1. Merchant Checkout Settings**

```sql
CREATE TABLE IF NOT EXISTS merchant_checkout_settings (
    setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES users(user_id),
    
    -- Checkout Text Customization
    checkout_title VARCHAR(200) DEFAULT 'Select Delivery Method',
    checkout_subtitle TEXT,
    speed_section_title VARCHAR(200) DEFAULT 'How fast do you need it?',
    method_section_title VARCHAR(200) DEFAULT 'Where should we deliver?',
    courier_section_title VARCHAR(200) DEFAULT 'Choose your courier',
    options_section_title VARCHAR(200) DEFAULT 'Additional options',
    
    -- Custom Messages
    express_description TEXT DEFAULT 'Delivered within 1 business day',
    standard_description TEXT DEFAULT 'Delivered within 2-4 business days',
    economy_description TEXT DEFAULT 'Delivered within 5-7 business days',
    same_day_description TEXT DEFAULT 'Delivered today',
    
    home_delivery_description TEXT DEFAULT 'Delivered to your door',
    parcel_shop_description TEXT DEFAULT 'Pick up at your convenience',
    parcel_locker_description TEXT DEFAULT '24/7 access to smart locker',
    click_collect_description TEXT DEFAULT 'Pick up in store',
    
    -- Button Text
    continue_button_text VARCHAR(100) DEFAULT 'Continue to Payment',
    back_button_text VARCHAR(100) DEFAULT 'Back',
    select_button_text VARCHAR(100) DEFAULT 'Select',
    
    -- Help Text
    delivery_help_text TEXT,
    pricing_help_text TEXT,
    
    -- Language
    language_code VARCHAR(5) DEFAULT 'en',
    
    -- Branding
    primary_color VARCHAR(7), -- Hex color
    secondary_color VARCHAR(7),
    accent_color VARCHAR(7),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(merchant_id)
);

-- Enable RLS
ALTER TABLE merchant_checkout_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "merchant_checkout_settings_select" 
ON merchant_checkout_settings FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "merchant_checkout_settings_insert" 
ON merchant_checkout_settings FOR INSERT 
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "merchant_checkout_settings_update" 
ON merchant_checkout_settings FOR UPDATE 
USING (merchant_id = auth.uid());
```

---

### **2. Courier Service Customization**

```sql
CREATE TABLE IF NOT EXISTS courier_service_customization (
    customization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id UUID NOT NULL REFERENCES couriers(courier_id),
    service_code VARCHAR(100) NOT NULL,
    
    -- Custom Text
    display_name VARCHAR(200),
    short_description TEXT,
    long_description TEXT,
    features_text TEXT[], -- Array of feature descriptions
    
    -- Custom Icons
    delivery_method_icon VARCHAR(50), -- 'van', 'bike', 'walking', 'truck'
    service_badge_icon VARCHAR(50), -- 'eco', 'express', 'economy', 'premium'
    
    -- Custom Colors
    badge_color VARCHAR(7), -- Hex color
    text_color VARCHAR(7),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(courier_id, service_code)
);

-- Enable RLS
ALTER TABLE courier_service_customization ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "courier_service_customization_select" 
ON courier_service_customization FOR SELECT 
USING (true); -- Public read

CREATE POLICY "courier_service_customization_manage" 
ON courier_service_customization FOR ALL 
USING (
    courier_id IN (
        SELECT courier_id FROM couriers 
        WHERE user_id = auth.uid()
    )
);
```

---

### **3. Icon Library**

```sql
CREATE TABLE IF NOT EXISTS icon_library (
    icon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Icon Details
    icon_code VARCHAR(50) UNIQUE NOT NULL,
    icon_name VARCHAR(100) NOT NULL,
    icon_category VARCHAR(50) NOT NULL, -- 'delivery_method', 'service_badge', 'feature'
    
    -- Icon Files
    svg_url TEXT, -- URL to SVG file
    png_url TEXT, -- URL to PNG file
    icon_data TEXT, -- Inline SVG data
    
    -- Display
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false, -- Premium icons for paid plans
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE icon_library ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "icon_library_select" 
ON icon_library FOR SELECT 
USING (is_active = true);

-- Insert default icons
INSERT INTO icon_library (icon_code, icon_name, icon_category, icon_data) VALUES
-- Delivery Method Icons
('van', 'Delivery Van', 'delivery_method', '<svg>...</svg>'),
('bike', 'Bicycle Delivery', 'delivery_method', '<svg>...</svg>'),
('walking', 'Walking Delivery', 'delivery_method', '<svg>...</svg>'),
('truck', 'Truck Delivery', 'delivery_method', '<svg>...</svg>'),
('parcel_shop', 'Parcel Shop', 'delivery_method', '<svg>...</svg>'),
('parcel_locker', 'Parcel Locker', 'delivery_method', '<svg>...</svg>'),
('click_collect', 'Click and Collect', 'delivery_method', '<svg>...</svg>'),
('drone', 'Drone Delivery', 'delivery_method', '<svg>...</svg>'),

-- Service Badge Icons
('eco_friendly', 'Eco-Friendly', 'service_badge', '<svg>...</svg>'),
('express', 'Express', 'service_badge', '<svg>...</svg>'),
('economy', 'Economy', 'service_badge', '<svg>...</svg>'),
('premium', 'Premium', 'service_badge', '<svg>...</svg>'),
('same_day', 'Same Day', 'service_badge', '<svg>...</svg>'),
('signature', 'Signature Required', 'service_badge', '<svg>...</svg>'),
('insurance', 'Insurance Included', 'service_badge', '<svg>...</svg>'),
('tracking', 'Track & Trace', 'service_badge', '<svg>...</svg>'),
('contactless', 'Contactless', 'service_badge', '<svg>...</svg>'),
('weekend', 'Weekend Delivery', 'service_badge', '<svg>...</svg>'),
('evening', 'Evening Delivery', 'service_badge', '<svg>...</svg>'),

-- Feature Icons
('sms', 'SMS Notifications', 'feature', '<svg>...</svg>'),
('email', 'Email Updates', 'feature', '<svg>...</svg>'),
('photo', 'Photo Proof', 'feature', '<svg>...</svg>'),
('calendar', 'Scheduled', 'feature', '<svg>...</svg>'),
('shield', 'Protected', 'feature', '<svg>...</svg>');
```

---

### **4. Custom Logo Upload**

```sql
CREATE TABLE IF NOT EXISTS custom_logos (
    logo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(user_id),
    owner_type VARCHAR(20) NOT NULL, -- 'merchant', 'courier'
    
    -- Logo Details
    logo_type VARCHAR(50) NOT NULL, -- 'courier_logo', 'service_icon', 'badge', 'brand'
    logo_name VARCHAR(100),
    
    -- File Information
    file_url TEXT NOT NULL,
    file_url_dark TEXT, -- Dark mode version
    thumbnail_url TEXT,
    file_size_bytes BIGINT,
    file_type VARCHAR(20), -- 'svg', 'png', 'jpg'
    
    -- Dimensions
    width_px INTEGER,
    height_px INTEGER,
    
    -- Usage
    is_active BOOLEAN DEFAULT true,
    usage_context VARCHAR(50), -- 'checkout', 'email', 'tracking', 'all'
    
    -- Metadata
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE custom_logos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "custom_logos_select" 
ON custom_logos FOR SELECT 
USING (owner_id = auth.uid() OR is_active = true);

CREATE POLICY "custom_logos_insert" 
ON custom_logos FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "custom_logos_update" 
ON custom_logos FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "custom_logos_delete" 
ON custom_logos FOR DELETE 
USING (owner_id = auth.uid());
```

---

## 🎨 ICON SPECIFICATIONS

### **Delivery Method Icons**

#### **1. Van Delivery** 🚐
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Van icon -->
  <path d="M17 8h3l3 3v5h-2a3 3 0 11-6 0H9a3 3 0 11-6 0H1V6a2 2 0 012-2h12a2 2 0 012 2v2z"/>
  <circle cx="6" cy="16" r="2"/>
  <circle cx="18" cy="16" r="2"/>
</svg>
```
**Use Case:** Standard home delivery by van

---

#### **2. Bike Delivery** 🚲
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Bicycle icon -->
  <circle cx="5" cy="18" r="3"/>
  <circle cx="19" cy="18" r="3"/>
  <path d="M12 2l-3 7h6l-3-7z"/>
  <path d="M5 18l7-9 7 9"/>
</svg>
```
**Use Case:** Eco-friendly bike delivery, urban areas

---

#### **3. Walking Delivery** 🚶
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Walking person icon -->
  <circle cx="12" cy="4" r="2"/>
  <path d="M10 8h4l-1 8h-2l-1-8z"/>
  <path d="M10 16l-2 6M14 16l2 6"/>
</svg>
```
**Use Case:** Local delivery on foot, very short distances

---

#### **4. Parcel Shop** 📦
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Store icon -->
  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
  <path d="M9 22V12h6v10"/>
</svg>
```
**Use Case:** Pickup at retail location

---

#### **5. Parcel Locker** 🔐
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Locker icon -->
  <rect x="3" y="3" width="18" height="18" rx="2"/>
  <rect x="6" y="6" width="5" height="5"/>
  <rect x="13" y="6" width="5" height="5"/>
  <rect x="6" y="13" width="5" height="5"/>
  <rect x="13" y="13" width="5" height="5"/>
</svg>
```
**Use Case:** 24/7 automated locker pickup

---

#### **6. Click and Collect** 🏪
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <!-- Store with cursor icon -->
  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
  <path d="M12 15l-3 3h6l-3-3z"/>
</svg>
```
**Use Case:** In-store pickup

---

### **Service Badge Icons**

#### **1. Eco-Friendly** ♻️
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <!-- Leaf icon -->
  <path d="M10 2C6 2 2 6 2 10c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-8z"/>
  <path d="M10 6v8M6 10h8"/>
</svg>
```
**Color:** #22c55e (Green)

---

#### **2. Express** ⚡
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <!-- Lightning bolt icon -->
  <path d="M13 2L3 14h8l-1 6 10-12h-8l1-6z"/>
</svg>
```
**Color:** #f59e0b (Amber)

---

#### **3. Economy** 💰
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <!-- Dollar sign icon -->
  <path d="M10 2v16M6 6h8a2 2 0 110 4H6M6 14h8a2 2 0 100-4H6"/>
</svg>
```
**Color:** #3b82f6 (Blue)

---

#### **4. Premium** ⭐
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <!-- Star icon -->
  <path d="M10 2l2.5 6.5L19 9.5l-5 4.5 1.5 6.5L10 17l-5.5 3.5L6 14l-5-4.5 6.5-1L10 2z"/>
</svg>
```
**Color:** #eab308 (Yellow)

---

#### **5. Same Day** 🏃
```svg
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <!-- Clock with arrow icon -->
  <circle cx="10" cy="10" r="8"/>
  <path d="M10 6v4l3 3"/>
  <path d="M16 4l2 2-2 2"/>
</svg>
```
**Color:** #ef4444 (Red)

---

## 🎨 UI COMPONENTS

### **1. Merchant Checkout Settings Page**

**Location:** `apps/web/src/pages/settings/CheckoutSettings.tsx`

```typescript
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Grid, Card } from '@mui/material';

export const CheckoutSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    checkout_title: 'Select Delivery Method',
    speed_section_title: 'How fast do you need it?',
    method_section_title: 'Where should we deliver?',
    courier_section_title: 'Choose your courier',
    // ... more settings
  });

  return (
    <Box>
      <Typography variant="h4">Checkout Customization</Typography>
      
      {/* Section Titles */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Section Titles</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Main Checkout Title"
              value={settings.checkout_title}
              onChange={(e) => setSettings({...settings, checkout_title: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Speed Section Title"
              value={settings.speed_section_title}
              onChange={(e) => setSettings({...settings, speed_section_title: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Method Section Title"
              value={settings.method_section_title}
              onChange={(e) => setSettings({...settings, method_section_title: e.target.value})}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Service Descriptions */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Service Descriptions</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Express Description"
              helperText="Shown for express delivery options"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Standard Description"
              helperText="Shown for standard delivery options"
            />
          </Grid>
        </Grid>
      </Card>

      {/* Icon Selection */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Delivery Method Icons</Typography>
        <IconSelector
          category="delivery_method"
          selected={settings.delivery_icons}
          onChange={(icons) => setSettings({...settings, delivery_icons: icons})}
        />
      </Card>

      {/* Color Customization */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Brand Colors</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <ColorPicker
              label="Primary Color"
              value={settings.primary_color}
              onChange={(color) => setSettings({...settings, primary_color: color})}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Preview */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Preview</Typography>
        <CheckoutPreview settings={settings} />
      </Card>

      {/* Save Button */}
      <Button variant="contained" size="large">
        Save Settings
      </Button>
    </Box>
  );
};
```

---

### **2. Icon Selector Component**

```typescript
import React from 'react';
import { Box, Grid, Card, Typography, Checkbox } from '@mui/material';

interface IconSelectorProps {
  category: 'delivery_method' | 'service_badge' | 'feature';
  selected: string[];
  onChange: (icons: string[]) => void;
}

export const IconSelector: React.FC<IconSelectorProps> = ({ category, selected, onChange }) => {
  const icons = useIconLibrary(category);

  const toggleIcon = (iconCode: string) => {
    if (selected.includes(iconCode)) {
      onChange(selected.filter(i => i !== iconCode));
    } else {
      onChange([...selected, iconCode]);
    }
  };

  return (
    <Grid container spacing={2}>
      {icons.map(icon => (
        <Grid item xs={6} sm={4} md={3} key={icon.icon_code}>
          <Card 
            sx={{ 
              p: 2, 
              cursor: 'pointer',
              border: selected.includes(icon.icon_code) ? '2px solid primary.main' : 'none'
            }}
            onClick={() => toggleIcon(icon.icon_code)}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Box 
                dangerouslySetInnerHTML={{ __html: icon.icon_data }}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption">{icon.icon_name}</Typography>
              <Checkbox 
                checked={selected.includes(icon.icon_code)}
                sx={{ mt: 1 }}
              />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
```

---

### **3. Logo Upload Component**

```typescript
import React, { useState } from 'react';
import { Box, Button, Typography, Card } from '@mui/material';
import { Upload } from '@mui/icons-material';

interface LogoUploadProps {
  logoType: 'courier_logo' | 'service_icon' | 'badge';
  onUpload: (file: File) => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ logoType, onUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      if (!['image/svg+xml', 'image/png', 'image/jpeg'].includes(file.type)) {
        alert('Please upload SVG, PNG, or JPG files only');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File size must be less than 2MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      onUpload(file);
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload {logoType.replace('_', ' ')}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Recommended: SVG format, max 2MB
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dimensions: 120x40px (3:1 ratio)
        </Typography>
      </Box>

      {preview && (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', height: 'auto' }} />
        </Box>
      )}

      <Button
        variant="outlined"
        component="label"
        startIcon={<Upload />}
      >
        Choose File
        <input
          type="file"
          hidden
          accept=".svg,.png,.jpg,.jpeg"
          onChange={handleFileChange}
        />
      </Button>
    </Card>
  );
};
```

---

## 📋 API ENDPOINTS

### **1. GET /api/merchant/checkout-settings**
Get merchant checkout customization settings

**Response:**
```json
{
  "checkout_title": "Select Delivery Method",
  "speed_section_title": "How fast do you need it?",
  "method_section_title": "Where should we deliver?",
  "courier_section_title": "Choose your courier",
  "express_description": "Delivered within 1 business day",
  "standard_description": "Delivered within 2-4 business days",
  "home_delivery_description": "Delivered to your door",
  "parcel_shop_description": "Pick up at your convenience",
  "primary_color": "#1976d2",
  "secondary_color": "#dc004e",
  "language_code": "en"
}
```

---

### **2. POST /api/merchant/checkout-settings**
Update checkout settings

**Request:**
```json
{
  "checkout_title": "Choose Your Delivery",
  "express_description": "Super fast delivery!",
  "primary_color": "#ff5722"
}
```

---

### **3. GET /api/icon-library**
Get available icons

**Query Parameters:**
- `category`: delivery_method | service_badge | feature
- `is_premium`: true | false

**Response:**
```json
{
  "icons": [
    {
      "icon_code": "van",
      "icon_name": "Delivery Van",
      "icon_category": "delivery_method",
      "icon_data": "<svg>...</svg>",
      "is_premium": false
    }
  ]
}
```

---

### **4. POST /api/custom-logos/upload**
Upload custom logo

**Request:** multipart/form-data
- `file`: File
- `logo_type`: courier_logo | service_icon | badge
- `usage_context`: checkout | email | tracking | all

**Response:**
```json
{
  "logo_id": "uuid",
  "file_url": "https://cdn.performile.com/logos/uuid.svg",
  "thumbnail_url": "https://cdn.performile.com/logos/uuid-thumb.png"
}
```

---

## 🎯 IMPLEMENTATION PLAN

### **Phase 1: Text Customization (Week 2) - $400**

**Day 1-2 (4 hours - $200):**
- [ ] Create database migration
- [ ] Build checkout settings page
- [ ] Add text input fields
- [ ] Save/load functionality

**Day 3 (2 hours - $100):**
- [ ] Add preview functionality
- [ ] Test with different text lengths
- [ ] Multi-language support

**Day 4 (2 hours - $100):**
- [ ] Apply settings to checkout
- [ ] Test end-to-end
- [ ] Documentation

---

### **Phase 2: Icon Library (Week 3) - $600**

**Day 1-2 (6 hours - $300):**
- [ ] Create icon library table
- [ ] Design/source icons (24 icons)
- [ ] Add icons to database
- [ ] Build icon selector component

**Day 3 (4 hours - $200):**
- [ ] Integrate icons in checkout
- [ ] Add icon customization per service
- [ ] Test icon display

**Day 4 (2 hours - $100):**
- [ ] Polish and bug fixes
- [ ] Documentation

---

### **Phase 3: Logo Upload (Week 3) - $400**

**Day 1 (4 hours - $200):**
- [ ] Setup file upload (AWS S3 or Supabase Storage)
- [ ] Create logo upload component
- [ ] Implement file validation
- [ ] Generate thumbnails

**Day 2 (4 hours - $200):**
- [ ] Integrate uploaded logos in checkout
- [ ] Add logo management (edit/delete)
- [ ] Test with different file formats
- [ ] Documentation

---

## 💰 BUDGET

**Total:** $1,400  
**Timeline:** Week 2-3 (2 weeks)

**Breakdown:**
- Text Customization: $400 (Phase 1)
- Icon Library: $600 (Phase 2)
- Logo Upload: $400 (Phase 3)

---

## ✅ SUCCESS CRITERIA

**Phase 1 Complete:**
- [ ] Merchants can customize all checkout text
- [ ] Changes appear in live checkout
- [ ] Preview works correctly
- [ ] Settings save/load properly

**Phase 2 Complete:**
- [ ] 24+ icons available
- [ ] Icon selector works
- [ ] Icons display in checkout
- [ ] Icons match service types

**Phase 3 Complete:**
- [ ] Logo upload works
- [ ] Logos display correctly
- [ ] File validation works
- [ ] Thumbnail generation works

---

## 📊 ICON INVENTORY

### **Delivery Method Icons (8):**
1. ✅ Van
2. ✅ Bike
3. ✅ Walking
4. ✅ Truck
5. ✅ Parcel Shop
6. ✅ Parcel Locker
7. ✅ Click and Collect
8. ✅ Drone (premium)

### **Service Badge Icons (11):**
1. ✅ Eco-Friendly
2. ✅ Express
3. ✅ Economy
4. ✅ Premium
5. ✅ Same Day
6. ✅ Signature Required
7. ✅ Insurance
8. ✅ Tracking
9. ✅ Contactless
10. ✅ Weekend
11. ✅ Evening

### **Feature Icons (5):**
1. ✅ SMS
2. ✅ Email
3. ✅ Photo Proof
4. ✅ Scheduled
5. ✅ Protected

**Total:** 24 icons

---

*Specification Created: November 4, 2025, 4:35 PM*  
*Status: Ready to implement*  
*Priority: HIGH*  
*Budget: $1,400*  
*Timeline: 2 weeks*
