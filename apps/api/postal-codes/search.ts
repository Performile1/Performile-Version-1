import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Search postal codes (autocomplete)
 * GET /api/postal-codes/search?q=1112&country=SE&limit=10
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, country = 'SE', limit = '10' } = req.query;

    // Validate query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    // Sanitize inputs
    const searchQuery = q.replace(/[^0-9]/g, '');
    const searchCountry = typeof country === 'string' ? country.toUpperCase() : 'SE';
    const searchLimit = Math.min(parseInt(limit as string, 10) || 10, 50);

    if (searchQuery.length < 2) {
      return res.status(200).json({
        results: [],
        count: 0,
        message: 'Query too short (minimum 2 characters)'
      });
    }

    // Search in database
    const { data, error } = await supabase
      .from('postal_codes')
      .select('postal_code, city, region, country')
      .eq('country', searchCountry)
      .ilike('postal_code', `${searchQuery}%`)
      .order('postal_code', { ascending: true })
      .limit(searchLimit);

    if (error) {
      console.error('Search error:', error);
      return res.status(500).json({ error: 'Search failed' });
    }

    return res.status(200).json({
      results: data || [],
      count: data?.length || 0,
      query: searchQuery,
      country: searchCountry
    });

  } catch (error) {
    console.error('Postal code search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
