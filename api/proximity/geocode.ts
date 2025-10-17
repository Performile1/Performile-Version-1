import type { VercelRequest, VercelResponse } from '@vercel/node';
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

// Verify token
const verifyUser = (req: VercelRequest): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, getJWTSecret()) as any;
  
  return decoded;
};

// Geocode using OpenCage (free tier: 2500 requests/day)
async function geocodeWithOpenCage(address: string): Promise<any> {
  const apiKey = process.env.OPENCAGE_API_KEY;
  if (!apiKey) {
    throw new Error('OPENCAGE_API_KEY not configured');
  }

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}&limit=1`;
  
  const response = await fetch(url);
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    const result = data.results[0];
    return {
      latitude: result.geometry.lat,
      longitude: result.geometry.lng,
      formatted_address: result.formatted,
      city: result.components.city || result.components.town || result.components.village,
      country: result.components.country,
      postal_code: result.components.postcode,
      confidence: result.confidence
    };
  }

  return null;
}

// Geocode using Nominatim (free, no API key required, rate limited)
async function geocodeWithNominatim(address: string): Promise<any> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Performile-Platform/1.0'
    }
  });
  
  const data = await response.json();

  if (data && data.length > 0) {
    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      city: result.address?.city || result.address?.town || result.address?.village,
      country: result.address?.country,
      postal_code: result.address?.postcode,
      confidence: result.importance
    };
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    verifyUser(req);
    
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'address is required'
      });
    }

    let result = null;

    // Try OpenCage first if API key is available
    if (process.env.OPENCAGE_API_KEY) {
      try {
        result = await geocodeWithOpenCage(address);
      } catch (error) {
        console.error('OpenCage geocoding failed:', error);
      }
    }

    // Fallback to Nominatim
    if (!result) {
      try {
        result = await geocodeWithNominatim(address);
      } catch (error) {
        console.error('Nominatim geocoding failed:', error);
      }
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Could not geocode address'
      });
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Geocoding API error:', error);
    return res.status(error.message.includes('token') ? 401 : 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}
