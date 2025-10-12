# Pusher Real-Time Notifications Setup Guide

## Step 1: Create Pusher Account

1. Go to https://dashboard.pusher.com/accounts/sign_up
2. Sign up for a free account
3. Create a new **Channels** app (NOT Beams)
4. Choose the **Sandbox plan** (free tier)
5. Select your preferred cluster (e.g., `us2` or `eu`)

## Step 2: Get Your Credentials

After creating your app, you'll see these credentials on the dashboard:

- **App ID**: e.g., `1234567`
- **Key**: e.g., `abc123def456ghi789` (public key)
- **Secret**: e.g., `xyz789uvw456rst123` (private key)
- **Cluster**: e.g., `us2` or `eu`

## Step 3: Update Environment Variables

### Frontend `.env` file

Update `frontend/.env` with your Pusher credentials:

```env
# Pusher Configuration (Real-time Notifications)
VITE_PUSHER_KEY=your_actual_pusher_key_here
VITE_PUSHER_CLUSTER=us2
VITE_PUSHER_APP_ID=your_actual_app_id_here
PUSHER_SECRET=your_actual_pusher_secret_here
```

### Vercel Environment Variables

If deploying to Vercel, add these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add:
   - `VITE_PUSHER_KEY` = your key
   - `VITE_PUSHER_CLUSTER` = your cluster
   - `VITE_PUSHER_APP_ID` = your app ID
   - `PUSHER_SECRET` = your secret

## Step 4: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `pusher` (server-side)
- `pusher-js` (client-side)

## Step 5: Test the Setup

### Start the development server:

```bash
npm run dev
```

### Test sending a notification:

You can test by making a POST request to `/api/notifications-send`:

```bash
curl -X POST http://localhost:3000/api/notifications-send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userId": "user-id-here",
    "notification": {
      "type": "system",
      "title": "Test Notification",
      "message": "This is a test notification from Pusher!"
    }
  }'
```

## Step 6: Using Notifications in Your Code

### Send a notification from any API endpoint:

```typescript
import { sendNotificationToUser } from '@/utils/pusher-server';

// In your API handler
await sendNotificationToUser(userId, {
  type: 'order_update',
  title: 'Order Updated',
  message: 'Your order #12345 has been shipped!',
  data: { orderId: '12345' }
});
```

### Example: Send notification when order is created

```typescript
// In your orders API endpoint
import { sendNotificationToUser } from '@/utils/pusher-server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ... create order logic ...
  
  // Send notification to merchant
  await sendNotificationToUser(merchantId, {
    type: 'new_order',
    title: 'New Order Received',
    message: `Order #${orderId} has been placed`,
    data: { orderId, amount: orderTotal }
  });
  
  return res.json({ success: true });
}
```

## Notification Types

The system supports these notification types:

- `order_update` - Order status changes
- `new_order` - New order received
- `courier_assigned` - Courier assigned to order
- `rating_received` - New rating/review received
- `system` - System announcements

## Troubleshooting

### "Pusher not configured" error

- Check that all environment variables are set correctly
- Restart your dev server after updating `.env`
- Verify credentials in Pusher dashboard

### Notifications not appearing

- Open browser console and check for Pusher connection logs
- Verify the `userId` matches the logged-in user
- Check Pusher dashboard "Debug Console" for live events

### CORS errors

- Pusher Channels handles CORS automatically
- Ensure your Pusher app is configured for your domain

## Pusher Dashboard

Monitor real-time events in the Pusher dashboard:
- https://dashboard.pusher.com/apps/YOUR_APP_ID/getting_started

You can see:
- Active connections
- Messages sent
- Debug console with live events

## Free Tier Limits

Pusher Sandbox plan includes:
- 100 concurrent connections
- 200,000 messages per day
- Unlimited channels

This is sufficient for development and small production deployments.

## Next Steps

Once configured, notifications will:
1. ✅ Appear in real-time (no page refresh needed)
2. ✅ Show toast notifications
3. ✅ Update the notification bell badge
4. ✅ Persist in the notification dropdown
5. ✅ Trigger query invalidation for fresh data
