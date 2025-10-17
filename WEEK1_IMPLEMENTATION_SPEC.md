# Week 1 Implementation Specification
**Date:** October 17-24, 2025  
**Status:** Specification Phase  
**Approval:** Pending User Review

---

## 🎯 OBJECTIVES

### Primary Goals
1. ✅ Achieve 100% frontend completion (Admin System Settings)
2. ✅ Implement Proximity/Range Settings System
3. ✅ Maintain all hard rules (no database breaking changes without approval)

### Success Metrics
- Frontend completion: 95% → 100%
- Platform completion: 92% → 96%
- All tests passing: 16/16 → 20/20
- Zero breaking changes to existing functionality

---

## 📅 TIMELINE

### Day 1-2 (Oct 17-18): Admin System Settings Page
**Effort:** 2-3 hours  
**Status:** Specification complete, awaiting approval

### Day 3-5 (Oct 19-21): Proximity System - Backend
**Effort:** 6-8 hours  
**Status:** Specification complete, awaiting approval

### Day 6-7 (Oct 22-24): Proximity System - Frontend
**Effort:** 6-8 hours  
**Status:** Specification complete, awaiting approval

---

## 🔧 FEATURE 1: ADMIN SYSTEM SETTINGS PAGE

### Overview
Create a comprehensive system settings page for administrators to configure platform-wide settings without touching code or database directly.

### User Story
**As an Admin**, I want to configure system settings through a UI so that I don't need to modify environment variables or database records manually.

---

### Database Schema (NO CHANGES REQUIRED ✅)

**Existing Table:** `system_settings` (already exists in 48 tables)

Verify structure:
```sql
-- Check if system_settings table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'system_settings'
ORDER BY ordinal_position;
```

**Expected columns:**
- `setting_id` (UUID, PRIMARY KEY)
- `setting_key` (VARCHAR, UNIQUE)
- `setting_value` (TEXT or JSONB)
- `setting_category` (VARCHAR) - e.g., 'email', 'api', 'security'
- `description` (TEXT)
- `is_public` (BOOLEAN) - Can non-admins see this?
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**⚠️ IF TABLE DOESN'T EXIST:** Document requirement, get approval before creating

---

### Backend API Specification

#### Endpoint 1: Get All Settings
```typescript
GET /api/admin/settings

Authentication: Required (Admin only)
Rate Limit: 100 requests/hour

Response:
{
  "success": true,
  "data": {
    "email": {
      "smtp_host": "smtp.sendgrid.net",
      "smtp_port": 587,
      "from_email": "noreply@performile.com",
      "from_name": "Performile"
    },
    "api": {
      "rate_limit_per_hour": 1000,
      "max_request_size_mb": 10,
      "enable_cors": true
    },
    "security": {
      "session_timeout_minutes": 60,
      "max_login_attempts": 5,
      "require_2fa": false
    },
    "features": {
      "enable_notifications": true,
      "enable_email_notifications": false,
      "enable_proximity_matching": false
    },
    "maintenance": {
      "maintenance_mode": false,
      "maintenance_message": ""
    }
  }
}
```

#### Endpoint 2: Update Settings
```typescript
PUT /api/admin/settings

Authentication: Required (Admin only)
Rate Limit: 50 requests/hour

Request Body:
{
  "category": "email",
  "settings": {
    "smtp_host": "smtp.sendgrid.net",
    "smtp_port": 587
  }
}

Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updated_count": 2,
    "updated_at": "2025-10-17T13:40:00Z"
  }
}
```

#### Endpoint 3: Reset Settings to Default
```typescript
POST /api/admin/settings/reset

Authentication: Required (Admin only)
Rate Limit: 10 requests/hour

Request Body:
{
  "category": "email" // Optional, if not provided resets all
}

Response:
{
  "success": true,
  "message": "Settings reset to default",
  "data": {
    "reset_count": 4
  }
}
```

#### Endpoint 4: Backup Settings
```typescript
GET /api/admin/settings/backup

Authentication: Required (Admin only)
Rate Limit: 10 requests/hour

Response:
{
  "success": true,
  "data": {
    "backup_id": "uuid",
    "timestamp": "2025-10-17T13:40:00Z",
    "settings": { /* all settings */ }
  }
}
```

#### Endpoint 5: Restore Settings
```typescript
POST /api/admin/settings/restore

Authentication: Required (Admin only)
Rate Limit: 10 requests/hour

Request Body:
{
  "backup_id": "uuid"
}

Response:
{
  "success": true,
  "message": "Settings restored successfully"
}
```

---

### Frontend Component Specification

#### File: `apps/web/src/pages/admin/SystemSettings.tsx`

**Component Structure:**
```typescript
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  TextField,
  Switch,
  Button,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

interface SystemSettings {
  email: EmailSettings;
  api: ApiSettings;
  security: SecuritySettings;
  features: FeatureSettings;
  maintenance: MaintenanceSettings;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  from_email: string;
  from_name: string;
  smtp_username?: string;
  smtp_password?: string;
}

// ... other interfaces

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings
  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/admin/settings');
      return response.data.data;
    }
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { category: string; settings: any }) => {
      return apiClient.put('/admin/settings', data);
    },
    onSuccess: () => {
      refetch();
      setHasChanges(false);
    }
  });

  // ... component logic

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        ⚙️ System Settings
      </Typography>
      
      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Email Configuration" />
          <Tab label="API Settings" />
          <Tab label="Security" />
          <Tab label="Features" />
          <Tab label="Maintenance" />
        </Tabs>

        <CardContent>
          {/* Tab panels with forms */}
        </CardContent>
      </Card>
    </Box>
  );
};
```

**Tab 1: Email Configuration**
- SMTP Host (text input)
- SMTP Port (number input)
- From Email (email input)
- From Name (text input)
- SMTP Username (text input, optional)
- SMTP Password (password input, optional)
- Test Email button

**Tab 2: API Settings**
- Rate Limit per Hour (number input)
- Max Request Size MB (number input)
- Enable CORS (switch)
- API Key Rotation Days (number input)

**Tab 3: Security**
- Session Timeout Minutes (number input)
- Max Login Attempts (number input)
- Require 2FA (switch)
- Password Min Length (number input)
- Enable IP Whitelist (switch)

**Tab 4: Features**
- Enable Notifications (switch)
- Enable Email Notifications (switch)
- Enable Proximity Matching (switch)
- Enable Real-time Updates (switch)
- Enable Advanced Analytics (switch)

**Tab 5: Maintenance**
- Maintenance Mode (switch)
- Maintenance Message (textarea)
- Scheduled Maintenance (date/time picker)

---

### Navigation Integration

**File:** `apps/web/src/components/layout/AppLayout.tsx`

Add to admin navigation:
```typescript
{
  label: 'System Settings',
  path: '/admin/system-settings',
  icon: Settings,
  roles: ['admin'],
}
```

---

### Testing Specification

#### Unit Tests
**File:** `apps/web/src/pages/admin/SystemSettings.test.tsx`

```typescript
describe('SystemSettings', () => {
  it('renders all tabs', () => {});
  it('fetches settings on mount', () => {});
  it('updates settings on save', () => {});
  it('shows validation errors', () => {});
  it('resets to defaults', () => {});
  it('creates backup', () => {});
  it('restores from backup', () => {});
});
```

#### E2E Test
**File:** `e2e-tests/tests/admin-system-settings.spec.ts`

```typescript
test('Admin can update system settings', async ({ page }) => {
  // Login as admin
  // Navigate to system settings
  // Change email settings
  // Save changes
  // Verify settings persisted
});
```

---

### Validation Rules

**Email Settings:**
- SMTP Host: Required, valid hostname
- SMTP Port: Required, 1-65535
- From Email: Required, valid email format
- From Name: Required, max 100 chars

**API Settings:**
- Rate Limit: Required, min 10, max 100000
- Max Request Size: Required, min 1, max 100 MB

**Security:**
- Session Timeout: Required, min 5, max 1440 minutes
- Max Login Attempts: Required, min 3, max 10
- Password Min Length: Required, min 8, max 128

---

### Error Handling

**Frontend:**
- Show validation errors inline
- Show API errors in Alert component
- Disable save button while saving
- Show loading state

**Backend:**
- Validate all inputs
- Return 400 for validation errors
- Return 403 for non-admin users
- Return 500 for server errors
- Log all setting changes to audit log

---

### Security Considerations

1. **Admin Only:** All endpoints require admin role
2. **Audit Logging:** Log all setting changes with user_id and timestamp
3. **Sensitive Data:** Mask passwords in UI, encrypt in database
4. **Rate Limiting:** Prevent abuse with rate limits
5. **Validation:** Server-side validation for all inputs

---

## 🗺️ FEATURE 2: PROXIMITY/RANGE SETTINGS SYSTEM

### Overview
Allow merchants, couriers, and admins to configure delivery proximity and service area settings based on postal codes and geographic distance.

### User Stories

**As a Merchant:**
- I want to set my delivery range (e.g., 50km radius)
- I want to define postal code ranges I serve
- I want to see a map of my coverage area
- I want to prevent orders from outside my range

**As a Courier:**
- I want to define my service areas by postal code
- I want to set my maximum service range
- I want to see nearby delivery opportunities
- I want to enable auto-accept for orders within my range

**As an Admin:**
- I want to view all proximity settings
- I want to see coverage maps for all merchants/couriers
- I want to set system-wide range limits
- I want to manage postal code database

---

### Database Schema Changes (REQUIRES APPROVAL ⚠️)

#### New Table: `proximity_settings`

```sql
-- ⚠️ DO NOT RUN WITHOUT APPROVAL
CREATE TABLE IF NOT EXISTS proximity_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  entity_type VARCHAR(20) NOT NULL, -- 'merchant', 'courier'
  entity_id UUID NOT NULL,
  
  -- Range settings
  delivery_range_km INTEGER DEFAULT 50,
  postal_code_ranges JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"start": "1000", "end": "1999"}, {"start": "2000", "end": "2500"}]
  
  -- Coordinates (for distance calculation)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  
  -- Additional settings
  auto_accept_within_range BOOLEAN DEFAULT false,
  notify_on_nearby_orders BOOLEAN DEFAULT true,
  priority_zones JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"postal_code": "1000", "priority": 1}]
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_entity UNIQUE(entity_type, entity_id),
  CONSTRAINT valid_entity_type CHECK (entity_type IN ('merchant', 'courier')),
  CONSTRAINT valid_range CHECK (delivery_range_km >= 0 AND delivery_range_km <= 1000)
);

-- Indexes
CREATE INDEX idx_proximity_user_id ON proximity_settings(user_id);
CREATE INDEX idx_proximity_entity ON proximity_settings(entity_type, entity_id);
CREATE INDEX idx_proximity_coords ON proximity_settings(latitude, longitude);
CREATE INDEX idx_proximity_active ON proximity_settings(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE proximity_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY proximity_select_own ON proximity_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY proximity_update_own ON proximity_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY proximity_insert_own ON proximity_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all
CREATE POLICY proximity_admin_all ON proximity_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid() 
      AND users.user_role = 'admin'
    )
  );
```

#### Alter Existing Tables (REQUIRES APPROVAL ⚠️)

```sql
-- ⚠️ DO NOT RUN WITHOUT APPROVAL

-- Add to merchants table
ALTER TABLE merchants 
ADD COLUMN IF NOT EXISTS delivery_range_km INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS postal_code_ranges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add to couriers table
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS service_range_km INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS postal_code_ranges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
```

---

### Helper Functions (REQUIRES APPROVAL ⚠️)

```sql
-- ⚠️ DO NOT RUN WITHOUT APPROVAL

-- Function: Calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  earth_radius CONSTANT DECIMAL := 6371; -- km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Check if postal code is in range
CREATE OR REPLACE FUNCTION is_postal_code_in_range(
  postal_code TEXT,
  postal_code_ranges JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  range_item JSONB;
  start_code TEXT;
  end_code TEXT;
BEGIN
  -- If ranges is empty, accept all
  IF jsonb_array_length(postal_code_ranges) = 0 THEN
    RETURN true;
  END IF;
  
  -- Check each range
  FOR range_item IN SELECT * FROM jsonb_array_elements(postal_code_ranges)
  LOOP
    start_code := range_item->>'start';
    end_code := range_item->>'end';
    
    IF postal_code >= start_code AND postal_code <= end_code THEN
      RETURN true;
    END IF;
  END LOOP;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Get nearby entities (merchants or couriers)
CREATE OR REPLACE FUNCTION get_nearby_entities(
  entity_type_param TEXT,
  latitude_param DECIMAL,
  longitude_param DECIMAL,
  max_distance_km INTEGER DEFAULT 50
) RETURNS TABLE (
  entity_id UUID,
  entity_name TEXT,
  distance_km DECIMAL,
  delivery_range_km INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.entity_id,
    CASE 
      WHEN ps.entity_type = 'merchant' THEN m.business_name
      WHEN ps.entity_type = 'courier' THEN c.courier_name
    END as entity_name,
    calculate_distance(
      latitude_param,
      longitude_param,
      ps.latitude,
      ps.longitude
    ) as distance_km,
    ps.delivery_range_km
  FROM proximity_settings ps
  LEFT JOIN merchants m ON ps.entity_type = 'merchant' AND ps.entity_id = m.merchant_id
  LEFT JOIN couriers c ON ps.entity_type = 'courier' AND ps.entity_id = c.courier_id
  WHERE ps.entity_type = entity_type_param
    AND ps.is_active = true
    AND ps.latitude IS NOT NULL
    AND ps.longitude IS NOT NULL
    AND calculate_distance(
      latitude_param,
      longitude_param,
      ps.latitude,
      ps.longitude
    ) <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

### Backend API Specification

#### Route: `/api/proximity`

**File:** `backend/src/routes/proximity.ts`

```typescript
import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { apiRateLimit } from '../middleware/security';
import database from '../config/database';
import logger from '../utils/logger';

const router = Router();

router.use(authenticateToken);
router.use(apiRateLimit);

/**
 * GET /api/proximity/settings
 * Get proximity settings for logged-in user
 */
router.get('/settings', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * PUT /api/proximity/settings
 * Update proximity settings
 */
router.put('/settings', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * POST /api/proximity/calculate
 * Calculate distance between two points
 */
router.post('/calculate', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * GET /api/proximity/nearby-orders
 * Get orders within delivery range
 */
router.get('/nearby-orders', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * GET /api/proximity/nearby-couriers
 * Get couriers within range (merchant only)
 */
router.get('/nearby-couriers', requireRole(['merchant', 'admin']), async (req: Request, res: Response) => {
  // Implementation
});

/**
 * POST /api/proximity/validate-postal
 * Validate if postal code is in service range
 */
router.post('/validate-postal', async (req: Request, res: Response) => {
  // Implementation
});

/**
 * GET /api/proximity/coverage-map
 * Get coverage map data (admin only)
 */
router.get('/coverage-map', requireRole(['admin']), async (req: Request, res: Response) => {
  // Implementation
});

export default router;
```

---

### Frontend Component Specifications

#### Component 1: Merchant Proximity Settings
**File:** `apps/web/src/pages/merchant/ProximitySettings.tsx`

**Features:**
- Delivery range slider (0-200km)
- Postal code range manager (add/remove ranges)
- Address input with geocoding
- Map showing coverage area
- Test postal code validator
- Save/cancel buttons

#### Component 2: Courier Service Area Settings
**File:** `apps/web/src/pages/courier/ServiceAreaSettings.tsx`

**Features:**
- Service range slider (0-500km)
- Postal code range manager
- Address input with geocoding
- Map showing service area
- Auto-accept toggle
- Notification preferences
- Nearby opportunities list

#### Component 3: Admin Proximity Management
**File:** `apps/web/src/pages/admin/ProximityManagement.tsx`

**Features:**
- View all proximity settings (table)
- Coverage map visualization (all entities)
- System-wide range limits
- Postal code database management
- Service area analytics
- Export coverage data

---

### External Dependencies

**Geocoding Service:**
- Option 1: Google Maps Geocoding API
- Option 2: OpenCage Geocoding API
- Option 3: Nominatim (OpenStreetMap)

**Map Visualization:**
- Option 1: Google Maps JavaScript API
- Option 2: Mapbox GL JS
- Option 3: Leaflet (open source)

**Recommendation:** Mapbox GL JS (better pricing, good features)

---

### Testing Specification

#### Unit Tests
- Distance calculation accuracy
- Postal code range validation
- Geocoding integration
- Settings CRUD operations

#### Integration Tests
- API endpoint responses
- Database queries performance
- RLS policy enforcement
- Helper function accuracy

#### E2E Tests
- Merchant sets delivery range
- Courier defines service area
- Admin views coverage map
- Order validation with proximity

---

### Performance Considerations

1. **Database Indexes:** Ensure spatial indexes on lat/lon columns
2. **Caching:** Cache geocoding results (Redis)
3. **Query Optimization:** Use PostGIS for advanced spatial queries
4. **Map Rendering:** Lazy load map, limit visible markers
5. **API Rate Limits:** Geocoding API has limits, implement caching

---

### Security Considerations

1. **RLS Policies:** Users can only modify their own settings
2. **Input Validation:** Validate all coordinates and ranges
3. **API Keys:** Secure geocoding API keys in environment
4. **Rate Limiting:** Prevent abuse of proximity calculations
5. **Data Privacy:** Don't expose exact coordinates publicly

---

## ⚠️ APPROVAL REQUIRED

### Database Changes
- [ ] Create `proximity_settings` table
- [ ] Alter `merchants` table (add 4 columns)
- [ ] Alter `couriers` table (add 4 columns)
- [ ] Create 3 helper functions

### External Services
- [ ] Choose geocoding service (Google/OpenCage/Nominatim)
- [ ] Choose map provider (Google Maps/Mapbox/Leaflet)
- [ ] Budget for API costs

### Implementation Order
- [ ] Approve Admin System Settings (Day 1-2)
- [ ] Approve Proximity System Database (Day 3)
- [ ] Approve Proximity System Backend (Day 4-5)
- [ ] Approve Proximity System Frontend (Day 6-7)

---

## 📊 SUCCESS CRITERIA

### Admin System Settings
- [ ] All 5 tabs functional
- [ ] Settings persist to database
- [ ] Validation working
- [ ] Admin navigation updated
- [ ] E2E test passing
- [ ] Frontend completion: 100%

### Proximity System
- [ ] Database tables created
- [ ] 7 API endpoints working
- [ ] 3 frontend pages complete
- [ ] Distance calculation accurate
- [ ] Map visualization working
- [ ] E2E tests passing
- [ ] Platform completion: 96%

---

## 🚨 ROLLBACK PLAN

If issues occur:
1. Revert code changes via git
2. Drop new database tables (if created)
3. Remove new API routes
4. Remove frontend pages
5. Restore from backup

---

**Status:** ✅ Specification Complete  
**Next Step:** User Review & Approval  
**Estimated Total Time:** 14-19 hours over 7 days
