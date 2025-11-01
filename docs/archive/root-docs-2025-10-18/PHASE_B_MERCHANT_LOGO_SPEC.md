# Phase B: Merchant Logo Upload Feature - Specification

**Created:** October 18, 2025, 5:18 PM  
**Estimated Duration:** 7 hours  
**Priority:** High  
**Status:** In Progress

---

## 🎯 OBJECTIVE

Enable merchants to upload their shop/brand logos, which will be:
1. Visible to couriers when viewing leads in the marketplace
2. Visible to admins in merchant management pages
3. Stored securely in Supabase Storage
4. Optimized and validated for size/format

---

## 📋 REQUIREMENTS

### **Functional Requirements:**

1. **Upload Capability:**
   - Merchants can upload logo images (PNG, JPG, SVG)
   - Max file size: 2MB
   - Recommended dimensions: 200x200px (square)
   - Auto-resize/crop if needed

2. **Storage:**
   - Store in Supabase Storage bucket
   - Secure access with RLS policies
   - CDN-enabled for fast delivery

3. **Display:**
   - Show in courier marketplace (lead cards)
   - Show in admin merchant management
   - Show in merchant settings
   - Fallback to initials if no logo

4. **Management:**
   - Upload new logo
   - Replace existing logo
   - Delete logo
   - Preview before upload

### **Non-Functional Requirements:**

1. **Security:**
   - File type validation
   - Size validation
   - Malware scanning (future)
   - Secure URLs with expiry

2. **Performance:**
   - Image optimization
   - CDN delivery
   - Lazy loading
   - Caching

3. **UX:**
   - Drag & drop upload
   - Progress indicator
   - Error handling
   - Success feedback

---

## 🗄️ DATABASE SCHEMA

### **Option 1: Add Column to Existing Table** (Recommended)

```sql
-- Add logo_url to stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS logo_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_logo_url ON stores(logo_url) WHERE logo_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN stores.logo_url IS 'URL to merchant logo in Supabase Storage';
```

**Pros:**
- ✅ Simple, no new table
- ✅ Direct relationship
- ✅ Fast queries
- ✅ Easy to implement

**Cons:**
- ❌ Less flexible for multiple logos
- ❌ No version history

### **Option 2: New Table for Logo Management**

```sql
-- Create merchant_logos table
CREATE TABLE IF NOT EXISTS merchant_logos (
  logo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES stores(shop_id) ON DELETE CASCADE,
  logo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES users(user_id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_active_logo_per_shop UNIQUE (shop_id, is_active) WHERE is_active = true
);

-- Indexes
CREATE INDEX idx_merchant_logos_shop_id ON merchant_logos(shop_id);
CREATE INDEX idx_merchant_logos_active ON merchant_logos(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE merchant_logos ENABLE ROW LEVEL SECURITY;

-- Merchants can view their own logos
CREATE POLICY merchant_logos_select_own ON merchant_logos
  FOR SELECT
  USING (
    shop_id IN (
      SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
    )
  );

-- Merchants can insert their own logos
CREATE POLICY merchant_logos_insert_own ON merchant_logos
  FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
    )
  );

-- Merchants can update their own logos
CREATE POLICY merchant_logos_update_own ON merchant_logos
  FOR UPDATE
  USING (
    shop_id IN (
      SELECT shop_id FROM stores WHERE merchant_id = auth.uid()
    )
  );

-- Admins can view all logos
CREATE POLICY merchant_logos_admin_all ON merchant_logos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE user_id = auth.uid() AND user_role = 'admin'
    )
  );

-- Couriers can view active logos
CREATE POLICY merchant_logos_courier_view ON merchant_logos
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM users WHERE user_id = auth.uid() AND user_role = 'courier'
    )
  );
```

**Pros:**
- ✅ Version history
- ✅ Multiple logos per shop
- ✅ Detailed metadata
- ✅ Audit trail

**Cons:**
- ❌ More complex
- ❌ Additional JOIN queries
- ❌ More storage

### **DECISION: Use Option 1 (Add Column)**

**Rationale:**
- Simpler implementation
- Faster queries
- Sufficient for MVP
- Can migrate to Option 2 later if needed

---

## 📦 SUPABASE STORAGE

### **Bucket Configuration:**

```typescript
// Bucket name: merchant-logos
{
  name: 'merchant-logos',
  public: false, // Require authentication
  fileSizeLimit: 2097152, // 2MB
  allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
}
```

### **Storage Structure:**

```
merchant-logos/
  ├── {shop_id}/
  │   ├── logo.png
  │   └── logo_thumb.png (optional)
```

### **RLS Policies:**

```sql
-- Merchants can upload to their own folder
CREATE POLICY merchant_logos_upload ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'merchant-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT shop_id::text FROM stores WHERE merchant_id = auth.uid()
    )
  );

-- Merchants can view their own logos
CREATE POLICY merchant_logos_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'merchant-logos' AND
    (
      (storage.foldername(name))[1] IN (
        SELECT shop_id::text FROM stores WHERE merchant_id = auth.uid()
      )
      OR
      EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND user_role IN ('admin', 'courier'))
    )
  );

-- Merchants can delete their own logos
CREATE POLICY merchant_logos_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'merchant-logos' AND
    (storage.foldername(name))[1] IN (
      SELECT shop_id::text FROM stores WHERE merchant_id = auth.uid()
    )
  );
```

---

## 🔌 API ENDPOINTS

### **1. Upload Logo**

```typescript
POST /api/merchant/logo/upload

Headers:
  Authorization: Bearer {token}
  Content-Type: multipart/form-data

Body:
  file: File (image)
  shop_id: UUID

Response:
  {
    success: true,
    data: {
      logo_url: string,
      file_name: string,
      file_size: number,
      uploaded_at: string
    }
  }

Errors:
  400 - Invalid file type/size
  401 - Unauthorized
  403 - Not shop owner
  500 - Upload failed
```

### **2. Get Logo**

```typescript
GET /api/merchant/logo/:shop_id

Headers:
  Authorization: Bearer {token}

Response:
  {
    success: true,
    data: {
      logo_url: string | null,
      logo_updated_at: string | null
    }
  }
```

### **3. Delete Logo**

```typescript
DELETE /api/merchant/logo/:shop_id

Headers:
  Authorization: Bearer {token}

Response:
  {
    success: true,
    message: "Logo deleted successfully"
  }
```

---

## 🎨 FRONTEND COMPONENTS

### **1. MerchantLogoUpload Component**

**File:** `apps/web/src/components/merchant/MerchantLogoUpload.tsx`

**Features:**
- Drag & drop zone
- File picker button
- Image preview
- Upload progress
- Error messages
- Success feedback
- Delete option

**Props:**
```typescript
interface MerchantLogoUploadProps {
  shopId: string;
  currentLogoUrl?: string | null;
  onUploadSuccess?: (logoUrl: string) => void;
  onDeleteSuccess?: () => void;
}
```

### **2. MerchantLogo Component**

**File:** `apps/web/src/components/merchant/MerchantLogo.tsx`

**Features:**
- Display merchant logo
- Fallback to initials
- Multiple sizes
- Loading state
- Error handling
- Tooltip with shop name

**Props:**
```typescript
interface MerchantLogoProps {
  shopId?: string;
  shopName: string;
  logoUrl?: string | null;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  variant?: 'circular' | 'rounded' | 'square';
  showName?: boolean;
  tooltip?: boolean;
}
```

---

## 📍 INTEGRATION POINTS

### **Pages to Update:**

1. **Merchant Settings** (Primary)
   - File: `apps/web/src/pages/settings/MerchantProfile.tsx`
   - Add: Logo upload section
   - Display: Current logo with upload/delete options

2. **Courier Marketplace** (High Priority)
   - File: `apps/web/src/components/marketplace/CourierMarketplace.tsx`
   - Add: MerchantLogo component to lead cards
   - Display: Shop logo next to shop name

3. **Admin Merchant Management**
   - File: `apps/web/src/pages/admin/ManageMerchants.tsx`
   - Add: MerchantLogo in table/cards
   - Display: Logo in merchant list

4. **Merchant Dashboard** (Optional)
   - File: `apps/web/src/pages/Dashboard.tsx`
   - Add: Logo in header/profile section

---

## 🔄 IMPLEMENTATION PHASES

### **Phase B.1: Database Setup** (30 min)
- [ ] Create migration file
- [ ] Add logo_url column to stores table
- [ ] Add indexes
- [ ] Test migration

### **Phase B.2: Supabase Storage** (45 min)
- [ ] Create merchant-logos bucket
- [ ] Configure bucket settings
- [ ] Set up RLS policies
- [ ] Test upload/download

### **Phase B.3: Backend API** (2 hours)
- [ ] Create upload endpoint
- [ ] Add file validation
- [ ] Implement image processing
- [ ] Create get/delete endpoints
- [ ] Add error handling
- [ ] Write tests

### **Phase B.4: MerchantLogo Component** (1 hour)
- [ ] Create component file
- [ ] Implement display logic
- [ ] Add fallback to initials
- [ ] Add loading states
- [ ] Style component
- [ ] Add documentation

### **Phase B.5: MerchantLogoUpload Component** (1.5 hours)
- [ ] Create upload component
- [ ] Implement drag & drop
- [ ] Add file validation
- [ ] Show upload progress
- [ ] Handle errors
- [ ] Add delete functionality
- [ ] Style component

### **Phase B.6: Integration** (1.5 hours)
- [ ] Add to Merchant Settings
- [ ] Add to Courier Marketplace
- [ ] Add to Admin pages
- [ ] Test all integrations

### **Phase B.7: Testing & Polish** (30 min)
- [ ] End-to-end testing
- [ ] Error scenario testing
- [ ] UI/UX polish
- [ ] Documentation

**Total Estimated Time:** 7 hours

---

## ✅ ACCEPTANCE CRITERIA

### **Must Have:**
- [x] Merchants can upload logos (PNG, JPG, SVG)
- [x] Logos stored securely in Supabase Storage
- [x] Logos visible in courier marketplace
- [x] Logos visible in admin pages
- [x] File size/type validation
- [x] Error handling
- [x] Delete functionality

### **Should Have:**
- [ ] Image optimization/resizing
- [ ] Drag & drop upload
- [ ] Upload progress indicator
- [ ] Preview before upload
- [ ] Fallback to initials

### **Nice to Have:**
- [ ] Multiple logo versions (light/dark)
- [ ] Logo history/versions
- [ ] Crop/edit functionality
- [ ] Bulk upload (admin)

---

## 🎯 SUCCESS METRICS

**Technical:**
- Upload success rate > 95%
- Average upload time < 3 seconds
- Zero security vulnerabilities
- 100% RLS policy coverage

**Business:**
- 50%+ merchants upload logos (first month)
- Improved marketplace engagement
- Better brand recognition
- Professional appearance

---

## 🚨 RISKS & MITIGATION

### **Risk 1: Large File Uploads**
- **Mitigation:** 2MB size limit, client-side validation, compression

### **Risk 2: Storage Costs**
- **Mitigation:** Monitor usage, implement cleanup for deleted shops

### **Risk 3: Inappropriate Content**
- **Mitigation:** Manual review for first upload, reporting system

### **Risk 4: Performance Impact**
- **Mitigation:** CDN, lazy loading, image optimization

---

## 📚 REFERENCES

- Supabase Storage Docs: https://supabase.com/docs/guides/storage
- Image Optimization: https://web.dev/fast/#optimize-your-images
- File Upload Best Practices: https://web.dev/file-upload-best-practices/

---

**Status:** Ready to implement  
**Next Step:** Phase B.1 - Database Setup

---

*Created: October 18, 2025, 5:18 PM*
