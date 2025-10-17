/**
 * WEEK 3: API KEYS MANAGEMENT API
 * Purpose: Generate and manage API keys for external access to Performile
 * Endpoints: POST, GET, PUT, DELETE api-keys
 */

import { createClient } from '@supabase/supabase-js';
import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Generate API key
 */
function generateApiKey(prefix: string = 'pk_live'): { key: string; prefix: string } {
  const randomPart = crypto.randomBytes(32).toString('hex');
  const key = `${prefix}_${randomPart}`;
  return {
    key,
    prefix: key.substring(0, 10) // First 10 chars for display
  };
}

/**
 * POST /api/week3-integrations/api-keys
 * Generate new API key
 */
export async function createApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      key_name,
      store_id,
      permissions,
      rate_limit_per_hour,
      expires_at
    } = req.body;

    // Validate required fields
    if (!key_name) {
      return res.status(400).json({ error: 'key_name is required' });
    }

    // Generate API key
    const { key, prefix } = generateApiKey();

    // Hash the API key
    const hashedKey = await bcrypt.hash(key, 10);

    // Insert API key
    const { data, error } = await supabase
      .from('week3_api_keys')
      .insert({
        user_id: userId,
        store_id,
        key_name,
        api_key: hashedKey,
        api_key_prefix: prefix,
        permissions: permissions || {},
        rate_limit_per_hour: rate_limit_per_hour || 1000,
        is_active: true,
        total_requests: 0,
        expires_at
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ error: 'Failed to create API key' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'api_key.created',
      entity_type: 'api_key',
      entity_id: data.api_key_id,
      user_id: userId,
      store_id,
      event_data: { key_name, prefix },
      status: 'success'
    });

    // Return the plain key ONLY ONCE
    res.status(201).json({
      ...data,
      api_key: key, // Show full key only on creation
      message: 'Save this key securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Error in createApiKey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/week3-integrations/api-keys
 * List all API keys for user
 */
export async function getApiKeys(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { store_id } = req.query;

    let query = supabase
      .from('week3_api_keys')
      .select('*')
      .eq('user_id', userId);

    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    // Never return the hashed key
    const maskedData = data.map((key: any) => ({
      ...key,
      api_key: undefined // Remove hashed key from response
    }));

    res.json(maskedData);
  } catch (error) {
    console.error('Error in getApiKeys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PUT /api/week3-integrations/api-keys/:id
 * Update API key (permissions, rate limit, active status)
 */
export async function updateApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const {
      key_name,
      permissions,
      rate_limit_per_hour,
      is_active,
      expires_at
    } = req.body;

    // Build update object
    const updates: any = { updated_at: new Date().toISOString() };
    if (key_name) updates.key_name = key_name;
    if (permissions) updates.permissions = permissions;
    if (rate_limit_per_hour) updates.rate_limit_per_hour = rate_limit_per_hour;
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (expires_at) updates.expires_at = expires_at;

    const { data, error } = await supabase
      .from('week3_api_keys')
      .update(updates)
      .eq('api_key_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating API key:', error);
      return res.status(500).json({ error: 'Failed to update API key' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'api_key.updated',
      entity_type: 'api_key',
      entity_id: id,
      user_id: userId,
      event_data: { api_key_id: id, updates },
      status: 'success'
    });

    // Remove hashed key from response
    const response = { ...data, api_key: undefined };
    res.json(response);
  } catch (error) {
    console.error('Error in updateApiKey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/week3-integrations/api-keys/:id
 * Revoke API key
 */
export async function deleteApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('week3_api_keys')
      .delete()
      .eq('api_key_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting API key:', error);
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'api_key.revoked',
      entity_type: 'api_key',
      entity_id: id,
      user_id: userId,
      event_data: { api_key_id: id },
      status: 'success'
    });

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Error in deleteApiKey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/week3-integrations/api-keys/:id/regenerate
 * Regenerate API key (creates new key, invalidates old one)
 */
export async function regenerateApiKey(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get existing key info
    const { data: existingKey, error: fetchError } = await supabase
      .from('week3_api_keys')
      .select('*')
      .eq('api_key_id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Generate new API key
    const { key, prefix } = generateApiKey();
    const hashedKey = await bcrypt.hash(key, 10);

    // Update with new key
    const { data, error } = await supabase
      .from('week3_api_keys')
      .update({
        api_key: hashedKey,
        api_key_prefix: prefix,
        updated_at: new Date().toISOString()
      })
      .eq('api_key_id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error regenerating API key:', error);
      return res.status(500).json({ error: 'Failed to regenerate API key' });
    }

    // Log event
    await supabase.from('week3_integration_events').insert({
      event_type: 'api_key.regenerated',
      entity_type: 'api_key',
      entity_id: id,
      user_id: userId,
      event_data: { api_key_id: id, new_prefix: prefix },
      status: 'success'
    });

    // Return the new plain key ONLY ONCE
    res.json({
      ...data,
      api_key: key, // Show full key only once
      message: 'Save this key securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Error in regenerateApiKey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware: Authenticate API key
 * Use this to protect external API endpoints
 */
export async function authenticateApiKey(req: Request, res: Response, next: any) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    // Get all active API keys
    const { data: keys, error } = await supabase
      .from('week3_api_keys')
      .select('*')
      .eq('is_active', true);

    if (error || !keys) {
      return res.status(500).json({ error: 'Failed to authenticate' });
    }

    // Find matching key
    let matchedKey = null;
    for (const key of keys) {
      const isMatch = await bcrypt.compare(apiKey, key.api_key);
      if (isMatch) {
        matchedKey = key;
        break;
      }
    }

    if (!matchedKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check expiration
    if (matchedKey.expires_at && new Date(matchedKey.expires_at) < new Date()) {
      return res.status(401).json({ error: 'API key expired' });
    }

    // Update usage stats
    await supabase
      .from('week3_api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        total_requests: matchedKey.total_requests + 1
      })
      .eq('api_key_id', matchedKey.api_key_id);

    // Attach key info to request
    req.apiKey = matchedKey;
    req.user = { id: matchedKey.user_id };

    next();
  } catch (error) {
    console.error('Error in authenticateApiKey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
