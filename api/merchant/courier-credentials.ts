/**
 * MERCHANT COURIER CREDENTIALS API
 * Vercel Serverless Function
 * Endpoints: GET, POST, PUT, DELETE courier credentials
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Encryption key for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Get user ID from token
    const userId = await getUserFromToken(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;
    const { id } = req.query;

    // GET - List all credentials
    if (method === 'GET' && !id) {
      const { data, error } = await supabase
        .from('courier_api_credentials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching credentials:', error);
        return res.status(500).json({ error: 'Failed to fetch credentials' });
      }

      // Mask sensitive data
      const maskedData = data.map((cred: any) => ({
        ...cred,
        api_key: cred.api_key ? '***' : null,
        api_secret: cred.api_secret ? '***' : null,
        client_id: cred.client_id ? '***' : null,
        client_secret: cred.client_secret ? '***' : null,
        access_token: cred.access_token ? '***' : null,
        refresh_token: cred.refresh_token ? '***' : null,
      }));

      return res.status(200).json({ success: true, data: maskedData });
    }

    // POST - Create new credentials
    if (method === 'POST') {
      const {
        courier_name,
        api_key,
        api_secret,
        client_id,
        client_secret,
        base_url,
        api_version,
        rate_limit_per_minute
      } = req.body;

      if (!courier_name) {
        return res.status(400).json({ error: 'courier_name is required' });
      }

      // Encrypt sensitive data
      const encryptedData = {
        api_key: api_key ? encrypt(api_key) : null,
        api_secret: api_secret ? encrypt(api_secret) : null,
        client_id: client_id ? encrypt(client_id) : null,
        client_secret: client_secret ? encrypt(client_secret) : null,
      };

      const { data, error } = await supabase
        .from('courier_api_credentials')
        .insert({
          courier_name,
          ...encryptedData,
          base_url,
          api_version,
          rate_limit_per_minute: rate_limit_per_minute || 60,
          is_active: true,
          total_requests: 0,
          failed_requests: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating credentials:', error);
        return res.status(500).json({ error: 'Failed to create credentials' });
      }

      // Return without sensitive data
      const response = {
        ...data,
        api_key: api_key ? '***' : null,
        api_secret: api_secret ? '***' : null,
        client_id: client_id ? '***' : null,
        client_secret: client_secret ? '***' : null,
      };

      return res.status(201).json({ success: true, data: response });
    }

    // PUT - Update credentials
    if (method === 'PUT' && id) {
      const {
        api_key,
        api_secret,
        client_id,
        client_secret,
        base_url,
        api_version,
        rate_limit_per_minute,
        is_active
      } = req.body;

      // Build update object
      const updates: any = {};
      if (api_key) updates.api_key = encrypt(api_key);
      if (api_secret) updates.api_secret = encrypt(api_secret);
      if (client_id) updates.client_id = encrypt(client_id);
      if (client_secret) updates.client_secret = encrypt(client_secret);
      if (base_url) updates.base_url = base_url;
      if (api_version) updates.api_version = api_version;
      if (rate_limit_per_minute) updates.rate_limit_per_minute = rate_limit_per_minute;
      if (typeof is_active === 'boolean') updates.is_active = is_active;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('courier_api_credentials')
        .update(updates)
        .eq('credential_id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating credentials:', error);
        return res.status(500).json({ error: 'Failed to update credentials' });
      }

      // Mask sensitive data
      const response = {
        ...data,
        api_key: data.api_key ? '***' : null,
        api_secret: data.api_secret ? '***' : null,
        client_id: data.client_id ? '***' : null,
        client_secret: data.client_secret ? '***' : null,
      };

      return res.status(200).json({ success: true, data: response });
    }

    // DELETE - Remove credentials
    if (method === 'DELETE' && id) {
      const { error } = await supabase
        .from('courier_api_credentials')
        .delete()
        .eq('credential_id', id);

      if (error) {
        console.error('Error deleting credentials:', error);
        return res.status(500).json({ error: 'Failed to delete credentials' });
      }

      return res.status(200).json({ success: true, message: 'Credentials deleted' });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in courier-credentials API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
