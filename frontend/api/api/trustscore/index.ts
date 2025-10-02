import type { VercelRequest, VercelResponse } from '@vercel/node';
import { TrustScoreController } from '../../backend/src/controllers/trustScoreController';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const trustScoreController = new TrustScoreController();
    const mockReq = {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url,
      user: req.body.user
    };
    
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => res.status(code).json(data)
      }),
      json: (data: any) => res.json(data)
    };

    await trustScoreController.getCourierTrustScores(mockReq as any, mockRes as any);
  } catch (error) {
    console.error('TrustScore API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
