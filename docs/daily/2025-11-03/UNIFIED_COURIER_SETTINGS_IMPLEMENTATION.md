# UNIFIED COURIER SETTINGS - IMPLEMENTATION GUIDE

**Date:** November 3, 2025, 10:10 PM  
**Status:** Ready to Implement  
**Priority:** HIGH (Week 1 - Launch Prep)

---

## 🎯 OBJECTIVE

Create a single, unified **"Courier Settings"** page that combines:
- Courier selection (which couriers merchant uses)
- API credentials management (add/test/edit credentials)
- Preferences (display order, auto-select)

---

## 📍 LOCATION

**Navigation:** Dashboard → Settings → Couriers

---

## 🎨 UI DESIGN

### **Page Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Courier Settings                                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  My Configured Couriers (2)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [DHL Logo] DHL eCommerce                            │  │
│  │  Status: ❌ Credentials Missing                       │  │
│  │  Added: Oct 31, 2025                                 │  │
│  │  [+ Add Credentials]                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [Instabox Logo] Instabox                            │  │
│  │  Status: ❌ Credentials Missing                       │  │
│  │  Added: Oct 31, 2025                                 │  │
│  │  [+ Add Credentials]                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Available Couriers                                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │ [PostNord] │ │  [Bring]   │ │   [UPS]    │             │
│  │ TrustScore │ │ TrustScore │ │ TrustScore │             │
│  │    4.5     │ │    4.7     │ │    4.3     │             │
│  │  [+ Add]   │ │  [+ Add]   │ │  [+ Add]   │             │
│  └────────────┘ └────────────┘ └────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENT STRUCTURE

### **Main Component:**
```typescript
// apps/web/src/pages/settings/CourierSettings.tsx

interface CourierWithStatus {
  selection_id: string;
  courier_id: string;
  courier_name: string;
  courier_code: string;
  logo_url: string;
  credentials_configured: boolean;
  has_credentials: boolean;
  customer_number?: string;
  is_active: boolean;
  added_during: string;
  created_at: string;
}

interface AvailableCourier {
  courier_id: string;
  courier_name: string;
  courier_code: string;
  logo_url: string;
  trust_score: number;
  is_selected: boolean;
}

export function CourierSettings() {
  // State
  const [configuredCouriers, setConfiguredCouriers] = useState<CourierWithStatus[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<AvailableCourier[]>([]);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<CourierWithStatus | null>(null);
  
  // Sections
  return (
    <div className="courier-settings">
      <h1>Courier Settings</h1>
      
      <ConfiguredCouriersSection 
        couriers={configuredCouriers}
        onAddCredentials={(courier) => {
          setSelectedCourier(courier);
          setShowCredentialsModal(true);
        }}
        onRemove={handleRemoveCourier}
      />
      
      <AvailableCouriersSection 
        couriers={availableCouriers}
        onAdd={handleAddCourier}
      />
      
      {showCredentialsModal && (
        <CredentialsModal
          courier={selectedCourier}
          onClose={() => setShowCredentialsModal(false)}
          onSave={handleSaveCredentials}
        />
      )}
    </div>
  );
}
```

---

## 📦 SUB-COMPONENTS

### **1. ConfiguredCourierCard**
```typescript
interface ConfiguredCourierCardProps {
  courier: CourierWithStatus;
  onAddCredentials: () => void;
  onEditCredentials: () => void;
  onTestConnection: () => void;
  onRemove: () => void;
}

export function ConfiguredCourierCard({ 
  courier, 
  onAddCredentials,
  onEditCredentials,
  onTestConnection,
  onRemove 
}: ConfiguredCourierCardProps) {
  return (
    <div className="courier-card configured">
      <img src={courier.logo_url} alt={courier.courier_name} />
      <div className="info">
        <h3>{courier.courier_name}</h3>
        <div className="status">
          {courier.credentials_configured ? (
            <>
              <CheckCircle className="text-green-500" />
              <span>Credentials Configured</span>
              <span className="customer-number">#{courier.customer_number}</span>
            </>
          ) : (
            <>
              <AlertCircle className="text-yellow-500" />
              <span>Credentials Missing</span>
            </>
          )}
        </div>
        <span className="added-date">Added {formatDate(courier.created_at)}</span>
      </div>
      
      <div className="actions">
        {courier.credentials_configured ? (
          <>
            <Button onClick={onTestConnection} variant="outline">
              <Zap size={16} /> Test
            </Button>
            <Button onClick={onEditCredentials} variant="outline">
              <Edit size={16} /> Edit
            </Button>
          </>
        ) : (
          <Button onClick={onAddCredentials} variant="primary">
            <Plus size={16} /> Add Credentials
          </Button>
        )}
        <Button onClick={onRemove} variant="ghost">
          <Trash size={16} />
        </Button>
      </div>
    </div>
  );
}
```

### **2. AvailableCourierCard**
```typescript
interface AvailableCourierCardProps {
  courier: AvailableCourier;
  onAdd: () => void;
}

export function AvailableCourierCard({ courier, onAdd }: AvailableCourierCardProps) {
  return (
    <div className="courier-card available">
      <img src={courier.logo_url} alt={courier.courier_name} />
      <h3>{courier.courier_name}</h3>
      <div className="trust-score">
        <Star className="text-yellow-400" />
        <span>{courier.trust_score.toFixed(1)}</span>
      </div>
      <Button onClick={onAdd} variant="outline" fullWidth>
        <Plus size={16} /> Add Courier
      </Button>
    </div>
  );
}
```

### **3. CredentialsModal**
```typescript
interface CredentialsModalProps {
  courier: CourierWithStatus | null;
  onClose: () => void;
  onSave: (credentials: CourierCredentials) => Promise<void>;
}

interface CourierCredentials {
  customer_number: string;
  api_key: string;
  account_name?: string;
}

export function CredentialsModal({ courier, onClose, onSave }: CredentialsModalProps) {
  const [credentials, setCredentials] = useState<CourierCredentials>({
    customer_number: '',
    api_key: '',
    account_name: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testCourierConnection(courier!.courier_id, credentials);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Modal onClose={onClose}>
      <h2>Add {courier?.courier_name} Credentials</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); onSave(credentials); }}>
        <div className="form-group">
          <label>Customer Number *</label>
          <input
            type="text"
            value={credentials.customer_number}
            onChange={(e) => setCredentials({ ...credentials, customer_number: e.target.value })}
            placeholder="Your customer number"
            required
          />
          <small>Find this in your {courier?.courier_name} portal</small>
        </div>
        
        <div className="form-group">
          <label>API Key *</label>
          <input
            type="password"
            value={credentials.api_key}
            onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
            placeholder="Your API key"
            required
          />
          <small>Generate this in {courier?.courier_name} Developer Portal</small>
        </div>
        
        <div className="form-group">
          <label>Account Name (optional)</label>
          <input
            type="text"
            value={credentials.account_name}
            onChange={(e) => setCredentials({ ...credentials, account_name: e.target.value })}
            placeholder="e.g., Main Account"
          />
        </div>
        
        <Button 
          type="button"
          onClick={handleTest} 
          disabled={testing || !credentials.customer_number || !credentials.api_key}
          variant="outline"
          fullWidth
        >
          {testing ? <Loader className="animate-spin" /> : <Zap />}
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        
        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            {testResult.success ? <CheckCircle /> : <XCircle />}
            {testResult.message}
          </div>
        )}
        
        <div className="modal-actions">
          <Button type="button" onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={!testResult?.success}
          >
            Save Credentials
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## 🔌 API INTEGRATION

### **Endpoints to Use:**

```typescript
// 1. Get merchant's configured couriers with credential status
GET /api/merchant/couriers
// Uses: vw_merchant_courier_credentials view
// Returns: List with credentials_configured flag

// 2. Get available couriers
GET /api/couriers/available?merchant_id={id}
// Uses: get_available_couriers_for_merchant() function
// Returns: All couriers with is_selected flag

// 3. Add courier to selection
POST /api/merchant/couriers
Body: { courier_id, store_id, added_during: 'settings' }
// Uses: add_merchant_courier_selection() function

// 4. Add/Update credentials
POST /api/courier-credentials
Body: {
  courier_id,
  merchant_id,
  store_id,
  customer_number,
  api_key,
  account_name,
  base_url
}
// Existing Week 3 API

// 5. Test credentials
POST /api/courier-credentials/test
Body: { courier_id, customer_number, api_key }

// 6. Remove courier
DELETE /api/merchant/couriers/{courier_id}
// Uses: remove_merchant_courier_selection() function
// Also deletes credentials
```

---

## 🎨 STYLING

```css
/* Courier Settings Page */
.courier-settings {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Configured Couriers Section */
.configured-couriers {
  margin-bottom: 3rem;
}

.courier-card.configured {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  background: white;
}

.courier-card.configured img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.courier-card.configured .info {
  flex: 1;
}

.courier-card.configured .status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.courier-card.configured .actions {
  display: flex;
  gap: 0.5rem;
}

/* Available Couriers Section */
.available-couriers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.courier-card.available {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  text-align: center;
  background: white;
  transition: all 0.2s;
}

.courier-card.available:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.courier-card.available img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin: 0 auto 1rem;
}

.courier-card.available .trust-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

/* Credentials Modal */
.credentials-modal {
  max-width: 500px;
}

.test-result {
  padding: 1rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.test-result.success {
  background: #dcfce7;
  color: #166534;
}

.test-result.error {
  background: #fee2e2;
  color: #991b1b;
}
```

---

## 📝 USER FLOW

### **Flow 1: Add New Courier**
1. User sees "Available Couriers" grid
2. Clicks "+ Add" on PostNord
3. PostNord added to "My Configured Couriers"
4. Status shows "❌ Credentials Missing"
5. User clicks "+ Add Credentials"
6. Modal opens with form
7. User enters customer number + API key
8. Clicks "Test Connection"
9. ✅ Test successful
10. Clicks "Save Credentials"
11. Status updates to "✅ Credentials Configured"
12. User can now book with PostNord

### **Flow 2: Edit Existing Credentials**
1. User sees configured courier
2. Clicks "Edit"
3. Modal opens with existing data (masked)
4. User updates API key
5. Tests connection
6. Saves

### **Flow 3: Remove Courier**
1. User clicks trash icon
2. Confirmation dialog
3. Courier removed from list
4. Credentials also deleted

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Single "Courier Settings" page under Settings
- [ ] Shows configured couriers with credential status
- [ ] Shows available couriers to add
- [ ] Can add courier to selection
- [ ] Can add/edit credentials via modal
- [ ] Can test connection before saving
- [ ] Can remove courier (deletes selection + credentials)
- [ ] Real-time status updates
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] Success/error toasts

---

## 🚀 IMPLEMENTATION STEPS

1. **Create main component** (`CourierSettings.tsx`)
2. **Create sub-components** (cards, modal)
3. **Add to Settings navigation**
4. **Connect to existing APIs**
5. **Add styling**
6. **Test with merchant@performile.com**
7. **Deploy**

---

## 📊 SUCCESS METRICS

- Merchants can add couriers in < 2 minutes
- Credential test success rate > 95%
- Clear visual feedback on status
- Zero confusion about where to manage couriers

---

**READY TO BUILD!** 🎉
