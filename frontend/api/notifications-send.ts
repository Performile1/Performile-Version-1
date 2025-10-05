import type { VercelRequest, VercelResponse } from '@vercel/node';
import Pusher from 'pusher';
import jwt from 'jsonwebtoken';

// Inline JWT helper
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'development') {
      return 'development-fallback-secret-min-32-chars-long-for-testing';
    }
    throw new Error('JWT_SECRET not configured');
  }
  return secret;
}

// Verify token and get user
const verifyToken = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, getJWTSecret()) as any;
    return decoded;
  } catch (error: any) {
    console.error('Token verification error:', error);
    throw new Error('Invalid or expired token');
  }
};

// Initialize Pusher
const getPusherClient = () => {
  const appId = process.env.VITE_PUSHER_APP_ID || process.env.PUSHER_APP_ID;
  const key = process.env.VITE_PUSHER_KEY || process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.VITE_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    throw new Error('Pusher credentials not configured');
  }

  return new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = verifyToken(req);
    
    const { userId, notification } = req.body;

    if (!userId || !notification) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: userId and notification' 
      });
    }

    // Initialize Pusher
    const pusher = getPusherClient();

    // Send notification to user's channel
    await pusher.trigger(`user-${userId}`, 'new-notification', {
      id: notification.id || `notif-${Date.now()}`,
      type: notification.type || 'system',
      title: notification.title,
      message: notification.message,
      data: notification.data || {},
      read: false,
      created_at: new Date().toISOString(),
      user_id: userId
    });

    console.log(`[Pusher] Notification sent to user-${userId}`);

    return res.status(200).json({ 
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error: any) {
    console.error('Notification send error:', error);
    
    if (error.message.includes('token')) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized'
      });
    }

    if (error.message.includes('Pusher')) {
      return res.status(500).json({ 
        success: false,
        message: 'Pusher not configured. Please set PUSHER_* environment variables.'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
