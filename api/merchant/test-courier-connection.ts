/**
 * TEST COURIER API CONNECTION
 * Vercel Serverless Function
 * Tests if courier API credentials are valid
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Decrypt sensitive data
 */
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Get user from JWT token
 */
async function getUserFromToken(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * Test DPD API connection
 */
async function testDPD(apiKey: string, baseUrl: string): Promise<any> {
  try {
    const response = await axios.get(`${baseUrl}/v1/status`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 5000
    });
    return { success: true, message: 'DPD API connection successful', status: response.status };
  } catch (error: any) {
    return { success: false, message: error.message, status: error.response?.status };
  }
}

/**
 * Test PostNord API connection
 */
async function testPostNord(apiKey: string, baseUrl: string): Promise<any> {
  try {
    const response = await axios.get(`${baseUrl}/v1/servicepoints`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      params: { countryCode: 'NO', postalCode: '0001', numberOfServicePoints: 1 },
      timeout: 5000
    });
    return { success: true, message: 'PostNord API connection successful', status: response.status };
  } catch (error: any) {
    return { success: false, message: error.message, status: error.response?.status };
  }
}

/**
 * Test Bring API connection
 */
async function testBring(apiKey: string, baseUrl: string): Promise<any> {
  try {
    const response = await axios.get(`${baseUrl}/pickuppoint/api/pickuppoint/NO/postalCode/0001.json`, {
      headers: {
        'X-Mybring-API-Key': apiKey,
        'X-Bring-Client-URL': 'https://performile.com'
      },
      timeout: 5000
    });
    return { success: true, message: 'Bring API connection successful', status: response.status };
  } catch (error: any) {
    return { success: false, message: error.message, status: error.response?.status };
  }
}

/**
 * Generic API test (for other couriers)
 */
async function testGeneric(apiKey: string, baseUrl: string): Promise<any> {
  if (!baseUrl) {
    return { success: false, message: 'Base URL not configured' };
  }

  try {
    const response = await axios.get(baseUrl, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 5000
    });
    return { success: true, message: 'API connection successful', status: response.status };
  } catch (error: any) {
    return { success: false, message: error.message, status: error.response?.status };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Only POST method allowed
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user ID from token
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { credential_id } = req.body;

    if (!credential_id) {
      return res.status(400).json({ error: 'credential_id is required' });
    }

    // Get credentials from database
    const { data: credential, error } = await supabase
      .from('courier_api_credentials')
      .select('*')
      .eq('credential_id', credential_id)
      .single();

    if (error || !credential) {
      return res.status(404).json({ error: 'Credentials not found' });
    }

    // Decrypt API key
    const apiKey = credential.api_key ? decrypt(credential.api_key) : null;
    const baseUrl = credential.base_url || '';

    if (!apiKey) {
      return res.status(400).json({ error: 'API key not configured' });
    }

    // Test connection based on courier
    let testResult;
    const courierName = credential.courier_name.toLowerCase();

    if (courierName.includes('dpd')) {
      testResult = await testDPD(apiKey, baseUrl);
    } else if (courierName.includes('postnord')) {
      testResult = await testPostNord(apiKey, baseUrl);
    } else if (courierName.includes('bring') || courierName.includes('posten')) {
      testResult = await testBring(apiKey, baseUrl);
    } else {
      testResult = await testGeneric(apiKey, baseUrl);
    }

    // Update last_used timestamp
    await supabase
      .from('courier_api_credentials')
      .update({ last_used: new Date().toISOString() })
      .eq('credential_id', credential_id);

    return res.status(200).json({
      success: testResult.success,
      courier: credential.courier_name,
      message: testResult.message,
      status: testResult.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error testing courier connection:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
