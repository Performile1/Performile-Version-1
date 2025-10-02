import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CourierController } from '../../backend/src/controllers/courierController';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const courierController = new CourierController();
    const mockReq = {
      body: req.body,
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url,
      params: {},
      user: req.body.user
    };
    
    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => res.status(code).json(data)
      }),
      json: (data: any) => res.json(data)
    };

    switch (req.method) {
      case 'GET':
        await courierController.getCouriers(mockReq as any, mockRes as any);
        break;
      case 'POST':
        await courierController.createCourier(mockReq as any, mockRes as any);
        break;
      default:
        res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Courier API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
