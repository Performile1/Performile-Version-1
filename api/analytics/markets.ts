import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AnalyticsController } from '../../backend/src/controllers/analyticsController';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const analyticsController = new AnalyticsController();
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

    await analyticsController.getAvailableMarkets(mockReq as any, mockRes as any);
  } catch (error) {
    console.error('Analytics markets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
