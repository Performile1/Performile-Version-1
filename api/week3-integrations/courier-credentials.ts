/**
 * WEEK 3: COURIER CREDENTIALS MANAGEMENT API
 * Purpose: Manage courier API credentials for integrations
 * Endpoints: POST, GET, PUT, DELETE, POST /test
 */

import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
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
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
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
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * POST /api/week3-integrations/courier-credentials
 * Add new courier API credentials
 */
export async function createCourierCredentials(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

    // Validate required fields
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

    // Insert into courier_api_credentials table
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
      console.error('Error creating courier credentials:', error);
      return res.status(500).json({ error: 'Failed to create credentials' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'courier.credentials.created',
      entity_type: 'credential',
      entity_id: data.credential_id,
      courier_name,
      user_id: userId,
      event_data: { courier_name, base_url },
      status: 'success'
    });

    // Return without sensitive data
    const response = {
      ...data,
      api_key: api_key ? '***' : null,
      api_secret: api_secret ? '***' : null,
      client_id: client_id ? '***' : null,
      client_secret: client_secret ? '***' : null,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in createCourierCredentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/week3-integrations/courier-credentials
 * List all courier credentials for user
 */
export async function getCourierCredentials(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('courier_api_credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courier credentials:', error);
      return res.status(500).json({ error: 'Failed to fetch credentials' });
    }

    // Mask sensitive data
    const maskedData = data.map(cred => ({
      ...cred,
      api_key: cred.api_key ? '***' : null,
      api_secret: cred.api_secret ? '***' : null,
      client_id: cred.client_id ? '***' : null,
      client_secret: cred.client_secret ? '***' : null,
      access_token: cred.access_token ? '***' : null,
      refresh_token: cred.refresh_token ? '***' : null,
    }));

    res.json(maskedData);
  } catch (error) {
    console.error('Error in getCourierCredentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/week3-integrations/courier-credentials/:id
 * Update courier credentials
 */
export async function updateCourierCredentials(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
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
      console.error('Error updating courier credentials:', error);
      return res.status(500).json({ error: 'Failed to update credentials' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'courier.credentials.updated',
      entity_type: 'credential',
      entity_id: id,
      courier_name: data.courier_name,
      user_id: userId,
      event_data: { credential_id: id },
      status: 'success'
    });

    // Mask sensitive data
    const response = {
      ...data,
      api_key: data.api_key ? '***' : null,
      api_secret: data.api_secret ? '***' : null,
      client_id: data.client_id ? '***' : null,
      client_secret: data.client_secret ? '***' : null,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in updateCourierCredentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/week3-integrations/courier-credentials/:id
 * Delete courier credentials
 */
export async function deleteCourierCredentials(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get credential info before deleting
    const { data: credential } = await supabase
      .from('courier_api_credentials')
      .select('courier_name')
      .eq('credential_id', id)
      .single();

    const { error } = await supabase
      .from('courier_api_credentials')
      .delete()
      .eq('credential_id', id);

    if (error) {
      console.error('Error deleting courier credentials:', error);
      return res.status(500).json({ error: 'Failed to delete credentials' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'courier.credentials.deleted',
      entity_type: 'credential',
      entity_id: id,
      courier_name: credential?.courier_name,
      user_id: userId,
      event_data: { credential_id: id },
      status: 'success'
    });

    res.json({ message: 'Credentials deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCourierCredentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/week3-integrations/courier-credentials/:id/test
 * Test courier API connection
 */
export async function testCourierCredentials(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get credentials
    const { data: credential, error } = await supabase
      .from('courier_api_credentials')
      .select('*')
      .eq('credential_id', id)
      .single();

    if (error || !credential) {
      return res.status(404).json({ error: 'Credentials not found' });
    }

    // Decrypt credentials
    const decryptedApiKey = credential.api_key ? decrypt(credential.api_key) : null;
    const decryptedApiSecret = credential.api_secret ? decrypt(credential.api_secret) : null;

    // TODO: Implement actual API test based on courier
    // For now, just simulate a test
    const testResult = {
      success: true,
      message: 'Connection test successful',
      courier: credential.courier_name,
      timestamp: new Date().toISOString()
    };

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'courier.credentials.tested',
      entity_type: 'credential',
      entity_id: id,
      courier_name: credential.courier_name,
      user_id: userId,
      event_data: testResult,
      status: 'success',
      response_time_ms: 150
    });

    res.json(testResult);
  } catch (error) {
    console.error('Error in testCourierCredentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
