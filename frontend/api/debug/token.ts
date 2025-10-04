import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ 
        error: 'No token provided',
        authHeader: authHeader || 'missing'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      
      return res.status(200).json({
        success: true,
        decoded: decoded,
        tokenPreview: token.substring(0, 20) + '...',
        checks: {
          hasRole: !!decoded.role,
          roleValue: decoded.role,
          isAdmin: decoded.role === 'admin',
          hasUserId: !!decoded.userId,
          userIdValue: decoded.userId
        }
      });
    } catch (error: any) {
      return res.status(200).json({
        error: 'Token verification failed',
        message: error.message,
        tokenPreview: token.substring(0, 20) + '...'
      });
    }
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message 
    });
  }
}
