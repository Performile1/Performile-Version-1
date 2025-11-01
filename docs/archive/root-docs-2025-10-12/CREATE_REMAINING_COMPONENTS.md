# Remaining Components to Create

## Progress
- ✅ Admin Components (12/12) - COMPLETE
- ✅ Consumer Components (9/9) - COMPLETE
- ⏳ Courier Components (0/12) - PENDING
- ⏳ Merchant Components (0/9) - PENDING

## Courier Components Needed

Create these files in `frontend/src/components/settings/courier/`:

1. CourierCompanySettings.tsx
2. CourierFleetSettings.tsx
3. CourierTeamSettings.tsx
4. CourierPerformanceSettings.tsx
5. CourierLeadsSettings.tsx
6. CourierPaymentSettings.tsx
7. CourierNotificationSettings.tsx
8. CourierAPISettings.tsx
9. CourierAnalyticsSettings.tsx
10. CourierGeneralSettings.tsx
11. CourierSecuritySettings.tsx
12. CourierPreferencesSettings.tsx

## Merchant Components Needed

Create these files in `frontend/src/components/settings/merchant/`:

1. RatingSettings.tsx
2. EmailTemplatesSettings.tsx
3. ReturnsSettings.tsx
4. PaymentSettings.tsx
5. NotificationSettings.tsx
6. APISettings.tsx
7. GeneralSettings.tsx
8. SecuritySettings.tsx
9. PreferencesSettings.tsx

## Template for Each Component

```typescript
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface [ComponentName]Props {
  subscriptionInfo?: any;
}

export const [ComponentName]: React.FC<[ComponentName]Props> = ({ subscriptionInfo }) => {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>[Title]</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>[Description]</Typography>
      <Paper sx={{ p: 3 }}><Typography>[Feature] coming soon.</Typography></Paper>
    </Box>
  );
};
```

## After Creating Components

1. Uncomment imports in:
   - `frontend/src/pages/AdminSettings.tsx`
   - `frontend/src/pages/ConsumerSettings.tsx`
   - `frontend/src/pages/CourierSettings.tsx`
   - `frontend/src/pages/MerchantSettings.tsx`

2. Replace placeholder `<Typography>` with actual component usage

3. Test build: `npm run build`

4. Commit and push
