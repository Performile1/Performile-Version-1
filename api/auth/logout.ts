import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../../backend/src/controllers/authController';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authController = new AuthController();
    const mockReq = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url,
      user: req.body.user // Pass user from token verification
    };
    
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => res.status(code).json(data)
      }),
      json: (data: any) => res.json(data)
    };

    await authController.logout(mockReq as any, mockRes as any);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
