import type { VercelRequest, VercelResponse } from '@vercel/node';
import loginHandler from './auth/login';
import registerHandler from './auth/register';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract action from body
  const { action } = req.body || {};

  // Route to appropriate handler based on action
  switch (action) {
    case 'login':
      return loginHandler(req, res);
    
    case 'register':
      return registerHandler(req, res);
    
    default:
      return res.status(400).json({ 
        message: 'Invalid action. Supported actions: login, register' 
      });
  }
}
