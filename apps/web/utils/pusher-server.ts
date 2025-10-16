import Pusher from 'pusher';

let pusherInstance: Pusher | null = null;

/**
 * Get or create Pusher server instance
 */
export function getPusherServer(): Pusher {
  if (pusherInstance) {
    return pusherInstance;
  }

  const appId = process.env.VITE_PUSHER_APP_ID || process.env.PUSHER_APP_ID;
  const key = process.env.VITE_PUSHER_KEY || process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.VITE_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error('Pusher credentials not configured. Please set PUSHER_* environment variables.');
  }

  pusherInstance = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true
  });

  return pusherInstance;
}

/**
 * Send a notification to a specific user
 */
export async function sendNotificationToUser(
  userId: string,
  notification: {
    id?: string;
    type: 'order_update' | 'new_order' | 'courier_assigned' | 'rating_received' | 'system';
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  try {
    const pusher = getPusherServer();

    await pusher.trigger(`user-${userId}`, 'new-notification', {
      id: notification.id || `notif-${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString(),
      user_id: userId
    });

    console.log(`[Pusher] Notification sent to user-${userId}: ${notification.title}`);
  } catch (error) {
    console.error('[Pusher] Failed to send notification:', error);
    throw error;
  }
}

/**
 * Send notifications to multiple users
 */
export async function sendNotificationToMultipleUsers(
  userIds: string[],
  notification: {
    id?: string;
    type: 'order_update' | 'new_order' | 'courier_assigned' | 'rating_received' | 'system';
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  const promises = userIds.map(userId => sendNotificationToUser(userId, notification));
  await Promise.all(promises);
}

/**
 * Broadcast notification to all users (use sparingly)
 */
export async function broadcastNotification(
  notification: {
    id?: string;
    type: 'system';
    title: string;
    message: string;
    data?: any;
  }
): Promise<void> {
  try {
    const pusher = getPusherServer();

    await pusher.trigger('broadcast', 'new-notification', {
      id: notification.id || `notif-${Date.now()}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString()
    });

    console.log(`[Pusher] Broadcast notification sent: ${notification.title}`);
  } catch (error) {
    console.error('[Pusher] Failed to broadcast notification:', error);
    throw error;
  }
}
