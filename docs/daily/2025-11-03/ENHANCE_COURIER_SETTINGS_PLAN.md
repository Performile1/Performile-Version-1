# ENHANCE COURIER SETTINGS - IMPLEMENTATION PLAN

**Date:** November 3, 2025, 10:25 PM  
**File:** `apps/web/src/pages/settings/MerchantCourierSettings.tsx`  
**Status:** Enhancement Required

---

## 🎯 CURRENT STATE

**Existing File:** `MerchantCourierSettings.tsx` (656 lines)

**What it has:**
✅ Courier selection (add/remove couriers)
✅ Display order management
✅ Enable/disable toggle
✅ Custom naming
✅ Subscription limits
✅ API key display (for e-commerce plugins)

**What it's missing:**
❌ API credentials management (customer number, API key per courier)
❌ Credential status indicator
❌ Test connection functionality
❌ Add/edit credentials modal

---

## 🔧 ENHANCEMENT PLAN

### **Add to Existing Component:**

1. **Update Interface** - Add credentials fields
2. **Add Credentials Status** - Show ✅ or ❌ next to each courier
3. **Add Credentials Button** - For couriers without credentials
4. **Edit Credentials Button** - For couriers with credentials
5. **Test Connection Button** - Validate credentials
6. **Credentials Modal** - Form to add/edit credentials

---

## 📋 CHANGES NEEDED

### **1. Update Courier Interface**

```typescript
interface Courier {
  courier_id: string;
  courier_name: string;
  logo_url: string | null;
  trust_score: number;
  is_active: boolean;
  display_order: number;
  custom_name: string | null;
  custom_description: string | null;
  priority_level: number;
  total_deliveries: number;
  reliability_score: number;
  courier_code: string;
  
  // ADD THESE:
  credentials_configured: boolean;
  has_credentials: boolean;
  customer_number?: string;
  credential_id?: string;
}
```

### **2. Add State for Credentials Modal**

```typescript
const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
const [selectedCourierForCredentials, setSelectedCourierForCredentials] = useState<Courier | null>(null);
const [credentialsForm, setCredentialsForm] = useState({
  customer_number: '',
  api_key: '',
  account_name: '',
  base_url: ''
});
const [testingConnection, setTestingConnection] = useState(false);
const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
```

### **3. Update API Call to Get Credentials Status**

```typescript
const fetchSelectedCouriers = async () => {
  try {
    const token = localStorage.getItem('token');
    // CHANGE THIS to use the new view
    const response = await axios.get(
      '/api/merchant/couriers',  // New endpoint
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setCouriers(response.data.couriers || []);
  } catch (error) {
    console.error('Error fetching couriers:', error);
    toast.error('Failed to load couriers');
  }
};
```

### **4. Add Credentials Functions**

```typescript
const handleAddCredentials = (courier: Courier) => {
  setSelectedCourierForCredentials(courier);
  setCredentialsForm({
    customer_number: courier.customer_number || '',
    api_key: '',
    account_name: '',
    base_url: getCourierBaseUrl(courier.courier_code)
  });
  setTestResult(null);
  setCredentialsModalOpen(true);
};

const handleTestConnection = async () => {
  setTestingConnection(true);
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      '/api/courier-credentials/test',
      {
        courier_id: selectedCourierForCredentials?.courier_id,
        customer_number: credentialsForm.customer_number,
        api_key: credentialsForm.api_key,
        base_url: credentialsForm.base_url
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setTestResult({
      success: true,
      message: 'Connection successful!'
    });
    toast.success('Connection test passed!');
  } catch (error: any) {
    setTestResult({
      success: false,
      message: error.response?.data?.message || 'Connection failed'
    });
    toast.error('Connection test failed');
  } finally {
    setTestingConnection(false);
  }
};

const handleSaveCredentials = async () => {
  if (!testResult?.success) {
    toast.error('Please test the connection first');
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    await axios.post(
      '/api/courier-credentials',
      {
        courier_id: selectedCourierForCredentials?.courier_id,
        customer_number: credentialsForm.customer_number,
        api_key: credentialsForm.api_key,
        account_name: credentialsForm.account_name,
        base_url: credentialsForm.base_url
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    toast.success('Credentials saved successfully');
    setCredentialsModalOpen(false);
    fetchSelectedCouriers(); // Refresh to show updated status
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Failed to save credentials');
  }
};

const getCourierBaseUrl = (courierCode: string): string => {
  const urls: Record<string, string> = {
    'POSTNORD': 'https://api2.postnord.com',
    'BRING': 'https://api.bring.com',
    'DHL': 'https://api-eu.dhl.com',
    'UPS': 'https://onlinetools.ups.com',
    'FEDEX': 'https://apis.fedex.com',
    'INSTABOX': 'https://api.instabox.io'
  };
  return urls[courierCode] || '';
};
```

### **5. Update Courier Card UI**

```typescript
// In the courier card, add credentials status
<Box sx={{ flexGrow: 1 }}>
  {/* ... existing name/edit section ... */}
  
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
    {/* Existing trust score, deliveries */}
    
    {/* ADD THIS: Credentials Status */}
    {courier.credentials_configured ? (
      <Chip 
        icon={<Check />}
        label={`Credentials: ${courier.customer_number}`}
        size="small" 
        color="success" 
      />
    ) : (
      <Chip 
        icon={<Lock />}
        label="No Credentials"
        size="small" 
        color="warning" 
      />
    )}
  </Box>
</Box>

{/* ADD THIS: Credentials Button */}
{courier.credentials_configured ? (
  <Tooltip title="Edit credentials">
    <IconButton
      color="primary"
      onClick={() => handleAddCredentials(courier)}
    >
      <Edit />
    </IconButton>
  </Tooltip>
) : (
  <Button
    variant="outlined"
    size="small"
    startIcon={<Add />}
    onClick={() => handleAddCredentials(courier)}
  >
    Add Credentials
  </Button>
)}
```

### **6. Add Credentials Modal**

```typescript
{/* ADD THIS: Credentials Modal */}
<Dialog 
  open={credentialsModalOpen} 
  onClose={() => setCredentialsModalOpen(false)} 
  maxWidth="sm" 
  fullWidth
>
  <DialogTitle>
    {selectedCourierForCredentials?.credentials_configured ? 'Edit' : 'Add'} {selectedCourierForCredentials?.courier_name} Credentials
  </DialogTitle>
  <DialogContent>
    <Box sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Customer Number"
        value={credentialsForm.customer_number}
        onChange={(e) => setCredentialsForm({...credentialsForm, customer_number: e.target.value})}
        required
        sx={{ mb: 2 }}
        helperText={`Find this in your ${selectedCourierForCredentials?.courier_name} portal`}
      />
      
      <TextField
        fullWidth
        label="API Key"
        type="password"
        value={credentialsForm.api_key}
        onChange={(e) => setCredentialsForm({...credentialsForm, api_key: e.target.value})}
        required
        sx={{ mb: 2 }}
        helperText={`Generate this in ${selectedCourierForCredentials?.courier_name} Developer Portal`}
      />
      
      <TextField
        fullWidth
        label="Account Name (optional)"
        value={credentialsForm.account_name}
        onChange={(e) => setCredentialsForm({...credentialsForm, account_name: e.target.value})}
        sx={{ mb: 2 }}
        helperText="e.g., Main Account, Store 1"
      />
      
      <TextField
        fullWidth
        label="API Base URL"
        value={credentialsForm.base_url}
        onChange={(e) => setCredentialsForm({...credentialsForm, base_url: e.target.value})}
        sx={{ mb: 2 }}
        helperText="API endpoint URL"
      />
      
      <Button
        fullWidth
        variant="outlined"
        onClick={handleTestConnection}
        disabled={testingConnection || !credentialsForm.customer_number || !credentialsForm.api_key}
        sx={{ mb: 2 }}
      >
        {testingConnection ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Testing Connection...
          </>
        ) : (
          'Test Connection'
        )}
      </Button>
      
      {testResult && (
        <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
          {testResult.message}
        </Alert>
      )}
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setCredentialsModalOpen(false)}>
      Cancel
    </Button>
    <Button 
      onClick={handleSaveCredentials}
      variant="contained"
      disabled={!testResult?.success}
    >
      Save Credentials
    </Button>
  </DialogActions>
</Dialog>
```

---

## 🔌 API ENDPOINTS NEEDED

### **1. Get Merchant Couriers with Credentials Status**
```
GET /api/merchant/couriers
Returns: List of couriers with credentials_configured flag
```

### **2. Add/Update Credentials**
```
POST /api/courier-credentials
Body: {
  courier_id,
  customer_number,
  api_key,
  account_name,
  base_url
}
```

### **3. Test Connection**
```
POST /api/courier-credentials/test
Body: {
  courier_id,
  customer_number,
  api_key,
  base_url
}
```

---

## ✅ IMPLEMENTATION STEPS

1. **Update interfaces** - Add credentials fields
2. **Add state variables** - For modal and form
3. **Update fetchSelectedCouriers** - Use new endpoint
4. **Add credential functions** - Test, save, edit
5. **Update courier card UI** - Show status, add buttons
6. **Add credentials modal** - Form with test functionality
7. **Test with merchant@performile.com**

---

## 📊 VISUAL CHANGES

### **Before:**
```
[DHL Logo] DHL eCommerce
★ 4.5 TrustScore • 1,234 deliveries
[Toggle] [Edit Name] [Delete]
```

### **After:**
```
[DHL Logo] DHL eCommerce
★ 4.5 TrustScore • 1,234 deliveries
⚠️ No Credentials
[Toggle] [Edit Name] [+ Add Credentials] [Delete]
```

### **After Credentials Added:**
```
[DHL Logo] DHL eCommerce
★ 4.5 TrustScore • 1,234 deliveries
✅ Credentials: #12345
[Toggle] [Edit Name] [Edit Credentials] [Delete]
```

---

**READY TO IMPLEMENT!** 🚀
