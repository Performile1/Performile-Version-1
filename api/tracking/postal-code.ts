import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import { PostNordCourier } from '../lib/couriers/PostNordCourier';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request, res: Response) {
  // Allow GET and POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const postalCode = req.method === 'GET' ? req.query.postalCode : req.body.postalCode;
    const countryCode = req.method === 'GET' ? req.query.countryCode : req.body.countryCode;

    if (!postalCode) {
      return res.status(400).json({ error: 'postalCode is required' });
    }

    // Get PostNord courier ID
    const { data: courier } = await supabase
      .from('couriers')
      .select('courier_id')
      .eq('courier_code', 'POSTNORD')
      .single();

    if (!courier) {
      return res.status(404).json({ error: 'PostNord courier not found' });
    }

    // Get API key
    const apiKey = process.env.POSTNORD_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'PostNord API key not configured' });
    }

    // Search postal code
    const postnord = new PostNordCourier(apiKey, courier.courier_id);
    const result = await postnord.searchPostalCode(
      postalCode as string,
      (countryCode as string) || 'SE'
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Postal code search error:', error);
    
    // Handle rate limit error
    if (error.message.includes('429') || error.message.includes('limit')) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'PostNord API rate limit reached. Please try again later.',
        retryAfter: 3600 // 1 hour in seconds
      });
    }

    return res.status(500).json({
      error: 'Failed to search postal code',
      message: error.message
    });
  }
}
