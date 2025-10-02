import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RatingController } from '../../backend/src/controllers/ratingController';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const ratingController = new RatingController();
    const mockReq = {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    };
    
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => res.status(code).json(data)
      }),
      json: (data: any) => res.json(data)
    };

    await ratingController.submitRating(mockReq as any, mockRes as any);
  } catch (error) {
    console.error('Rating submit error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
